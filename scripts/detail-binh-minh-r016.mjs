import {readFileSync,writeFileSync,copyFileSync,existsSync} from 'node:fs';
import {MapTraversal,groundAt,segmentDistance} from '../public/mmorpg/map-traversal.js';
const root=new URL('../public/mmorpg/',import.meta.url),file=new URL('maps/binh-minh.tmj',root),map=JSON.parse(readFileSync(file));
if(map.properties.some(p=>p.name==='detailRevision'&&p.value===16)){console.log('Detail16 already authored');process.exit(0);}
const backup=new URL('maps/history/binh-minh-v15.tmj',root);if(!existsSync(backup))copyFileSync(file,backup);
const config=JSON.parse(readFileSync(new URL('maps/runtime-map.json',root))),world=config.scenes.world,model=new MapTraversal(config),layer=map.layers.find(l=>l.name==='WorldObjects');
const report={revision:16,placed:[],skipped:[],rules:{roadMargin:18,maximumRelocation:100,solidFootprint:'64% width by 16% width; independent of sprite height'}};
// Each cluster belongs to a work area, rather than filling the shared walking yard.
const plans=[
 ['supply',1450,2310,125,'Tiếp tế phía Tây'],['notice',1680,2250,88,'Tiếp tế phía Tây'],['trough',1450,2460,96,'Tiếp tế phía Tây'],
 ['medicine',2710,2745,125,'Lều y tế'],['herbs',2800,2650,110,'Lều y tế'],['supply',2700,2840,95,'Lều y tế'],
 ['armory',2830,2130,135,'Xưởng rèn'],['logs',2860,2250,105,'Xưởng rèn'],['trough',2780,2390,95,'Xưởng rèn'],
 ['notice',2250,2015,88,'Nhà chỉ huy'],['watchpost',1930,2030,85,'Nhà chỉ huy'],
 ['herbs',1600,2700,120,'Kho và nhà dân'],['supply',1840,2725,105,'Kho và nhà dân'],['logs',1680,2780,90,'Kho và nhà dân'],
 ['watchpost',2480,590,100,'Tiền đình thành Bắc'],['watchpost',3035,590,100,'Tiền đình thành Bắc'],
 ['supply',3170,520,125,'Vật tư phòng thủ'],['armory',2340,530,120,'Vật tư phòng thủ'],
 ['notice',2930,690,95,'Chỉ dẫn cổng thành'],['trough',2440,690,110,'Điểm nghỉ lính gác'],
 ['herbs',1900,2140,95,'Vườn cạnh giếng'],['watchpost',1570,2600,85,'Cổng Tây Nam trại'],
 ];
const added=[];
function valid(x,y,w,expected){
 const samples=[[-.32,-.16],[.32,-.16],[-.32,0],[.32,0],[0,0]].map(([a,b])=>[x+w*a,y+w*b]);
 if(samples.some(([px,py])=>{const g=groundAt(world,px,py);return !g.supported||g.kind!=='flat'||g.height!==expected||!model.canStand(px,py)||world.geology.roads.some(r=>r.points.slice(1).some((b,i)=>segmentDistance(px,py,r.points[i],b)<r.width/2+18));}))return false;
 return !added.some(a=>Math.abs(a.x-x)<(a.width+w)*.38&&Math.abs(a.y-y)<Math.max(a.width,w)*.45);
}
for(const [asset,x,y,width,zone]of plans){const expected=groundAt(world,x,y).height;let at;
 for(let radius=0;radius<=100&&!at;radius+=20)for(let n=0;n<(radius?16:1);n++){const a=n*Math.PI/8,px=x+Math.cos(a)*radius,py=y+Math.sin(a)*radius;if(valid(px,py,width,expected)){at=[px,py];break;}}
 if(!at){report.skipped.push({asset,at:[x,y],zone,reason:'No safe same-floor footprint outside road'});continue;}
 const id=map.nextobjectid++,o={id,name:zone+' · '+asset,type:'detail',x:at[0],y:at[1],width,height:0,point:true,properties:[{name:'asset',type:'string',value:asset},{name:'detailZone',type:'string',value:zone},{name:'detailRevision',type:'int',value:16}]};layer.objects.push(o);added.push(o);report.placed.push({id,asset,at,width,zone});
}
map.properties.push({name:'detailRevision',type:'int',value:16});writeFileSync(file,JSON.stringify(map,null,2)+'\n');writeFileSync(new URL('assets/detail-layout-r016.json',root),JSON.stringify(report,null,2));console.log(report);
