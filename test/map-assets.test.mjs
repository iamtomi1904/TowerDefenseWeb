import test from 'node:test';import assert from 'node:assert/strict';import {EventEmitter} from 'node:events';import {preloadMapBuildings,ensureMapBuildings,releaseOldBuildings} from '../public/map-assets.js';
test('building resources retain only current and next maps and load missing maps once',async()=>{
 const keys=new Set(),queued=[],load=new EventEmitter();let starts=0;load.image=(key,url)=>queued.push([key,url]);load.isLoading=()=>false;load.start=()=>{starts++;for(const [key]of queued)keys.add(key);queued.length=0;load.emit('complete');};const s={load,textures:{exists:k=>keys.has(k),remove:k=>keys.delete(k)}};
 preloadMapBuildings(s,4);assert.equal(queued.length,4);load.start();await ensureMapBuildings(s,4);assert.equal(starts,1);await ensureMapBuildings(s,6);assert.equal(starts,2);releaseOldBuildings(s,5);assert.deepEqual([...keys].sort(),['castle-5','castle-6','stone-wall-5','stone-wall-6']);
});
import {mapSceneryAssets} from '../public/map-assets.js';
test('scenery plan includes map props, normalized assets and shared scenery; unload preserves shared keys',()=>{
 const s={mapAssetCatalog:{props:[{id:'rock1_1',url:'/rock.png'},{id:'cloud-1',url:'/cloud.png'},{id:'unused-test',url:'/unused.png'}]}};
 assert.deepEqual(mapSceneryAssets(s,1).map(([k])=>k),['rock1_1','cloud-1']);
 const keys=new Set(['rock1_1','cloud-1','castle-1','stone-wall-1','castle-4','stone-wall-4']);s.textures={exists:k=>keys.has(k),remove:k=>keys.delete(k)};s.mapBuildingJobs=new Map([[1,Promise.resolve()]]);
 releaseOldBuildings(s,4);assert.ok(keys.has('cloud-1'));assert.ok(keys.has('rock1_1'));assert.ok(!keys.has('castle-1'));assert.ok(!s.mapBuildingJobs.has(1));
});

import {readFileSync} from 'node:fs';import {LUSH_ROADSIDE,HARSH_ROADSIDE} from '../public/roadside-assets.js';
test('every procedurally generated roadside texture is loaded on every map',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../public/catalog-v4.json',import.meta.url)));
 for(let n=1;n<=10;n++){const plan=new Map(mapSceneryAssets({mapAssetCatalog:catalog},n));for(const key of [...LUSH_ROADSIDE,...HARSH_ROADSIDE])assert.ok(plan.has(key),`map ${n}: ${key}`);}
});
