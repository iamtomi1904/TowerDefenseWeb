import test from 'node:test';
import assert from 'node:assert/strict';
import {CLASS_ART,gradePixel} from './public/class-art.js';
import {CLASS_SKILLS,drawClassPulse,drawElementProjectile} from './public/class-effects.js';
import {renderEvent,updateVFX,clearVFX} from './public/effects.js';
import {actorAction} from './public/actor-animation.js';
import {meteorPosition,drawPixelMeteor} from './public/class-effects.js';
import {drawPixelBlizzard} from './public/class-effects.js';
import {drawTideEffect,drawCastWeapon} from './public/class-effects.js';
import {drawMartialEffect,drawMartialState} from './public/class-effects.js';
import {drawArrowStorm} from './public/class-effects.js';
import {PALADIN} from './public/paladin-config.js';
import {FALLEN} from './public/fallen-config.js';
import {skillById} from './public/skills.js';
import {drawHolyAuraBurst,drawHolySustainedField,drawHolyUnderfootBuff,drawFallenAuraBurst,drawFallenSustainedField,drawFallenUnderfootBuff,drawRallyBurst,drawRallySustainedField,drawTideFieldVFX,drawUnitAuraBuffs,drawWindUnderfootBuff} from './public/aura-vfx.js';
import {drawHolyAura} from './public/holy-vfx.js';
import {drawFallenState} from './public/fallen-vfx.js';

function graphics(){
 const g={destroyed:false,calls:0,destroy(){this.destroyed=true;}};
 for(const name of ['setDepth','clear','lineStyle','fillStyle','fillCircle','fillRect','fillTriangle','fillEllipse','strokeCircle','strokeEllipse','lineBetween','strokePoints','fillPoints'])g[name]=(...args)=>{for(const v of args.flatMap(a=>Array.isArray(a)?a.flatMap(p=>[p.x,p.y]):[a]))if(typeof v==='number')assert.ok(Number.isFinite(v),name);g.calls++;return g;};
 return g;
}
test('all 21 upgraded skills render finite geometry through their full lifetime',()=>{
 assert.equal(Object.keys(CLASS_SKILLS).length,21);
 for(const skill of Object.keys(CLASS_SKILLS))for(const radius of [1,55,240])for(const t of [0,.01,.25,.5,.99,1]){
  const g=graphics();assert.equal(drawClassPulse(g,{skill,x:200,y:160,angle:-2},t,radius),true);assert.ok(g.calls>0);
 }
 assert.equal(drawClassPulse(graphics(),{skill:'holy-slash'},.5,60),false);
});
test('upgraded pulse events deduplicate, expire and clean up without old art',()=>{
 const objects=[],scene={textures:{exists:()=>false},anims:{exists:()=>false},add:{graphics:()=>{const g=graphics();objects.push(g);return g;}}},seen=new Set();
 for(const [i,skill]of Object.keys(CLASS_SKILLS).entries()){const e={id:i,type:'aoe',skill,x:200,y:200,radius:85};renderEvent(scene,e,seen);renderEvent(scene,e,seen);}
 assert.equal(scene.liveVFX.length,21);updateVFX(scene,.15);assert.equal(scene.liveVFX.length,21);updateVFX(scene,2);assert.equal(scene.liveVFX.length,0);assert.ok(objects.every(g=>g.destroyed));clearVFX(scene);
});
test('palette processing stays in byte range and keeps distinct elemental identities',()=>{
 for(const style of Object.values(CLASS_ART))for(const rgb of [[0,0,0],[255,255,255],[200,140,100],[90,50,170]])assert.ok(gradePixel(...rgb,style).every(v=>Number.isInteger(v)&&v>=0&&v<=255));
 assert.notDeepEqual(gradePixel(90,50,170,CLASS_ART['fire-wizard']),gradePixel(90,50,170,CLASS_ART['wanderer-magican']));
});
test('elemental projectile art preserves monster and gem rendering paths',()=>{
 for(const fx of ['fireball','waterball','lightning']){assert.equal(drawElementProjectile(graphics(),{fx}),true);assert.equal(drawElementProjectile(graphics(),{fx,gem:'fire'}),false);assert.equal(drawElementProjectile(graphics(),{fx,family:'dragon'}),false);}
});
test('skill cast restarts mid attack, holds full pose, then allows movement and stun',()=>{
 for(const classId of ['pyromancer','tidecaller','stormcaller','berserker','ranger','duelist','guardian']){
  const info={actions:{attack:{frames:6},dead:{}}},obj={},u={classId,hero:'hero',hp:100,anim:1,attackCount:1,stats:{cooldown:.5}};
  actorAction(u,obj,true,0,info);obj.attackRestart=false;
  Object.assign(u,{castCount:1,castAnim:.65});assert.equal(actorAction(u,obj,true,100,info),'attack');assert.equal(obj.attackRestart,true);
  u.attackCount=2;u.castAnim=.3;assert.equal(actorAction(u,obj,true,450,info),'attack');assert.equal(obj.attackUntil,750);
  u.castAnim=0;assert.equal(actorAction(u,obj,true,760,info),'walk');
  u.castCount=2;u.castAnim=.5;actorAction(u,obj,true,800,info);u.stun=1;assert.equal(actorAction(u,obj,true,850,info),'idle');assert.equal(obj.castUntil,0);
 }
});
test('meteor visibly descends to the exact impact point and expires after its delay',()=>{
 const e={id:'fall',type:'meteor-fall',x:360,y:290,radius:135,duration:1.1};
 let previous=-Infinity;
 for(const t of [0,.2,.5,.8,1]){const pos=meteorPosition(e,t);assert.ok(pos.y>previous);previous=pos.y;const g=graphics();drawPixelMeteor(g,e,t);assert.ok(g.calls>100);}
 assert.deepEqual(meteorPosition(e,1),{x:e.x,y:e.y});
 const scene={add:{graphics:()=>graphics()}},seen=new Set();renderEvent(scene,e,seen);
 updateVFX(scene,.55);assert.equal(scene.liveVFX[0].kind,'meteor');
 updateVFX(scene,.56);assert.equal(scene.liveVFX.length,0);
});
test('blizzard sustains one moving storm across damage ticks, then fades and releases',()=>{
 const scene={add:{graphics:()=>graphics()}},seen=new Set();
 const e={type:'aoe',skill:'blizzard',x:300,y:250,radius:205};
 renderEvent(scene,{...e,id:'snow1'},seen);updateVFX(scene,.8);
 const storm=scene.liveVFX[0];assert.equal(storm.kind,'blizzard');
 renderEvent(scene,{...e,id:'snow2'},seen);assert.equal(scene.liveVFX.length,1);
 assert.equal(scene.liveVFX[0],storm);assert.equal(storm.age,.8);
 updateVFX(scene,.8);assert.equal(scene.liveVFX.length,1);
 updateVFX(scene,.5);assert.equal(scene.liveVFX.length,0);assert.equal(storm.g.destroyed,true);
 for(const age of [0,.1,.5,1,2.5,4.9]){const g=graphics();drawPixelBlizzard(g,e,age,205);assert.ok(g.calls>800);}
});
test('tide waves, healing field, lift and skill weapon glow render throughout their lifetimes',()=>{
 for(const type of ['tide-wave','tide-field','tide-lift'])for(const t of [0,.2,.5,.99,1])drawTideEffect(graphics(),{type,x:300,y:200,radius:type==='tide-field'?520:210},t);
 for(const classId of ['pyromancer','tidecaller','stormcaller','berserker','guardian','paladin','fallen','ranger','darkelf','assassin','vanguard','windblade','duelist']){
  const g=graphics(),scene={unitGlow:g},obj={sprite:{x:200,y:300},size:57},u={hero:'hero',hp:100,classId,face:-1,castCount:1,castAnim:.6};
  drawCastWeapon(scene,u,obj,100);assert.ok(g.calls>0);const count=g.calls;
  drawCastWeapon(scene,u,obj,800);assert.equal(g.calls,count);
  u.castCount=2;drawCastWeapon(scene,u,obj,900);assert.ok(g.calls>count);
 }
});
test('martial effects draw finite pixel geometry through windups, impacts and alternate form strikes',()=>{
 const actions=['quake-land','heaven-sword','bow-charge','bow-release','poison-enchant','dual-draw','single-draw','heavy-charge','dual-charge','blood-roar','blood-charge','axe-charge','leap-charge','heavy-cut','dual-cut','blood-cut','axe-cut','sword-finish'];
 for(const action of actions)for(const t of [0,.2,.65,.99,1])for(const dual of [false,true]){
  const g=graphics();drawMartialEffect(g,{action,dual,x:250,y:200,radius:195,angle:-.8,reverse:true},t);assert.ok(g.calls>0);
 }
 const g=graphics();drawMartialState({unitGlow:g,unitGround:g},{hp:100,buffs:[{poisonArrows:true,time:2}],x:50,y:80,face:-1},{sprite:{x:50,y:80},groundY:80},100);assert.ok(g.calls>0);
});
test('continuous arrowstorm keeps one emitter across damage ticks and renders normal and poison rain',()=>{
 const scene={add:{graphics:()=>graphics()}},seen=new Set(),e={type:'aoe',skill:'arrow-rain',sourceId:'ranger',x:300,y:220,radius:190,poisonEnchanted:true};
 renderEvent(scene,{...e,id:1},seen);updateVFX(scene,.15);const storm=scene.liveVFX[0];
 renderEvent(scene,{...e,id:2},seen);assert.equal(scene.liveVFX[0],storm);assert.equal(storm.age,.15);updateVFX(scene,.15);assert.equal(scene.liveVFX.length,1);
 updateVFX(scene,.2);assert.equal(scene.liveVFX.length,0);
 for(const poisonEnchanted of [false,true])for(const age of [0,.15,.9,2.5,4]){const g=graphics();drawArrowStorm(g,{...e,poisonEnchanted},age,190);assert.ok(g.calls>500);}
});
test('aura radii match updated design and all 3 aura VFX layers render finite pixel geometry',()=>{
 assert.equal(skillById('rally').radius,400);
 assert.equal(PALADIN.aura.mountedRadius,350);
 assert.equal(FALLEN.aura.mountedRadius,350);
 for(const enhanced of [false,true])for(const t of [0,.2,.5,.95,1]){
  const g=graphics();
  drawHolyAuraBurst(g,200,200,enhanced?350:260,t,enhanced);
  drawHolySustainedField(g,200,200,enhanced?350:260,1200,t,enhanced);
  drawHolyUnderfootBuff(g,200,200,1200,enhanced);
  drawFallenAuraBurst(g,200,200,enhanced?350:260,t,enhanced);
  drawFallenSustainedField(g,200,200,enhanced?350:260,1200,t,enhanced);
  drawFallenUnderfootBuff(g,200,200,1200,enhanced);
  assert.ok(g.calls>100);
 }
 const g=graphics();
 drawRallyBurst(g,250,250,400,.4);
 drawRallySustainedField(g,g,250,250,1500,400);
 drawTideFieldVFX(g,{x:250,y:250,radius:520},.08);
 drawTideFieldVFX(g,{x:250,y:250,radius:520},.5);
 drawWindUnderfootBuff(g,g,250,250,1200,true);
 drawUnitAuraBuffs({unitGround:g,unitGlow:g,liveVFX:[{kind:'tide',e:{type:'tide-field',x:250,y:250,radius:520}}]},{classId:'guardian',shield:50,buffs:[{time:4,aura:'rally'},{time:4,lifesteal:.2},{time:4,haste:.2}]},{sprite:{x:250,y:250},groundY:250},1200);
 const scene={textures:{exists:()=>false},add:{graphics:()=>graphics()}},palObj={},falObj={};
 drawHolyAura(scene,{classId:'paladin',hp:100,x:200,y:200,holyMounted:true,skills:{'holy-aura':1},holyAura:{enhanced:true}},palObj,1000);
 assert.ok(palObj.holyRange&&palObj.holyAuraGround);
 drawFallenState(scene,{classId:'fallen',hp:100,x:200,y:200,fallenMounted:true,skills:{'fallen-aura':1},fallenAura:{enhanced:true}},falObj,1000);
 assert.ok(falObj.fallenRange&&falObj.fallenGround);
});
