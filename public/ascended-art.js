import {cleanEffectTexture} from './effect-alpha.js';
export const ASCENDED_IDS=['knight-1','wanderer-magican','warrior-1','warrior-2','warrior-3','goblin-assassin','samurai-archer','fire-wizard','lightning-mage','holy-foot','holy-mounted','dark-foot','dark-mounted'];
export function preloadAscended(s){for(const id of ASCENDED_IDS)s.load.image('ascended:'+id,'/assets/ascended/'+(id==='samurai-archer'?'samurai-archer-charge-v3':id)+'.png');}
export function ascendedId(u){return u.hero==='knight-2'?(u.holyMounted?'holy-mounted':'holy-foot'):u.hero==='knight-3'?(u.fallenMounted?'dark-mounted':'dark-foot'):ASCENDED_IDS.includes(u.hero)?u.hero:null;}
export function applyAscended(s,u,obj){
 const id=ascendedId(u),sprite=obj.sprite;
 if(sprite.texture?.key?.startsWith('passive-action:')||sprite.texture?.key?.startsWith('guardian-actions'))return false;
 if(!id||(u.level||1)<16){
  if(obj.ascendedBase&&sprite.texture?.key?.startsWith('ascended:')){
   const old=sprite.texture.getSourceImage(),base=s.textures.get(obj.ascendedBase).getSourceImage(),x=sprite.scaleX,y=sprite.scaleY,scaled=x===obj.ascendedScaleX&&y===obj.ascendedScaleY;
   sprite.setTexture(obj.ascendedBase,sprite.frame.name);if(scaled)sprite.setScale(x*old.height/base.height,y*old.height/base.height);
  }obj.ascendedBase=null;return false;
 }
 const raw='ascended:'+id;if(!s.textures?.exists(raw)||!sprite.texture)return false;const key=cleanEffectTexture(s,raw,{columns:6,rows:6,matteFloor:10,maxSize:1024});
 if(!sprite.texture.key.startsWith('ascended:'))obj.ascendedBase=sprite.texture.key;
 const frame=Number(sprite.frame?.name);if(!Number.isInteger(frame)||frame<0||frame>=36)return false;
 const tx=s.textures.get(key),image=tx.getSourceImage(),base=s.textures.get(obj.ascendedBase)?.getSourceImage();
 for(let i=0;i<36;i++)if(!tx.has(i)){const x=Math.round(i%6*image.width/6),y=Math.round(Math.floor(i/6)*image.height/6);tx.add(i,0,x,y,Math.round((i%6+1)*image.width/6)-x,Math.round((Math.floor(i/6)+1)*image.height/6)-y);}
 const scaleX=sprite.scaleX,scaleY=sprite.scaleY,already=sprite.texture.key===key&&obj.ascendedScaleX===scaleX&&obj.ascendedScaleY===scaleY;sprite.setTexture(key,frame);
 if(base&&!already)sprite.setScale(scaleX*base.height/image.height,scaleY*base.height/image.height);
 obj.ascendedScaleX=sprite.scaleX;obj.ascendedScaleY=sprite.scaleY;
 return true;
}
