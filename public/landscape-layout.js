import {castleCourt,inCastleCourt} from './castle-court.js';
import {tileCenter} from './terrain-grid.js';
const segmentDistance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);};
function crossing(a,b,c,d){const x=b[0]-a[0],y=b[1]-a[1],u=d[0]-c[0],v=d[1]-c[1],den=x*v-y*u;if(Math.abs(den)<.001)return null;const t=((c[0]-a[0])*v-(c[1]-a[1])*u)/den,s=((c[0]-a[0])*y-(c[1]-a[1])*x)/den;return t>=0&&t<=1&&s>=0&&s<=1?{x:a[0]+t*x,y:a[1]+t*y}:null;}
export function createLandscape(map){const {width,height,camps,lanes,forestPaths,base}=map;const roadPts=lanes.flat(),hSegs=[];for(const l of lanes)for(let i=1;i<l.length;i++)if(Math.abs(l[i][1]-l[i-1][1])<20)hSegs.push([l[i-1],l[i]]);const safePoint=(x,y)=>{for(const c of camps)if(Math.abs(x-c.x)<260&&Math.abs(y-c.y)<180)y=c.y+260;for(const [a,b] of hSegs){const x0=Math.min(a[0],b[0])-120,x1=Math.max(a[0],b[0])+120,hy=(a[1]+b[1])/2;if(x>=x0&&x<=x1&&Math.abs(y-hy)<185)y=y<hy?hy-195:hy+195;}for(const p of roadPts)if(Math.abs(x-p[0])<380&&Math.abs(y-p[1])<185)y=y<p[1]?p[1]-195:p[1]+195;return [x,Math.max(180,Math.min(height-180,y))];};const river={id:'great-river',type:'deep',name:'Sông Đại Ngàn',width:130+map.id*4,points:Array.from({length:13},(_,i)=>safePoint(i*width/12,height*.58+Math.sin(i*.85+map.id)*height*.065))},stream={id:'forest-stream',type:'shallow',name:'Suối Rừng',width:70,points:Array.from({length:9},(_,i)=>safePoint(i*width/8,height*.28+Math.sin(i*.95+map.id)*height*.07))};
 if(map.id===6){river.surface='ice';river.name='Sông Băng';stream.surface='ice';stream.name='Suối Băng';}else if(map.id===5){river.surface='dry';river.name='Lòng Sông Khô';stream.surface='dry';stream.name='Suối Cát Khô';}else if(map.id===8){stream.surface='ice';stream.name='Suối Băng';}else if(map.id===9||map.id===10){river.surface='lava';river.name='Sông Dung Nham';stream.surface='lava';stream.name='Suối Dung Nham';}
 const fromLeft=map.id%2===1;
 const abyss={id:'abyss-rift',type:'abyss',name:'Vực Thẳm',width:112,points:Array.from({length:8},(_,i)=>{const t=i/7,ax=fromLeft?t*width*.56:width-t*width*.56,ay=Math.max(190,Math.min(height-170,height*.78+Math.sin(i*1.35+map.id)*height*.055));return [Math.round(ax),Math.round(ay)];})};
 const rivers=[river,stream,abyss],bridges=[];
 for(const water of rivers)for(let j=1;j<water.points.length;j++)for(const p of roadPts)if(segmentDistance(p[0],p[1],water.points[j-1],water.points[j])<water.width*0.5+40){const up=(water.points[j-1][1]+water.points[j][1])*0.5<p[1],ny=Math.max(180,Math.min(height-180,up?p[1]-195:p[1]+195));water.points[j-1][1]=up?Math.min(water.points[j-1][1],ny):Math.max(water.points[j-1][1],ny);water.points[j][1]=up?Math.min(water.points[j][1],ny):Math.max(water.points[j][1],ny);}
 const bridgeSpan=b=>{const dx=Math.cos(b.angle)*(b.length*.5),dy=Math.sin(b.angle)*(b.length*.5);return [[b.x-dx,b.y-dy],[b.x+dx,b.y+dy]];};
 const bridgesOverlap=(a,b)=>{
  if(Math.hypot(a.x-b.x,a.y-b.y)<200)return true;
  const [a1,a2]=bridgeSpan(a),[b1,b2]=bridgeSpan(b);
  return !!(crossing(a1,a2,b1,b2)||segmentDistance(a.x,a.y,b1,b2)<140||segmentDistance(b.x,b.y,a1,a2)<140||segmentDistance(a1[0],a1[1],b1,b2)<110||segmentDistance(a2[0],a2[1],b1,b2)<110);
 };
 for(const water of rivers){for(const [pi,path] of [...lanes,...forestPaths,...(map.campCorridors||[])].entries()){const isMain=pi<lanes.length;for(let i=1;i<path.length;i++)for(let j=1;j<water.points.length;j++){const p=crossing(path[i-1],path[i],water.points[j-1],water.points[j]);if(!p||inCastleCourt(map,p))continue;const roadAngle=Math.atan2(path[i][1]-path[i-1][1],path[i][0]-path[i-1][0]),waterAngle=Math.atan2(water.points[j][1]-water.points[j-1][1],water.points[j][0]-water.points[j-1][0]);const cand={...p,ford:water.type==='shallow'||water.surface==='dry',abyss:water.type==='abyss',angle:roadAngle,width:160,length:Math.min(460,(water.width+110)/Math.max(.22,Math.abs(Math.sin(roadAngle-waterAngle))))};const blocked=isMain?bridges.some(b=>b.ford===cand.ford&&Math.hypot(b.x-cand.x,b.y-cand.y)<55):bridges.some(b=>b.ford===cand.ford&&bridgesOverlap(cand,b));if(!blocked)bridges.push(cand);}}}
 const relief=[];
 // Dãy núi to ở rìa bản đồ (dài tới ~nửa map, tránh chặn đường/cổng/trại)
 const inEllipse=(x,y,rc,m=0)=>Math.hypot((x-rc.x)/(rc.rx+m),(y-rc.y)/(rc.ry+m))<=1;
 const ridgeCandidates=[
  {x:width*.25,y:135,rx:Math.round(width*.22),ry:120},
  {x:width*.75,y:135,rx:Math.round(width*.22),ry:120},
  {x:width*.5,y:135,rx:Math.round(width*.24),ry:120},
  {x:145,y:height*.36,rx:130,ry:Math.round(height*.22)},
  {x:width-145,y:height*.36,rx:130,ry:Math.round(height*.22)},
  {x:145,y:height*.66,rx:130,ry:Math.round(height*.22)},
  {x:width-145,y:height*.66,rx:130,ry:Math.round(height*.22)},
  {x:width*.26,y:height-140,rx:Math.round(width*.22),ry:120},
  {x:width*.74,y:height-140,rx:Math.round(width*.22),ry:120}
 ];
 const segHitsRidge=(a,b,rc,m)=>{for(let s=0;s<=12;s++){const u=s/12;if(inEllipse(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,rc,m))return true;}return false;};
 const court=castleCourt(map),courtHitsRidge=rc=>{
  const cx=Math.max(court.left-64,Math.min(court.right+64,rc.x));
  const cy=Math.max(court.top-64,Math.min(court.bottom+64,rc.y));
  return inEllipse(cx,cy,rc,110);
 };
 for(let k=0;k<ridgeCandidates.length&&relief.length<2;k++){
  const rc=ridgeCandidates[(k+map.id)%ridgeCandidates.length];
  if(courtHitsRidge(rc)||inEllipse(base.x,base.y,rc,280))continue;
  if(camps.some(c=>inEllipse(c.x,c.y,rc,130)))continue;
  if([...lanes,...forestPaths,...(map.campCorridors||[])].some(l=>l.some((p,j)=>j&&segHitsRidge(l[j-1],p,rc,85))))continue;
  if(rivers.some(w=>w.points.some((p,j)=>j&&segHitsRidge(w.points[j-1],p,rc,w.width*.6))))continue;
  if(relief.some(z=>Math.hypot(z.x-rc.x,z.y-rc.y)<260))continue;
  const horiz=rc.rx>=rc.ry,pts=Array.from({length:7},(_,i)=>{
   const t=i/6-.5,wob=Math.sin(i*1.7+map.id+k)*38;
   return horiz?[Math.round(rc.x+t*rc.rx*1.85),Math.round(rc.y+wob)]:[Math.round(rc.x+wob),Math.round(rc.y+t*rc.ry*1.85)];
  });
  relief.push({id:'ridge-'+k,type:'mountain',ridge:true,spine:pts,width:86,...rc});
 }
 for(let i=0;i<28;i++){const type=['mountain','high','low'][i%3],rx=Math.round(width*(type==='mountain'?.095:.105+(i%3)*.01)),ry=Math.round(height*(type==='mountain'?.09:.095+(i%2)*.015)),x=rx+100+(i*1193+map.id*317)%Math.max(120,width-rx*2-200),y=ry+100+(i*791+map.id*199)%Math.max(120,height-ry*2-200);if(Math.hypot(x-base.x,y-base.y)<rx+260||camps.some(c=>Math.hypot(x-c.x,y-c.y)<rx+120)||map.territories.some(t=>Math.hypot(x-t.x,y-t.y)<t.radius+rx*.75)||[...lanes,...forestPaths,...(map.campCorridors||[])].some(l=>l.some((p,k)=>k&&segmentDistance(x,y,l[k-1],p)<rx*.7+80))||rivers.some(w=>w.points.some((p,k)=>k&&segmentDistance(x,y,w.points[k-1],p)<rx*.7+w.width))||relief.some(z=>Math.hypot(x-z.x,y-z.y)<z.rx+rx*.75))continue;relief.push({id:'relief-'+i,type,x,y,rx,ry});}return {rivers,bridges:bridges.filter(b=>!b.ford),fords:bridges.filter(b=>b.ford),relief};}
export function waterAt(map,u){if(inCastleCourt(map,u))return null;if((map.rivers||[]).some(w=>w.type==='shallow'&&w.points.some((p,k)=>k&&segmentDistance(u.x,u.y,w.points[k-1],p)<w.width/2)))return {type:'shallow'};if((map.lanes||[]).some(l=>l.some((p,k)=>k&&segmentDistance(u.x,u.y,l[k-1],p)<75)))return null;if((map.bridges||[]).some(b=>{const dx=u.x-b.x,dy=u.y-b.y,cx=tileCenter(u.x)-b.x,cy=tileCenter(u.y)-b.y;return (Math.abs(dx*Math.cos(b.angle)+dy*Math.sin(b.angle))<b.length/2&&Math.abs(-dx*Math.sin(b.angle)+dy*Math.cos(b.angle))<b.width/2)||(Math.abs(cx*Math.cos(b.angle)+cy*Math.sin(b.angle))<b.length/2&&Math.abs(-cx*Math.sin(b.angle)+cy*Math.cos(b.angle))<b.width/2);}))return null;for(const w of map.rivers||[])if(w.points.some((p,k)=>{if(!k)return false;const halfW=w.type==='abyss'?w.width*.5*(1-(k-.5)/(w.points.length-1)*.82):w.width/2;return segmentDistance(tileCenter(u.x),tileCenter(u.y),w.points[k-1],p)<halfW;})){if(w.surface==='dry')continue;return {type:w.surface==='ice'?'ice':w.surface==='lava'?'lava':w.type};}return null;}
