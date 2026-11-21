import test from 'node:test';import assert from 'node:assert/strict';
import {MovementTimeline,predictLocal} from '../public/movement-timeline.js';import {move,canStand} from '../public/shared-movement.js';
const map={width:1000,height:1000,base:{x:800,y:800},props:[],environment:[]};
const hero={id:'p',x:200,y:200,hp:100,stats:{speed:100},moving:true};
const packet=(t,x,stage=1)=>({stage,serverTime:t,players:[{...hero,x}],enemies:[],troops:[]});
test('remote interpolation uses simulation time despite uneven delivery and never reverses',()=>{
 const line=new MovementTimeline();line.push(packet(0,200),0);line.push(packet(50,205),70);line.push(packet(100,210),110);
 assert.ok(Math.abs(line.target(hero,125).x-202.5)<.1);assert.ok(Math.abs(line.target(hero,150).x-205)<.1);line.push(packet(150,215),200);assert.ok(Math.abs(line.target(hero,200).x-210)<.1);assert.ok(Math.abs(line.target(hero,230).x-213)<.1);assert.ok(Math.abs(line.target(hero,1000).x-215)<.1);
 line.push(packet(0,700,2),1100);assert.ok(Math.abs(line.target(hero,1100).x-700)<.1);
});
test('local movement responds before next packet and stops predicting during disconnect or stun',()=>{
 const obj={};assert.ok(predictLocal(obj,hero,{x:1,y:0},16,map,16,0,0).x>200);
 const x=obj.predicted.x;predictLocal(obj,hero,{x:0,y:0},16,map,32,0,0);assert.equal(obj.predicted.x,x);
 predictLocal(obj,hero,{x:1,y:0},16,map,500,0,0);assert.equal(obj.predicted.x,x);
 assert.equal(predictLocal(obj,{...hero,stun:1},{x:1,y:0},16,map,516,500,500).x,hero.x);
});
test('shared movement preserves normalized diagonal speed and blocks tree roots',()=>{
 const a={...hero},b={...hero};move(a,220,200,100,.05,map);move(b,200+20/Math.SQRT2,200+20/Math.SQRT2,100,.05,map);assert.ok(Math.abs(Math.hypot(a.x-200,a.y-200)-Math.hypot(b.x-200,b.y-200))<1e-8);
 assert.equal(canStand(map,800,800),false);const blocked={...hero,x:640,y:800};for(let i=0;i<40;i++)move(blocked,blocked.x+20,800,100,.05,map);assert.ok(blocked.x<643);
});
test('prediction converges to authority after input stops',()=>{
 const obj={};let u={...hero};for(let n=0;n<120;n++){if(n%3===0)u={...hero};predictLocal(obj,u,{x:0,y:0},1000/60,map,n*1000/60,n*1000/60,n*1000/60);}assert.equal(obj.predicted.x,200);
});
