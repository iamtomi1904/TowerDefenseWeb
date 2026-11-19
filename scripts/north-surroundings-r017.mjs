import fs from 'node:fs';import {curve,on,polygon} from './binh-minh-geography.mjs';
const sf='public/mmorpg/maps/binh-minh.tmj',gf='public/mmorpg/maps/binh-minh-geology.json',map=JSON.parse(fs.readFileSync(sf)),geo=JSON.parse(fs.readFileSync(gf));if(geo.northSurroundings===17){console.log('North17 already authored');process.exit(0);}
for(const [f,b]of [[sf,'binh-minh-v16.tmj'],[gf,'binh-minh-geology-v16.json']])if(!fs.existsSync('public/mmorpg/maps/history/'+b))fs.copyFileSync(f,'public/mmorpg/maps/history/'+b);
const report={removed:[],resized:[],added:[],changes:['Expose cliff foot and stair approach','Mixed broadleaf groups rather than willow wall','Stream head below northern terrace','Wider final approach']},oldRoad=structuredClone(geo.roads[8]),oldWater=geo.hydrology.find(h=>h.id==='stream-0');
geo.roads[8].width=110;
// Keep the downstream course and all other rivers; the spring starts below the cliff.
const center=curve([[1900,990],[2070,1020],[2190,1050],[2470,1240],[2670,1490],[3060,1560],[3380,1700],[3720,1660],[4160,1750]]);
const bounds=p=>[Math.min(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[0])),Math.max(...p.map(v=>v[1]))];
const layers=[[],[],[],[],[],[]];for(let i=0;i<center.length;i++){const v=center[i],a=center[Math.max(0,i-1)],b=center[Math.min(center.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;
 const taper=.35+.65*Math.min(1,i/12),r=70*taper*(1+.15*Math.sin(i*.53)+.08*Math.sin(i*1.27)+.45*Math.exp(-(((v[0]-3300)/450)**2)));
 for(const [k,sign,pad]of [[0,1,0],[1,-1,0],[2,1,18],[3,-1,18],[4,1,34],[5,-1,34]])layers[k].push([v[0]-dy/len*sign*(r+pad),v[1]+dx/len*sign*(r+pad)]);
}
const water={id:'stream-0',deep:false,center,water:[...layers[0],...layers[1].reverse()],bed:[...layers[2],...layers[3].reverse()],bank:[...layers[4],...layers[5].reverse()]};water.bounds=bounds(water.bank);geo.hydrology[geo.hydrology.indexOf(oldWater)]=water;
geo.falls=geo.falls.filter(f=>!(f.at[0]>1700&&f.at[0]<2300&&f.at[1]<1000));
const g=geo.navigation;
for(let row=0;row<g.height;row++)for(let col=0;col<g.width;col++){const x=(col+.5)*g.cell,y=(row+.5)*g.cell;if(x<1350||x>4300||y<450||y>1850)continue;const i=row*g.width+col;let tile=g.data[i];
 if(tile===5&&polygon(x,y,oldWater.water))tile=1;if(tile===2&&on(x,y,oldRoad,18)&&!geo.roads.some((r,k)=>k!==8&&on(x,y,r)))tile=1;
 const road=geo.roads.some(r=>on(x,y,r)),ramp=geo.roads.some(r=>on(x,y,r,18));if(road)tile=2;
 if(geo.faces.some(f=>x>=f.bounds[0]&&x<=f.bounds[2]&&y>=f.bounds[1]&&y<=f.bounds[3]&&polygon(x,y,f.quad)))tile=ramp?2:7;
 for(const h of [...geo.hydrology].sort((a,b)=>Number(a.deep)-Number(b.deep)))if(x>=h.bounds[0]&&x<=h.bounds[2]&&y>=h.bounds[1]&&y<=h.bounds[3]&&polygon(x,y,h.water))tile=h.deep?3:5;
 if([1,2].includes(tile)&&((x-2760)/290)**2+((y-560)/140)**2<=1)tile=2;g.data[i]=tile;
}
const layer=map.layers.find(l=>l.name==='WorldObjects'),trees=['oak','birch','willow','orchard'];
const northFaces=geo.faces.filter(f=>f.region==='Thềm Vành Lũy'&&f.base[0][1]>450);
layer.objects=layer.objects.filter(o=>{if(o.x<1400||o.x>4050||o.y<490||o.y>1350)return true;const tree=trees.includes(o.type),p=Object.fromEntries((o.properties||[]).map(p=>[p.name,p.value]));
 const nearStair=tree&&o.x>2460&&o.x<3070&&o.y<1120;
 const nearCliff=tree&&northFaces.some(f=>Math.abs(o.x-(f.base[0][0]+f.base[1][0])/2)<100&&Math.abs(o.y-(f.base[0][1]+f.base[1][1])/2)<150);
 const nearRoad=tree&&on(o.x,o.y,geo.roads[8],Math.max(45,o.width*.2));
 const oldBank=o.type==='detail'&&['wetgrass','reeds','wetrocks'].includes(p.asset)&&o.y<1000;
 if(nearStair||nearCliff||nearRoad||oldBank){report.removed.push({id:o.id,at:[o.x,o.y],reason:oldBank?'old spring bank':'reveal terrain / approach'});return false;}
 if(tree){const before={kind:o.type,width:o.width};if(o.type==='willow')o.type=o.id%3===0?'birch':'oak';o.width=Math.min(o.width,o.type==='birch'?200:245);report.resized.push({id:o.id,before,after:{kind:o.type,width:o.width}});}return true;});
// Broken stone and low plants describe the foot of the escarpment without hiding it.
function add(type,x,y,width,extra={}){const col=Math.floor(x/g.cell),row=Math.floor(y/g.cell);if(![1,2].includes(g.data[row*g.width+col])||geo.roads.some(r=>on(x,y,r,width*.3+25)))return;if(layer.objects.some(o=>['building','entrance','fortress',...trees].includes(o.type)&&Math.hypot(o.x-x,o.y-y)<(o.type==='fortress'?20:o.width*.22)))return;const o={id:map.nextobjectid++,name:'Chân thềm Bắc · '+type,type,x,y,width,height:0,point:true,properties:Object.entries(extra).map(([name,value])=>({name,type:typeof value==='number'?'float':'string',value}))};layer.objects.push(o);report.added.push({id:o.id,type,at:[x,y]});}
for(const [x,y,w]of [[2200,810,105],[2370,865,115],[2530,940,100],[3020,930,120],[3230,870,130],[3460,805,140],[3710,745,125]]){add('boulders',x,y,w);add('flowers',x+55,y+20,65);add('grass',x-45,y+35,80);}
// Dense side woods stay outside the stair window; their small crowns do not blanket the cliff.
for(const [x,y,w]of [[2380,1100,210],[3190,1080,230],[3410,1000,220],[3630,950,240],[1740,900,200]])add('oak',x,y,w);
const ground=map.layers.find(l=>l.name==='Ground');for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)ground.data[y*map.width+x]=g.data[Math.floor((y+.5)*map.tileheight/g.cell)*g.width+Math.floor((x+.5)*map.tilewidth/g.cell)];
geo.northSurroundings=17;map.properties.push({name:'northSurroundings',type:'int',value:17});fs.writeFileSync(sf,JSON.stringify(map,null,2)+'\n');fs.writeFileSync(gf,JSON.stringify(geo)+'\n');fs.writeFileSync('public/mmorpg/assets/north-surroundings-r017.json',JSON.stringify(report,null,2));console.log({removed:report.removed.length,resized:report.resized.length,added:report.added.length});
