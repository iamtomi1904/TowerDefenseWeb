import test from 'node:test';
import assert from 'node:assert/strict';
import {updateSceneryBudget,weatherParticlePlan,indexStaticScenery,updateStaticScenery} from '../public/scenery-budget.js';
const kinds=['rain','snow','wind','leaves','sand','embers','ash','motes'];
const view=(x=0)=>({x,y:0,right:x+800,bottom:600});
function prop(x,y,width=50,height=100,type='Image'){return {type,visible:true,toggles:0,getBounds(){return {x,y,width,height};},setVisible(v){this.visible=v;this.toggles++;}};}
test('one budget caps all weather layers and viewports together',()=>{
 for(const views of [1,2,4])for(const quality of [1,.6]){
  const p=weatherParticlePlan(kinds,views,1920,1080,quality),slots=[...p.values()];
  assert.ok(slots.reduce((n,s)=>n+s.count,0)<=Math.floor(160*quality));
  assert.ok(slots.every(s=>s.count>0&&s.count<=s.desired));
 }
 assert.equal(weatherParticlePlan([],1,800,600).size,0);
 assert.equal(weatherParticlePlan(kinds,0,800,600).size,0);
 const rain=weatherParticlePlan(['rain'],1,1920,1080).get('0:rain');assert.equal(rain.count,rain.desired);
});
test('a transient spike cannot change quality and recovery waits for sustained quiet',()=>{
 const s={secondaryFXRatio:.4};updateSceneryBudget(s,0);updateSceneryBudget(s,500);assert.equal(s.sceneryBudget.quality,1);
 updateSceneryBudget(s,1100);assert.equal(s.sceneryBudget.quality,.6);
 s.secondaryFXRatio=1;updateSceneryBudget(s,1200);updateSceneryBudget(s,3000);assert.equal(s.sceneryBudget.quality,.6);
 updateSceneryBudget(s,4300);assert.equal(s.sceneryBudget.quality,1);
});
test('sustained slow frames reduce cosmetic work without requiring spell effects',()=>{
 const s={};for(let t=0;t<4000;t+=34)updateSceneryBudget(s,t);assert.equal(s.sceneryBudget.quality,.6);
 for(let t=4000;t<10000;t+=16)updateSceneryBudget(s,t);assert.equal(s.sceneryBudget.quality,1);
});
test('static index culls distant objects and restores them on camera return',()=>{
 const near=prop(100,100),far=prop(5000,100),s={};indexStaticScenery(s,[near,far],[view()]);
 assert.equal(near.visible,true);assert.equal(far.visible,false);
 const toggles=near.toggles+far.toggles;updateStaticScenery(s,[view(1)]);assert.equal(near.toggles+far.toggles,toggles);
 updateStaticScenery(s,[view(4800)]);assert.equal(near.visible,false);assert.equal(far.visible,true);
 updateStaticScenery(s,[view()]);assert.equal(near.visible,true);assert.equal(far.visible,false);
 updateStaticScenery(s,[]);assert.equal(near.visible,false);
});
test('index uses whole image bounds, supports multiple cameras and preserves hidden objects',()=>{
 const tall=prop(400,-600,100,900),far=prop(5000,100),hidden=prop(50,50);hidden.visible=false;
 const graphics=prop(9000,100,50,100,'Graphics'),s={};indexStaticScenery(s,[tall,far,hidden,graphics],[view(),view(4800)]);
 assert.equal(tall.visible,true);assert.equal(far.visible,true);assert.equal(hidden.visible,false);assert.equal(graphics.visible,true);
 assert.equal(s.staticSceneryIndex.items.size,2);
});

test('offscreen scenery leaves display list and returns once without changing depth',()=>{
 const near=prop(100,100),far=prop(5000,100),list=new Set([near,far]);near.depth=100;far.depth=100;
 const s={children:{add:o=>list.add(o),remove:o=>list.delete(o)}};indexStaticScenery(s,[near,far],[view()]);assert.deepEqual([...list],[near]);
 updateStaticScenery(s,[view(4800)]);assert.deepEqual([...list],[far]);assert.equal(far.depth,100);
 updateStaticScenery(s,[]);assert.equal(list.size,0);
});
