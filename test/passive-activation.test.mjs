import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PASSIVE_CLASSES} from '../public/passive-activation-art.js';
import {buildSkillPreview,PREVIEW_HEROES} from '../scripts/build-skill-previews.mjs';
test('every hero passive preview triggers actual activation events',()=>{
 for(const hero of PREVIEW_HEROES){const replay=buildSkillPreview(hero,'P');const events=replay.frames.flatMap(f=>f.events).filter(e=>e.type==='passive-vfx');assert.ok(events.length>0,hero);assert.ok(events.every(e=>PASSIVE_CLASSES.includes(e.classId)&&Number.isFinite(e.x)&&Number.isFinite(e.y)),hero);}
});
test('new passive atlases retain alpha and all six cells stay inside their source image',()=>{
 for(const id of PASSIVE_CLASSES){const b=readFileSync(new URL('../public/assets/passives-v1/'+id+'.png',import.meta.url));assert.equal(b[25],6,id);const w=b.readUInt32BE(16),h=b.readUInt32BE(20);for(let n=0;n<6;n++){const x=Math.round(n%3*w/3),y=Math.round(Math.floor(n/3)*h/2),right=Math.round((n%3+1)*w/3),bottom=Math.round((Math.floor(n/3)+1)*h/2);assert.ok(x>=0&&right<=w&&y>=0&&bottom<=h);}}
});
