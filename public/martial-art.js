import {prewarmElementAnimations} from './element-animation.js';
import {preloadWindupActors,playWindupActor} from './windup-actors.js';
import {playGuardianAction} from './guardian-actions-art.js';
import {preloadRitualCasting,playRitualCast} from './ritual-casting-art.js';
import {preloadPassiveActions,playPassiveAction} from './passive-action-art.js';
import {preloadAscended} from './ascended-art.js';
import {preloadTroopArt,createTroopAnimations,playTroopActor} from './troop-art.js';
import {preloadClassProgression} from './class-progression-art.js';
import {preloadKnightRefresh,createKnightRefresh,playKnightRefresh} from './knight-refresh-art.js';
import {preloadPaintedSkills} from './painted-skill-art.js';
import {preloadHeroRefresh,createHeroRefreshAnimations,playRefreshedHero} from './hero-refresh-art.js';
import {preloadRavagerArt,createRavagerAnimations,playRavagerActor} from './ravager-art.js';
import {preloadSlashArt} from './slash-art.js';
export function preloadMartialArt(s){preloadWindupActors(s);preloadRitualCasting(s);preloadPassiveActions(s);preloadTroopArt(s);preloadAscended(s);preloadClassProgression(s);preloadPaintedSkills(s);preloadKnightRefresh(s);s.load.image("elemental-refresh","/assets/combat/elemental-refresh.png");preloadHeroRefresh(s);preloadRavagerArt(s);preloadSlashArt(s);s.load.image('katana-forms','/assets/blademaster/katana-forms.png');}
export function createMartialAnimations(s){
 if(s.martialArtReady)return;
 prewarmElementAnimations(s);
 createTroopAnimations(s);
 createKnightRefresh(s);
 createHeroRefreshAnimations(s);
 createRavagerAnimations(s);
 if(!s.textures.exists('katana-forms')){s.martialArtReady=true;return;}
 const texture=s.textures.get('katana-forms'),image=texture.getSourceImage(),w=image.width/6,h=image.height/6;
 for(let i=0;i<36;i++){const x=Math.round(i%6*w),y=Math.round(Math.floor(i/6)*h);texture.add(i,0,x,y,Math.round((i%6+1)*w)-x,Math.round((Math.floor(i/6)+1)*h)-y);}
 for(const [form,row]of [['single',0],['dual',3]])for(const [action,offset]of [['idle',0],['walk',1],['attack',2]])s.anims.create({key:'katana:'+form+':'+action,frames:Array.from({length:6},(_,i)=>({key:'katana-forms',frame:(row+offset)*6+i})),frameRate:action==='attack'?12:8,repeat:action==='attack'?0:-1});
 s.martialArtReady=true;
}
export function playMartialActor(s,u,obj,action){
 if(playWindupActor(s,u,obj))return true;
 if(playRitualCast(s,u,obj))return true;
 if(u.guardianR&&playGuardianAction(s,u,obj,action))return true;
 if(playPassiveAction(s,u,obj,action))return true;
 if(playTroopActor(s,u,obj,action))return true;
 if(playKnightRefresh(s,u,obj,action))return true;
 if(playRefreshedHero(s,u,obj,action))return true;
 if(playRavagerActor(s,u,obj,action))return true;
 if(u.hero!=='samurai-commander'||!['idle','walk','attack'].includes(action))return false;
 const sprite=obj.sprite,form=u.dualSwords?'dual':'single',key='katana:'+form+':'+action;
 sprite.setOrigin(.5,.98).setScale(obj.size/(s.textures.get('katana-forms').getSourceImage().height/6*.85));
 if(obj.attackRestart&&action==='attack'){sprite.play(key,false);obj.attackRestart=false;}
 else if(action!=='attack'||sprite.anims.currentAnim?.key!==key)sprite.play(key,true);
 sprite.anims.timeScale=action==='attack'?6/Math.max(.12,(obj.attackDuration||500)/1000)/12:action==='walk'?1.25:1;
 return true;
}
