const CELL=256;
export function clearPropStream(scene){const stream=scene.propStream;if(!stream)return;for(const r of stream.active)r.obj?.destroy();for(const im of stream.free)im.destroy();scene.propStream=null;}
export function beginPropStream(scene){clearPropStream(scene);scene.propStream={grid:new Map(),active:new Set(),free:[],signature:''};if(!scene.propStreamCleanup){scene.propStreamCleanup=true;scene.events?.once('shutdown',()=>{clearPropStream(scene);scene.propStreamCleanup=false;});}}
export function registerStreamProp(scene,{x,y,key,width,height,scale,originY=.83,flip=false,amp=0,phase=0,tint=null}){
 const r={x,y,key,scale,originY,flip,amp,phase,tint,baseScaleX:scale,baseScaleY:scale,obj:null},grid=scene.propStream.grid,w=width*scale,h=height*scale;
 for(let cx=Math.floor((x-w/2)/CELL);cx<=Math.floor((x+w/2)/CELL);cx++)for(let cy=Math.floor((y-h*originY)/CELL);cy<=Math.floor((y+h*(1-originY))/CELL);cy++){const key=cx+':'+cy;let list=grid.get(key);if(!list)grid.set(key,list=[]);list.push(r);}return r;
}
export function updatePropStream(scene,views){
 const stream=scene.propStream;if(!stream)return;const cells=new Set();for(const v of views)for(let x=Math.floor((v.x-200)/CELL);x<=Math.floor((v.right+200)/CELL);x++)for(let y=Math.floor((v.y-200)/CELL);y<=Math.floor((v.bottom+200)/CELL);y++)cells.add(x+':'+y);
 const signature=[...cells].join('|');if(signature===stream.signature)return;stream.signature=signature;
 const active=new Set();for(const cell of cells)for(const r of stream.grid.get(cell)||[])active.add(r);
 for(const r of stream.active)if(!active.has(r)){const im=r.obj;r.obj=null;im.setVisible(false);scene.children?.remove(im);if(stream.free.length<128)stream.free.push(im);else im.destroy();}
 for(const r of active)if(!r.obj){let im=stream.free.pop();if(im){scene.children?.add(im);im.setTexture(r.key);im.setPosition(r.x,r.y);}else im=scene.add.image(r.x,r.y,r.key);im.clearTint?.();if(r.tint!==null)im.setTint?.(r.tint);im.setOrigin(.5,r.originY).setScale(r.scale).setFlipX(r.flip).setRotation(0).setAlpha(1).setDepth(r.y).setVisible(true);r.obj=im;}
 stream.active=active;
}
