import {cleanEffectTexture} from './effect-alpha.js';
export function preloadElementAnimations(s){s.load.image('arctic-round','/assets/casting/arctic-round-v2.png');s.load.image('meteor-air','/assets/casting/meteor-air-v1.png');s.load.image('arctic-curved-gust','/assets/casting/arctic-curved-gust-v1.png');s.load.image('arctic-shard','/assets/casting/arctic-shard-v1.png');s.load.image('element-animation','/assets/casting/element-animations-v3.png');s.load.image('arctic-giant','/assets/casting/arctic-giant-v1.png');}

const sceneCaches=new WeakMap();
function cacheFor(s){let cache=sceneCaches.get(s);if(!cache){cache=new Map();sceneCaches.set(s,cache);}return cache;}
function framesFor(s,raw,columns,rows,row,floor,maxSize,prefix){
 const cache=cacheFor(s),id=raw+':'+row;let list=cache.get(id);if(list)return list;
 const key=cleanEffectTexture(s,raw,{columns,rows,matteFloor:floor,maxSize}),tx=s.textures.get(key),im=tx.getSourceImage(),w=im.width/columns,h=im.height/rows;
 list=Array.from({length:columns},(_,n)=>{const frame=prefix+':'+row+':'+n;if(!tx.has(frame))tx.add(frame,0,Math.round(n*w),Math.round(row*h),Math.round((n+1)*w)-Math.round(n*w),Math.round((row+1)*h)-Math.round(row*h));return {key,frame};});cache.set(id,list);return list;
}
export function elementAnimationFrame(s,row,age){const n=row===1?(age<.12?0:age<.32?1:age<.7?2:3):Math.floor(age*(row===2?7:10))%4;return framesFor(s,'element-animation',4,4,row,48,1280,'element')[n];}
export function arcticAnimationFrame(s,age){const n=Math.floor(age*11)%4;return framesFor(s,'arctic-giant',2,2,Math.floor(n/2),110,1280,'arctic')[n%2];}
export function arcticRoundFrame(s,age){const n=Math.floor(age*10)%4;return framesFor(s,'arctic-round',2,2,Math.floor(n/2),80,1280,'round')[n%2];}
export function arcticDimensions(radius){return {width:radius*2/.7,height:radius*2/.7};}
function cachedTexture(s,key,floor,maxSize){const cache=cacheFor(s),id='texture:'+key;if(!cache.has(id))cache.set(id,cleanEffectTexture(s,key,{columns:1,rows:1,matteFloor:floor,maxSize}));return cache.get(id);}
export const arcticShardTexture=s=>cachedTexture(s,'arctic-shard',40,256);
export const arcticGustTexture=s=>cachedTexture(s,'arctic-curved-gust',64,512);
export const meteorAirTexture=s=>cachedTexture(s,'meteor-air',48,512);
export function prewarmElementAnimations(s){for(let row=0;row<4;row++)elementAnimationFrame(s,row,0);for(const age of [0,.2]){arcticAnimationFrame(s,age);arcticRoundFrame(s,age);}arcticShardTexture(s);arcticGustTexture(s);meteorAirTexture(s);}
