import {weatherGraphics} from './weather-visibility.js';
export const STORM_TYPES={thunderstorm:'Bão lốc & chớp',blizzard:'Bão tuyết',sandstorm:'Bão cát',deadstorm:'Bão đất chết',firestorm:'Xoáy lửa dung nham'};
const snap=v=>Math.round(v/2)*2;
const wrap=(v,n)=>((v%n)+n)%n;
const palettes={thunderstorm:[0x526b75,0xb3ccd6,0xd5eaf1],blizzard:[0x689aaf,0xb8e3f0,0xf5ffff],sandstorm:[0x8c693e,0xd7b471,0xf0d699],deadstorm:[0x4d405b,0xad8ec1,0xc5b1d4],firestorm:[0x8d3327,0xf88839,0xffd27b]};
function bolt(g,x,y,height,t,seed){
 const cycle=Math.floor(t/4.7),phase=wrap(t+seed,4.7);
 if(phase>.24)return;
 const power=phase<.08?1:.55,points=[[x,y-height]];
 for(let k=1;k<=9;k++)points.push([snap(x+Math.sin(k*9.7+cycle*3+seed)*12*(1-k/12)),snap(y-height+k*height/9)]);
 for(const [width,color,alpha] of [[9,0x728fc8,.22],[4,0xb8d9ff,.85],[2,0xf4ffff,1]]){
  g.lineStyle(width,color,alpha*power).beginPath().moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.strokePath();
 }
 const p=points[5];g.lineStyle(1,0xd6edff,.7).beginPath().moveTo(...p).lineTo(p[0]+18,p[1]+5).lineTo(p[0]+12,p[1]+16).lineTo(p[0]+28,p[1]+24).strokePath();
 for(let i=0;i<7;i++){const a=i/7*Math.PI*2,r=18+phase*100;g.lineStyle(1,0xb6d8f0,(1-phase/.24)*.5).beginPath().moveTo(x+Math.cos(a)*8,y+Math.sin(a)*3).lineTo(snap(x+Math.cos(a)*r*.7),snap(y+Math.sin(a)*r*.3)).lineTo(snap(x+Math.cos(a+.15)*r),snap(y+Math.sin(a+.15)*r*.4)).strokePath();}
}
function vortex(g,x,y,t,kind,seed){
 const [dark,mid,light]=palettes[kind],fire=kind==='firestorm',dead=kind==='deadstorm';
 const height=fire?168:dead?135:185,width=fire?57:dead?74:80;
 const sway=Math.sin(t*.9+seed)*10,spin=t*(fire?6.5:dead?3.4:5);
 // Thin spiralling ribbons taper toward the ground; the gaps preserve silhouettes behind them.
 for(let row=0;row<23;row++){
  const u=row/22,ry=y-u*height,radius=9+u*width,cx=x+sway*u*u;
  for(let ribbon=0;ribbon<3;ribbon++){
   const start=spin+row*.5+ribbon*Math.PI*2/3;
   const front=Math.sin(start)>.0;
   g.lineStyle(front?3:2,front?mid:dark,front?.7:.38).beginPath();
   for(let k=0;k<=7;k++){const angle=start+k*.13,px=snap(cx+Math.cos(angle)*radius),py=snap(ry+Math.sin(angle)*radius*.19);if(!k)g.moveTo(px,py);else g.lineTo(px,py);}g.strokePath();
   if(front&&row%2===0)g.lineStyle(1,light,fire?.9:.75).lineBetween(snap(cx+Math.cos(start+.4)*radius),snap(ry+Math.sin(start+.4)*radius*.19),snap(cx+Math.cos(start+.7)*radius),snap(ry+Math.sin(start+.7)*radius*.19));
  }
 }
 for(let i=0;i<38;i++){
  const u=wrap(t*(fire?.24:.15)+i*.137,1),a=spin+i*2.399+u*8,r=14+u*(width+16);
  const px=snap(x+Math.cos(a)*r+sway*u),py=snap(y-u*height+Math.sin(a)*r*.2);
  g.lineStyle(1,i%3?mid:light,.6+Math.sin(u*Math.PI)*.35).lineBetween(px,py,px+snap(Math.sin(a)*5),py+(fire?6:2));
  if(fire&&i%4===0)g.fillStyle(light,.9).fillTriangle(px-2,py+2,px+2,py+2,px,py-4);
  if(dead&&i%7===0){g.lineStyle(1,light,.4).lineBetween(px-4,py,px+4,py).lineBetween(px,py-2,px,py+4);}
 }
 // Debris skims around the contact area rather than forming a solid disc.
 for(let i=0;i<14;i++){const a=spin*.8+i*2.399,r=18+(i%5)*7,px=snap(x+Math.cos(a)*r),py=snap(y+Math.sin(a)*r*.3);g.lineStyle(1,i%3?mid:light,.6).lineBetween(px,py,px+snap(Math.sin(a)*7),py-2);}
 if(kind==='thunderstorm')bolt(g,x+18,y,height+32,t,seed);
}
function squall(g,x,y,t,kind,seed){
 const snow=kind==='blizzard',[dark,mid,light]=palettes[kind],speed=snow?5.4:4.2;
 for(let i=0;i<90;i++){
  const a=t*speed+i*2.399,r=24+(i%17)*6,band=(i%3)-1;
  const px=snap(x+Math.cos(a)*r*1.65),py=snap(y-54+Math.sin(a)*r*.4+band*34);
  g.lineStyle(i%5===0?3:2,i%3?mid:light,.32+(i%5)*.1).beginPath().moveTo(px,py).lineTo(px+snap(Math.sin(a)*12),py-snap(Math.cos(a)*4)).lineTo(px+snap(Math.sin(a+.12)*24),py-snap(Math.cos(a+.12)*8)).strokePath();
  if(snow&&i%3===0)g.fillStyle(light,.9).fillRect(px,py,2,2);
  if(!snow&&i%4===0)g.lineStyle(1,dark,.5).lineBetween(px,py,px+6,py-2);
 }
 // Broad broken gusts pass through the circular squall.
 for(let i=0;i<9;i++){
  const travel=wrap(t*(snow?190:150)+i*59,420)-210,px=snap(x+travel),py=snap(y-110+i*16+Math.sin(t*2+i)*6);
  g.lineStyle(i%3===0?3:2,i%2?mid:light,.34).beginPath().moveTo(px-35,py+8).lineTo(px-15,py+2).lineTo(px+8,py).lineTo(px+32,py-6).strokePath();
 }
}
export function drawStorms(scene,time,layers){
 const g=weatherGraphics(scene),cam=scene.cameras.main.worldView,t=time/1000;
 const w=cam.width||cam.right-cam.x,h=cam.height||cam.bottom-cam.y;
 const mapW=scene.mapWidth||w,mapH=scene.mapHeight||h;
 const columns=Math.max(1,Math.ceil(mapW/1100)),rows=Math.max(1,Math.ceil(mapH/850));
 const kinds=[...layers].filter(id=>id in STORM_TYPES);
 for(const [n,kind] of kinds.entries()){
  let visible=0;const limit=kinds.length>1?1:3;
  for(let row=0;row<rows&&visible<limit;row++)for(let col=0;col<columns&&visible<limit;col++){
   const seed=col*17+row*31+Object.keys(STORM_TYPES).indexOf(kind)*7;
   const x=(col+.5)*mapW/columns+Math.sin(t*.13+seed)*Math.min(65,mapW*.06)+(n-(kinds.length-1)/2)*100;
   const y=(row+.72)*mapH/rows+Math.cos(t*.11+seed)*Math.min(28,mapH*.05);
   if(x<cam.x-220||x>cam.x+w+220||y<cam.y-80||y>cam.y+h+240)continue;
   visible++;
   if(kind==='blizzard'||kind==='sandstorm')squall(g,x,y,t,kind,seed);else vortex(g,x,y,t,kind,seed);
  }
 }
}
