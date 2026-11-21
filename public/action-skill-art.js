import {acquireSkillImage} from './skill-image-pool.js';
import {SECONDARY_ROLES,secondaryVisible} from './render-budget.js';
import {elementAnimationFrame,arcticAnimationFrame,arcticDimensions,preloadElementAnimations,arcticShardTexture,arcticGustTexture,arcticRoundFrame} from './element-animation.js';
import {cleanEffectTexture} from './effect-alpha.js';
import {ACTION_LAYOUT} from './action-fx-layout.js';
export const ACTION_FX=['water-ring','water-foam','blizzard-sweep','snow-flake','lightning-bolt','fire-tuft','lava-pool','storm-ground','frost-ground','storm-wisp','spell-circle','ice-tornado','volley-arrow','volley-impact','poison-vapor','archer-q'];
const TAU=Math.PI*2,fract=n=>n-Math.floor(n),clamp=n=>Math.max(0,Math.min(1,n));
export const RAIN_ARROW_COUNT=1000;
export function rainImpactPoolCount(e){return Math.min(RAIN_ARROW_COUNT,Math.max(96,Math.ceil(RAIN_ARROW_COUNT*.34/Math.max(.1,(e.fieldRemaining||5)-.17))+4));}
export function rainImpactArrowIndex(e,age,slot){const step=Math.max(.1,(e.fieldRemaining||5)-.17)/(RAIN_ARROW_COUNT-1);return Math.max(0,Math.floor((age-.325)/step))+slot;}
const key=id=>'action-fx:'+id;
const textureCaches=new WeakMap();
function texture(s,id){let cache=textureCaches.get(s);if(!cache){cache=new Map();textureCaches.set(s,cache);}if(!cache.has(id))cache.set(id,cleanEffectTexture(s,key(id),{columns:1,rows:1,matteFloor:22,maxSize:512}));return cache.get(id);}
export function preloadActionSkills(s){preloadElementAnimations(s);for(const id of ACTION_FX)s.load.image(key(id),'/assets/combat/'+(id==='poison-vapor'?'gear-glows':'action-v1')+'/'+(id==='lightning-bolt'?'lightning-bolt-v2':id)+'.png');}
export function createArcherQProjectile(s,e){
 if(e.skill!=='multishot'||!s.textures?.exists(key('archer-q')))return null;
 const l=ACTION_LAYOUT['archer-q'],images=[];
 for(let i=2;i>=0;i--){const image=s.add.image(-i*9,0,texture(s,'archer-q')).setOrigin(l.cx,l.cy).setDisplaySize((58-i*5)/l.width,(14-i*2)/l.height).setAlpha(i?.16:.98);if(e.poisonEnchanted)image.setTint?.(0xb8ff83);images.push(image);}
 return images;
}
export function actionKind(e){return e.type==='tide-wave'?'wave':e.type==='aoe'&&e.skill==='multishot'?(e.action==='arrow-hit'?'q-hit':'q-release'):e.type==='aoe'&&e.skill==='arrow-rain'?'rain':e.skill==='blizzard'?'snow':e.skill==='tempest'?'storm':e.skill==='thunderstrike'?'bolt':e.skill==='flamefield'?'fire':null;}
export function createActionSkill(s,e){
 const kind=actionKind(e);if(!kind||!ACTION_FX.every(id=>s.textures?.exists(key(id))))return null;
 const nodes=[];
 function add(id,role,count,depth=2501){const layout=ACTION_LAYOUT[id],tx=texture(s,id);for(let i=0;i<count;i++){const image=acquireSkillImage(s,e.x,e.y,tx).setDepth(depth).setOrigin(layout.cx,layout.cy);if(e.poisonEnchanted&&role==='rain-arrow')image.setTint?.(0xb5ff7b);nodes.push({id,role,i,image,layout,wscale:1/layout.width,hscale:1/layout.height,spawn:role==='rain-arrow'?i/(RAIN_ARROW_COUNT-1)*Math.max(.1,(e.fieldRemaining||5)-.17)-.48:0});}}
 if(kind==='wave'){add('water-ring','crest',2);add('water-foam','foam',16);}
 if(kind==='snow'){add('spell-circle','ritual',1,24);add('ice-tornado','arctic-canopy',1);add('ice-tornado','ice-tornado',5);add('snow-flake','ice-fragment',28);add('frost-ground','frost-zone',1,23);add('blizzard-sweep','gust',8);add('snow-flake','snow',144);add('snow-flake','streak',72);add('snow-flake','frost',4,24);}
 if(kind==='storm'){add('spell-circle','ritual',1,24);add('storm-ground','storm-zone',1,23);add('storm-wisp','storm-cloud',3,2498);add('storm-wisp','storm-wind',3,2499);}
 if(kind==='storm'||kind==='bolt'){add('lightning-bolt','bolt',kind==='storm'?12:1);add('lightning-bolt','contact',kind==='storm'?36:6,25);}
 if(kind==='bolt'){add('storm-wisp','strike-cloud',2,2499);add('storm-wisp','strike-cloud-flash',1,2500);}
 if(kind==='q-release')add('archer-q','q-release',3);
 if(kind==='q-hit'){add('volley-impact','q-hit',1);if(e.poisonEnchanted)add('poison-vapor','q-poison',2);}
 if(kind==='fire'){add('lava-pool','lava',1,23);add('fire-tuft','flame',6,25);add('fire-tuft','ember',8);}
 if(kind==='rain'){add('volley-arrow','rain-arrow',RAIN_ARROW_COUNT);add('volley-impact','rain-impact',rainImpactPoolCount(e),25);if(e.poisonEnchanted)add('poison-vapor','rain-poison',24,26);}
 return {isolatedKind:kind,nodes,secondaryCount:nodes.filter(n=>SECONDARY_ROLES.has(n.role)).length,image:nodes[0].image,parts:nodes.slice(1).map(n=>n.image)};
}
export function stormBoundPoint(e,x,y,extent=0){const limit=Math.max(0,(e.radius||205)-extent-4),dx=x-e.x,dy=y-e.y,d=Math.hypot(dx,dy),scale=d>limit?limit/d:1;return {x:e.x+dx*scale,y:e.y+dy*scale};}
export function snowMotion(e,age,i){
 const r=e.radius||205,phase=fract(age*(2.5+i%3*.18)+i*.618),a=i*2.399-age*(4.8+i%4*.36),d=r*Math.sqrt(fract(i*.381+.13))*(.72+.17*Math.sin(age*2+i));
 const pos=stormBoundPoint(e,e.x+Math.cos(a)*d+Math.sin(age*2+i)*7,e.y+Math.sin(a)*d*.83-(1-phase)*75,18);return {...pos,phase};
}
export function strikeMotion(age,i){const clock=age/1.05+i*.263;return {cycle:Math.floor(clock),phase:fract(clock)};}
export function arrowRainMotion(e,age,i){
 const duration=e.fieldRemaining||5,flight=.48+i%4*.035,spawn=i/(RAIN_ARROW_COUNT-1)*Math.max(.1,duration-.17)-.48,local=age-spawn,fall=clamp(local/flight),a=i*2.399,r=(e.radius||190)*Math.sqrt((i%30+.5)/30)*.96;
 const x=e.x+Math.cos(a)*r,y=e.y+Math.sin(a)*r,height=205*(1-fall),sway=Math.sin(fall*Math.PI*1.6+i*.7)*30*Math.sin(fall*Math.PI)*(1-fall);
 return {x,y,fall,local,landed:local>=flight,impact:clamp((local-flight)/.22),drawX:x-height*.24+sway,drawY:y-height,angle:-.23+Math.cos(fall*Math.PI*1.6+i*.7)*.14*(1-fall)};
}
export function updateActionSkill(s,v,t){
 const p=v.painted;if(!p?.isolatedKind)return false;
 const e=v.e,r=e.radius||v.radius||150,age=v.age,fade=clamp((1-t)*7),birth=clamp(age*7);
 let secondaryIndex=0;
 for(const n of p.nodes){
  const {image,role,i,layout,wscale,hscale}=n;
  if(SECONDARY_ROLES.has(role)){
   const hidden=!secondaryVisible(secondaryIndex++,s.secondaryFXRatio??1);
   if(hidden!==!!n.budgetHidden){image.setVisible?.(!hidden);n.budgetHidden=hidden;}
   if(hidden)continue;
  }
  if(role==='rain-arrow'){if(age<n.spawn){if(!n.hidden){image.setAlpha(0);n.hidden=true;}continue;}if(n.planted){if(n.lastFade!==fade){image.setAlpha(fade*.72*.94);n.lastFade=fade;}continue;}}
  if(role==='q-release'){
   const a=(e.angle||0)+(i-1)*.15,d=14+clamp(age/.22)*20;
   image.setPosition(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d).setDisplaySize(40*wscale,11*hscale).setRotation(a).setAlpha(clamp(1-age/.28)*.58);image.setTint?.(e.poisonEnchanted?0xb8ff83:0xffefd0);
  }else if(role==='q-hit'){
   image.setOrigin(layout.cx,layout.foot).setPosition(e.x,e.y).setDisplaySize((18+age*35)*wscale,(14+age*20)*hscale).setRotation(0).setAlpha(clamp(1-age/.35)*.95);image.setTint?.(e.poisonEnchanted?0xb8ff83:0xffefd0);
  }else if(role==='q-poison'){
   image.setPosition(e.x+(i?8:-8),e.y-age*28).setDisplaySize(24*wscale,30*hscale).setRotation(Math.sin(age*3+i)*.15).setAlpha(Math.sin(clamp(age/.7)*Math.PI)*.5);
  }else if(role==='strike-cloud'||role==='strike-cloud-flash'){
   const flash=role==='strike-cloud-flash',pulse=Math.sin(clamp(t/.7)*Math.PI)**4;
   image.setPosition(e.x+(flash?0:(i-.5)*24)+Math.sin(age*3+i)*3,e.y-154+(flash?0:i*5)).setDisplaySize((flash?83:78)*wscale,(flash?27:30)*hscale).setRotation(Math.sin(age*2+i)*.035).setAlpha(fade*birth*(flash?pulse*.75:.66));
   image.setTint?.(flash?0xdaf1ff:0x8293bd);image.setBlendMode?.(flash?'ADD':'NORMAL');
  }else if(role==='rain-arrow'){
   const pos=arrowRainMotion(e,age,i),land=pos.landed,opacity=pos.local<0?0:land?.72:clamp(pos.local*18);
   image.setOrigin(layout.cx,layout.foot).setPosition(pos.drawX,pos.drawY).setDisplaySize((land?2.5:4)/layout.width,(land?11:26+i%3*2.5)/layout.height).setRotation(land?-.12+Math.sin(i)*.12:pos.angle).setAlpha(fade*opacity*.94).setDepth(land?27:2501+pos.y*.001);
   if(land){n.planted=true;n.lastFade=fade;}
  }else if(role==='rain-impact'){
   const arrow=rainImpactArrowIndex(e,age,i),pos=arrow<RAIN_ARROW_COUNT?arrowRainMotion(e,age,arrow):null,impact=pos?.impact||0,size=8+impact*14;
   if(impact<=0||impact>=1){if(!n.hidden){image.setAlpha(0);n.hidden=true;}continue;}n.hidden=false;
   image.setOrigin(layout.cx,layout.foot).setPosition(pos.x,pos.y).setDisplaySize(size*wscale,size*.46*hscale).setRotation(0).setAlpha(birth*fade*Math.sin(impact*Math.PI)*.86);
   image.setTint?.(e.poisonEnchanted?0xb4ff77:0xffe9b4);
  }else if(role==='rain-poison'){
   const pos=arrowRainMotion(e,age,i+9),phase=fract(age*.85+i*.371);
   image.setPosition(pos.x+Math.sin(age*3+i)*4,pos.y-phase*30).setDisplaySize((15+phase*15)*wscale,(19+phase*21)*hscale).setRotation(Math.sin(age+i)*.12).setAlpha(birth*fade*Math.sin(phase*Math.PI)*.36);
  }else if(role==='ritual'){
   image.setBlendMode?.('ADD');image.setPosition(e.x,e.y).setDisplaySize(r*2*wscale,r*2*hscale).setRotation(age*(p.isolatedKind==='storm'?.15:-.12)).setAlpha(fade*birth*.76);image.setTint?.(p.isolatedKind==='storm'?0xd7d2ff:0xd0f5ff);
  }else if(role==='ice-tornado'){
   const phase=fract(age*.62+i/5),a=i*2.399+age*.95,frame=arcticAnimationFrame(s,age+i*.13),width=50+phase*45,w=width/.7,h=width*1.15/.7,extent=Math.hypot(w,h)/2,d=Math.max(0,r-extent-8)*phase;
   image.setTexture(frame.key,frame.frame).setOrigin(.5,.5).setPosition(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d*.8).setDisplaySize(w,h).setRotation(Math.sin(age*13+i)*.075).setAlpha(fade*birth*Math.sin(phase*Math.PI)*.68);
  }else if(role==='arctic-canopy'){
   const frame=arcticRoundFrame(s,age),diameter=r*2/.86;image.setTexture(frame.key,frame.frame).setOrigin(.5,.5).setPosition(e.x,e.y).setDisplaySize(diameter,diameter).setDepth(2497).setRotation(-age*.35).setAlpha(fade*birth*.28);
  }else if(role==='ice-fragment'){
   const phase=fract(age*(.55+i%3*.09)+i*.381),a=i*2.399-age*(4.2+i%4*.35),size=25+(i%4)*9,d=(r-size*.72-8)*(.25+phase*.73),pos=stormBoundPoint(e,e.x+Math.cos(a)*d,e.y+Math.sin(a)*d*.83-Math.sin(phase*TAU)*8,size*.72);
   image.setTexture(arcticShardTexture(s)).setOrigin(.5,.5).setPosition(pos.x,pos.y).setDisplaySize(size,size).setRotation(a+age*2).setDepth(Math.sin(a)>0?2503:2498).setAlpha(fade*birth*(.55+Math.sin(phase*Math.PI)*.4));
  }else if(role==='lava'){
   const frame=elementAnimationFrame(s,2,age);image.setTexture(frame.key,frame.frame).setPosition(e.x,e.y).setDisplaySize(r*2/.72,r*2/.72).setRotation(0).setAlpha(fade*birth*.92);
  }else if(role==='storm-zone'||role==='frost-zone'){
   image.setPosition(e.x,e.y).setDisplaySize(r*2*wscale,r*2*hscale).setRotation(0).setAlpha(fade*birth*(role==='storm-zone'?.5:.42));
  }else if(role==='storm-cloud'){
   const a=i*2.399-age*(.28+i*.035),d=r*(.28+i*.2),width=82+i*15;
   image.setPosition(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d*.8-65-Math.sin(age*.8+i)*8).setDisplaySize(width*wscale,(25+i*3)*hscale).setRotation(Math.sin(age*.5+i)*.07).setAlpha(fade*birth*(.35+.06*Math.sin(age*1.3+i)));
  }else if(role==='storm-wind'){
   const a=i*2.399+1-age*.75,d=r*(.38+i*.16),width=104+i*14;
   image.setPosition(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d*.8-22).setDisplaySize(width*wscale,9*hscale).setRotation(a-Math.PI/2).setAlpha(fade*birth*(.3+.05*Math.sin(age*3+i)));
  }else if(role==='crest'){
   const radius=Math.max(1,r*t-i*5),size=radius*2;
   image.setPosition(e.x,e.y).setDisplaySize(size*wscale,size*hscale).setRotation(age*(i?-.12:.08)).setAlpha(fade*birth*(i?.42:.98));
  }else if(role==='foam'){
   const a=i*2.399+age*.3,rad=r*t+Math.sin(i*3+age*15)*3,size=14+i%3*4,hop=Math.sin(t*Math.PI)*(4+i%3*3);
   image.setPosition(e.x+Math.cos(a)*rad,e.y+Math.sin(a)*rad-hop).setDisplaySize(size*wscale,size*.65*hscale).setRotation(a+Math.PI/2).setAlpha(fade*birth*(.6+i%3*.12));
  }else if(role==='gust'){
   const a=i*2.399-age*(3.8+i%3*.45),d=r*(.08+i%2*.06),size=r*(1+i%3*.3),wobble=Math.sin(age*8+i)*.06;
   image.setTexture(arcticGustTexture(s)).setOrigin(.5,.5).setPosition(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d*.83-6).setDisplaySize(size,size*.9).setRotation(a+wobble).setAlpha(fade*birth*(.44+.12*Math.sin(age*4+i)**2));
  }else if(role==='snow'){
   const pos=snowMotion(e,age,i),size=i%9===0?15:6+i%4*2;
   image.setPosition(pos.x,pos.y).setDisplaySize(size*wscale,size*hscale).setRotation(age*(i%2?1.2:-.8)+i).setAlpha(fade*birth*Math.sin(pos.phase*Math.PI)*(.6+i%3*.12));
  }else if(role==='streak'){
   const pos=snowMotion(e,age*1.45,i+97),size=11+i%3*3;image.setPosition(pos.x,pos.y).setDisplaySize(size*wscale,3*hscale).setRotation(Math.atan2((pos.y-e.y)*1.2,pos.x-e.x)-Math.PI/2).setAlpha(fade*birth*Math.sin(pos.phase*Math.PI)*.8);
  }else if(role==='frost'){
   const a=i*2.399,d=r*(.4+i%2*.22),size=22+i%2*6;
   image.setPosition(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d*.8).setDisplaySize(size*wscale,size*.7*hscale).setRotation(i).setAlpha(fade*birth*.3);
  }else if(role==='bolt'){
   const motion=p.isolatedKind==='bolt'?{cycle:0,phase:.2+t*.7}:strikeMotion(age,i),{cycle,phase}=motion,a=i*2.399+cycle*1.73,d=p.isolatedKind==='bolt'?0:r*(.2+fract(i*.37+cycle*.19)*.55),h=p.isolatedKind==='bolt'?185:170+i%2*20;
   const strike=phase<.18?0:phase<.23?clamp((phase-.18)/.025):clamp((.43-phase)/.2);
   image.setBlendMode?.('ADD');image.setTint?.(0xe6faff);image.setOrigin(layout.cx,layout.foot).setPosition(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d*.83).setDisplaySize(h*(p.isolatedKind==='bolt'?.58:.5)*wscale,h*hscale).setRotation(Math.sin(cycle*4+i)*.035).setAlpha(fade*strike*.98);
  }else if(role==='contact'){
   const bolt=p.isolatedKind==='bolt'?0:Math.floor(i/3),motion=p.isolatedKind==='bolt'?{cycle:0,phase:.2+t*.7}:strikeMotion(age,bolt),{cycle,phase}=motion;
   const a=bolt*2.399+cycle*1.73,d=p.isolatedKind==='bolt'?0:r*(.2+fract(bolt*.37+cycle*.19)*.55),spread=clamp((phase-.21)/.35),angle=i*2.399+cycle*.8;
   const pulse=phase<.21?0:Math.sin(spread*Math.PI),length=14+spread*(p.isolatedKind==='bolt'?66:52);
   // Three drawn electric branches spread from each actual bolt contact, on the ground plane.
   image.setBlendMode?.('ADD');image.setTint?.(0xc9f7ff);
   image.setOrigin(layout.cx,layout.foot).setPosition(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d*.83).setDisplaySize((9+spread*10)*wscale,length*hscale).setRotation(angle).setAlpha(fade*pulse*.95);
  }else if(role==='flame'){
   const a=i*2.399,d=i===0?0:r*Math.sqrt(i/10)*.76,w=62+i%3*12,h=28+Math.sin(age*(7+i%3)+i)*5;
   image.setOrigin(layout.cx,layout.foot).setPosition(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d*.91).setDisplaySize(w*wscale,h*hscale).setRotation(Math.sin(age*3+i)*.025).setAlpha(fade*birth*.88);
  }else if(role==='ember'){
   const a=i*2.399,phase=fract(age*(.7+i%2*.1)+i*.371),d=r*(.2+i%3*.2);
   image.setPosition(e.x+Math.cos(a)*d+Math.sin(age*4+i)*4,e.y+Math.sin(a)*d*.85-phase*38).setDisplaySize(5*wscale,7*hscale).setRotation(0).setAlpha(fade*birth*(1-phase)*.65);
  }
 }
 return true;
}

export function createSpellCircle(s,e){
 if(!['meteor-fall','meteor-impact','skill-channel'].includes(e.type)||e.type==='skill-channel'&&!['meteor','tempest'].includes(e.skill)||!s.textures?.exists(key('spell-circle')))return null;
 const image=s.add.image(e.x,e.y,texture(s,'spell-circle')).setDepth(24);image.setBlendMode?.('ADD');image.setTint?.(e.skill==='tempest'?0xd7d2ff:0xffd6a1);return image;
}
export function updateSpellCircle(s,v,t){
 const image=v.rune;if(!image)return;const e=v.e,l=ACTION_LAYOUT['spell-circle'],owner=e.type==='skill-channel'?s.actorObjects?.get(e.sourceId):null,r=e.type==='skill-channel'?42:e.radius||205;
 image.setOrigin(l.cx,l.cy).setPosition(owner?.sprite?.x??e.x,owner?.groundY??e.y).setDisplaySize(r*2/l.width,r*2/l.height).setRotation(v.age*.16).setAlpha(Math.min(1,v.age*8,(1-t)*8)*.88);
}
