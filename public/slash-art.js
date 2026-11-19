const TAU=Math.PI*2;
const PALETTES={katana:[0x34333b,0x68636c,0xbba18a,0xe9d6b3,0xfff6df],dual:[0x273a40,0x497775,0x85b8a9,0xc7e6d4,0xf4fff0],blood:[0x39232e,0x792b40,0xbd414e,0xf18270,0xffd3ab],axe:[0x3e3331,0x746049,0xb78b5d,0xeac28b,0xffebbd],wind:[0x29413f,0x4e847b,0x8ec9b4,0xd0ecdb,0xf1fff1],holy:[0x514536,0x9c8054,0xd9b975,0xf9e4aa,0xffffdf],dark:[0x291a3e,0x5d3978,0x9872af,0xcdb3dc,0xeaf7cd],dagger:[0x29382e,0x5c714a,0xa3b17a,0xd9dcb0,0xffffda]};
export function slashProfile(e){
 if(e.profile)return e.profile;
 if(e.action==='sword-finish')return e.dual?'dual-finish':'execution';
 if(e.action==='dual-cut')return 'dual';
 if(e.action==='blood-cut')return 'blood';
 if(e.action==='axe-cut')return 'axe';
 if(e.action==='heavy-cut')return 'katana';
 return null;
}
export function slashFrame(t){return Math.max(0,Math.min(5,Math.floor(t*6)));}
const row={katana:0,dual:1,blood:2,axe:3,execution:4,'dual-finish':5};
export function preloadSlashArt(s){s.load.image('signature-slashes','/assets/combat/signature-slashes.png');}
export function createSlashVisual(s,e){
 const profile=slashProfile(e);if(row[profile]===undefined||!s.textures?.exists('signature-slashes'))return null;
 const texture=s.textures.get('signature-slashes'),source=texture.getSourceImage(),w=source.width/6,h=source.height/6;
 for(let f=0;f<6;f++){const id='slash:'+profile+':'+f;if(!texture.has(id)){const x=Math.round(f*w),y=Math.round(row[profile]*h);texture.add(id,0,x,y,Math.round((f+1)*w)-x,Math.round((row[profile]+1)*h)-y);}}
 const image=s.add.image(e.x,e.y,'signature-slashes','slash:'+profile+':0').setDepth(2601).setOrigin(.55,.58);
 return {image,profile};
}
export function updateSlashVisual(v,e,t){
 if(!v)return;const r=e.radius||80,a=e.angle||0,size=r*(e.basic?1.8:2.3),forward=['execution','dual-finish'].includes(v.profile)?0:r*.28;
 v.image.setFrame('slash:'+v.profile+':'+slashFrame(t)).setPosition(e.x+Math.cos(a)*forward,e.y+Math.sin(a)*forward).setDisplaySize(size,size).setRotation(['execution','dual-finish'].includes(v.profile)?0:a).setFlipY(!!e.reverse).setAlpha(t>.88?(1-t)/.12:1);
}
export function destroySlashVisual(v){v?.image.destroy();}
function pixel(g,x,y,c,alpha=1,size=2){g.fillStyle(c,Math.max(0,alpha)).fillRect(Math.round(x/size)*size,Math.round(y/size)*size,size,size);}
function segment(g,x,y,tx,ty,c,alpha=1,size=2){const n=Math.max(1,Math.ceil(Math.hypot(tx-x,ty-y)/size));for(let i=0;i<=n;i++)pixel(g,x+(tx-x)*i/n,y+(ty-y)*i/n,c,alpha,size);}
// Irregular tapered cuts sampled onto a pixel grid; never a constant-width arc.
function cut(g,e,p,t,from,to,width=7,offset=0){
 const a=e.angle||0,c=Math.cos(a),s=Math.sin(a),r=e.radius||90,fade=Math.min(1,(1-t)*4),phase=Math.min(1,t*3);
 const point=(u,v)=>({x:e.x+(u*c-v*s)*r,y:e.y+(u*s+v*c)*r});
 const tangentX=(to[0]-from[0])*c-(to[1]-from[1])*s,tangentY=(to[0]-from[0])*s+(to[1]-from[1])*c,tangentLength=Math.hypot(tangentX,tangentY)||1;
 const end=Math.min(1,.2+phase),start=Math.max(0,(t-.3)*1.35);
 for(let i=0;i<=60;i++){
  const u=i/60;if(u<start||u>end)continue;
  const pos=point(from[0]+(to[0]-from[0])*u,from[1]+(to[1]-from[1])*u+offset);
  const taper=Math.sin(Math.PI*u)**.7*(1-t*.5),w=width*taper;
  if((i+Math.floor(t*12))%9===0)continue;
  for(let j=-w;j<=w;j+=2){const edge=Math.abs(j)/Math.max(1,w);pixel(g,pos.x-tangentY/tangentLength*j,pos.y+tangentX/tangentLength*j,p[edge>.7?1:edge>.3?2:4],fade*(edge>.7?.3:.8),2);}
 }
 return point(to[0],to[1]);
}
function impact(g,x,y,p,t,scale=1){
 const burst=Math.sin(Math.PI*Math.min(1,t*2)),fade=Math.min(1,(1-t)*3);
 for(let i=0;i<10;i++){const a=i*2.399,d=(8+i%3*6)*scale*burst;segment(g,x+Math.cos(a)*d*.25,y+Math.sin(a)*d*.25,x+Math.cos(a)*d,y+Math.sin(a)*d,p[i%2?3:4],fade,2);}
}
export function drawSignatureSlash(g,e,t,{detailOnly=false}={}){
 const profile=slashProfile(e)||'katana',p=PALETTES[profile==='execution'?'holy':profile==='dual-finish'?'dual':profile]||PALETTES.katana,r=e.radius||85,fade=Math.min(1,(1-t)*3),a=e.angle||0;
 if(profile==='axe'){
  if(!detailOnly){cut(g,e,p,t,[-.3,-.8],[.8,.55],12);cut(g,e,p,t,[-.5,-.7],[.6,.6],4,.09);}
  const x=e.x+Math.cos(a)*r*.6,y=e.y+Math.sin(a)*r*.6+r*.28;
  impact(g,x,y,p,t,1.6);
  for(let i=0;i<12;i++){const b=i*2.399,d=r*(.1+t*.6);pixel(g,x+Math.cos(b)*d,y+Math.sin(b)*d*.4-Math.sin(t*Math.PI)*(8+i%4*7),p[i%2?1:2],fade,3+i%3);}
 }else if(profile==='blood'){
  if(!detailOnly)for(let i=0;i<3;i++)cut(g,{...e,angle:a+(e.reverse?-.35:.25)},p,t,[-.45,-.55+i*.22],[.85,.3+i*.14],5-i);
  for(let i=0;i<20;i++){const u=i/20,x=e.x+Math.cos(a)*r*(u+t*.35),y=e.y+Math.sin(a)*r*u+(i%3-1)*r*.2;pixel(g,x,y-Math.sin(t*Math.PI)*i,p[i%3===0?4:2],fade,2+i%3);}
 }else if(profile==='dual'||profile==='dual-finish'||profile==='dagger'){
  if(!detailOnly){cut(g,e,p,t,[-.55,-.65],[.7,.55],profile==='dagger'?3:5);cut(g,e,p,Math.max(0,t-.1),[-.5,.55],[.75,-.6],profile==='dagger'?3:5);}
  impact(g,e.x+Math.cos(a)*r*.25,e.y+Math.sin(a)*r*.25,p,t,profile==='dual-finish'?1.7:1);
 }else if(profile==='execution'){
  if(!detailOnly){cut(g,e,p,t,[0,-1],[0,.8],10);cut(g,e,p,t,[-.12,-.9],[.12,.6],3);}
  impact(g,e.x,e.y+r*.45,p,t,2);
  for(let i=0;i<7;i++){const b=i*TAU/7;segment(g,e.x,e.y+r*.45,e.x+Math.cos(b)*r*.7*t,e.y+r*.45+Math.sin(b)*r*.25*t,p[2],fade*.6,2);}
 }else{
  if(!detailOnly){cut(g,e,p,t,[-.5,-.7],[.85,.45],profile==='katana'?6:4);cut(g,e,p,t,[-.65,-.5],[.65,.55],2,-.1);}
  const x=e.x+Math.cos(a)*r*.6,y=e.y+Math.sin(a)*r*.6;
  impact(g,x,y,p,t,profile==='holy'?1.4:1);
  for(let i=0;i<9;i++){const u=i/9;pixel(g,x-r*.6*u,y+(i%2?1:-1)*8-Math.sin(t*Math.PI)*12,p[i%3+2],fade*(1-u),2);}
  if(profile==='holy')for(let i=0;i<3;i++){const xx=x+(i-1)*16;segment(g,xx,y-7,xx,y+7,p[3],fade,2);segment(g,xx-4,y,xx+4,y,p[4],fade,2);}
  if(profile==='dark')for(let i=0;i<8;i++)segment(g,x+(i%3-1)*10,y-i*3,x+(i%3-1)*13,y-i*3-8,p[i%2?2:3],fade,2);
 }
}
