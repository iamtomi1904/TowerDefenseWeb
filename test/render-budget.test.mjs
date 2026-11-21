import test from 'node:test';
import assert from 'node:assert/strict';
import {renderViews,visibleBox,unitInView,effectInView,setRenderDormant,prepareEffectBudget,secondaryVisible} from '../public/render-budget.js';
import {updateVFX} from '../public/effects.js';
const camera=(x=0)=>({visible:true,worldView:{x,y:0,width:800,height:600}});
function image(visible=true){return {visible,scene:{},updates:0,setVisible(v){this.visible=v;return this;},destroy(){this.destroyed=true;},clear(){this.updates++;return this;}};}
test('camera fallback and multiple viewports preserve intersecting units',()=>{
 assert.equal(renderViews({}),null);assert.ok(visibleBox(null,10000,10000));
 const views=renderViews({cameras:{cameras:[camera(),camera(3000)]}});
 assert.ok(unitInView(views,{id:'b',x:3200,y:100},'a'));
 assert.ok(!unitInView(views,{id:'b',x:1800,y:100},'a'));
 assert.ok(unitInView(views,{id:'a',x:1800,y:100},'a'));
 assert.ok(unitInView(views,{id:'b',x:400,y:850},'a')); // tall actor overlaps
});
test('bounds retain large overlapping effects, projectile paths and meteor tails',()=>{
 const s={cameras:{main:camera()}};
 assert.ok(effectInView(s,{e:{x:950,y:300,radius:205}}));
 assert.ok(effectInView(s,{e:{x:2000,y:300,tx:400,ty:300}}));
 assert.ok(effectInView(s,{fall:true,e:{x:1200,y:1200,radius:205}}));
 assert.ok(!effectInView(s,{e:{x:3000,y:3000,radius:205}}));
});
test('dormancy hides nested owned images once and restores intentional visibility',()=>{
 const a=image(),b=image(false),c=image();let pauses=0,resumes=0;
 a.anims={isPaused:false,pause(){pauses++;},resume(){resumes++;}};
 const o={sprite:a,painted:{nodes:[{image:b}]},extras:new Map([['c',c]])};
 assert.ok(setRenderDormant(o,true));assert.equal(a.visible,false);assert.equal(c.visible,false);
 assert.equal(setRenderDormant(o,true),false);assert.equal(pauses,1);
 setRenderDormant(o,false);assert.equal(a.visible,true);assert.equal(b.visible,false);assert.equal(c.visible,true);assert.equal(resumes,1);
});
test('secondary budgets share evenly, exclude offscreen effects and restore full quality',()=>{
 const s={cameras:{main:camera()},liveVFX:[]};
 const effect=(x=100)=>({e:{x,y:100},age:0,duration:5,painted:{secondaryCount:244}});
 s.liveVFX=[effect(),effect(),effect(),effect(5000)];prepareEffectBudget(s);
 assert.equal(s.secondaryFXRatio,384/732);
 const count=Array.from({length:244},(_,i)=>secondaryVisible(i,s.secondaryFXRatio)).filter(Boolean).length;
 assert.ok(count>=127&&count<=128);
 s.liveVFX=[effect()];prepareEffectBudget(s);assert.equal(s.secondaryFXRatio,1);
});
test('offscreen VFX age without drawing, resume current age and expire with cleanup',()=>{
 const g=image(),s={cameras:{main:camera()},liveVFX:[{e:{x:5000,y:5000},g,kind:'unused',age:0,duration:5}]};
 const v=s.liveVFX[0];updateVFX(s,1);assert.equal(v.age,1);assert.equal(g.updates,0);assert.equal(g.visible,false);
 s.cameras.main.worldView={x:4800,y:4800,width:800,height:600};updateVFX(s,1);
 assert.equal(v.age,2);assert.equal(g.visible,true);assert.equal(g.updates,1);
 s.cameras.main.worldView=camera().worldView;updateVFX(s,4);
 assert.equal(s.liveVFX.length,0);assert.equal(g.destroyed,true);assert.equal(g.updates,1);
});
