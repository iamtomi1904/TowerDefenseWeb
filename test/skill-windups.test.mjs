import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,addPlayer,stats,tick} from '../simulation.mjs';
import {flurryTargets} from '../vanguard-actions.mjs';
for(const [hero,skill,delay] of [['fire-wizard','meteor',.6],['lightning-mage','tempest',.7],['dark-elf','elf-eclipse',.6]]){
 const setup=()=>{const r=createRoom('CHANNEL'),p=addPlayer(r,{hero});p.skills[skill]=1;p.hp=stats(p).hp;r.phase='battle';r.wave=1;r.spawn=999;r.spawnCd=99999;r.enemies.push({id:'target',x:p.x+80,y:p.y,hp:99999,maxHp:99999,speed:0,power:0,range:0,cd:999,cooldown:999,size:30,healCd:999,anim:0});p.input={r:true,aimX:1,aimY:0};tick(r,.05,()=>.5);p.input={};return {r,p};};
 test(hero+' R waits for its preparation and releases once',()=>{
  const {r,p}=setup();assert.equal(r.zones.length+(r.shadowZones?.length||0),0);assert.ok(r.events.some(e=>e.type==='skill-channel'));assert.ok(p.castAnim>=delay);
  for(let i=0;i<Math.round(delay/.05)-1;i++)tick(r,.05,()=>.5);
  assert.equal(r.zones.length+(r.shadowZones?.length||0),0);
  tick(r,.05,()=>.5);assert.equal(r.zones.length+(r.shadowZones?.length||0),1);assert.equal(r.skillChannels.length,0);
  tick(r,.05,()=>.5);assert.equal(r.zones.length+(r.shadowZones?.length||0),1);
 });
 test(hero+' R is interrupted before release by stun',()=>{
  const {r,p}=setup();p.stun=1;for(let i=0;i<20;i++)tick(r,.05,()=>.5);
  assert.equal(r.zones.length+(r.shadowZones?.length||0),0);assert.equal(r.skillChannels.length,0);assert.equal(p.castAnim,0);
 });
}
test('spear flurry cone includes side targets ahead and excludes behind or outside the cone',()=>{
 const p={x:0,y:0},e=(id,x,y)=>({id,x,y,hp:100,size:1}),r={enemies:[e('front',100,0),e('side',100,30),e('outside',90,110),e('back',-80,0)]};
 assert.deepEqual(flurryTargets(r,p,{x:1,y:0},155,{}).map(e=>e.id),['front','side']);
});
