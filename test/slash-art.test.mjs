import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawSignatureSlash,createSlashVisual,updateSlashVisual,destroySlashVisual,slashFrame} from '../public/slash-art.js';
import {renderEvent,updateVFX,clearVFX} from '../public/effects.js';
const atlas=readFileSync(new URL('../public/assets/combat/signature-slashes.png',import.meta.url)),atlasWidth=atlas.readUInt32BE(16),atlasHeight=atlas.readUInt32BE(20);
function scene(){
 const frames=new Map(),images=[];const texture={getSourceImage:()=>({width:atlasWidth,height:atlasHeight}),has:id=>frames.has(id),add:(id,_source,x,y,w,h)=>{assert.ok(x>=0&&y>=0&&x+w<=atlasWidth&&y+h<=atlasHeight);frames.set(id,{x,y,w,h});}};
 const s={images,frames,textures:{exists:key=>key==='signature-slashes',get:()=>texture},add:{}};
 s.add.image=()=>{const im={destroyed:false,destroy(){this.destroyed=true;}};for(const key of ['setDepth','setOrigin','setFrame','setPosition','setDisplaySize','setRotation','setFlipY','setAlpha'])im[key]=(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));im[key+'Value']=args;return im;};images.push(im);return im;};
 s.add.graphics=()=>{const g={rects:[],fillStyle(c,a){assert.ok(Number.isFinite(c)&&Number.isFinite(a));return g;},fillRect(...args){assert.ok(args.every(Number.isFinite));g.rects.push(args);return g;},setDepth(){return g;},clear(){return g;},destroy(){}};return g;};return s;
}
test('each slash family has a distinct pixel silhouette without arc drawing',()=>{
 const profiles=['katana','dual','blood','axe','execution','dual-finish','wind','holy','dark','dagger'],signatures=[];
 for(const profile of profiles){const g=scene().add.graphics();drawSignatureSlash(g,{profile,x:250,y:200,radius:85,angle:.3},.4);assert.ok(g.rects.length>0);signatures.push(JSON.stringify(g.rects));}
 assert.ok(new Set(signatures).size>=8);
});
test('six atlas rows stay in bounds and use six chronological frames',()=>{
 assert.ok(atlasWidth>1000&&atlasHeight>1000);
 const s=scene();for(const action of ['heavy-cut','dual-cut','blood-cut','axe-cut','sword-finish'])for(const dual of [false,true]){
  const e={action,dual,x:100,y:150,radius:80,angle:-.5},v=createSlashVisual(s,e);assert.ok(v);for(const t of [0,.2,.4,.6,.8,1])updateSlashVisual(v,e,t);destroySlashVisual(v);assert.equal(v.image.destroyed,true);
 }
 assert.equal(s.frames.size,36);assert.equal(slashFrame(1),5);assert.equal(slashFrame(-1),0);
});
test('atlas visuals expire, clear on map change, and release capped effects',()=>{
 const s=scene(),seen=new Set();renderEvent(s,{id:1,type:'martial-vfx',action:'heavy-cut',x:100,y:100,radius:80,duration:.4},seen);
 updateVFX(s,.2);assert.equal(s.images[0].destroyed,false);updateVFX(s,.3);assert.equal(s.images[0].destroyed,true);
 for(let i=0;i<181;i++)renderEvent(s,{id:'s'+i,type:'martial-vfx',action:'dual-cut',x:100,y:100,radius:80},seen);
 assert.equal(s.liveVFX.length,180);assert.equal(s.images[1].destroyed,true);clearVFX(s);assert.ok(s.images.every(im=>im.destroyed));
});
