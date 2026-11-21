import {emitFloatingText,updateFloatingTexts,clearFloatingTexts} from './floating-text-pool.js';
import {renderViews,effectInView,setRenderDormant,prepareEffectBudget} from './render-budget.js';
import {meteorEvent,updateMeteors,clearMeteors} from './meteor-painted.js';
import {handleRitualEvent,updateRitualFX,clearRitualFX,clearRitualActor} from './ritual-casting-art.js';
import {registerActorBody} from './actor-body-registration.js';
import {updateGuardianEffects} from './guardian-actions-art.js';
import {applyAscended} from './ascended-art.js';
import {updateClassProgression} from './class-progression-art.js';
import {createElementalVisual,updateElementalVisual} from './elemental-art.js';
import {createSpellCircle,updateSpellCircle,createArcherQProjectile} from './action-skill-art.js';
import {createPaintedSkill,updatePaintedSkill,destroyPaintedSkill,updatePaintedBody} from './painted-skill-art.js';
import {updateGearEmission} from './gear-emission.js';
import {drawFireRegion,drawStormStrike,drawMageOrbit,drawChannelPixels} from './pixel-skill-art.js';
import {updateRavagerBladeGlow} from './ravager-art.js';
import {createSlashVisual,updateSlashVisual,destroySlashVisual,drawSignatureSlash} from './slash-art.js';
import {CLASS_SKILLS,drawClassPulse,drawElementProjectile,drawPixelBeam,drawPixelMeteor,drawPixelBlizzard,drawTideEffect,drawCastWeapon,drawMartialEffect,drawMartialState,drawArrowStorm} from './class-effects.js';
import {drawUnitAuraBuffs,ensureAuraFrames,clearUnitAuraSprites,syncSustainedFieldRims,destroyFieldRims} from './aura-vfx.js';
import {CLASS_ART} from './class-art.js';
import {addWindVFX,updateWindVFX,clearWindVFX} from './wind-vfx.js';
import {addVanguardVFX,updateVanguardVFX,clearVanguardVFX} from './vanguard-vfx.js';
import {addFallenVFX,updateFallenVFX,clearFallenVFX} from './fallen-vfx.js';
import {addHolyStrike,updateHolyStrikes,clearHolyStrikes} from './holy-vfx.js';
import {addShadowVFX,updateShadowVFX,clearShadowVFX} from './shadow-vfx.js';
import {drawMonsterProjectile,drawMonsterHit,drawBossBuff} from './enemy-spell-art.js';
import {drawRelicPickup} from './relic-vfx.js';
import {addBossVFX,updateBossVFX,clearBossVFX} from './boss-vfx.js';
import {ENEMY_FAMILIES} from './enemy-families.js';
const TAU=Math.PI*2;
const colorOf=e=>e.color??(e.fx?.includes('fire')||e.fx==='explosion'?0xffb05e:e.fx?.includes('water')?0x9beaff:e.fx?.includes('lightning')?0xb2e6ff:0xdbe9b2);
function remember(s,record){s.liveVFX||=[];if(s.liveVFX.length>=180){const old=s.liveVFX.shift();old.rune?.destroy();destroyPaintedSkill(old.impactGround);destroyPaintedSkill(old);destroySlashVisual(old.slash);old.elemental?.image.destroy();destroyFieldRims(old.rimSprites,'tide');for(const key of ['g','body','rock','overlay','label'])old[key]?.destroy();}record.rune=createSpellCircle(s,record.e);if(record.e.type==='meteor-impact')record.impactGround={e:{...record.e,action:'quake-land'},age:0,painted:createPaintedSkill(s,{e:{...record.e,action:'quake-land'}})};record.painted=createPaintedSkill(s,record);record.elemental=createElementalVisual(s,record);s.liveVFX.push(record);return record;}
function spriteFX(s,key,x,y,size,alpha=.8){
 if(!s.anims.exists('fx:'+key))return null;const sprite=s.add.sprite(x,y,'fx:'+key).setDisplaySize(size,size).setAlpha(alpha).setDepth(2600).play('fx:'+key);sprite.once('animationcomplete',()=>sprite.destroy());return sprite;
}
function art(s,id,x,y,size,alpha=.7){
 if(!s.textures.exists('art:'+id))return null;const image=s.add.image(x,y,'art:'+id);return image.setDisplaySize(size,size*image.height/image.width).setAlpha(alpha).setDepth(2450);
}
function pulse(s,e,{duration=.75,particles=20,meteor=false}={}){
 const radius=e.radius||e.size/2||55,g=s.add.graphics().setDepth(2440),color=colorOf(e),points=Array.from({length:particles},(_,i)=>({angle:i/particles*TAU+Math.random()*.15,speed:.7+Math.random()*.8,size:2+Math.random()*4}));
 if(e.gem){e={...e,color:{fire:0xff8b44,ice:0x91e5ff,thunder:0xe7cb67,poison:0x97d66a,dark:0xb696ed,wind:0x8be4cf}[e.gem]};}
 const skill=e.skill||'',artId=meteor?'fireburst':['cleave','earthquake','arrow-rain','thunderstrike','tempest','multishot','shield-bash','bulwark','rally','fireburst','flamefield','frostnova','blizzard','healing-tide'].includes(skill)?skill:null;
 const auraBurstFrame={rally:20,'healing-tide':21,fury:23,bulwark:6}[skill];
 const overlay=auraBurstFrame!==undefined&&ensureAuraFrames(s,'class-auras-2')?s.add.image(e.x,e.y-8,'class-auras-2',auraBurstFrame).setDisplaySize(136,96).setAlpha(.92).setDepth(2450):artId&&!CLASS_SKILLS[skill]?art(s,artId,e.x,e.y,Math.min(radius*2.2,520),e.alpha??.7):null;
 if(overlay&&skill==='cleave')overlay.setRotation((e.angle||0)+Math.PI);
 if(!overlay&&e.fx&&!CLASS_SKILLS[skill])spriteFX(s,e.fx,e.x,e.y,Math.min(radius*2.1,480),.65);
 remember(s,{kind:'pulse',age:0,duration,g,overlay,e,radius,color:e.gem?e.color:color,points,meteor,spin:skill==='blizzard'?1.2:skill==='bladestorm'?2.8:0});
}
export function renderEvent(s,e,seen){
 if(seen.has(e.id))return;seen.add(e.id);if(seen.size>3000)seen.delete(seen.values().next().value);
 if(e.type==='passive-vfx'||e.type==='passive-action-fx'){remember(s,{kind:'passive',g:s.add.graphics(),e,age:0,duration:e.duration||.65});return;}
 if(handleRitualEvent(s,e))return;
 if(e.type==='martial-vfx'&&e.action==='leap-charge')return; // The axe anticipation is carried by the actor, not a ring left at takeoff.
 if(e.type==='martial-vfx'){if(e.action==='quake-land')s.cameras?.main?.shake?.(170,.005);const slash=createSlashVisual(s,e);remember(s,{kind:'martial',age:0,duration:e.duration||.5,g:s.add.graphics().setDepth(2500),e:{...e,slashArt:!!slash},slash});return;}
 if(e.type==='wind-vfx'){addWindVFX(s,e);return;}
 if(e.type==='vanguard-vfx'){addVanguardVFX(s,e);return;}
 if(e.type==='fallen-vfx'){addFallenVFX(s,e);return;}
 if(e.type==='holy-vfx'){if(['slash','strike','aura','q1','q2','q3','q3-charge'].includes(e.action)){addHolyStrike(s,e);return;}addShadowVFX(s,{...e,action:'holy-'+e.action,duration:e.action==='ascend'?1.1:.7,color:0xffefbb});return;}
 if(e.type==='shadow-vfx'){addShadowVFX(s,e);return;}
 if(e.type==='forest-leader-death'){const actor=s.add.sprite(e.x,e.y,e.sprite+':idle',30).setOrigin(.5,.95).setDisplaySize(e.size*1.18,e.size*1.18).setDepth(e.y);actor.play(e.sprite+':dead');actor.once('animationcomplete',()=>actor.destroy());return;}
 if(e.type==='boss-warning'||e.type==='boss-impact'||e.type==='enemy-summon'){if(e.forestLeader&&e.type==='boss-impact'){const points=e.points||[{x:e.x,y:e.y}];for(const point of points)addShadowVFX(s,{action:'forest-burst-'+e.family,x:point.x,y:point.y,radius:Math.min(140,e.radius||e.width||85),duration:.85,angle:e.angle,color:e.color});}addBossVFX(s,e);return;}
 if(e.type==='relic-pickup'){const label=s.add.text(e.x,e.y-48,e.text+' · VĨNH VIỄN',{fontFamily:'Segoe UI',fontSize:'12px',fontStyle:'bold',color:'#'+e.color.toString(16).padStart(6,'0'),stroke:'#15241f',strokeThickness:4}).setOrigin(.5).setDepth(3200);remember(s,{kind:'relic',g:s.add.graphics().setDepth(3000),label,e,age:0,duration:1.4});return;}
 if(e.family&&['effect','impact'].includes(e.type)){if(e.forestLeader)addShadowVFX(s,{action:'forest-burst-'+e.family,x:e.tx??e.x,y:e.ty??e.y,radius:32,duration:.45,color:e.color});remember(s,{kind:'monster-hit',g:s.add.graphics().setDepth(2500),e,age:0,duration:.5});return;}
 if(e.type==='projectile-hit'){const v=s.liveVFX?.find(v=>v.e.id===e.shotId);if(v){if(v.e.skill==='elf-piercer')addShadowVFX(s,{action:'arrow-hit',x:e.x,y:e.y,radius:42,angle:Math.atan2(v.e.ty-v.e.y,v.e.tx-v.e.x),color:0xc9b8ef});v.age=v.duration;v.body?.setVisible(false);}return;}
 if(e.type==='healing'){remember(s,{kind:'healing',g:s.add.graphics().setDepth(3000),e,age:0,duration:1,points:Array.from({length:12},(_,i)=>({x:(i%4-1.5)*14,y:Math.floor(i/4)*17,phase:i*.16}))});if(e.drainFrom)renderEvent(s,{id:e.id+':drain',type:'drain',x:e.drainFrom.x,y:e.drainFrom.y,tx:e.x,ty:e.y,color:0xdf728f},seen);renderEvent(s,{id:e.id+':amount',type:'dot',x:e.x,y:e.y-30,text:'+'+e.amount,color:0x6af18c},seen);return;}
 if(e.type==='assassin-vfx'){if(e.action==='double'||e.action==='flurry')addShadowVFX(s,{...e,action:'dagger',radius:90});remember(s,{kind:'assassin',g:s.add.graphics().setDepth(2600),e,color:e.color,age:0,duration:e.action==='veil'?.8:.32});return;}
 if(e.type==='gem-hit'){pulse(s,{...e,radius:22,fx:e.gem==='fire'?'fireball':e.gem==='ice'?'waterball':e.gem==='thunder'?'lightning':'poison'},{duration:.35,particles:5});return;}
 if(e.type==='melee-swing'){const identity=CLASS_ART[s.actorObjects?.get(e.sourceId)?.actor]?.classId,action=identity==='berserker'?'axe-cut':identity==='ravager'?'blood-cut':e.dual?'dual-cut':'heavy-cut',event={...e,action,basic:true,profile:identity==='guardian'?'holy':undefined},slash=createSlashVisual(s,event);remember(s,{kind:'swing',g:s.add.graphics().setDepth(2500),e:{...event,slashArt:!!slash},slash,age:0,duration:.25});return;}
 if(['gold','dot'].includes(e.type)){emitFloatingText(s,e,colorOf(e));return;}
 if(e.type==='projectile'){if(e.projectileType==='leaf')addShadowVFX(s,{...e,action:'leaf-cast',radius:35,duration:.45});
  if(e.silent)return;const g=s.add.graphics().setDepth(2550),body=s.add.container(e.x,e.y).setDepth(2600),shape=s.add.graphics(),color=colorOf(e);
  if(e.family){drawMonsterProjectile(shape,e.family,0,e.element);}
  else if(drawElementProjectile(shape,e)){}
  else if(e.gem&&e.skill!=='elf-piercer'){const c=color;shape.lineStyle(4,c,.2).lineBetween(-24,0,10,0);shape.lineStyle(2,c,1);if(e.gem==='thunder'){shape.beginPath().moveTo(-20,-3).lineTo(-3,-7).lineTo(-8,1).lineTo(15,-2).lineTo(0,9).lineTo(3,2).lineTo(-20,-3).strokePath();}else if(e.gem==='ice'){shape.fillStyle(c,.9).fillTriangle(17,0,-12,-7,-12,7).lineStyle(1,0xf0ffff,1).lineBetween(-12,0,12,0);}else if(e.gem==='wind'){shape.beginPath().arc(0,0,14,-1.1,1.1).strokePath();shape.lineStyle(1,0xd5fff5,.8).beginPath().arc(-6,0,14,-1,1).strokePath();}else if(e.gem==='fire'){shape.fillStyle(c,.9).fillCircle(3,0,9).fillTriangle(-24,-7,5,0,-24,7).fillStyle(0xffe2a0).fillCircle(5,0,4);}else if(e.gem==='poison'){shape.fillStyle(c,.8).fillCircle(3,0,9).fillCircle(-11,-3,4).fillCircle(-19,3,2).fillStyle(0xd8f18c,.9).fillCircle(5,-2,3);}else{shape.fillStyle(0x261638,.9).fillCircle(0,0,11).lineStyle(2,c,.9).strokeCircle(0,0,11).fillStyle(c,.65).fillCircle(0,0,5);}body.setScale(e.enhanced?1.25:1);}
  else if(e.skill==='elf-piercer'){const half=(e.aoeWidth||90)/2;shape.lineStyle(half*2,color,.12).lineBetween(-90,0,22,0).lineStyle(half,color,.25).lineBetween(-65,0,30,0).fillStyle(color,.9).fillTriangle(65,0,5,-half,5,half).fillStyle(0xf5edff,1).fillTriangle(58,0,8,-10,8,10).lineStyle(5,0xe7d7ff,.9).lineBetween(-85,0,25,0).lineStyle(2,color,.7).lineBetween(-55,-half*.65,5,-half*.65).lineBetween(-55,half*.65,5,half*.65);}
  else if(['moon-arrow','leaf'].includes(e.projectileType)){shape.lineStyle(8,color,.12).lineBetween(-28,0,10,0).lineStyle(2,color,1).lineBetween(-23,0,12,0);shape.fillStyle(color,.95);if(e.projectileType==='leaf')shape.fillEllipse(0,0,25,9);else shape.fillTriangle(19,0,7,-6,7,6);shape.lineStyle(1,0xf1eaff,.9).lineBetween(-18,-4,-11,0).lineBetween(-18,4,-11,0);}
  else if(e.projectileType==='arrow'){shape.lineStyle(5,color,.18).lineBetween(-19,0,12,0);shape.lineStyle(2,color,1).lineBetween(-19,0,10,0);shape.fillStyle(color).fillTriangle(16,0,6,-4,6,4);shape.lineStyle(1,0xfff0c4,.8).lineBetween(-18,-4,-12,0).lineBetween(-18,4,-12,0);}
  else {shape.fillStyle(color,.1).fillCircle(0,0,18);shape.fillStyle(color,.25).fillCircle(0,0,12);shape.fillStyle(color,.95).fillCircle(0,0,7);shape.fillStyle(0xffffff,.9).fillCircle(-2,-2,3);}
  let moonArrow;if(e.skill==='elf-piercer'&&s.textures.exists('moon-arrow-q')){const tx=s.textures.get('moon-arrow-q'),im=tx.getSourceImage(),cw=im.width/6,sy=Math.round(im.height*.25),sh=Math.floor(im.height*.48);for(let i=0;i<6;i++)if(!tx.has(i))tx.add(i,0,Math.round(i*cw)+4,sy,Math.floor(cw)-8,sh);moonArrow=s.add.image(-10,0,'moon-arrow-q',2).setOrigin(.88,.5).setDisplaySize(190,190*sh/(cw-8));shape.setAlpha(.22);body.add(moonArrow);}
  body.add(shape);const archerQ=createArcherQProjectile(s,e);if(archerQ){shape.setVisible(false);body.add(archerQ);}if(e.skill==='venom'&&s.textures.exists('art:venom')){shape.setVisible(false);const arrow=s.add.image(0,0,'art:venom');arrow.setDisplaySize(66,66*arrow.height/arrow.width);body.add(arrow);}
  remember(s,{kind:'projectile',g,body,e,color,age:0,duration:e.duration||.4,moonArrow,points:[],last:{x:e.x,y:e.y}});return;
 }
 if(meteorEvent(s,e))return;
 if(e.type==='warning'){remember(s,{kind:'warning',age:0,duration:e.duration||.4,g:s.add.graphics().setDepth(20),e,color:colorOf(e)});return;}
 if(['tide-wave','tide-field','tide-lift'].includes(e.type)){remember(s,{kind:'tide',age:0,duration:e.duration||.6,g:s.add.graphics().setDepth(e.type==='tide-field'?3:2500),rimSprites:e.type==='tide-field'?new Map():null,e});return;}
 if(e.type==='aoe'&&e.skill==='arrow-rain'){const storm=s.liveVFX?.find(v=>v.kind==='arrowstorm'&&Math.hypot(v.e.x-e.x,v.e.y-e.y)<12&&v.e.sourceId===e.sourceId);if(storm){storm.duration=Math.max(storm.duration,storm.age+(e.fieldRemaining??.3));return;}remember(s,{kind:'arrowstorm',age:0,duration:e.fieldRemaining??5,g:s.add.graphics().setDepth(2550),e,radius:e.radius||190});return;}
 if(e.type==='skill-channel'){remember(s,{kind:'channel',age:0,duration:e.duration,g:s.add.graphics().setDepth(2500),e});return;}
 if(e.type==='aoe'&&['flamefield','tempest'].includes(e.skill)){
  const kind=e.skill==='flamefield'?'fire-region':'storm-region',existing=s.liveVFX?.find(v=>v.kind===kind&&v.e.sourceId===e.sourceId&&Math.hypot(v.e.x-e.x,v.e.y-e.y)<16);
  const life=e.fieldRemaining??1.05;
  if(existing){existing.duration=Math.max(existing.duration,existing.age+life);return;}
  remember(s,{kind,age:0,duration:life,g:s.add.graphics().setDepth(kind==='fire-region'?25:2500),e,radius:e.radius||150});return;
 }
 if(e.type==='aoe'&&e.skill==='blizzard'){
  const existing=s.liveVFX?.find(v=>v.kind==='blizzard'&&Math.hypot(v.e.x-e.x,v.e.y-e.y)<8);
  if(existing){existing.duration=Math.max(existing.duration,existing.age+(e.fieldRemaining??e.previewDuration??1.15));return;}
  remember(s,{kind:'blizzard',age:0,duration:e.fieldRemaining??e.previewDuration??1.15,g:s.add.graphics().setDepth(2500),e,radius:e.radius||e.size/2||205});return;
 }
 if(e.type==='aoe'){pulse(s,e,{duration:e.previewDuration||(e.skill==='blizzard'||e.skill==='flamefield'?1.05:.8),particles:e.radius>100?24:12});return;}
 if(e.type==='aura'||e.type==='heal'){pulse(s,{...e,fx:null,radius:e.skill==='rally'&&(e.radius||0)>120?e.radius:Math.min(e.radius||e.size/2||60,90)},{duration:e.skill==='rally'?.95:.8,particles:e.skill==='rally'?24:10});return;}
 if(e.type==='impact'||e.type==='enemy-death'){pulse(s,{...e,radius:Math.min(e.radius||30,110)},{duration:.45,particles:e.radius>60?18:7});return;}

 if(e.type==='lightning'||e.type==='drain'||e.type==='trail'||e.type==='bolt'){
  remember(s,{kind:'beam',age:0,duration:e.type==='drain'?.45:.24,g:s.add.graphics().setDepth(2550),e,color:colorOf(e)});if(e.type==='lightning'&&!CLASS_SKILLS[e.skill])spriteFX(s,'bolt-strike-2',e.tx,e.ty-45,110,.65);return;
 }
 if(e.type==='effect'){spriteFX(s,e.fx||'wind',e.x,e.y,e.size||90,.8);}
}
export function updateVFX(s,dt){updateFloatingTexts(s,dt);const views=renderViews(s);prepareEffectBudget(s,views);updateMeteors(s,dt);
 updateRitualFX(s,dt);
 updateWindVFX(s,dt);updateVanguardVFX(s,dt);updateFallenVFX(s,dt);updateHolyStrikes(s,dt);updateShadowVFX(s,dt);updateBossVFX(s,dt);
 const alive=[];for(const v of s.liveVFX||[]){v.age+=dt;const t=Math.min(1,v.age/v.duration),fade=1-t,g=v.g;setRenderDormant(v,!effectInView(s,v,views));if(t<1&&!v.renderDormant){g?.clear();updateElementalVisual(s,v,t);updateSpellCircle(s,v,t);if(v.impactGround){v.impactGround.age=v.age;updatePaintedSkill(s,v.impactGround,Math.min(1,v.age/1.2));}
  if(updatePaintedSkill(s,v,t)){
   // Painted frame sequences replace the rejected geometric sketches.
  }else if(v.kind==='fire-region'){drawFireRegion(g,v.e,v.age,v.radius,Math.min(1,(v.duration-v.age)/.3));
  }else if(v.kind==='storm-region'){drawStormStrike(g,v.e,v.age,v.radius,Math.min(1,(v.duration-v.age)/.25));
  }else if(v.kind==='channel'){const owner=s.actorObjects?.get(v.e.sourceId)?.sprite;drawChannelPixels(g,{...v.e,x:owner?.x??v.e.x,y:owner?.y??v.e.y},t);
  }else if(v.kind==='arrowstorm'){drawArrowStorm(g,v.e,v.age,v.radius,Math.min(1,(v.duration-v.age)/.12));
  }else if(v.kind==='martial'){updateSlashVisual(v.slash,v.e,t);drawMartialEffect(g,v.e,t);
  }else if(v.kind==='tide'){drawTideEffect(g,v.e,t);if(v.rimSprites){const burstT=Math.min(1,v.age/.8),fade=Math.min(1,(1-t)*5);syncSustainedFieldRims(s,v.rimSprites,'tide',0,3,v.e.x,v.e.y,v.e.radius||520,2,v.age*1000,burstT,fade*.92,1);}
  }else if(v.kind==='blizzard'){drawPixelBlizzard(g,v.e,v.age,v.radius,Math.min(1,(v.duration-v.age)/.3));
  }else if(v.kind==='assassin'){const e=v.e,g=v.g;const owner=s.actorObjects?.get(e.sourceId)?.sprite,x=e.action==='veil'?(owner?.x??e.x):e.x,y=e.action==='veil'?(owner?.y??e.y):e.y;if(e.action==='veil'){for(let i=0;i<9;i++){const a=i/9*TAU+t*2;g.fillStyle(i%2?0x647853:0xb7c790,fade*.35).fillCircle(x+Math.cos(a)*(12+t*30),y-20+Math.sin(a)*16-t*20,4+fade*7);}}}
  else if(v.kind==='projectile'){
   const target=s.actorObjects?.get(v.e.targetId)?.sprite,tx=target?.active?target.x:v.e.tx,ty=target?.active?target.y-20:v.e.ty;
   const bend=v.e.family||v.e.straight||v.e.projectileType==='arrow'?0:Math.min(45,Math.hypot(tx-v.e.x,ty-v.e.y)*.12),x=v.e.x+(tx-v.e.x)*t,y=v.e.y+(ty-v.e.y)*t-Math.sin(t*Math.PI)*bend;
   if(v.e.family){const shape=v.body.list[0];shape.clear();drawMonsterProjectile(shape,v.e.family,v.age,v.e.element);}
   if(v.moonArrow)v.moonArrow.setFrame(2+Math.floor(v.age/.08)%2);v.body.setPosition(x,y).setRotation(Math.atan2(y-v.last.y,x-v.last.x));v.points.push({x,y});if(v.points.length>12)v.points.shift();
   if(v.e.skill!=='multishot')for(let i=1;i<v.points.length;i++){const a=v.points[i-1],b=v.points[i];g.lineStyle(v.e.skill==='elf-piercer'?5+i:v.e.projectileType==='arrow'?2:2+i/3,v.color,i/v.points.length*(v.e.skill==='elf-piercer'?.22:.45)).lineBetween(a.x,a.y,b.x,b.y);}v.last={x,y};
  }else if(v.kind==='monster-hit'){drawMonsterHit(g,v.e,t);
  }else if(v.kind==='relic'){drawRelicPickup(g,v.e,t);v.label?.setPosition(v.e.x,v.e.y-48-t*52).setAlpha(fade);
  }else if(v.kind==='healing'){
   const target=s.actorObjects?.get(v.e.targetId)?.sprite,x=target?.active?target.x:v.e.x,y=target?.active?target.y-25:v.e.y;
   for(const p of v.points){const py=y+p.y-t*58,px=x+p.x+Math.sin(v.age*3+p.phase)*5,a=fade*.9;g.lineStyle(2,0x65f18a,a).lineBetween(px-4,py,px+4,py).lineBetween(px,py-4,px,py+4);}
  }else if(v.kind==='swing'){
   updateSlashVisual(v.slash,v.e,t);drawSignatureSlash(g,v.e,t,{detailOnly:!!v.slash});
  }else if(v.kind==='meteor'){
   drawPixelMeteor(g,v.e,t);
  }else if(v.kind==='warning'){
   const r=v.e.radius||40;g.fillStyle(v.color,.08+t*.12).fillCircle(v.e.x,v.e.y,r);g.lineStyle(2,v.color,.5+t*.4).strokeCircle(v.e.x,v.e.y,r).lineStyle(1,v.color,.5).strokeCircle(v.e.x,v.e.y,r*(1-t));
  }else if(v.kind==='beam'&&drawPixelBeam(g,v.e,t)){
  }else if(v.kind==='beam'){
   const e=v.e;g.lineStyle(e.type==='drain'?4:3,v.color,fade*.9);g.beginPath();g.moveTo(e.x,e.y);for(let i=1;i<9;i++){const k=i/9,offset=e.type==='lightning'?Math.sin(i*4+v.age*80)*9:Math.sin(k*Math.PI)*12;g.lineTo(e.x+(e.tx-e.x)*k+offset,e.y+(e.ty-e.y)*k-offset);}g.lineTo(e.tx,e.ty);g.strokePath();
  }else if(v.kind==='pulse'&&drawClassPulse(g,v.e,t,v.radius)){
   // Class-specific geometry replaces the old shared pulse and flat art.
  }else if(v.kind==='pulse'){
   const {x,y}=v.e,r=v.radius,ease=1-(1-t)**3;g.fillStyle(v.color,.08*fade).fillCircle(x,y,r*ease);g.lineStyle(v.meteor?5:3,v.color,fade*.7).strokeCircle(x,y,r*ease);g.lineStyle(1,0xfff3ce,fade*.5).strokeCircle(x,y,r*Math.max(0,ease-.16));
   for(const p of v.points){const a=p.angle+v.spin*t,travel=r*(.1+ease*p.speed);g.fillStyle(v.color,fade*.8).fillCircle(x+Math.cos(a)*travel,y+Math.sin(a)*travel*(v.meteor?.65:1)-Math.sin(t*Math.PI)*p.speed*30,p.size*fade+1);}
   if(v.meteor){for(let i=0;i<9;i++){const a=i/9*TAU;g.lineStyle(2,0x342e24,fade*.65).lineBetween(x+Math.cos(a)*20,y+Math.sin(a)*14,x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.45);}}
   if(v.e.skill==='arrow-rain')for(let i=0;i<18;i++){const a=i*2.399,fall=(v.age*2+i/18)%1,px=x+Math.cos(a)*r*.85,py=y+Math.sin(a)*r*.55-(1-fall)*160;g.lineStyle(2,0xffde86,fade*.85).lineBetween(px-13,py-24,px,py);g.fillStyle(0xfff2bb,fade).fillTriangle(px,py+5,px-5,py-2,px+2,py-5);}
   if(v.e.skill==='tempest')for(let i=0;i<6;i++){const a=i/6*TAU,px=x+Math.cos(a)*r*.75,py=y+Math.sin(a)*r*.5;g.lineStyle(2,0xbcc4ff,fade*(.4+Math.sin(v.age*45+i)*.3)).lineBetween(px,py-95,px+Math.sin(v.age*60+i)*10,py-40).lineBetween(px+Math.sin(v.age*60+i)*10,py-40,px,py);}
   if(v.overlay){v.overlay.setAlpha(fade*(v.e.alpha??.75)).setScale(v.overlay.displayWidth/v.overlay.width*(.995+ease*.009));if(v.spin)v.overlay.rotation+=dt*v.spin;}
  }
  }
  if(t>=1){v.rune?.destroy();destroyPaintedSkill(v.impactGround);destroyPaintedSkill(v);destroySlashVisual(v.slash);v.elemental?.image.destroy();destroyFieldRims(v.rimSprites,'tide');g?.destroy();v.body?.destroy();v.rock?.destroy();v.overlay?.destroy();v.label?.destroy();}else alive.push(v);
 }s.liveVFX=alive;
}
export function clearVFX(s){clearFloatingTexts(s);clearMeteors(s);clearRitualFX(s);clearWindVFX(s);clearVanguardVFX(s);clearFallenVFX(s);clearHolyStrikes(s);clearShadowVFX(s);clearBossVFX(s);s.lootGraphics?.clear();for(const v of s.liveVFX||[]){v.rune?.destroy();destroyPaintedSkill(v.impactGround);destroyPaintedSkill(v);destroySlashVisual(v.slash);v.elemental?.image.destroy();destroyFieldRims(v.rimSprites,'tide');v.g?.destroy();v.body?.destroy();v.rock?.destroy();v.overlay?.destroy();v.label?.destroy();}s.liveVFX=[];}
export function clearActorVFX(s,obj){
 clearRitualActor(obj);
 obj.passiveArt?.destroy();obj.passiveArt=null;obj.passiveValue=undefined;obj.passivePulse=undefined;for(const im of obj.guardImages||[])im.destroy();obj.guardImages=null;obj.guardLastWave=0;
 updateClassProgression(s,{hp:0},obj,0);
 updatePaintedBody(s,{hp:0},obj,0);
 clearUnitAuraSprites(obj);
 for(const key of ['ravagerBladeGlow','gearEmission','buffArt']){obj[key]?.destroy();obj[key]=null;}
 obj.buffArtId=null;obj.weaponGlowUntil=0;obj.lastSkillAnim=0;obj.weaponCast=null;
 obj.archerChargeRemaining=0;obj.archerReleaseUntil=0;
}
export function unitVFX(s,u,obj,time){
 updateGuardianEffects(s,u,obj,time);
 applyAscended(s,u,obj);
 registerActorBody(s,u,obj);
 updateGearEmission(s,u,obj,time);
 updateClassProgression(s,u,obj,time);
 updateRavagerBladeGlow(s,u,obj);
 drawCastWeapon(s,u,obj,time);drawMartialState(s,u,obj,time);updatePaintedBody(s,u,obj,time);
 if(u.hp<=0){clearUnitAuraSprites(obj);obj.buffArt?.destroy();obj.buffArt=null;obj.buffArtId=null;return;}
 const g=s.unitGlow,ground=s.unitGround,x=obj.sprite.x,y=obj.groundY??obj.sprite.y,pulse=.6+Math.sin(time/160)*.25;
 if(u.boss&&u.family){drawBossBuff(g,u,x,obj.sprite.y,time);const c=ENEMY_FAMILIES[u.family].color;ground.lineStyle(2,c,.4).strokeEllipse(x,y,90,35);if(u.bossCast)g.fillStyle(c,.2).fillCircle(x,obj.sprite.y-30,35);}
 if(u.flying){ground.fillStyle(0x14231c,.22).fillEllipse(x,y+3,30,12);g.lineStyle(1,u.special==='venom'?0xb6df85:0xb7b9e6,.12).strokeCircle(x,obj.sprite.y-14,22);}
 const buffs=(u.buffs||[]).filter(b=>b.time>0),fury=buffs.some(b=>b.lifesteal||b.powerMultiplier)||(u.hero==='warrior-2'&&u.hp<u.stats?.hp*.4),shield=!u.boss&&(u.shield>0||buffs.some(b=>b.armor>0)),blessed=buffs.some(b=>b.aura==='rally'),speed=buffs.some(b=>b.speed>0);
 drawUnitAuraBuffs(s,u,obj,time);
 obj.speedTrail||=[];if(speed&&(!obj.trailTime||time-obj.trailTime>65)){obj.trailTime=time;obj.speedTrail.push({x,y,time});}
 obj.speedTrail=obj.speedTrail.filter(p=>time-p.time<450);
 for(const p of obj.speedTrail){const a=(1-(time-p.time)/450)*.35;if(Math.hypot(x-p.x,y-p.y)>3)ground.lineStyle(2,0xbcecff,a).lineBetween(p.x-8,p.y-8,p.x+8,p.y-8).lineBetween(p.x-5,p.y-13,p.x+5,p.y-13);}
 const buffArtId=fury?(u.classId==='berserker'?null:'fury'):shield?'bulwark':blessed?'rally':null;
 if(obj.buffArtId!==buffArtId){obj.buffArt?.destroy();obj.buffArt=null;obj.buffArtId=buffArtId;}
 if(buffArtId&&s.textures.exists('art:'+buffArtId)){
  if(!obj.buffArt)obj.buffArt=art(s,buffArtId,x,y-20,shield?100:110,.7);
  obj.buffArt?.setPosition(x,obj.sprite.y-(blessed?2:20)).setAlpha(.5+pulse*.18).setDepth(shield?2801:1450);
 }else if(obj.buffArt){obj.buffArt.destroy();obj.buffArt=null;}
 if(u.mastery>=2&&u.hero&&!fury){const colors={ranger:0xa7e76a,pyromancer:0xffa75b,stormcaller:0xc0adff,tidecaller:0xa3efff,guardian:0xffda9c,paladin:0xfff0aa,fallen:0xb896eb,vanguard:0xe6b877,windblade:0x9feae4,duelist:0xc6e6a5,berserker:0xff9c88,ravager:0xf0836c,darkelf:0xc6a9f5,assassin:0xa7cf7e},color=colors[u.classId];if(color)g.fillStyle(color,.12).fillCircle(x+(u.face||1)*16,obj.sprite.y-26,11);}
 const headY=obj.sprite.y-(obj.size||55)-12;
 if(u.poisonTime>0||u.statuses?.poison){for(let i=0;i<3;i++)g.fillStyle(0xb4dd76,.55).fillCircle(x+(i-1)*8,obj.sprite.y-22-(time/40+i*7)%22,2);g.fillStyle(0xa9ee62,.9).fillCircle(x,headY,6).fillRect(x-4,headY+2,8,6);g.fillStyle(0x243e22).fillCircle(x-2,headY-1,1.5).fillCircle(x+2,headY-1,1.5);}
 if(u.slowTime>0||u.bossSlow>0){
  const type=u.slowType||'ice',c=type==='ice'?0x9be8ff:type==='fire'?0xffa065:type==='poison'?0xb3dd63:0xc4b18b;
  ground.lineStyle(2,c,.6).strokeEllipse(x,y,38,13);
  for(let i=0;i<6;i++){const a=i/6*TAU,px=x+Math.cos(a)*19,py=y+Math.sin(a)*7;ground.lineStyle(1,c,.8);if(type==='ice')ground.lineBetween(px-3,py-4,px+3,py+4).lineBetween(px-3,py+4,px+3,py-4).lineBetween(px,py-5,px,py+5);else if(type==='fire')ground.fillStyle(c,.65).fillTriangle(px-3,py+3,px,py-5-Math.sin(time/90+i)*2,px+3,py+3);else ground.lineBetween(px-4,py+2,px+3,py-3);}
 }
 if(u.statuses?.burn||u.bossBurn>0||u.sprite==='fire-spirit')for(let i=0;i<4;i++)g.fillStyle(i%2?0xffc066:0xff8f45,.7).fillTriangle(x+(i-1.5)*8,obj.sprite.y-10,x+(i-1.5)*8-3,obj.sprite.y-20-((time/35+i*8)%15),x+(i-1.5)*8+4,obj.sprite.y-13);
 if(u.healer||u.special==='drain'){const color=u.healer?0xb5a2ec:0xd78cb8;ground.lineStyle(1,color,.3).strokeEllipse(x,y,42,17);}
 if(u.stun>0){g.lineStyle(2,0xffe8a1,.9).beginPath();for(let i=0;i<=48;i++){const a=i/48*TAU*2+time/250,r=3+i/48*13,px=x+Math.cos(a)*r,py=headY+Math.sin(a)*r*.35;i?g.lineTo(px,py):g.moveTo(px,py);}g.strokePath();for(let i=0;i<3;i++){const a=time/190+i/3*TAU;g.fillStyle(0xffe8a1,.9).fillCircle(x+Math.cos(a)*14,headY+Math.sin(a)*5,2.5);}}
}


