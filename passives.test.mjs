import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,addPlayer,stats,tick,spawnEnemy,MAPS} from './simulation.mjs';
import {PASSIVES} from './public/passives.js';
import {healing,passiveHit,passiveKill,passiveUpkeep,passiveTakeDamage} from './passives.mjs';
import {launchAimed,advanceProjectiles} from './projectiles.mjs';
import {applyStatus} from './abilities.mjs';
const room=hero=>{const r=createRoom('PASSIVE'),p=addPlayer(r,{hero});r.phase='battle';r.spawn=99;r.spawnCd=999;return {r,p};};
test('all 14 heroes have unique available innate passives',()=>{
 assert.equal(Object.keys(PASSIVES).length,14);assert.equal(new Set(Object.values(PASSIVES).map(p=>p.name)).size,14);
 for(const hero of Object.keys(PASSIVES)){const {p}=room(hero);assert.equal(p.level,1);assert.equal(p.mastery,0);assert.ok(PASSIVES[hero].text);}
});
test('guardian reflect wave, berserker low-HP, warrior kill stacks and Tier 2 mechanics work on server',()=>{
 const {r,p}=room('knight-1');const e={id:'e1',x:p.x+40,y:p.y,hp:1000,maxHp:1000,armor:0};r.enemies=[e];
 for(let i=0;i<4;i++)passiveTakeDamage(r,p,e,10,stats,applyStatus);
 assert.equal(p.guardWaveTime,3);assert.ok(p.shield>0);assert.ok(e.hp<1000);
 p.hero='warrior-2';p.hp=stats(p).hp;const power=stats(p).power;p.hp=20;assert.ok(stats(p).power>=power*1.34);
 p.hero='warrior-1';p.hp=20;passiveKill(r,p,e,stats);assert.ok(p.hp>20);assert.equal(p.warStacks,1);assert.ok(r.events.some(ev=>ev.type==='healing'));
 p.hero='warrior-3';p.hp=stats(p).hp;const fullCd=stats(p).cooldown;p.hp=Math.round(stats(p).hp*.4);assert.ok(stats(p).cooldown<fullCd);
 p.hero='samurai-commander';p.hp=stats(p).hp;p.duelStacks=20;assert.ok(stats(p).power>power);
});
test('new hit-count passives activate on hits including fire 5-stack, lightning 4-stack, water 4-stack, knight-3 4-mark and archer 10-focus',()=>{
 for(const [hero,hits] of [['knight-3',4],['samurai',3],['fire-wizard',5],['lightning-mage',4],['wanderer-magican',4],['samurai-archer',10]]){
  const {r,p}=room(hero);p.hp=30;const target={id:'t',x:p.x+170,y:p.y,hp:1000,maxHp:1000,armor:0},other={id:'o',x:target.x+30,y:target.y,hp:1000,armor:0};r.enemies=[target,other];const hp=p.hp;
  if(hero==='samurai'){p.mastery=2;p.windPassiveStacks=5;}
  for(let i=0;i<hits;i++){p.attackCount=i+1;passiveHit(r,p,target,50,stats,applyStatus,()=>{});}
  if(hero==='wanderer-magican'){assert.ok(p.hp>hp,hero);assert.equal(target.slow,.15);assert.equal(target.slowType,'ice');}
  if(['knight-3','samurai'].includes(hero))assert.ok(target.hp<1000,hero);
  if(hero==='fire-wizard'){assert.equal(target.statuses.burn.stacks,5);assert.equal(target.statuses.burn.percentMaxHp,.02);}
  if(hero==='lightning-mage')assert.ok(other.hp<1000);
  if(hero==='samurai-archer')assert.equal(p.focusStacks,10);
 }
});
test('healing never revives dead units or displays fake healing at full health',()=>{
 const {r,p}=room('warrior-1'),max=stats(p).hp;p.hp=max;assert.equal(healing(r,p,20,max),0);assert.equal(r.events.length,0);p.hp=0;assert.equal(healing(r,p,20,max),0);p.hp=max-3;assert.equal(healing(r,p,20,max),3);assert.equal(r.events[0].amount,3);
});
test('aimed projectiles fire into empty space, hit intervening targets, miss off-axis and stop at walls',()=>{
 const source={id:'p',x:100,y:100,classId:'ranger'};
 const r={projectiles:[],events:[],enemies:[{id:'off',x:180,y:150,hp:100,size:30},{id:'near',x:210,y:100,hp:100,size:30},{id:'far',x:280,y:100,hp:100,size:30}]},hits=[];
 launchAimed(r,source,{x:1,y:0},300,e=>hits.push(e.id),()=>true);assert.equal(hits.length,0);advanceProjectiles(r,.3);assert.deepEqual(hits,['near']);assert.equal(r.projectiles.length,0);
 r.enemies=[];launchAimed(r,source,{x:0,y:1},300,e=>hits.push(e.id),()=>true);assert.ok(r.events.at(-1).ty>100);advanceProjectiles(r,1);assert.equal(r.projectiles.length,0);
 r.enemies=[{id:'wallbehind',x:250,y:100,hp:100}];launchAimed(r,source,{x:1,y:0},300,e=>hits.push(e.id),x=>x<170);advanceProjectiles(r,1);assert.deepEqual(hits,['near']);
});
test('stunned enemies cannot walk, attack or finish an already prepared special',()=>{
 const {r,p}=room('warrior-1');const e=spawnEnemy(r,()=>0);e.x=p.x+30;e.y=p.y;e.stun=1;e.windup={target:p.id,remaining:.01};e.cd=0;const hp=p.hp,x=e.x,y=e.y;tick(r,.2);assert.equal(p.hp,hp);assert.equal(e.x,x);assert.equal(e.y,y);assert.equal(e.windup.remaining,.01);
});
test('basic attack consumes cooldown without a target and respects explicit aim',()=>{
 const {r,p}=room('samurai-archer');p.input={attack:true,aimX:0,aimY:1};tick(r);assert.ok(p.cd>0);assert.equal(p.attackCount,1);assert.ok(r.events.some(e=>e.type==='projectile'&&e.straight));assert.equal(p.passiveHits,0);
});
