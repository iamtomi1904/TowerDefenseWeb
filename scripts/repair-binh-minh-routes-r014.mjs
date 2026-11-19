import {readFileSync,writeFileSync,copyFileSync,existsSync} from 'node:fs';
import {curve,on,polygon} from './binh-minh-geography.mjs';
const root=new URL('../public/mmorpg/maps/',import.meta.url),file=new URL('binh-minh-geology.json',root),geo=JSON.parse(readFileSync(file));if(geo.routeRevision===14){const source=new URL('binh-minh.tmj',root),map=JSON.parse(readFileSync(source)),g=geo.navigation,layer=map.layers.find(l=>l.name==='Ground');for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)layer.data[y*map.width+x]=g.data[Math.floor((y+.5)*map.tileheight/g.cell)*g.width+Math.floor((x+.5)*map.tilewidth/g.cell)];if(!map.properties.some(p=>p.name==='routeGeometry'))map.properties.push({name:'routeGeometry',type:'int',value:14});writeFileSync(source,JSON.stringify(map,null,2)+'\n');console.log('Route geometry14 reapplied to Tiled ground');process.exit(0);}
const backup=new URL('history/binh-minh-geology-v13.json',root);if(!existsSync(backup))copyFileSync(file,backup);
const source=new URL('binh-minh.tmj',root),map=JSON.parse(readFileSync(source)),old=geo.roads.map(r=>structuredClone(r));
const path=(p,w)=>({points:curve(p),width:w}),join=(...p)=>p.flatMap((v,i)=>i?v.slice(1):v);
geo.roads[1]={width:82,points:join(curve([[1020,3780],[1160,3440],[1260,3260]]),[[1260,3260],[1260,2940]],curve([[1260,2940],[1500,2860],[1780,2850],[2160,2295]]))};
geo.roads[3]=path([[420,2025],[680,1530],[720,900],[1400,850],[1660,1170],[1850,1280],[2300,1400],[3000,1600],[3300,2000],[3000,2380]],78);
geo.roads[4]=path([[1850,1280],[1910,1230],[1980,1170]],65);
geo.roads[5]=path([[5100,1575],[4980,1250],[4980,990]],80);
geo.roads[6]=path([[4750,2070],[4900,2350],[5030,2540],[5280,2550],[5480,2920],[5350,3330],[5000,3700]],80);
geo.roads.push(path([[4750,2070],[4480,1850],[4470,1350],[4400,1000],[4480,550],[5000,300],[5580,450]],70));
geo.roads[8]=path([[1400,850],[1800,620],[2440,680],[2760,560]],75);
const changed=new Set([1,3,4,5,6,8]);
function index(roads){const bins=new Map();for(let ri=0;ri<roads.length;ri++){const r=roads[ri],pad=r.width/2+18;for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i];for(let y=Math.floor((Math.min(a[1],b[1])-pad)/128);y<=Math.floor((Math.max(a[1],b[1])+pad)/128);y++)for(let x=Math.floor((Math.min(a[0],b[0])-pad)/128);x<=Math.floor((Math.max(a[0],b[0])+pad)/128);x++){const key=x+','+y,list=bins.get(key)||[];list.push({a,b,width:r.width,ri});bins.set(key,list);}}}return bins;}
const before=index(old),after=index(geo.roads),faces=new Map();for(const f of geo.faces)for(let y=Math.floor(f.bounds[1]/128);y<=Math.floor(f.bounds[3]/128);y++)for(let x=Math.floor(f.bounds[0]/128);x<=Math.floor(f.bounds[2]/128);x++){const k=x+','+y,list=faces.get(k)||[];list.push(f);faces.set(k,list);}
function near(list,x,y,margin=0,predicate=()=>true){return(list||[]).some(s=>predicate(s.ri)&&on(x,y,{points:[s.a,s.b],width:s.width},margin));}
const g=geo.navigation,previous=g.data,data=new Array(previous.length);let changedCells=0;
for(let row=0;row<g.height;row++)for(let col=0;col<g.width;col++){const x=(col+.5)*g.cell,y=(row+.5)*g.cell,i=row*g.width+col,key=Math.floor(x/128)+','+Math.floor(y/128),oldSegments=before.get(key),newSegments=after.get(key);let tile=previous[i];
 if(tile===2&&near(oldSegments,x,y,18,r=>changed.has(r))&&!near(oldSegments,x,y,0,r=>!changed.has(r)))tile=1;
 const ramp=near(newSegments,x,y,18),road=near(newSegments,x,y);if(road)tile=2;
 const face=(faces.get(key)||[]).some(f=>polygon(x,y,f.quad));if(face)tile=ramp?2:7;
 for(const h of [...geo.hydrology].sort((a,b)=>Number(a.deep)-Number(b.deep))){if(x<h.bounds[0]||x>h.bounds[2]||y<h.bounds[1]||y>h.bounds[3])continue;if(polygon(x,y,h.water))tile=h.deep?3:5;}
 if(geo.decks.some(d=>x>=d.rect[0]&&x<=d.rect[0]+d.rect[2]&&y>=d.rect[1]&&y<=d.rect[1]+d.rect[3]))tile=4;
 if(x<45||y<45||x>5955||y>4455)tile=6;data[i]=tile;if(tile!==previous[i])changedCells++;
}
g.data=data;geo.routeRevision=14;const layer=map.layers.find(l=>l.name==='Ground');for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)layer.data[y*map.width+x]=data[Math.floor((y+.5)*map.tileheight/g.cell)*g.width+Math.floor((x+.5)*map.tilewidth/g.cell)];
map.properties.push({name:'routeGeometry',type:'int',value:14});writeFileSync(file,JSON.stringify(geo)+'\n');writeFileSync(source,JSON.stringify(map,null,2)+'\n');writeFileSync(new URL('../assets/route-geometry-r014.json',root),JSON.stringify({revision:14,changedRoads:[...changed],newBypassRoad:12,changedCells,worldSize:[6000,4500],landmarksMoved:false},null,2));console.log({changedCells,roads:geo.roads.length});
