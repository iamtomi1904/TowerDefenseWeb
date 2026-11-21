import test from 'node:test';import assert from 'node:assert/strict';import {acquireSkillImage,releaseSkillImage} from '../public/skill-image-pool.js';
test('skill pool reuses a thousand images, detaches idle objects and disposes on shutdown',()=>{
 let shutdown,created=0,destroyed=0;const display=new Set();const s={children:{add:i=>display.add(i),remove:i=>display.delete(i)},events:{once:(e,fn)=>shutdown=fn},add:{image(){created++;const im={scene:s,destroy(){destroyed++;display.delete(im);}};for(const key of ['setTexture','setPosition','setVisible','setActive','setAlpha','setRotation','setScale','setOrigin','clearTint','setFlipX','setFlipY','setBlendMode','setDepth'])im[key]=function(...a){this[key+'Value']=a;return this;};display.add(im);return im;}}};
 const first=Array.from({length:1000},()=>acquireSkillImage(s,0,0,'arrows'));first.forEach(releaseSkillImage);assert.equal(display.size,0);
 const second=Array.from({length:1000},()=>acquireSkillImage(s,2,3,'snow'));assert.equal(created,1000);assert.equal(display.size,1000);assert.deepEqual(second[0].setTextureValue,['snow',undefined]);assert.deepEqual(second[0].setAlphaValue,[1]);
 second.forEach(releaseSkillImage);releaseSkillImage(second[0]);assert.equal(s.skillImagePool.free.length,1000);shutdown();assert.equal(destroyed,1000);assert.equal(display.size,0);
});
