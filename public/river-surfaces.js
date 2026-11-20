import {biomePattern} from './biome-art.js';
import {drawRiverBanks} from './riverbank-art.js';
import {waterCurrent} from './water-current.js';
const snap=n=>Math.round(n/2)*2;
function trace(c,pts){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));}
function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill();}
function channel(c,w){const left=[],right=[];w.points.forEach((p,i)=>{const a=w.points[Math.max(0,i-1)],b=w.points[Math.min(w.points.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/len,ny=(b[0]-a[0])/len;left.push([p[0]+nx*(w.width/2-3),p[1]+ny*(w.width/2-3)]);right.unshift([p[0]-nx*(w.width/2-3),p[1]-ny*(w.width/2-3)]);});c.beginPath();[...left,...right].forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();}
export function drawRiverSurface(c,scene,w,map){
 const ice=w.surface==='ice',dry=w.surface==='dry',stage=ice?6:dry?5:9;
 c.save();c.lineCap='round';c.lineJoin='round';drawRiverBanks(c,w,{...map,id:stage});
 trace(c,w.points);c.lineWidth=w.width+2;c.strokeStyle=ice?'#d0e5e6':dry?'#85785e':'#51362c';c.stroke();
 trace(c,w.points);c.lineWidth=w.width-8;c.strokeStyle=ice?'#8cb9cc':dry?'#aa9471':'#ae4b29';c.stroke();
 const pattern=biomePattern(c,scene,ice?'ice':dry?'desert':'lava');
 if(pattern){c.save();trace(c,w.points);c.lineWidth=w.width-10;c.strokeStyle=pattern;c.globalAlpha=ice?.5:dry?.55:.65;c.stroke();c.restore();}
 c.save();channel(c,w);c.clip();
 for(let k=1;k<w.points.length;k++){
  const a=w.points[k-1],b=w.points[k],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
  for(let d=12;d<len;d+=ice?34:24){const x=a[0]+ux*d,y=a[1]+uy*d,seed=Math.sin(d*4.1+k)*.5+.5,off=(seed-.5)*w.width*.6,px=snap(x+nx*off),py=snap(y+ny*off);
   if(ice){
    c.strokeStyle='#416f8b88';c.lineWidth=2;trace(c,[[px-ux*8,py-uy*8],[px+nx*10,py+ny*10],[px+ux*8+nx*4,py+uy*8+ny*4],[px+nx*18+ux*12,py+ny*18+uy*12]]);c.stroke();
    c.strokeStyle='#e7faffaa';c.lineWidth=1;trace(c,[[px+2,py-1],[px+nx*10+2,py+ny*10-1]]);c.stroke();
   }else if(dry){
    polygon(c,[[px-5,py],[px-2,py-3],[px+5,py-2],[px+6,py+2],[px,py+4]],seed>.5?'#8d846a':'#b8aa87');
    c.strokeStyle='#74654c88';c.lineWidth=1;trace(c,[[px+8,py-3],[px+14,py],[px+11,py+5]]);c.stroke();
   }else{
    const r=6+seed*8;polygon(c,[[px-r,py-2],[px-r*.5,py-7],[px+r*.6,py-5],[px+r,py+2],[px+r*.3,py+7],[px-r*.8,py+5]],'#46372f');
    c.strokeStyle='#dc7b3b';c.lineWidth=2;trace(c,[[px-r+2,py+5],[px+2,py+7],[px+r,py+2]]);c.stroke();
   }
  }
 }
 c.restore();c.restore();
}
export function updateRiverSurfaceFX(g,w,time,cam,hidden=()=>false){
 for(let k=1;k<w.points.length;k++){
  const a=w.points[k-1],b=w.points[k],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
  const count=Math.max(2,Math.ceil(len/85));
  for(let i=0;i<count;i++){
   const flow=waterCurrent({...w,flowSpeed:w.surface==='lava'?22:12},k,1,time),u=(flow.distance/len+i/count)%1;
   const off=Math.sin(i*2.399+k)*w.width*.28,x=a[0]+dx*u+nx*off,y=a[1]+dy*u+ny*off;
   if(x<cam.x-30||x>cam.right+30||y<cam.y-30||y>cam.bottom+30||hidden(x,y))continue;
   if(w.surface==='ice'){
    const alpha=Math.max(0,Math.sin(time/1100+i+k)-.65);if(alpha)g.lineStyle(1,0xeaffff,alpha).lineBetween(x-4,y,x+4,y).lineBetween(x,y-3,x,y+3);
   }else if(w.surface==='dry'){
    g.lineStyle(1,0xc9ba92,.16).lineBetween(x-6,y,x+6,y-2);
   }else{
    const fade=Math.sin(u*Math.PI);g.lineStyle(3,0xe88438,fade*.55).lineBetween(x-ux*10,y-uy*10,x+ux*10,y+uy*10);g.lineStyle(1,0xffc668,fade*.75).lineBetween(x-ux*6,y-uy*6,x+ux*6,y+uy*6);
    if(i%2===0)g.fillStyle(0xf9ad53,fade*.5).fillRect(snap(x),snap(y-((time/120+i)%20)),2,2);
   }
  }
 }
}
