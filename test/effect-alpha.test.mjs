import test from 'node:test';
import assert from 'node:assert/strict';
import {effectAlpha,cleanEffectTexture} from '../public/effect-alpha.js';
test('faint rectangular matte is fully removed while opaque painted details survive',()=>{
 for(const alpha of [0,5,16,42,70,76])assert.equal(effectAlpha(alpha,40,76),0);
 assert.equal(effectAlpha(255,40,76),255);assert.ok(effectAlpha(180,40,76)>0);
 for(const alpha of [80,180,255]){assert.equal(effectAlpha(alpha,0,76),0);assert.equal(effectAlpha(alpha,1,76),0);assert.ok(effectAlpha(alpha,3,76)<effectAlpha(alpha,12,76));}
});
test('alpha cleanup processes every frame separately, preserves source, and caches the uploaded texture',()=>{
 const old=globalThis.document,data=new Uint8ClampedArray(16*8*4);for(let i=0;i<data.length;i+=4){data[i]=180;data[i+3]=30;}for(const x of [4,12])data[(4*16+x)*4+3]=255;
 const original=data.slice(),textures=new Map([['atlas',{getSourceImage:()=>({width:16,height:8})}]]);let uploads=0,result;
 globalThis.document={createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:data.slice()}),putImageData(p){result=p.data;}})})};
 const s={textures:{exists:k=>textures.has(k),get:k=>textures.get(k),addCanvas(k,c){uploads++;textures.set(k,c);}}};
 try{const key=cleanEffectTexture(s,'atlas',{columns:2,rows:1,matteFloor:76});assert.equal(cleanEffectTexture(s,'atlas',{columns:2,rows:1,matteFloor:76}),key);assert.equal(uploads,1);assert.deepEqual(data,original);for(const x of [0,7,8,15])assert.equal(result[(4*16+x)*4+3],0);for(const x of [4,12])assert.equal(result[(4*16+x)*4+3],255);}finally{globalThis.document=old;}
});
