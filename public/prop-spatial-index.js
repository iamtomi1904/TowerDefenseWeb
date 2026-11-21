import {propFootprint,propBlocks} from './prop-footprints.js';
const indexes=new WeakMap(),CELL=128;
export function invalidatePropIndex(map){indexes.delete(map);}
export function propIndex(map){
 const props=map.props||[];let index=indexes.get(map);
 if(index&&index.props===props&&index.length===props.length)return index;
 const grid=new Map();
 for(const p of props){const f=propFootprint(p);if(!f.rx)continue;
  for(let x=Math.floor((f.x-f.rx)/CELL);x<=Math.floor((f.x+f.rx)/CELL);x++)for(let y=Math.floor((f.y-f.ry)/CELL);y<=Math.floor((f.y+f.ry)/CELL);y++){const key=x+':'+y;let list=grid.get(key);if(!list)grid.set(key,list=[]);list.push(p);}
 }
 index={props,length:props.length,grid};indexes.set(map,index);return index;
}
export function propsBlock(map,x,y,radius=12){
 const {grid}=propIndex(map);
 for(let cx=Math.floor((x-radius)/CELL);cx<=Math.floor((x+radius)/CELL);cx++)for(let cy=Math.floor((y-radius)/CELL);cy<=Math.floor((y+radius)/CELL);cy++){
  const list=grid.get(cx+':'+cy);if(list)for(const p of list)if(propBlocks(p,x,y,radius))return true;
 }return false;
}
