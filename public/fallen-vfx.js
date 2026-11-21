import {effectInView,setRenderDormant} from './render-budget.js';
import {drawSignatureSlash} from './slash-art.js';
import {ensureKnightQTexture} from './knight-q-art.js';
import {ribbon,cyclone} from './combat-art.js';
import {visualRadius} from './class-vfx-config.js';
import {FALLEN} from './fallen-config.js';
import {drawFallenAuraBurst,drawFallenSustainedField,drawFallenUnderfootBuff,destroyFieldRims} from './aura-vfx.js';
const TAU=Math.PI*2;
export function fallenIcon(el,id){const index=['fallen-passive','fallen-sunder','fallen-aura','fallen-doom'].indexOf(id);if(index<0)return false;el.style.setProperty('--icon','url("/assets/fallen/icons-v1.png")');el.style.setProperty('background-image','var(--icon)','important');el.style.setProperty('background-size','400% 100%','important');el.style.setProperty('background-position',index/3*100+'% 50%','important');return true;}
function destroyFallen(v){v.g.destroy();v.sprite?.destroy();v.qSprite?.destroy();}
// Use isolated complete poses, not equal-height cells that cut the packed artwork.
const Q_RECTS={foot:[[40,180,175,175],[240,180,185,175]],mounted:[[35,350,190,245],[225,350,205,245]]};
function qFrame(scene,mounted,index){if(!scene.textures?.exists('fallen-effects'))return null;const texture=scene.textures.get('fallen-effects'),form=mounted?'mounted':'foot',id='q-full-'+form+'-'+index;if(!texture.has(id)){const [x,y,w,h]=Q_RECTS[form][index];texture.add(id,0,x,y,w,h);}return id;}
export function addFallenVFX(scene,e){scene.fallenVFX||=[];if(scene.fallenVFX.length>=80)destroyFallen(scene.fallenVFX.shift());const r=visualRadius('fallen',e),a=e.angle||0,v={e,age:0,duration:e.action==='transform'?1.1:e.action==='aura'?.9:e.action==='strike'?.35:e.action==='flurry'?.3:e.action==='q2-charge'?1.5:e.action==='q2'?(e.mounted?.72:.6):.45,g:scene.add.graphics().setDepth(e.action==='aura'?2420:20000)};if(e.action==='slash'){const frame=qFrame(scene,e.mounted,0);if(frame!==null){v.sprite=scene.add.image(e.x+Math.cos(a)*r*.3,e.y-20+Math.sin(a)*r*.3,'fallen-effects',frame).setDepth(20002).setRotation(a);v.sprite.setScale(r*(e.mounted?1.7:1.5)/v.sprite.height);}}else if(['q1','flurry','q2'].includes(e.action)){const tex=ensureKnightQTexture(scene,e.action==='q2'?'knight-q-fallen-2':'knight-q-fallen-1');if(tex){const ang=e.action==='q2'?a:a+((e.step||0)%2?.36:-.36);v.qSprite=scene.add.image(e.x+Math.cos(a)*r*.3,e.y-18+Math.sin(a)*r*.3,tex).setDepth(20003).setRotation(ang);if(e.action!=='q2'&&(e.step||0)%2)v.qSprite.setFlipY(true);}}scene.fallenVFX.push(v);}
export function updateFallenVFX(scene,dt){scene.fallenVFX=(scene.fallenVFX||[]).filter(v=>{v.age+=dt;setRenderDormant(v,!effectInView(scene,v));if(v.renderDormant&&v.age<v.duration)return true;const t=Math.min(1,v.age/v.duration),f=1-t,{e,g}=v,r=visualRadius('fallen',e),a=e.angle||0,x=e.x,y=e.y-12;g.clear();if(['strike','slash'].includes(e.action)){drawSignatureSlash(g,{x,y,radius:r,angle:a,profile:'dark'},t);}
 if(e.action==='q2-charge'){
  const owner=scene.actorObjects?.get(e.sourceId),cx=owner?.sprite?.active?owner.sprite.x:x,cy=owner?.sprite?.active?owner.groundY-16:y;
  g.lineStyle(5,0x7e22ce,.35+t*.6).strokeCircle(cx,cy,100*(1-t*.65));
  g.lineStyle(3,0xf43f5e,.4+t*.6).strokeCircle(cx,cy,66*(1-t*.55));
  g.fillStyle(0x1f0b2e,.5+t*.4).fillCircle(cx,cy,14+t*14);
  for(let i=0;i<10;i++){const b=i/10*TAU-t*5,d=80*(1-t*.8);g.fillStyle(i%2?0xf43f5e:0xa855f7,.9).fillCircle(cx+Math.cos(b)*d,cy+Math.sin(b)*d,2.5);}
 }else if(e.action==='q1'||e.action==='flurry'){
  const dir=(e.step||0)%2?1:-1,ang=a+dir*.38;
  if(v.qSprite){const sz=r*(e.mounted?2.1:1.75)*(.85+.25*Math.sin(t*Math.PI));v.qSprite.setPosition(x+Math.cos(a)*r*.25,y+Math.sin(a)*r*.25).setDisplaySize(sz,sz).setAlpha(t<.7?1:Math.max(0,(1-t)/.3));}
  for(let i=0;i<6;i++){const b=ang-.8+i/5*1.6,d=r*(.45+t*.55);g.fillStyle(i%2?0xe11d48:0xa855f7,f).fillCircle(x+Math.cos(b)*d,y+Math.sin(b)*d,2);}
 }else if(e.action==='q2'){
  const dist=e.mounted?(e.waveDist||270)*t:r*.38,cx=x+Math.cos(a)*dist,cy=y+Math.sin(a)*dist;
  const sz=r*(e.mounted?1.25+t*1.85:1.95*(.78+.3*Math.sin(t*Math.PI)));
  if(v.qSprite){v.qSprite.setPosition(cx,cy).setDisplaySize(sz,sz).setAlpha(t<.75?1:Math.max(0,(1-t)/.25));}
  if(e.mounted){g.lineStyle(5,0x7e22ce,f*.8).strokeCircle(cx,cy,sz*.42);g.lineStyle(2,0xf43f5e,f).strokeCircle(cx,cy,sz*.3);}
  for(let i=0;i<12;i++){const b=i/12*TAU,d=r*(1-t)*.85;g.fillStyle(i%2?0xf43f5e:0x9333ea,f).fillCircle(cx+Math.cos(b)*d,cy+Math.sin(b)*d,2.5);}
 }
 if(v.sprite){const index=t<.28?0:1,frame=qFrame(scene,e.mounted,index),owner=scene.actorObjects?.get(e.sourceId),px=owner?.sprite?.active?owner.sprite.x:e.x,py=owner?.sprite?.active?owner.groundY:e.y;v.sprite.setFrame(frame).setPosition(px+Math.cos(a)*r*.3,py-20+Math.sin(a)*r*.3).setScale(r*(e.mounted?1.7:1.5)*( .9+Math.sin(t*Math.PI)*.1)/v.sprite.height).setAlpha(t<.75?1:Math.max(0,(1-t)/.25));}
 if(t>=1){v.qSprite?.destroy();}
 if(['strike','slash','q1','flurry','q2'].includes(e.action)){/* Custom pixel-art Q textures & signature slashes. */}
 else if(e.action==='aura'){drawFallenAuraBurst(g,e.x,e.y,r,t,!!e.mounted);}
 else if(e.action==='bleed'){for(let i=0;i<6;i++){const b=i/6*TAU;g.fillStyle(i%2?0x8eb26c:0x8b334f,f).fillEllipse(x+Math.cos(b)*t*22,y-t*20+Math.sin(b)*t*12,3,5);}}
 else if(e.action==='rupture'){g.lineStyle(3,0xabc977,f).strokeCircle(x,y,r*t);for(let i=0;i<8;i++){const b=i/8*TAU;g.lineStyle(3,0x9c73c2,f).lineBetween(x+Math.cos(b)*r*.25,y+Math.sin(b)*r*.25,x+Math.cos(b)*r*t,y+Math.sin(b)*r*t);}}
 else{const transform=e.action==='transform',revert=e.action==='revert',rr=r*(revert?f:t);g.lineStyle(7,0x2e1b43,f*.55).strokeEllipse(x,y+12,rr*2,rr*.85);g.lineStyle(2,0xad86d0,f).strokeEllipse(x,y+12,rr*2,rr*.85);for(let i=0;i<10;i++){const b=i/10*TAU,px=x+Math.cos(b)*rr,py=y+12+Math.sin(b)*rr*.42;g.fillStyle(i%2?0xa4c77c:0x775b9f,f).fillTriangle(px-4,py,px+4,py,px,py-(transform?40:12)*Math.sin(Math.PI*t));}if(transform){g.lineStyle(16,0x674184,Math.sin(t*Math.PI)*.25).lineBetween(x,y+5,x,y-150*Math.sin(t*Math.PI));for(const side of [-1,1])for(let i=0;i<4;i++){g.lineStyle(2,0xb0a5be,f).lineBetween(x,y-45,x+side*(50+i*15)*Math.sin(t*Math.PI),y-95+i*14);}}}
 if(t>=1){destroyFallen(v);return false;}return true;});}
export function clearFallenVFX(scene){for(const v of scene.fallenVFX||[])destroyFallen(v);scene.fallenVFX=[];}
export function clearFallenState(obj){destroyFieldRims(obj.classAuraSprites,'fallen');obj.classAuraSprites?.get('fallen-foot')?.destroy();obj.classAuraSprites?.delete('fallen-foot');obj.fallenRange?.destroy();obj.fallenRange=null;obj.fallenAuraArt?.destroy();obj.fallenAuraArt=null;obj.fallenGround?.destroy();obj.fallenGround=null;obj.fallenMark?.destroy();obj.fallenMark=null;obj.fallenSpeedGfx?.destroy();obj.fallenSpeedGfx=null;}
function drawFallenRange(scene,u,obj,time){
 const emitting=u.classId==='fallen'&&u.hp>0&&(u.fallenAuraTime>0||u.fallenMounted&&u.skills?.['fallen-aura']>0),mode=emitting?(u.fallenMounted?'mounted':'foot'):null;
 if(!emitting){destroyFieldRims(obj.classAuraSprites,'fallen');obj.fallenRange?.destroy();obj.fallenRange=null;obj.fallenAuraMode=null;obj.fallenAuraRemaining=0;return;}
 const refreshed=!u.fallenMounted&&u.fallenAuraTime>(obj.fallenAuraRemaining||0)+.2;
 if(mode!==obj.fallenAuraMode||refreshed)obj.fallenAuraStarted=time;
 obj.fallenAuraMode=mode;obj.fallenAuraRemaining=u.fallenAuraTime||0;
 const burstT=Math.max(0,Math.min(1,(time-(obj.fallenAuraStarted||time))/900));
 const eRank=Math.max(0,(u.skills?.['fallen-aura']||1)-1);
 const r=(u.fallenMounted?FALLEN.aura.mountedRadius:FALLEN.aura.radius)+eRank*8;
 obj.fallenRange||=scene.add.graphics();
 const g=obj.fallenRange;g.clear().setDepth(u.y-8);
 drawFallenSustainedField(g,u.x,u.y,r,time,burstT,!!u.fallenMounted,scene,obj);
}
export function drawFallenState(scene,u,obj,time){
 if(u.hp<=0){clearFallenState(obj);return;}
 drawFallenRange(scene,u,obj,time);
 if(u.fallenAura){obj.fallenAuraArt?.destroy();obj.fallenAuraArt=null;obj.fallenGround||=scene.add.graphics();const g=obj.fallenGround;g.clear().setDepth(u.y-2);drawFallenUnderfootBuff(g,u.x,u.y,time,!!u.fallenAura.enhanced,scene,obj);}
 else{obj.classAuraSprites?.get('fallen-foot')?.destroy();obj.classAuraSprites?.delete('fallen-foot');obj.fallenAuraArt?.destroy();obj.fallenAuraArt=null;obj.fallenGround?.destroy();obj.fallenGround=null;}
 if(u.hp>0&&u.buffs?.some(b=>b.fallenQSpeed&&b.time>0)){
  obj.fallenSpeedGfx||=scene.add.graphics();
  const sg=obj.fallenSpeedGfx;sg.clear().setDepth(u.y-3);
  const dir=-(u.face||1);
  for(let i=0;i<5;i++){
   const ox=dir*(12+i*10)+Math.sin(time/60+i)*3,oy=-8-i*6;
   sg.lineStyle(3,i%2?0x9333ea:0xe11d48,.6-i*.1).lineBetween(u.x+ox,u.y+oy,u.x+ox+dir*24,u.y+oy);
   if(u.fallenMounted)sg.fillStyle(0xa855f7,.7-i*.12).fillCircle(u.x+ox,u.y+2,4-i*.5);
  }
 }else{obj.fallenSpeedGfx?.destroy();obj.fallenSpeedGfx=null;}
 const marks=Object.values(u.fallenMarks||{}).filter(m=>m.time>0),count=Math.max(0,...marks.map(m=>m.stacks));if(count){obj.fallenMark||=scene.add.graphics();const g=obj.fallenMark;g.clear().setDepth(3502);for(let i=0;i<count;i++){const x=u.x+(i-(count-1)/2)*7,y=u.y-obj.size-15;g.fillStyle(0x98cf72,.95).fillTriangle(x-3,y+3,x+3,y+3,x,y-4);}}
 else{obj.fallenMark?.destroy();obj.fallenMark=null;}
}
