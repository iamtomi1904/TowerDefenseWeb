import {createRoom,addPlayer,stats,tick,snapshot} from '../simulation.mjs';
import {BASIC_PROJECTILE_ART} from '../public/basic-projectile-config.js';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export function buildBasicAttackPreview(hero,{poison=false}={}){
 const room=createRoom('BASIC-PREVIEW'),p=addPlayer(room,{id:'preview',hero});
 p.mastery=0;p.hp=stats(p).hp;room.phase='battle';room.wave=1;room.spawn=999;room.spawnCd=99999;room.timer=999;
 if(poison)p.skills.venom=1;
 for(const [i,[dx,dy]]of [[155,0],[210,62],[245,-58]].entries())room.enemies.push({id:'dummy'+i,sprite:'green-slime',name:'Mục tiêu tập',x:p.x+dx,y:p.y+dy,hp:100000,maxHp:100000,power:0,speed:0,range:0,cooldown:999,cd:999,healCd:999,anim:0,face:-1,lane:0,waypoint:1,reward:0,size:30});
 const origin={x:p.x,y:p.y},frames=[];
 for(let i=0;i<100;i++){
  p.input={x:0,y:0,aimX:1,aimY:0,e:poison&&i===0,attack:i>=(poison?14:8)&&i<85};tick(room,.05,()=>.5);
  const state=snapshot(room);frames.push(JSON.parse(JSON.stringify({events:state.events,players:state.players,troops:state.troops,enemies:state.enemies,zones:state.zones,windFields:state.windFields,shadowZones:state.shadowZones})));
 }
 return {hero,slot:'A',skill:'basic-attack',step:50,origin,frames};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const previews={};for(const p of Object.values(BASIC_PROJECTILE_ART))previews[p.hero]=buildBasicAttackPreview(p.hero);
 previews['samurai-archer:poison']=buildBasicAttackPreview('samurai-archer',{poison:true});
 writeFileSync(new URL('../public/basic-attack-previews.json',import.meta.url),JSON.stringify(previews));console.log('Generated six basic-attack replays from simulation.tick');
}
