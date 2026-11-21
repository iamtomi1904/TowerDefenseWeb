import test from 'node:test';import assert from 'node:assert/strict';
import {emitFloatingText,updateFloatingTexts,clearFloatingTexts} from '../public/floating-text-pool.js';
test('text pool stays bounded, reuses objects, resets style and clears across maps',()=>{
 let created=0;const scene={add:{text(){created++;const t={};for(const k of ['setOrigin','setDepth','setText','setFontSize','setColor','setPosition','setAlpha','setVisible'])t[k]=function(...a){this[k+'Value']=a;return this;};return t;}}};
 for(let n=0;n<100;n++)emitFloatingText(scene,{type:'dot',x:1,y:20,text:'5'},0xffffff);assert.equal(created,64);
 updateFloatingTexts(scene,.9);assert.ok(scene.floatingTextPool.items.every(p=>!p.active));
 for(let n=0;n<1000;n++){emitFloatingText(scene,{type:'gold',x:2,y:30,amount:3},0);updateFloatingTexts(scene,.9);}assert.equal(created,64);
 emitFloatingText(scene,{type:'dot',x:0,y:0,text:'2'},0xff0000);assert.deepEqual(scene.floatingTextPool.items[0].text.setFontSizeValue,[9]);clearFloatingTexts(scene);assert.ok(scene.floatingTextPool.items.every(p=>!p.active));
});
