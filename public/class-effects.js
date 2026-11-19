import {drawSignatureSlash} from './slash-art.js';
import {drawOceanRing,drawSnowSquall,drawStormStrike,drawChainArc,drawGroundSlam} from './pixel-skill-art.js';
import {drawRallyBurst,drawTideFieldVFX,drawBulwarkBurst,drawBloodFuryBurst} from './aura-vfx.js';
export const CLASS_SKILLS = {
 fireburst:'fire',flamefield:'fire',meteor:'fire',frostnova:'ice',blizzard:'ice','healing-tide':'water',
 thunderstrike:'storm',tempest:'storm','chain-lightning':'storm',cleave:'axe',earthquake:'earth',fury:'axe',
 multishot:'arrow',venom:'poison','arrow-rain':'arrow','dash-cut':'blade',windstep:'blade',bladestorm:'blade',
 'shield-bash':'shield',bulwark:'shield',rally:'rally'
};
// Hand-drawn pixel stamps and stepped contours; no vector arcs or smooth triangles.
const PAL={fire:[0x502c36,0xa63c32,0xe66b35,0xffb64e,0xffedac],ice:[0x243e64,0x397491,0x60b0ca,0xb1e8e4,0xf0ffe9],water:[0x243e51,0x316879,0x53a99f,0xa0e0c6,0xe7ffdf],storm:[0x302d59,0x65528f,0x998fd1,0xc6d8ff,0xf4ffff],axe:[0x492c32,0x905045,0xd8835a,0xf2c487,0xffeed0],earth:[0x352d2b,0x68503e,0x9c7954,0xd0ab75,0xf0dbaa],arrow:[0x283c31,0x52694a,0x92ad70,0xcddd9a,0xf5edc4],poison:[0x303c30,0x586e39,0x8caf4e,0xc3dd76,0xf1f8b4],blade:[0x293e43,0x4b777a,0x83b5a7,0xc8e6cb,0xf2ffdf],shield:[0x35384a,0x666574,0xa99a70,0xe0c790,0xffecc0],rally:[0x354536,0x68744f,0xacb67b,0xdce8ad,0xffffdf]};
const STAMPS={
 spire:['....4....','....43...','...443...','...4432..','...4432..','..344322.','..344322.','..344322.','.23443221','.23443221','.23443221','.23443221','..234322.','..22322..','...222...'],
 snow:['..3..','3.4.3','.343.','34443','.343.','3.4.3','..3..'],
 meteor:['.....22222.....','...22333322....','..2334433322...','.233443223322..','12334321223321.','123332112233321','123321123333321','.12321233443321','.1221233433321.','..12233333221..','...122332221...','.....12221.....'],
 flame:['.....2...','....232..','..2.343..','..32343..','.2334432.','123444321','123444321','.1234321.','..12221..'],
 crystal:['....4....','...434...','...4342..','..34432..','..344321.','.2344321.','.2344321.','..23421..','...221...'],
 shield:['.4444444.','432222234','432343234','432343234','433444334','.3234323.','.3323233.','..33233..','...343...','....3....'],
 rune:['..4..','..4..','44444','..4..','..4..'],
 rock:['..2332...','.234432..','23443321.','233332211','123222211','.1222111.'],
 spark:['...4...','...4...','..343..','4434344','..343..','...4...','...4...'],
 arrow:['.....4','....43','...431','..43..','.43...','43....','32....'],
 leaf:['....3.','..343.','.3442.','2342..','232...','.1....']
};
const TAU=Math.PI*2;
function px(g,x,y,c,a=1,size=3){g.fillStyle(c,a).fillRect(Math.round(x/size)*size,Math.round(y/size)*size,size,size);}
function stamp(g,name,x,y,pal,a=1,scale=2,flip=false){const rows=STAMPS[name];for(let j=0;j<rows.length;j++)for(let i=0;i<rows[j].length;i++){const v=Number(rows[j][i]);if(v)px(g,x+(flip?-i:i)*scale,y+j*scale,pal[v],a,scale);}}
function line(g,x,y,tx,ty,pal,a=1,size=3){const n=Math.max(1,Math.ceil(Math.hypot(tx-x,ty-y)/size));for(let i=0;i<=n;i++)px(g,x+(tx-x)*i/n,y+(ty-y)*i/n,pal,a,size);}
function contour(g,x,y,r,sy,pal,a,phase=0,start=0,sweep=TAU,width=2){
 for(let i=0;i<Math.max(10,r*1.5);i++){const u=i/Math.max(10,r*1.5),angle=start+u*sweep,rag=Math.sin(i*1.7+phase)*2;
  for(let j=0;j<width;j++)px(g,x+Math.cos(angle)*(r-j*3+rag),y+Math.sin(angle)*(r-j*3)*sy,pal[Math.min(4,2+j)],a,3);
 }
}
export function drawClassPulse(g,e,t,r){
 const kind=CLASS_SKILLS[e.skill];if(!kind)return false;
 if(kind==='storm'){drawStormStrike(g,e,t,r,Math.min(1,(1-t)*5));return true;}
 if(e.skill==='earthquake'){drawGroundSlam(g,e,t,r);return true;}
 if(['cleave','dash-cut','bladestorm'].includes(e.skill)){drawSignatureSlash(g,{...e,radius:r,profile:e.skill==='cleave'?'axe':e.skill==='bladestorm'?'execution':'katana'},t);return true;}
 if(e.skill==='blizzard'){drawPixelBlizzard(g,e,t*3,r,Math.min(1,(1-t)*5));return true;}
 const p=['dash-cut','bladestorm'].includes(e.skill)?PAL.axe:PAL[kind],x=e.x,y=e.y,frame=Math.floor(t*12),fade=Math.min(1,(1-t)*3),ease=1-(1-t)**3,rr=r*(.15+.85*ease);
 // Animated debris uses fixed seeds to avoid noisy frame-to-frame random positions.
 for(let i=0;i<24;i++){const a=i*2.399,dist=rr*(.45+(i%7)/10),py=y+Math.sin(a)*dist*.65-Math.sin(t*Math.PI)*(i%4)*7;
  if((i+frame)%5)px(g,x+Math.cos(a)*dist,py,p[2+i%3],fade*(.45+i%3*.2),i%4===0?4:2);
 }
 if(kind==='fire'){
  contour(g,x,y,rr,.65,p,fade*.7,frame,0,TAU,3);
  const n=e.skill==='flamefield'?28:20;
  for(let i=0;i<n;i++){const a=i*2.399,dist=rr*(.3+(i%5)*.14),rise=(frame+i*3)%5;
   stamp(g,'flame',x+Math.cos(a)*dist-8,y+Math.sin(a)*dist*.6-12-rise*3,p,fade,2+(i%3===0?1:0),i%2===0);
  }
  if(e.skill==='meteor')for(let i=0;i<8;i++){
   const a=i*2.399,xx=x+Math.cos(a)*rr*.8,yy=y+Math.sin(a)*rr*.5;
   line(g,x+Math.cos(a)*12,y+Math.sin(a)*8,xx,yy,0x493630,fade,3);
   stamp(g,'rock',xx-5,yy-Math.sin(t*Math.PI)*35,p,fade,2);
  }
 }else if(kind==='ice'||kind==='earth'){
  contour(g,x,y,rr,.65,p,fade*.65,frame,0,TAU,2);
  for(let i=0;i<10;i++){const a=i*2.399,dist=rr*(.35+i%4*.18),rise=Math.min(1,t*7),h=kind==='ice'?32:18;
   const xx=x+Math.cos(a)*dist,yy=y+Math.sin(a)*dist*.65;
   line(g,xx,yy,xx-Math.cos(a)*18,yy+8,p[1],fade,3);
   stamp(g,kind==='ice'?'crystal':'rock',xx-9,yy-h*rise,p,fade,i%3===0?3:2);
   if(i%3===0)stamp(g,'spark',xx+7,yy-h*rise-5,p,fade*.7,1);
  }
 }else if(kind==='storm'){
  const n=e.skill==='thunderstrike'?1:5;
  for(let i=0;i<n;i++){const a=i*2.399,xx=x+Math.cos(a)*rr*.65*(n===1?0:1),yy=y+Math.sin(a)*rr*.5;
   let bx=xx-9,by=yy-115;
   for(let j=1;j<=7;j++){const nx=xx+Math.sin(j*8+i+frame*2)*13,ny=yy-115+j*115/7;
    line(g,bx,by,nx,ny,p[1],fade*.65,7);line(g,bx,by,nx,ny,p[3],fade,4);line(g,bx,by,nx,ny,p[4],fade,2);
    if(j===3||j===5)line(g,nx,ny,nx+22,ny-18,p[2],fade,3);bx=nx;by=ny;
   }stamp(g,'spark',xx-7,yy-7,p,fade,2);contour(g,xx,yy,15+t*22,.5,p,fade,frame,0,TAU,2);
  }
 }else if(kind==='axe'||kind==='blade'){
  if(e.skill==='fury'){drawBloodFuryBurst(g,x,y,r,t);return true;}
  const n=e.skill==='bladestorm'?3:1;
  for(let k=0;k<n;k++){const start=(e.angle||0)-2+k*TAU/n+t*2.6;
   for(let layer=0;layer<4;layer++)contour(g,x,y,rr-layer*4,.8,p,fade*(1-layer*.18),frame,start-layer*.12,2.1-layer*.25,2);
   for(let i=0;i<5;i++){const a=start+1.6+i*.12;stamp(g,'spark',x+Math.cos(a)*rr,y+Math.sin(a)*rr*.8,p,fade,1);}
  }
 }else if(kind==='shield'||kind==='rally'){
  if(kind==='rally'){drawRallyBurst(g,x,y,r,t);return true;}
  if(e.skill==='bulwark'){drawBulwarkBurst(g,x,y,r,t);return true;}
  contour(g,x,y,rr,.6,p,fade,frame,0,TAU,3);
  contour(g,x,y,rr*.78,.6,p,fade*.55,frame,0,TAU,1);
  for(let i=0;i<6;i++){const a=i*TAU/6,xx=x+Math.cos(a)*rr*.8,yy=y+Math.sin(a)*rr*.48-t*16;
   stamp(g,'shield',xx-8,yy-13,p,fade,2);stamp(g,'spark',xx+11,yy-17,p,fade*.6,1);
  }
 }else if(kind==='arrow'||kind==='poison'){
  for(let i=0;i<(e.skill==='arrow-rain'?20:9);i++){const a=i*2.399,fall=Math.min(1,t*2+i%4*.12),xx=x+Math.cos(a)*r*.82,yy=y+Math.sin(a)*r*.55-(1-fall)*110;
   line(g,xx-25,yy-45,xx-8,yy-10,p[1],fade*.7,3);stamp(g,'arrow',xx-12,yy-12,p,fade,2);
   if(fall===1)stamp(g,kind==='poison'?'leaf':'spark',xx,yy,p,fade,2);
  }
 }else{
  for(let i=0;i<4;i++)contour(g,x,y-i*5,rr*(1-i*.14),.5,p,fade*(1-i*.18),frame+i,frame*.15+i*.8,4.8,3);
  for(let i=0;i<7;i++)stamp(g,'spark',x+Math.cos(i*2.399)*rr*.7,y+Math.sin(i*2.399)*rr*.35-t*28,p,fade,1);
 }
 return true;
}
export function drawElementProjectile(g,e){
 if(e.projectileType==='poison-arrow'){
  const p=PAL.poison;line(g,-28,0,12,0,p[2],1,2);line(g,-24,-4,-18,0,p[3],1,2);line(g,-24,4,-18,0,p[3],1,2);
  line(g,10,-4,17,0,p[4],1,2);line(g,17,0,10,4,p[3],1,2);for(let i=0;i<5;i++)px(g,-12-i*6,(i%2?1:-1)*4,p[2+i%2],.6,2);return true;
 }
 if(e.family||e.gem)return false;
 const kind=e.fx==='fireball'?'fire':e.fx==='waterball'?'water':e.fx==='lightning'?'storm':null;if(!kind)return false;
 const p=PAL[kind];for(let i=0;i<9;i++)px(g,-26+i*4,Math.sin(i*2)*3,p[i%3+1],.65,3);
 stamp(g,kind==='fire'?'flame':kind==='water'?'crystal':'spark',-7,-9,p,1,2);return true;
}

function katana(g,x,y,angle,length,p,alpha=1){
 const dx=Math.cos(angle),dy=Math.sin(angle),nx=-dy,ny=dx;
 line(g,x-dx*12,y-dy*12,x,y,p[1],alpha,4);
 line(g,x+nx*7,y+ny*7,x-nx*7,y-ny*7,p[2],alpha,3);
 for(let i=0;i<length;i+=3){const bend=(i/length)**2*8;
  px(g,x+dx*i+nx*bend,y+dy*i+ny*bend,p[1],alpha,6);
  px(g,x+dx*i+nx*(bend-1),y+dy*i+ny*(bend-1),p[3],alpha,3);
  px(g,x+dx*i+nx*(bend-3),y+dy*i+ny*(bend-3),p[4],alpha,2);
 }
}
export function drawMartialEffect(g,e,t){
 const blood=e.action.startsWith('blood'),p=blood?[0x35222d,0x6d2b39,0xba424c,0xf18b71,0xffd0a3]:e.action.startsWith('poison')?PAL.poison:[0x2d3038,0x65656f,0xab8d75,0xe3c6a0,0xfff1cf];
 const x=e.x,y=e.y,r=e.radius||100,fade=Math.min(1,(1-t)*4),angle=e.angle||0;
 if(e.action==='quake-land'){
  drawGroundSlam(g,e,t,r);return;
 }
 if(e.action==='heaven-sword'){
  katana(g,x,y-r*.6,Math.PI/2,r*1.25,p,fade);for(let i=0;i<8;i++)stamp(g,'spark',x+(i%2?1:-1)*(12+i*3),y-r*.7+i*15,p,fade,1);return;
 }
 if(e.action==='bow-charge'||e.action==='bow-release'){
  line(g,x+16,y-5,x+16,y-35,PAL.arrow[3],fade,2);line(g,x+12,y-29,x+16,y-35,PAL.arrow[4],fade,2);line(g,x+16,y-35,x+20,y-29,PAL.arrow[4],fade,2);
  for(let i=0;i<8;i++){const a=i*TAU/8+t*3,d=24*(1-t);px(g,x+16+Math.cos(a)*d,y-20+Math.sin(a)*d,PAL.arrow[3],fade,2);}return;
 }
 if(e.action.includes('charge')||e.action.includes('draw')||e.action.includes('roar')||e.action==='poison-enchant'){
  if(e.action==='blood-roar'){drawBloodFuryBurst(g,x,y,r,t);return;}
  for(let i=0;i<4;i++)contour(g,x,y-i*8,18+t*35+i*4,.55,p,fade*.6,i,0,TAU,2);
  if(e.action.includes('draw')){katana(g,x-12,y,-Math.PI/2-.3,48,p,fade);if(e.dual)katana(g,x+12,y,-Math.PI/2+.3,48,p,fade);}
  for(let i=0;i<14;i++)px(g,x+Math.cos(i*2.399)*(15+t*25),y-(t*65+i*3)%65,p[2+i%3],fade,3);return;
 }
 drawSignatureSlash(g,e,t,{detailOnly:!!e.slashArt});
 if(e.action==='sword-finish'&&!e.slashArt){katana(g,x-25,y-70,Math.PI/3,125,p,fade);if(e.dual)katana(g,x+25,y-70,Math.PI*2/3,125,p,fade);}
}
export function drawMartialState(scene,u,obj,time){
 if(u.hp<=0)return;
 if(u.hero==='warrior-1'){
  const leap=u.martialLeap,t=leap?1-leap.time/leap.duration:1;
  obj.sprite.setAngle(leap?(t<.4?-12:24):0);
 }
 if(u.buffs?.some(b=>b.poisonArrows&&b.time>0)){
  const p=PAL.poison,x=obj.sprite.x,y=obj.groundY??u.y,phase=time/850;
  contour(scene.unitGround,x,y,30,.45,p,.65,0,0,TAU,2);
  for(let i=0;i<8;i++){const a=phase+i*TAU/8;px(scene.unitGlow,x+Math.cos(a)*23,y-8-((time/45+i*5)%32),p[2+i%3],.75,2);}
  stamp(scene.unitGlow,'leaf',x+(u.face||1)*20,y-32,p,.85,1);
 }
}
export function drawPixelBeam(g,e,t){
 if(e.type!=='lightning')return false;
 drawChainArc(g,e,t);return true;
}

export function meteorPosition(e,t){
 const u=Math.max(0,Math.min(1,t)),distance=1-u*u;
 return {x:e.x-160*distance,y:e.y-360*distance};
}
export function drawPixelMeteor(g,e,t){
 const p=PAL.fire,{x,y}=meteorPosition(e,t),r=e.radius||135,frame=Math.floor(t*16);
 contour(g,e.x,e.y,r,.5,p,.35+t*.4,frame,0,TAU,1);
 // A solid, cracked stone core stays visible throughout the descent.
 for(let i=11;i>=0;i--){const k=i/12,xx=x-k*65,yy=y-k*140;
  stamp(g,'flame',xx-8+Math.sin(i+frame)*5,yy-12,p,(1-k)*.85,2+(i<4?2:0),i%2===0);
  if(i%2===0)px(g,xx+18+(i%3)*4,yy-12,p[3],1-k,3);
 }
 stamp(g,'flame',x-23,y-25,p,1,5);
 const stone=[0x27232b,0x45343a,0x79504a,0xb47b59,0xffd18a];
 stamp(g,'meteor',x-28,y-24,stone,1,4);
 // Molten fissures across the dark rock, rather than a glowing orb.
 line(g,x-7,y-13,x-1,y-3,p[3],1,3);line(g,x-1,y-3,x-8,y+9,p[2],1,3);
 line(g,x+12,y-2,x+18,y+8,p[4],1,2);
}

// Wind and snow dominate; only a few low ice shards remain.
export function drawPixelBlizzard(g,e,age,r,alpha=1){drawSnowSquall(g,e,age,r,alpha);}

export function drawTideEffect(g,e,t){
 const p=PAL.water,r=e.radius||30,fade=Math.min(1,(1-t)*5);
 if(e.type==='tide-wave'){
  drawOceanRing(g,e,t);
 }else if(e.type==='tide-field'){
  drawTideFieldVFX(g,e,t);
 }else{
  for(let i=0;i<5;i++){
   const a=i*TAU/5+t*3,xx=e.x+Math.cos(a)*12,yy=e.y-t*50;
   line(g,xx,yy+22,xx+Math.cos(a)*6,yy,p[3],fade,3);
   stamp(g,'spark',xx,yy,p,fade,1);
  }
 }
}

export function drawCastWeapon(scene,u,obj,time){
 if(u.hero==='warrior-2')return; // The redesigned greatsword has its own frame-aligned emissive layer.
 if(!u.hero||u.hp<=0||u.stun>0)return;
 const freshCast=(u.anim||0)>=.45&&(obj.lastSkillAnim||0)<.45;obj.lastSkillAnim=u.anim||0;
 if((u.castCount>0&&u.castCount!==obj.weaponCast)||freshCast){obj.weaponCast=u.castCount;obj.weaponGlowUntil=time+Math.max(.5,u.castAnim||u.vanguardPoseTime||u.windCast||.6)*1000;}
 const remaining=(obj.weaponGlowUntil||0)-time;if(remaining<=0)return;
 const mage=['pyromancer','tidecaller','stormcaller'].includes(u.classId),face=u.face<0?-1:1,k=obj.size/57;
 const p=PAL[{pyromancer:'fire',tidecaller:'water',stormcaller:'storm',berserker:'axe',ravager:'axe',guardian:'shield',paladin:'shield',fallen:'storm',ranger:'arrow',darkelf:'storm',assassin:'poison',vanguard:'earth',windblade:'blade',duelist:'blade'}[u.classId]||'blade'];
 const x=obj.sprite.x+face*(mage?23:18)*k,y=obj.sprite.y-(mage?37:28)*k,a=Math.min(1,remaining/200);
 for(let i=0;i<7;i++){
  const xx=x+face*i*k,yy=y-i*k;
  px(scene.unitGlow,xx-2,yy-2,p[2],a*.35,5);px(scene.unitGlow,xx,yy,p[4],a,2);
 }
 stamp(scene.unitGlow,'spark',x+face*7*k-4,y-12*k,p,a*(.7+Math.sin(time/55)*.3),1);
 for(let i=0;i<4;i++)px(scene.unitGlow,x+Math.sin(time/150+i*2)*10,y-((time/25+i*7)%24),p[3],a*.7,2);
}

export function drawArrowStorm(g,e,age,r,alpha=1){
 const p=e.poisonEnchanted?PAL.poison:PAL.arrow,clock=Math.floor(age*30)/30;
 for(let i=0;i<70;i++){
  const a=i*2.399,d=r*Math.sqrt((i+.5)/70)*.96,tx=e.x+Math.cos(a)*d,ty=e.y+Math.sin(a)*d;
  const fall=(clock*(1.7+(i%3)*.1)+i*.618)%1,height=135*(1-fall),xx=tx-height*.32,yy=ty-height;
  const opacity=alpha*Math.min(1,age*5)*(.55+(i%3)*.2);
  line(g,xx-5,yy-18,xx,yy,p[2],opacity,2);
  line(g,xx-3,yy-8,xx+2,yy+3,p[4],opacity,1);
  line(g,xx-7,yy-18,xx-4,yy-14,p[3],opacity,1);
  if(fall>.85){const f=(fall-.85)/.15;stamp(g,'spark',tx-3,ty-3,p,opacity*(1-f),1);}
  if(e.poisonEnchanted&&i%3===0)pixelMist(g,xx-4,yy-5,p,opacity*.65,fall);
 }
}
function pixelMist(g,x,y,p,alpha,phase){for(let i=0;i<3;i++)px(g,x-i*3,y-i*4-phase*8,p[2+i%2],alpha*(1-i*.25),2);}
