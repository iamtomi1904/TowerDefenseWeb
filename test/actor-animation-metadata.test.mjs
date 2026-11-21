import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {resolveActorAnimation} from '../public/actor-animation-metadata.js';
test('all catalog actors resolve leap, cast and hurt even when base atlas lacks those actions',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../public/catalog-v4.json',import.meta.url)));
 for(const info of catalog.actors)for(const action of ['leap','jump','cast','hurt','attack','flurry','dead','walk']){const r=resolveActorAnimation(info,action,3);assert.ok(r,info.id);assert.ok(r.metadata,info.id+':'+action);assert.ok(info.actions[r.name]);assert.ok(r.row<(r.metadata.rows||1));}
});
test('missing cast uses idle metadata; existing directional actions retain row and geometry',()=>{
 const idle={rows:1,frames:6},hurt={rows:4,frames:4};const info={actions:{idle,hurt}};assert.deepEqual(resolveActorAnimation(info,'cast',3),{name:'idle',metadata:idle,row:0});assert.equal(resolveActorAnimation(info,'hurt',3).row,3);assert.equal(resolveActorAnimation({},'jump'),null);
});

test('null or missing action metadata cannot crash row resolution',()=>{
 assert.equal(resolveActorAnimation({actions:{jump:undefined,idle:null}},'jump'),null);
 const result=resolveActorAnimation({actions:{jump:null,attack:{frames:6}}},'jump',2);assert.equal(result.name,'attack');assert.equal(result.row,0);
 assert.equal(resolveActorAnimation(undefined,'jump'),null);
});
