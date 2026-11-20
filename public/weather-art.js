import {weatherGraphics} from './weather-visibility.js';
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
export function drawWeather(scene,time){
 const g=weatherGraphics(scene),a=scene.atmosphere,cam=scene.cameras?.main?.worldView;
 if(!g||!cam)return;
 const layers=new Set(scene.weatherLayers??weatherForMap({id:scene.weatherStage}));
 const w=cam.width||cam.right-cam.x,h=cam.height||cam.bottom-cam.y;
 const t=time/1000,stage=scene.weatherStage;
 const density=Math.min(200,Math.max(65,Math.ceil(w*h/7000)));
 // Fixed seeds and absolute time keep camera movement and overlapping layers stable.
 for(const kind of layers){
  const index=Object.keys(WEATHER_TYPES).indexOf(kind);
  if(['fog','clouds'].includes(kind)||kind in STORM_TYPES)continue;
  const count=kind==='rain'?density*2:kind==='wind'?Math.ceil(density/7):kind==='snow'?density:Math.ceil(density*.5);
  for(let i=0;i<count;i++){
   const seed=i*2.399+index*17,speed=.65+(i%13)/15;
   const depth=.55+(i%3)*.3,gust=layers.has('wind')?Math.sin(t*.7+Math.floor(i/12)*.8):0;
   const rising=kind==='embers'||kind==='ash';
   const fall=kind==='rain'?350:kind==='snow'?48:rising?-35:18;
   const drift=kind==='rain'?-90:kind==='sand'?140:kind==='wind'?180:35;
   const x=pixel(mod(i*137+index*93+t*drift*speed,w+120)-60+cam.x);
   const y=pixel(mod(i*73+index*47+t*fall*speed,h+80)-40+cam.y);
   if(kind==='rain'){
    // Each drop ends at a fixed contact point; splash and ripple stay on the ground.
    const duration=.72+(i%7)*.055,cycle=Math.floor(t/duration+i*.193);
    const phase=mod(t/duration+i*.193,1),hit=.79;
    const gx=pixel(cam.x+mod(i*193+cycle*47,w+80)-40),gy=pixel(cam.y+mod(i*97+cycle*61,h+40)-20);
    if(phase<hit){
     const above=(1-phase/hit)*(100+depth*100),slant=above*(.22+gust*.05);
     const dx=pixel(gx+slant),dy=pixel(gy-above),length=pixel(14+depth*12);
     g.lineStyle(depth>1?2.5:1.5,depth>1?0xf0fcff:0xbad9e6,.45+depth*.3).lineBetween(dx,dy,dx-4,dy+length);
     if(depth>1)g.lineStyle(1,0xffffff,.65).lineBetween(dx-2,dy+length-4,dx-4,dy+length);
    }else{
     const u=(phase-hit)/(1-hit),radius=pixel(2+u*9*depth),alpha=(1-u)*.82;
     g.lineStyle(1,0xc4e2e8,alpha).beginPath().moveTo(gx-radius,gy).lineTo(gx-2,gy-2).lineTo(gx+radius,gy).moveTo(gx-radius,gy+2).lineTo(gx+2,gy+4).lineTo(gx+radius,gy+2).strokePath();
     if(u<.7){const lift=pixel(Math.sin(u/.7*Math.PI)*6);g.fillStyle(0xe2f2f1,alpha).fillRect(gx-radius,gy-lift,2,2).fillRect(gx+radius,gy-lift-2,2,2);}
    }
   }else if(kind==='snow'){
    const sx=x+pixel(Math.sin(t*1.4+seed)*12+gust*18*depth),sy=y+pixel(Math.cos(t*.9+seed)*5);
    if(i%3===0)g.fillStyle(0x486d82,.38).fillRect(sx+1,sy+2,3,2);
    g.fillStyle(i%3?0xe4f5ff:0xffffff,.58+depth*.3).fillRect(sx,sy,2,2);
    if(i%5===0)g.fillStyle(0xf0fbff,.9).fillRect(sx-2,sy,6,2).fillRect(sx,sy-2,2,6);
    if(layers.has('wind')&&i%7===0){
     for(let k=1;k<=3;k++)g.fillStyle(0xd5edf4,(4-k)*.12).fillRect(sx-k*6,sy+pixel(k*gust*2),4,2);
    }
   }else if(kind==='wind'){
    const pulse=Math.max(0,Math.sin(t*1.5+seed));if(pulse<.2)continue;
    g.lineStyle(2,0xe2f3dc,pulse*.5).beginPath().moveTo(x-38,y+10).lineTo(x-24,y+4).lineTo(x-8,y+2).lineTo(x+14,y+2).lineTo(x+28,y-2).lineTo(x+34,y-8).lineTo(x+30,y-14).lineTo(x+20,y-16).strokePath();
    g.lineStyle(1,0xebf5e2,pulse*.28).lineBetween(x-24,y+10,x+8,y+8);
   }else if(kind==='leaves'){
    const sway=pixel(Math.sin(t*2+seed)*8),flutter=Math.sin(t*4+seed),span=2+Math.abs(pixel(flutter*4));
    g.fillStyle(i%2?0xb77c3e:0x95522f,.8).fillTriangle(x-span,y+sway,x+span,y-2+sway,x+1,y+4+sway);
    g.fillStyle(0xe2b567,.6).fillTriangle(x-span,y+sway,x+1,y-2+sway,x+1,y+2+sway);
    g.lineStyle(1,0x604b2e,.7).lineBetween(x-2,y+sway,x+2,y+sway);
   }else if(kind==='sand'){
    g.lineStyle(1,0xefdaa6,.45+depth*.16).lineBetween(x,y,x+6+(i%3)*2,y-2);
    if(i%8===0)cloudRibbon(g,x,y+12,110,12,0xbca275,.075,seed,t);
   }else if(kind==='embers'){
    const ex=x+pixel(Math.sin(t*2+seed)*10),flicker=.72+Math.sin(t*7+seed)*.18;
    g.lineStyle(2,0xd66c35,.4).lineBetween(ex-4,y+10,ex,y+4).lineBetween(ex,y+4,ex+2,y);
    g.fillStyle(0xf07832,.5).fillTriangle(ex-2,y+2,ex+4,y+2,ex+2,y-4);g.fillStyle(i%3?0xffb34f:0xffe3a0,flicker).fillRect(ex,y,2,2);
   }else if(kind==='ash'){
    g.fillStyle(stage===9?0xa18b83:0xd1b9e4,.58).fillRect(x,y,2+(i%2)*2,2);
   }else if(kind==='motes'){
    g.fillStyle(0xfff2ac,.35+Math.max(0,Math.sin(t*2+seed))*.45).fillRect(x,y,2,2);
   }
  }
 }
 drawStorms(scene,time,layers);
 if(!a)return;a.clear();const sw=scene.scale.width,sh=scene.scale.height;
 a.fillStyle(stage===6?0x101f2b:stage>=9?0x1c1020:0x101d18,layers.has('rain')?.14:.07).fillRect(0,0,sw,sh);
 // Separate slow cloud volume and low ground mist; keep the playfield readable.
 for(const kind of ['clouds','fog']){
  if(!layers.has(kind))continue;
  const isFog=kind==='fog',color=stage===6?0xc2e1e9:stage>=9?0x94849e:0xb7c8bd;
  for(let i=0;i<(isFog?5:4);i++){
   const width=isFog?260+(i%3)*80:220+(i%3)*70;
   const x=pixel(mod(i*sw*.37+t*(isFog?7:12),sw+width)-width*.5),y=pixel(sh*(.12+i*.22)+Math.sin(t*.25+i)*12);
   if(!isFog)cloudRibbon(a,x+20,y+12,width*1.1,52,0x23352f,.035,i*3,t);
   cloudRibbon(a,x,y,width,isFog?16:50,color,isFog?.085:.11,i*3,t);
   if(isFog)cloudRibbon(a,x+70,y+14,width*.7,8,color,.035,i+7,t);
  }
 }
}
