import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CLASS_WISPS,progressionTier,preloadClassProgression,updateClassProgression,progressionShape,bowPoint,weaponLine,progressionPoint} from '../public/class-progression-art.js';
import {preloadActionSkills} from '../public/action-skill-art.js';
function setup(){const keys=new Set(),images=[];const s={textures:{exists:k=>keys.has(k)},load:{image(k,path){const b=readFileSync(new URL('../public'+path,import.meta.url));assert.equal(b[25],6);keys.add(k);}},add:{image(){const im={destroyed:false,destroy(){this.destroyed=true;}};for(const name of ['setTint','setOrigin','setPosition','setDisplaySize','setRotation','setDepth','setAlpha'])im[name]=(...v)=>{assert.ok(v.every(Number.isFinite));im[name+'Value']=v;return im;};images.push(im);return im;}}};preloadClassProgression(s);preloadActionSkills(s);return {s,images};}
test('all14 classes use finite class-specific gear effects and release them on death',()=>{
 assert.equal(Object.keys(CLASS_WISPS).length,14);assert.deepEqual([1,6,11,16].map(progressionTier),[0,1,2,3]);
 for(const classId of Object.keys(CLASS_WISPS)){const {s}=setup(),obj={sprite:{x:10,y:80,depth:80},size:68},u={classId,hp:100,level:16};
  updateClassProgression(s,u,obj,1000);assert.ok(obj.progressionWisps.size>0,classId);const all=[...obj.progressionWisps.values()];u.hp=0;updateClassProgression(s,u,obj,1020);assert.equal(obj.progressionWisps.size,0);assert.ok(all.every(im=>im.destroyed));
 }
});
test('archer lights follow curved bow limbs tip to tip, not a body circle or string',()=>{
 for(let frame=0;frame<30;frame++){const a=bowPoint(frame,0),b=bowPoint(frame,1),mid=bowPoint(frame,.5);assert.ok(a.y<b.y);assert.ok(mid.x>(a.x+b.x)/2);}
 const nodes=progressionShape({classId:'ranger',level:16},1000,0).filter(n=>n.id==='gear-spark');assert.ok(nodes.every(n=>n.x>.7));
});
test('wind and power swords fan behind the back with distinct actual sword art',()=>{
 for(const classId of ['windblade','duelist']){const v=progressionShape({classId,level:16},1000).filter(n=>n.origin==='hilt');assert.equal(v.length,5);assert.ok(v.every(n=>n.behind&&n.origin==='hilt'));assert.equal(new Set(v.map(n=>n.angle)).size,5);assert.ok(v.every(n=>n.id===(classId==='windblade'?'wind-katana':'power-katana')));}
});
test('ravager energy hugs animated weapon; knight energy stays on sword; water bubbles drift freely',()=>{
 for(const classId of ['ravager','paladin','fallen'])for(const frame of [0,8,14,18,25]){const [a,b]=weaponLine({classId},frame),v=progressionShape({classId,level:16},1000,frame).filter(n=>['sword-wisp','battle-ember'].includes(n.id));for(const n of v){const cross=Math.abs((n.x-a[0])*(b[1]-a[1])-(n.y-a[1])*(b[0]-a[0]))/(Math.hypot(b[0]-a[0],b[1]-a[1])||1);assert.ok(cross<.04);}}
 const bubbles=t=>progressionShape({classId:'tidecaller',level:16},t).filter(n=>n.id==='water-bubble');const a=bubbles(1000),b=bubbles(1100);assert.ok(a.length>=8);assert.ok(a.every((n,i)=>n.y>b[i].y));
 const halo=progressionShape({classId:'stormcaller',level:16},1000).find(n=>n.id==='spell-circle');assert.ok(halo.behind);
});
test('mirroring follows weapon side; class switching, hiding and actor disposal clear effects',()=>{
 const obj={sprite:{x:100,y:100,width:100,height:100,scaleX:1,scaleY:1,originX:.5,originY:1},size:68};const a=progressionPoint(obj,.8,.5);obj.sprite.flipX=true;const b=progressionPoint(obj,.8,.5);assert.equal(a.x-100,100-b.x);
 const {s,images}=setup();let dispose;obj.sprite.once=(_,fn)=>{dispose=fn;};const u={classId:'paladin',hp:100,level:16};updateClassProgression(s,u,obj,1);const old=[...obj.progressionWisps.values()];u.classId='fallen';updateClassProgression(s,u,obj,2);assert.ok(old.every(i=>i.destroyed));dispose();assert.ok(images.every(i=>i.destroyed));
});

