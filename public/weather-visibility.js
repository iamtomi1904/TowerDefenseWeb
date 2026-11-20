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
// Collect all active camera viewports (single screen, split-screen, or multi-camera co-op), clipped to [0,0,mapW,mapH].
export function getActiveViews(scene){
 const cams=scene.cameras?.cameras?.length?scene.cameras.cameras:scene.cameras?.main?[scene.cameras.main]:[];
 const mapW=scene.mapWidth||10000,mapH=scene.mapHeight||10000;
 const out=[];
 for(const cam of cams){
  if(cam.visible===false||cam.ignoreScenery)continue;
  const wv=cam.worldView;if(!wv)continue;
  const cw=wv.width||(wv.right-wv.x),ch=wv.height||(wv.bottom-wv.y);
  if(cw<=2||ch<=2)continue;
  const x=Math.max(0,wv.x),y=Math.max(0,wv.y);
  const right=Math.min(mapW,wv.x+cw),bottom=Math.min(mapH,wv.y+ch);
  const width=right-x,height=bottom-y;
  if(width<=2||height<=2)continue;
  if(out.some(v=>Math.abs(v.x-x)<4&&Math.abs(v.y-y)<4&&Math.abs(v.width-width)<4&&Math.abs(v.height-height)<4))continue;
  out.push({x,y,right,bottom,width,height});
 }
 return out;
}
export function inAnyView(views,x,y,pad=0){
 for(let i=0;i<views.length;i++){
  const v=views[i];
  if(x>=v.x-pad&&x<=v.right+pad&&y>=v.y-pad&&y<=v.bottom+pad)return true;
 }
 return false;
}
export function boxInAnyView(views,minX,minY,maxX,maxY,pad=0){
 for(let i=0;i<views.length;i++){
  const v=views[i];
  if(maxX>=v.x-pad&&minX<=v.right+pad&&maxY>=v.y-pad&&minY<=v.bottom+pad)return true;
 }
 return false;
}
