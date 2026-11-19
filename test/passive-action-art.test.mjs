import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {passiveActionFor,playPassiveAction,preloadPassiveActions,PASSIVE_ACTIONS} from '../public/passive-action-art.js';
import {PASSIVE_ACTION_LAYOUT} from '../public/passive-action-layout.js';
import {buildSkillPreview} from '../scripts/build-skill-previews.mjs';
test('passive actions use actual proc flags and exact stack/health thresholds',()=>{
 const base={hp:100,hero:'warrior-1',mastery:2,warStacks:4};assert.equal(passiveActionFor(base,'attack'),null);assert.equal(passiveActionFor({...base,warStacks:5},'attack'),'berserker');assert.equal(passiveActionFor({...base,warStacks:5},'idle'),null);
 const r={hero:'warrior-2',hp:14,stats:{hp:100},mastery:2};assert.equal(passiveActionFor(r,'attack'),'ravager');assert.equal(passiveActionFor({...r,hp:15},'attack'),null);
 for(const kind of PASSIVE_ACTIONS){const u={hero:'knight-1',hp:100,passivePose:{kind,time:.2}};assert.equal(passiveActionFor(u,'idle'),kind);assert.equal(passiveActionFor({...u,stun:1},'attack'),null);assert.equal(passiveActionFor({...u,hp:0},'attack'),null);assert.equal(passiveActionFor({...u,castAnim:.5},'attack'),null);}
});
test('healing passive actually sends water to an injured ally and critical health preview uses heavy attack',()=>{
 const water=buildSkillPreview('wanderer-magican','P'),streams=water.frames.flatMap(f=>f.events).filter(e=>e.type==='passive-action-fx'&&e.action==='heal-water');assert.ok(streams.length);assert.ok(streams.every(e=>e.sourceId!==e.targetId&&Math.hypot(e.tx-e.x,e.ty-e.y)>0));
 const blood=buildSkillPreview('warrior-2','P');assert.ok(blood.frames.some(f=>f.players[0].passivePose?.kind==='ravager'));
});
test('all body action atlases have alpha and scale consistently at normal/max level',()=>{
 assert.ok(Object.keys(PASSIVE_ACTION_LAYOUT).length>=22);
 const tx=new Map(),s={time:{now:0},textures:{exists:k=>tx.has(k),get:k=>tx.get(k)},load:{image(k,url){const b=readFileSync(new URL('../public'+url,import.meta.url));assert.equal(b[25],6);const frames=new Set();tx.set(k,{getSourceImage:()=>({width:b.readUInt32BE(16),height:b.readUInt32BE(20)}),has:n=>frames.has(n),add(n){frames.add(n);}});}}};preloadPassiveActions(s);
 for(const id of PASSIVE_ACTIONS)for(const level of [1,16]){const sprite={anims:{stop(){}},setTexture(k,n){this.key=k;this.frame=n;return this;},setOrigin(){return this;},setScale(n){assert.ok(n>0&&Number.isFinite(n));return this;},setFlipX(){return this;}};const obj={sprite,size:70},u={hero:'knight-1',hp:100,level,passivePose:{kind:id,time:.55,duration:.55,serial:1}};s.time.now=0;assert.ok(playPassiveAction(s,u,obj,'attack'));assert.ok(sprite.key.includes(id+(level===16&&PASSIVE_ACTION_LAYOUT[id+'-max']?'-max':'')));s.time.now=500;playPassiveAction(s,u,obj,'attack');assert.equal(sprite.frame,5);}
});
