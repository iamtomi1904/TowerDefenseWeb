import test from 'node:test';import assert from 'node:assert/strict';
import {MAPS} from '../public/content.js';import {propBlocks} from '../public/prop-footprints.js';import {propsBlock,invalidatePropIndex} from '../public/prop-spatial-index.js';
test('spatial collision matches exhaustive checks on every map, at roots and cell boundaries',()=>{
 let seed=42;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
 for(const map of MAPS)for(let i=0;i<1200;i++){const p=map.props[i%map.props.length],x=i%2?p.x+(rand()-.5)*90:rand()*map.width,y=i%2?p.y+(rand()-.5)*90:rand()*map.height,r=[0,2,12,45,160][i%5];assert.equal(propsBlock(map,x,y,r),map.props.some(p=>propBlocks(p,x,y,r)),`map ${map.id} sample ${i}`);}
});
test('index rebuilds on list changes and explicit geometry invalidation',()=>{
 const map={props:[{x:128,y:128,radius:10,footprintY:5}]};assert.equal(propsBlock(map,128,128),true);map.props[0].x=800;invalidatePropIndex(map);assert.equal(propsBlock(map,128,128),false);assert.equal(propsBlock(map,800,128),true);map.props.push({x:20,y:20,radius:5});assert.equal(propsBlock(map,20,20),true);map.props=[];assert.equal(propsBlock(map,800,128),false);
});
