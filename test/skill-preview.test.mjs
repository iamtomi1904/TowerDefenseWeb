import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSkillPreview,PREVIEW_HEROES} from '../scripts/build-skill-previews.mjs';
import {CLASSES,skillById} from '../public/skills.js';
import {readFileSync} from 'node:fs';
const saved=JSON.parse(readFileSync(new URL('../public/skill-previews.json',import.meta.url)));
test('all hero previews are successful real casts with rank, duration and events from simulation',()=>{
 for(const hero of PREVIEW_HEROES)for(const slot of ['Q','E','R']){
  const replay=buildSkillPreview(hero,slot),first=replay.frames[0].players[0];
  const definition=skillById(replay.skill);
  assert.ok(first.castCount>0||first.anim>0,hero+slot+' cast marker');assert.equal(first.skills[replay.skill],1);
  if(['holy-form','fallen-form','vanguard-form'].includes(definition.kind))assert.equal(first.cooldowns[replay.skill],0);
  else assert.ok(first.cooldowns[replay.skill]>0);
  if(definition.cost>0)assert.ok(first.energy<CLASSES[first.classId].energy);
  assert.ok(replay.frames.flatMap(f=>f.events).length>0);
  const archived=saved[hero+':'+slot];
  // IDs are random, but event timing, geometry and effect identity must match the current engine.
  const signature=v=>v.frames.map(f=>f.events.map(({type,skill,x,y,tx,ty,radius,duration})=>({type,skill,x,y,tx,ty,radius,duration})));
  assert.deepEqual(signature(archived),signature(replay),hero+slot+' replay is stale');
  assert.ok(replay.frames.length*replay.step>=Math.max(definition.duration||0,definition.delay||0)*1000);
 }
});
test('projectiles, meteor order, multi target arrows, buffs and dash retain real behavior',()=>{
 const events=key=>saved[key].frames.flatMap((f,i)=>f.events.map(e=>({...e,frame:i})));
 const fire=events('fire-wizard:Q');assert.ok(fire.find(e=>e.type==='projectile').frame<fire.find(e=>e.skill==='fireburst').frame);
 const meteor=events('fire-wizard:R');assert.ok(meteor.find(e=>e.type==='meteor-fall').frame<meteor.find(e=>e.type==='meteor-impact').frame);
 assert.equal(events('samurai-archer:Q').filter(e=>e.type==='projectile').length,3);
 assert.ok(saved['knight-1:E'].frames[0].players[0].shield>0);
 const dash=saved['samurai-commander:Q:dual'];assert.notEqual(dash.frames[0].players[0].x,dash.origin.x);
 assert.ok(events('wanderer-magican:R').filter(e=>e.skill==='blizzard').length>=5);
});
