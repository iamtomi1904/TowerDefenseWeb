const snap=n=>Math.round(n/2)*2;
function contour(c,z,scale){c.beginPath();for(let i=0;i<=64;i++){const a=i/64*Math.PI*2,r=radius(z,a),x=snap(z.x+Math.cos(a)*z.rx*r*scale),y=snap(z.y+Math.sin(a)*z.ry*r*scale);if(!i)c.moveTo(x,y);else c.lineTo(x,y);}c.closePath();}
function radius(z,a){const seed=(Math.round(z.x)*73+Math.round(z.y)*139)|0,p1=(seed%100)/15,p2=((seed>>4)%100)/13;return 1+Math.sin(a*3+p1)*.055+Math.cos(a*5+p2)*.035+Math.sin(a*7-p1)*.02;}
const noise=(x,y)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
export function drawBiomeTransition(c,z,material,color){
 const band=Math.min(.26,Math.max(.09,36/Math.min(z.rx,z.ry))),inner=1-band,outer=1+band*.6;
 const coat=()=>{c.fillStyle=color;c.globalAlpha=.5;c.fill();if(material){c.fillStyle=material;c.globalAlpha=.22;c.fill();c.fill();c.fill();}};
 c.save();contour(c,z,inner);coat();
 // World-aligned dithered edge tiles mix with whatever biome has already been drawn.
 const cell=4,minX=Math.floor((z.x-z.rx*1.2)/cell)*cell,minY=Math.floor((z.y-z.ry*1.2)/cell)*cell;
 for(let y=minY;y<z.y+z.ry*1.2;y+=cell)for(let x=minX;x<z.x+z.rx*1.2;x+=cell){
  const dx=(x+cell/2-z.x)/z.rx,dy=(y+cell/2-z.y)/z.ry,r=Math.hypot(dx,dy)/radius(z,Math.atan2(dy,dx));
  if(r<inner-.015||r>outer)continue;
  const coverage=Math.max(0,Math.min(1,(outer-r)/(outer-inner))),seed=noise(x+z.x,y+z.y);
  if(seed>coverage)continue;
  const alpha=.25+coverage*.65;
  c.fillStyle=color;c.globalAlpha=.5*alpha;c.fillRect(x,y,cell,cell);
  if(material){c.fillStyle=material;c.globalAlpha=.22*alpha;for(let k=0;k<3;k++)c.fillRect(x,y,cell,cell);}
 }
 c.restore();
}
