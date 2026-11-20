// Keep weather readable when the world camera zooms out, without enlarging its coverage.
const wrappers=new WeakMap();
export function weatherGraphics(scene){
 const target=scene.weather;if(!target)return target;
 const camera=scene.cameras?.main,zoom=Math.max(.25,Math.min(camera?.zoomX??camera?.zoom??1,camera?.zoomY??camera?.zoom??1));
 let entry=wrappers.get(target);
 if(!entry){entry={minimum:1,methods:new Map()};entry.proxy=new Proxy(target,{get(object,key){const value=object[key];if(typeof value!=='function')return value;if(!entry.methods.has(key))entry.methods.set(key,(...args)=>{
  if(key==='lineStyle')args[0]=Math.max(args[0],entry.minimum);
  if(key==='fillRect'&&args[2]<=6&&args[3]<=6){const w=Math.max(args[2],entry.minimum*1.5),h=Math.max(args[3],entry.minimum*1.5);args[0]-=(w-args[2])/2;args[1]-=(h-args[3])/2;args[2]=w;args[3]=h;}
  const result=value.apply(object,args);return result===object?entry.proxy:result;
 });return entry.methods.get(key);}});wrappers.set(target,entry);}
 entry.minimum=Math.min(4,1.2/zoom);return entry.proxy;
}
