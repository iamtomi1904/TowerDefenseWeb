import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BIOMES} from '../public/world-biomes.js';
import {BIOME_ART_IDS,biomeArtwork,preloadBiomeArt,biomePattern} from '../public/biome-art.js';
import {drawEnvironmentPatch} from '../public/environment-art.js';
import {drawHydrology} from '../public/landscape-art.js';
test('all gameplay biomes have a real painted material shared by the preloader and catalogue',()=>{
 assert.deepEqual([...BIOME_ART_IDS].sort(),Object.keys(BIOMES).sort());const loaded=[];
 preloadBiomeArt({load:{image(key,url){const b=readFileSync(new URL('../public'+url,import.meta.url));assert.equal(b.toString('ascii',1,4),'PNG');assert.ok(b.readUInt32BE(16)>=512);assert.ok(b.readUInt32BE(20)>=512);loaded.push(key);}}});assert.equal(new Set(loaded).size,Object.keys(BIOMES).length);assert.equal(biomeArtwork('unknown'),null);
});
test('painted regions reuse one mirrored tile per material, keep ground blending restrained and preserve fallback',()=>{
 const saved=globalThis.document;let canvases=0,draws=0;
 globalThis.document={createElement(){canvases++;return {getContext:()=>({save(){},restore(){},translate(){},scale(){},drawImage(){draws++;}})};}};
 try{
  const scene={textures:{exists:k=>k.startsWith('biome-material:'),get:()=>({getSourceImage:()=>({width:1024,height:1024})})}},pattern={painted:true},alphas=[];
  const c=new Proxy({globalAlpha:1,createPattern:()=>pattern,createRadialGradient:()=>({addColorStop(){}}),fill(){if(this.fillStyle===pattern)alphas.push(this.globalAlpha);}},{get(o,k){return k in o?o[k]:()=>{};}});
  assert.equal(biomePattern(c,scene,'dense'),pattern);assert.equal(biomePattern(c,scene,'dense'),pattern);assert.equal(canvases,1);assert.equal(draws,4);
  drawEnvironmentPatch(c,scene,{type:'dense',x:150,y:100,rx:120,ry:80});assert.equal(canvases,1);assert.ok(alphas.length>=3);assert.ok(alphas.every(a=>a<=.22));
  assert.equal(biomePattern(c,{},'dense'),null);drawEnvironmentPatch(c,{}, {type:'dense',x:150,y:100,rx:120,ry:80});
  for(const type of ['deep','shallow','abyss'])drawHydrology(c,scene,{id:1,rivers:[{type,points:[[0,50],[100,60],[200,50]],width:60}],bridges:[]});
 }finally{globalThis.document=saved;}
});
