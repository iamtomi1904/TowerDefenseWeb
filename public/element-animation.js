import {cleanEffectTexture} from './effect-alpha.js';
export function preloadElementAnimations(s){s.load.image('arctic-round','/assets/casting/arctic-round-v2.png');s.load.image('meteor-air','/assets/casting/meteor-air-v1.png');s.load.image('arctic-curved-gust','/assets/casting/arctic-curved-gust-v1.png');s.load.image('arctic-shard','/assets/casting/arctic-shard-v1.png');s.load.image('element-animation','/assets/casting/element-animations-v3.png');s.load.image('arctic-giant','/assets/casting/arctic-giant-v1.png');}
export function elementAnimationFrame(s,row,age){
 const key=cleanEffectTexture(s,'element-animation',{columns:4,rows:4,matteFloor:48,maxSize:1280}),tx=s.textures.get(key),im=tx.getSourceImage(),n=row===1?(age<.12?0:age<.32?1:age<.7?2:3):Math.floor(age*(row===2?7:10))%4,f='element:'+row+':'+n,w=im.width/4,h=im.height/4;
 if(!tx.has(f))tx.add(f,0,Math.round(n*w),Math.round(row*h),Math.round((n+1)*w)-Math.round(n*w),Math.round((row+1)*h)-Math.round(row*h));return {key,frame:f};
}
export function arcticAnimationFrame(s,age){const key=cleanEffectTexture(s,'arctic-giant',{columns:2,rows:2,matteFloor:110,maxSize:1280}),tx=s.textures.get(key),im=tx.getSourceImage(),n=Math.floor(age*11)%4,f='arctic:'+n,w=im.width/2,h=im.height/2;if(!tx.has(f))tx.add(f,0,Math.round(n%2*w),Math.round(Math.floor(n/2)*h),Math.round((n%2+1)*w)-Math.round(n%2*w),Math.round((Math.floor(n/2)+1)*h)-Math.round(Math.floor(n/2)*h));return {key,frame:f};}
export function arcticDimensions(radius){return {width:radius*2/.7,height:radius*2/.7};}

export function arcticShardTexture(s){return cleanEffectTexture(s,'arctic-shard',{columns:1,rows:1,matteFloor:40,maxSize:256});}

export function arcticGustTexture(s){return cleanEffectTexture(s,'arctic-curved-gust',{columns:1,rows:1,matteFloor:64,maxSize:512});}

export function arcticRoundFrame(s,age){const key=cleanEffectTexture(s,'arctic-round',{columns:2,rows:2,matteFloor:80,maxSize:1280}),tx=s.textures.get(key),im=tx.getSourceImage(),n=Math.floor(age*10)%4,f='round:'+n,w=im.width/2,h=im.height/2;if(!tx.has(f))tx.add(f,0,Math.round(n%2*w),Math.round(Math.floor(n/2)*h),Math.round((n%2+1)*w)-Math.round(n%2*w),Math.round((Math.floor(n/2)+1)*h)-Math.round(Math.floor(n/2)*h));return {key,frame:f};}
export function meteorAirTexture(s){return cleanEffectTexture(s,'meteor-air',{columns:1,rows:1,matteFloor:48,maxSize:512});}
