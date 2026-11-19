// Geometry effects keep transparent edges, without atlas clipping.
export function ribbon(g,x,y,r,start,sweep,width,color,alpha=1){const points=[],steps=18;for(let i=0;i<=steps;i++){const a=start+sweep*i/steps;points.push({x:x+Math.cos(a)*r,y:y+Math.sin(a)*r});}for(let i=steps;i>=0;i--){const a=start+sweep*i/steps,inner=r-width*Math.sin(Math.PI*i/steps);points.push({x:x+Math.cos(a)*inner,y:y+Math.sin(a)*inner});}g.fillStyle(color,alpha).fillPoints(points,true);}
export function cyclone(g,x,y,r,height,phase,alpha=1){
 // Pixel helix: narrow foot, broad cloud crown and alternating front/back ribbons.
 for(let band=0;band<7;band++){
  const k=band/6,rr=r*(.18+.82*k),cy=y-height*k,rotation=phase*1.7+band*.85;
  for(let i=0;i<42;i++){
   const a=rotation+i/42*Math.PI*2,front=Math.sin(a)>0,xx=x+Math.cos(a)*rr,yy=cy+Math.sin(a)*rr*.28;
   g.fillStyle(front?0xccefe2:0x4e8c85,alpha*(front?.85:.32)).fillRect(Math.round(xx/2)*2,Math.round(yy/2)*2,front?4:3,2);
   if(front&&i%3===0)g.fillStyle(0xf0fff1,alpha*.8).fillRect(Math.round(xx/2)*2,Math.round((yy-2)/2)*2,3,2);
  }
 }
 for(let i=0;i<12;i++){const k=(phase*.12+i/12)%1,a=phase*2+i*2.399,rr=r*(.3+k*.65);g.fillStyle(i%2?0xa3c3a1:0xe1f1cb,alpha*(1-k)).fillRect(Math.round(x+Math.cos(a)*rr),Math.round(y-height*k+Math.sin(a)*rr*.25),3,2);}
}
