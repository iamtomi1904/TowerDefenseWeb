import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preloadPassiveActionFX,createPassiveActionFX,updatePassiveActionFX,PASSIVE_FX_PROFILES} from '../public/passive-action-fx.js';
function scene(){
 const textures=new Map(),images=[];
 const s={actorObjects:new Map(),textures:{exists:k=>textures.has(k),get:k=>textures.get(k)},load:{image(key,url){const b=readFileSync(new URL('../public'+url,import.meta.url));assert.equal(b[25],6);const frames=new Map();textures.set(key,{getSourceImage:()=>({width:b.readUInt32BE(16),height:b.readUInt32BE(20)}),has:n=>frames.has(n),add(n,_,x,y,w,h){assert.ok(x>=0&&y>=0&&x+w<=b.readUInt32BE(16)&&y+h<=b.readUInt32BE(20));frames.set(n,{x,y,w,h});}});}},add:{image(x,y,key,frame){const im={x,y,key,frame};for(const fn of ['setDepth','setOrigin','setDisplaySize','setRotation','setAlpha','setBlendMode'])im[fn]=(...args)=>{im[fn+'Value']=args;return im;};im.setTexture=(key,frame)=>{im.key=key;im.frame=frame;return im;};im.setPosition=(x,y)=>{im.x=x;im.y=y;return im;};images.push(im);return im;}}};preloadPassiveActionFX(s);return s;
}
test('every passive has distinct bounded painted frames including full-level effect scale',()=>{
 const s=scene();for(const [action,[sheet,row]]of Object.entries(PASSIVE_FX_PROFILES)){
  const e={type:'passive-action-fx',action,x:10,y:20,tx:110,ty:20,level:1},v={e,painted:createPassiveActionFX(s,e)};assert.ok(v.painted);const frames=new Set();
  for(const t of [0,.18,.35,.52,.7,.87]){updatePassiveActionFX(s,v,t);frames.add(v.painted.image.frame);assert.equal(Math.floor(v.painted.image.frame/6),row);assert.equal(v.painted.image.key,'passive-impact:'+sheet);}
  assert.equal(frames.size,6);updatePassiveActionFX(s,v,.5);const base=v.painted.image.setDisplaySizeValue[0];e.level=16;updatePassiveActionFX(s,v,.5);assert.ok(v.painted.image.setDisplaySizeValue[0]>base);updatePassiveActionFX(s,v,1);assert.equal(v.painted.image.setAlphaValue[0],0);
 }
});
test('water travels from caster to ally and shield impact uses ground contact',()=>{
 const s=scene();s.actorObjects.set('a',{sprite:{x:20,y:90},groundY:90});s.actorObjects.set('b',{sprite:{x:140,y:120},groundY:120});
 const e={type:'passive-action-fx',action:'heal-water',sourceId:'a',targetId:'b',x:0,y:0,tx:1,ty:1},v={e,painted:createPassiveActionFX(s,e)};
 updatePassiveActionFX(s,v,0);assert.equal(v.painted.image.x,20);updatePassiveActionFX(s,v,.82);assert.equal(v.painted.image.x,140);assert.equal(v.painted.image.y,96);
 const hit={e:{...e,action:'guardian'}};hit.painted=createPassiveActionFX(s,hit.e);updatePassiveActionFX(s,hit,.5);assert.equal(hit.painted.image.y,117);assert.equal(hit.painted.image.setRotationValue[0],0);
});

test('one proc emits one contact effect even when the same attack hits several enemies',async()=>{
 const {passivePose}=await import('../passives.mjs');const r={events:[]},p={id:'tank',x:0,y:0,attackCount:3},target={id:'enemy',x:20,y:0};
 passivePose(r,p,'guardian');assert.equal(r.events.length,0);
 passivePose(r,p,'guardian',target);passivePose(r,p,'guardian',{...target,id:'second'});assert.equal(r.events.length,1);
 p.attackCount=6;passivePose(r,p,'guardian',target);assert.equal(r.events.length,2);
});
