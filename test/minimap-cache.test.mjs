import test from 'node:test';import assert from 'node:assert/strict';import {drawMiniMap} from '../public/terrain.js';
function graphics(){const counts={};let g;g=new Proxy({counts},{get(o,k){if(k in o)return o[k];return (...args)=>{counts[k]=(counts[k]||0)+1;return g;};}});return g;}
test('minimap rebuilds its terrain only on map changes; resize moves cached background',()=>{
 const background=graphics(),s={mini:graphics(),scale:{width:1000},add:{graphics:()=>background},cameras:{main:{scrollX:0,scrollY:0,width:800,height:600,zoom:1}}};
 const map={width:2000,height:1500,ground:0,road:0,base:{x:100,y:100},rivers:[],environment:[],territories:[],lanes:[[[0,0],[100,100]]],camps:[]};const state={players:[],troops:[],enemies:[],loot:[]};
 drawMiniMap(s,state,map);for(let i=0;i<100;i++)drawMiniMap(s,state,map);assert.equal(background.counts.clear,1);assert.equal(s.mini.counts.clear,101);
 s.scale.width=1400;drawMiniMap(s,state,map);assert.equal(background.counts.clear,1);drawMiniMap(s,state,{...map});assert.equal(background.counts.clear,2);
});
