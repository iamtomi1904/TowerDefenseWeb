import {weatherGraphics,getActiveViews} from './weather-visibility.js';
import {STORM_TYPES,drawStorms} from './weather-storms.js';
export const WEATHER_TYPES={wind:'Gió',clouds:'Mây trôi',fog:'Sương mù',rain:'Mưa',snow:'Tuyết',leaves:'Lá bay',sand:'Bụi cát',embers:'Tàn lửa',ash:'Tro tím',motes:'Hạt sáng',...STORM_TYPES};
const defaults={1:['wind','clouds','motes'],2:['wind','clouds','fog','motes'],3:['wind','clouds','leaves'],4:['wind','fog','motes'],5:['wind','clouds','sand','sandstorm'],6:['wind','clouds','snow','fog','blizzard'],7:['wind','clouds','rain','fog'],8:['wind','clouds','rain','thunderstorm'],9:['wind','embers','ash','firestorm'],10:['wind','fog','ash','deadstorm']};
export function weatherForMap(map){return [...new Set((map.weather??defaults[map.id]??['wind','clouds']).filter(id=>id in WEATHER_TYPES))];}
const mod=(n,m)=>((n%m)+m)%m;
const pixel=n=>Math.round(n/2)*2;
// Layered contour strips keep the painted atmosphere irregular, sparse and pixel crisp.
function cloudRibbon(g,x,y,width,height,color,alpha,seed,time){
 for(let row=0;row<4;row++){
  const points=[];const inset=[.22,.06,0,.15][row];
  for(let k=0;k<=12;k++){
   const u=k/12,xx=pixel(x+(u-.5)*width*(1-inset));
   const taper=Math.sin(u*Math.PI),wave=Math.sin(k*1.77+seed+time*.12)*height*.12;
   points.push([xx,pixel(y+row*height*.16-taper*height*.4+wave)]);
  }
  g.fillStyle(color,alpha*[.45,.75,1,.5][row]).beginPath().moveTo(...points[0]);
  for(let k=1;k<points.length;k++)g.lineTo(points[k][0],points[k-1][1]).lineTo(...points[k]);
  for(let k=points.length-1;k>=0;k--)g.lineTo(points[k][0],points[k][1]+pixel(height*.18));
  g.closePath().fillPath();
 }
}
function paintCloudRibbon2D(ctx,x,y,width,height,rgb,alpha,seed){
 for(const ox of [-512,0,512]){
  for(let row=0;row<4;row++){
   const points=[],inset=[.22,.06,0,.15][row];
   for(let k=0;k<=12;k++){
    const u=k/12,xx=pixel(x+ox+(u-.5)*width*(1-inset));
    const taper=Math.sin(u*Math.PI),wave=Math.sin(k*1.77+seed)*height*.12;
    points.push([xx,pixel(y+row*height*.16-taper*height*.4+wave)]);
   }
   ctx.fillStyle=`rgba(${rgb},${(alpha*[.45,.75,1,.5][row]).toFixed(3)})`;
   ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
   for(let k=1;k<points.length;k++){ctx.lineTo(points[k][0],points[k-1][1]);ctx.lineTo(points[k][0],points[k][1]);}
   for(let k=points.length-1;k>=0;k--)ctx.lineTo(points[k][0],points[k][1]+pixel(height*.18));
   ctx.closePath();ctx.fill();
  }
 }
}
export function drawWeather(scene,time,views=getActiveViews(scene)){
 const g=weatherGraphics(scene),a=scene.atmosphere;
 if(!g)return;
 if(a)a.clear();
 if(!views.length){if(scene._atmosTile)scene._atmosTile.setVisible(false);return;}
 const layers=new Set(scene.weatherLayers??weatherForMap({id:scene.weatherStage}));
 const mapW=scene.mapWidth||views[0].right,mapH=scene.mapHeight||views[0].bottom;
 const inMap=(px,py,pad=4)=>px>=pad&&px<=mapW-pad&&py>=pad&&py<=mapH-pad;
 const t=time/1000,stage=scene.weatherStage;
 const sw=scene.scale?.width||1280,sh=scene.scale?.height||720;
 // Share screen-space particle budget across active co-op viewports so multi-screen never doubles CPU/GPU load.
 const totalDensity=Math.min(85,Math.max(40,Math.ceil((sw*sh)/14000)));
 const density=Math.max(24,Math.ceil(totalDensity/views.length));
 for(let vi=0;vi<views.length;vi++){
  const v=views[vi],vx=v.x,vy=v.y,vw=v.width,vh=v.height;
  for(const kind of layers){
   const index=Object.keys(WEATHER_TYPES).indexOf(kind);
   if(['fog','clouds'].includes(kind)||kind in STORM_TYPES)continue;
   const count=kind==='rain'?Math.round(density*1.5):kind==='wind'?Math.ceil(density/7):kind==='snow'?density:Math.ceil(density*.5);
   for(let i=0;i<count;i++){
    const seed=i*2.399+index*17+vi*31,speed=.65+(i%13)/15;
    const depth=.55+(i%3)*.3,gust=layers.has('wind')?Math.sin(t*.7+Math.floor(i/12)*.8):0;
    const rising=kind==='embers'||kind==='ash';
    const fall=kind==='rain'?350:kind==='snow'?48:rising?-35:18;
    const drift=kind==='rain'?-90:kind==='sand'?140:kind==='wind'?180:35;
    const x=pixel(vx+mod(i*137+index*93+t*drift*speed-vx,vw));
    const y=pixel(vy+mod(i*73+index*47+t*fall*speed-vy,vh));
    if(!inMap(x,y,6))continue;
    if(kind==='rain'){
     const duration=.72+(i%7)*.055,cycle=Math.floor(t/duration+i*.193);
     const phase=mod(t/duration+i*.193,1),hit=.79;
     const gx=pixel(vx+mod(i*193+cycle*47-vx,vw)),gy=pixel(vy+mod(i*97+cycle*61-vy,vh));
     if(!inMap(gx,gy,14))continue;
     if(phase<hit){
      const above=(1-phase/hit)*(100+depth*100),slant=above*(.22+gust*.05);
      const dx=pixel(gx+slant),dy=pixel(gy-above),length=pixel(14+depth*12);
      if(!inMap(dx,dy,6)||!inMap(dx-4,dy+length,6))continue;
      g.lineStyle(depth>1?2.5:1.5,depth>1?0xf0fcff:0xbad9e6,.45+depth*.3).lineBetween(dx,dy,dx-4,dy+length);
      if(depth>1)g.lineStyle(1,0xffffff,.65).lineBetween(dx-2,dy+length-4,dx-4,dy+length);
     }else{
      const u=(phase-hit)/(1-hit),radius=pixel(2+u*9*depth),alpha=(1-u)*.82;
      g.lineStyle(1,0xc4e2e8,alpha).beginPath().moveTo(gx-radius,gy).lineTo(gx-2,gy-2).lineTo(gx+radius,gy).moveTo(gx-radius,gy+2).lineTo(gx+2,gy+4).lineTo(gx+radius,gy+2).strokePath();
      if(u<.7){const lift=pixel(Math.sin(u/.7*Math.PI)*6);g.fillStyle(0xe2f2f1,alpha).fillRect(gx-radius,gy-lift,2,2).fillRect(gx+radius,gy-lift-2,2,2);}
     }
    }else if(kind==='snow'){
     const sx=x+pixel(Math.sin(t*1.4+seed)*12+gust*18*depth),sy=y+pixel(Math.cos(t*.9+seed)*5);
     if(!inMap(sx,sy,8))continue;
     if(i%3===0)g.fillStyle(0x486d82,.38).fillRect(sx+1,sy+2,3,2);
     g.fillStyle(i%3?0xe4f5ff:0xffffff,.58+depth*.3).fillRect(sx,sy,2,2);
     if(i%5===0)g.fillStyle(0xf0fbff,.9).fillRect(sx-2,sy,6,2).fillRect(sx,sy-2,2,6);
     if(layers.has('wind')&&i%7===0){
      for(let k=1;k<=3;k++)if(inMap(sx-k*6,sy+pixel(k*gust*2),4))g.fillStyle(0xd5edf4,(4-k)*.12).fillRect(sx-k*6,sy+pixel(k*gust*2),4,2);
     }
    }else if(kind==='wind'){
     if(!inMap(x-38,y+10,4)||!inMap(x+34,y-16,4))continue;
     const pulse=Math.max(0,Math.sin(t*1.5+seed));if(pulse<.2)continue;
     g.lineStyle(2,0xe2f3dc,pulse*.5).beginPath().moveTo(x-38,y+10).lineTo(x-24,y+4).lineTo(x-8,y+2).lineTo(x+14,y+2).lineTo(x+28,y-2).lineTo(x+34,y-8).lineTo(x+30,y-14).lineTo(x+20,y-16).strokePath();
     g.lineStyle(1,0xebf5e2,pulse*.28).lineBetween(x-24,y+10,x+8,y+8);
    }else if(kind==='leaves'){
     const sway=pixel(Math.sin(t*2+seed)*8),flutter=Math.sin(t*4+seed),span=2+Math.abs(pixel(flutter*4));
     if(!inMap(x,y+sway,8))continue;
     g.fillStyle(i%2?0xb77c3e:0x95522f,.8).fillTriangle(x-span,y+sway,x+span,y-2+sway,x+1,y+4+sway);
     g.fillStyle(0xe2b567,.6).fillTriangle(x-span,y+sway,x+1,y-2+sway,x+1,y+2+sway);
     g.lineStyle(1,0x604b2e,.7).lineBetween(x-2,y+sway,x+2,y+sway);
    }else if(kind==='sand'){
     g.lineStyle(1,0xefdaa6,.45+depth*.16).lineBetween(x,y,x+6+(i%3)*2,y-2);
     if(i%8===0&&inMap(x,y+12,58))cloudRibbon(g,x,y+12,110,12,0xbca275,.075,seed,t);
    }else if(kind==='embers'){
     const ex=x+pixel(Math.sin(t*2+seed)*10),flicker=.72+Math.sin(t*7+seed)*.18;
     if(!inMap(ex,y,8))continue;
     g.lineStyle(2,0xd66c35,.4).lineBetween(ex-4,y+10,ex,y+4).lineBetween(ex,y+4,ex+2,y);
     g.fillStyle(0xf07832,.5).fillTriangle(ex-2,y+2,ex+4,y+2,ex+2,y-4);
     g.fillStyle(i%3?0xffb34f:0xffe3a0,flicker).fillRect(ex,y,2,2);
    }else if(kind==='ash'){
     g.fillStyle(stage===9?0xa18b83:0xd1b9e4,.58).fillRect(x,y,2+(i%2)*2,2);
    }else if(kind==='motes'){
     g.fillStyle(0xfff2ac,.35+Math.max(0,Math.sin(t*2+seed))*.45).fillRect(x,y,2,2);
    }
   }
  }
 }
 drawStorms(scene,time,layers,views);
 let vx=views[0].x,vy=views[0].y,vx2=views[0].right,vy2=views[0].bottom;
 for(let vi=1;vi<views.length;vi++){vx=Math.min(vx,views[vi].x);vy=Math.min(vy,views[vi].y);vx2=Math.max(vx2,views[vi].right);vy2=Math.max(vy2,views[vi].bottom);}
 const vw=Math.max(1,vx2-vx),vh=Math.max(1,vy2-vy);
 // Clip atmosphere tint & cached 512x512 seamless cloud/fog TileSprite strictly to visible map frame [vx,vy,vw,vh] without Stencil Buffer cost
 if(a){
  a.setScrollFactor(1);
  a.fillStyle(stage===6?0x101f2b:stage>=9?0x1c1020:0x101d18,layers.has('rain')?.14:.07).fillRect(vx,vy,vw,vh);
 }
 const hasClouds=layers.has('clouds'),hasFog=layers.has('fog');
 if((hasClouds||hasFog)&&scene.textures?.createCanvas&&scene.add?.tileSprite){
  const tKey=`atmos-ribbon-v2-${stage}-${hasClouds?1:0}-${hasFog?1:0}`;
  if(!scene.textures.exists(tKey)){
   const tc=scene.textures.createCanvas(tKey,512,512),ctx=tc.context;
   const rgb=stage===6?'194,225,233':stage>=9?'148,132,158':'183,200,189';
   if(hasClouds){
    for(const [cx,cy,cw,ch,seed] of [[110,76,220,46,1],[370,196,240,48,4],[160,328,210,44,7],[420,446,230,46,10]]){
     paintCloudRibbon2D(ctx,cx+18,cy+10,cw*1.08,ch,stage>=9?'28,18,34':'35,53,47',.035,seed);
     paintCloudRibbon2D(ctx,cx,cy,cw,ch,rgb,.105,seed);
    }
   }
   if(hasFog){
    for(const [fx,fy,fw,fh,seed] of [[80,136,270,16,2],[340,266,290,16,5],[190,392,260,15,8],[450,490,250,15,11]]){
     paintCloudRibbon2D(ctx,fx,fy,fw,fh,rgb,.082,seed);
     paintCloudRibbon2D(ctx,fx+56,fy+12,fw*.7,8,rgb,.035,seed+7);
    }
   }
   tc.refresh();
  }
  if(!scene._atmosTile||!scene._atmosTile.scene||scene._atmosTileKey!==tKey){
   if(scene._atmosTile)scene._atmosTile.destroy();
   scene._atmosTile=scene.add.tileSprite(vx,vy,vw,vh,tKey).setOrigin(0).setScrollFactor(1).setDepth(3500);
   scene._atmosTileKey=tKey;
   if(scene.mapObjects)scene.mapObjects.push(scene._atmosTile);
  }
  scene._atmosTile.setVisible(true).setPosition(vx,vy).setSize(vw,vh);
  scene._atmosTile.tilePositionX=vx-t*12;
  scene._atmosTile.tilePositionY=vy+Math.sin(t*.25)*10;
 }else if(scene._atmosTile){
  scene._atmosTile.setVisible(false);
 }
}
