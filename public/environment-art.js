import {BIOMES} from './world-biomes.js';

function mulberry32(seed){
 let a=seed|0;
 return ()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
}

function traceOrganicContour(c,z,scale=1,steps=48){
 const seed=(Math.round(z.x)*73+Math.round(z.y)*139)|0;
 const p1=(seed%100)/15,p2=((seed>>4)%100)/13;
 c.beginPath();
 for(let i=0;i<=steps;i++){
  const a=i/steps*Math.PI*2;
  const wobble=1+Math.sin(a*3+p1)*.055+Math.cos(a*5+p2)*.035+Math.sin(a*7-p1)*.02;
  const x=z.x+Math.cos(a)*z.rx*scale*wble(wobble);
  const y=z.y+Math.sin(a)*z.ry*scale*wble(wobble);
  if(i===0)c.moveTo(x,y);else c.lineTo(x,y);
 }
 c.closePath();
}
function wble(v){return v;}

function drawPixelRock(c,x,y,rw,rh,outline,dark,mid,light){
 const rx=Math.round(x/2)*2,ry=Math.round(y/2)*2,w=Math.max(4,Math.round(rw/2)*2),h=Math.max(4,Math.round(rh/2)*2);
 c.fillStyle='rgba(16,24,16,0.28)';c.fillRect(rx-w,ry+2,w*2+2,Math.max(4,h));
 c.fillStyle=outline;c.fillRect(rx-w-2,ry-h,w*2+4,h*2);c.fillRect(rx-w,ry-h-2,w*2,h*2+4);
 c.fillStyle=dark;c.fillRect(rx-w,ry-h,w*2,h*2);
 c.fillStyle=mid;c.fillRect(rx-w+2,ry-h+2,Math.max(2,w*2-4),Math.max(2,h*2-6));
 c.fillStyle=light;c.fillRect(rx-w+2,ry-h+2,Math.max(2,w),Math.max(2,Math.floor(h/2)*2));
}

function drawGrassCarpet(c,x,y,r,bgCol,bladeDark,bladeLight,rand){
 const rx=Math.round(x/2)*2,ry=Math.round(y/2)*2,w=Math.max(8,Math.round(r/2)*2),h=Math.max(6,Math.round(r*.65/2)*2);
 c.fillStyle=bgCol;c.fillRect(rx-w,ry-h+2,w*2,h*2-4);c.fillRect(rx-w+4,ry-h,w*2-8,h*2);
 for(let i=0;i<8;i++){
  const gx=Math.round((x+(rand()-.5)*r*1.3)/2)*2,gy=Math.round((y+(rand()-.5)*r*.85)/2)*2;
  c.fillStyle=bladeDark;c.fillRect(gx-2,gy-4,2,4);c.fillRect(gx+2,gy-2,2,2);
  c.fillStyle=bladeLight;c.fillRect(gx,gy-6,2,4);
 }
}

function drawFlowerCarpet(c,x,y,r,petalColors,rand){
 c.fillStyle='#34632f66';c.beginPath();c.ellipse(x,y,r,r*.68,0,0,Math.PI*2);c.fill();
 for(let i=0;i<7;i++){
  const fx=x+(rand()-.5)*r*1.35,fy=y+(rand()-.5)*r*.85;
  c.fillStyle='#244722';c.fillRect(fx,fy+1,2,3);
  c.fillStyle=petalColors[i%petalColors.length];
  c.fillRect(fx-2,fy-1,5,3);c.fillRect(fx-1,fy-2,3,5);
  c.fillStyle='#fff7bf';c.fillRect(fx,fy-1,2,2);
 }
}

function drawGravelCarpet(c,x,y,r,colors,rand){
 c.fillStyle=colors[0]+'66';c.beginPath();c.ellipse(x,y,r,r*.65,rand(),0,Math.PI*2);c.fill();
 for(let i=0;i<11;i++){
  const sx=x+(rand()-.5)*r*1.5,sy=y+(rand()-.5)*r*.95;
  c.fillStyle=colors[1+i%(colors.length-1)];
  c.fillRect(Math.round(sx),Math.round(sy),2+Math.round(rand()*3),2+Math.round(rand()*2));
 }
}

function drawMushroomCluster(c,x,y,capColor,rand){
 for(let i=0;i<3;i++){
  const mx=x+(i-1)*5,my=y+(i%2)*3;
  c.fillStyle='#1d241b';c.fillRect(mx-1,my,4,5);
  c.fillStyle='#e8dfc5';c.fillRect(mx,my+1,2,3);
  c.fillStyle=capColor;c.fillRect(mx-2,my-2,6,3);
  c.fillStyle='#fff6e0';c.fillRect(mx-1,my-2,2,1);
 }
}

function drawSmallSkull(c,x,y){
 c.fillStyle='#19111c77';c.beginPath();c.ellipse(x,y+3,7,3.5,0,0,Math.PI*2);c.fill();
 c.fillStyle='#2b2029';c.beginPath();c.ellipse(x,y-2,6,5,0,0,Math.PI*2);c.fill();
 c.fillStyle='#dfd6c3';c.beginPath();c.ellipse(x,y-2.5,5,4,0,0,Math.PI*2);c.fill();
 c.fillRect(x-3,y+1,6,3);
 c.fillStyle='#241926';c.fillRect(x-3,y-2,2,2);c.fillRect(x+1,y-2,2,2);
 c.fillStyle='#9c9184';c.fillRect(x-1,y+2,1,2);c.fillRect(x+1,y+2,1,2);
}

function drawSmallBone(c,x,y,angle){
 c.save();c.translate(x,y);c.rotate(angle);
 c.fillStyle='#1a121c66';c.fillRect(-6,0,12,3);
 c.fillStyle='#2b2029';c.fillRect(-6,-2.5,12,4.5);
 c.fillStyle='#ded5c3';c.fillRect(-5,-1.5,10,2.5);
 c.beginPath();c.arc(-5.5,-1.5,1.8,0,Math.PI*2);c.arc(-5.5,1,1.8,0,Math.PI*2);
 c.arc(5.5,-1.5,1.8,0,Math.PI*2);c.arc(5.5,1,1.8,0,Math.PI*2);c.fill();
 c.restore();
}

function drawIceCrystal(c,x,y,sz){
 c.fillStyle='#3c7da377';c.beginPath();c.ellipse(x,y+sz*.38,sz*1.1,sz*.45,0,0,Math.PI*2);c.fill();
 c.fillStyle='#2d658a';
 c.beginPath();c.moveTo(x-sz*.85,y+5);c.lineTo(x-sz*.22,y-sz*1.2);c.lineTo(x+sz*.58,y-sz*.65);c.lineTo(x+sz*.9,y+5);c.closePath();c.fill();
 c.fillStyle='#7ecae8';
 c.beginPath();c.moveTo(x-sz*.7,y+4);c.lineTo(x-sz*.2,y-sz*1.05);c.lineTo(x+sz*.48,y-sz*.55);c.lineTo(x+sz*.75,y+4);c.closePath();c.fill();
 c.fillStyle='#f0fcff';
 c.beginPath();c.moveTo(x-sz*.2,y-sz*1.05);c.lineTo(x+sz*.12,y+3);c.lineTo(x-sz*.55,y+3);c.closePath();c.fill();
}

function addBiomeGrain(c,z,cols,rand){
 const count=Math.floor((z.rx*z.ry)/520);
 for(let i=0;i<count;i++){
  const a=rand()*Math.PI*2,d=Math.sqrt(rand())*.95;
  const px=Math.round(z.x+Math.cos(a)*z.rx*d),py=Math.round(z.y+Math.sin(a)*z.ry*d);
  c.fillStyle=cols[i%cols.length];
  c.fillRect(px,py,2+(i%3)*2,2+(i%2));
 }
}

export function drawEnvironmentPatch(c,scene,z){
 const type=z.type,def=BIOMES[type];
 if(!def)return;
 const rand=mulberry32((Math.round(z.x)*197+Math.round(z.y)*313+type.length*97)|0);
 const color='#'+def.color.toString(16).padStart(6,'0');
 const rMax=Math.max(z.rx,z.ry);

 c.save();
 for(const [scale,alpha] of [[1.18,.12],[1.09,.24],[1.03,.34]]){
  traceOrganicContour(c,z,scale);
  c.fillStyle=color;
  c.globalAlpha=type==='dense'?alpha*.65:alpha;
  c.fill();
 }

 traceOrganicContour(c,z,1);
 c.save();
 c.clip();

 const grad=c.createRadialGradient(z.x-z.rx*.18,z.y-z.ry*.2,rMax*.08,z.x,z.y,rMax*1.05);
 if(type==='lava'){
  grad.addColorStop(0,'#541b11');grad.addColorStop(.55,'#361412');grad.addColorStop(1,'#291614');
 }else if(type==='fire'){
  grad.addColorStop(0,'#783418');grad.addColorStop(.65,'#52291a');grad.addColorStop(1,'#3d281c');
 }else if(type==='ice'){
  grad.addColorStop(0,'#f4fcff');grad.addColorStop(.55,'#c2ecfa');grad.addColorStop(1,'#7bbad4');
 }else if(type==='dead'){
  grad.addColorStop(0,'#493645');grad.addColorStop(.65,'#594554');grad.addColorStop(1,'#3d333c');
 }else if(type==='dense'){
  grad.addColorStop(0,'#1d4021');grad.addColorStop(.65,'#2b542e');grad.addColorStop(1,'#396336');
 }else if(type==='wind'){
  grad.addColorStop(0,'#b0ebd2');grad.addColorStop(.65,'#84cbb0');grad.addColorStop(1,'#61a886');
 }else if(type==='mountain'){
  grad.addColorStop(0,'#a6aba0');grad.addColorStop(.55,'#757b70');grad.addColorStop(1,'#474f45');
 }else if(type==='high'){
  grad.addColorStop(0,'#a8ba70');grad.addColorStop(.68,'#849654');grad.addColorStop(1,'#5e6e3e');
 }else{
  grad.addColorStop(0,'#2f3b29');grad.addColorStop(.6,'#404f36');grad.addColorStop(1,'#566648');
 }
 c.globalAlpha=type==='dense'?.82:.95;
 c.fillStyle=grad;
 c.fillRect(z.x-z.rx*1.2,z.y-z.ry*1.2,z.rx*2.4,z.ry*2.4);

 c.globalAlpha=1;
 const pt=()=>{const a=rand()*Math.PI*2,d=Math.sqrt(rand())*.85;return [z.x+Math.cos(a)*z.rx*d,z.y+Math.sin(a)*z.ry*d];};

 if(type==='dense'){
  addBiomeGrain(c,z,['#17301977','#3d6e3a66','#538c4955'],rand);
  for(let i=0;i<6;i++){const [px,py]=pt();c.fillStyle='#d8f29b14';c.beginPath();c.ellipse(px,py,24+rand()*26,15+rand()*16,rand(),0,Math.PI*2);c.fill();}
  for(let i=0;i<20;i++){const [px,py]=pt();drawGrassCarpet(c,px,py,16+rand()*18,'#1e422088','#4d823b','#7bb559',rand);}
  for(let i=0;i<12;i++){const [px,py]=pt();drawFlowerCarpet(c,px,py,13+rand()*9,['#ffe37a','#f5a2b8','#a8ebff','#ffffff'],rand);}
  for(let i=0;i<8;i++){const [px,py]=pt();drawMushroomCluster(c,px,py,i%2?'#d95843':'#e8b364',rand);}
  for(let i=0;i<7;i++){const [px,py]=pt();drawPixelRock(c,px,py,6+rand()*6,4+rand()*4,'#253324','#3f523d','#5c7356','#859c78');}
 }else if(type==='dead'){
  addBiomeGrain(c,z,['#2b1f2488','#69546166','#87777c55'],rand);
  c.fillStyle='#5c3b6e22';c.beginPath();c.ellipse(z.x,z.y,z.rx*.72,z.ry*.65,0,0,Math.PI*2);c.fill();
  for(let i=0;i<15;i++){const [px,py]=pt();drawGravelCarpet(c,px,py,15+rand()*15,['#3b2f35','#6e6064','#8f8182'],rand);}
  c.lineCap='round';
  for(let i=0;i<24;i++){
   let [px,py]=pt();c.beginPath();c.moveTo(px,py);
   for(let s=0;s<4;s++){px+=(rand()-.5)*40;py+=(rand()-.5)*28;c.lineTo(px,py);}
   c.strokeStyle='#1f1419dd';c.lineWidth=2.6;c.stroke();
   c.strokeStyle='#9b79ad33';c.lineWidth=1;c.stroke();
  }
  // Withered twisted roots
  for(let i=0;i<7;i++){
   const [rx,ry]=pt();c.strokeStyle='#2b2024';c.lineWidth=3.5;c.beginPath();c.moveTo(rx-12,ry+4);c.quadraticCurveTo(rx,ry-6,rx+14,ry+2);c.stroke();
   c.strokeStyle='#57454b';c.lineWidth=1.5;c.beginPath();c.moveTo(rx-12,ry+3);c.quadraticCurveTo(rx,ry-7,rx+14,ry+1);c.stroke();
  }
  for(let i=0;i<9;i++){const [px,py]=pt();drawPixelRock(c,px,py,5+rand()*6,4+rand()*4,'#261e22','#3f353b','#5d5157','#7a6e74');}
  for(let i=0;i<3;i++){const [sx,sy]=pt();drawSmallSkull(c,sx,sy);}
  for(let i=0;i<4;i++){const [bx,by]=pt();drawSmallBone(c,bx,by,rand()*Math.PI);}
 }else if(type==='mountain'){
  addBiomeGrain(c,z,['#3d433b88','#81877c66','#b2b8ac55'],rand);
  c.globalAlpha=.76;c.strokeStyle='#1c211d';c.lineWidth=24;
  c.beginPath();
  for(let i=0;i<=22;i++){const a=Math.PI*.06+i/22*Math.PI*.88,x=z.x+Math.cos(a)*z.rx*.96,y=z.y+Math.sin(a)*z.ry*.96;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}
  c.stroke();
  c.strokeStyle='#353b34';c.lineWidth=13;
  c.beginPath();
  for(let i=0;i<=20;i++){const a=Math.PI*.12+i/20*Math.PI*.76,x=z.x+Math.cos(a)*z.rx*.74,y=z.y+Math.sin(a)*z.ry*.74;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}
  c.stroke();
  c.strokeStyle='#d7ded188';c.lineWidth=6;
  c.beginPath();
  for(let i=0;i<=18;i++){const a=Math.PI*1.12+i/18*Math.PI*.76,x=z.x+Math.cos(a)*z.rx*.68,y=z.y+Math.sin(a)*z.ry*.68;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}
  c.stroke();c.globalAlpha=1;
  // Faceted 2.5D cliff peaks with sunlit & shadowed slopes (extra grand for edge mountain ridges)
  const peakCount=z.ridge?11:5;
  for(let i=0;i<peakCount;i++){
   const frac=(i/(peakCount-1||1)-.5)*1.45,px=z.x+(z.rx>=z.ry?frac*z.rx:(rand()-.5)*z.rx*.6),py=z.y+(z.ry>z.rx?frac*z.ry:(i%2?-1:1)*(z.ry*.2)),pw=(z.ridge?40:26)+rand()*20,ph=(z.ridge?46:28)+rand()*22;
   c.fillStyle='#141a1577';c.beginPath();c.ellipse(px+5,py+7,pw,ph*.36,0,0,Math.PI*2);c.fill();
   c.fillStyle='#8d9488';c.beginPath();c.moveTo(px-pw,py+5);c.lineTo(px,py-ph);c.lineTo(px+2,py+7);c.closePath();c.fill();
   c.fillStyle='#464d44';c.beginPath();c.moveTo(px,py-ph);c.lineTo(px+pw,py+5);c.lineTo(px+2,py+7);c.closePath();c.fill();
   c.fillStyle=z.ridge?'#eef6f0':'#dfe6d899';c.beginPath();c.moveTo(px-pw*.36,py-ph*.45);c.lineTo(px,py-ph);c.lineTo(px+pw*.28,py-ph*.54);c.lineTo(px+pw*.06,py-ph*.38);c.lineTo(px-pw*.12,py-ph*.42);c.closePath();c.fill();
  }
  for(let i=0;i<15;i++){const [px,py]=pt();drawGravelCarpet(c,px,py,15+rand()*14,['#545950','#7d8379','#9ca196'],rand);}
  for(let i=0;i<14;i++){const [px,py]=pt();drawPixelRock(c,px,py,12+rand()*12,8+rand()*7,'#232823','#434942','#70766c','#b0b6aa');}
  for(let i=0;i<22;i++){const [px,py]=pt();drawPixelRock(c,px,py,4+rand()*5,3+rand()*4,'#2b302b','#4a5049','#797f75','#b5bbb0');}
  for(let i=0;i<6;i++){const [px,py]=pt();drawGrassCarpet(c,px,py,8+rand()*6,'#4d663a55','#587542','#82a35d',rand);}
 }else if(type==='high'){
  addBiomeGrain(c,z,['#60724066','#9eb06b66','#c5d98955'],rand);
  c.globalAlpha=.76;c.strokeStyle='#3d3324';c.lineWidth=18;
  c.beginPath();
  for(let i=0;i<=20;i++){const a=Math.PI*.08+i/20*Math.PI*.84,x=z.x+Math.cos(a)*z.rx*.96,y=z.y+Math.sin(a)*z.ry*.96;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}
  c.stroke();
  // Stepped stone/earth terrace teeth along lower plateau rim
  for(let i=0;i<11;i++){
   const a=Math.PI*.14+i/10*Math.PI*.72,tx=z.x+Math.cos(a)*z.rx*.92,ty=z.y+Math.sin(a)*z.ry*.92;
   c.fillStyle='#5c4f3a';c.fillRect(tx-7,ty-4,14,10);
   c.fillStyle='#7d6d52';c.fillRect(tx-5,ty-4,10,5);
  }
  c.strokeStyle='#e8f5ab88';c.lineWidth=5;
  c.beginPath();
  for(let i=0;i<=18;i++){const a=Math.PI*1.12+i/18*Math.PI*.76,x=z.x+Math.cos(a)*z.rx*.9,y=z.y+Math.sin(a)*z.ry*.9;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}
  c.stroke();c.globalAlpha=1;
  for(let i=0;i<15;i++){const [px,py]=pt();drawGrassCarpet(c,px,py,14+rand()*12,'#7c915077','#6e8544','#b2c77b',rand);}
  for(let i=0;i<7;i++){const [px,py]=pt();drawFlowerCarpet(c,px,py,10+rand()*7,['#fff6a6','#ffffff','#ffd185'],rand);}
  for(let i=0;i<10;i++){const [px,py]=pt();drawPixelRock(c,px,py,6+rand()*6,4+rand()*4,'#3c4032','#575c48','#7d826b','#a6ab92');}
 }else if(type==='low'){
  addBiomeGrain(c,z,['#222e1e77','#4f614566','#3a4a3366'],rand);
  for(const [inset,width,col] of [[.97,22,'#141e16'],[.87,13,'#213023bb'],[.76,8,'#2c3f2f88']]){
   c.strokeStyle=col;c.lineWidth=width;
   c.beginPath();
   for(let i=0;i<=22;i++){const a=Math.PI*1.04+i/22*Math.PI*.92,x=z.x+Math.cos(a)*z.rx*inset,y=z.y+Math.sin(a)*z.ry*inset;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}
   c.stroke();
  }
  c.fillStyle='#244b48aa';c.beginPath();c.ellipse(z.x,z.y+10,z.rx*.46,z.ry*.4,0,0,Math.PI*2);c.fill();
  c.strokeStyle='#88c9bd77';c.lineWidth=2.5;c.stroke();
  c.fillStyle='#bef5ea55';c.fillRect(z.x-16,z.y+5,18,2);c.fillRect(z.x+6,z.y+14,14,2);
  for(let i=0;i<5;i++){
   const lx=z.x+(i-2)*20,ly=z.y+8+(i%2)*8;
   c.fillStyle='#3d7d47cc';c.beginPath();c.arc(lx,ly,5,0.3,Math.PI*1.9);c.lineTo(lx,ly);c.closePath();c.fill();
   if(i%2===0){c.fillStyle='#ffd4e2';c.fillRect(lx-1,ly-2,2,2);}
  }
  // Cattail reeds around the sunken pool
  for(let i=0;i<6;i++){
   const a=i/6*Math.PI*2,rx=z.x+Math.cos(a)*z.rx*.5,ry=z.y+10+Math.sin(a)*z.ry*.43;
   c.fillStyle='#345e31';c.fillRect(rx-2,ry-9,2,10);c.fillRect(rx+1,ry-7,2,8);
   c.fillStyle='#6e4729';c.fillRect(rx-2,ry-12,2,4);
  }
  for(let i=0;i<11;i++){const [px,py]=pt();drawGrassCarpet(c,px,py,12+rand()*10,'#32453077','#3f5c3a','#648758',rand);}
  for(let i=0;i<8;i++){const [px,py]=pt();drawGravelCarpet(c,px,py,11+rand()*10,['#3b4638','#64705e','#828f7c'],rand);}
 }else if(type==='ice'){
  addBiomeGrain(c,z,['#6baac966','#d9f5ff88','#ffffffaa'],rand);
  for(let i=0;i<18;i++){
   const [px,py]=pt(),rw=20+rand()*28,rh=13+rand()*18;
   c.fillStyle='#ffffffcc';c.beginPath();c.ellipse(px,py,rw,rh,rand(),0,Math.PI*2);c.fill();
   c.fillStyle='#c4ecfa88';c.beginPath();c.ellipse(px+2,py+3,rw*.88,rh*.82,0,0,Math.PI*2);c.fill();
  }
  // Layered glacial shelf step
  c.strokeStyle='#5a9ec266';c.lineWidth=7;c.beginPath();
  for(let i=0;i<=16;i++){const a=Math.PI*.15+i/16*Math.PI*.7,x=z.x+Math.cos(a)*z.rx*.72,y=z.y+Math.sin(a)*z.ry*.72;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}
  c.stroke();
  c.strokeStyle='#ffffff77';c.lineWidth=6;
  for(let i=0;i<6;i++){const [px,py]=pt();c.beginPath();c.moveTo(px-18,py+10);c.lineTo(px+18,py-10);c.stroke();}
  for(let i=0;i<16;i++){const [px,py]=pt();drawIceCrystal(c,px,py,8+rand()*10);}
  c.lineCap='round';
  for(let i=0;i<14;i++){
   let [px,py]=pt();c.beginPath();c.moveTo(px,py);
   for(let s=0;s<3;s++){px+=(rand()-.5)*46;py+=(rand()-.5)*32;c.lineTo(px,py);}
   c.strokeStyle='#3d7b9c88';c.lineWidth=2.5;c.stroke();
   c.strokeStyle='#ffffffdd';c.lineWidth=1;c.stroke();
  }
 }else if(type==='lava'||type==='fire'){
  addBiomeGrain(c,z,['#210f0c88','#5c231877','#8c351e66'],rand);
  for(let i=0;i<4;i++){
   const [px,py]=pt(),rw=20+rand()*22,rh=12+rand()*14;
   c.fillStyle='#1f100e';c.beginPath();c.ellipse(px,py,rw+4,rh+3,0,0,Math.PI*2);c.fill();
   c.fillStyle='#e84b14';c.beginPath();c.ellipse(px,py,rw,rh,0,0,Math.PI*2);c.fill();
   c.fillStyle='#ffae36';c.beginPath();c.ellipse(px-2,py-1,rw*.62,rh*.58,0,0,Math.PI*2);c.fill();
   c.fillStyle='#fff29c';c.beginPath();c.ellipse(px-3,py-2,rw*.25,rh*.22,0,0,Math.PI*2);c.fill();
  }
  // Miệng núi lửa trung tâm (volcanic crater)
  c.fillStyle='#241310';c.beginPath();c.ellipse(z.x,z.y+2,34,21,0,0,Math.PI*2);c.fill();
  c.fillStyle='#4a231b';c.beginPath();c.ellipse(z.x,z.y-2,28,16,0,0,Math.PI*2);c.fill();
  c.fillStyle='#e84412';c.beginPath();c.ellipse(z.x,z.y-2,17,10,0,0,Math.PI*2);c.fill();
  c.fillStyle='#ffcf54';c.beginPath();c.ellipse(z.x,z.y-2,9,5,0,0,Math.PI*2);c.fill();
  for(let i=0;i<12;i++){const [px,py]=pt();drawGravelCarpet(c,px,py,14+rand()*14,['#2a1816','#612a21','#8c3a2b'],rand);}
  c.lineCap='round';
  for(let i=0;i<18;i++){
   let [px,py]=pt();c.beginPath();c.moveTo(px,py);
   for(let s=0;s<4;s++){px+=(rand()-.5)*46;py+=(rand()-.5)*34;c.lineTo(px,py);}
   c.strokeStyle='#e8461288';c.lineWidth=8;c.stroke();
   c.strokeStyle='#ff8c24cc';c.lineWidth=4;c.stroke();
   c.strokeStyle=type==='lava'?'#ffe885':'#ffb452';c.lineWidth=1.8;c.stroke();
  }
  for(let i=0;i<11;i++){const [px,py]=pt();drawPixelRock(c,px,py,8+rand()*9,5+rand()*6,'#260c0a','#4a1411','#8f251b','#e0592b');}
  for(let i=0;i<14;i++){const [px,py]=pt();drawPixelRock(c,px,py,3+rand()*5,2.5+rand()*3,'#2e100d','#571a14','#a33122','#f0733c');}
 }else if(type==='wind'){
  addBiomeGrain(c,z,['#50967a66','#a8e8cc66','#d6fff055'],rand);
  for(let i=0;i<16;i++){const [px,py]=pt();drawGrassCarpet(c,px,py,14+rand()*12,'#6ab39777','#55997d','#bdf5db',rand);}
  for(let i=0;i<10;i++){const [px,py]=pt();drawFlowerCarpet(c,px,py,11+rand()*8,['#ffffff','#fff3a1','#b8ffe8'],rand);}
  for(let i=0;i<22;i++){
   const [px,py]=pt();
   c.strokeStyle='#e6fff488';c.lineWidth=2.2;
   c.beginPath();c.moveTo(px-20,py+4);c.quadraticCurveTo(px,py-6,px+24,py+2);c.stroke();
  }
 }

 c.restore();
 traceOrganicContour(c,z,1);
 c.globalAlpha=.34;
 c.strokeStyle=type==='ice'?'#e8fbff':type==='lava'?'#ff8d47':type==='mountain'?'#2c332d':'#1a291d';
 c.lineWidth=3.2;
 c.stroke();
 c.restore();
}

export function updateEnvironmentFX(scene,time){
 const g=scene.weather,cam=scene.cameras.main.worldView;
 if(!g||!cam)return;
 for(const z of scene.environment||[]){
  if(z.x<cam.x-z.rx-80||z.x>cam.right+z.rx+80||z.y<cam.y-z.ry-80||z.y>cam.bottom+z.ry+80)continue;
  if(z.type==='ice'){
   // Bão tuyết (Blizzard): gió tuyết thổi xiên mạnh + vòng xoáy sương băng
   for(let i=0;i<26;i++){
    const phase=i*2.399,t=(time/1400+i/26)%1;
    const x=z.x+Math.cos(phase)*z.rx*.85-t*45+Math.sin(time/350+i)*10;
    const y=z.y+Math.sin(phase)*z.ry*.75-52+t*104;
    const alpha=Math.sin(t*Math.PI)*.9;
    g.fillStyle(0xf2fcff,alpha).fillCircle(x,y,2+(i%2));
    if(i%2===0)g.lineStyle(1.4,0xdff7ff,alpha*.65).lineBetween(x,y,x+14,y-7);
    if(i%5===0)g.lineStyle(1,0xffffff,alpha*.85).lineBetween(x-3,y,x+3,y).lineBetween(x,y-3,x,y+3);
   }
  }else if(z.type==='lava'||z.type==='fire'){
   // Núi lửa phun trào (Volcanic Eruption)
   const pulse=.6+.4*Math.sin(time/180);
   g.fillStyle(0xff5e1a,.22*pulse).fillEllipse(z.x,z.y-2,44,26);
   for(let i=0;i<7;i++){
    const t=(time/1350+i/7)%1;
    const ang=(i*1.9)-2.2,vx=Math.cos(ang)*38,vy=-58;
    const bx=z.x+vx*t,by=z.y-4+vy*t+72*t*t;
    const a=Math.sin(t*Math.PI);
    g.fillStyle(0xff4d12,a*.85).fillCircle(bx,by,4.2-t*1.8);
    g.fillStyle(0xffe678,a*.95).fillCircle(bx,by,2.1-t*.8);
   }
   for(let i=0;i<11;i++){
    const phase=i*2.399,t=(time/1800+i/11)%1;
    const bx=z.x+Math.cos(phase)*z.rx*.72,by=z.y+Math.sin(phase)*z.ry*.72;
    const flicker=Math.sin(time/95+i*3)*3;
    const fh=13+Math.sin(time/120+i)*4;
    g.fillStyle(0xff5e1a,.72).fillTriangle(bx-5,by,bx+5,by,bx+flicker*.5,by-fh);
    g.fillStyle(0xffdf78,.88).fillTriangle(bx-2.5,by,bx+2.5,by,bx+flicker*.3,by-fh*.65);
    const sy=by-10-t*58,sx=bx+Math.sin(time/450+i)*9;
    g.fillStyle(0x2b2220,Math.sin(t*Math.PI)*.35).fillCircle(sx,sy,5+t*8);
    g.fillStyle(0xffaa55,(1-t)*.68).fillCircle(sx-2,sy+4,1.8);
   }
  }else if(z.type==='mountain'){
   // Lốc xoáy vùng đá (Swirling rocky tornado funnel)
   const rot=time/220,tx=z.x+Math.sin(time/1600)*z.rx*.32,ty=z.y+Math.cos(time/1900)*z.ry*.22;
   g.fillStyle(0x2a3029,.28).fillEllipse(tx,ty+3,34,16);
   for(let lv=0;lv<7;lv++){
    const k=lv/6,ry=ty-lv*11,rx=tx+Math.sin(time/260+lv*.7)*4*(1-k*.3),rw=8+k*22,rh=4+k*8,a=rot+lv*1.1;
    g.lineStyle(2.4-k*.6,lv%2?0xb8c4b4:0x7c8778,.58-k*.18).strokeEllipse(rx,ry,rw*2,rh*2);
    g.lineStyle(2,0xe3ede0,.55).beginPath().arc(rx,ry,rw,a,a+1.8).strokePath();
   }
   for(let i=0;i<7;i++){
    const t=(time/1100+i/7)%1,a=rot*1.4+i*1.1,rad=10+t*22,dx=tx+Math.cos(a)*rad,dy=ty-t*74+Math.sin(a)*rad*.35;
    g.fillStyle(i%2?0x9ba698:0x576154,Math.sin(t*Math.PI)*.85).fillRect(dx-2,dy-2,4,4);
   }
  }else if(z.type==='wind'){
   for(let i=0;i<9;i++){
    const phase=i*2.399,t=(time/2000+i/9)%1;
    const x=z.x+Math.cos(phase)*z.rx*.65+t*60,y=z.y+Math.sin(phase)*z.ry*.65;
    const a=Math.sin(t*Math.PI)*.42;
    g.lineStyle(2,0xdafcf0,a).beginPath().arc(x,y,16+t*10,-.8,.7).strokePath();
    g.fillStyle(0xb7ebb8,a*1.45).fillEllipse(x+12,y-4,4.5,2.2);
   }
  }else if(z.type==='dense'){
   // Đom đóm rừng
   for(let i=0;i<8;i++){
    const phase=i*2.399,t=(time/3000+i/8)%1;
    const x=z.x+Math.cos(phase)*z.rx*.75+Math.sin(time/1400+i)*14,y=z.y+Math.sin(phase)*z.ry*.7-t*22;
    g.fillStyle(i%2?0xdaf58c:0xf2f7a1,Math.sin(t*Math.PI)*.65).fillCircle(x,y,2.2);
   }
   // Bầy ruồi muỗi bay vo ve thành cụm
   for(let s=0;s<3;s++){
    const sx=z.x+Math.cos(s*2.1+z.x)*z.rx*.45,sy=z.y+Math.sin(s*2.7+z.y)*z.ry*.4;
    for(let k=0;k<6;k++){
     const gx=sx+Math.sin(time/110+k*1.7+s)*11+Math.cos(time/240+k)*6;
     const gy=sy+Math.cos(time/95+k*2.3+s)*7-4;
     g.fillStyle(0x1f261e,.72).fillCircle(gx,gy,1.1);
     g.fillStyle(0xd9e8d5,.45).fillRect(gx-1.5,gy-1.5,3,1);
    }
   }
  }else if(z.type==='dead'){
   for(let i=0;i<7;i++){
    const phase=i*2.399,t=(time/2800+i/7)%1;
    const x=z.x+Math.cos(phase)*z.rx*.7+Math.sin(time/900+i)*8,y=z.y+Math.sin(phase)*z.ry*.7-t*28;
    g.lineStyle(2,0xc09acb,Math.sin(t*Math.PI)*.36).beginPath().arc(x,y,7+t*8,-1.5,.5).strokePath();
    g.fillStyle(0xdcb8eb,Math.sin(t*Math.PI)*.4).fillCircle(x+4,y-4,1.8);
   }
  }
 }
}
