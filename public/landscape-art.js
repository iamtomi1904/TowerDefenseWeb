import {drawRiverSurface,updateRiverSurfaceFX} from './river-surfaces.js';
import {waterCurrent} from './water-current.js';
import {getActiveViews,inAnyView,boxInAnyView} from './weather-visibility.js';
import {drawRiverBanks,drawShoreRock} from './riverbank-art.js';
import {drawStoneBridge,drawTimberBridge,drawAbyss,bridgeVisualSpan,drawGravelFord} from './landscape-structures.js';
import {biomePattern} from './biome-art.js';
const hex=n=>'#'+n.toString(16).padStart(6,'0');

function traceSmoothPolyline(c,points){
 if(!points||points.length<2)return;
 c.beginPath();
 c.moveTo(points[0][0],points[0][1]);
 for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);
}

export function drawHydrology(c,scene,map){
 c.save();
 c.lineCap='round';
 c.lineJoin='round';

 const iceStage=map.id===6,desertStage=map.id===5,lavaStage=map.id===9;
 const bankOuter=iceStage?'#92b8c788':desertStage?'#8c744877':lavaStage?'#4a332b88':'#2c4a3588';
 const bankSand=iceStage?'#d6eef7':desertStage?'#d4bc85':lavaStage?'#6e564d':'#b3ab7e';
 const bankWet=iceStage?'#8ab8cc':desertStage?'#9c8556':lavaStage?'#4d3b34':'#787556';

 const rivers=[...(map.rivers||[])].sort((a,b)=>(a.type==='deep'?1:0)-(b.type==='deep'?1:0));
 for(const water of rivers){
  const pts=water.points,w=water.width,deep=water.type==='deep',abyss=water.type==='abyss';
  if(!pts||pts.length<2)continue;
  if(abyss){drawAbyss(c,water,map);continue;}
  if(water.surface){drawRiverSurface(c,scene,water,map);continue;}

  drawRiverBanks(c,water,map);

  // 4. Shallow translucent shelf
  traceSmoothPolyline(c,pts);c.strokeStyle=deep?(iceStage?'#5aa5bd':lavaStage?'#3e5c69':'#4693a6'):(iceStage?'#9ee3f0':lavaStage?'#5a828a':'#82ccc8');c.lineWidth=w+6;c.stroke();

  // 5. Main river channel
  traceSmoothPolyline(c,pts);c.strokeStyle=deep?(iceStage?'#2d6f8c':lavaStage?'#213842':'#235973'):(iceStage?'#6dbcd1':lavaStage?'#3c6069':'#58acb3');c.lineWidth=w-6;c.stroke();

  // 6. Deep inner current core & sunlit surface sheen
  traceSmoothPolyline(c,pts);c.strokeStyle=deep?(iceStage?'#1e526b':lavaStage?'#15252e':'#164057'):(iceStage?'#4d9eb5':lavaStage?'#2d4d54':'#43939c');c.lineWidth=Math.max(12,w*.48);c.stroke();
  traceSmoothPolyline(c,pts);c.strokeStyle=deep?'#9ce8f51a':'#e8fff926';c.lineWidth=Math.max(6,w*.18);c.stroke();

  const material=biomePattern(c,scene,deep?'deep':'shallow');if(material){c.save();traceSmoothPolyline(c,pts);c.strokeStyle=material;c.lineWidth=Math.max(8,w-10);c.globalAlpha=.45;c.stroke();c.restore();}

  // 7. Detailed bank textures: organic sand/grass scallops, boulders, reeds, submerged stones, foam & lily pads
  for(let i=1;i<pts.length;i++){
   const [ax,ay]=pts[i-1],[bx,by]=pts[i];
   const len=Math.hypot(bx-ax,by-ay)||1,ux=(bx-ax)/len,uy=(by-ay)/len,nx=-uy,ny=ux;
   const steps=Math.max(3,Math.floor(len/32));
   for(let s=0;s<steps;s++){
    const u=(s+.3)/steps,px=ax+(bx-ax)*u,py=ay+(by-ay)*u;
    const seed=Math.abs((i*97+s*151+Math.round(px)*3)%1000);

    // Organic irregular bank lobes & sand/grass edge variation
    for(const side of [-1,1]){
     // Shoreline white foam dash hugging the water edge
     if((seed+side)%4===0){
      const fx=px+nx*side*(w/2+1),fy=py+ny*side*(w/2+1);
      c.strokeStyle='#e8fffc77';c.lineWidth=2.2;
      c.beginPath();c.moveTo(fx-ux*8,fy-uy*8);c.lineTo(fx+ux*8,fy+uy*8);c.stroke();
     }

     // Bank pebbles & mossy shoreline boulders
     if((seed+s)%3===0){
      const rx=px+nx*side*(w/2+7+(seed%8)),ry=py+ny*side*(w/2+7+(seed%8));
      drawShoreRock(c,rx,ry,4+(seed%5),3+(seed%3),iceStage?'#4a6e82':lavaStage?'#2d221f':'#3d453b',iceStage?'#8eb8cc':lavaStage?'#54413b':'#6f786a',iceStage?'#d9f4ff':lavaStage?'#7d635b':'#9ca695');
     }

     // Riverside reeds / cattails & lush grass tufts
     if(!iceStage&&!desertStage&&!lavaStage&&(seed+side)%7===0){
      const gx=px+nx*side*(w/2+14+(seed%6)),gy=py+ny*side*(w/2+14+(seed%6));
      c.fillStyle=iceStage?'#7ea3a6':'#356332';
      c.fillRect(gx-3,gy-9,2,10);c.fillRect(gx,gy-11,2,12);c.fillRect(gx+3,gy-7,2,8);
      if(!iceStage&&s%2===0){c.fillStyle='#6e492b';c.fillRect(gx,gy-13,2,4);}
     }
    }

    // Submerged river stones & sandbars visible in shallow edge water
    if(seed%3===0){
     const side=seed%2?1:-1,sx=px+nx*side*(w*.34),sy=py+ny*side*(w*.34);
     c.fillStyle=deep?'#19495e77':'#4c878777';
     c.beginPath();c.ellipse(sx,sy,5+(seed%5),3.5+(seed%3),0,0,Math.PI*2);c.fill();
     c.strokeStyle='#e6fffb33';c.lineWidth=1;c.stroke();
    }

    // Shimmering water current streaks & caustic highlights
    const off=((seed%44)-22)/100*w;
    c.strokeStyle=deep?'#8ad6e355':'#ebfffa77';c.lineWidth=2;
    c.beginPath();c.moveTo(px+nx*off-ux*14,py+ny*off-uy*14);c.lineTo(px+nx*off+ux*14,py+ny*off+uy*14);c.stroke();

    // Stepping stones, lily pads & lotus flowers in shallow streams (or floating ice floes on Stage 6)
    if(iceStage&&seed%5===0){
     c.fillStyle='#dff7ffcc';c.beginPath();c.ellipse(px+nx*6,py+ny*6,10,6,seed,0,Math.PI*2);c.fill();
     c.strokeStyle='#ffffff';c.lineWidth=1;c.stroke();
    }else if(!deep&&!lavaStage&&s%2===0){
     c.fillStyle='#52756c';c.beginPath();c.ellipse(px+nx*9,py+ny*9,6.5,4,0,0,Math.PI*2);c.fill();
     c.fillStyle='#5f9c5b';c.beginPath();c.arc(px-nx*11,py-ny*11,5.5,.3,Math.PI*1.9);c.lineTo(px-nx*11,py-ny*11);c.fill();
     if(seed%4===0){c.fillStyle='#f7b5cb';c.fillRect(px-nx*11-1,py-ny*11-1,3,3);}
    }
   }
  }
 }

 // Bridges: procedural multi-type pixel-art bridges sized to the exact road/trail width & crossing span
 const normAngle=a=>{let r=((a%(Math.PI*2))+Math.PI*2)%(Math.PI*2);if(r>Math.PI/2&&r<=Math.PI*1.5)r-=Math.PI;else if(r>Math.PI*1.5)r-=Math.PI*2;return r;};
 const segDist=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);};
 for(const b of [...(map.bridges||[]),...(map.fords||[])]){
  const onMainRoad=(map.lanes||[]).some(l=>l.some((p,k)=>k&&segDist(b.x,b.y,l[k-1],p)<55));
  const bw=onMainRoad?108:42;
  const bl=bridgeVisualSpan(map,b);
  c.save();
  c.translate(b.x,b.y);
  c.rotate(normAngle(b.angle));
  if(b.ford){const dry=(map.rivers||[]).some(r=>r.surface==='dry'&&r.points.some((p,k)=>k&&segDist(b.x,b.y,r.points[k-1],p)<r.width));if(dry){c.restore();continue;}const river=(map.rivers||[]).find(r=>r.type==='shallow'&&r.points.some((p,k)=>k&&segDist(b.x,b.y,r.points[k-1],p)<r.width));const segment=river?.points.findIndex((p,k)=>k&&segDist(b.x,b.y,river.points[k-1],p)<river.width);const flow=segment>0?Math.atan2(river.points[segment][1]-river.points[segment-1][1],river.points[segment][0]-river.points[segment-1][0]):Math.PI/2;drawGravelFord(c,bl,onMainRoad?88:42,flow-normAngle(b.angle));}
  else if(b.abyss)drawTimberBridge(c,bl,onMainRoad?88:42,true);
  else if(onMainRoad)drawStoneBridge(c,bl,bw,{...map,bridgeAngle:normAngle(b.angle)});
  else drawTimberBridge(c,bl,bw);
  c.restore();
 }
 c.restore();
}

export function drawTerritory(c,scene,t){
 const r=t.radius,col=hex(t.color);
 c.save();
 c.beginPath();
 for(let i=0;i<=28;i++){
  const a=i/28*Math.PI*2,k=.94+Math.sin(i*2.1+t.x)*.06,x=t.x+Math.cos(a)*r*k,y=t.y+Math.sin(a)*r*.76*k;
  if(i===0)c.moveTo(x,y);else c.lineTo(x,y);
 }
 c.closePath();
 c.fillStyle=col+'14';
 c.fill();
 c.strokeStyle=col+'44';
 c.lineWidth=3;
 c.setLineDash([12,8]);
 c.stroke();
 c.setLineDash([]);
 for(let i=0;i<12;i++){
  const a=i/12*Math.PI*2,x=t.x+Math.cos(a)*r*.92,y=t.y+Math.sin(a)*r*.7;
  const stoneDark=t.family==='dragon'?'#384f30':t.family==='undead'?'#3a3542':'#4e5246';
  const stoneMid=t.family==='dragon'?'#577348':t.family==='undead'?'#5c5468':'#737768';
  c.fillStyle='#0e140f55';c.beginPath();c.ellipse(x+2,y+3,t.family==='dragon'?18:13,7,0,0,Math.PI*2);c.fill();
  c.fillStyle=stoneDark;c.beginPath();c.ellipse(x,y,t.family==='dragon'?16:11,6,0,0,Math.PI*2);c.fill();
  c.fillStyle=stoneMid;c.beginPath();c.ellipse(x-1,y-1,t.family==='dragon'?12:8,4,0,0,Math.PI*2);c.fill();
  if(i%3===0){
   // Carved pixel rune monolith
   c.fillStyle='#1b211d';c.fillRect(x-7,y-31,14,32);
   c.fillStyle=stoneDark;c.fillRect(x-6,y-30,12,30);
   c.fillStyle=stoneMid;c.fillRect(x-5,y-29,8,27);
   c.fillStyle='#242a26';c.beginPath();c.moveTo(x-7,y-30);c.lineTo(x,y-37);c.lineTo(x+7,y-30);c.closePath();c.fill();
   c.fillStyle=col;c.fillRect(x-2,y-24,4,10);c.fillRect(x-4,y-21,8,3);
   c.fillStyle='#ffffff99';c.fillRect(x-1,y-23,2,4);
  }
 }
 c.restore();
}

export function updateHydrologyFX(scene,time,views=getActiveViews(scene)){
 const g=scene.waterFX||scene.weather;
 if(!g||!views.length)return;
 // Dedicated water layer can keep its previous frame between updates.
 if(scene.waterFX){
  if(scene._waterFXLayer===g&&time-(scene._lastWaterFXTime??-Infinity)<200)return;
  scene._waterFXLayer=g;scene._lastWaterFXTime=time;scene.waterFX.clear();
 }
 const cam=scene.cameras?.main,zoom=Math.min(cam?.zoomX??cam?.zoom??1,cam?.zoomY??cam?.zoom??1);
 const r=scene.castleRect;
 const inCourt=(x,y)=>r&&x>=r.left-12&&x<=r.right+12&&y>=r.top-12&&y<=r.bottom+12;
 const onBridge=(x,y)=>(scene.bridges||[]).some(b=>{
  const dx=x-b.x,dy=y-b.y,ca=Math.cos(b.angle),sa=Math.sin(b.angle);
  return Math.abs(dx*ca+dy*sa)<Math.min(920,b.length)*.5&&Math.abs(-dx*sa+dy*ca)<b.width*.34;
 });
 const step=zoom<.45||(scene.sceneryBudget?.quality??1)<1?2:1;
 for(const w of scene.hydrology||[]){
  if(w.surface){updateRiverSurfaceFX(g,w,time,views,(x,y)=>inCourt(x,y)||onBridge(x,y),scene.sceneryBudget?.quality??1);continue;}
  const abyss=w.type==='abyss',deep=w.type==='deep',rw=w.width||70,speed=abyss?1400:deep?3200:2000;
  for(let k=1;k<w.points.length;k++){
   const a=w.points[k-1],b=w.points[k];
   if(!boxInAnyView(views,Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1]),rw+80))continue;
   const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;
   const ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
   const lanes=deep||abyss?4:3,streams=Math.max(2,Math.round(len/(zoom<.45?340:260)));
   for(let l=0;l<lanes;l+=step){
    const flow=abyss?null:waterCurrent(w,k,l,time);
    for(let s=0;s<streams;s++){
     const phase=((abyss?time/speed:flow.distance/len)+s/streams+l*.27)%1;
     const taper=abyss?(1-((k-1+phase)/(w.points.length-1))*.82):1;
     const lat=(((l/(lanes-1||1))-.5)*rw*.64*taper)+Math.sin(time/3200+k+l)*.4;
     const cx=a[0]+dx*phase+nx*lat,cy=a[1]+dy*phase+ny*lat;
     if(!inAnyView(views,cx,cy,80))continue;
     if(inCourt(cx,cy)||(!abyss&&onBridge(cx,cy)))continue;
     const fade=Math.sin(phase*Math.PI);
     if(abyss){
      // Gió mạnh thổi xoáy dọc theo vực sâu (pixel-art lines instead of expensive .arc())
      g.lineStyle(2.2,0xc8c0db,fade*.46).lineBetween(cx-ux*22,cy-uy*22,cx+ux*22,cy+uy*22);
      if(l%2===0){
       const ang=time/240+l,rad=9+taper*7,wx0=cx+Math.cos(ang)*rad,wy0=cy+Math.sin(ang)*rad*.45,wx1=cx+Math.cos(ang+1.3)*rad,wy1=cy+Math.sin(ang+1.3)*rad*.45;
       g.lineStyle(1.4,0xe8e2f5,fade*.34).lineBetween(wx0,wy0,wx1,wy1);
      }
      continue;
     }
     const strength=flow.speed/flow.base;
     const streakLen=((deep?24:18)+((s+l)%3)*5)*(.65+strength*.35);
     g.lineStyle(deep?2:2.2,deep?0x9be2ed:0xe6fff8,fade*(deep?.4:.6)*(.7+strength*.3))
      .lineBetween(cx-ux*streakLen*.5,cy-uy*streakLen*.5,cx+ux*streakLen*.5,cy+uy*streakLen*.5);
     if(l%2===0&&zoom>=.45){
      const rippleR=4+((time/420+s+l)%1)*9;
      g.lineStyle(1,0xf2fffb,fade*(deep?.2:.36)).lineBetween(cx-rippleR,cy,cx+rippleR,cy).lineBetween(cx-rippleR*.6,cy+3,cx+rippleR*.6,cy+3);
     }
    }
   }
  }
 }
}
