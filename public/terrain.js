import {LUSH_ROADSIDE,HARSH_ROADSIDE} from './roadside-assets.js';
import {beginPropStream,registerStreamProp,updatePropStream} from './prop-stream.js';
import {updateSceneryBudget,indexStaticScenery,updateStaticScenery} from './scenery-budget.js';
import {installAmbientLife,updateAmbientLife} from './ambient-life.js';
import {drawRoadNetwork} from './landscape-structures.js';
import {weatherForMap,drawWeather} from './weather-art.js';
import {getActiveViews,inAnyView} from './weather-visibility.js';
import {drawCastleCourt,castleCourt,inCastleCourt} from './castle-court.js';
import {drawHydrology,drawTerritory,updateHydrologyFX} from './landscape-art.js';
import {drawEnvironmentPatch,updateEnvironmentFX} from './environment-art.js';
import {BIOMES} from './world-biomes.js';
import {clearLeaderAuras} from './leader-auras.js';
import {WORLD,distanceToSegment} from './content.js';
import {ensureCustomPropTexture,CUSTOM_PROP_META} from './custom-props-art.js';
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

// Unify legacy vegetation aliases into CraftPix Top-Down 16-bit Pixel-Art sprites
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
 beginPropStream(s);s.mapBiomeStage=m.id;s.sceneryBudget=null;
 for(const tween of s.sceneryTweens||[])tween.remove();s.sceneryTweens=[];s.fauna=[];
 if(s.mapObjects)for(const obj of s.mapObjects)obj.destroy();s.mapObjects=[];
 if(s.groundKey&&s.textures.exists(s.groundKey))s.textures.remove(s.groundKey);
 const key='ground-'+m.id;s.groundKey=key;
 const resolution=Math.min(1,2400/m.width),canvas=s.textures.createCanvas(key,Math.ceil(m.width*resolution),Math.ceil(m.height*resolution)),c=canvas.context;c.scale(resolution,resolution);c.imageSmoothingEnabled=false;s.mapWidth=m.width;s.mapHeight=m.height;s.environment=m.environment;
 let seed=m.id*531;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};

 drawMapGround(c,s,m,rand);

 // 2. Forest trails & organic monster camp clearings
 c.lineCap='round';c.lineJoin='round';
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
 for(const z of m.environment)drawEnvironmentPatch(c,s,z);for(const t of m.territories)drawTerritory(c,s,t);drawMapTrails(c,m);drawMapRoads(c,s,m,rand);drawHydrology(c,s,m);drawCastleCourt(c,s,m);drawNonBlockingDecor(c,m,inCastleCourt,rand);
 // Subtle macro sunlight & atmospheric edge vignette for 2.5D depth
 const sunCol=m.id===6?'#d9f6ff16':m.id===3||m.id===5?'#ffda9418':m.id===9?'#ff7b3b18':m.id===10?'#b58aff14':'#fff0ba14';
 const sun=c.createRadialGradient(m.width*.45,m.height*.38,m.width*.08,m.width*.5,m.height*.5,m.width*.68);
 sun.addColorStop(0,sunCol);sun.addColorStop(.7,'rgba(0,0,0,0)');sun.addColorStop(1,'rgba(8,14,10,0.24)');
 c.fillStyle=sun;c.fillRect(0,0,m.width,m.height);
 const infoById=new Map(catalog.props.map(p=>[p.id,p]));
 // Bake all static prop & tree shadows directly onto the 2D ground canvas instead of a 15,000-ellipse WebGL Phaser.Graphics
 const shadows={
  fillStyle(col,a=1){c.fillStyle=hex(col);c.globalAlpha=a;return this;},
  fillEllipse(x,y,w,h){c.beginPath();c.ellipse(x,y,w*.5,h*.5,0,0,Math.PI*2);c.fill();return this;},
  fillCircle(x,y,r){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();return this;},
  fillRect(x,y,w,h){c.fillRect(x,y,w,h);return this;}
 };
 // 2.5D Y-sorted pixel-art mountain massifs, trees & rocky outcrops synchronized with terrain
 const ridgeTreeId=m.id===6?'snow_tree1':m.id===3?'autumn_tree1':(m.id===9||m.id===10)?'burned_tree1':'christmas_tree1';
 const ridgeAltId=m.id===6?'rock2_1':m.id===3?'tree1':(m.id===9||m.id===10)?'rock3_1':'rock1_1';
 const mtnIds=['prop-mtn-main','prop-mtn-wide','prop-mtn-spur'];
 for(const z of m.environment||[]){
  if(z.type!=='mountain')continue;
  if(z.ridge&&z.spine?.length>1){
   const nPts=z.spine.length;
   for(let i=0;i<nPts;i++){
    const [sx,sy]=z.spine[i],u=i/(nPts-1),t=Math.pow(Math.sin(u*Math.PI),.55);
    const id=i===0||i===nPts-1?'prop-mtn-spur':mtnIds[i%2],info=ensureCustomPropTexture(s,id);
    if(info){
     const mx=sx+(rand()-.5)*14,my=sy+14+(i%2?8:-6);
     if(!inCastleCourt(m,{x:mx,y:my})){
      const sc=(info.targetH/info.height)*(.68+.48*t);
      registerStreamProp(s,{x:mx,y:my,key:id,width:info.width,height:info.height,originY:.82,scale:sc,flip:i%2===1,tint:m.id===6?0xd0eef7:m.id===3?0xe8c79e:m.id===9||m.id===10?0x947972:null});
     }
    }
    if(i>0){
     const [ax,ay]=z.spine[i-1],tx=(ax+sx)*.5+(rand()-.5)*22,ty=(ay+sy)*.5+z.width*.52;
     if(!inCastleCourt(m,{x:tx,y:ty})){
      const pid=i%3===0?ridgeAltId:ridgeTreeId,pinfo=infoById.get(pid)||ensureCustomPropTexture(s,pid);
      if(pinfo){
       const sc=(pinfo.group==='rocks'?46:108)/pinfo.height*(.82+rand()*.2);
       shadows.fillStyle(0x09120b,.26).fillEllipse(tx+4,ty+2,36,13);
       registerStreamProp(s,{x:tx,y:ty,key:pid,width:pinfo.width,height:pinfo.height,originY:.84,scale:sc,flip:i%2===1});
      }
     }
    }
   }
   continue;
  }
  const pts=[[z.x-z.rx*.5,z.y],[z.x,z.y-z.ry*.15],[z.x+z.rx*.5,z.y]];
  for(const [px,py]of pts){
   const pw=Math.round((28+rand()*12)/2)*2,ph=Math.round((34+rand()*14)/2)*2,rx=Math.round(px/2)*2,ry=Math.round(py/2)*2;
   const pk=s.add.graphics().setDepth(ry);
   pk.fillStyle(0x141812,1).fillRect(rx-pw/2-2,ry-ph-2,pw+4,ph+4);
   pk.fillStyle(0x465047,1).fillRect(rx-pw/2,ry-ph,pw,ph);
   pk.fillStyle(0x616b60,1).fillRect(rx-pw/2+2,ry-ph+2,pw/2,ph-4);
   pk.fillStyle(0x899485,1).fillRect(rx-pw/2+2,ry-ph+2,pw-6,8);
   pk.fillStyle(0xd2ded6,1).fillRect(rx-pw/2+4,ry-ph,pw-8,4);
   s.mapObjects.push(pk);
  }
 }
 s.swayProps=[];s.swayFlowers=(m.flowers||[]).map(f=>({x:f.x,y:f.y,color:f.color,phase:f.x*.021+f.y*.017}));
 const deadZones=(m.environment||[]).filter(z=>z.type==='dead'),deadTrees=[];
 const onBridge=(x,y,pad=52)=>(m.bridges||[]).some(b=>{const dx=x-b.x,dy=y-b.y,ca=Math.cos(b.angle),sa=Math.sin(b.angle);return Math.abs(dx*ca+dy*sa)<b.length*.5+pad&&Math.abs(-dx*sa+dy*ca)<(b.width||160)*.5+pad;});
 for(const p of m.props){
  if(onBridge(p.x,p.y,48))continue;
  const asset=unifiedPropAsset(p.asset),info=infoById.get(asset)||ensureCustomPropTexture(s,asset);if(!info)continue;
  // Keep uniform ~1.05x pixel density across all tree/bush sizes so pixels never look unevenly chunky
  const isTree=info.group==='trees'||info.group==='forest';
  const targetH=info.targetH||(isTree?(info.height>=120?132:86):info.group==='ruins'?98:info.group==='rocks'?(info.height>=64?58:38):info.group==='crystals'?68:(info.height>=64?54:34));
  const scale=(targetH/info.height)*Math.max(.8,Math.min(1.18,p.scale||1));
  const sw=targetH*.54*Math.min(1.1,p.scale||1),sh=targetH*.21*Math.min(1.1,p.scale||1);
  if(isTree||info.group==='bushes'){
   shadows.fillStyle(0x09120b,.2).fillEllipse(p.x+11,p.y+5,sw*1.15,sh*1.05);
   shadows.fillStyle(0x0b160e,.24).fillEllipse(p.x,p.y+3,sw*1.18,sh*1.18);
   shadows.fillStyle(0x0b160e,.32).fillEllipse(p.x,p.y+2,sw*.85,sh*.85);
   if(isTree){
    const mossCol=m.id===6?0xd0eef7:m.id===3?0xb56d35:m.id===9?0x5c372b:0x3f6e34;
    shadows.fillStyle(mossCol,.45).fillEllipse(p.x-5,p.y+2,12,6).fillEllipse(p.x+7,p.y+1,10,5);
    shadows.fillStyle(0x523b26,.55).fillRect(p.x-5,p.y-1,3,4).fillRect(p.x+3,p.y,3,3);
   }
  }else if(info.group==='rocks'||info.group==='ruins'){
   shadows.fillStyle(0x09120b,.22).fillEllipse(p.x+9,p.y+5,sw*1.1,sh*1.05);
   shadows.fillStyle(0x0d140f,.3).fillEllipse(p.x+1,p.y+3,sw*1.05,sh*1.05);
   shadows.fillStyle(0x5b6156,.55).fillCircle(p.x-sw*.35,p.y+2,3).fillCircle(p.x+sw*.3,p.y+3,2.5);
   shadows.fillStyle(0x3f6e34,.45).fillRect(p.x-6,p.y,5,3).fillRect(p.x+3,p.y+1,4,2);
  }else if(info.group==='crystals'){
   const glowCol=m.id===9||m.id===10?0xff8a47:0x7ee8ff;
   shadows.fillStyle(glowCol,.16).fillEllipse(p.x,p.y+1,sw*1.3,sh*1.4);
   shadows.fillStyle(0x0d140f,.3).fillEllipse(p.x,p.y+2,sw*.8,sh*.8);
  }
  // Low, nonblocking ground detail can share the baked ground texture.
  if(!p.radius&&!isTree&&info.group!=='bushes'&&info.height*scale<30&&!CUSTOM_PROP_META[asset]){
   const tx=s.textures.get(asset),frame=tx?.get?.(),image=tx?.getSourceImage?.();
   if(image&&frame){c.save();c.globalAlpha=1;c.translate(p.x,p.y);if(Math.round(p.x)%2===1)c.scale(-1,1);c.drawImage(image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,-info.width*scale*.5,-info.height*scale*.83,info.width*scale,info.height*scale);c.restore();continue;}
  }
  const streamed=registerStreamProp(s,{x:p.x,y:p.y,key:asset,width:info.width,height:info.height,originY:CUSTOM_PROP_META[asset]?(info.height-5)/info.height:.83,scale,flip:Math.round(p.x)%2===1,amp:isTree?.028:.05,phase:p.x*.013+p.y*.017});
  if(isTree||info.group==='bushes')s.swayProps.push(streamed);
  if(isTree&&(p.habitat==='dead'||deadZones.some(z=>Math.hypot((p.x-z.x)/z.rx,(p.y-z.y)/z.ry)<=1.15)))deadTrees.push({x:p.x+(rand()-.5)*16,y:p.y-targetH*.66});
 }
 for(const camp of m.camps||[]){const marker=s.add.graphics().setDepth(camp.y-1);marker.lineStyle(2,0xb5bd7d,.45).strokeEllipse(camp.x,camp.y,camp.small?56:80,camp.small?22:30);s.mapObjects.push(marker,s.add.text(camp.x,camp.y-(camp.small?68:85),'TRẠI '+({wolf:'SÓI',serpent:'RẮN',undead:'UNDEAD',harpy:'HARPY',stone:'ĐÁ',dragon:'RỒNG'}[camp.family]),{fontFamily:'Segoe UI',fontSize:'10px',color:'#cfdaa7',stroke:'#14251c',strokeThickness:3}).setOrigin(.5));}
 // Roadside details: lush non-blocking flowers, ferns and bushes along non-ice/lava/swamp/dead lanes.
 const harshMap=m.id===6||m.id===7||m.id>=9;
 const lushFlora=LUSH_ROADSIDE,harshFlora=HARSH_ROADSIDE;
 const roadStep=m.width>=5000?56:36;
 for(const lane of m.lanes){for(let k=1;k<lane.length;k++){const a=lane[k-1],b=lane[k],len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=45;t<len;t+=roadStep){for(const side of [-1,1]){const x=a[0]+(b[0]-a[0])*t/len-(b[1]-a[1])/len*side*(66+rand()*16),y=a[1]+(b[1]-a[1])*t/len+(b[0]-a[0])/len*side*(66+rand()*16);if(Math.hypot(x-m.base.x,y-m.base.y)<250||onBridge(x,y,52)||waterAt(m,{x,y}))continue;const zHit=(m.environment||[]).some(z=>['ice','lava','fire','swamp','dead'].includes(z.type)&&Math.hypot((x-z.x)/(z.rx||1),(y-z.y)/(z.ry||1))<=1);const pool=(harshMap||zHit)?harshFlora:lushFlora,id=pool[Math.floor(rand()*pool.length)],info=infoById.get(id)||ensureCustomPropTexture(s,id);if(info){shadows.fillStyle(0x101c13,.20).fillEllipse(x,y+1,16,7);const sc=(24+rand()*12)/info.height;if(id.startsWith('rock')&&s.textures.exists(id)){const img=s.textures.get(id).getSourceImage();if(img){c.globalAlpha=1;const dw=info.width*sc,dh=info.height*sc;c.drawImage(img,x-dw*.5,y-dh*.85,dw,dh);continue;}}const streamed=registerStreamProp(s,{x,y,key:id,width:info.width,height:info.height,originY:.85,scale:sc,flip:rand()>.5,amp:.065,phase:x*.019+y*.011});if(!id.startsWith('rock'))s.swayProps.push(streamed);}}}}}
 c.globalAlpha=1;
 canvas.refresh();const gTex=s.textures.get(key),cw=canvas.width,ch=canvas.height,tileSize=Math.max(1,Math.round(512*resolution));let ci=0;
 for(let cy=0;cy<ch;cy+=tileSize)for(let cx=0;cx<cw;cx+=tileSize){const fw=Math.min(tileSize,cw-cx),fh=Math.min(tileSize,ch-cy),frame='chunk-'+ci++;gTex.add(frame,0,cx,cy,fw,fh);s.mapObjects.push(s.add.image(cx/resolution,cy/resolution,key,frame).setOrigin(0).setScale(1/resolution).setDepth(-100));}
 for(const t of m.territories)s.mapObjects.push(s.add.text(t.x,t.y-t.radius*.72,'LÃNH ĐỊA · '+t.name.toUpperCase(),{fontFamily:'Segoe UI',fontSize:'14px',color:hex(t.color),stroke:'#152318',strokeThickness:4}).setOrigin(.5).setDepth(t.y));for(const water of m.rivers||[]){const point=water.points.find(pt=>!inCastleCourt(m,{x:pt[0],y:pt[1]}))||water.points[Math.floor(water.points.length/2)];s.mapObjects.push(s.add.text(point[0],point[1]+water.width/2+24,water.name,{fontFamily:'Segoe UI',fontSize:'12px',color:water.type==='deep'?'#a9dce9':'#d0eee1',stroke:'#193229',strokeThickness:3}).setOrigin(.5).setDepth(point[1]));}for(const z of m.environment)s.mapObjects.push(s.add.text(z.x,z.y-z.ry-18,BIOMES[z.type].name,{fontFamily:'Segoe UI',fontSize:'11px',color:'#e7ead1',stroke:'#152318',strokeThickness:3}).setOrigin(.5).setDepth(z.y));
 s.mapObjects.push(...buildFortress(s,m,catalog));
 const glow=s.add.graphics().setDepth(m.base.y+56);glow.fillStyle(0xffd58b,.1).fillCircle(m.base.x-25,m.base.y+27,18).fillCircle(m.base.x+25,m.base.y+27,18);s.mapObjects.push(glow);
 for(const lane of m.lanes){const [x,y]=lane[0];const portal=s.add.graphics().setDepth(-20);portal.fillStyle(0x1c0e0c,.65).fillEllipse(x,y,98,58);portal.fillStyle(0x4a1a12,.45).fillEllipse(x,y,74,42);portal.lineStyle(3.5,0xff7a45,.9).strokeEllipse(x,y,68,39);portal.lineStyle(2,0xffcfa3,.7).strokeEllipse(x,y,86,50);portal.lineStyle(1.5,0xffe8b8,.5).strokeEllipse(x,y,44,25);for(let i=0;i<8;i++){const a=i/8*Math.PI*2,sx=x+Math.cos(a)*44,sy=y+Math.sin(a)*25;portal.fillStyle(0x3a2d2b,.95).fillTriangle(sx-5,sy+2,sx+5,sy+2,sx,sy-13);portal.fillStyle(0xff9b5e,.9).fillCircle(sx,sy-5,2);}s.mapObjects.push(portal,s.add.text(x,y-46,'QUÂN VÂY HÃM',{fontFamily:'Segoe UI',fontSize:'10px',color:'#f5c7a3',stroke:'#211512',strokeThickness:3}).setOrigin(.5));}
 indexStaticScenery(s,s.mapObjects,getActiveViews(s));
 for(const obj of entities.values()){clearLeaderAuras(obj);obj.buffArt?.destroy();obj.sprite.destroy();obj.label.destroy();}entities.clear();

 s.waterFX=s.add.graphics().setDepth(-95);s.mapObjects.push(s.waterFX);
 s.foliageFX=s.add.graphics().setDepth(-94);s.mapObjects.push(s.foliageFX);
 s.crowFX=s.add.graphics().setDepth(2700);s.mapObjects.push(s.crowFX);
 s.crows=deadTrees.length?Array.from({length:Math.min(14,Math.max(4,deadTrees.length))},(_,i)=>({from:deadTrees[i%deadTrees.length],to:deadTrees[(i+1)%deadTrees.length],phase:rand()*8,period:5.5+rand()*3})):[];
 const denseZones=(m.environment||[]).filter(z=>z.type==='dense');
 s.critters=Array.from({length:14},(_,i)=>{
  const z=denseZones.length?denseZones[i%denseZones.length]:{x:m.width*(.2+(i%4)*.2),y:m.height*(.25+Math.floor(i/4)*.2),rx:180,ry:120};
  return {kind:['rabbit','squirrel','butterfly'][i%3],x:z.x+(rand()-.5)*z.rx*1.1,y:z.y+(rand()-.5)*z.ry*1.1,phase:rand()*6.28,color:[0xffe478,0xf7a8c4,0xa3e8ff][i%3]};
 });
 s.weather=s.add.graphics().setDepth(2800);s.mapObjects.push(s.weather);s.weatherStage=m.id;s.weatherLayers=weatherForMap(m);
 s.atmosphere=s.add.graphics().setDepth(3500);s.mapObjects.push(s.atmosphere);s._weatherClipMask=null;
 s.weatherPoints=Array.from({length:95},()=>({x:rand()*m.width,y:rand()*m.height,speed:.5+rand(),phase:rand()*6}));
 s.fogBanks=Array.from({length:10},(_,i)=>({x:(i/10)*1.4,y:.1+(i*0.17)%0.8,rx:220+rand()*180,ry:65+rand()*55,speed:.012+rand()*.012,phase:rand()*6}));
 // Index swayProps and swayFlowers into 256x256 spatial chunks so offscreen map regions remain 100% dormant until panned to
 s.swayChunkGrid=new Map();
 for(const item of s.swayProps||[]){
  const ck=((item.x>>8)<<16)|(item.y>>8);
  let bucket=s.swayChunkGrid.get(ck);if(!bucket){bucket=[];s.swayChunkGrid.set(ck,bucket);}
  bucket.push(item);
 }
 s.swayFlowerGrid=new Map();
 for(const f of s.swayFlowers||[]){
  const ck=((f.x>>8)<<16)|(f.y>>8);
  let bucket=s.swayFlowerGrid.get(ck);if(!bucket){bucket=[];s.swayFlowerGrid.set(ck,bucket);}
  bucket.push(f);
 }
 updatePropStream(s,getActiveViews(s));installAmbientLife(s,m,catalog);
}
export function updateScenery(s,time){
 if(typeof document!=='undefined'&&document.hidden)return;
 const budget=updateSceneryBudget(s,time);
 if(time-(s._lastSceneryTime||0)<(budget.quality<1?50:33))return;
 s._lastSceneryTime=time;
 const views=getActiveViews(s);
 s._activeViews=views;updateStaticScenery(s,views);updatePropStream(s,views);
 if(!views.length)return;
 const cam=s.cameras?.main,zoom=Math.min(cam?.zoomX??cam?.zoom??1,cam?.zoomY??cam?.zoom??1);
 const frameId=(s._sceneryFrame=(s._sceneryFrame||0)+1);
 if(zoom>=.42){
  updateAmbientLife(s,time,views);
  for(const a of s.fauna||[]){
   if(!inAnyView(views,a.x,a.y,110)){if(a.sprite.visible){a.sprite.setVisible(false);a.sprite.anims?.pause();}continue;}
   if(!a.sprite.visible){a.sprite.setVisible(true);a.sprite.anims?.resume();}
   const t=time/6000+a.phase,x=a.x+Math.sin(t)*38,y=a.y+Math.cos(t*.7)*20,dx=x-a.sprite.x,dy=y-a.sprite.y,row=Math.abs(dx)>Math.abs(dy)?dx<0?2:3:dy<0?1:0;
   if(a.sprite.depth!==Math.round(y))a.sprite.setDepth(Math.round(y));a.sprite.setPosition(x,y).play(`${a.id}:walk${row?':'+row:''}`,true);
  }
 }else{
  if(s.ambientEffects)s.ambientEffects.clear();
  for(const {sprite}of s.ambientLife||[])if(sprite.visible){sprite.setVisible(false);sprite.anims?.pause();}
  for(const a of s.fauna||[])if(a.sprite.visible){a.sprite.setVisible(false);a.sprite.anims?.pause();}
 }
 const sector=Math.floor(time/6000)%4,frac=(time%6000)/6000,blend=frac>.8?(frac-.8)/.2:0;
 const windAngle=(sector+blend*blend*(3-2*blend))*(Math.PI/2),wx=Math.cos(windAngle),wy=Math.sin(windAngle);
 if(zoom>=.42&&s.swayChunkGrid?.size&&time-(s._lastTreeSway??-Infinity)>=100){
  s._lastTreeSway=time;
  const swayStep=zoom<.68||budget.quality<1?2:1;
  for(let vi=0;vi<views.length;vi++){
   const v=views[vi],cx0=(v.x-120)>>8,cx1=(v.right+120)>>8,cy0=(v.y-120)>>8,cy1=(v.bottom+140)>>8;
   for(let cx=cx0;cx<=cx1;cx++)for(let cy=cy0;cy<=cy1;cy++){
    const bucket=s.swayChunkGrid.get((cx<<16)|cy);
    if(!bucket||bucket._f===frameId)continue;
    bucket._f=frameId;
    for(let i=swayStep>1?frameId%swayStep:0;i<bucket.length;i+=swayStep){
     const item=bucket[i];if(!item.obj?.visible)continue;
     const wave=Math.sin(time/480-(item.x*wx+item.y*wy)*.012+item.phase);
     item.obj.rotation=(wx*.85+.15*Math.sin(item.phase))*wave*item.amp+(s.ambientNudges?.get(s.ambientPropCoordinates?.get(item.x+':'+item.y))||0);
     item.obj.scaleY=item.baseScaleY*(1-wy*wave*item.amp*.45);
     item.obj.scaleX=item.baseScaleX*(1+Math.abs(wx)*wave*item.amp*.15);
    }
   }
  }
 }
 if(s.foliageFX){
  s.foliageFX.clear();
  if(zoom>=.65&&s.swayFlowerGrid?.size){
   for(let vi=0;vi<views.length;vi++){
    const v=views[vi],cx0=(v.x-40)>>8,cx1=(v.right+40)>>8,cy0=(v.y-40)>>8,cy1=(v.bottom+40)>>8;
    for(let cx=cx0;cx<=cx1;cx++)for(let cy=cy0;cy<=cy1;cy++){
     const bucket=s.swayFlowerGrid.get((cx<<16)|cy);
     if(!bucket||bucket._f===frameId)continue;
     bucket._f=frameId;
     for(let i=0;i<bucket.length;i++){
      const f=bucket[i];
      const wave=Math.sin(time/420-(f.x*wx+f.y*wy)*.015+f.phase);
      const dx=wx*wave*3.5,dy=wy*wave*1.8;
      s.foliageFX.lineStyle(1.5,0x3c6b35,.85).lineBetween(f.x,f.y,f.x+dx,f.y-5+dy);
      s.foliageFX.fillStyle(f.color,.9).fillRect(f.x+dx-2,f.y-7+dy,4,4);
      s.foliageFX.fillStyle(0xfff6bd,.95).fillRect(f.x+dx-1,f.y-6+dy,2,2);
     }
    }
   }
  }
  if(zoom>=.55&&s.critters?.length){
   for(const cr of s.critters){
    if(!inAnyView(views,cr.x,cr.y,70))continue;
    const t=time/1000+cr.phase,cx=cr.x+Math.sin(t*.7)*28,cy=cr.y+Math.cos(t*.55)*16,dir=Math.cos(t*.7)>=0?1:-1;
    if(!inAnyView(views,cx,cy,40))continue;
    if(cr.kind==='butterfly'){
     const wing=Math.abs(Math.sin(time/80+cr.phase))*3.5,fy=cy-10+Math.sin(time/180+cr.phase)*4;
     s.foliageFX.fillStyle(cr.color,.9).fillRect(cx-wing-2,fy-1,3,3).fillRect(cx+wing-1,fy-1,3,3);
     s.foliageFX.fillStyle(0x2a241d,1).fillRect(cx-.5,fy-2,1,4);
    }else if(cr.kind==='rabbit'){
     const hop=Math.max(0,Math.sin(time/220+cr.phase))*5;
     s.foliageFX.fillStyle(0x141f15,.25).fillRect(cx-4,cy+1,8,3);
     s.foliageFX.fillStyle(0xe8dfd1,.95).fillRect(cx-3,cy-2-hop,6,4).fillRect(cx+dir*2,cy-5-hop,3,3);
     s.foliageFX.fillRect(cx+dir*2,cy-7-hop,1.5,4).fillRect(cx+dir*3.8,cy-6.5-hop,1.5,3.5);
    }else{
     const scur=Math.abs(Math.sin(time/140+cr.phase))*2.5;
     s.foliageFX.fillStyle(0x141f15,.25).fillRect(cx-4,cy+1,8,3);
     s.foliageFX.fillStyle(0xa86434,.95).fillRect(cx-3,cy-2-scur,6,4).fillRect(cx+dir*2,cy-4-scur,3,3);
     s.foliageFX.fillStyle(0xc77d48,.95).fillRect(cx-dir*5,cy-5-scur,3,5);
    }
   }
  }
 }
 if(s.crowFX){
  s.crowFX.clear();
  if(s.crows?.length){
   for(const c of s.crows){
    const minX=Math.min(c.from.x,c.to.x),maxX=Math.max(c.from.x,c.to.x);
    const minY=Math.min(c.from.y,c.to.y)-60,maxY=Math.max(c.from.y,c.to.y);
    let near=false;
    for(let vi=0;vi<views.length;vi++){const v=views[vi];if(maxX>=v.x-60&&minX<=v.right+60&&maxY>=v.y-60&&minY<=v.bottom+60){near=true;break;}}
    if(!near)continue;
    const cycle=(time/1000/c.period+c.phase)%2;
    const flying=cycle>1.35;
    const u=flying?(cycle-1.35)/.65:0;
    const cx=flying?c.from.x+(c.to.x-c.from.x)*u:c.from.x;
    const cy=flying?c.from.y+(c.to.y-c.from.y)*u-Math.sin(u*Math.PI)*55:c.from.y;
    if(!inAnyView(views,cx,cy,60))continue;
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
 if(!s.weather)return;s.weather.clear();updateEnvironmentFX(s,time,views);updateHydrologyFX(s,time,views);
 drawWeather(s,time,views);
}
export function drawMiniMap(s,state,map){
 const x=Math.max(8,s.scale.width-188),y=13,w=174,h=116,sx=w/map.width,sy=h/map.height;
 if(!s.miniBackground){s.miniBackground=s.add.graphics().setDepth(29999).setScrollFactor(0);s.miniBackgroundMap=null;}
 if(s.miniBackgroundMap!==map){paintMiniMapBackground(s,map);s.miniBackgroundMap=map;}
 s.miniBackground.setPosition(x-7,y-7);
 const g=s.mini;g.clear();
 for(const drop of state.loot||[])g.fillStyle(0xa8e8e2).fillRect(x+drop.x*sx-1,y+drop.y*sy-1,2,2);
 for(const e of state.enemies)g.fillStyle(e.neutral?0xa4c67f:0xee8e79).fillCircle(x+e.x*sx,y+e.y*sy,e.boss?3:1.6);
 for(const t of state.troops)g.fillStyle(0x9bdcc4).fillCircle(x+t.x*sx,y+t.y*sy,1.5);
 for(const p of state.players)g.fillStyle(p.hp>0?0xfff1b8:0x999999).fillCircle(x+p.x*sx,y+p.y*sy,2.5);
 const cam=s.cameras.main;g.lineStyle(1,0xe6e2c7,.6).strokeRect(x+cam.scrollX*sx,y+cam.scrollY*sy,cam.width/(cam.zoomX||cam.zoom||1)*sx,cam.height/(cam.zoomY||cam.zoom||1)*sy);
}

function paintMiniMapBackground(s,map){
 const g=s.miniBackground;g.clear();const w=174,h=116,x=7,y=7;
 g.fillStyle(0x101b17,.9).fillRoundedRect(x-7,y-7,w+14,h+14,5);g.lineStyle(1,0xc3b879,.5).strokeRoundedRect(x-7,y-7,w+14,h+14,5);
 g.fillStyle(map.ground,.8).fillRect(x,y,w,h);const sx=w/map.width,sy=h/map.height;
 for(const water of map.rivers||[]){g.lineStyle(water.type==='deep'?4:water.type==='abyss'?3.5:2,water.surface==='ice'?0xb5dae4:water.surface==='dry'?0xa89470:water.surface==='lava'?0xd66b32:water.type==='abyss'?0x1b1424:water.type==='deep'?0x36778e:0x8ac7ca,.9);g.beginPath();water.points.forEach(([a,b],i)=>i?g.lineTo(x+a*sx,y+b*sy):g.moveTo(x+a*sx,y+b*sy));g.strokePath();}
 for(const z of map.environment||[]){if(z.spine?.length>1){g.lineStyle(4,BIOMES[z.type].color,.75);g.beginPath();z.spine.forEach(([a,b],i)=>i?g.lineTo(x+a*sx,y+b*sy):g.moveTo(x+a*sx,y+b*sy));g.strokePath();}else g.fillStyle(BIOMES[z.type].color,.6).fillEllipse(x+z.x*sx,y+z.y*sy,z.rx*2*sx,z.ry*2*sy);}for(const t of map.territories||[])g.lineStyle(1,t.color,.9).strokeCircle(x+t.x*sx,y+t.y*sy,6);
 for(const lane of map.lanes){g.lineStyle(2,map.road,.8);g.beginPath();lane.forEach(([a,b],i)=>i?g.lineTo(x+a*sx,y+b*sy):g.moveTo(x+a*sx,y+b*sy));g.strokePath();}
 g.fillStyle(0xe8c784).fillRect(x+map.base.x*sx-4,y+map.base.y*sy-3,8,6);
 for(const camp of map.camps||[])g.lineStyle(1,0x91b27b,.65).strokeCircle(x+camp.x*sx,y+camp.y*sy,4);
}

export function drawMapRoads(c,s,m,rand=Math.random){drawRoadNetwork(c,m);}
export function drawMapTrails(c,m){drawRoadNetwork(c,m,true);}

export function drawMapGround(c,s,m,random){
 let seed=m.id*531;const rand=random||(()=>{seed=seed*16807%2147483647;return seed/2147483647;});
 c.imageSmoothingEnabled=false;
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


}
