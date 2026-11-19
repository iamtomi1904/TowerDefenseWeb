import {drawCastleCourt,castleCourt,inCastleCourt} from './castle-court.js';
import {drawHydrology,drawTerritory,updateHydrologyFX} from './landscape-art.js';
import {drawEnvironmentPatch,updateEnvironmentFX} from './environment-art.js';
import {BIOMES} from './world-biomes.js';
import {clearLeaderAuras} from './leader-auras.js';
import {WORLD,distanceToSegment} from './content.js';
import {ensureCustomPropTexture} from './custom-props-art.js';
import {drawNonBlockingDecor} from './decor-props-art.js';
import {buildFortress} from './fortress.js';
import {waterAt} from './landscape-layout.js';
const hex=n=>'#'+n.toString(16).padStart(6,'0');
function shiftColor(n,dr,dg,db){
 const r=Math.max(0,Math.min(255,((n>>16)&255)+dr));
 const g=Math.max(0,Math.min(255,((n>>8)&255)+dg));
 const b=Math.max(0,Math.min(255,(n&255)+db));
 return `rgb(${r},${g},${b})`;
}

function createGroundPattern(c,m){
 if(typeof document==='undefined'||!c.createPattern)return null;
 const tile=document.createElement('canvas');tile.width=128;tile.height=128;
 const tc=tile.getContext('2d');tc.imageSmoothingEnabled=false;
 let s=(m.id*4999+1337)|0;
 const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};
 const base=m.ground;
 const dark2=shiftColor(base,-18,-16,-14);
 const dark1=shiftColor(base,-9,-8,-7);
 const mid=hex(base);
 const light1=shiftColor(base,11,13,6);
 const light2=shiftColor(base,22,23,10);
 const earth=shiftColor(base,14,4,-12);

 tc.fillStyle=mid;tc.fillRect(0,0,128,128);
 // Seamless organic pixel-art mottling (wrapping across 128x128 edges)
 const drawWrapped=(x,y,w,h,col)=>{
  tc.fillStyle=col;
  for(const ox of [-128,0,128])for(const oy of [-128,0,128]){
   if(x+ox+w>0&&x+ox<128&&y+oy+h>0&&y+oy<128)tc.fillRect(Math.round(x+ox),Math.round(y+oy),w,h);
  }
 };
 for(let i=0;i<65;i++){
  const x=r()*128,y=r()*128,w=6+r()*14,h=4+r()*10;
  drawWrapped(x,y,w,h,i%3===0?dark1:i%3===1?light1:dark2);
 }
 for(let i=0;i<40;i++){
  const x=r()*128,y=r()*128;
  drawWrapped(x,y,4+r()*6,2+r()*4,i%2?earth:light1);
 }
 // Crisp 2px pixel grass tufts, clover, sand ripples, frost veins & volcanic ash strata
 for(let i=0;i<90;i++){
  const x=Math.floor(r()*64)*2,y=Math.floor(r()*64)*2;
  if(m.id===5){
   drawWrapped(x,y,10+Math.floor(r()*8),2,i%2?light1:dark1);
  }else if(m.id===6){
   drawWrapped(x,y,6,2,i%3===0?'#dff6ff':dark1);
   if(i%6===0)drawWrapped(x+2,y+2,4,2,'#ffffff88');
  }else if(m.id===9||m.id===10){
   drawWrapped(x,y,6,2,i%4===0?earth:dark2);
   if(i%7===0)drawWrapped(x+2,y,2,2,m.id===9?'#ff7c3b44':'#a67dff44');
  }else if(i%5===0){
   drawWrapped(x,y,2,2,dark2);drawWrapped(x+2,y,2,2,earth);
  }else{
   const col=i%3===0?light2:i%3===1?light1:dark2;
   drawWrapped(x,y,2,4,col);
   drawWrapped(x+2,y+2,2,2,dark1);
   if(i%2===0)drawWrapped(x-2,y+2,2,2,col);
  }
 }
 return c.createPattern(tile,'repeat');
}

// Unify all vegetation into the authentic CraftPix Top-Down 16-bit Pixel-Art sprites (zero duplicates)
export const UNIFIED_PROPS={
 curved_tree1:'tree2',mega_tree1:'moss_tree1',willow1:'moss_tree2',willow2:'moss_tree3',
 luminous_tree1:'christmas_tree1',ent_man:'tree3',ent_woman:'broken_tree1',
 'blue-green_balls_tree1':'christmas_tree2',light_balls_tree1:'flower_tree1',
 'living-gazebo1':'fruit_tree1','living-gazebo2':'fruit_tree2',
 tree_idol_deer:'autumn_tree1',tree_idol_human:'tree1',tree_idol_dragon:'burned_tree1',tree_idol_wolf:'burned_tree2',
 white_tree1:'snow_tree1',beige_green_mushroom1:'chanterelles1',
 'new-bush1_1':'bush_simple1_1','new-bush1_2':'bush_blue_flowers1','new-bush1_3':'fern1_1','new-bush1_4':'bush_simple1_2',
 'new-bush2_1':'fern1_2','new-bush2_2':'bush_simple2_1','new-bush2_3':'bush_blue_flowers2','new-bush2_4':'fern2_1',
 'new-bush3_1':'autumn_bush1','new-bush3_2':'autumn_bush2','new-bush3_3':'bush_orange_flowers1','new-bush3_4':'autumn_bush3',
 'new-bush4_1':'bush_simple2_2','new-bush4_2':'fern2_2','new-bush4_3':'bush_simple1_3','new-bush4_4':'fern1_3',
 'new-bush5_1':'cactus1_1','new-bush5_2':'cactus2_1','new-bush5_3':'bush_orange_flowers2','new-bush5_4':'fern2_3',
 'new-bush6_1':'snow_bush1','new-bush6_2':'snow_bush2','new-bush6_3':'snow_bush3','new-bush6_4':'snow_christmass_tree1',
 'new-bush7_1':'bush_blue_flowers3','new-bush7_2':'chanterelles2','new-bush7_3':'bush_simple2_3','new-bush7_4':'fruit_tree3',
 'new-bush8_1':'bush_pink_flowers1','new-bush8_2':'bush_pink_flowers2','new-bush8_3':'bush_pink_flowers3','new-bush8_4':'flower_tree2',
 'new-bush9_1':'bush_red_flowers1','new-bush9_2':'bush_red_flowers2','new-bush9_3':'bush_red_flowers3','new-bush9_4':'flower_tree3',
 'new-bush10_1':'burned_tree3','new-bush10_2':'broken_tree2','new-bush10_3':'broken_tree3','new-bush10_4':'christmas_tree3'
};

export function unifiedPropAsset(asset){return UNIFIED_PROPS[asset]||asset;}

function traceRoadPath(c,lane){
 if(!lane||lane.length<2)return;
 c.beginPath();
 c.moveTo(lane[0][0],lane[0][1]);
 for(let i=1;i<lane.length;i++)c.lineTo(lane[i][0],lane[i][1]);
}

function drawNonBlockingVegetation(c,m,rand){
 const onLane=(x,y,pad=78)=>m.lanes.some(l=>l.some((p,k)=>k&&distanceToSegment(x,y,l[k-1],p)<pad));
 const pal=m.id===6?{pad:'#7aa7ba55',dark:'#5c8ca3',mid:'#91c4d9',light:'#dcf5ff',flowers:['#ffffff','#bfefff','#a8d8ff']}:
  m.id===3?{pad:'#4a422155',dark:'#5c4c26',mid:'#8a7335',light:'#c4a44d',flowers:['#ff9e44','#ffd86b','#e85d3f']}:
  m.id===5?{pad:'#5e522d55',dark:'#575c2c',mid:'#7f8541',light:'#a8ad58',flowers:['#ffd56b','#ff9166','#ffffff']}:
  m.id===9||m.id===10?{pad:'#36241d55',dark:'#3b3026',mid:'#5c4c39',light:'#877052',flowers:['#ff7b3b','#ffbd59','#e84d4d']}:
  {pad:'#22422055',dark:'#254a24',mid:'#3f7537',light:'#6ba853',flowers:['#ffe478','#f7a8c4','#a3e8ff','#ffffff']};
 const count=Math.floor((m.width*m.height)/1260);
 for(let i=0;i<count;i++){
  const x=50+rand()*(m.width-100),y=50+rand()*(m.height-100);
  if(inCastleCourt(m,{x,y})||onLane(x,y,74)||waterAt(m,{x,y}))continue;
  const kind=i%5;
  if(kind<=1){
   // Thảm cỏ nhiều lớp + ngọn cỏ pixel
   const rx=22+rand()*20,ry=13+rand()*11;
   c.fillStyle=pal.pad;c.beginPath();c.ellipse(x,y,rx,ry,rand()*.6,0,Math.PI*2);c.fill();
   c.fillStyle=pal.mid+'66';c.beginPath();c.ellipse(x-2,y-1,rx*.7,ry*.68,0,0,Math.PI*2);c.fill();
   for(let b=0;b<7;b++){
    const bx=x+(rand()-.5)*rx*1.3,by=y+(rand()-.5)*ry*1.1;
    c.fillStyle=pal.dark;c.fillRect(bx-1,by-4,2,5);
    c.fillStyle=pal.light;c.fillRect(bx,by-5,2,4);
   }
  }else if(kind===2){
   // Thảm hoa dại nhiều bông
   const rx=16+rand()*12,ry=10+rand()*8;
   c.fillStyle=pal.dark+'66';c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();
   for(let f=0;f<6;f++){
    const fx=x+(rand()-.5)*rx*1.35,fy=y+(rand()-.5)*ry*1.2,col=pal.flowers[(i+f)%pal.flowers.length];
    c.fillStyle=pal.dark;c.fillRect(fx,fy+1,2,3);
    c.fillStyle=col;c.fillRect(fx-2,fy-1,5,3);c.fillRect(fx-1,fy-2,3,5);
    c.fillStyle='#fff6bd';c.fillRect(fx,fy,2,2);
   }
  }else if(kind===3){
   // Bụi lùm thấp phong cách CraftPix (cụm lá pixel 2px, không vòng tròn trơn)
   const sc=.85+rand()*.35;
   c.fillStyle='rgba(20,30,18,0.22)';c.fillRect(Math.round(x-10*sc),Math.round(y),Math.round(20*sc),4);
   for(const [ox,oy,w,h,col] of [[-8,-4,16,8,pal.dark],[-6,-8,12,8,pal.mid],[-4,-8,8,4,pal.light],[-10,-2,6,4,pal.dark],[4,-2,6,4,pal.dark]]){
    c.fillStyle=col;c.fillRect(Math.round((x+ox*sc)/2)*2,Math.round((y+oy*sc)/2)*2,Math.max(2,Math.round(w*sc/2)*2),Math.max(2,Math.round(h*sc/2)*2));
   }
   if(i%2===0){c.fillStyle=pal.flowers[i%pal.flowers.length];c.fillRect(Math.round(x-4),Math.round(y-6),2,2);c.fillRect(Math.round(x+2),Math.round(y-4),2,2);}
  }else{
   // Khóm dương xỉ pixel 2px sát đất
   c.fillStyle='rgba(18,30,16,0.2)';c.fillRect(Math.round(x-8),Math.round(y),16,4);
   for(const [dx,dy,col] of [[-8,-2,pal.mid],[4,-2,pal.mid],[-6,-6,pal.light],[2,-6,pal.light],[-2,-8,pal.light],[-2,-2,pal.dark]]){
    c.fillStyle=col;c.fillRect(Math.round((x+dx)/2)*2,Math.round((y+dy)/2)*2,4,4);
   }
  }
 }
}

export function renderMap(s,m,catalog,entities){
 for(const tween of s.sceneryTweens||[])tween.remove();s.sceneryTweens=[];s.fauna=[];
 if(s.mapObjects)for(const obj of s.mapObjects)obj.destroy();s.mapObjects=[];
 if(s.groundKey&&s.textures.exists(s.groundKey))s.textures.remove(s.groundKey);
 const key='ground-'+m.id;s.groundKey=key;
 const resolution=Math.min(1,3840/m.width),canvas=s.textures.createCanvas(key,Math.ceil(m.width*resolution),Math.ceil(m.height*resolution)),c=canvas.context;c.scale(resolution,resolution);c.imageSmoothingEnabled=false;s.mapWidth=m.width;s.mapHeight=m.height;s.environment=m.environment;
 let seed=m.id*531;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};

 // 1. Rich seamless 128x128 pixel-art ground texture + macro meadow lighting (no flat color, no 64x64 grid)
 c.fillStyle=hex(m.ground);c.fillRect(0,0,m.width,m.height);
 const groundPat=createGroundPattern(c,m);
 if(groundPat){c.fillStyle=groundPat;c.fillRect(0,0,m.width,m.height);}
 const grass=s.textures.get('Ground_grass').getSourceImage();
 const patchCount=Math.floor((m.width*m.height)/24000);
 for(let i=0;i<patchCount;i++){
  const px=rand()*m.width,py=rand()*m.height,rx=65+rand()*140,ry=42+rand()*95;
  c.fillStyle=i%2?'#f2f7c814':'#0d1a0f18';
  c.beginPath();c.ellipse(px,py,rx,ry,rand()*Math.PI,0,Math.PI*2);c.fill();
 }
 // Scatter organic grass-atlas patches & earth/pebble/leaf accents off-grid
 const islandCount=Math.floor((m.width*m.height)/8500);
 for(let i=0;i<islandCount;i++){
  const px=rand()*m.width,py=rand()*m.height,sz=34+rand()*42;
  c.globalAlpha=.16+rand()*.12;
  c.drawImage(grass,2,2+m.grassRow*96,22,22,px-sz/2,py-sz/2,sz,sz);
 }
 c.globalAlpha=1;
 const accentCount=Math.floor((m.width*m.height)/3600);
 for(let i=0;i<accentCount;i++){
  const px=rand()*m.width,py=rand()*m.height;
  if(i%8===0){
   // Small earthy pebble cluster
   c.fillStyle='#19241744';c.fillRect(px-1,py+1,7,3);
   c.fillStyle=m.id===6?'#d9f0f7aa':m.id===9?'#8a4c3b99':'#9c9476aa';
   c.fillRect(px,py,4,3);c.fillRect(px+5,py+1,3,2);
  }else if(i%7===0){
   // Tiny wildflower / clover tuft
   c.fillStyle='#24402066';c.fillRect(px-2,py,5,3);
   c.fillStyle=m.id===6?'#e6f9ffaa':m.id===9?'#ff875299':i%2?'#ffe68099':'#f5a8c499';
   c.fillRect(px-1,py-1,3,2);c.fillRect(px,py-2,1,3);
  }else if(i%5===0&&m.id===3){
   // Fallen autumn leaf on stage 3
   c.fillStyle=i%2?'#d6833c99':'#c95a3899';c.fillRect(px,py,4,2);
  }else{
   // Grass blade cluster
   c.fillStyle=i%3?'#e2edb940':'#14241440';
   c.fillRect(px,py-3,2,5);c.fillRect(px+3,py-1,2,3);c.fillRect(px-3,py-1,2,3);
  }
 }

 // 2. Forest trails & organic monster camp clearings
 c.lineCap='round';c.lineJoin='round';
 for(const trail of [...(m.forestPaths||[]),...(m.campCorridors||[])]){
  c.beginPath();c.moveTo(...trail[0]);c.lineTo(...trail[1]);
  c.strokeStyle='#384729';c.lineWidth=34;c.stroke();
  c.strokeStyle='#96845d';c.lineWidth=22;c.stroke();
  c.strokeStyle='#bfa97c99';c.lineWidth=8;c.stroke();
  const [tx0,ty0]=trail[0],[tx1,ty1]=trail[1],tlen=Math.hypot(tx1-tx0,ty1-ty0)||1;
  const tnx=-(ty1-ty0)/tlen,tny=(tx1-tx0)/tlen;
  for(let d=32;d<tlen-24;d+=48){
   const s=d%96?1:-1,px=tx0+(tx1-tx0)*d/tlen+tnx*s*12,py=ty0+(ty1-ty0)*d/tlen+tny*s*12;
   c.fillStyle='#5c523b99';c.fillRect(px-2,py-1,4,3);
   c.fillStyle='#a8987288';c.fillRect(px-1,py-1,2,2);
  }
 }
 for(const camp of m.camps||[]){
  const k=camp.small?.68:1;
  c.save();
  c.beginPath();
  for(let i=0;i<=24;i++){
   const a=i/24*Math.PI*2,w=1+Math.sin(a*3+camp.x)*.08+Math.cos(a*5+camp.y)*.05;
   const cx=camp.x+Math.cos(a)*106*k*w,cy=camp.y+Math.sin(a)*74*k*w;
   if(i===0)c.moveTo(cx,cy);else c.lineTo(cx,cy);
  }
  c.closePath();
  c.fillStyle='#253b26bb';c.fill();
  c.strokeStyle='#7a7f5666';c.lineWidth=6*k;c.stroke();
  c.fillStyle='#3c4a33aa';
  c.beginPath();c.ellipse(camp.x,camp.y,68*k,46*k,0,0,Math.PI*2);c.fill();
  // Campfire / stone ring & wooden stakes around monster camp
  const stakes=camp.small?5:8;
  for(let i=0;i<stakes;i++){
   const a=i/stakes*Math.PI*2,sx=camp.x+Math.cos(a)*78*k,sy=camp.y+Math.sin(a)*54*k;
   c.fillStyle='#2c261e';c.fillRect(sx-2,sy-7,5,10);
   c.fillStyle='#6e573b';c.fillRect(sx-1,sy-6,3,8);
  }
  c.fillStyle='#3a3c35';c.beginPath();c.ellipse(camp.x,camp.y+4,14*k,9*k,0,0,Math.PI*2);c.fill();
  c.fillStyle='#ff7c2b';c.beginPath();c.ellipse(camp.x,camp.y+2,7*k,5*k,0,0,Math.PI*2);c.fill();
  c.fillStyle='#ffe48a';c.beginPath();c.ellipse(camp.x,camp.y+1,3.5*k,2.5*k,0,0,Math.PI*2);c.fill();
  c.restore();
 }

 // 3. Smooth winding roads (replacing jagged 64x64 road blocks)
 const road=s.textures.get(m.roadTile).getSourceImage();
 const roadPattern=c.createPattern?(()=>{
  const tile=document.createElement('canvas');tile.width=48;tile.height=48;
  const tc=tile.getContext('2d');tc.imageSmoothingEnabled=false;
  tc.drawImage(road,24,24,32,32,0,0,48,48);
  return c.createPattern(tile,'repeat');
 })():null;

 for(const lane of m.lanes){
  // Soft grass/earth roadside blend
  traceRoadPath(c,lane);c.strokeStyle='#2c3b2355';c.lineWidth=118;c.stroke();
  // Packed dirt shoulder / curbstone
  traceRoadPath(c,lane);c.strokeStyle='#57533f';c.lineWidth=100;c.stroke();
  // Main road bed
  traceRoadPath(c,lane);c.strokeStyle=hex(m.road);c.lineWidth=86;c.stroke();
  // Textured cobblestone / surface pattern inside road
  if(roadPattern){
   c.save();c.globalAlpha=.55;traceRoadPath(c,lane);c.strokeStyle=roadPattern;c.lineWidth=82;c.stroke();c.restore();
  }
  // Subtle sunlit center wear & dual cart-wheel ruts
  traceRoadPath(c,lane);c.strokeStyle='#dfd2ab22';c.lineWidth=34;c.stroke();
  traceRoadPath(c,lane);c.strokeStyle='#2a241a24';c.lineWidth=28;c.stroke();
  traceRoadPath(c,lane);c.strokeStyle='#cfc19a26';c.lineWidth=18;c.stroke();
  // Roadside pebbles, paving stones & curbstone tufts
  const slabCol=m.id===6?'#d9f0fa66':m.id===5?'#e0c68d66':m.id===9||m.id===10?'#6e564e66':'#c9bd9966';
  for(let k=1;k<lane.length;k++){
   const [ax,ay]=lane[k-1],[bx,by]=lane[k],len=Math.hypot(bx-ax,by-ay)||1;
   const nx=-(by-ay)/len,ny=(bx-ax)/len,ang=Math.atan2(by-ay,bx-ax);
   for(let t=24;t<len;t+=40){
    const side=rand()>.5?1:-1,px=ax+(bx-ax)*t/len+nx*side*(45+rand()*7),py=ay+(by-ay)*t/len+ny*side*(45+rand()*7);
    c.fillStyle=rand()>.5?'#6a6752':'#9d9678';
    c.beginPath();c.ellipse(px,py,3+rand()*3,2+rand()*2,0,0,Math.PI*2);c.fill();
    if(t%80===24){
     const cx=ax+(bx-ax)*t/len+nx*(rand()-.5)*22,cy=ay+(by-ay)*t/len+ny*(rand()-.5)*22;
     c.save();c.translate(cx,cy);c.rotate(ang);
     c.fillStyle='#241e1844';c.fillRect(-7,-4,14,9);
     c.fillStyle=slabCol;c.fillRect(-7,-5,13,8);
     c.restore();
     const gx=ax+(bx-ax)*t/len-nx*side*52,gy=ay+(by-ay)*t/len-ny*side*52;
     c.fillStyle='#243b2088';c.fillRect(gx-2,gy-2,3,4);c.fillRect(gx+1,gy-3,2,4);
    }
   }
  }
 }

 s.hydrology=m.rivers;s.bridges=m.bridges;s.castleRect=castleCourt(m);
 drawNonBlockingVegetation(c,m,rand);
 // Lush wildflower tufts & scattered meadow micro-details (fallen logs, fern rings, pebbles)
 for(const f of m.flowers){
  if(m.lanes.some(l=>l.some((p,k)=>k&&Math.hypot(f.x-p[0],f.y-p[1])<92)))continue;
  c.fillStyle='#24472288';c.beginPath();c.ellipse(f.x,f.y+1,10,6,0,0,Math.PI*2);c.fill();
  for(const [ox,oy] of [[-4,-1],[3,1],[0,-3]]){
   c.fillStyle='#223d23';c.fillRect(f.x+ox-1,f.y+oy+2,4,2);
   c.fillStyle=hex(f.color);c.fillRect(f.x+ox-2,f.y+oy-1,5,3);c.fillRect(f.x+ox-1,f.y+oy-2,3,5);
   c.fillStyle='#fff6cc';c.fillRect(f.x+ox,f.y+oy,2,2);
  }
 }
 const detailCount=Math.floor((m.width*m.height)/10000);
 for(let i=0;i<detailCount;i++){
  const dx=60+rand()*(m.width-120),dy=60+rand()*(m.height-120);
  if(Math.hypot(dx-m.base.x,dy-m.base.y)<300||m.lanes.some(l=>l.some((p,k)=>k&&Math.hypot(dx-p[0],dy-p[1])<95)))continue;
  if(i%4===0){
   // Mossy fallen log
   c.fillStyle='#141f1555';c.fillRect(dx-11,dy+2,24,6);
   c.fillStyle='#4a3625';c.fillRect(dx-12,dy,24,5);
   c.fillStyle='#73563c';c.fillRect(dx-11,dy,22,3);
   c.fillStyle='#5c8c46';c.fillRect(dx-6,dy-1,8,2);c.fillRect(dx+4,dy,5,2);
  }else if(i%4===1){
   // Wild clover & daisy cluster
   c.fillStyle='#2a522a77';c.beginPath();c.ellipse(dx,dy,11,7,0,0,Math.PI*2);c.fill();
   for(let k=0;k<4;k++){const fx=dx+(k-1.5)*4,fy=dy+(k%2?-2:2);c.fillStyle=k%2?'#ffe680':'#f7bfd1';c.fillRect(fx,fy,3,3);}
  }else if(i%4===2){
   // Weathered tree stump with growth rings
   c.fillStyle='#141f1555';c.beginPath();c.ellipse(dx+1,dy+3,9,5,0,0,Math.PI*2);c.fill();
   c.fillStyle='#3d2b1d';c.fillRect(dx-7,dy-4,14,7);
   c.fillStyle='#6e4f35';c.beginPath();c.ellipse(dx,dy-4,7,4,0,0,Math.PI*2);c.fill();
   c.fillStyle='#c49b6c';c.beginPath();c.ellipse(dx,dy-4,5,2.5,0,0,Math.PI*2);c.fill();
   c.fillStyle='#8c6747';c.fillRect(dx-1,dy-5,2,2);
  }else{
   // Small mossy stone cluster
   c.fillStyle='#252e27';c.beginPath();c.ellipse(dx,dy,7,4.5,0,0,Math.PI*2);c.fill();
   c.fillStyle='#757d72';c.beginPath();c.ellipse(dx-1,dy-1,5.5,3.5,0,0,Math.PI*2);c.fill();
   c.fillStyle='#9ea699';c.beginPath();c.ellipse(dx-2,dy-2,2.5,1.5,0,0,Math.PI*2);c.fill();
   c.fillStyle='#4f8242';c.fillRect(dx+1,dy-3,3,2);
  }
 }
 // Roadside lanterns / stone mileposts along lanes
 for(const lane of m.lanes){
  for(let k=1;k<lane.length;k++){
   const [ax,ay]=lane[k-1],[bx,by]=lane[k],len=Math.hypot(bx-ax,by-ay)||1;
   const nx=-(by-ay)/len,ny=(bx-ax)/len;
   for(let t=160;t<len-80;t+=340){
    const side=k%2?1:-1,lx=ax+(bx-ax)*t/len+nx*side*56,ly=ay+(by-ay)*t/len+ny*side*56;
    if(Math.hypot(lx-m.base.x,ly-m.base.y)<280)continue;
    c.fillStyle='#ffe89928';c.beginPath();c.ellipse(lx,ly+2,22,12,0,0,Math.PI*2);c.fill();
    c.fillStyle='#141c1566';c.beginPath();c.ellipse(lx,ly+3,8,3.5,0,0,Math.PI*2);c.fill();
    c.fillStyle='#5c6157';c.fillRect(lx-4,ly-2,8,4);
    c.fillStyle='#3b3228';c.fillRect(lx-2,ly-14,4,13);
    c.fillStyle='#2b241d';c.fillRect(lx-4,ly-18,8,3);
    c.fillStyle='#ffb84d';c.fillRect(lx-3,ly-15,6,5);
    c.fillStyle='#fff4b8';c.fillRect(lx-1,ly-14,2,3);
    c.fillStyle='#ffe89955';c.beginPath();c.arc(lx,ly-13,14,0,Math.PI*2);c.fill();
   }
  }
 }
 for(const z of m.environment)drawEnvironmentPatch(c,s,z);for(const t of m.territories)drawTerritory(c,s,t);drawHydrology(c,s,m);drawCastleCourt(c,s,m);drawNonBlockingDecor(c,m,inCastleCourt,rand);
 // Subtle macro sunlight & atmospheric edge vignette for 2.5D depth
 const sunCol=m.id===6?'#d9f6ff16':m.id===3||m.id===5?'#ffda9418':m.id===9?'#ff7b3b18':m.id===10?'#b58aff14':'#fff0ba14';
 const sun=c.createRadialGradient(m.width*.45,m.height*.38,m.width*.08,m.width*.5,m.height*.5,m.width*.68);
 sun.addColorStop(0,sunCol);sun.addColorStop(.7,'rgba(0,0,0,0)');sun.addColorStop(1,'rgba(8,14,10,0.24)');
 c.fillStyle=sun;c.fillRect(0,0,m.width,m.height);
 canvas.refresh();s.mapObjects.push(s.add.image(0,0,key).setOrigin(0).setScale(1/resolution).setDepth(-100));for(const t of m.territories)s.mapObjects.push(s.add.text(t.x,t.y-t.radius*.72,'LÃNH ĐỊA · '+t.name.toUpperCase(),{fontFamily:'Segoe UI',fontSize:'14px',color:hex(t.color),stroke:'#152318',strokeThickness:4}).setOrigin(.5).setDepth(t.y));for(const water of m.rivers||[]){const point=water.points.find(pt=>!inCastleCourt(m,{x:pt[0],y:pt[1]}))||water.points[Math.floor(water.points.length/2)];s.mapObjects.push(s.add.text(point[0],point[1]+water.width/2+24,water.name,{fontFamily:'Segoe UI',fontSize:'12px',color:water.type==='deep'?'#a9dce9':'#d0eee1',stroke:'#193229',strokeThickness:3}).setOrigin(.5).setDepth(point[1]));}for(const z of m.environment)s.mapObjects.push(s.add.text(z.x,z.y-z.ry-18,BIOMES[z.type].name,{fontFamily:'Segoe UI',fontSize:'11px',color:'#e7ead1',stroke:'#152318',strokeThickness:3}).setOrigin(.5).setDepth(z.y));
 const infoById=new Map(catalog.props.map(p=>[p.id,p]));
 const shadows=s.add.graphics().setDepth(-96);s.mapObjects.push(shadows);
 s.swayProps=[];s.swayFlowers=(m.flowers||[]).map(f=>({x:f.x,y:f.y,color:f.color,phase:f.x*.021+f.y*.017}));
 const deadZones=(m.environment||[]).filter(z=>z.type==='dead'),deadTrees=[];
 for(const p of m.props){
  const asset=unifiedPropAsset(p.asset),info=ensureCustomPropTexture(s,asset)||infoById.get(asset);if(!info)continue;
  // Keep uniform ~1.05x pixel density across all tree/bush sizes so pixels never look unevenly chunky
  const isTree=info.group==='trees'||info.group==='forest';
  const targetH=info.targetH||(isTree?(info.height>=120?132:86):info.group==='ruins'?98:info.group==='rocks'?(info.height>=64?58:38):info.group==='crystals'?68:(info.height>=64?54:34));
  const scale=(targetH/info.height)*Math.max(.8,Math.min(1.18,p.scale||1));
  const sw=targetH*.54*Math.min(1.1,p.scale||1),sh=targetH*.21*Math.min(1.1,p.scale||1);
  if(isTree||info.group==='bushes'){
   shadows.fillStyle(0x0b160e,.24).fillEllipse(p.x,p.y+3,sw*1.18,sh*1.18);
   shadows.fillStyle(0x0b160e,.32).fillEllipse(p.x,p.y+2,sw*.85,sh*.85);
   if(isTree){
    const mossCol=m.id===6?0xd0eef7:m.id===3?0xb56d35:m.id===9?0x5c372b:0x3f6e34;
    shadows.fillStyle(mossCol,.45).fillEllipse(p.x-5,p.y+2,12,6).fillEllipse(p.x+7,p.y+1,10,5);
    shadows.fillStyle(0x523b26,.55).fillRect(p.x-5,p.y-1,3,4).fillRect(p.x+3,p.y,3,3);
   }
  }else if(info.group==='rocks'||info.group==='ruins'){
   shadows.fillStyle(0x0d140f,.3).fillEllipse(p.x+1,p.y+3,sw*1.05,sh*1.05);
   shadows.fillStyle(0x5b6156,.55).fillCircle(p.x-sw*.35,p.y+2,3).fillCircle(p.x+sw*.3,p.y+3,2.5);
   shadows.fillStyle(0x3f6e34,.45).fillRect(p.x-6,p.y,5,3).fillRect(p.x+3,p.y+1,4,2);
  }else if(info.group==='crystals'){
   const glowCol=m.id===9||m.id===10?0xff8a47:0x7ee8ff;
   shadows.fillStyle(glowCol,.16).fillEllipse(p.x,p.y+1,sw*1.3,sh*1.4);
   shadows.fillStyle(0x0d140f,.3).fillEllipse(p.x,p.y+2,sw*.8,sh*.8);
  }
  const obj=s.add.image(p.x,p.y,asset).setOrigin(.5,.83).setScale(scale).setFlipX(Math.round(p.x)%2===1).setDepth(p.y);
  if(p.habitat==='dead')obj.setTint(0x9b8dba);else if(p.habitat==='ice')obj.setTint(0xb4dce5);else if(['lava','fire'].includes(p.habitat))obj.setTint(0x8c7161);
  s.mapObjects.push(obj);
  if(isTree||info.group==='bushes')s.swayProps.push({obj,x:p.x,y:p.y,baseScaleX:obj.scaleX,baseScaleY:obj.scaleY,amp:isTree?.028:.05,phase:p.x*.013+p.y*.017});
  if(isTree&&(p.habitat==='dead'||deadZones.some(z=>Math.hypot((p.x-z.x)/z.rx,(p.y-z.y)/z.ry)<=1.15)))deadTrees.push({x:p.x+(rand()-.5)*16,y:p.y-targetH*.66});
 }
 for(const camp of m.camps||[]){const marker=s.add.graphics().setDepth(camp.y-1);marker.lineStyle(2,0xb5bd7d,.45).strokeEllipse(camp.x,camp.y,camp.small?56:80,camp.small?22:30);s.mapObjects.push(marker,s.add.text(camp.x,camp.y-(camp.small?68:85),'TRẠI '+({wolf:'SÓI',serpent:'RẮN',undead:'UNDEAD',harpy:'HARPY',stone:'ĐÁ',dragon:'RỒNG'}[camp.family]),{fontFamily:'Segoe UI',fontSize:'10px',color:'#cfdaa7',stroke:'#14251c',strokeThickness:3}).setOrigin(.5));}
 // Roadside details: rocks, mushrooms, ferns and bushes stay visual and never block a lane.
 for(const lane of m.lanes){for(let k=1;k<lane.length;k++){const a=lane[k-1],b=lane[k],len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=50;t<len;t+=45){const side=rand()>.5?1:-1,x=a[0]+(b[0]-a[0])*t/len-(b[1]-a[1])/len*side*(70+rand()*14),y=a[1]+(b[1]-a[1])*t/len+(b[0]-a[0])/len*side*(70+rand()*14);if(Math.hypot(x-m.base.x,y-m.base.y)<250)continue;const id=['chanterelles1','chanterelles2','bush_simple1_1','bush_blue_flowers1','fern1_1','fern2_1','rock1_1','rock2_1','beige_green_mushroom1'][Math.floor(rand()*9)],info=ensureCustomPropTexture(s,id)||infoById.get(id);if(info){shadows.fillStyle(0x101c13,.22).fillEllipse(x,y+1,16,7);const propObj=s.add.image(x,y,id).setOrigin(.5,.85).setScale((22+rand()*10)/info.height).setFlipX(rand()>.5).setDepth(y);s.mapObjects.push(propObj);if(!id.startsWith('rock'))s.swayProps.push({obj:propObj,x,y,baseScaleX:propObj.scaleX,baseScaleY:propObj.scaleY,amp:.065,phase:x*.019+y*.011});}}}}
 s.mapObjects.push(...buildFortress(s,m,catalog));
 const glow=s.add.graphics().setDepth(m.base.y+56);glow.fillStyle(0xffd58b,.1).fillCircle(m.base.x-25,m.base.y+27,18).fillCircle(m.base.x+25,m.base.y+27,18);s.mapObjects.push(glow);
 for(const lane of m.lanes){const [x,y]=lane[0];const portal=s.add.graphics().setDepth(-20);portal.fillStyle(0x1c0e0c,.65).fillEllipse(x,y,98,58);portal.fillStyle(0x4a1a12,.45).fillEllipse(x,y,74,42);portal.lineStyle(3.5,0xff7a45,.9).strokeEllipse(x,y,68,39);portal.lineStyle(2,0xffcfa3,.7).strokeEllipse(x,y,86,50);portal.lineStyle(1.5,0xffe8b8,.5).strokeEllipse(x,y,44,25);for(let i=0;i<8;i++){const a=i/8*Math.PI*2,sx=x+Math.cos(a)*44,sy=y+Math.sin(a)*25;portal.fillStyle(0x3a2d2b,.95).fillTriangle(sx-5,sy+2,sx+5,sy+2,sx,sy-13);portal.fillStyle(0xff9b5e,.9).fillCircle(sx,sy-5,2);}s.mapObjects.push(portal,s.add.text(x,y-46,'QUÂN VÂY HÃM',{fontFamily:'Segoe UI',fontSize:'10px',color:'#f5c7a3',stroke:'#211512',strokeThickness:3}).setOrigin(.5));}
 for(const obj of entities.values()){clearLeaderAuras(obj);obj.buffArt?.destroy();obj.sprite.destroy();obj.label.destroy();}entities.clear();
 for(let n=1;n<=3;n++){const info=catalog.props.find(p=>p.id===`cloud-${n}`);if(!info||!s.textures.exists(info.id))continue;const cloud=s.add.image((n*531+m.id*37)%m.width,100+n*270,info.id).setAlpha(m.id===9?.09:.065).setDepth(4000).setScale(.6).setScrollFactor(.82);s.mapObjects.push(cloud);s.sceneryTweens.push(s.tweens.add({targets:cloud,x:cloud.x+350,duration:60000+n*5000,yoyo:true,repeat:-1}));}
 s.waterFX=s.add.graphics().setDepth(-95);s.mapObjects.push(s.waterFX);
 s.foliageFX=s.add.graphics().setDepth(-94);s.mapObjects.push(s.foliageFX);
 s.crowFX=s.add.graphics().setDepth(2700);s.mapObjects.push(s.crowFX);
 s.crows=deadTrees.length?Array.from({length:Math.min(14,Math.max(4,deadTrees.length))},(_,i)=>({from:deadTrees[i%deadTrees.length],to:deadTrees[(i+1)%deadTrees.length],phase:rand()*8,period:5.5+rand()*3})):[];
 const denseZones=(m.environment||[]).filter(z=>z.type==='dense');
 s.critters=Array.from({length:14},(_,i)=>{
  const z=denseZones.length?denseZones[i%denseZones.length]:{x:m.width*(.2+(i%4)*.2),y:m.height*(.25+Math.floor(i/4)*.2),rx:180,ry:120};
  return {kind:['rabbit','squirrel','butterfly'][i%3],x:z.x+(rand()-.5)*z.rx*1.1,y:z.y+(rand()-.5)*z.ry*1.1,phase:rand()*6.28,color:[0xffe478,0xf7a8c4,0xa3e8ff][i%3]};
 });
 s.weather=s.add.graphics().setDepth(2800);s.mapObjects.push(s.weather);s.weatherStage=m.id;
 s.atmosphere=s.add.graphics().setDepth(3500).setScrollFactor(0);s.mapObjects.push(s.atmosphere);
 s.weatherPoints=Array.from({length:95},()=>({x:rand()*m.width,y:rand()*m.height,speed:.5+rand(),phase:rand()*6}));
 s.fogBanks=Array.from({length:10},(_,i)=>({x:(i/10)*1.4,y:.1+(i*0.17)%0.8,rx:220+rand()*180,ry:65+rand()*55,speed:.012+rand()*.012,phase:rand()*6}));
}
export function updateScenery(s,time){
 for(const a of s.fauna||[]){const t=time/6000+a.phase,x=a.x+Math.sin(t)*38,y=a.y+Math.cos(t*.7)*20,dx=x-a.sprite.x,dy=y-a.sprite.y,row=Math.abs(dx)>Math.abs(dy)?dx<0?2:3:dy<0?1:0;a.sprite.setPosition(x,y).setDepth(y).play(`${a.id}:walk${row?':'+row:''}`,true);}
 const cam=s.cameras?.main?.worldView;
 const sector=Math.floor(time/6000)%4,frac=(time%6000)/6000,blend=frac>.8?(frac-.8)/.2:0;
 const windAngle=(sector+blend*blend*(3-2*blend))*(Math.PI/2),wx=Math.cos(windAngle),wy=Math.sin(windAngle);
 if(cam&&s.swayProps?.length){
  for(const item of s.swayProps){
   if(item.x<cam.x-120||item.x>cam.right+120||item.y<cam.y-120||item.y>cam.bottom+140)continue;
   const wave=Math.sin(time/480-(item.x*wx+item.y*wy)*.012+item.phase);
   item.obj.rotation=(wx*.85+.15*Math.sin(item.phase))*wave*item.amp;
   item.obj.scaleY=item.baseScaleY*(1-wy*wave*item.amp*.45);
   item.obj.scaleX=item.baseScaleX*(1+Math.abs(wx)*wave*item.amp*.15);
  }
 }
 if(s.foliageFX){
  s.foliageFX.clear();
  if(cam&&s.swayFlowers?.length){
   for(const f of s.swayFlowers){
    if(f.x<cam.x-40||f.x>cam.right+40||f.y<cam.y-40||f.y>cam.bottom+40)continue;
    const wave=Math.sin(time/420-(f.x*wx+f.y*wy)*.015+f.phase);
    const dx=wx*wave*3.5,dy=wy*wave*1.8;
    s.foliageFX.lineStyle(1.5,0x3c6b35,.85).lineBetween(f.x,f.y,f.x+dx,f.y-5+dy);
    s.foliageFX.fillStyle(f.color,.9).fillCircle(f.x+dx,f.y-5+dy,2.3);
    s.foliageFX.fillStyle(0xfff6bd,.95).fillCircle(f.x+dx,f.y-5+dy,.9);
   }
  }
  if(cam&&s.critters?.length){
   for(const cr of s.critters){
    const t=time/1000+cr.phase,cx=cr.x+Math.sin(t*.7)*28,cy=cr.y+Math.cos(t*.55)*16,dir=Math.cos(t*.7)>=0?1:-1;
    if(cx<cam.x-40||cx>cam.right+40||cy<cam.y-40||cy>cam.bottom+40)continue;
    if(cr.kind==='butterfly'){
     const wing=Math.abs(Math.sin(time/80+cr.phase))*3.5,fy=cy-10+Math.sin(time/180+cr.phase)*4;
     s.foliageFX.fillStyle(cr.color,.9).fillEllipse(cx-wing,fy,3.5,2.5).fillEllipse(cx+wing,fy,3.5,2.5);
     s.foliageFX.fillStyle(0x2a241d,1).fillRect(cx-.5,fy-2,1,4);
    }else if(cr.kind==='rabbit'){
     const hop=Math.max(0,Math.sin(time/220+cr.phase))*5;
     s.foliageFX.fillStyle(0x141f15,.25).fillEllipse(cx,cy+2,8,3.5);
     s.foliageFX.fillStyle(0xe8dfd1,.95).fillEllipse(cx,cy-hop,7,5).fillCircle(cx+dir*3,cy-3-hop,2.5);
     s.foliageFX.fillRect(cx+dir*2,cy-7-hop,1.5,4).fillRect(cx+dir*3.8,cy-6.5-hop,1.5,3.5);
    }else{
     const scur=Math.abs(Math.sin(time/140+cr.phase))*2.5;
     s.foliageFX.fillStyle(0x141f15,.25).fillEllipse(cx,cy+2,8,3.5);
     s.foliageFX.fillStyle(0xa86434,.95).fillEllipse(cx,cy-scur,6.5,4.2).fillCircle(cx+dir*3,cy-2-scur,2.2);
     s.foliageFX.fillStyle(0xc77d48,.95).fillEllipse(cx-dir*4,cy-3-scur,4,5);
    }
   }
  }
 }
 if(s.crowFX){
  s.crowFX.clear();
  if(cam&&s.crows?.length){
   for(const c of s.crows){
    const cycle=(time/1000/c.period+c.phase)%2;
    const flying=cycle>1.35;
    const u=flying?(cycle-1.35)/.65:0;
    const cx=flying?c.from.x+(c.to.x-c.from.x)*u:c.from.x;
    const cy=flying?c.from.y+(c.to.y-c.from.y)*u-Math.sin(u*Math.PI)*55:c.from.y;
    if(cx<cam.x-60||cx>cam.right+60||cy<cam.y-60||cy>cam.bottom+60)continue;
    if(flying){
     const flap=Math.sin(time/55+c.phase)*5;
     s.crowFX.lineStyle(2,0x141118,.95).lineBetween(cx-6,cy-flap,cx,cy).lineBetween(cx,cy,cx+6,cy-flap);
     s.crowFX.fillStyle(0x1e1924,1).fillCircle(cx,cy,2.3);
    }else{
     const bob=Math.sin(time/320+c.phase)>.7?1:0;
     s.crowFX.fillStyle(0x16121b,.95).fillEllipse(cx,cy-1,6,4.5).fillCircle(cx+2,cy-4+bob,2.2);
     s.crowFX.fillStyle(0x8c8172,.95).fillTriangle(cx+3.5,cy-4.5+bob,cx+3.5,cy-3+bob,cx+6,cy-3.8+bob);
    }
   }
  }
 }
 if(!s.weather)return;s.weather.clear();const stage=s.weatherStage;updateEnvironmentFX(s,time);updateHydrologyFX(s,time);
 for(const p of s.weatherPoints){
  const rising=stage===9||stage===10;
  const x=(p.x+time/(stage===5?45:85)*p.speed+wx*26)%s.mapWidth;
  const rawY=(p.y+(rising?-1:1)*time/(stage===7?12:70)*p.speed+wy*14)%s.mapHeight;
  const y=rawY<0?rawY+s.mapHeight:rawY,px=x<0?x+s.mapWidth:x;
  if(stage===6||stage===8){s.weather.fillStyle(0xeaf9ff,.7).fillCircle(px,y,1.8+(p.phase%1.4));if(stage===6)s.weather.lineStyle(1.3,0xdcf5ff,.45).lineBetween(px,y,px+10,y-5);if(p.phase>4.2)s.weather.lineStyle(1,0xffffff,.5).lineBetween(px-2.5,y,px+2.5,y);}
  else if(stage===7){s.weather.lineStyle(1,0x9ec5ba,.26).lineBetween(px,y,px-4,y+12);if(p.phase>5)s.weather.lineStyle(1,0xbce3d8,.22).strokeEllipse(px-4,y+13,6,2.5);}
  else if(rising)s.weather.fillStyle(stage===9?0xffb274:0xc29ada,.44).fillCircle(px,y,1.6+Math.sin(time/150+p.phase)*.6);
  else if(stage===3)s.weather.fillStyle(p.phase>3?0xd59b57:0xc76642,.42).fillEllipse(px,y,4.5,2.2);
  else if(stage===5)s.weather.fillStyle(0xe8d095,.34).fillRect(px,y,4,1.5);
  else s.weather.fillStyle(0xf5f2a8,.24+Math.sin(time/450+p.phase)*.1).fillCircle(px,y,1.5);
 }
 if(s.atmosphere){
  s.atmosphere.clear();
  const sw=s.scale.width,sh=s.scale.height;
  // Tối (giảm ánh sáng toàn cảnh)
  const dimAlpha=stage>=7?.25:stage===6?.16:.19;
  const dimColor=stage===6?0x0c1722:stage===9?0x1a0d0a:stage===10?0x140d1c:0x080f0b;
  s.atmosphere.fillStyle(dimColor,dimAlpha).fillRect(0,0,sw,sh);
  // Sương mù trôi nhẹ qua màn hình
  const fogCol=stage===6?0xdff4ff:stage===9?0x8a5e4d:stage===10?0x9e88ba:0xbcd1c7;
  const fogAlpha=stage===7||stage===8?.11:stage===6?.09:.07;
  for(const f of s.fogBanks||[]){
   const fx=((f.x+time/1000*f.speed)%1.4-.2)*sw,fy=f.y*sh+Math.sin(time/2400+f.phase)*18;
   s.atmosphere.fillStyle(fogCol,fogAlpha).fillEllipse(fx,fy,f.rx*2,f.ry*2);
   s.atmosphere.fillStyle(fogCol,fogAlpha*.6).fillEllipse(fx+45,fy+12,f.rx*1.4,f.ry*1.4);
  }
 }
}
export function drawMiniMap(s,state,map){
 const g=s.mini;g.clear();const w=174,h=116,x=Math.max(8,s.scale.width-188),y=13;
 g.fillStyle(0x101b17,.9).fillRoundedRect(x-7,y-7,w+14,h+14,5);g.lineStyle(1,0xc3b879,.5).strokeRoundedRect(x-7,y-7,w+14,h+14,5);
 g.fillStyle(map.ground,.8).fillRect(x,y,w,h);const sx=w/map.width,sy=h/map.height;
 for(const water of map.rivers||[]){g.lineStyle(water.type==='deep'?4:water.type==='abyss'?3.5:2,water.type==='abyss'?0x1b1424:water.type==='deep'?0x36778e:0x8ac7ca,.9);g.beginPath();water.points.forEach(([a,b],i)=>i?g.lineTo(x+a*sx,y+b*sy):g.moveTo(x+a*sx,y+b*sy));g.strokePath();}
 for(const z of map.environment||[])g.fillStyle(BIOMES[z.type].color,.6).fillEllipse(x+z.x*sx,y+z.y*sy,z.rx*2*sx,z.ry*2*sy);for(const t of map.territories||[])g.lineStyle(1,t.color,.9).strokeCircle(x+t.x*sx,y+t.y*sy,6);
 for(const lane of map.lanes){g.lineStyle(2,map.road,.8);g.beginPath();lane.forEach(([a,b],i)=>i?g.lineTo(x+a*sx,y+b*sy):g.moveTo(x+a*sx,y+b*sy));g.strokePath();}
 g.fillStyle(0xe8c784).fillRect(x+map.base.x*sx-4,y+map.base.y*sy-3,8,6);
 for(const camp of map.camps||[])g.lineStyle(1,0x91b27b,.65).strokeCircle(x+camp.x*sx,y+camp.y*sy,4);
 for(const drop of state.loot||[])g.fillStyle(0xa8e8e2).fillRect(x+drop.x*sx-1,y+drop.y*sy-1,2,2);
 for(const e of state.enemies)g.fillStyle(e.neutral?0xa4c67f:0xee8e79).fillCircle(x+e.x*sx,y+e.y*sy,e.boss?3:1.6);
 for(const t of state.troops)g.fillStyle(0x9bdcc4).fillCircle(x+t.x*sx,y+t.y*sy,1.5);
 for(const p of state.players)g.fillStyle(p.hp>0?0xfff1b8:0x999999).fillCircle(x+p.x*sx,y+p.y*sy,2.5);
 const cam=s.cameras.main;g.lineStyle(1,0xe6e2c7,.6).strokeRect(x+cam.scrollX*sx,y+cam.scrollY*sy,cam.width/cam.zoom*sx,cam.height/cam.zoom*sy);
}
