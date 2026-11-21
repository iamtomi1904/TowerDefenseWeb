import test from 'node:test';import assert from 'node:assert/strict';import {beginPropStream,registerStreamProp,updatePropStream,clearPropStream} from '../public/prop-stream.js';
function scene(){let created=0,destroyed=0;const display=new Set(),s={children:{add:im=>display.add(im),remove:im=>display.delete(im)},add:{image(){created++;const im={destroy(){destroyed++;display.delete(im);}};for(const key of ['setTexture','setPosition','setOrigin','setScale','setFlipX','setRotation','setAlpha','setDepth','setVisible','setTint','clearTint'])im[key]=function(...v){this[key+'Value']=v;return this;};display.add(im);return im;}}};return {s,display,get created(){return created;},get destroyed(){return destroyed;}};}
const view=x=>[{x,y:0,right:x+800,bottom:600}];
test('map records create no sprites until nearby; camera return reuses images with correct depth',()=>{
 const fixture=scene(),{s,display}=fixture;beginPropStream(s);const records=[];for(let i=0;i<4000;i++)records.push(registerStreamProp(s,{x:i*40,y:200,key:'tree',width:100,height:150,scale:1}));assert.equal(fixture.created,0);
 updatePropStream(s,view(0));assert.ok(fixture.created<50);const count=fixture.created;updatePropStream(s,view(0));assert.equal(fixture.created,count);updatePropStream(s,view(10000));assert.equal(records[0].obj,null);assert.ok(s.propStream.free.length<=128);updatePropStream(s,view(0));assert.ok(records[0].obj);assert.deepEqual(records[0].obj.setDepthValue,[200]);assert.ok(fixture.created<100);clearPropStream(s);assert.equal(display.size,0);assert.equal(fixture.created,fixture.destroyed);
});
test('multiple viewports retain tall trees and idle pool has a fixed upper bound',()=>{
 const f=scene();beginPropStream(f.s);const tall=registerStreamProp(f.s,{x:100,y:1000,key:'tall',width:100,height:700,scale:1});for(let i=0;i<300;i++)registerStreamProp(f.s,{x:100,y:100,key:'bush',width:20,height:20,scale:1});
 updatePropStream(f.s,view(0));assert.ok(tall.obj);updatePropStream(f.s,[]);assert.equal(f.s.propStream.free.length,128);assert.equal(f.created-f.destroyed,128);clearPropStream(f.s);assert.equal(f.created,f.destroyed);
});

test('pooled biome props reset tint and are all destroyed when maps change',()=>{
 const f=scene();beginPropStream(f.s);const a=registerStreamProp(f.s,{x:100,y:100,key:'ice',width:100,height:100,scale:1,tint:0xd0eef7});const b=registerStreamProp(f.s,{x:10000,y:100,key:'rock',width:100,height:100,scale:1});
 updatePropStream(f.s,view(0));assert.deepEqual(a.obj.setTintValue,[0xd0eef7]);const im=a.obj;updatePropStream(f.s,view(10000));assert.equal(b.obj,im);assert.ok(im.clearTintValue);beginPropStream(f.s);assert.equal(f.created,f.destroyed);assert.equal(f.display.size,0);
});
