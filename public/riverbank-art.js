const snap=v=>Math.round(v/2)*2;
function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(snap(x),snap(y)):c.moveTo(snap(x),snap(y)));c.closePath();c.fill();}
export function bankPalette(id){return id===6?{grass:'#91adb0',earth:'#bad1cd',face:'#799da6',wet:'#587d88',light:'#deece7'}:id===5?{grass:'#988354',earth:'#c3ad7e',face:'#aa9164',wet:'#807754',light:'#dac89a'}:id>=9?{grass:'#4d4538',earth:'#78654e',face:'#544c3f',wet:'#393f38',light:'#95846b'}:{grass:'#526447',earth:'#a39770',face:'#786f50',wet:'#505f4e',light:'#bbb28b'};}
export function drawRiverBanks(c,water,map){
 const p=bankPalette(map.id),w=water.width;
 c.save();c.lineJoin='round';c.lineCap='round';
 // Continuous underlay seals corners while broken layered ledges soften the outline.
 c.beginPath();water.points.forEach((point,i)=>i?c.lineTo(...point):c.moveTo(...point));c.lineWidth=w+28;c.strokeStyle=p.face;c.stroke();
 let distance=0;
 for(let k=1;k<water.points.length;k++){
  const a=water.points[k-1],b=water.points[k],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/len,ny=(b[0]-a[0])/len,steps=Math.max(1,Math.ceil(len/18));
  for(const side of [-1,1]){
   const bands=[[],[],[],[]];
   for(let i=0;i<=steps;i++){
    const u=i/steps,d=distance+len*u,x=a[0]+(b[0]-a[0])*u,y=a[1]+(b[1]-a[1])*u;
    const rough=Math.sin(d*.065+side*3+map.id)*3+Math.sin(d*.13+side)*2;
    [26+rough,17+rough*.8,8+rough*.4,1].forEach((offset,j)=>bands[j].push([x+nx*side*(w/2+offset),y+ny*side*(w/2+offset)]));
   }
   for(const [i,color] of [[0,p.grass],[1,p.earth],[2,p.wet]])polygon(c,[...bands[i],...bands[i+1].slice().reverse()],color);
   // Lit ledge fragments and exposed soil faces are sparse, not a necklace of circles.
   for(let i=1;i<steps;i++){
    const q=bands[1][i],next=bands[1][i+1],seed=(i*37+k*19+(side+1)*13)%17;
    if(seed<6){const down=ny*side>0?5:3;polygon(c,[q,next,[next[0],next[1]+down],[q[0],q[1]+down]],p.face);}
    if(seed<3){c.strokeStyle=p.light;c.lineWidth=2;c.beginPath();c.moveTo(...q);c.lineTo((q[0]+next[0])/2,(q[1]+next[1])/2);c.stroke();}
    if(seed===7){const r=bands[0][i];c.strokeStyle=p.grass;c.lineWidth=2;c.beginPath();c.moveTo(r[0]-3,r[1]+1);c.lineTo(r[0]-4,r[1]-3);c.moveTo(r[0]+1,r[1]+1);c.lineTo(r[0]+3,r[1]-4);c.stroke();}
   }
  }
  distance+=len;
 }
 c.restore();
}
export function drawShoreRock(c,x,y,rw,rh,dark,mid,light){
 const pts=[[x-rw,y],[x-rw*.6,y-rh],[x+rw*.4,y-rh],[x+rw,y-rh*.2],[x+rw*.7,y+rh*.6],[x-rw*.5,y+rh*.7]];
 polygon(c,pts.map(([x,y])=>[x+2,y+3]),'#17282055');polygon(c,pts,dark);
 polygon(c,[[x-rw+2,y-1],[x-rw*.5,y-rh+2],[x+rw*.4,y-rh+2],[x+rw-2,y],[x,y+rh*.3]],mid);
 c.strokeStyle=light;c.lineWidth=2;c.beginPath();c.moveTo(snap(x-rw*.5),snap(y-rh+2));c.lineTo(snap(x+rw*.3),snap(y-rh+2));c.stroke();
}
