import test from 'node:test';
import assert from 'node:assert/strict';
import {castTide,tickTide,tideReduction} from '../tide-actions.mjs';
import {skillAtRank,skillById} from '../public/skills.js';
import {createRoom,addPlayer,tick,stats} from '../simulation.mjs';
function setup(){
 const p={id:'p',hero:'wanderer-magican',hp:30,x:0,y:0,input:{aimX:1,aimY:0},face:1},r={stage:1,players:[p],troops:[],enemies:[],zones:[],events:[]},hits=[];
 const ctx={id:()=>String(r.events.length),stats:()=>({hp:100,power:100}),fx:e=>r.events.push(e),damage:(e,n)=>{e.hp-=n;hits.push(e.id);},status:(e,s)=>Object.assign(e,{slow:s.slow}),heal:(u,n,max)=>{u.hp=Math.min(max,u.hp+n);}};
 return {p,r,ctx,hits};
}
test('Q has 20% more reach, three distinct hits, and only triple-hit targets are lifted',()=>{
 const {p,r,ctx,hits}=setup(),s=skillAtRank(skillById('frostnova'));
 assert.equal(s.radius,175*1.2);
 const a={id:'a',x:200,y:0,hp:1000},b={id:'b',x:100,y:0,hp:1000};r.enemies.push(a,b);
 castTide(r,p,s,ctx);
 for(let i=0;i<31;i++){if(i===12)b.x=400;tickTide(r,.05,ctx,true);}
 assert.equal(hits.filter(id=>id==='a').length,3);assert.equal(a.hp,805);assert.equal(a.windAirTime,.6);assert.equal(a.stun,.6);
 assert.ok(hits.filter(id=>id==='b').length<3);assert.equal(b.windAirTime,undefined);
 assert.deepEqual(r.events.filter(e=>e.type==='tide-wave').map(e=>e.wave),[1,2,3]);
});
test('E heals ten small once-per-second ticks, excludes dead/outside units, protection never stacks',()=>{
 const {p,r,ctx}=setup(),s=skillAtRank(skillById('healing-tide'));
 assert.equal(s.radius,520);assert.equal(s.duration,10);assert.equal(s.heal,.02);
 const ally={id:'ally',hp:30,maxHp:100,x:519,y:0},outside={id:'outside',hp:30,maxHp:100,x:521,y:0},dead={id:'dead',hp:0,maxHp:100,x:0,y:0};r.troops.push(ally,outside,dead);
 castTide(r,p,s,ctx);tickTide(r,.5,ctx,true);assert.equal(p.hp,30);assert.equal(tideReduction(r,p),.15);assert.equal(tideReduction(r,outside),0);
 const duplicate={...r.tideFields[0]};r.tideFields.push(duplicate);assert.equal(tideReduction(r,p),.15);r.tideFields.pop();
 for(let i=0;i<190;i++)tickTide(r,.05,ctx,true);
 assert.equal(p.hp,50);assert.equal(ally.hp,50);assert.equal(outside.hp,30);assert.equal(dead.hp,0);assert.equal(r.tideFields.length,0);assert.equal(tideReduction(r,p),0);
});
test('R uses cursor distance, clamps maximum range, works without enemies, and stage changes clear fields',()=>{
 const {p,r,ctx}=setup(),s=skillAtRank(skillById('blizzard'));
 p.input.aimDistance=180;castTide(r,p,s,ctx);assert.equal(r.skillChannels[0].center.x,180);
 p.input.aimDistance=900;castTide(r,p,s,ctx);assert.equal(r.skillChannels[1].center.x,350);
 delete p.input.aimDistance;p.input.aimX=0;p.input.aimY=-1;castTide(r,p,s,ctx);assert.equal(r.skillChannels[2].center.y,-350);
 castTide(r,p,skillAtRank(skillById('healing-tide')),ctx);r.stage=2;assert.equal(tideReduction(r,p),0);tickTide(r,.05,ctx,true);assert.equal(r.tideFields.length,0);
});
test('standing inside Thuy Duong reduces actual incoming monster attacks by 15%',()=>{
 function damage(protectedUnit){
  const r=createRoom('REDUCTION'),p=addPlayer(r,{id:'p',hero:'wanderer-magican'});
  r.phase='battle';r.wave=1;r.spawn=999;r.spawnCd=99999;
  r.enemies.push({id:'attacker',sprite:'green-slime',x:p.x+10,y:p.y,hp:1000,maxHp:1000,power:40,speed:0,range:40,cooldown:10,cd:0,healCd:99,lane:0,waypoint:1,reward:0});
  if(protectedUnit)r.tideFields=[{owner:p.id,stage:1,x:p.x,y:p.y,radius:520,time:10,clock:1,heal:.02,reduction:.15}];
  const before=p.hp;tick(r,.05,()=>.5);return before-p.hp;
 }
 assert.ok(Math.abs(damage(true)-damage(false)*.85)<1e-8);
});
