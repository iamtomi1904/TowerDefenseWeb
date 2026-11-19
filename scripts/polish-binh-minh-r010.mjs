import {readFileSync,writeFileSync,copyFileSync,existsSync} from 'node:fs';import {road} from './binh-minh-geography.mjs';
const dir=new URL('../public/mmorpg/maps/',import.meta.url),file=new URL('binh-minh.tmj',dir),map=JSON.parse(readFileSync(file)),geo=JSON.parse(readFileSync(new URL('binh-minh-geology.json',dir)));
if(map.properties.some(p=>p.name==='visualPolish'&&p.value===10)){console.log('Art10 already authored');process.exit(0);}
const backup=new URL('history/binh-minh-v9.tmj',dir);if(!existsSync(backup))copyFileSync(file,backup);
const objects=map.layers.find(l=>l.name==='WorldObjects').objects;let id=map.nextobjectid;const counts={footClusters:0,houseClusters:0,entranceMarks:0};
const tile=(x,y)=>geo.navigation.data[Math.floor(y/5)*1200+Math.floor(x/5)];
const free=(x,y,w=50)=>x>60&&y>60&&x<5940&&y<4440&&tile(x,y)===1&&!road(x,y,45)&&!objects.some(o=>['building','entrance','oak','birch','willow','orchard','detail'].includes(o.type)&&Math.hypot(o.x-x,o.y-y)<(o.type==='building'?o.width*.35:w*.35+20));
const add=(type,x,y,width,extra={})=>objects.push({id:id++,type,name:type+'-art10-'+id,x,y,width,height:0,point:true,properties:Object.entries(extra).map(([name,value])=>({name,type:typeof value==='number'?'float':typeof value==='boolean'?'bool':'string',value}))});
// Low plants and fallen stones hug the foot contour; gates and water remain open.
for(let i=0;i<geo.faces.length;i++){const f=geo.faces[i],dy=(f.base[0][1]+f.base[1][1]-f.top[0][1]-f.top[1][1])*.5;if(dy<30||f.ramp||i%3)continue;const x=(f.base[0][0]+f.base[1][0])/2,y=(f.base[0][1]+f.base[1][1])/2+22;if(!free(x,y,65))continue;add('detail',x,y,45+i%4*8,{asset:'meadow',flip:i%2===0});if(i%2===0)add('pebbles',x+28,y+6,38,{asset:'rocks'});counts.footClusters++;}
// Each dwelling gets a small planted foreground, rather than filling all open grass.
for(const o of [...objects].filter(o=>o.type==='building'&&o.width>250)){for(const side of [-1,1]){const x=o.x+side*o.width*.48,y=o.y+38;if(!free(x,y,65))continue;add('detail',x,y,62,{asset:'meadow',flip:side<0});add('flora',x+side*32,y+7,34,{variant:side<0?1:3});counts.houseClusters++;}}
// Harvest and work corners are placed away from the four main field lanes.
for(const [asset,x,y,w]of [['hay',3660,3085,78],['table',3910,3090,110],['hay',3720,4185,82],['cart',2490,4140,115],['garden',430,3890,120],['bench',1650,3970,100],['wood',1370,3480,95],['table',1880,2360,100]]){if(free(x,y,w)){add('detail',x,y,w,{asset});counts.houseClusters++;}}
// Visible excavation trail at each cave mouth; no new invisible blockers or portals.
for(const p of map.layers.find(l=>l.name==='Portals').objects){for(let i=0;i<5;i++){const x=p.x+(i%2?26:-22),y=p.y+60+i*24;if(![1,2].includes(tile(x,y)))continue;add('pebbles',x,y,25+i%3*7,{asset:'rocks'});counts.entranceMarks++;}const x=p.x+175,y=p.y+75;if(free(x,y,75)){add('barrel',x,y,35);add('pot',x+35,y+9,29);add('detail',x+18,y+60,75,{asset:'wood'});counts.entranceMarks++;}}
map.nextobjectid=id;map.properties.push({name:'visualPolish',type:'int',value:10});writeFileSync(file,JSON.stringify(map,null,2)+'\n');console.log({...counts,objects:objects.length});
