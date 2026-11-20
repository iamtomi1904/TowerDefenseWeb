import {playPassiveAction} from './passive-action-art.js';
import {preloadGuardianActions,playGuardianAction} from './guardian-actions-art.js';
import {HERO_BODY_RATIO} from './hero-body-layout.js';
export const REFRESH_ACTIONS=['idle','walk','attack','cast','hurt','dead'];
export const REFRESH_HEROES={
 'warrior-3':{name:'Chiến Tướng',originY:.98,bodyRatio:.8,height:1},
 'samurai':{name:'Phong Kiếm Khách',originY:.98,bodyRatio:.8,height:1},
 'dark-elf':{name:'Dạ Tiễn',originY:.98,bodyRatio:.8,height:1},
 'goblin-assassin':{name:'Quỷ Ảnh',originY:.98,bodyRatio:.8,height:1},
 'knight-1':{name:'Thiết Vệ',originY:.98,bodyRatio:.8,height:1},
 'samurai-archer':{name:'Cung Thủ',originY:.98,bodyRatio:.8,height:1},
 'fire-wizard':{name:'Hỏa Sư',originY:.98,bodyRatio:.8,height:1},
 'lightning-mage':{name:'Lôi Sư',originY:.98,bodyRatio:.8,height:1},
 'wanderer-magican':{name:'Du Pháp',originY:.98,bodyRatio:.8,height:1},
 'warrior-1':{name:'Chiến Binh',originY:.98,bodyRatio:.8,height:1}
};
export function preloadHeroRefresh(scene){preloadGuardianActions(scene);for(const id of Object.keys(REFRESH_HEROES))scene.load.image('refresh:'+id,'/assets/heroes-v2/'+(id==='samurai-archer'?'samurai-archer-charge-v3':id)+'.png');}
export function warriorSlamFrame(u){
 if(u.hero!=='warrior-1'||u.hp<=0||u.stun>0||u.castSkill!=='earthquake'||u.martialPose!=='leap')return null;
 if(!u.martialLeap)return 22; // Axe planted into the ground through landing recovery.
 const t=1-u.martialLeap.time/u.martialLeap.duration;
 return t<.16?19:t<.42?20:t<.82?21:22;
}
export function archerChargeFrame(u,obj,now){
 if(u.hero!=='samurai-archer')return null;
 const charging=u.hp>0&&!(u.stun>0)&&u.martialPose==='bow-charge'&&u.castAnim>0;
 if(charging){obj.archerChargeRemaining=u.castAnim;const t=1-Math.min(1,u.castAnim/(u.castDuration||1));return t<.15?18:t<.3?19:t<.5?20:t<.8?21:22;}
 if(obj.archerChargeRemaining>0){if(obj.archerChargeRemaining<=.12&&u.hp>0&&!(u.stun>0))obj.archerReleaseUntil=now+160;obj.archerChargeRemaining=0;}
 return u.hp>0&&!(u.stun>0)&&now<(obj.archerReleaseUntil||0)?23:null;
}
export function createHeroRefreshAnimations(scene){
 for(const id of Object.keys(REFRESH_HEROES)){
  const key='refresh:'+id,texture=scene.textures.get(key),source=texture.getSourceImage(),w=source.width/6,h=source.height/6;
  for(let n=0;n<36;n++){const x=Math.round(n%6*w),y=Math.round(Math.floor(n/6)*h);texture.add(n,0,x,y,Math.round((n%6+1)*w)-x,Math.round((Math.floor(n/6)+1)*h)-y);}
  for(const [row,action]of REFRESH_ACTIONS.entries())scene.anims.create({key:key+':'+action,frames:Array.from({length:6},(_,i)=>({key,frame:row*6+i})),frameRate:action==='attack'?12:8,repeat:['idle','walk'].includes(action)?-1:0});
 }
}
export function playRefreshedHero(scene,u,obj,requested){
 if(playPassiveAction(scene,u,obj,requested))return true;
 if(playGuardianAction(scene,u,obj,requested))return true;
 const info=REFRESH_HEROES[u.hero];if(!info)return false;
 const now=scene.time?.now||0,freshCast=(u.anim||0)>=.45&&(obj.refreshPreviousAnim||0)<.45;
 obj.refreshPreviousAnim=u.anim||0;
 const newCast=u.castCount>0&&obj.refreshCastCount!==u.castCount;
 if(newCast){obj.refreshCastCount=u.castCount;obj.refreshCastDuration=u.castDuration||u.castAnim||.5;}
 if(freshCast||newCast){obj.refreshCastUntil=now+(u.castDuration||u.castAnim||.5)*1000;obj.refreshCastRestart=true;}
 const casting=u.hp>0&&!(u.stun>0)&&((u.castAnim||0)>0||(u.martialLock||0)>0||now<(obj.refreshCastUntil||0));
 let action=requested;if(['flurry','dash','charge'].includes(action))action='attack';if(action==='leap')action='cast';
 if(u.hp<=0)action='dead';
 else if(casting&&requested!=='hurt'){
  const weaponStrike=(u.hero==='warrior-1'&&u.castSkill==='cleave')||(u.hero==='samurai-archer'&&u.castSkill==='multishot')||(u.hero==='goblin-assassin');
  action=weaponStrike||u.hero==='warrior-3'&&u.vanguardPose==='flurry'?'attack':'cast';
 }
 if(!REFRESH_ACTIONS.includes(action))return false;
 const sprite=obj.sprite,key='refresh:'+u.hero+':'+action,source=scene.textures.get('refresh:'+u.hero).getSourceImage();
 sprite.setOrigin(.5,info.originY).setScale(obj.size*info.height/(source.height/6*(HERO_BODY_RATIO[u.hero]||info.bodyRatio)));
 const thrust=u.hero==='warrior-3'&&u.vanguardThrust!==obj.refreshThrust;
 const restart=action==='attack'&&(obj.attackRestart||thrust)||action==='cast'&&obj.refreshCastRestart;
 obj.refreshThrust=u.vanguardThrust;
 if(restart){sprite.play(key,false);obj.attackRestart=false;obj.refreshCastRestart=false;}
 else if(['idle','walk'].includes(action)||sprite.anims.currentAnim?.key!==key)sprite.play(key,true);
 const duration=Math.max(.07,u.hero==='warrior-3'&&u.vanguardPose==='flurry'?u.vanguardThrustInterval||.14:action==='cast'?obj.refreshCastDuration||(obj.attackDuration||500)/1000:(obj.attackDuration||500)/1000);
 sprite.anims.timeScale=['attack','cast'].includes(action)?6/duration/(action==='attack'?12:8):action==='walk'?1.25:1;
 const slamFrame=warriorSlamFrame(u);
 if(slamFrame!==null&&sprite.setFrame){sprite.setFrame(slamFrame);sprite.anims.timeScale=0;}
 const chargeFrame=archerChargeFrame(u,obj,now);
 if(chargeFrame!==null&&sprite.setFrame){sprite.setFrame(chargeFrame);sprite.anims.timeScale=0;}
 obj.refreshedHero=u.hero;
 // New art wins over legacy empowered bodies; shared buff/weapon VFX remain available.
 obj.empoweredId=null;
 return true;
}
