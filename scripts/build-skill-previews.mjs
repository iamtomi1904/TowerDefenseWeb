import {createRoom,addPlayer,stats,tick,snapshot,MAPS} from '../simulation.mjs';
import {CLASSES,skillById} from '../public/skills.js';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export const PREVIEW_HEROES=['dark-elf','goblin-assassin','knight-1','knight-2','knight-3','samurai','samurai-archer','samurai-commander','fire-wizard','lightning-mage','wanderer-magican','warrior-1','warrior-2','warrior-3'];
export function buildSkillPreview(hero,slot,{dual=false,poisonCombo=false,mounted=false,mastery=2,seed='',passiveCase=false}={}){
 const room=createRoom('PREVIEW'),p=addPlayer(room,{id:'preview',hero});
 p.mastery=mastery;
 if(slot==='P'){if(hero==='wanderer-magican')p.waterStacks=3;if(hero==='knight-1'||hero==='samurai')p.attackCount=2;if(hero==='knight-2')p.holyMarks=2;if(hero==='samurai'){p.windPassiveStacks=5;p.windPassiveTime=4;}if(hero==='samurai-commander')p.swordIntent=1;if(hero==='warrior-3')p.attackCount=3;if(hero==='samurai-archer'){p.focusStacks=10;p.focusTime=15;}if(hero==='warrior-1'){p.warStacks=5;p.warTime=20;}}
 p.dualSwords=dual;if(mounted){if(hero==='knight-2')p.holyMounted=true;if(hero==='knight-3')p.fallenMounted=true;}p.hp=stats(p).hp*(slot==='P'?(hero==='warrior-2'?.12:.4):.6);
 if(slot==='P'&&hero==='wanderer-magican'){const ally=addPlayer(room,{id:'heal-ally',hero:'warrior-1'});ally.x=p.x+120;ally.y=p.y+70;ally.hp=stats(ally).hp*.3;}
 for(const id of CLASSES[p.classId].skills)p.skills[id]=1;
 if(slot==='P'){
  if(seed==='empty'){p.waterStacks=0;p.focusStacks=0;p.warStacks=0;p.windPassiveStacks=0;p.attackCount=0;p.swordIntent=0;}
  if(seed==='stealth')p.stealthGraceTime=3;
  if(seed==='shield')p.shield=120;
  if(seed==='healthy')p.hp=stats(p).hp*.85;
  if(hero==='warrior-2'&&mastery<2&&seed!=='healthy')p.hp=stats(p).hp*.4;
  if(seed==='duel-full'){p.duelStacks=20;p.duelStackTime=30;p.swordIntent=1;p.attackCount=3;}
  if(seed==='dual')p.attackCount=3;
  if(seed==='piercing')p.focusShotCount=2;
  if(seed==='charge')p.lightningStacks=3;
  if(seed==='giant'){p.vanguardTime=20;p.vanguardExtended=0;}
  if(seed==='two-allies'){const a=addPlayer(room,{id:'heal-ally-2',hero:'knight-1'});a.x=p.x+100;a.y=p.y-75;a.hp=stats(a).hp*.25;}
 }
 room.phase='battle';room.wave=1;room.spawn=999;room.spawnCd=99999;room.timer=999;
 // Stationary, durable targets exercise real targeting, projectiles and damage ticks.
 for(const [i,[dx,dy]]of [[85,0],[130,45],[165,-40]].entries())room.enemies.push({id:'dummy'+i,sprite:'green-slime',name:'Mục tiêu tập',x:p.x+(slot==='P'&&!['samurai-archer','dark-elf'].includes(hero)?Math.min(dx,45):dx),y:p.y+dy,hp:100000,maxHp:100000,power:0,speed:0,range:slot==='P'?180:0,cooldown:slot==='P'?.8:999,cd:slot==='P'?1:999,healCd:999,anim:0,face:slot==='P'?1:-1,boss:slot==='P'&&hero==='warrior-1',lane:0,waypoint:1,reward:0,size:30});
 if(seed==='bleed'){room.enemies[0].hp=20;room.enemies[0].statuses={bleed:{time:10,damage:0,owner:p.id}};}
 if(seed==='moon-break')room.enemies.forEach(e=>e.moonHits=2);
 const skill=slot==='P'?{id:'passive',duration:12}:skillById(CLASSES[p.classId].skills.find(id=>skillById(id).slot===slot));
 const frames=[],origin={x:p.x,y:p.y};
 const multiPaladin=hero==='knight-2'&&slot==='Q',multiFallen=hero==='knight-3'&&slot==='Q';
 const totalFrames=passiveCase?200:multiPaladin?(mounted?120:100):multiFallen?(mounted?100:72):Math.ceil((Math.max(skill.id==='meteor'?7:skill.id==='blizzard'?6.5:skill.duration||0,(skill.delay||0)+(skill.fieldDuration||0),1)+2.0+(poisonCombo?.75:0))/.05);
 for(let i=0;i<totalFrames;i++){
  const qPress=slot==='P'?false:multiPaladin?(i===0||i===12||i===24):multiFallen?(i===0||i===26):i===(poisonCombo?15:0);
  if(slot==='P'&&hero==='goblin-assassin')room.enemies.forEach(e=>e.face=1);
  p.input={x:multiFallen&&i>0&&i<16?1:0,y:0,aimX:1,aimY:0,[slot.toLowerCase()]:qPress,...(poisonCombo?{e:i===0}:{}),attack:slot==='P'||skill.id==='venom'&&i>=15&&i%16===0};
  tick(room,.05,()=>.5);
  const state=snapshot(room);
  frames.push(JSON.parse(JSON.stringify({events:state.events,players:state.players,troops:state.troops,enemies:state.enemies,zones:state.zones,windFields:state.windFields,shadowZones:state.shadowZones})));
 }
 return {hero,slot,skill:skill.id,rank:1,step:50,origin,frames};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const previews={};for(const hero of PREVIEW_HEROES)for(const slot of ['Q','E','R','P'])previews[hero+':'+slot]=buildSkillPreview(hero,slot);
 for(const slot of ['Q','E','R','P'])previews['samurai-commander:'+slot+':dual']=buildSkillPreview('samurai-commander',slot,{dual:true});
 for(const hero of ['knight-2','knight-3'])for(const slot of ['Q','E','P'])previews[hero+':'+slot+':mounted']=buildSkillPreview(hero,slot,{mounted:true});
 previews['samurai-archer:R:poison']=buildSkillPreview('samurai-archer','R',{poisonCombo:true});
 previews['samurai-archer:Q:poison']=buildSkillPreview('samurai-archer','Q',{poisonCombo:true});
 const file=new URL('../public/skill-previews.json',import.meta.url);writeFileSync(file,JSON.stringify(previews));console.log('Generated',Object.keys(previews).length,'replays using simulation.tick');
}
