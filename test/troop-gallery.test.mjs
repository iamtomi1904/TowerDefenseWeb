import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('troop gallery loads nine new troops, compares original silhouettes and replays every action',async()=>{
 const elements=new Map(),textures=new Map(),animations=new Map();let scene;
 const element=id=>{if(!elements.has(id))elements.set(id,{value:id==='#troop-action'?'idle':'',checked:id==='#troop-compare',textContent:''});return elements.get(id);};
 const display=()=>{const o={frame:{name:0},anims:{currentAnim:null,timeScale:1,stop(){}},plays:0};for(const m of ['setOrigin','setDepth','setScale','setPosition','setFlipX','setVisible'])o[m]=(...args)=>{o[m+'Args']=args;return o;};o.play=key=>{assert.ok(animations.has(key));o.anims.currentAnim={key};o.plays++;return o;};return o;};
 const original={document:globalThis.document,window:globalThis.window,fetch:globalThis.fetch,Phaser:globalThis.Phaser};
 Object.assign(globalThis,{document:{querySelector:element},window:{addEventListener(){}},fetch:async path=>({json:async()=>JSON.parse(readFileSync(new URL('../public'+path,import.meta.url)))}),Phaser:{AUTO:0,Game:class{
  constructor(config){scene={...config.scene,load:{on(){},image(k,path){const b=readFileSync(new URL('../public'+path,import.meta.url)),frames=new Set();textures.set(k,{getSourceImage:()=>({width:b.readUInt32BE(16),height:b.readUInt32BE(20)}),has:n=>frames.has(n),add:n=>frames.add(n)});},spritesheet(){}},textures:{exists:k=>textures.has(k),get:k=>textures.get(k)},anims:{create:a=>animations.set(a.key,a)},add:{grid:display,text:display,sprite:display}};scene.preload();scene.create();}
 }}});
 try{
  await import('../public/troop-gallery.js?regression');assert.equal(scene.actors.length,9);scene.update();assert.ok(scene.actors.every(a=>a.sprite.anims.currentAnim.key.endsWith(':idle')));
  element('#troop-action').value='attack';element('#troop-action').onchange();scene.update();assert.ok(scene.actors.every(a=>a.sprite.anims.currentAnim.key.endsWith(':attack')));
  element('#troop-size').checked=true;element('#troop-flip').checked=true;scene.update();assert.ok(scene.actors.every(a=>a.size===38&&a.sprite.setFlipXArgs[0]));
  element('#troop-action').value='dead';element('#troop-action').onchange();scene.update();assert.ok(scene.actors.every(a=>a.sprite.anims.currentAnim.key.endsWith(':dead')));
  const before=scene.actors[0].sprite.plays;element('#troop-replay').onclick();scene.update();assert.ok(scene.actors[0].sprite.plays>before);
 }finally{Object.assign(globalThis,original);}
});
