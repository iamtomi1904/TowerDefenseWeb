import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {cleanEffectTexture} from '../public/effect-alpha.js';
import {installBattleAssetLoader} from '../public/battle-assets.js';
test('prepared texture bypasses pixel processing only for the exact recipe',()=>{
 const scene={optimizedAssets:{ice:{columns:2,rows:2,matteFloor:40,maxSize:512}},textures:{exists:key=>key.endsWith(':clean-alpha-v1')}};
 assert.equal(cleanEffectTexture(scene,'ice',{columns:2,rows:2,matteFloor:40,maxSize:512}),'ice');
 assert.equal(cleanEffectTexture(scene,'ice',{columns:2,rows:2,matteFloor:41,maxSize:512}),'ice:clean-alpha-v1');
});
test('battle loader skips unrelated hero sheets and preserves shared assets',()=>{
 const calls=[],scene={load:{once:()=>{},image:(...a)=>calls.push(a)}};
 installBattleAssetLoader(scene,{'ascended:knight-1':{url:'/baked.png'}},['knight-1']);
 scene.load.image('ascended:knight-1','/raw.png');scene.load.image('refresh:fire-wizard','/fire.png');scene.load.image('terrain','/grass.png');
 assert.deepEqual(calls,[['ascended:knight-1','/baked.png'],['terrain','/grass.png']]);
});
test('all generated textures exist, have alpha, and fit their recipe bounds',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../public/optimized-assets.json',import.meta.url)));
 assert.ok(Object.keys(manifest).length>=100);
 for(const info of Object.values(manifest)){
 assert.match(info.url,/^\/assets\/optimized\/[a-f0-9]{20}\.png$/);
 const meta=await sharp(fileURLToPath(new URL('../public'+info.url,import.meta.url))).metadata();
 assert.equal(meta.hasAlpha,true);if(info.maxSize)assert.ok(Math.max(meta.width,meta.height)<=info.maxSize);
 }
});

test('baked ritual and moon assets include all required runtime frames',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../public/optimized-assets.json',import.meta.url)));
 for(let n=0;n<4;n++)assert.equal(manifest['ritual-actor:'+n].frames,6);
 assert.equal(manifest['moon-animated-atlas:clean-alpha-v1'].columns,2);
 assert.equal(manifest['moon-animated-atlas:clean-alpha-v1'].rows,2);
 for(const key of ['moonfall:moon','moonfall:corona','moonfall:impact','moonfall:cracks','moon-air-thin:clean-alpha-v1','moon-sigil:clean-alpha-v1','katana-summon:blade','katana-summon:circle','katana-summon:impact','katana-summon:light'])assert.ok(manifest[key]?.extra,key);
});
import {battleTextureNeeded} from '../public/battle-assets.js';
test('class-specific textures load only for participating heroes; shared effects remain available',()=>{
 for(const hero of ['knight-1','warrior-2','samurai-commander','warrior-1','wanderer-magican']){
 const pairs=[['guardian-fx','knight-1'],['ravager-redesign','warrior-2'],['katana-forms','samurai-commander'],['warrior-windup','warrior-1'],['arctic-windup','wanderer-magican']];
 for(const [key,owner]of pairs)assert.equal(battleTextureNeeded(key,[hero]),owner===hero);
 assert.ok(battleTextureNeeded('action-fx:lightning-bolt',[hero]));assert.ok(battleTextureNeeded('meteor-painted',[hero]));
 }
 assert.ok(battleTextureNeeded('guardian-fx',null));assert.ok(battleTextureNeeded('guardian-fx',['knight-1','warrior-2']));
});
