import {playPassiveAction} from './passive-action-art.js';
import {KNIGHT_LAYOUT} from './knight-frame-layout.js';
export const KNIGHT_ACTIONS=['idle','walk','attack','cast','hurt','dead'];
export const KNIGHT_ATLASES={'holy-paladin':'holy-foot','holy-mounted':'holy-mounted','fallen-knight':'dark-foot','fallen-mounted':'dark-mounted'};
export function knightForm(u){return u.hero==='knight-2'?(u.holyMounted?'holy-mounted':'holy-foot'):u.hero==='knight-3'?(u.fallenMounted?'dark-mounted':'dark-foot'):null;}
export function preloadKnightRefresh(s){for(const id of Object.values(KNIGHT_ATLASES))s.load.image('knight-v2:'+id,'/assets/knights-v2/'+id+'.png');}
export function createKnightRefresh(s){
 for(const id of Object.values(KNIGHT_ATLASES)){
  const key='knight-v2:'+id,tx=s.textures.get(key),image=tx.getSourceImage(),w=image.width/6,h=image.height/6;
  for(let i=0;i<36;i++){const x=Math.round(i%6*w),y=Math.round(Math.floor(i/6)*h);tx.add(i,0,x,y,Math.round((i%6+1)*w)-x,Math.round((Math.floor(i/6)+1)*h)-y);}
  for(const [row,action]of KNIGHT_ACTIONS.entries())s.anims.create({key:key+':'+action,frames:Array.from({length:6},(_,i)=>({key,frame:row*6+i})),frameRate:action==='attack'?12:8,repeat:['idle','walk'].includes(action)?-1:0});
 }
}
export function playKnightRefresh(s,u,obj,requested){
 if(playPassiveAction(s,u,obj,requested))return true;
 const form=knightForm(u);if(!form)return false;
 const action=u.hp<=0?'dead':u.castAnim>0&&requested==='attack'?(u.hero==='knight-2'&&u.holyQStep===1?'attack':'cast'):requested;if(!KNIGHT_ACTIONS.includes(action))return false;
 const key='knight-v2:'+form+':'+action,sprite=obj.sprite,image=s.textures.get('knight-v2:'+form).getSourceImage();
 const layout=KNIGHT_LAYOUT[form];
 sprite.setScale(obj.size/(image.height/6*(layout?.bodyRatio||.8)));
 if(obj.knightForm!==form){obj.knightForm=form;obj.knightCastCount=null;}
 const restart=action==='attack'&&obj.attackRestart||action==='cast'&&obj.knightCastCount!==u.castCount;
 if(restart){sprite.play(key,false);obj.attackRestart=false;obj.knightCastCount=u.castCount;}
 else if(['idle','walk'].includes(action)||sprite.anims.currentAnim?.key!==key)sprite.play(key,true);
 const index=Number(sprite.frame?.name),frame=Number.isFinite(index)&&index>=0&&index<36?index:KNIGHT_ACTIONS.indexOf(action)*6;
 sprite.setOrigin(.5,layout?.originY[frame]??.98);
 sprite.setAngle(u.holyLeapTime>0?u.face*-7:u.fallenFlurry?u.face*6:0);
 sprite.anims.timeScale=(['attack','cast'].includes(action)?6/Math.max(.15,(obj.attackDuration||600)/1000)/(action==='attack'?12:8)*(u.fallenFlurry?1.5:u.holyLeapTime>0?1.35:1):action==='walk'?(u.buffs?.some(b=>b.fallenQSpeed&&b.time>0)?1.75:1.25):1);
 return true;
}
