import {SKILL_ACTION_LAYOUT} from './skill-action-layout-v2.js';
import {SKILLS} from './skills.js';
const SPECIAL=new Set(['knight-2','knight-3','samurai-commander']);
export const SKILL_ACTION_HEROES=['samurai','warrior-3','knight-3','knight-2','dark-elf','goblin-assassin','knight-1','samurai-commander','samurai-archer','warrior-1','warrior-2','fire-wizard','lightning-mage','wanderer-magican'];
export function preloadSkillActions(s){for(const id of SKILL_ACTION_HEROES)s.load.image('skill-action:'+id,'/assets/skill-actions-v2/'+id+'.png');}
export function skillActionFrame(u){
 const remaining=u.martialLock>0?u.martialLock:u.windAction?.time>0?u.windAction.time:u.windCast>0?u.windCast:u.castAnim;
 if(!u.hero||u.hp<=0||u.stun>0||!(remaining>0)||!u.castSkill)return null;
 // Existing shield slam / jump and ritual windups retain their precisely timed frames.
 if(u.hero==='knight-1'&&['shield-bash','rally'].includes(u.castSkill))return null;
 if((u.hero==='warrior-1'&&u.castSkill==='earthquake')||(u.hero==='wanderer-magican'&&u.castSkill==='blizzard')||(u.hero==='dark-elf'&&u.castSkill==='elf-eclipse')||(u.hero==='samurai-archer'&&u.castSkill==='arrow-rain')||(u.hero==='samurai-commander'&&!u.dualSwords&&u.castSkill==='bladestorm'))return null;
 const skill=SKILLS.find(s=>s.id===u.castSkill);if(!skill)return null;
 let row=['Q','E','R'].indexOf(skill.slot);if(row<0)return null;
 if((u.level||1)>=16)row+=3;
 if(SPECIAL.has(u.hero)&&(u.dualSwords||u.holyMounted||u.fallenMounted))row+=6;
 const timings={'blood-cleave':1.3,bloodstorm:3.6,'dual-storm':2.85,'heavy-cut':1.1,'cross-cut':.55,'axe-cut':1.05,'blood-roar':.5,enchant:.5,'draw-swords':.5};
 const duration=Math.max(.1,timings[u.martialPose]||(u.windAction?.kind==='dash'?.38:u.windAction?.kind==='jump'?1.45:u.windCast>0?.5:u.castDuration||remaining)),progress=Math.max(0,Math.min(.999,1-remaining/duration));
 let frame=Math.min(5,Math.floor(progress*6));
 if(u.skillPrepareTime>0)frame=Math.min(2,Math.floor(progress*3));else if(u.skillReleaseSerial===u.castCount)frame=3+Math.min(2,Math.floor(progress*3));
 if(['bloodstorm','dual-storm'].includes(u.martialPose)){const elapsed=duration-remaining;frame=elapsed<.9?Math.min(2,Math.floor(elapsed/.3)):2+Math.floor((elapsed-.9)*12)%4;}
 const layout=SKILL_ACTION_LAYOUT[u.hero];
 if(layout?.rowMap){const mounted=!!(u.holyMounted||u.fallenMounted),max=(u.level||1)>=16,mode=mounted?(max?'mountedMax':'mounted'):(max?'max':'normal');row=layout.rowMap[mode][['Q','E','R'].indexOf(skill.slot)];if(u.hero==='knight-2'&&!mounted&&skill.slot==='Q')row+=Math.max(0,Math.min(2,(u.holyQStep||1)-1));}

 return {row,frame,rows:layout?.rows||(SPECIAL.has(u.hero)?12:6)};
}
export function playSkillAction(s,u,obj){
 const f=skillActionFrame(u),key='skill-action:'+u.hero;if(!f||!s.textures.exists(key))return false;
 const tx=s.textures.get(key),im=tx.getSourceImage(),w=im.width/6,h=im.height/f.rows,n=f.row*6+f.frame;
 if(!tx.has(n))tx.add(n,0,Math.round(f.frame*w),Math.round(f.row*h),Math.round(w),Math.round(h));
 const layout=SKILL_ACTION_LAYOUT[u.hero],ratio=layout?.ratios[f.row]||.72;
 obj.sprite.anims.stop();obj.sprite.setTexture(key,n).setOrigin(.5,layout?.origins[n]??.92).setScale(obj.size/(h*ratio)).setFlipX(u.face<0);obj.attackRestart=false;obj.refreshCastCount=u.castCount;obj.refreshCastUntil=0;return true;
}
