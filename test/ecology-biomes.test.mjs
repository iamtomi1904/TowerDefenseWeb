import test from 'node:test';
import assert from 'node:assert/strict';
import {BIOMES} from '../public/world-biomes.js';
import {MAPS} from '../public/content.js';
import {roadBiomeAt,drawRoadNetwork} from '../public/landscape-structures.js';
import {CUSTOM_PROP_META} from '../public/custom-props-art.js';
import {drawBiomeTransition} from '../public/biome-transition.js';
function ctx(){const calls=[];return new Proxy({calls},{get(o,k){return k in o?o[k]:(...args)=>calls.push([k,...args]);},set(o,k,v){o[k]=v;return true;}});}
test('new ground biomes and painted ecosystem props are actually distributed into maps',()=>{for(const type of ['flowers','swamp','desert','snow']){assert.ok(BIOMES[type]);assert.ok(MAPS.some(m=>m.environment.some(z=>z.type===type)));}for(const id of ['prop-ancient-oak','prop-giant-boulder','prop-bamboo-clump','prop-ice-boulder','prop-mushroom-woodland','prop-mushroom-russet']){assert.ok(CUSTOM_PROP_META[id]);assert.ok(MAPS.some(m=>m.props.some(p=>p.asset===id)),id);}assert.ok(CUSTOM_PROP_META['prop-ancient-oak'].targetH>250);});
test('road materials depend on local biome and use distinct geometry',()=>{const map={id:1,environment:[{type:'lava',x:128,y:128,rx:100,ry:100}],lanes:[[[0,100],[300,100]]],forestPaths:[]};assert.equal(roadBiomeAt(map,128,128),'lava');assert.equal(roadBiomeAt(map,900,900),'forest');const paths=[];for(const type of ['forest','swamp','desert','snow','lava']){const c=ctx();drawRoadNetwork(c,{...map,roadBiome:type});paths.push(JSON.stringify(c.calls));}assert.equal(new Set(paths).size,5);});
test('biome transition edges use deterministic translucent pixel tiles and preserve zones',()=>{const z={x:150,y:100,rx:120,ry:80},before=JSON.stringify(z),a=ctx(),b=ctx();drawBiomeTransition(a,z,{texture:true},'#71834e');drawBiomeTransition(b,z,{texture:true},'#71834e');assert.deepEqual(a.calls,b.calls);assert.equal(JSON.stringify(z),before);assert.ok(a.calls.filter(c=>c[0]==='fillRect').length>30);assert.ok(a.calls.flat(Infinity).filter(v=>typeof v==='number').every(Number.isFinite));});
