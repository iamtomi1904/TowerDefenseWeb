import {RITUAL_ACTOR_ROWS,KATANA_SUMMON_LAYOUT} from './ritual-casting-layout.js';
import {prepareMoonfallArt} from './moonfall-art.js';
export function preloadRitualCasting(scene){scene.load.image('ritual-actors-raw','/assets/casting/ritual-actors-v1.png');scene.load.image('katana-summon-raw','/assets/casting/katana-summon-v1.png');}
function clean(c,w,h,floor){const image=c.getImageData(0,0,w,h);for(let i=3;i<image.data.length;i+=4)image.data[i]=Math.round(255*Math.max(0,(image.data[i]-floor)/(255-floor)));c.putImageData(image,0,0);}
export function prepareRitualArt(scene){
 if(scene.textures.exists('ritual-actor:0'))return true;if(!scene.textures.exists('ritual-actors-raw')||typeof document==='undefined')return false;
 const source=scene.textures.get('ritual-actors-raw').getSourceImage(),cw=source.width/6,ch=source.height/4;
 for(let row=0;row<4;row++){
  const info=RITUAL_ACTOR_ROWS[row],[x,y,w,h]=info.crop,scale=Math.min(180/w,210/h),canvas=document.createElement('canvas');canvas.width=192*6;canvas.height=224;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  for(let frame=0;frame<6;frame++)c.drawImage(source,Math.round(frame*cw+x),Math.round(row*ch+y),w,h,frame*192+Math.round((192-w*scale)/2),Math.round(218-(info.foot-y)*scale),Math.round(w*scale),Math.round(h*scale));
  clean(c,canvas.width,224,64);const texture=scene.textures.addCanvas('ritual-actor:'+row,canvas);for(let frame=0;frame<6;frame++)texture.add(frame,0,frame*192,0,192,224);
 }
 prepareKatanaArt(scene);return true;
}
export function prepareKatanaArt(scene){
 if(scene.textures.exists('katana-summon:blade'))return true;if(!scene.textures.exists('katana-summon-raw')||typeof document==='undefined')return false;
 const source=scene.textures.get('katana-summon-raw').getSourceImage();for(const [id,b]of Object.entries(KATANA_SUMMON_LAYOUT)){
  const size=id==='blade'?[96,256]:id==='impact'?[256,176]:[192,160],canvas=document.createElement('canvas');canvas.width=size[0];canvas.height=size[1];const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;const [x,y,w,h]=b,scale=Math.min((size[0]-4)/w,(size[1]-4)/h),dw=Math.round(w*scale),dh=Math.round(h*scale);c.drawImage(source,x,y,w,h,Math.round((size[0]-dw)/2),Math.round((size[1]-dh)/2),dw,dh);clean(c,...size,32);scene.textures.addCanvas('katana-summon:'+id,canvas);
 }return true;
}
export function clearRitualActor(obj){obj.ritualLight?.destroy();obj.ritualRune?.destroy();obj.ritualSparks?.destroy();obj.ritualLight=null;obj.ritualRune=null;obj.ritualSparks=null;obj.ritualKind=null;}
export function playRitualCast(scene,u,obj){
 const now=scene.time?.now||0,kind=u.hero==='dark-elf'&&u.martialPose==='moon-chant'?'moon':u.hero==='samurai-commander'&&!u.dualSwords&&u.martialPose==='single-summon'?'sword':null;
 const active=kind&&u.castAnim>0&&u.hp>0&&!(u.stun>0);
 if(!active&&(!obj.ritualKind||u.hp<=0||u.stun>0)){clearRitualActor(obj);return false;}
 if(!prepareRitualArt(scene)||!prepareKatanaArt(scene)||!prepareMoonfallArt(scene))return false;
 if(active){obj.ritualKind=kind;obj.ritualEnding=false;obj.refreshCastCount=u.castCount;obj.refreshCastUntil=0;obj.refreshCastRestart=false;}
 else if(!obj.ritualEnding){obj.ritualEnding=true;obj.ritualRecoveryEnd=now+120;}
 if(!active&&now>=obj.ritualRecoveryEnd){clearRitualActor(obj);return false;}
 const mode=obj.ritualKind,progress=active?Math.max(0,Math.min(1,1-u.castAnim/(u.castDuration||(mode==='moon'?1.5:1)))):1;
 const frame=active?(progress<.12?0:progress<.3?1:progress<.5?2:progress<.93?3:4):5,row=(mode==='moon'?0:2)+((u.level||1)>=16?1:0),ratio=RITUAL_ACTOR_ROWS[row].bodyRatio;
 obj.sprite.anims.stop();obj.sprite.setTexture('ritual-actor:'+row,frame).setOrigin(.5,218/224).setScale(obj.size/(224*ratio)).setFlipX((u.face||1)<0);obj.attackRestart=false;
 const lightKey=mode==='moon'?'moonfall:corona':'katana-summon:light',circleKey=mode==='moon'?'moonfall:corona':'katana-summon:circle';
 obj.ritualLight||=scene.add.image(0,0,lightKey).setDepth(2710);obj.ritualRune||=scene.add.image(0,0,circleKey).setDepth(4);obj.ritualSparks||=scene.add.graphics().setDepth(2711);
 const x=obj.sprite.x,y=obj.groundY??obj.sprite.y,face=u.face||1,h=obj.size,px=x+face*h*(mode==='moon'?.32:.26),py=y-h*(mode==='moon'?.75:.65),alpha=active?.55+progress*.4:Math.max(0,(obj.ritualRecoveryEnd-now)/120)*.5;
 obj.ritualLight.setTexture(lightKey).setPosition(px,py).setDisplaySize(mode==='moon'?48:38,mode==='moon'?56:42).setAlpha(alpha);
 obj.ritualRune.setTexture(circleKey).setPosition(x,y+2).setDisplaySize(88,42).setAlpha(alpha*.7);
 const g=obj.ritualSparks;g.clear();for(let i=0;i<12;i++){const a=i*2.399,travel=1-((now/900+i/12)%1),r=8+travel*32;g.fillStyle(mode==='moon'?0xd6afff:0xffe5a6,(1-travel)*alpha).fillRect(px+Math.cos(a)*r,py+Math.sin(a)*r*.65,2,2);}
 return true;
}
export function handleRitualEvent(scene,e){
 if(e.type!=='martial-vfx'||!['sword-summon','sword-descend','sword-impact'].includes(e.action))return false;
 if(e.action==='sword-summon')return true;
 if(!prepareKatanaArt(scene))return true;
 scene.ritualFX||=[];if(scene.ritualFX.length>=30){const old=scene.ritualFX.shift();old.images.forEach(i=>i.destroy());}
 const images=e.action==='sword-descend'?[scene.add.image(e.x,e.y,'katana-summon:blade').setOrigin(.5,1).setDepth(2708),scene.add.image(e.x,e.y,'katana-summon:circle').setDepth(4)]:[scene.add.image(e.x,e.y,'katana-summon:impact').setOrigin(.5,.76).setDepth(2709)];
 scene.ritualFX.push({e,images,age:0,duration:e.duration||(e.action==='sword-descend'?.45:.75)});return true;
}
export function updateRitualFX(scene,dt){scene.ritualFX=(scene.ritualFX||[]).filter(v=>{v.age+=dt;const t=Math.min(1,v.age/v.duration),r=v.e.radius||195;
 if(v.e.action==='sword-descend'){v.images[0].setPosition(v.e.x,v.e.y-260*(1-t*t)).setDisplaySize(98,260).setAlpha(.65+Math.min(1,t*5)*.35);v.images[1].setDisplaySize(r*2.05,r*1.1).setAlpha(.6);}
 else v.images[0].setDisplaySize(r*(2.15+Math.min(1,t*5)*.3),r*(1.55+Math.min(1,t*5)*.2)).setAlpha(1-t*t);
 if(t>=1){v.images.forEach(i=>i.destroy());return false;}return true;});}
export function clearRitualFX(scene){for(const v of scene.ritualFX||[])v.images.forEach(i=>i.destroy());scene.ritualFX=[];}
