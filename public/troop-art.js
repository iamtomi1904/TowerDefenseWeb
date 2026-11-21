import {registerActorBody} from './actor-body-registration.js';
import {cleanEffectTexture} from './effect-alpha.js';
import {TROOP_LAYOUT,TROOP_ART_READY} from './troop-layout.js';
export const TROOP_ART={
 'soldier-1':{name:'Bộ binh',height:1},'soldier-2':{name:'Thương binh',height:1},
 'soldier-3':{name:'Xạ thủ',height:1},'soldier-4':{name:'Pháp binh',height:1},
 'soldier-5':{name:'Trinh sát',height:1},'soldier-6':{name:'Lính khiên',height:1},
 'soldier-7':{name:'Quân y',height:1},'soldier-8':{name:'Đội trưởng',height:1},
 'soldier-9':{name:'Cận vệ',height:1}
};
export const TROOP_ACTIONS=['idle','walk','attack','cast','hurt','dead'];
export const troopArtwork=id=>TROOP_ART_READY&&TROOP_ART[id]?'/assets/troops-v2/'+id+'.png':null;
export function preloadTroopArt(s){if(TROOP_ART_READY)for(const id of Object.keys(TROOP_ART))s.load.image('troop-v2:'+id,troopArtwork(id));}
export function createTroopAnimations(s){
 if(!TROOP_ART_READY)return;
 for(const id of Object.keys(TROOP_ART)){
  const key=cleanEffectTexture(s,'troop-v2:'+id,{columns:6,rows:6,matteFloor:16,maxSize:1024}),tx=s.textures.get(key),im=tx.getSourceImage();
  for(let n=0;n<36;n++){const x=Math.round(n%6*im.width/6),y=Math.round(Math.floor(n/6)*im.height/6);if(!tx.has?.(n))tx.add(n,0,x,y,Math.round((n%6+1)*im.width/6)-x,Math.round((Math.floor(n/6)+1)*im.height/6)-y);}
  for(const [row,action]of TROOP_ACTIONS.entries())s.anims.create({key:'troop-v2:'+id+':'+action,frames:Array.from({length:6},(_,i)=>({key,frame:row*6+i})),frameRate:action==='attack'?12:8,repeat:['idle','walk'].includes(action)?-1:0});
 }
}
export function playTroopActor(s,u,obj,requested){
 if(!TROOP_ART_READY)return false;
 const id=u.hero?null:u.sprite,art=TROOP_ART[id];if(!art)return false;
 const action=u.hp<=0?'dead':TROOP_ACTIONS.includes(requested)?requested:'idle',sprite=obj.sprite,key='troop-v2:'+id+':'+action;
 // The cleaned atlas can be resized; use its actual frame height for body scale.
 const tx=cleanEffectTexture(s,'troop-v2:'+id,{columns:6,rows:6,matteFloor:16,maxSize:1024}),image=s.textures.get(tx).getSourceImage();
 const layout=TROOP_LAYOUT[id];
 sprite.setOrigin(layout.originX,layout.originY).setScale(obj.size*1.1*layout.originalRatio/(image.height/6*layout.bodyRatio));
 if(obj.attackRestart&&action==='attack'){sprite.play(key,false);obj.attackRestart=false;}
 else if(['idle','walk'].includes(action)||sprite.anims.currentAnim?.key!==key)sprite.play(key,true);
 registerActorBody(s,u,obj);
 sprite.anims.timeScale=action==='attack'?6/Math.max(.12,(obj.attackDuration||500)/1000)/12:action==='walk'?1.15:1;
 return true;
}
