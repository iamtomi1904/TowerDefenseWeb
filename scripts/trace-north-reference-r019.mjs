import fs from 'node:fs';import {curve,on,polygon} from './binh-minh-geography.mjs';
const sf='public/mmorpg/maps/binh-minh.tmj',gf='public/mmorpg/maps/binh-minh-geology.json',map=JSON.parse(fs.readFileSync(sf)),geo=JSON.parse(fs.readFileSync(gf));if(geo.northReference===19){console.log('North19 already authored');process.exit(0);}
for(const [f,b]of [[sf,'binh-minh-v18.tmj'],[gf,'binh-minh-geology-v18.json']])if(!fs.existsSync('public/mmorpg/maps/history/'+b))fs.copyFileSync(f,'public/mmorpg/maps/history/'+b);
// Read from the original 1448x1086 concept. These are authored tracing points,
// not automated segmentation or a claim of pixel-perfect reconstruction.
const scale=6000/1448,toWorld=([x,y])=>[x*scale,y*scale],outline=[[390,0],[980,0],[976,94],[945,139],[922,170],[845,167],[790,178],[740,173],[700,178],[651,164],[610,171],[561,155],[523,155],[482,144],[443,135],[415,107],[395,70]];
const anchors={gate:[739,105],arrival:[739,121],stairTop:[716,179],stairFoot:[713,236]};
const trace={reference:'/design-preview/v01-complete-map-r001/binh-minh-full-map-r001.png',imageSize:[1448,1086],worldSize:[6000,4500],method:'manual silhouette and landmark tracing; approximate image readings',outline,anchors,scale};
const region=geo.regions[1],oldFaces=geo.faces.filter(f=>f.region===region.name),oldRoad=structuredClone(geo.roads[8]);region.polygon=outline.map(toWorld);
const gate=toWorld(anchors.gate),arrival=toWorld(anchors.arrival),top=toWorld(anchors.stairTop),foot=toWorld(anchors.stairFoot);
geo.roads[8]={width:110,points:curve([[1400,850],[1600,1070],[1850,1280],[2310,1220],[2700,1170],[foot[0],foot[1]+70],foot,top,arrival])};
const p=region.polygon,area=p.reduce((v,a,i)=>{const b=p[(i+1)%p.length];return v+a[0]*b[1]-b[0]*a[1]},0),sign=area>0?1:-1;
const bases=p.map((v,i)=>{const a=p[(i+p.length-1)%p.length],b=p[(i+1)%p.length],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;return[v[0]+dy/len*sign*18,v[1]-dx/len*sign*235];});
const bounds=q=>[Math.min(...q.map(v=>v[0])),Math.min(...q.map(v=>v[1])),Math.max(...q.map(v=>v[0])),Math.max(...q.map(v=>v[1]))];let u0=0;
const faces=p.map((a,i)=>{const j=(i+1)%p.length,b=p[j],base=[bases[i],bases[j]],quad=[a,b,base[1],base[0]],len=Math.hypot(b[0]-a[0],b[1]-a[1]),f={id:region.name+'-'+i,region:region.name,level:2,material:'rock',top:[a,b],base,quad,bounds:bounds(quad),ramp:quad.some(v=>geo.roads.some(r=>on(...v,r,18))),u0,u1:u0+len};u0+=len;return f;});geo.faces=geo.faces.filter(f=>f.region!==region.name).concat(faces);
// Index small road segments instead of testing every polyline for each nav cell.
const bins=new Map();for(const r of geo.roads)for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],pad=r.width/2+18;for(let y=Math.floor((Math.min(a[1],b[1])-pad)/128);y<=Math.floor((Math.max(a[1],b[1])+pad)/128);y++)for(let x=Math.floor((Math.min(a[0],b[0])-pad)/128);x<=Math.floor((Math.max(a[0],b[0])+pad)/128);x++){const key=x+','+y,list=bins.get(key)||[];list.push({points:[a,b],width:r.width});bins.set(key,list);}}
const g=geo.navigation;let changed=0;for(let row=0;row<g.height;row++)for(let col=0;col<g.width;col++){const x=(col+.5)*g.cell,y=(row+.5)*g.cell;if(x>4350||y>1550)continue;const i=row*g.width+col;let tile=g.data[i];
 if(tile===7&&oldFaces.some(f=>x>=f.bounds[0]&&x<=f.bounds[2]&&y>=f.bounds[1]&&y<=f.bounds[3]&&polygon(x,y,f.quad)))tile=1;
 if(tile===2&&(on(x,y,oldRoad,18)||(x>2250&&x<3250&&y>400&&y<800)))tile=1;
 const roads=bins.get(Math.floor(x/128)+','+Math.floor(y/128))||[],road=roads.some(r=>on(x,y,r)),ramp=roads.some(r=>on(x,y,r,18));if(road)tile=2;
 if(geo.faces.some(f=>x>=f.bounds[0]&&x<=f.bounds[2]&&y>=f.bounds[1]&&y<=f.bounds[3]&&polygon(x,y,f.quad)))tile=ramp?2:7;
 for(const h of [...geo.hydrology].sort((a,b)=>Number(a.deep)-Number(b.deep)))if(x>=h.bounds[0]&&x<=h.bounds[2]&&y>=h.bounds[1]&&y<=h.bounds[3]&&polygon(x,y,h.water))tile=h.deep?3:5;
 if([1,2].includes(tile)&&((x-arrival[0])/165)**2+((y-arrival[1])/72)**2<1)tile=2;
 if(x<45||y<45)tile=6;if(tile!==g.data[i])changed++;g.data[i]=tile;}
const layer=map.layers.find(l=>l.name==='WorldObjects'),fort=layer.objects.find(o=>o.type==='fortress'),delta=[gate[0]-fort.x,gate[1]-fort.y];fort.x=gate[0];fort.y=gate[1];
const moved=[];for(const o of layer.objects){const props=Object.fromEntries((o.properties||[]).map(p=>[p.name,p.value]));if(o.type==='detail'&&['Tiền đình thành Bắc','Vật tư phòng thủ','Chỉ dẫn cổng thành','Điểm nghỉ lính gác'].includes(props.detailZone)){o.x+=delta[0];o.y+=delta[1];moved.push(o.id);}}
const marker=map.layers.find(l=>l.name==='Markers').objects.find(o=>o.name==='Vành lũy phía Bắc');marker.x=gate[0];for(const [name,value]of [['arrivalX',arrival[0]],['arrivalY',arrival[1]]]){const prop=marker.properties.find(p=>p.name===name);prop.value=value;}
const removed=[];layer.objects=layer.objects.filter(o=>{if(o.x>4350||o.y>1550||o.type==='fortress')return true;const tree=['oak','birch','willow','orchard'].includes(o.type),decor=['boulders','flora','flowers','grass'].includes(o.type);if(!tree&&!decor)return true;
 const onFace=faces.some(f=>polygon(o.x,o.y,f.quad)),onRoad=(tree||o.type==='boulders')&&on(o.x,o.y,geo.roads[8],o.width*.22+25),insideFort=tree&&o.x>gate[0]-1200&&o.x<gate[0]+1200&&o.y<gate[1];if(onFace||onRoad||insideFort){removed.push(o.id);return false;}return true;});
const ground=map.layers.find(l=>l.name==='Ground');for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)ground.data[y*map.width+x]=g.data[Math.floor((y+.5)*map.tileheight/g.cell)*g.width+Math.floor((x+.5)*map.tilewidth/g.cell)];
geo.northReference=19;map.properties.push({name:'northReference',type:'int',value:19});fs.writeFileSync(sf,JSON.stringify(map,null,2)+'\n');fs.writeFileSync(gf,JSON.stringify(geo)+'\n');fs.writeFileSync('public/mmorpg/assets/north-reference-r019.json',JSON.stringify({...trace,changedCells:changed,moved,removed,gateWorld:gate,arrivalWorld:arrival},null,2));console.log({changed,moved:moved.length,removed:removed.length,gate,arrival});

