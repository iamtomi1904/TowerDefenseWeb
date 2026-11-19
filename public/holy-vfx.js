import {drawSignatureSlash} from './slash-art.js';
import {ensureKnightQTexture} from './knight-q-art.js';
import {PALADIN} from './paladin-config.js';
import {drawHolyAuraBurst,drawHolySustainedField,drawHolyUnderfootBuff,destroyFieldRims} from './aura-vfx.js';
export function holyIcon(el,id){const index=['holy-slash','holy-aura','holy-ascend'].indexOf(id);if(index<0)return;el.style.setProperty('--icon','url("/assets/paladin/icons.png")');el.style.setProperty('background-image','var(--icon)','important');el.style.setProperty('background-size','300% 100%','important');el.style.setProperty('background-position',index*50+'% 50%','important');}
export function drawHolyAura(scene,u,obj,time){
 drawHolyRange(scene,u,obj,time);
 if(u.hp>0&&u.shield>0&&u.buffs?.some(b=>b.holyShield&&b.time>0)){
  obj.holyShieldGfx||=scene.add.graphics();
  const sg=obj.holyShieldGfx;sg.clear().setDepth(u.y+25);
  const pulse=.85+Math.sin(time/120)*.15,sr=u.holyMounted?38:31,rot=time/450;
  sg.lineStyle(3,0xffffff,.75*pulse).strokeCircle(u.x,u.y-22,sr);
  sg.lineStyle(2,0xffe89e,.55*pulse).strokeCircle(u.x,u.y-22,sr+5);
  sg.lineStyle(2,0xffffff,.5);
  sg.beginPath();
  for(let i=0;i<=6;i++){const a=rot+i*Math.PI/3,px=u.x+Math.cos(a)*(sr+2),py=u.y-22+Math.sin(a)*(sr+2);if(i===0)sg.moveTo(px,py);else sg.lineTo(px,py);}
  sg.strokePath();
 }else{obj.holyShieldGfx?.destroy();obj.holyShieldGfx=null;}
 if(!u.holyAura||u.hp<=0){obj.classAuraSprites?.get('holy-foot')?.destroy();obj.classAuraSprites?.delete('holy-foot');obj.holyAuraSprite?.destroy();obj.holyAuraSprite=null;obj.holyAuraGround?.destroy();obj.holyAuraGround=null;return;}
 obj.holyAuraGround||=scene.add.graphics();
 const g=obj.holyAuraGround;g.clear().setDepth(u.y-1);
 drawHolyUnderfootBuff(g,u.x,u.y,time,!!u.holyAura.enhanced,scene,obj);
 if(!u.holyAura.enhanced||!scene.textures?.exists('holy-effects')){obj.holyAuraSprite?.destroy();obj.holyAuraSprite=null;return;}
 const tx=scene.textures.get('holy-effects'),im=tx.getSourceImage(),w=Math.floor(im.width/6),h=Math.floor(im.height/3);
 for(let i=0;i<6;i++)if(!tx.has(6+i))tx.add(6+i,0,i*w,h,w,h);
 if(!obj.holyAuraSprite)obj.holyAuraSprite=scene.add.image(u.x,u.y,'holy-effects',6);
 const size=u.holyAura.enhanced?105:80;
 obj.holyAuraSprite.setPosition(u.x,u.y+3).setDepth(u.y-1).setDisplaySize(size,size*.75).setFrame(6+Math.floor(time/130)%6).setAlpha(.75);
}

function drawHolyRange(scene,u,obj,time){
 const emitting=u.classId==='paladin'&&u.hp>0&&(u.holyAuraTime>0||u.holyMounted&&u.skills?.['holy-aura']>0),mode=emitting?(u.holyMounted?'mounted':'foot'):null;
 if(!emitting){destroyFieldRims(obj.classAuraSprites,'holy');obj.holyRange?.destroy();obj.holyRange=null;obj.holyAuraMode=null;obj.holyAuraRemaining=0;return;}
 const refreshed=!u.holyMounted&&u.holyAuraTime>(obj.holyAuraRemaining||0)+.2;
 if(mode!==obj.holyAuraMode||refreshed)obj.holyAuraStarted=time;
 obj.holyAuraMode=mode;obj.holyAuraRemaining=u.holyAuraTime||0;
 const burstT=Math.max(0,Math.min(1,(time-(obj.holyAuraStarted||time))/900));
 const eRank=Math.max(0,(u.skills?.['holy-aura']||1)-1);
 const r=(u.holyMounted?PALADIN.aura.mountedRadius:PALADIN.aura.radius)+eRank*8;
 obj.holyRange||=scene.add.graphics();
 const g=obj.holyRange;g.clear().setDepth(u.y-8);
 drawHolySustainedField(g,u.x,u.y,r,time,burstT,!!u.holyMounted,scene,obj);
}
function destroyHoly(v){v.g.destroy();v.image?.destroy();}
export function addHolyStrike(scene,e){scene.holyStrikes||=[];if(scene.holyStrikes.length>=60)destroyHoly(scene.holyStrikes.shift());const isAura=e.action==='aura',basic=e.action==='strike'||!e.skill&&!isAura&&Number.isFinite(e.angle),v={e,age:0,basic,isAura,duration:isAura?.9:basic?.23:e.action==='q3-charge'?1:e.action==='q3'?(e.mounted?.72:.55):.42,g:scene.add.graphics().setDepth(isAura?2420:2702)};
 if(['q1','q2','q3'].includes(e.action)){
  const tex=ensureKnightQTexture(scene,e.action==='q1'?'knight-q-holy-1':e.action==='q2'?'knight-q-holy-2':'knight-q-holy-3');
  if(tex){v.image=scene.add.image(e.x,e.y-18,tex).setDepth(2703);}
 }
 scene.holyStrikes.push(v);}
export function updateHolyStrikes(scene,dt){scene.holyStrikes=(scene.holyStrikes||[]).filter(v=>{v.age+=dt;const t=Math.min(1,v.age/v.duration),f=1-t,{e,g}=v,r=e.radius||(e.mounted?PALADIN.aura.mountedRadius:PALADIN.aura.radius)||70,a=e.angle||0,x=e.x,y=e.y-12;g.clear();if(v.isAura){drawHolyAuraBurst(g,e.x,e.y,r,t,!!e.mounted);}else if(e.action==='q3-charge'){
 const owner=scene.actorObjects?.get(e.sourceId),cx=owner?.sprite?.active?owner.sprite.x:x,cy=owner?.sprite?.active?owner.groundY-16:y;
 g.lineStyle(4,0xffffff,.3+t*.6).strokeCircle(cx,cy,95*(1-t*.65));
 g.lineStyle(3,0xffe89e,.35+t*.65).strokeCircle(cx,cy,62*(1-t*.55));
 g.fillStyle(0xffffff,.25+t*.55).fillCircle(cx,cy,14+t*14);
 for(let i=0;i<8;i++){const b=i/8*Math.PI*2+t*4,d=75*(1-t*.8);g.fillStyle(i%2?0xffffff:0xffe89e,.85).fillCircle(cx+Math.cos(b)*d,cy+Math.sin(b)*d,2.5);}
}else if(e.action==='q1'){
 if(v.image){const sz=r*(e.mounted?2.35:1.95)*(.82+.28*Math.sin(t*Math.PI));v.image.setPosition(x+Math.cos(a)*r*.38,y+Math.sin(a)*r*.38).setDisplaySize(sz,sz*.62).setAlpha(t<.72?1:Math.max(0,(1-t)/.28));}
 for(let i=0;i<8;i++){const ox=(i-3.5)*r*.22,oy=(i%2?-1:1)*(6+t*10);g.fillStyle(0xffffff,f*.85).fillCircle(x+Math.cos(a)*r*.38+ox,y+Math.sin(a)*r*.38+oy,1.5+i%2);}
}else if(e.action==='q2'){
 const drop=Math.max(0,1-t*2.8)*55,tx=x+Math.cos(a)*r*.4,ty=y-12+Math.sin(a)*r*.4;
 if(v.image){const sz=r*(e.mounted?1.9:1.6);v.image.setPosition(tx,ty-drop).setDisplaySize(sz*.8,sz*1.15).setAlpha(t<.72?1:Math.max(0,(1-t)/.28));}
 for(let i=0;i<8;i++){const ox=(i%2?1:-1)*(8+i*4)*t;g.fillStyle(0xffffff,f).fillCircle(tx+ox,ty+14-i*6,2);}
}else if(e.action==='q3'){
 const dist=e.mounted?(e.waveDist||250)*t:0,wx=x+Math.cos(a)*dist,wy=y-6+Math.sin(a)*dist;
 const sz=r*(e.mounted?1.25+t*1.85:2.0*(.75+.35*Math.sin(t*Math.PI)));
 if(v.image){v.image.setPosition(wx,wy).setDisplaySize(sz,sz).setAlpha(t<.75?1:Math.max(0,(1-t)/.25));}
 if(e.mounted){
  g.lineStyle(5,0xffffff,f*.8).strokeCircle(wx,wy,sz*.42);
  g.lineStyle(3,0xffe89e,f*.85).strokeCircle(x,y,r*(.35+t*.75));
  for(const side of [-1,1])for(let i=0;i<3;i++)g.lineStyle(3,0xffffff,f*.8).lineBetween(x,y-10,x+side*(35+i*22)*Math.sin(t*Math.PI),y-38+i*12);
 }
}else if(v.basic){if(e.mounted){const len=r*Math.sin(t*Math.PI);g.lineStyle(5,0xf5d58d,f*.2).lineBetween(x,y,x+Math.cos(a)*len,y+Math.sin(a)*len);g.lineStyle(2,0xffffee,f).lineBetween(x,y,x+Math.cos(a)*len,y+Math.sin(a)*len);}else{drawSignatureSlash(g,{x,y,radius:r,angle:a,profile:'holy'},t);}for(let i=0;i<3;i++){const b=a-.4+i*.4;g.fillStyle(0xfff1b7,f).fillCircle(x+Math.cos(b)*r*.75,y+Math.sin(b)*r*.75,1);}}else{if(v.image){const size=r*3.5*(.78+.22*Math.sin(t*Math.PI));v.image.setPosition(x+Math.cos(a)*r*.2,y+Math.sin(a)*r*.2).setDisplaySize(size,size).setAlpha(Math.sin(t*Math.PI));}for(let i=0;i<14;i++){const b=a-1.3+i/13*2.6,d=r*(.45+t*.65);g.fillStyle(i%2?0xffffff:0xffdc88,f*.8).fillCircle(x+Math.cos(b)*d,y+Math.sin(b)*d,1+i%2);}}if(t>=1){destroyHoly(v);return false;}return true;});}
export function clearHolyStrikes(scene){for(const v of scene.holyStrikes||[])destroyHoly(v);scene.holyStrikes=[];}
