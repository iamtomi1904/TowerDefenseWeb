import {zoneContains} from './terrain-grid.js';
const px=v=>Math.round(v/2)*2;
const hash=(x,y=0)=>{const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);};
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(px(x),px(y)):c.moveTo(px(x),px(y)));c.closePath();c.fill();}
function trace(c,points){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));}
export function structurePalette(id){return id===6?{earth:'#687f80',soil:'#8fa4a1',stone:'#8ca4ae',light:'#c7dadb',shade:'#536c78',rim:'#394d55',moss:'#8dada7'}:id===5?{earth:'#75613e',soil:'#a38a5b',stone:'#baa477',light:'#dac69b',shade:'#8d7954',rim:'#544c37',moss:'#888352'}:id>=9?{earth:'#443b34',soil:'#67564a',stone:'#796c61',light:'#a2937d',shade:'#534c46',rim:'#2e2b2c',moss:'#625c48'}:{earth:'#4a5039',soil:'#8b805d',stone:'#91917b',light:'#b5b49a',shade:'#696e5b',rim:'#3b4537',moss:'#586e41'};}
export function roadBiomeAt(map,x,y){
 if(map.roadBiome)return map.roadBiome;
 const zone=(map.environment||[]).find(z=>['flowers','swamp','desert','snow','dense','ice','lava','fire','dead'].includes(z.type)&&zoneContains(z,{x,y}));
 if(zone)return ({dense:'forest',ice:'snow',fire:'lava'})[zone.type]||zone.type;
 return map.id===5?'desert':map.id===6?'snow':map.id===7?'swamp':map.id===9?'lava':map.id===10?'dead':map.id===3?'autumn':'forest';
}
export function roadPalette(type){
 return type==='lava'?{earth:'#2d2b28',soil:'#48413b',stone:'#5e554c',light:'#807565',shade:'#292c2a',moss:'#71513b'}:type==='swamp'?{earth:'#354334',soil:'#60634b',stone:'#78806a',light:'#939b7d',shade:'#3c493b',moss:'#5a744c'}:type==='desert'?{earth:'#9e875b',soil:'#b9a16d',stone:'#b8a880',light:'#d0bd8f',shade:'#8d7f57',moss:'#8c8751'}:type==='snow'?{earth:'#839a9e',soil:'#adc3ca',stone:'#8ca5b1',light:'#d8e6e6',shade:'#819ca8',moss:'#b9cfd4'}:type==='dead'?{earth:'#39363c',soil:'#5a5059',stone:'#6a6167',light:'#8a7a82',shade:'#38353c',moss:'#5b525a'}:type==='autumn'?{earth:'#55513a',soil:'#8d7a53',stone:'#8c896d',light:'#b0a07b',shade:'#625b42',moss:'#80613f'}:{earth:'#465339',soil:'#827957',stone:'#8b8b70',light:'#ada88b',shade:'#5b6148',moss:'#536f3d'};
}
function corridor(c,lane,half){
 const left=[],right=[];
 lane.forEach((p,i)=>{const a=lane[Math.max(0,i-1)],b=lane[Math.min(lane.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/len,ny=(b[0]-a[0])/len;left.push([p[0]+nx*half,p[1]+ny*half]);right.unshift([p[0]-nx*half,p[1]-ny*half]);});
 c.beginPath();[...left,...right].forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();
}
export function drawRoadNetwork(c,map,trail=false){
 const pal=roadPalette(roadBiomeAt(map,-1000,-1000)),paths=trail?[...(map.forestPaths||[]),...(map.campCorridors||[])]:map.lanes||[];
 c.save();c.lineCap='round';c.lineJoin='round';
 for(const lane of paths){
  if(lane.length<2)continue;
  for(const [width,color] of trail?[[34,'#263a2644'],[27,pal.earth],[21,pal.soil]]:[[116,'#1b2b2240'],[100,pal.earth],[88,pal.soil]]){trace(c,lane);c.lineWidth=width;c.strokeStyle=color;c.stroke();}
  c.save();corridor(c,lane,trail?10:41);c.clip();
  // Irregular worn slabs, with gaps of packed earth; avoid a repeated brick wallpaper.
  for(let k=1;k<lane.length;k++){
   const a=lane[k-1],b=lane[k],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1,ux=(b[0]-a[0])/len,uy=(b[1]-a[1])/len;
   const step=trail?25:23;
   for(let d=0;d<len;d+=step){const x=a[0]+ux*d,y=a[1]+uy*d,local=roadPalette(roadBiomeAt(map,x,y));c.strokeStyle=local.soil;c.lineWidth=trail?21:86;c.beginPath();c.moveTo(x,y);c.lineTo(x+ux*Math.min(step+2,len-d),y+uy*Math.min(step+2,len-d));c.stroke();}

   for(let d=0;d<len;d+=step)for(let row=trail?0:-2;row<=(trail?0:2);row++){
    const seed=hash(px(a[0]+ux*d)+row*41,px(a[1]+uy*d)),offset=row*17+(seed-.5)*5;
    const x=px(a[0]+ux*(d+(row%2)*8)-uy*offset),y=px(a[1]+uy*(d+(row%2)*8)+ux*offset);
    const type=roadBiomeAt(map,x,y),pal=roadPalette(type);
    if(type==='lava'){
     if(seed<.7){poly(c,[[x-9,y-5],[x+7,y-6],[x+11,y+1],[x+4,y+6],[x-8,y+4]],seed>.4?pal.stone:pal.soil);c.strokeStyle=pal.shade;c.lineWidth=2;trace(c,[[x-7,y+4],[x,y],[x+4,y-6]]);c.stroke();if(seed<.13){c.strokeStyle='#b56235';c.lineWidth=1;trace(c,[[x-7,y+4],[x,y],[x+4,y-6]]);c.stroke();}}continue;
    }
    if(type==='swamp'){
     if(seed<.27){poly(c,[[x-8,y-2],[x+5,y-4],[x+9,y+1],[x+3,y+4],[x-7,y+2]],'#435d4e');c.fillStyle='#81978066';c.fillRect(x-4,y-1,8,2);}
     else if(seed>.83){c.fillStyle='#807450';c.fillRect(x-8,y-3,16,5);c.fillStyle='#a29369';c.fillRect(x-7,y-3,12,1);}continue;
    }
    if(type==='snow'){
     c.strokeStyle=seed>.5?pal.light:pal.shade;c.globalAlpha=.4;c.lineWidth=2;trace(c,[[x-7,y+2],[x,y],[x+9,y+1]]);c.stroke();c.globalAlpha=1;
     if(seed>.92){c.fillStyle=pal.stone;c.fillRect(x,y,5,3);}continue;
    }
    if(type==='desert'){
     c.strokeStyle=seed>.5?pal.light:pal.shade;c.globalAlpha=.45;c.lineWidth=1;trace(c,[[x-10,y+1],[x-2,y-1],[x+10,y]]);c.stroke();c.globalAlpha=1;
     if(seed<.84)continue;
    }
    if((type==='forest'||type==='flowers'||type==='autumn')&&seed<.63){
     if(seed<.12){c.strokeStyle=pal.shade;c.lineWidth=2;trace(c,[[x-7,y+5],[x-2,y],[x+3,y-2]]);c.stroke();}
     if(seed>.4){c.fillStyle=type==='autumn'?'#a27c49':pal.shade;c.fillRect(x,y,4,2);}continue;
    }
    if(trail||seed<.19){c.fillStyle=seed>.5?pal.shade:pal.light;c.fillRect(x,y,trail?3:4,2);continue;}
    const rw=7+Math.floor(seed*5),rh=4+Math.floor(hash(d,row)*3);
    const shape=[[x-rw+3,y-rh],[x+rw-3,y-rh],[x+rw,y-rh+3],[x+rw-2,y+rh],[x-rw+2,y+rh],[x-rw,y]];
    poly(c,shape,pal.shade);poly(c,shape.map(([sx,sy])=>[sx,sy-2]),seed>.65?pal.light:pal.stone);
    c.fillStyle=pal.light;c.fillRect(x-rw+4,y-rh-2,Math.max(3,rw-2),2);
    if(seed>.84){c.strokeStyle=pal.shade;c.lineWidth=1;c.beginPath();c.moveTo(x+2,y-rh);c.lineTo(x,y);c.lineTo(x+4,y+rh-2);c.stroke();}
   }
  }
  c.restore();
  for(let k=1;k<lane.length;k++){
   const a=lane[k-1],b=lane[k],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1,ux=(b[0]-a[0])/len,uy=(b[1]-a[1])/len;
   for(let d=12;d<len;d+=28)for(const side of [-1,1]){
    const seed=hash(d+a[0],a[1]+side*9),offset=side*((trail?14:47)+seed*4),x=px(a[0]+ux*d-uy*offset),y=px(a[1]+uy*d+ux*offset);
    const type=roadBiomeAt(map,x,y),pal=roadPalette(type);
    if(type==='flowers'&&seed>.5){c.fillStyle=seed>.75?'#d4bc8a':'#c3c1a1';c.fillRect(x-2,y-2,4,2);c.fillRect(x-1,y-3,2,4);continue;}
    if(type==='snow'){c.fillStyle=pal.light;c.fillRect(x-3,y,8,3);continue;}
    if(type==='lava'){c.fillStyle=pal.shade;c.fillRect(x-3,y-2,6,4);continue;}
    if(seed>.42&&!trail){poly(c,[[x-4,y-2],[x+3,y-3],[x+5,y+1],[x+1,y+3],[x-4,y+2]],pal.shade);c.fillStyle=pal.stone;c.fillRect(x-2,y-2,4,2);}
    else if(seed<.28&&map.id!==6){c.strokeStyle=pal.moss;c.lineWidth=2;c.beginPath();c.moveTo(x-3,y+2);c.lineTo(x-4,y-2);c.moveTo(x,y+2);c.lineTo(x+2,y-4);c.stroke();}
   }
  }
 }
 c.restore();
}
function plank(c,x,y,width,index){
 poly(c,[[x,y],[x+10,y+1],[x+10,y+width-2],[x+7,y+width],[x,y+width-1]],'#342b20');
 c.fillStyle=index%3?'#816b46':'#93805a';c.fillRect(x+2,y+2,7,width-5);
 c.fillStyle='#baa27a';c.fillRect(x+2,y+2,6,2);
 c.fillStyle='#514633';c.fillRect(x+4,y+7,2,Math.max(2,width-18));
 c.fillStyle='#35372d';c.fillRect(x+4,y+4,2,2);c.fillRect(x+4,y+width-6,2,2);
}
export function drawTimberBridge(c,length,width,rope=false){
 const l=px(length/2),w=px(width/2);
 c.fillStyle='#111b1844';c.fillRect(-l+6,-w+12,length,width+6);
 // Beam depth is on the near edge, not around the whole deck.
 c.fillStyle='#30291f';c.fillRect(-l,w-3,length,9);c.fillStyle='#5e4d34';c.fillRect(-l,w-3,length,3);
 for(let x=-l;x<l;x+=12){const u=(x+l)/length,sag=rope?px(Math.sin(u*Math.PI)*7):0;plank(c,px(x),-w+sag,width,Math.floor((x+l)/12));}
 for(const side of [-1,1]){
  const y=side*w;
  if(!rope){c.fillStyle='#3e3526';c.fillRect(-l,y-6,length,4);c.fillStyle='#a08b61';c.fillRect(-l,y-7,length,2);}
  else{for(const [off,col] of [[2,'#493b29'],[0,'#c0ac7b']]){c.strokeStyle=col;c.lineWidth=2;const count=Math.ceil(length/8)+1,pts=Array.from({length:count},(_,i)=>{const u=i/(count-1);return [px(-l+u*length),px(y-18+Math.sin(u*Math.PI)*15)+off];});trace(c,pts);c.stroke();}}
  for(let x=-l+5;x<=l-4;x+=rope?Math.max(24,px(length/6)):52){
   const u=(x+l)/length,sag=rope?px(Math.sin(u*Math.PI)*15):0;
   if(!rope||x<-l+10||x>l-30){c.fillStyle='#322b21';c.fillRect(px(x)-3,y-15,7,23);c.fillStyle='#79694a';c.fillRect(px(x)-1,y-13,3,18);c.fillStyle='#bcab83';c.fillRect(px(x)-1,y-14,4,3);}
   else{c.strokeStyle='#8f805b';c.lineWidth=2;c.beginPath();c.moveTo(px(x),y-18+sag);c.lineTo(px(x),y+3);c.stroke();}
  }
 }
}
export function bridgeVisualSpan(map,bridge){
 let best=null;
 for(const river of map.rivers||[])for(let k=1;k<river.points.length;k++){
  const a=river.points[k-1],b=river.points[k],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(!len)continue;
  const u=Math.max(0,Math.min(1,((bridge.x-a[0])*dx+(bridge.y-a[1])*dy)/(len*len))),dist=Math.hypot(bridge.x-a[0]-dx*u,bridge.y-a[1]-dy*u);
  if(!best||dist<best.dist){const taper=river.type==='abyss'?1-(k-1+u)/(river.points.length-1)*.92:1;best={dist,width:river.width*taper,angle:Math.atan2(dy,dx)};}
 }
 if(!best)return Math.max(90,Math.min(920,bridge.length||172));
 const cross=Math.max(.22,Math.abs(Math.sin(bridge.angle-best.angle)));
 // End at the dry bank, rather than extending the old extra 110px into the road.
 return Math.min(920,Math.max(90,(best.width+48)/cross));
}
export function drawStoneBridge(c,length,width,map){
 const p=structurePalette(map.id),l=px(length/2),w=px(width/2),angle=map.bridgeAngle||0;
 // Extrusion follows screen down even when the whole bridge is rotated.
 const dx=px(Math.sin(angle)*12),dy=px(Math.cos(angle)*12),foot=[[-l,-w],[l,-w],[l,w],[-l,w]];
 poly(c,foot.map(([x,y])=>[x+dx+4,y+dy+4]),'#111a193d');
 for(let i=0;i<4;i++){const a=foot[i],b=foot[(i+1)%4];poly(c,[a,b,[b[0]+dx,b[1]+dy],[a[0]+dx,a[1]+dy]],i%2?p.rim:p.shade);}
 // Supporting piers and arch soffits share the same world-down vector as the deck.
 // Draw behind the deck: longitudinal crossings naturally occlude most of the supports.
 const drop=32,ex=Math.sin(angle),ey=Math.cos(angle),front=ey>=0?w:-w;
 const bays=Math.max(1,Math.ceil(length/125)),supports=Array.from({length:bays+1},(_,i)=>-l+9+i*(length-18)/bays);
 for(const x of supports){
  const thick=8,top=[[x-thick,front-3],[x+thick,front-3],[x+thick,front+3],[x-thick,front+3]];
  poly(c,[top[0],top[1],[x+thick+ex*drop,front+ey*drop],[x-thick+ex*drop,front+ey*drop]],p.shade);
  poly(c,[[x+thick,front-3],[x+thick,front+3],[x+thick+ex*drop,front+3+ey*drop],[x+thick+ex*drop,front-3+ey*drop]],p.rim);
  for(let j=1;j<=3;j++){const d=j*8;c.strokeStyle=j===3?p.rim:p.stone;c.lineWidth=2;c.beginPath();c.moveTo(px(x-thick+2+ex*d),px(front+ey*d));c.lineTo(px(x+thick-2+ex*d),px(front+ey*d));c.stroke();}
 }
 for(let bay=1;bay<supports.length;bay++){
  const a=supports[bay-1]+8,b=supports[bay]-8;if(b<=a)continue;
  const pts=Array.from({length:13},(_,i)=>{const u=i/12,drop=7+23*(1-Math.sqrt(Math.max(0,1-(u*2-1)**2)));return [px(a+(b-a)*u+ex*drop),px(front+ey*drop)];});
  for(const [width,color] of [[6,p.rim],[3,p.stone]]){c.strokeStyle=color;c.lineWidth=width;c.beginPath();pts.forEach((pt,i)=>i?c.lineTo(...pt):c.moveTo(...pt));c.stroke();}
 }
 c.fillStyle=p.shade;c.fillRect(-l,-w,length,width);
 c.fillStyle=p.shade;c.fillRect(-l+2,-w+7,length-4,width-14);
 c.save();c.beginPath();c.rect(-l+2,-w+8,length-4,width-16);c.clip();
 // Broad quiet paving; short broken joints avoid the striped carpet in vertical crossings.
 for(let row=0,y=-w+10;y<w-8;row++,y+=20)for(let col=0,x=-l-14+(row%2)*16;x<l;col++,x+=34){
  const seed=hash(col+13,row+map.id);if(seed<.15)continue;
  const shade=seed>.86?p.light:p.stone;
  poly(c,[[x+3,y+2],[x+28,y+1],[x+31,y+5],[x+29,y+16],[x+4,y+17],[x+1,y+12]],shade);
  c.strokeStyle=p.light;c.globalAlpha=.28;c.lineWidth=2;c.beginPath();c.moveTo(px(x+5),px(y+3));c.lineTo(px(x+23),px(y+3));c.stroke();c.globalAlpha=1;
  if(seed>.8){c.strokeStyle=p.shade;c.lineWidth=1;c.beginPath();c.moveTo(x+17,y+5);c.lineTo(x+14,y+9);c.lineTo(x+19,y+12);c.stroke();}
 }
 c.restore();
 // Low masonry parapets with discrete coping blocks, not long bright guide lines.
 for(const side of [-1,1]){
  const y=side*(w-4),upX=px(-Math.sin(angle)*6),upY=px(-Math.cos(angle)*6);
  poly(c,[[-l,y],[l,y],[l+upX,y+upY],[-l+upX,y+upY]],p.shade);
  for(let x=-l;x<l;x+=22){
   const end=Math.min(x+20,l);poly(c,[[x+upX,y+upY-3],[end+upX,y+upY-3],[end+upX,y+upY+3],[x+upX,y+upY+3]],p.stone);
   c.fillStyle=p.light;c.globalAlpha=.5;c.fillRect(px(x+upX+2),px(y+upY-3),Math.max(2,end-x-4),2);c.globalAlpha=1;
  }
  const posts=length>260?[-l+5,0,l-5]:[-l+5,l-5];
  for(const x of posts){const ux=px(-Math.sin(angle)*13),uy=px(-Math.cos(angle)*13);
   poly(c,[[x-6,y-6],[x+6,y-6],[x+6+ux,y-6+uy],[x-6+ux,y-6+uy]],p.shade);
   poly(c,[[x+6,y-6],[x+6,y+6],[x+6+ux,y+6+uy],[x+6+ux,y-6+uy]],p.rim);
   c.fillStyle=p.shade;c.fillRect(px(x-7+ux),px(y-7+uy),14,14);c.fillStyle=p.stone;c.fillRect(px(x-5+ux),px(y-5+uy),10,10);c.fillStyle=p.light;c.fillRect(px(x-5+ux),px(y-5+uy),8,2);
  }
 }
 // Worn abutment stones merge the ends with the road, with no crossbar across the lane.
 for(const end of [-1,1])for(const side of [-1,1]){const x=end*l,y=side*(w-12);c.fillStyle=p.shade;c.fillRect(px(x-4),px(y-5),8,10);c.fillStyle=p.stone;c.fillRect(px(x-4),px(y-5),6,4);}
}
export function drawAbyss(c,water,map){
 const pts=water.points,w=water.width,p=structurePalette(map.id),left=[],right=[];
 // Sample every 20px to break the old broad triangular outline into fractured ledges.
 for(let k=1;k<pts.length;k++){
  const a=pts[k-1],b=pts[k],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/len,ny=(b[0]-a[0])/len,steps=Math.max(1,Math.ceil(len/20));
  for(let j=0;j<steps;j++){
   const u=j/steps,t=(k-1+u)/(pts.length-1),half=Math.max(2,w*.5*(1-t*.92)),x=a[0]+(b[0]-a[0])*u,y=a[1]+(b[1]-a[1])*u,jag=(hash(k*91+j)-.5)*10*(1-t);
   left.push([px(x+nx*(half+jag)),px(y+ny*(half+jag))]);right.push([px(x-nx*(half-jag)),px(y-ny*(half-jag))]);
  }
 }
 const end=pts.at(-1),prev=pts.at(-2),len=Math.hypot(end[0]-prev[0],end[1]-prev[1])||1,tip=[end[0]+(end[0]-prev[0])/len*24,end[1]+(end[1]-prev[1])/len*24];
 const outline=[...left,tip,...right.slice().reverse()];
 poly(c,outline,'#0d1114');
 // The upper wall descends into the cut; clipping prevents rock faces spilling onto the grass.
 const upper=left.reduce((n,p)=>n+p[1],0)<right.reduce((n,p)=>n+p[1],0)?left:right;
 c.save();c.beginPath();outline.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip();
 for(const edge of [left,right])for(let i=1;i<edge.length;i++){
  const a=edge[i-1],b=edge[i],far=edge===upper,depth=(far?48:9)*(1-i/edge.length*.78);
  const wall=map.id===6?'#4c6570':map.id>=9?'#494039':'#485047';
  poly(c,[a,b,[b[0]+3,b[1]+depth],[a[0]+3,a[1]+depth]],far?wall:'#252d2d');
  poly(c,[[a[0]+1,a[1]+depth*.43],[b[0]+1,b[1]+depth*.43],[b[0]+3,b[1]+depth],[a[0]+3,a[1]+depth]],'#272f31');
  poly(c,[[a[0]+2,a[1]+depth*.77],[b[0]+2,b[1]+depth*.77],[b[0]+3,b[1]+depth+8],[a[0]+3,a[1]+depth+8]],'#151d21');
  if(far){c.strokeStyle='#667064';c.lineWidth=2;trace(c,[[a[0]+2,a[1]+6],[b[0]+1,b[1]+6]]);c.stroke();}
  if(i%2===0){c.strokeStyle='#161c20';c.lineWidth=2;trace(c,[[a[0],a[1]+4],[a[0]+3,a[1]+depth*.65],[a[0]+1,a[1]+depth]]);c.stroke();}
 }
 c.restore();
 for(const edge of [left,right])for(let i=1;i<edge.length;i++){
  const a=edge[i-1],b=edge[i];c.strokeStyle=p.shade;c.lineWidth=3;trace(c,[a,b]);c.stroke();
  if(i%5===0){c.strokeStyle=p.stone;c.lineWidth=2;trace(c,[[a[0]-3,a[1]],[a[0]+3,a[1]-2],b]);c.stroke();}
  if(i%7===0){c.strokeStyle='#2d3530';c.lineWidth=2;trace(c,[a,[a[0]+8,a[1]-8],[a[0]+16,a[1]-10]]);c.stroke();}
 }
}
export function drawGravelFord(c,length,width,flowAngle=0){
 c.save();const l=px(length/2),w=px(width/2);
 // Submerged gravel has no deck, parapet, piers, or raised shadow.
 for(let x=-l;x<l;x+=12)for(let y=-w+3;y<w-2;y+=10){
  const seed=hash(x+13,y+19),xx=x+(seed-.5)*6,yy=y+(hash(y,x)-.5)*4;
  if(seed<.22)continue;
  const rw=3+seed*3,rh=2+hash(y,x)*2;
  poly(c,[[xx-rw,yy],[xx-rw+2,yy-rh],[xx+rw-1,yy-rh],[xx+rw,yy+1],[xx+1,yy+rh],[xx-rw+1,yy+rh]],seed>.65?'#929a7c':'#6b8273');
  c.globalAlpha=.55;c.fillStyle='#b4bda0';c.fillRect(px(xx-1),px(yy-rh),3,2);c.globalAlpha=1;
 }
 // Transparent current washes across the stones; broken ripples follow the stream.
 c.fillStyle='#64b8bd';c.globalAlpha=.16;c.fillRect(-l,-w,length,width);c.globalAlpha=1;
 const ux=Math.cos(flowAngle),uy=Math.sin(flowAngle);
 for(let i=0;i<20;i++){const x=-l+hash(i,13)*length,y=-w+hash(i,27)*width;
  c.strokeStyle=i%3?'#bde3d76b':'#edf7e78a';c.lineWidth=1;c.beginPath();c.moveTo(px(x-ux*5),px(y-uy*5));c.lineTo(px(x+ux*5),px(y+uy*5));c.stroke();
 }
 c.restore();
}
