import test from 'node:test';import assert from 'node:assert/strict';
import {movementBlend,settlePosition,visuallyMoving,followGround,renderMovementTarget} from '../public/movement-render.js';
test('position smoothing behaves consistently at 30, 60 and 144 FPS on both axes',()=>{
 for(const local of [false,true]){
  const values=[30,60,144].map(fps=>{let x=0;for(let i=0;i<fps*.5;i++)x=settlePosition(x,100,movementBlend(1000/fps,local));return x;});
  assert.ok(Math.max(...values)-Math.min(...values)<.35);
 }
});
test('local corrections settle quickly and walking ends only when the feet stop',()=>{
 const obj={sprite:{x:10},groundY:20},u={x:10,y:30,moving:false};assert.equal(visuallyMoving(u,obj),true);
 for(let i=0;i<20;i++)obj.groundY=settlePosition(obj.groundY,u.y,movementBlend(1000/60,true));
 assert.equal(obj.groundY,u.y);assert.equal(visuallyMoving(u,obj),false);
 assert.equal(settlePosition(30,30,movementBlend(100)),30);
});
test('camera follows the ground with no second smoothing pass or jump-height displacement',()=>{
 let follows=0;const anchor={setPosition(x,y){this.x=x;this.y=y;}},scene={add:{zone:()=>anchor},cameras:{main:{startFollow(target,round,x,y){assert.equal(target,anchor);assert.equal(x,1);assert.equal(y,1);follows++;}}}};
 const obj={sprite:{x:80,y:140},groundY:250};followGround(scene,obj);assert.equal(anchor.y,250);
 obj.sprite.y=30;followGround(scene,obj);assert.equal(anchor.y,250);assert.equal(follows,1);
 obj.groundY=260;followGround(scene,obj);assert.equal(anchor.y,260);
});

test('20 Hz snapshots produce continuous movement targets rather than flat 50ms steps',()=>{
 const obj={},a={x:0,y:0,moving:true},b={x:10,y:5,moving:true},c={x:20,y:10,moving:true};
 renderMovementTarget(obj,a,0);renderMovementTarget(obj,b,50);
 const before=renderMovementTarget(obj,b,99),after=renderMovementTarget(obj,c,100);
 assert.ok(Math.abs(after.x-before.x)<.3);assert.ok(Math.abs(after.y-before.y)<.2);
 assert.equal(renderMovementTarget(obj,c,125).x,25);
});
test('visual continuation is bounded during packet loss, and disabled on stop, jumps and teleports',()=>{
 const obj={};renderMovementTarget(obj,{x:0,y:0,moving:true},0);
 const b={x:10,y:10,moving:true};renderMovementTarget(obj,b,50);
 assert.deepEqual(renderMovementTarget(obj,b,5000),{x:20,y:20});
 const stop={x:15,y:15,moving:false};renderMovementTarget(obj,stop,5050);assert.deepEqual(renderMovementTarget(obj,stop,5080),{x:15,y:15});
 const jump={x:20,y:20,moving:true,guardianR:{}};renderMovementTarget(obj,jump,5100);assert.deepEqual(renderMovementTarget(obj,jump,5140),{x:20,y:20});
 const warp={x:1000,y:1000,moving:true};renderMovementTarget(obj,warp,5150);assert.deepEqual(renderMovementTarget(obj,warp,5180),{x:1000,y:1000});
});

test('network sample timing is independent of which render frame first draws the snapshot',()=>{
 const obj={};renderMovementTarget(obj,{x:0,y:0,moving:true},16,0);
 const b={x:10,y:0,moving:true};assert.equal(renderMovementTarget(obj,b,66,50).x,13.2);
 const c={x:20,y:0,moving:true};assert.equal(renderMovementTarget(obj,c,115,100).x,23);
});
