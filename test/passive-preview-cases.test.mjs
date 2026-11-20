import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PASSIVE_PREVIEW_CASES} from '../public/passive-preview-cases.js';
test('every passive action button resolves to a real simulation replay with the requested mastery and form',()=>{
 let count=0;for(const [hero,cases]of Object.entries(PASSIVE_PREVIEW_CASES)){
  const data=JSON.parse(readFileSync(new URL('../public/passive-previews/'+hero+'.json',import.meta.url)));
  assert.equal(new Set(cases.map(c=>c.id)).size,cases.length);
  for(const c of cases){count++;const replay=data[c.id];assert.equal(replay.caseId,c.id);assert.equal(replay.mastery,c.options.mastery);assert.equal(replay.frames.length,200);assert.ok(replay.frames.some(f=>f.events.length));
   const p=replay.frames[0].players.find(p=>p.id==='preview');assert.equal(p.mastery,c.options.mastery);
   if(c.options.dual)assert.equal(p.dualSwords,true);
   if(c.options.mounted)assert.ok(p.holyMounted||p.fallenMounted);
  }
 }
 assert.equal(count,39);
});
test('separate buttons expose both duelist bodies, shield third strike, extra arrows and two actual healing targets',()=>{
 const get=(hero,id)=>JSON.parse(readFileSync(new URL('../public/passive-previews/'+hero+'.json',import.meta.url)))[id];
 for(const [hero,id,action]of [['samurai-commander','critical','duelist-critical'],['samurai-commander','dual-fourth','duelist-dual'],['knight-1','shield-third','guardian'],['samurai-archer','piercing','piercing-arrow'],['samurai','wind-beam','windblade'],['warrior-2','blood-execute','ravager'],['warrior-3','giant-spear','vanguard']]){
  assert.ok(get(hero,id).frames.some(f=>f.events.some(e=>e.action===action)),id+' really activates '+action);
 }
 const streams=get('wanderer-magican','water-heal-two').frames.flatMap(f=>f.events).filter(e=>e.action==='heal-water');assert.ok(new Set(streams.map(e=>e.targetId)).size>=2);
});
