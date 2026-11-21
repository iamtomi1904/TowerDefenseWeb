import test from 'node:test';
import assert from 'node:assert/strict';
import {BattleMetrics,createPerformanceHUD} from '../public/performance-hud.js';
test('FPS measures actual rendered frames and resets after tab visibility changes',()=>{
 const m=new BattleMetrics();for(let i=0;i<=60;i++)m.frame(i*1000/60);assert.equal(m.fps,60);
 m.resetFrames();for(let i=0;i<=15;i++)m.frame(2000+i*1000/15);assert.equal(m.fps,15);
 m.resetFrames();m.frame(20000);assert.equal(m.fps,null);
});
test('ping matches the outstanding probe and ignores unrelated or stale responses',()=>{
 const m=new BattleMetrics(),probe=m.probe(100);assert.equal(probe.type,'ping');assert.equal(m.probe(200),null);
 assert.equal(m.receive({type:'pong',id:probe.id+1},125),false);
 assert.equal(m.receive({type:'pong',id:probe.id},128),true);assert.match(m.text(130),/Ping 28 ms/);
 assert.match(m.text(6000),/Ping —/);assert.match(m.text(130,false),/Ping —/);
});
test('lost probes retry at a bounded rate and never show a late reply as current ping',()=>{
 const m=new BattleMetrics(),a=m.probe(0);assert.equal(m.probe(3000),null);
 const b=m.probe(5001);assert.notEqual(a.id,b.id);assert.equal(m.receive({type:'pong',id:a.id},5010),false);
 assert.equal(m.receive({type:'pong',id:b.id},5020),true);assert.equal(m.ping,19);
});
test('HUD throttles DOM updates and socket probes and removes its visibility handler on shutdown',()=>{
 const original=globalThis.document,listeners=new Map(),sent=[];let paints=0,cleanup;
 const label={set textContent(v){paints++;this.text=v;}};
 globalThis.document={hidden:false,getElementById:()=>label,addEventListener:(e,f)=>listeners.set(e,f),removeEventListener:(e,f)=>{if(listeners.get(e)===f)listeners.delete(e);}};
 try{
  const hud=createPerformanceHUD({events:{once:(e,f)=>cleanup=f}},{readyState:1,send:m=>sent.push(JSON.parse(m))});
  for(let i=0;i<=240;i++)hud.update(i*1000/60);
  assert.ok(paints<=9);assert.equal(sent.length,1);hud.receive({type:'pong',id:sent[0].id},4001);
  hud.update(5001);assert.equal(sent.length,2);cleanup();assert.equal(listeners.size,0);
 }finally{globalThis.document=original;}
});
