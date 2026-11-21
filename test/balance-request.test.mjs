import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {SKILLS,skillAtRank} from '../public/skills.js';import {VANGUARD} from '../public/vanguard-config.js';import {PALADIN} from '../public/paladin-config.js';import {stats} from '../simulation.mjs';import {HEROES} from '../public/content.js';
const at=(id,rank)=>skillAtRank(SKILLS.find(s=>s.id===id),rank);
test('requested E rank-10 duration, cooldown and uptime limits',()=>{
 for(const [id,duration,cooldown]of [['bulwark',6,10.5],['healing-tide',6,10.5],['assassin-veil',3,7.5],['venom',4,7.5],['fury',7,11.5],['blood-rage',7,12.5],['fallen-aura',7,13.5],['wind-guard',6,11.5]]){const s=at(id,10);assert.equal(s.duration,duration,id);assert.equal(s.cooldown,cooldown,id);assert.ok(duration/cooldown<=.61,id);}
 assert.equal(at('holy-aura',10).cooldown,11.5);assert.equal(PALADIN.aura.duration+9*PALADIN.aura.durationStep,6);assert.equal(at('bulwark',10).shield,.85);assert.equal(at('fury',10).haste,.66);assert.equal(at('fury',10).lifesteal,.33);
});
test('all requested damage zones stay within cooldown; R durations and sword swap match',()=>{
 for(const id of ['flamefield','tempest','blizzard','wind-storm','arrow-rain']){const s=SKILLS.find(s=>s.id===id);for(let n=1;n<=s.maxRank;n++)assert.ok(at(id,n).duration<=at(id,n).cooldown,id);assert.equal(at(id,s.maxRank).duration,8,id);}
 assert.equal(VANGUARD.giant.duration+5*VANGUARD.giant.durationStep,60);assert.ok(60/(60+at('vanguard-giant',6).cooldown)<=.6);for(let n=1;n<=10;n++)assert.equal(at('windstep',n).cooldown,4);
 assert.equal(at('chain-lightning',10).mult,3.689);assert.equal(at('chain-lightning',10).targets,8);assert.equal(at('thunderstrike',10).cooldown,6.25);assert.equal(at('wind-dash',10).mult,6.9);
});
test('all unmodified skills preserve every numerical output at every rank',()=>{
 const changed=new Set(['bulwark','healing-tide','assassin-veil','venom','fury','blood-rage','fallen-aura','holy-aura','wind-guard','flamefield','chain-lightning','thunderstrike','wind-dash','tempest','blizzard','wind-storm','arrow-rain','windstep']);
 const before=JSON.parse(readFileSync(new URL('./fixtures/balance-before-2026-11-21.json',import.meta.url)));for(const s of before)if(!changed.has(s.id))for(const old of s.ranks){const now=at(s.id,old.rank);for(const [k,v]of Object.entries(old))if(typeof v==='number')assert.equal(now[k],v,`${s.id} rank ${old.rank} ${k}`);}
});
test('exporter player class produces correct paladin and fallen base stats',()=>{
 const make=id=>({hero:id,classId:HEROES.find(h=>h.id===id).classId,level:20,upHP:0,upPower:0,upArmor:0,upHaste:0});assert.equal(stats(make('knight-2')).hp,1110);assert.equal(stats(make('knight-2')).armor,17);assert.equal(stats(make('knight-3')).power,112);
});
