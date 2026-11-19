// Pixel geometry follows simulation radii; all motion is deterministic across replays.
const TAU=Math.PI*2;
const clamp=v=>Math.max(0,Math.min(1,v));
export function warriorLeapHeight(leap){if(!leap)return 0;const t=clamp(1-leap.time/leap.duration);return t<.4?78*(1-(1-t/.4)**2):78*(1-((t-.4)/.6)**2);}
export function pixel(g,x,y,c,a=1,s=2){g.fillStyle(c,clamp(a)).fillRect(Math.round(x/s)*s,Math.round(y/s)*s,s,s);}
export function pixelLine(g,x,y,tx,ty,c,a=1,s=2){const n=Math.max(1,Math.ceil(Math.hypot(tx-x,ty-y)/s));for(let i=0;i<=n;i++)pixel(g,x+(tx-x)*i/n,y+(ty-y)*i/n,c,a,s);}
function ring(g,x,y,r,sy,c,a=1,phase=0,start=0,sweep=TAU,s=2){const n=Math.max(16,Math.ceil(r*sweep/3));for(let i=0;i<=n;i++){const t=start+i/n*sweep;pixel(g,x+Math.cos(t)*r,y+Math.sin(t)*r*sy+Math.sin(t*11+phase)*1.5,c,a,s);}}
function star(g,x,y,c,a=1,s=2){pixelLine(g,x-3*s,y,x+3*s,y,c,a,s);pixelLine(g,x,y-3*s,x,y+3*s,c,a,s);pixel(g,x-s,y-s,0xf5ffff,a,s);}
export function drawOceanRing(g,e,t){
 const r=e.radius*t,fade=clamp((1-t)*6),rise=Math.sin(Math.PI*t)*14;
 // A complete circular wall of water, with a dark moving body and white curling crest.
 for(let band=7;band>=0;band--){const d=Math.max(1,r-band*2),h=rise*Math.sin((band+1)/9*Math.PI);
  ring(g,e.x,e.y-h,d,1,[0x23617f,0x277e9a,0x379caf,0x50b9c2,0x8ddfdf,0xc4f5ee,0xf2fff5,0xffffff][band],fade*(band<2?.45:.8),t*14+band,0,TAU,3);
 }
 for(let i=0;i<64;i++){const a=i*TAU/64,d=r-3+Math.sin(i*2+t*19)*3,x=e.x+Math.cos(a)*d,y=e.y+Math.sin(a)*d-rise;
  if(i%3!==0)pixelLine(g,x,y,x-Math.cos(a)*7,y-Math.sin(a)*7+4,0xe1fff5,fade*.85,2);
  if(i%4===0){const jump=Math.sin(t*Math.PI)*(8+i%7);pixel(g,x+Math.cos(a)*5,y-jump,0xeaffff,fade,3);pixel(g,x-3,y-jump-5,0x9ce5ed,fade*.7,2);}
 }
}
export function drawSnowSquall(g,e,age,r,alpha=1){
 const grow=clamp(age*4),fade=alpha*grow,clock=Math.floor(age*24)/24;
 ring(g,e.x,e.y,r*grow,.72,0x8ac3d3,fade*.32);
 // Broken spirals leave the center readable, with no full-screen ice pillars.
 for(let band=0;band<5;band++){const h=12+band*17,phase=clock*(1.9+band*.16)+band*1.7;
  for(let arm=0;arm<3;arm++)for(let j=0;j<42;j++){const k=j/42,a=phase+arm*TAU/3+k*1.2,d=r*(.7+band*.035)*(1-k*.15),x=e.x+Math.cos(a)*d,y=e.y+Math.sin(a)*d*.65-h;
   pixel(g,x,y,j%6<2?0xe9ffff:0x9bcbdc,fade*(.13+Math.sin(k*Math.PI)*.38),j%5===0?3:2);
   if(j%7===0)pixelLine(g,x,y,x-7,y+2,0xd5f8ff,fade*.35,2);
  }
 }
 for(let i=0;i<105;i++){const f=(clock*(.45+i%3*.04)+i*.618)%1,a=i*2.399-clock*.95,d=r*Math.sqrt(((i*37)%101)/101)*.92,x=e.x+Math.cos(a)*d+(1-f)*28,y=e.y+Math.sin(a)*d*.67-(1-f)*95;
  pixelLine(g,x-6,y-3,x,y,0xe8ffff,fade*(.3+i%4*.12),i%7===0?3:2);if(i%19===0)star(g,x,y,0xc9eeff,fade*.7,1);
 }
 for(let i=0;i<4;i++){const a=i*2.399+.6,x=e.x+Math.cos(a)*r*.68,y=e.y+Math.sin(a)*r*.5;
  pixelLine(g,x-5,y,x,y-13,0x4b8fab,fade*.7,3);pixelLine(g,x,y-13,x+4,y,0xc3ecfa,fade*.8,2);
 }
}
export function drawFireRegion(g,e,age,r,alpha=1){
 const fade=alpha*clamp(age*6),clock=Math.floor(age*12)/12;
 // Charred ground and low flames: one sustained field, never stacked explosions.
 for(let i=0;i<82;i++){const a=i*2.399,d=r*Math.sqrt((i+.5)/82)*.94,x=e.x+Math.cos(a)*d,y=e.y+Math.sin(a)*d;
  pixel(g,x,y,i%3?0x663627:0xb2532c,fade*(.08+i%3*.04),5);
  if(i%3===0){const h=5+((i+Math.floor(clock*8))%5)*2,sway=Math.sin(clock*7+i)*3;
   pixelLine(g,x-2,y,x+sway,y-h,0xc95829,fade*.65,4);pixelLine(g,x,y,x+sway,y-h+3,0xf59b3c,fade*.8,2);pixel(g,x+sway,y-h+4,0xffd579,fade*.85,2);
  }
  if(i%9===0){const lift=(age*15+i*3)%30;pixel(g,x+Math.sin(clock+i)*4,y-lift,0xe99a54,fade*(1-lift/30)*.7,2);}
 }
 for(let i=0;i<20;i++){const a=i*TAU/20;pixelLine(g,e.x+Math.cos(a)*r*.94,e.y+Math.sin(a)*r*.94,e.x+Math.cos(a+.05)*r*.94,e.y+Math.sin(a+.05)*r*.94,0xc37442,fade*.4,2);}
}
function bolt(g,x,y,tx,ty,phase,alpha=1,width=3){
 let bx=x,by=y;for(let j=1;j<=9;j++){const k=j/9,n=j===9?0:Math.sin(j*7.13+phase*3)*12,nx=x+(tx-x)*k+n,ny=y+(ty-y)*k;
  pixelLine(g,bx,by,nx,ny,0x4e4998,alpha*.35,width+4);pixelLine(g,bx,by,nx,ny,0x85b9f1,alpha*.85,width);pixelLine(g,bx,by,nx,ny,0xf4ffff,alpha,1);
  if(j===3||j===6){const side=j===3?-1:1;pixelLine(g,nx,ny,nx+side*22,ny+10,0xb7baff,alpha*.65,2);pixelLine(g,nx+side*22,ny+10,nx+side*29,ny+24,0xd7f6ff,alpha*.6,1);}
  bx=nx;by=ny;
 }
}
export function drawStormStrike(g,e,age,r,alpha=1){
 const tempest=e.skill==='tempest',phase=Math.floor(age*18),fade=alpha*clamp(age*12),n=tempest?4:1;
 if(tempest){ring(g,e.x,e.y,r,.78,0x686ac0,fade*.3,phase);for(let i=0;i<22;i++){const a=i*TAU/22+age*.2;pixel(g,e.x+Math.cos(a)*r*.92,e.y+Math.sin(a)*r*.72,0xbbdfff,fade*.6,2);}}
 for(let i=0;i<n;i++){const cycle=(age*2.8+i*.26)%1,a=i*2.399+Math.floor(age*1.7)*1.1,d=tempest?r*(.28+(i%3)*.23):0,x=e.x+Math.cos(a)*d,y=e.y+Math.sin(a)*d*.78,flash=cycle<.55?1:clamp((1-cycle)/.45)*.35;
  bolt(g,x-10,y-135,x,y,phase+i,fade*flash,tempest?3:4);
  ring(g,x,y,10+cycle*30,.52,0xa7ceff,fade*(1-cycle)*.65,phase);
  for(let j=0;j<6;j++){const b=j*TAU/6+phase*.3,dd=8+cycle*30;pixelLine(g,x+Math.cos(b)*8,y+Math.sin(b)*4,x+Math.cos(b)*dd,y+Math.sin(b)*dd*.55,0xd8efff,fade*(1-cycle),2);}
 }
}
export function drawChainArc(g,e,t){bolt(g,e.x,e.y,e.tx,e.ty,Math.floor(t*18),1-t,3);star(g,e.tx,e.ty,0xe8ffff,1-t,2);}
export function drawGroundSlam(g,e,t,r){
 const fade=clamp((1-t)*3),impact=clamp(t*7),x=e.x,y=e.y;
 // A tight landing flash precedes the outward pressure ring and ballistic debris.
 for(let j=0;j<3;j++)ring(g,x,y,r*clamp(t*(2.9-j*.45)),.7,j===0?0xfff1ce:0xbca281,fade*(.85-j*.2),j,0,TAU,j===0?4:2);
 ring(g,x,y,24+impact*13,.58,0x302c2a,fade*.95,0,0,TAU,5);
 for(let i=0;i<13;i++){const a=i*2.399,start=20,end=r*(.55+(i%4)*.1)*impact;let bx=x+Math.cos(a)*start,by=y+Math.sin(a)*start*.7;
  for(let j=1;j<=5;j++){const d=start+(end-start)*j/5,xx=x+Math.cos(a)*d+Math.sin(i*7+j)*6,yy=y+Math.sin(a)*d*.7;
   pixelLine(g,bx,by,xx,yy,0x352d2a,fade,4);pixelLine(g,bx,by+3,xx,yy+3,0xc1a57c,fade*.6,2);bx=xx;by=yy;}
  const d=r*(.18+t*.7),h=Math.sin(Math.PI*clamp(t*1.3))*(20+i%5*8),xx=x+Math.cos(a)*d,yy=y+Math.sin(a)*d*.7-h;
  pixelLine(g,xx-4,yy+3,xx+4,yy+3,0x55463a,fade,5);pixelLine(g,xx-3,yy,xx+2,yy-2,0xb89b74,fade,3);
  for(let j=0;j<3;j++)pixel(g,xx+Math.sin(i+j)*10,yy+8+j*4,0xc8b394,fade*.4,3);
 }
 if(t<.22)for(let i=0;i<12;i++){const a=i*TAU/12,d=12+t*220;pixelLine(g,x+Math.cos(a)*9,y+Math.sin(a)*6,x+Math.cos(a)*d,y+Math.sin(a)*d*.7,0xfff3d5,(1-t/.22)*.9,3);}
}
export function drawWindDashPixels(g,e,t,r){
 const a=e.angle||0,x=e.x,y=e.y,fade=clamp((1-t)*4);
 for(let arm=0;arm<3;arm++)for(let j=0;j<42;j++){const k=j/42,b=a+arm*TAU/3+t*TAU*1.5+k*2,d=r*(.25+k*.7);pixel(g,x+Math.cos(b)*d,y-16+Math.sin(b)*d*.72,j%3?0x9bdacb:0xf2fff2,fade*Math.sin(k*Math.PI)*.8,3);}
 for(let i=0;i<18;i++){const along=-15-i%6*9,side=(i%2?1:-1)*(8+i%5*6),xx=x+Math.cos(a)*along-Math.sin(a)*side,yy=y-15+Math.sin(a)*along+Math.cos(a)*side;
  pixelLine(g,xx,yy,xx-Math.cos(a)*(18+i%4*5),yy-Math.sin(a)*(18+i%4*5),0xd1eee0,fade*.5,2);
  if(i%3===0){pixelLine(g,xx,yy,xx+4,yy-3,0x75ae88,fade*.8,3);pixel(g,xx+3,yy-1,0xc5e6a3,fade,2);}
 }
}
export function drawSpearCone(g,e,t,r){
 const a=e.angle||0,x=e.x,y=e.y,fade=clamp((1-t)*4),reach=r*(.2+.8*Math.sin(Math.PI*t)),spread=.37;
 for(let lane=-3;lane<=3;lane++){const b=a+lane*spread/3,len=reach*(1-Math.abs(lane)*.05),dx=Math.cos(b),dy=Math.sin(b);
  pixelLine(g,x+dx*15,y+dy*15,x+dx*len,y+dy*len,lane===0?0xffedb1:0xc6a371,fade*(lane===0?1:.45),lane===0?4:2);
  pixelLine(g,x+dx*len,y+dy*len,x+dx*(len-14)-dy*4,y+dy*(len-14)+dx*4,0xfff7df,fade,2);
  pixelLine(g,x+dx*len,y+dy*len,x+dx*(len-14)+dy*4,y+dy*(len-14)-dx*4,0xe5c38a,fade,2);
 }
 ring(g,x,y,reach,1,0xf5d899,fade*.5,0,a-spread,spread*2,2);
}
export function drawGiantAura(s,u,obj,time){
 if(u.classId!=='vanguard'||u.hp<=0||!(u.vanguardTime>0))return;
 const x=obj.sprite.x,y=obj.groundY??u.y,h=obj.size||96,clock=time/1000,g=s.unitGlow;
 for(let band=0;band<2;band++)ring(s.unitGround,x,y,35+band*9,.45,band?0xdaa258:0xffda91,.55,clock*4,clock*(band?-.4:.5),TAU,2);
 for(let i=0;i<28;i++){const f=(clock*.45+i*.618)%1,a=i*2.399+clock*.5,w=22+Math.sin(f*Math.PI)*7;pixel(g,x+Math.cos(a)*w,y-f*h, i%4===0?0xffefc1:0xd59a55,(1-f)*.65,i%3===0?3:2);}
 for(let side of [-1,1])for(let i=0;i<12;i++){const f=i/12;pixel(g,x+side*(19+Math.sin(f*5+clock*3)*3),y-h*f,0xf7c975,.18+Math.sin(clock*4+f*7)*.07,3);}
}
export function drawMageOrbit(s,u,obj,time){
 if(u.hp<=0||!['pyromancer','tidecaller','stormcaller'].includes(u.classId))return;
 const tier=Math.min(3,Math.floor(Math.max(0,(u.level||1)-1)/5)),count=3+tier*2,clock=time/1000,x=obj.sprite.x,y=obj.sprite.y,h=obj.size||57;
 for(let i=0;i<count;i++){const a=clock*(.65+tier*.08)+i*TAU/count,d=23+tier*3,xx=x+Math.cos(a)*d,yy=y-h*.48+Math.sin(a)*h*.2,g=Math.sin(a)<0?s.unitGround:s.unitGlow;
  const color=u.classId==='pyromancer'?0xffbd62:u.classId==='tidecaller'?0xa6f3ef:0xc0ceff;
  for(let j=3;j>=0;j--){const b=a-j*.09;pixel(g,x+Math.cos(b)*d,y-h*.48+Math.sin(b)*h*.2,color,(1-j/4)*.55,2);}
  if(u.classId==='pyromancer'){pixelLine(g,xx-2,yy+2,xx+Math.sin(clock*8+i)*2,yy-6,0xe97435,.85,3);pixel(g,xx,yy-2,0xffeb9f,1,2);}
  else if(u.classId==='tidecaller'){pixelLine(g,xx,yy-5,xx-3,yy+2,0x429ea9,.85,2);pixelLine(g,xx-3,yy+2,xx+2,yy+3,color,.9,2);pixel(g,xx,yy-1,0xeeffff,1,2);}
  else{pixelLine(g,xx+2,yy-6,xx-2,yy,color,.95,2);pixelLine(g,xx-2,yy,xx+2,yy,0xffffff,.9,2);pixelLine(g,xx+2,yy,xx-1,yy+6,color,.95,2);}
  if(tier>=2&&i%2===0)star(g,xx+6,yy-4,color,.45,1);
 }
}
export function drawChannelPixels(g,e,t){
 const color=e.skill==='meteor'?0xffc77e:e.skill==='tempest'?0xc5d9ff:0xd9c4ff;
 ring(g,e.x,e.y,24+8*t,.45,color,.5+t*.3,t*5);
 for(let i=0;i<14;i++){const a=i*2.399+t*2,d=35*(1-t*.7);pixel(g,e.x+Math.cos(a)*d,e.y-35+Math.sin(a)*d*.6-t*12,color,.5+t*.4,2);}
}
