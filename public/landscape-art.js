const hex=n=>'#'+n.toString(16).padStart(6,'0');

function traceSmoothPolyline(c,points){
 if(!points||points.length<2)return;
 c.beginPath();
 c.moveTo(points[0][0],points[0][1]);
 for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);
}

function drawBankRock(c,x,y,rw,rh,dark,mid,light){
 c.fillStyle='#101c1a55';c.beginPath();c.ellipse(x+2,y+2,rw*1.05,rh*.95,0,0,Math.PI*2);c.fill();
 c.fillStyle=dark;c.beginPath();c.ellipse(x,y,rw+1,rh+1,0,0,Math.PI*2);c.fill();
 c.fillStyle=mid;c.beginPath();c.ellipse(x,y,rw*.85,rh*.8,0,0,Math.PI*2);c.fill();
 c.fillStyle=light;c.beginPath();c.ellipse(x-rw*.2,y-rh*.25,rw*.4,rh*.3,0,0,Math.PI*2);c.fill();
}

function drawPixelBridge(c,bl,bw,isMain,map){
 const ice=map.id===6,desert=map.id===5,lava=map.id===9;
 const halfL=bl/2,halfW=bw/2;

 // Soft water shadow beneath bridge
 c.fillStyle='#0a161855';
 c.fillRect(-halfL+6,-halfW+8,bl-4,bw+4);

 if(!isMain){
  // Narrow Wooden Plank Bridge (for forest trails)
  c.fillStyle='#3b2819';c.fillRect(-halfL,-halfW,bl,bw);
  c.fillStyle='#785334';c.fillRect(-halfL+2,-halfW+3,bl-4,bw-6);
  // Individual wooden planks & nails
  for(let x=-halfL+4;x<halfL-4;x+=10){
   c.fillStyle=(Math.floor(x/10)%2)?'#8c623e':'#704c2f';
   c.fillRect(x,-halfW+4,8,bw-8);
   c.fillStyle='#2b1d12';
   c.fillRect(x+2,-halfW+6,2,2);c.fillRect(x+2,halfW-8,2,2);
  }
  // Wooden rope-railings & posts on both sides
  c.fillStyle='#4a3320';
  c.fillRect(-halfL,-halfW,bl,4);c.fillRect(-halfL,halfW-4,bl,4);
  c.fillStyle='#b89c6e';
  c.fillRect(-halfL,-halfW+1,bl,2);c.fillRect(-halfL,halfW-3,bl,2);
  for(let x=-halfL+6;x<=halfL-6;x+=36){
   c.fillStyle='#3b2717';c.fillRect(x-3,-halfW-2,7,7);c.fillRect(x-3,halfW-5,7,7);
   c.fillStyle='#9e754c';c.fillRect(x-2,-halfW-1,5,5);c.fillRect(x-2,halfW-4,5,5);
  }
  return;
 }

 // Wide Stone Masonry Bridge (for main roads, fits 86-100px road cleanly)
 const railDark=ice?'#4c6b80':desert?'#6b5333':lava?'#2b201e':'#363b38';
 const railMid=ice?'#9cc4d9':desert?'#c4a26a':lava?'#594642':'#7a8078';
 const railTop=ice?'#e1f5ff':desert?'#ebd4a4':lava?'#8c726b':'#adb3a8';
 const deckA=ice?'#82a8bd':desert?'#b5945e':lava?'#473835':'#6b7068';
 const deckB=ice?'#7499ad':desert?'#a68652':lava?'#3d302d':'#5e635b';

 // Stone support piers dipping into the river on the lower side
 for(let x=-halfL+48;x<=halfL-48;x+=95){
  c.fillStyle=railDark;c.fillRect(x-12,halfW-2,24,14);
  c.fillStyle=railMid;c.fillRect(x-10,halfW,20,10);
 }

 // Outer stone bed & beveled road deck
 c.fillStyle=railDark;c.fillRect(-halfL,-halfW,bl,bw);
 c.fillStyle=deckA;c.fillRect(-halfL,-halfW+10,bl,bw-20);

 // Staggered stone cobble slabs across the bridge deck
 const slabW=24,slabH=18;
 for(let row=0,y=-halfW+11;y<halfW-13;row++,y+=slabH){
  const h=Math.min(slabH-2,halfW-12-y);
  const off=(row%2)*(slabW/2);
  for(let col=0,x=-halfL+off;x<halfL-4;col++,x+=slabW){
   const w=Math.min(slabW-2,halfL-2-x);
   if(w<4||h<4)continue;
   c.fillStyle=((row+col)%2)?deckA:deckB;
   c.fillRect(x,y,w,h);
   c.fillStyle='#ffffff18';c.fillRect(x,y,w,2);
  }
 }

 // Heavy stone parapet railings on both sides with evenly spaced stone pillars
 c.fillStyle=railDark;
 c.fillRect(-halfL,-halfW,bl,11);c.fillRect(-halfL,halfW-11,bl,11);
 c.fillStyle=railMid;
 c.fillRect(-halfL+2,-halfW+2,bl-4,7);c.fillRect(-halfL+2,halfW-9,bl-4,7);
 c.fillStyle=railTop;
 c.fillRect(-halfL+2,-halfW+2,bl-4,2);c.fillRect(-halfL+2,halfW-9,bl-4,2);

 for(let x=-halfL+10;x<=halfL-10;x+=46){
  for(const py of [-halfW-2,halfW-11]){
   c.fillStyle=railDark;c.fillRect(x-7,py,14,13);
   c.fillStyle=railMid;c.fillRect(x-5,py+2,10,9);
   c.fillStyle=railTop;c.fillRect(x-5,py+2,10,3);
   if(lava){c.fillStyle='#ff9138';c.fillRect(x-2,py+4,4,4);}
  }
 }
}

function drawRopeBridge(c,bl,bw){
 const halfL=bl/2,halfW=bw/2;
 // Timber cliff anchors at both ends
 for(const ex of [-halfL+4,halfL-12]){
  c.fillStyle='#3b2717';c.fillRect(ex,-halfW-4,9,bw+8);
  c.fillStyle='#8c623e';c.fillRect(ex+1,-halfW-3,7,bw+6);
 }
 // Wooden planks with gaps showing abyss underneath
 for(let x=-halfL+14;x<halfL-14;x+=13){
  c.fillStyle='#1b120c88';c.fillRect(x+2,-halfW+7,9,bw-12);
  c.fillStyle=(Math.floor(x/13)%2)?'#855c39':'#6b472a';
  c.fillRect(x,-halfW+6,9,bw-12);
  c.fillStyle='#b88e5e55';c.fillRect(x,-halfW+6,9,2);
 }
 // Twisted hemp suspension ropes & side lashings
 for(const ry of [-halfW+2,halfW-4]){
  c.strokeStyle='#3d2817';c.lineWidth=4.5;c.beginPath();c.moveTo(-halfL,ry);c.quadraticCurveTo(0,ry+(ry<0?5:-5),halfL,ry);c.stroke();
  c.strokeStyle='#c9a265';c.lineWidth=2.2;c.beginPath();c.moveTo(-halfL,ry);c.quadraticCurveTo(0,ry+(ry<0?5:-5),halfL,ry);c.stroke();
 }
 for(let x=-halfL+18;x<=halfL-18;x+=34){
  for(const py of [-halfW-2,halfW-5]){
   c.fillStyle='#3b2717';c.fillRect(x-3,py,7,7);
   c.fillStyle='#a87c4f';c.fillRect(x-2,py+1,5,5);
  }
 }
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
  if(abyss){
   // Vết nứt vực sâu bắt nguồn từ rìa và thuôn nhọn dần đến mũi kết thúc
   const buildAbyssPoly=(scale,tipMin=2)=>{
    const left=[],right=[];
    for(let i=0;i<pts.length;i++){
     const t=i/(pts.length-1),hw=Math.max(tipMin,w*.5*(1-t*.92)*scale);
     const prev=pts[Math.max(0,i-1)],next=pts[Math.min(pts.length-1,i+1)];
     const dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
     left.push([pts[i][0]+nx*hw,pts[i][1]+ny*hw]);
     right.unshift([pts[i][0]-nx*hw,pts[i][1]-ny*hw]);
    }
    const end=pts[pts.length-1],prev=pts[pts.length-2],dx=end[0]-prev[0],dy=end[1]-prev[1],len=Math.hypot(dx,dy)||1;
    const tip=[end[0]+dx/len*18,end[1]+dy/len*18];
    c.beginPath();
    left.forEach((p,idx)=>idx?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));
    c.lineTo(tip[0],tip[1]);
    right.forEach(p=>c.lineTo(p[0],p[1]));
    c.closePath();
   };
   buildAbyssPoly(1.32,4);c.fillStyle='#3b333877';c.fill();
   buildAbyssPoly(1.14,3);c.fillStyle='#2c252b';c.fill();
   buildAbyssPoly(.96,2);c.fillStyle='#19141e';c.fill();
   buildAbyssPoly(.68,1);c.fillStyle='#060409';c.fill();
   for(let i=1;i<pts.length;i++){
    const [ax,ay]=pts[i-1],[bx,by]=pts[i],len=Math.hypot(bx-ax,by-ay)||1,ux=(bx-ax)/len,uy=(by-ay)/len,nx=-uy,ny=ux;
    const steps=Math.max(2,Math.floor(len/30));
    for(let s=0;s<steps;s++){
     const u=(s+.4)/steps,t=(i-1+u)/(pts.length-1),hw=w*.46*(1-t*.9);
     if(hw<6)continue;
     const px=ax+(bx-ax)*u,py=ay+(by-ay)*u,seed=Math.abs((i*83+s*137)%100);
     for(const side of [-1,1]){
      const rx=px+nx*side*hw,ry=py+ny*side*hw;
      c.fillStyle=seed%2?'#4f464d':'#2b242c';
      c.beginPath();c.moveTo(rx-ux*8,ry-uy*8);c.lineTo(rx-nx*side*10,ry-ny*side*10);c.lineTo(rx+ux*8,ry+uy*8);c.closePath();c.fill();
     }
    }
   }
   continue;
  }

  // 1. Soft grassy/mossy bank embankment
  traceSmoothPolyline(c,pts);c.strokeStyle=bankOuter;c.lineWidth=w+48;c.stroke();

  // 2. Dry sunlit sandy riverbank
  traceSmoothPolyline(c,pts);c.strokeStyle=bankSand;c.lineWidth=w+28;c.stroke();

  // 3. Wet darkened mud/sand lip where water laps the shore
  traceSmoothPolyline(c,pts);c.strokeStyle=bankWet;c.lineWidth=w+14;c.stroke();

  // 4. Shallow translucent shelf
  traceSmoothPolyline(c,pts);c.strokeStyle=deep?(iceStage?'#5aa5bd':lavaStage?'#3e5c69':'#4693a6'):(iceStage?'#9ee3f0':lavaStage?'#5a828a':'#82ccc8');c.lineWidth=w+6;c.stroke();

  // 5. Main river channel
  traceSmoothPolyline(c,pts);c.strokeStyle=deep?(iceStage?'#2d6f8c':lavaStage?'#213842':'#235973'):(iceStage?'#6dbcd1':lavaStage?'#3c6069':'#58acb3');c.lineWidth=w-6;c.stroke();

  // 6. Deep inner current core & sunlit surface sheen
  traceSmoothPolyline(c,pts);c.strokeStyle=deep?(iceStage?'#1e526b':lavaStage?'#15252e':'#164057'):(iceStage?'#4d9eb5':lavaStage?'#2d4d54':'#43939c');c.lineWidth=Math.max(12,w*.48);c.stroke();
  traceSmoothPolyline(c,pts);c.strokeStyle=deep?'#9ce8f51a':'#e8fff926';c.lineWidth=Math.max(6,w*.18);c.stroke();

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
     const lobeR=9+(seed%7);
     const lx=px+nx*side*(w/2+10+(seed%5)),ly=py+ny*side*(w/2+10+(seed%5));
     c.fillStyle=seed%2?bankSand:bankWet;
     c.beginPath();c.ellipse(lx,ly,lobeR,lobeR*.7,0,0,Math.PI*2);c.fill();

     // Shoreline white foam dash hugging the water edge
     if((seed+side)%2===0){
      const fx=px+nx*side*(w/2+1),fy=py+ny*side*(w/2+1);
      c.strokeStyle='#e8fffc77';c.lineWidth=2.2;
      c.beginPath();c.moveTo(fx-ux*8,fy-uy*8);c.lineTo(fx+ux*8,fy+uy*8);c.stroke();
     }

     // Bank pebbles & mossy shoreline boulders
     if((seed+s)%3===0){
      const rx=px+nx*side*(w/2+7+(seed%8)),ry=py+ny*side*(w/2+7+(seed%8));
      drawBankRock(c,rx,ry,4+(seed%5),3+(seed%3),iceStage?'#4a6e82':lavaStage?'#2d221f':'#3d453b',iceStage?'#8eb8cc':lavaStage?'#54413b':'#6f786a',iceStage?'#d9f4ff':lavaStage?'#7d635b':'#9ca695');
     }

     // Riverside reeds / cattails & lush grass tufts
     if(!desertStage&&!lavaStage&&(seed+side)%4===0){
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
 for(const b of map.bridges||[]){
  const onMainRoad=(map.lanes||[]).some(l=>l.some((p,k)=>k&&segDist(b.x,b.y,l[k-1],p)<55));
  const river=(map.rivers||[]).find(r=>r.points.some((p,k)=>k&&segDist(b.x,b.y,r.points[k-1],p)<r.width*.8));
  const minSpan=(river?river.width:130)+42;
  const bw=onMainRoad?108:42;
  const bl=Math.max(minSpan,Math.min(920,b.length||minSpan));
  c.save();
  c.translate(b.x,b.y);
  c.rotate(normAngle(b.angle));
  if(b.abyss)drawRopeBridge(c,bl,onMainRoad?88:42);
  else drawPixelBridge(c,bl,bw,onMainRoad,map);
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

export function updateHydrologyFX(scene,time){
 const g=scene.waterFX||scene.weather,cam=scene.cameras.main.worldView;
 if(!g||!cam)return;
 if(scene.waterFX)scene.waterFX.clear();
 const r=scene.castleRect;
 const inCourt=(x,y)=>r&&x>=r.left-12&&x<=r.right+12&&y>=r.top-12&&y<=r.bottom+12;
 const onBridge=(x,y)=>(scene.bridges||[]).some(b=>{
  const dx=x-b.x,dy=y-b.y,ca=Math.cos(b.angle),sa=Math.sin(b.angle);
  return Math.abs(dx*ca+dy*sa)<Math.min(920,b.length)*.5&&Math.abs(-dx*sa+dy*ca)<b.width*.34;
 });
 for(const w of scene.hydrology||[]){
  const abyss=w.type==='abyss',deep=w.type==='deep',rw=w.width||70,speed=abyss?1400:deep?3200:2000;
  for(let k=1;k<w.points.length;k++){
   const a=w.points[k-1],b=w.points[k];
   const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;
   const ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
   const lanes=deep||abyss?4:3,streams=Math.max(2,Math.round(len/100));
   for(let s=0;s<streams;s++){
    for(let l=0;l<lanes;l++){
     const phase=(time/speed+s/streams+l*.27)%1;
     const taper=abyss?(1-((k-1+phase)/(w.points.length-1))*.82):1;
     const lat=(((l/(lanes-1||1))-.5)*rw*.64*taper)+Math.sin(time/900+k+l)*3;
     const cx=a[0]+dx*phase+nx*lat,cy=a[1]+dy*phase+ny*lat;
     if(cx<cam.x-80||cx>cam.right+80||cy<cam.y-80||cy>cam.bottom+80)continue;
     if(inCourt(cx,cy)||(!abyss&&onBridge(cx,cy)))continue;
     const fade=Math.sin(phase*Math.PI);
     if(abyss){
      // Gió mạnh thổi xoáy dọc theo vực sâu
      g.lineStyle(2.2,0xc8c0db,fade*.46).lineBetween(cx-ux*22,cy-uy*22,cx+ux*22,cy+uy*22);
      if(l%2===0)g.lineStyle(1.4,0xe8e2f5,fade*.32).beginPath().arc(cx,cy,10+taper*8,time/240+l,time/240+l+1.9).strokePath();
      continue;
     }
     const streakLen=(deep?24:18)+((s+l)%3)*5;
     g.lineStyle(deep?2:2.2,deep?0x9be2ed:0xe6fff8,fade*(deep?.32:.48))
      .lineBetween(cx-ux*streakLen*.5,cy-uy*streakLen*.5,cx+ux*streakLen*.5,cy+uy*streakLen*.5);
     if(l%2===0){
      const rippleR=4+((time/420+s+l)%1)*9;
      g.lineStyle(1,0xf2fffb,fade*(deep?.2:.36)).strokeEllipse(cx,cy,rippleR*2,rippleR*.75);
     }
    }
   }
  }
 }
}
