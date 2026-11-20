import test from 'node:test';
import assert from 'node:assert/strict';
import {beginMoonfall,tickShadow} from '../shadow-actions.mjs';
import {moonfallPose} from '../public/moonfall-art.js';
for(const dt of [.05,.2,3])test(`moon descends, damages six times, lands once and leaves no field (${dt})`,()=>{
 const p={id:'caster',hp:100},target={id:'target',x:0,y:0,hp:10000},outside={id:'outside',x:206,y:0,hp:10000},hits=[],fx=[];
 const r={players:[p],enemies:[target,outside]},ctx={id:()=> 'moon',stats:()=>({power:100}),damage:(e,n)=>{e.hp-=n;hits.push(n)},fx:e=>fx.push(e)};
 const z=beginMoonfall(r,p,{radius:205,mult:2.8,delay:3,fallInterval:.5,fallMult:.35},{x:0,y:0},ctx);
 let last=Infinity;for(let t=0;t<3-1e-8;t+=dt){const pose=moonfallPose(z);assert.ok(pose.altitude<=last);last=pose.altitude;tickShadow(r,dt,ctx)}
 assert.equal(hits.length,7);assert.equal(target.hp,9510);assert.equal(outside.hp,10000);assert.equal(target.stun,1);assert.equal(r.shadowZones.length,0);assert.equal(fx.filter(e=>e.action==='moonfall').length,1);
 tickShadow(r,5,ctx);assert.equal(hits.length,7);assert.equal(moonfallPose({...z,elapsed:3}).altitude,0);
});
