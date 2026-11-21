// Emissive pixels are taken from the animated metal itself, so poses and flips match.
export function gearEmissionActive(u){
 if(u.hp<=0)return false;
 return u.classId==='berserker'?!!u.buffs?.some(b=>b.time>0&&b.haste>0&&b.lifesteal>0):['guardian','duelist'].includes(u.classId)&&(u.level||1)>=16;
}
function nearLine(x,y,a,b,width){const dx=b[0]-a[0],dy=b[1]-a[1],k=((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy);return k>=0&&k<=1&&Math.abs((x-a[0])*dy-(y-a[1])*dx)/Math.hypot(dx,dy)<width;}
export function gearEmissionMask(id,frame,x,y,r,g,b){
 const grey=Math.max(r,g,b)-Math.min(r,g,b)<48&&Math.max(r,g,b)>95;
 if(id==='guardian')return y>.12&&y<.93&&((r>120&&g>105&&b>75)||b>150&&g>140);
 if(!grey)return false;
 const row=Math.floor(frame/6),f=frame%6;
 if(id==='berserker'){
  const c=row===2?(f===1?[.18,.44]:f===2?[.16,.18]:f===3?[.21,.16]:f>=4?[.81,.77]:[.8,.45]):row===3?(f===2?[.17,.18]:f===3?[.18,.14]:[.81,.75]):row===1?[.81,.3]:[.81,.43];
  return ((x-c[0])/.24)**2+((y-c[1])/.23)**2<1;
 }
 if(id==='duelist'){
  if(row===2&&f===1)return nearLine(x,y,[.62,.48],[.65,.08],.05);
  if(row===2&&f===2)return nearLine(x,y,[.64,.18],[.10,.04],.05);
  if(row===2&&f===3)return nearLine(x,y,[.82,.61],[.7,.23],.05);
  if(row===5&&f>=1&&f<=3)return y<.6&&(x<.4||x>.66);
  return nearLine(x,y,[.39,.65],[.97,.79],.05)||(row>=3&&nearLine(x,y,[.29,.66],[.02,.94],.05));
 }
 return false;
}
function textureFor(scene,sprite,id){
 const key='gear-emission:'+id+':'+sprite.texture.key;if(scene.textures.exists(key)){const tx=scene.textures.get(key);if(!tx.has(0)){const im=tx.getSourceImage();for(let n=0;n<36;n++){const x=Math.round(n%6*im.width/6),y=Math.round(Math.floor(n/6)*im.height/6);tx.add(n,0,x,y,Math.round((n%6+1)*im.width/6)-x,Math.round((Math.floor(n/6)+1)*im.height/6)-y);}}return key;}
 if(typeof document==='undefined'||!scene.textures.addCanvas)return null;
 const source=sprite.texture.getSourceImage(),canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),d=pixels.data;
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
  const col=Math.min(5,Math.floor(x*6/canvas.width)),row=Math.min(5,Math.floor(y*6/canvas.height)),x0=Math.round(col*canvas.width/6),y0=Math.round(row*canvas.height/6),w=Math.round((col+1)*canvas.width/6)-x0,h=Math.round((row+1)*canvas.height/6)-y0,i=(y*canvas.width+x)*4;
  if(d[i+3]<60||!gearEmissionMask(id,row*6+col,(x-x0)/w,(y-y0)/h,d[i],d[i+1],d[i+2])){d[i+3]=0;continue;}
  const light=(d[i]+d[i+1]+d[i+2])/3;d[i]=255;d[i+1]=id==='berserker'?65+light*.45:200+light*.2;d[i+2]=id==='berserker'?25:100+light*.4;d[i+3]=Math.round(d[i+3]*(id==='guardian'?.45:.8));
 }
 ctx.putImageData(pixels,0,0);const tx=scene.textures.addCanvas(key,canvas);
 for(let n=0;n<36;n++){const x=Math.round(n%6*canvas.width/6),y=Math.round(Math.floor(n/6)*canvas.height/6);tx.add(n,0,x,y,Math.round((n%6+1)*canvas.width/6)-x,Math.round((Math.floor(n/6)+1)*canvas.height/6)-y);}
 return key;
}
export function updateGearEmission(scene,u,obj,time){
 if(!gearEmissionActive(u)||!obj.sprite.texture){obj.gearEmission?.setVisible(false);return;}
 const s=obj.sprite,key=textureFor(scene,s,u.classId);if(!key)return;
 if(!obj.gearEmission){obj.gearEmission=scene.add.image(s.x,s.y,key,s.frame.name).setBlendMode('ADD');const image=obj.gearEmission;s.once('destroy',()=>image.destroy());}
 obj.gearEmission.setVisible(true).setTexture(key,s.frame.name).setPosition(s.x,s.y).setOrigin(s.originX,s.originY).setScale(s.scaleX,s.scaleY).setFlipX(s.flipX).setFlipY(s.flipY).setRotation(s.rotation).setDepth(s.depth+.2).setAlpha(.68+Math.sin(time/180)*.12);
}
