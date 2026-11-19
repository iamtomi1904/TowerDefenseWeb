import {readFileSync,writeFileSync,copyFileSync,existsSync} from 'node:fs';
import {groundAt} from '../public/mmorpg/map-traversal.js';
import {fenceHeading} from '../src/mmorpg/object-orientation.ts';
const root=new URL('../public/mmorpg/maps/',import.meta.url),file=new URL('binh-minh.tmj',root),map=JSON.parse(readFileSync(file));
if(map.properties.some(p=>p.name==='routeArrangement'&&p.value===14)){console.log('Route arrangement14 already authored');process.exit(0);}
const backup=new URL('history/binh-minh-v13.tmj',root);if(!existsSync(backup))copyFileSync(file,backup);
const config=JSON.parse(readFileSync(new URL('runtime-map.json',root))),scene=config.scenes.world,roads=scene.geology.roads,layer=map.layers.find(l=>l.name==='WorldObjects');
const previous=new Map(scene.objects.map(o=>[o.id,o]));
scene.objects=layer.objects.map(o=>{const old=previous.get(String(o.id)),x=o.x/3,y=o.y/3,props=Object.fromEntries((o.properties||[]).map(p=>[p.name,p.value]));return{...old,id:String(o.id),kind:o.type,x,y,width:o.width/3,...props,collider:old?.collider?[old.collider[0]+x-old.x,old.collider[1]+y-old.y,old.collider[2],old.collider[3]]:undefined};});
const originals=new Map(scene.objects.map(o=>[o.id,o])),report={revision:14,removed:[],moved:[],unresolved:[],rules:{footClearance:12,maximumMove:180,fieldNorthFence:3090,fieldSouthFence:4070}};
for(const o of layer.objects.filter(o=>o.type==='fence')){const r=originals.get(String(o.id)),heading=fenceHeading(r,scene.objects,scene.geology,3);o.properties??=[];o.properties.push({name:'heading',type:'float',value:heading});r.heading=heading;}
function nearest(x,y){let best={gap:Infinity,x,y};for(const road of roads)for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1))),px=a[0]+dx*t,py=a[1]+dy*t,gap=Math.hypot(x-px,y-py)-road.width/2;if(gap<best.gap)best={gap,x:px,y:py};}return best;}
function samples(o,x=o.x,y=o.y){const runtime=originals.get(String(o.id));if(o.type==='fence'){const a=fenceHeading({...runtime,x:x/3,y:y/3},scene.objects,scene.geology,3);return[-.5,-.25,0,.25,.5].map(t=>[x+Math.cos(a)*o.width*t,y+Math.sin(a)*o.width*t]);}if(runtime?.collider){const [rx,ry,w,h]=runtime.collider.map(v=>v*3),dx=rx-runtime.x*3,dy=ry-runtime.y*3;return[[x+dx,y+dy],[x+dx+w,y+dy],[x+dx,y+dy+h],[x+dx+w,y+dy+h],[x+dx+w/2,y+dy+h/2]];}if(['oak','birch','willow','orchard','boulders','rock','sign','barrel','lamp','pot'].includes(o.type)){const r=['oak','birch','willow','orchard'].includes(o.type)?o.width*.13:Math.max(8,(runtime?.radius||4)*3);return[[x-r,y],[x+r,y],[x,y-r],[x,y+r]];}return[[x,y]];}
function conflict(o,x=o.x,y=o.y){return samples(o,x,y).some(([x,y])=>nearest(x,y).gap<12);}
// The concept places fences around plots, with openings at the north/south middle lane.
for(const o of layer.objects.filter(o=>o.type==='fence'&&o.x>=2500&&o.x<=3900&&o.width>130)){const old=[o.x,o.y];if(o.y===3020)o.y=3090;if(o.y===4160)o.y=4070;if(old[1]!==o.y)report.moved.push({id:o.id,kind:o.type,from:old,to:[o.x,o.y],reason:'field perimeter follows plot edge, not road'});}
const low=new Set(['flora','flowers','grass']);const keep=[];
for(const o of layer.objects){
  const old=originals.get(String(o.id));
  if(o.type==='fence'&&conflict(o)){report.removed.push({id:o.id,kind:o.type,at:[o.x,o.y],reason:'road or gate opening'});continue;}
  if(low.has(o.type)&&nearest(o.x,o.y).gap<4){report.removed.push({id:o.id,kind:o.type,at:[o.x,o.y],reason:'keep walking surface readable'});continue;}
  const rootChecked=['oak','birch','willow','orchard','building','barrel','lamp','pot','rock','sign','boulders'].includes(o.type)||o.type==='detail'&&old?.collider;
  if(rootChecked&&conflict(o)){
    const from=[o.x,o.y],floor=groundAt(scene,o.x,o.y),near=nearest(o.x,o.y),angle=Math.atan2(o.y-near.y,o.x-near.x);let found;
    for(let radius=20;radius<=180&&!found;radius+=20)for(const offset of [0,.3,-.3,.7,-.7,1.2,-1.2,Math.PI]){const x=from[0]+Math.cos(angle+offset)*radius,y=from[1]+Math.sin(angle+offset)*radius,g=groundAt(scene,x,y);if(x<80||y<80||x>5920||y>4420||!g.supported||g.kind!=='flat'||g.height!==floor.height||conflict(o,x,y))continue;const cell=scene.navigation.cell*scene.scale,nav=scene.navigation.data[Math.floor(y/cell)*scene.navigation.width+Math.floor(x/cell)];if(![1,2].includes(nav))continue;if(layer.objects.some(a=>a.id!==o.id&&['building','entrance','oak','birch','willow','orchard'].includes(a.type)&&Math.hypot(a.x-x,a.y-y)<(a.type==='building'?a.width*.38:45)))continue;found=[x,y];break;}
    if(found){[o.x,o.y]=found;report.moved.push({id:o.id,kind:o.type,from,to:found,reason:'root/footprint outside road corridor; same floor'});
      if(o.type==='building')for(const child of layer.objects){if(!['pebbles','flora','flowers','grass','barrel','lamp','pot','detail'].includes(child.type))continue;const original=originals.get(String(child.id));if(!original)continue;const owner=scene.objects.filter(a=>a.kind==='building').map(a=>({a,d:Math.hypot(original.x-a.x,original.y-a.y)*3})).sort((a,b)=>a.d-b.d)[0];if(owner?.a.id!==String(o.id)||owner.d>Math.max(110,o.width*.45))continue;const before=[child.x,child.y],nx=child.x+found[0]-from[0],ny=child.y+found[1]-from[1];if(nx<60||ny<60||nx>5940||ny>4440)continue;child.x=nx;child.y=ny;report.moved.push({id:child.id,kind:child.type,from:before,to:[child.x,child.y],reason:'follow owning building courtyard'});}
    }else if(['boulders','oak','birch','willow','orchard'].includes(o.type)){report.removed.push({id:o.id,kind:o.type,at:from,reason:'decorative root blocks route; no safe same-floor relocation'});continue;}else report.unresolved.push({id:o.id,kind:o.type,at:from,reason:'no safe same-floor relocation within180'});
  }
  keep.push(o);
}
layer.objects=keep;map.properties.push({name:'routeArrangement',type:'int',value:14});writeFileSync(file,JSON.stringify(map,null,2)+'\n');writeFileSync(new URL('../assets/route-arrangement-r014.json',root),JSON.stringify(report,null,2));console.log({moved:report.moved.length,removed:report.removed.length,unresolved:report.unresolved});
