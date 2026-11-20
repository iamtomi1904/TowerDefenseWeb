import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSkillPreview} from '../scripts/build-skill-previews.mjs';
import {createRoom,addPlayer,tick,stats} from '../simulation.mjs';
import {CLASSES} from '../public/skills.js';
const events=p=>p.frames.flatMap((f,i)=>f.events.map(e=>({...e,frame:i})));
test('poison enchant buffs the archer before firing and real arrows poison targets',()=>{
 const p=buildSkillPreview('samurai-archer','E'),es=events(p);
 assert.equal(es.filter(e=>e.type==='projectile'&&e.frame===0).length,0);
 assert.ok(p.frames[0].players[0].buffs.some(b=>b.poisonArrows));
 assert.ok(es.some(e=>e.type==='projectile'&&e.projectileType==='poison-arrow'));
 assert.ok(p.frames.some(f=>f.enemies.some(e=>e.statuses?.poison?.damage>0)));
 assert.ok(!p.frames.at(-1).players[0].buffs.some(b=>b.poisonArrows));
});
test('archer Q carries poison visuals and applies poison after E runs out in flight',()=>{
 const preview=buildSkillPreview('samurai-archer','Q',{poisonCombo:true}),shots=events(preview).filter(e=>e.type==='projectile'&&e.skill==='multishot');
 assert.equal(shots.length,3);assert.ok(shots.every(e=>e.poisonEnchanted&&e.projectileType==='poison-arrow'));
 const r=createRoom('QPOISON'),p=addPlayer(r,{hero:'samurai-archer'});r.phase='battle';r.spawn=999;r.spawnCd=99999;
 p.buffs.push({time:.08,poisonArrows:true,poison:.25,poisonSlow:.2,poisonDuration:4});
 const e={id:'dummy',sprite:'green-slime',x:p.x+240,y:p.y,hp:10000,maxHp:10000,power:0,speed:0,range:0,cooldown:999,cd:999,healCd:999,lane:0,waypoint:1,reward:0};r.enemies.push(e);
 p.input={q:true};tick(r,.05,()=>.5);p.input={};for(let i=0;i<9;i++)tick(r,.05,()=>.5);
 assert.ok(!p.buffs.some(b=>b.poisonArrows&&b.time>0));assert.ok(e.statuses.poison.damage>0);
});
test('archer ultimate prepares for 1.5s before placing a five second rain zone',()=>{
 const p=buildSkillPreview('samurai-archer','R'),es=events(p);
 assert.equal(es[0].action,'bow-charge');
 assert.ok(p.frames.slice(0,30).every(f=>f.zones.length===0));
 assert.equal(es.find(e=>e.action==='bow-release').frame,30);
 assert.ok(es.find(e=>e.skill==='arrow-rain').frame>=30);
});
test('E then R then Q keeps all Q arrows poison enchanted',()=>{
 const r=createRoom('ERQ'),p=addPlayer(r,{hero:'samurai-archer'});r.phase='battle';r.spawn=999;r.spawnCd=99999;
 for(const id of ['venom','arrow-rain','multishot'])p.skills[id]=1;
 r.enemies.push({id:'dummy',sprite:'green-slime',x:p.x+180,y:p.y,hp:10000,maxHp:10000,power:0,speed:0,range:0,cooldown:999,cd:999,healCd:999,lane:0,waypoint:1,reward:0});
 p.input={e:true};tick(r,.05,()=>.5);p.input={};for(let i=0;i<11;i++)tick(r,.05,()=>.5);
 p.input={r:true};tick(r,.05,()=>.5);p.input={};for(let i=0;i<33;i++)tick(r,.05,()=>.5);
 assert.ok(r.zones.some(z=>z.skill==='arrow-rain'));p.input={q:true};tick(r,.05,()=>.5);
 const q=r.events.filter(e=>e.type==='projectile'&&e.skill==='multishot');assert.equal(q.length,1);assert.ok(q.every(e=>e.poisonEnchanted));
});
test('stun cancels arrow preparation and prevents delayed damage',()=>{
 const r=createRoom('INTERRUPT'),p=addPlayer(r,{hero:'samurai-archer'});
 p.skills['arrow-rain']=1;r.phase='battle';r.spawn=999;r.spawnCd=99999;
 p.input={r:true};tick(r,.05,()=>.5);p.input={};p.stun=1;
 for(let i=0;i<30;i++)tick(r,.05,()=>.5);
 assert.equal(r.zones.length,0);assert.equal(r.martialActions.length,0);
});
test('katana form has more power, dual form attacks faster and uses different Q and R',()=>{
 const r=createRoom('FORMS'),p=addPlayer(r,{hero:'samurai-commander'}),single=stats(p);
 p.dualSwords=true;const dual=stats(p);assert.ok(single.power>dual.power);assert.ok(dual.cooldown<single.cooldown);
 const q1=buildSkillPreview(p.hero,'Q'),q2=buildSkillPreview(p.hero,'Q',{dual:true});
 assert.equal(q1.frames[0].players[0].x,q1.origin.x);assert.notEqual(q2.frames[0].players[0].x,q2.origin.x);
 assert.equal(events(q1).filter(e=>e.action==='heavy-cut').length,1);assert.equal(events(q2).filter(e=>e.action==='dual-cut').length,2);
 const r1=events(buildSkillPreview(p.hero,'R')),r2=events(buildSkillPreview(p.hero,'R',{dual:true}));
 assert.ok(r1.some(e=>e.action==='sword-summon'||e.action==='sword-descend'||e.action==='heaven-sword'));
 assert.equal(r2.filter(e=>e.action==='dual-cut').length,6);assert.equal(r2.filter(e=>e.action==='sword-finish').length,1);
 const form=buildSkillPreview(p.hero,'E');assert.equal(form.frames[0].players[0].dualSwords,true);
 assert.equal(buildSkillPreview(p.hero,'E',{dual:true}).frames[0].players[0].dualSwords,false);
});
test('warrior ultimate jumps first, damages on landing, lifts, then stuns after falling',()=>{
 const p=buildSkillPreview('warrior-1','R'),es=events(p),landing=es.find(e=>e.action==='quake-land').frame;
 assert.ok(p.frames.slice(0,landing).some(f=>f.players[0].martialLeap?.time>0));
 assert.ok(p.frames.slice(0,landing).every(f=>f.enemies.every(e=>e.hp===e.maxHp)));
 const lifted=p.frames[landing].enemies.find(e=>e.windAirTime>0);assert.ok(lifted);assert.ok(!(lifted.stun>0));
 const stunFrame=p.frames.findIndex(f=>f.enemies.some(e=>e.id===lifted.id&&e.stun>0));
 assert.ok(stunFrame-landing>=10);assert.ok(p.frames[stunFrame].enemies.find(e=>e.id===lifted.id).windAirTime<=.001);
});
test('ravager has its own skill kit with two Q hits and six R pulses',()=>{
 assert.notDeepEqual(CLASSES.ravager.skills,CLASSES.berserker.skills);
 assert.equal(events(buildSkillPreview('warrior-2','Q')).filter(e=>e.action==='blood-cut').length,2);
 assert.equal(events(buildSkillPreview('warrior-2','R')).filter(e=>e.action==='blood-cut').length,6);
 assert.ok(buildSkillPreview('warrior-2','E').frames[0].players[0].buffs.some(b=>b.powerMultiplier===.25));
});
test('moving the cursor during heavy preparation does not desynchronize the slash from its hit direction',()=>{
 const r=createRoom('AIM'),p=addPlayer(r,{hero:'samurai-commander'});r.phase='battle';r.spawn=999;r.spawnCd=99999;
 p.input={q:true,aimX:1,aimY:0};tick(r,.05,()=>.5);p.input={aimX:0,aimY:1};
 let slash;for(let i=0;i<22;i++){tick(r,.05,()=>.5);slash||=r.events.find(e=>e.action==='heavy-cut');}
 assert.ok(slash);assert.equal(slash.angle,0);
});
test('arrow rain has continuous 0.2s hits, and E plus R poisons every rain pulse',()=>{
 const plain=buildSkillPreview('samurai-archer','R'),poison=buildSkillPreview('samurai-archer','R',{poisonCombo:true});
 for(const [p,enchanted]of [[plain,false],[poison,true]]){
  const rain=events(p).filter(e=>e.skill==='arrow-rain');assert.equal(rain.length,25);
  for(let i=1;i<rain.length;i++)assert.equal(rain[i].frame-rain[i-1].frame,4);
  assert.ok(rain.every(e=>e.poisonEnchanted===enchanted));
  assert.equal(p.frames.some(f=>f.enemies.some(e=>e.statuses?.poison?.damage>0)),enchanted);
 }
});
test('arrows enchanted when R begins keep poison even if E expires during preparation',()=>{
 const r=createRoom('COATED'),p=addPlayer(r,{hero:'samurai-archer'});p.skills['arrow-rain']=1;r.phase='battle';r.spawn=999;r.spawnCd=99999;
 p.buffs.push({time:.12,poisonArrows:true,poison:.25,poisonSlow:.2,poisonDuration:4});
 const e={id:'dummy',sprite:'green-slime',x:p.x+85,y:p.y,hp:10000,maxHp:10000,power:0,speed:0,range:0,cooldown:999,cd:999,healCd:999,lane:0,waypoint:1,reward:0};r.enemies.push(e);
 p.input={r:true,aimX:1,aimY:0};tick(r,.05,()=>.5);p.input={};
 for(let i=0;i<30;i++)tick(r,.05,()=>.5);
 assert.ok(!p.buffs.some(b=>b.poisonArrows));assert.ok(e.statuses?.poison?.damage>0);assert.ok(r.zones[0].poison);
});
