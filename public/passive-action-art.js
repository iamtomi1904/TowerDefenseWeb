import {cleanEffectTexture} from './effect-alpha.js';
import {PASSIVE_ACTION_LAYOUT} from './passive-action-layout.js';
export const PASSIVE_ACTIONS=['darkelf','guardian','assassin','paladin','paladin-mounted','windblade','duelist-critical','duelist-dual','ranger','tidecaller','berserker','ravager','vanguard'];
export function preloadPassiveActions(s){for(const id of Object.keys(PASSIVE_ACTION_LAYOUT))s.load.image('passive-action:'+id,'/assets/passive-actions-v1/'+id+'.png');}
export function passiveActionFor(u,action){
 if(!u.hero||u.hp<=0||u.stun>0||u.castAnim>0||(u.martialLock>0&&u.passivePose?.kind!=='guardian'))return null;
 if(u.passivePose?.time>0&&PASSIVE_ACTIONS.includes(u.passivePose.kind))return u.passivePose.kind;
 if(action!=='attack')return null;
 if(u.hero==='knight-1'&&u.mastery>=2&&u.attackCount>0&&u.attackCount%3===0)return 'guardian';
 if(u.hero==='warrior-1'&&u.mastery>=2&&u.warStacks>=5)return 'berserker';
 if(u.hero==='warrior-2'&&u.mastery>=2&&u.hp<(u.stats?.hp||u.maxHp||1)*.15)return 'ravager';
 if(u.hero==='samurai-archer'&&u.mastery>=2&&u.focusStacks>=10)return 'ranger';
 return null;
}
export function playPassiveAction(s,u,obj,action){
 const base=passiveActionFor(u,action);if(!base)return false;const id=(u.level||1)>=16&&PASSIVE_ACTION_LAYOUT[base+'-max']?base+'-max':base;
 const l=PASSIVE_ACTION_LAYOUT[id],raw='passive-action:'+id;if(!l||!s.textures.exists(raw))return false;
 const serial=u.passivePose?.time>0?'proc:'+u.passivePose.serial:'attack:'+u.attackCount,now=s.time?.now||0;
 if(obj.passiveActionSerial!==serial||obj.passiveActionId!==id){obj.passiveActionSerial=serial;obj.passiveActionId=id;obj.passiveActionStart=now;}
 const duration=Math.max(.22,Math.min(base==='guardian'?1.75:.65,u.passivePose?.time>0?u.passivePose.duration||.55:(obj.attackDuration||500)/1000)),n=base==='guardian'?((now-obj.passiveActionStart)<1500?Math.min(2,Math.floor((now-obj.passiveActionStart)/500)):Math.min(5,3+Math.floor((now-obj.passiveActionStart-1500)/84))):Math.min(5,Math.floor((now-obj.passiveActionStart)/(duration*1000)*6));
 const key=cleanEffectTexture(s,raw,{columns:3,rows:2,matteFloor:20,maxSize:1024}),tx=s.textures.get(key),im=tx.getSourceImage(),x=Math.round(n%3*im.width/3),y=Math.round(Math.floor(n/3)*im.height/2);
 if(!tx.has(n))tx.add(n,0,x,y,Math.round((n%3+1)*im.width/3)-x,Math.round((Math.floor(n/3)+1)*im.height/2)-y);
 obj.sprite.anims.stop();obj.sprite.setAngle?.(0);obj.sprite.setTexture(key,n).setOrigin(l.originX,l.originsY[n]).setScale(obj.size*l.height/(im.height/2*l.bodyRatio)).setFlipX(u.face<0);obj.attackRestart=false;return true;
}
