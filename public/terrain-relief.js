const snap=n=>Math.round(n/2)*2;
function path(c,points){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();}
function fill(c,points,color){path(c,points);c.fillStyle=color;c.fill();}
function palette(stage){return stage===6?{top:'#9eb9b6',soil:'#a3ada0',rim:'#cbdad3',mid:'#70858a',dark:'#465d67',shade:'#33464f',grass:'#799c98'}:stage===5?{top:'#a99562',soil:'#b29a72',rim:'#d0bc8c',mid:'#8d7958',dark:'#645943',shade:'#494737',grass:'#8d8d54'}:stage>=9?{top:'#635d4b',soil:'#81715b',rim:'#a2957a',mid:'#60594c',dark:'#423e38',shade:'#2e3130',grass:'#5f6750'}:{top:'#71854e',soil:'#978668',rim:'#b2b496',mid:'#7d7c65',dark:'#555e4b',shade:'#374331',grass:'#56783e'};}
export function terrainReliefDepth(z){const low=z.type==='low';return Math.min(low?110:165,Math.max(low?42:64,Math.min(z.rx,z.ry)*(low?.27:.405)));}
export function drawTerrainRelief(c,scene,z,material){
 const low=z.type==='low',p=palette(scene.mapBiomeStage||1),depth=terrainReliefDepth(z);
 const count=56,edge=[];
 for(let i=0;i<count;i++){
  const a=i/count*Math.PI*2,r=1+Math.sin(a*5+z.x*.01)*.026+Math.cos(a*9+z.y*.01)*.016;
  edge.push([snap(z.x+Math.cos(a)*z.rx*.94*r),snap(z.y+Math.sin(a)*z.ry*.87*r-(low?0:depth*.58))]);
 }
 c.save();c.imageSmoothingEnabled=false;
 // The silhouette is anchored to the existing zone; only the visible relief changes.
 fill(c,edge.map(([x,y])=>[x+6,y+(low?4:depth+5)]),'#18231a30');
 fill(c,edge,low?p.dark:p.top);
 if(material){c.save();path(c,edge);c.clip();c.globalAlpha=low?.24:.32;c.fillStyle=material;c.fillRect(z.x-z.rx*1.1,z.y-z.ry*1.2-depth,z.rx*2.2,z.ry*2.4+depth*2);c.restore();}
 const start=low?count/2:0,end=low?count:count/2;
 for(let i=start;i<end;i+=2){
  if(!low&&Math.abs(i-count/4)<=2)continue;
  const a=edge[i],middle=edge[(i+1)%count],b=edge[(i+2)%count],inset=low?.88:1;
  const aa=[snap(z.x+(a[0]-z.x)*inset),snap(a[1]+depth)],bb=[snap(z.x+(b[0]-z.x)*inset),snap(b[1]+depth)];
  const ledge=depth*(.38+Math.sin(i*1.7)*.1),ma=[aa[0]-3,snap(a[1]+ledge)],mb=[bb[0]+2,snap(b[1]+ledge-3)];
  fill(c,[a,middle,b,bb,aa],i%6===0?p.soil:p.mid);
  fill(c,[ma,mb,bb,aa],p.dark);
  fill(c,[[aa[0],aa[1]-5],[bb[0],bb[1]-8],bb,aa],p.shade);
  // Oblique rock facets and offset cracks replace uniform vertical wall panels.
  const cx=snap((a[0]+b[0])*.5),cy=snap((a[1]+b[1])*.5);
  fill(c,[[cx-5,cy+5],[b[0]-3,b[1]+9],[bb[0]-4,bb[1]-10],[cx+3,cy+depth*.6]],i%4?p.dark:p.soil);
  c.strokeStyle=p.shade;c.lineWidth=2;c.beginPath();c.moveTo(cx-4,cy+4);c.lineTo(cx+2,cy+depth*.32);c.lineTo(cx-5,cy+depth*.66);c.stroke();
  c.strokeStyle=p.soil;c.lineWidth=2;c.beginPath();c.moveTo(a[0]+4,a[1]+depth*.45);c.lineTo(cx-6,cy+depth*.4);c.stroke();
  if(i%4===0){c.strokeStyle=p.rim;c.lineWidth=2;c.beginPath();c.moveTo(a[0]+2,a[1]+1);c.lineTo(cx-2,cy+1);c.stroke();}
  // Turf overhangs break up the rock/grass seam.
  fill(c,[[a[0]-2,a[1]-2],[cx+3,cy-1],[cx+1,cy+3],[cx-8,cy+5],[a[0],a[1]+3]],p.grass);
 }
 if(!low){
  const center=edge[count/4],half=Math.min(110,Math.max(42,z.rx*.17)),topY=center[1]-30,footY=center[1]+depth+16;
  const left=[],right=[];
  for(let i=0;i<=9;i++){
   const t=i/9,y=snap(topY+(footY-topY)*t),bend=Math.sin(t*Math.PI)*half*.16,w=half*(.52+t*.4),jag=Math.sin(i*2.1+z.x)*5;
   left.push([snap(center[0]+bend-w+jag),y]);right.push([snap(center[0]+bend+w+jag*.6),y]);
  }
  fill(c,[...left,...right.slice().reverse()],p.mid);
  fill(c,[...left.map(([x,y],i)=>[x+6+(i%3)*2,y]),...right.slice().reverse().map(([x,y],i)=>[x-8-(i%2)*3,y])],p.soil);
  // Long worn ruts climb the slope, with sparse stones instead of horizontal stripes.
  for(const side of [-1,1]){const rut=[];for(let i=0;i<=9;i++){const t=i/9,bend=Math.sin(t*Math.PI)*half*.16;rut.push([snap(center[0]+bend+side*half*(.2+t*.18)+Math.sin(i)*2),snap(topY+(footY-topY)*t)]);}c.strokeStyle=p.mid;c.lineWidth=3;c.beginPath();rut.forEach((pt,i)=>i?c.lineTo(...pt):c.moveTo(...pt));c.stroke();}
  for(let i=0;i<10;i++){
   const t=(i+.5)/10,y=snap(topY+(footY-topY)*t),x=snap(center[0]+Math.sin(i*2.399)*half*(.3+t*.3));
   if(i%3===0){fill(c,[[x-4,y],[x,y-3],[x+5,y-1],[x+3,y+3],[x-3,y+2]],p.mid);c.fillStyle=p.rim;c.fillRect(x-1,y-2,3,2);}
   const edge=i%2?left[i]:right[i];c.fillStyle=p.grass;c.fillRect(edge[0]-2,edge[1]-2,4+(i%3)*2,3);c.fillRect(edge[0]+3,edge[1]+3,3,2);
  }
 }else{
  // One shallow side ramp slopes into the basin; the floor stays dry terrain.
  const x=z.x+z.rx*.64,y=z.y+z.ry*.34;
  fill(c,[[x-30,y-depth*.3],[x+42,y-depth*.5],[x+14,y+depth*.35],[x-58,y+depth*.42]],p.mid);
  c.strokeStyle=p.soil;c.lineWidth=2;c.beginPath();c.moveTo(snap(x+20),snap(y-depth*.3));c.lineTo(snap(x-24),snap(y+depth*.23));c.stroke();
 }
 // Small chips and grass along the rim, never a bright circular outline.
 for(let i=0;i<count;i+=5){const [x,y]=edge[i];c.fillStyle=p.grass;c.fillRect(x-3,y-2,6,2);if(i%2===0){c.fillStyle=p.rim;c.fillRect(x+4,y+2,4,2);}}
 c.restore();
}
