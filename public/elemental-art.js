import {cleanEffectTexture} from './effect-alpha.js';
export const elementalTexture=s=>cleanEffectTexture(s,'elemental-refresh');
export function elementalFrame(s,row,t){
 if(!s.textures?.exists('elemental-refresh'))return null;
 const tx=s.textures.get(cleanEffectTexture(s,'elemental-refresh')),im=tx.getSourceImage(),w=im.width/6,h=im.height/6,f=Math.min(5,Math.max(0,Math.floor(t*6)%6)),name='element:'+row+':'+f;
 if(!tx.has(name)){const x=Math.round(f*w),y=Math.round(row*h);tx.add(name,0,x,y,Math.round((f+1)*w)-x,Math.round((row+1)*h)-y);}return name;
}
export function createElementalVisual(s,v){
 const e=v.e;if(!e)return null;const row=['fireburst','meteor'].includes(e.skill)?3:null;
 if(row===null)return null;const frame=elementalFrame(s,row,0);if(!frame)return null;
 return {row,image:s.add.image(e.x,e.y,cleanEffectTexture(s,'elemental-refresh'),frame).setDepth(2499)};
}
export function updateElementalVisual(s,v,t){
 const art=v.elemental;if(!art)return;const e=v.e,r=e.radius||v.radius||100,loop=['blizzard','flamefield'].includes(e.skill);
 art.image.setFrame(elementalFrame(s,art.row,loop?(v.age%1):Math.min(.99,t))).setPosition(e.x,e.y-r*.12).setDisplaySize(r*2.25,r*2.25).setAlpha(Math.min(1,(1-t)*5)*.85);
}
