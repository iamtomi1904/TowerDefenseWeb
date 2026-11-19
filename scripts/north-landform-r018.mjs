import fs from 'node:fs';import {on,polygon} from './binh-minh-geography.mjs';
const sf='public/mmorpg/maps/binh-minh.tmj',gf='public/mmorpg/maps/binh-minh-geology.json',map=JSON.parse(fs.readFileSync(sf)),geo=JSON.parse(fs.readFileSync(gf));if(geo.northLandform===18){console.log('North18 already authored');process.exit(0);}
for(const [f,b]of [[sf,'binh-minh-v17.tmj'],[gf,'binh-minh-geology-v17.json']])if(!fs.existsSync('public/mmorpg/maps/history/'+b))fs.copyFileSync(f,'public/mmorpg/maps/history/'+b);
const region=geo.regions[1],oldFaces=geo.faces.filter(f=>f.region===region.name),before=structuredClone(region.polygon);
const influence=(x,y)=>y>450?Math.max(0,Math.min(1,(x-1300)/400,(4200-x)/350)):0;
region.polygon=region.polygon.map(([x,y])=>{const a=influence(x,y),center=Math.exp(-(((x-2760)/260)**2));return[x,y+a*(-65*center+(1-center)*(28*Math.sin(x/83)+19*Math.sin(x/147)))];});
const p=region.polygon,area=p.reduce((v,a,i)=>{const b=p[(i+1)%p.length];return v+a[0]*b[1]-b[0]*a[1]},0),sign=area>0?1:-1;
const foot=p.map((v,i)=>{const a=p[(i+p.length-1)%p.length],b=p[(i+1)%p.length],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,t=influence(...v),depth=128+t*(72+18*Math.sin(v[0]/173));return[v[0]+dy/len*sign*18,v[1]-dx/len*sign*depth];});
const bounds=q=>[Math.min(...q.map(v=>v[0])),Math.min(...q.map(v=>v[1])),Math.max(...q.map(v=>v[0])),Math.max(...q.map(v=>v[1]))];let u0=0;
const faces=p.map((a,i)=>{const j=(i+1)%p.length,b=p[j],base=[foot[i],foot[j]],quad=[a,b,base[1],base[0]],len=Math.hypot(b[0]-a[0],b[1]-a[1]),f={id:region.name+'-'+i,region:region.name,level:2,material:'rock',top:[a,b],base,quad,bounds:bounds(quad),ramp:quad.some(v=>geo.roads.some(r=>on(...v,r,18))),u0,u1:u0+len};u0+=len;return f;});geo.faces=geo.faces.filter(f=>f.region!==region.name).concat(faces);
const g=geo.navigation;let changed=0;for(let row=0;row<g.height;row++)for(let col=0;col<g.width;col++){const x=(col+.5)*g.cell,y=(row+.5)*g.cell;if(x<1200||x>4350||y<400||y>1200)continue;const i=row*g.width+col;let tile=g.data[i];
 if(tile===7&&oldFaces.some(f=>x>=f.bounds[0]&&x<=f.bounds[2]&&y>=f.bounds[1]&&y<=f.bounds[3]&&polygon(x,y,f.quad)))tile=1;
 const road=geo.roads.some(r=>on(x,y,r)),ramp=geo.roads.some(r=>on(x,y,r,18));if(road)tile=2;
 if(faces.some(f=>x>=f.bounds[0]&&x<=f.bounds[2]&&y>=f.bounds[1]&&y<=f.bounds[3]&&polygon(x,y,f.quad)))tile=ramp?2:7;
 for(const h of [...geo.hydrology].sort((a,b)=>Number(a.deep)-Number(b.deep)))if(x>=h.bounds[0]&&x<=h.bounds[2]&&y>=h.bounds[1]&&y<=h.bounds[3]&&polygon(x,y,h.water))tile=h.deep?3:5;
 if(tile!==g.data[i])changed++;g.data[i]=tile;}
const objects=map.layers.find(l=>l.name==='WorldObjects'),removed=[];objects.objects=objects.objects.filter(o=>{if([3607,3608].includes(o.id))o.y=590;if(o.x<1400||o.x>4200||o.y<490||o.y>1150||!['oak','birch','willow','orchard','boulders','flora','flowers','grass','detail'].includes(o.type))return true;if(!faces.some(f=>polygon(o.x,o.y,f.quad)))return true;removed.push(o.id);return false;});
const ground=map.layers.find(l=>l.name==='Ground');for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)ground.data[y*map.width+x]=g.data[Math.floor((y+.5)*map.tileheight/g.cell)*g.width+Math.floor((x+.5)*map.tilewidth/g.cell)];
geo.northLandform=18;map.properties.push({name:'northLandform',type:'int',value:18});fs.writeFileSync(sf,JSON.stringify(map,null,2)+'\n');fs.writeFileSync(gf,JSON.stringify(geo)+'\n');fs.writeFileSync('public/mmorpg/assets/north-landform-r018.json',JSON.stringify({before,after:region.polygon,changedCells:changed,removed,physicalFloorHeight:128,projectedRockDepth:'128–218 world pixels',reason:'Reduce forecourt setback and form a deeper irregular natural escarpment'},null,2));console.log({changed,removed:removed.length});



