import {performance} from 'node:perf_hooks';import {MAPS} from '../public/content.js';import {propBlocks} from '../public/prop-footprints.js';import {propsBlock,propIndex} from '../public/prop-spatial-index.js';
for(const map of [MAPS[0],MAPS[6],MAPS[9]]){
 const points=Array.from({length:10000},(_,i)=>[(i*137.13)%map.width,(i*83.71)%map.height]);propIndex(map);
 let hits=0,start=performance.now();for(const [x,y]of points)hits+=map.props.some(p=>propBlocks(p,x,y,12));const old=performance.now()-start;
 let indexedHits=0;start=performance.now();for(const [x,y]of points)indexedHits+=propsBlock(map,x,y,12);const indexed=performance.now()-start;
 console.log(JSON.stringify({map:map.id,props:map.props.length,queries:points.length,oldMs:+old.toFixed(1),indexedMs:+indexed.toFixed(1),same:hits===indexedHits}));
}
