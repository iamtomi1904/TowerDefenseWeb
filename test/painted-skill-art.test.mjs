import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preloadPaintedSkills,createPaintedSkill,updatePaintedSkill,destroyPaintedSkill,updatePaintedBody} from '../public/painted-skill-art.js';
import {snowMotion,arrowRainMotion,rainImpactPoolCount,rainImpactArrowIndex,createSpellCircle,updateSpellCircle,createArcherQProjectile} from '../public/action-skill-art.js';
function scene(baked=false){const textures=new Map(),images=[];return {images,textures:{exists:k=>textures.has(k)&&(!k.startsWith('baked-')||baked),get:k=>textures.get(k)},load:{image(key,path){const png=readFileSync(new URL('../public'+path,import.meta.url)),width=png.readUInt32BE(16),height=png.readUInt32BE(20),frames=new Map();assert.equal(png[25],6);textures.set(key,{frames,getSourceImage:()=>({width,height}),has:n=>frames.has(n),add(n,_,x,y,w,h){assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height);frames.set(n,{x,y,w,h});}});}},add:{image(x,y,key,frame){const im={x,y,key,frame,visible:true,setVisible(v){this.visible=v;return this;},destroy(){this.destroyed=true;}};for(const fn of ['setDepth','setDisplaySize','setRotation','setAlpha','setOrigin'])im[fn]=(...args)=>{assert.ok(args.every(Number.isFinite));im[fn]=im[fn];im[fn+'Value']=args;return im;};im.setTexture=(key,frame)=>{im.key=key;im.frame=frame;return im;};im.setFrame=f=>{im.frame=f;return im;};im.setPosition=(x,y)=>{assert.ok(Number.isFinite(x+y));im.x=x;im.y=y;return im;};images.push(im);return im;}}};}
test('all rebuilt effects use bounded painted frame sequences and release their images',()=>{
 const s=scene();preloadPaintedSkills(s);
 const events=[{type:'tide-wave'},{skill:'blizzard'},{skill:'flamefield'},{skill:'thunderstrike'},{skill:'tempest'},{type:'lightning',tx:180,ty:50},{action:'quake-land'},{type:'wind-vfx',action:'dash'},{type:'vanguard-vfx',skill:'vanguard-flurry',action:'thrust'}];
 for(const e of events){const v={e:{x:0,y:0,radius:100,...e},age:0};v.painted=createPaintedSkill(s,v);assert.ok(v.painted);const frames=new Set();for(const t of [0,.11,.22,.33,.44,.55,.66,.77,.88,.99]){v.age=t;assert.equal(updatePaintedSkill(s,v,t),true);frames.add(v.painted.image.frame);}if(!v.painted.isolatedKind)assert.ok(frames.size>=5,JSON.stringify(e));else assert.ok(v.painted.nodes.every(n=>n.image.frame===undefined||Number.isInteger(n.image.frame)||typeof n.image.frame==='string'));const image=v.painted.image;destroyPaintedSkill(v);assert.ok(image.destroyed||image.visible===false);}
});
test('archer storm uses continuous painted arrows, ground impacts and poison only when enchanted',()=>{
 for(const poisonEnchanted of [false,true]){
  const s=scene();preloadPaintedSkills(s);const v={e:{type:'aoe',skill:'arrow-rain',x:100,y:100,radius:190,poisonEnchanted},age:.4};v.painted=createPaintedSkill(s,v);
  assert.equal(v.painted.isolatedKind,'rain');const nodes=v.painted.nodes;assert.equal(nodes.filter(n=>n.role==='rain-arrow').length,1000);assert.equal(nodes.filter(n=>n.role==='rain-impact').length,96);assert.equal(nodes.filter(n=>n.role==='rain-poison').length,poisonEnchanted?24:0);
  updatePaintedSkill(s,v,.1);const before=nodes.map(n=>[n.image.x,n.image.y]);v.age=.45;updatePaintedSkill(s,v,.11);assert.ok(nodes.filter(n=>n.role==='rain-arrow').some((n,i)=>n.image.x!==before[i][0]||n.image.y!==before[i][1]));
  const images=nodes.map(n=>n.image);destroyPaintedSkill(v);assert.ok(images.every(i=>i.destroyed||i.visible===false));
 }
});
test('every volley arrow stays planted at its own landing point inside the circular field',()=>{
 const e={x:100,y:80,radius:190,fieldRemaining:5};let early=0,late=0;
 for(let i=0;i<1000;i++){
  const a=arrowRainMotion(e,2,i),b=arrowRainMotion(e,4.95,i);if(a.landed)early++;if(b.landed)late++;
  assert.ok(Math.hypot(b.x-e.x,b.y-e.y)<=e.radius);assert.ok(b.landed);assert.equal(b.drawX,b.x);assert.equal(b.drawY,b.y);
  if(a.landed){assert.equal(a.x,b.x);assert.equal(a.y,b.y);}
 }
 assert.ok(early>0&&early<late);assert.equal(late,1000);
});
test('legacy mage body orbits stay disabled while giant aura follows the body',()=>{
 const s=scene();preloadPaintedSkills(s);const obj={size:70,sprite:{x:10,y:80,depth:80}};
 updatePaintedBody(s,{classId:'pyromancer',hp:10,level:1},obj,100);assert.equal(obj.paintedBodies.size,0);
 updatePaintedBody(s,{classId:'pyromancer',hp:10,level:16},obj,100);assert.equal(obj.paintedBodies.size,0);
 updatePaintedBody(s,{classId:'pyromancer',hp:0,level:16},obj,100);assert.equal(obj.paintedBodies.size,0);assert.ok(s.images.every(i=>i.destroyed||i.visible===false));
 updatePaintedBody(s,{classId:'vanguard',hp:10,vanguardTime:90},obj,100);assert.equal(obj.paintedBodies.size,1);
 obj.sprite.x=55;updatePaintedBody(s,{classId:'vanguard',hp:10,vanguardTime:90},obj,200);assert.equal(obj.paintedBodies.get(0).x,55);
 updatePaintedBody(s,{classId:'vanguard',hp:10,vanguardTime:0},obj,300);assert.equal(obj.paintedBodies.size,0);
});
test('snowstorm has independent continuous snow motion and releases every particle',()=>{
 const s=scene();preloadPaintedSkills(s);const v={e:{skill:'blizzard',x:50,y:80,radius:205},age:.5};v.painted=createPaintedSkill(s,v);
 assert.equal(v.painted.parts.length,263);updatePaintedSkill(s,v,.1);const before=v.painted.parts.map(i=>[i.x,i.y]);v.age=.51;updatePaintedSkill(s,v,.102);
 assert.ok(v.painted.nodes.filter(n=>n.role==='gust'||n.role==='snow').every(n=>n.image.x!==before[v.painted.parts.indexOf(n.image)]?.[0]||n.image.y!==before[v.painted.parts.indexOf(n.image)]?.[1]));
 for(let i=8;i<59;i++){const a=snowMotion(v.e,.5,i),b=snowMotion(v.e,.51,i);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>0);}
 const all=[v.painted.image,...v.painted.parts];destroyPaintedSkill(v);assert.ok(all.every(i=>i.destroyed||i.visible===false));
});
test('crater anchors to its ground contact',()=>{
 const s=scene();preloadPaintedSkills(s);const v={e:{action:'quake-land',x:120,y:200,radius:100},age:.2};v.painted=createPaintedSkill(s,v);assert.deepEqual(v.painted.image.setOriginValue,[.5,.72]);updatePaintedSkill(s,v,.2);assert.equal(v.painted.image.x,120);assert.equal(v.painted.image.y,200);
});
test('layered water, lightning and fire retain painted detail and clean up every layer',()=>{
 const s=scene();preloadPaintedSkills(s);
 for(const [e,count]of [[{type:'tide-wave'},17],[{skill:'tempest'},55],[{skill:'thunderstrike'},9],[{skill:'flamefield'},14]]){
  const v={e:{x:0,y:0,radius:150,...e},age:.35};v.painted=createPaintedSkill(s,v);assert.equal(v.painted.parts.length,count);updatePaintedSkill(s,v,.35);
  assert.ok(v.painted.nodes.every(n=>n.image.key.startsWith('action-fx:')||n.image.key==='element-animation'));
  const layers=[v.painted.image,...v.painted.parts];destroyPaintedSkill(v);assert.ok(layers.every(i=>i.destroyed||i.visible===false));
 }
});
test('ultimate storms and lava have persistent full-radius ground zones and never slice their component textures',()=>{
 const s=scene();preloadPaintedSkills(s);
 for(const [skill,role]of [['tempest','storm-zone'],['blizzard','frost-zone'],['flamefield','lava']]){
  const v={e:{skill,x:100,y:150,radius:205},age:1};v.painted=createPaintedSkill(s,v);const zone=v.painted.nodes.find(n=>n.role===role);assert.ok(zone);
  updatePaintedSkill(s,v,.2);assert.equal(zone.image.x,100);assert.equal(zone.image.y,150);assert.ok(zone.image.setAlphaValue[0]>.3);
  const old=v.painted.nodes.filter(n=>n.role!=='frost-zone'&&n.role!=='storm-zone'&&n.role!=='lava').map(n=>[n.image.x,n.image.y,n.image.setAlphaValue[0]]);
  v.age=1.01;updatePaintedSkill(s,v,.202);assert.equal(zone.image.x,100);assert.equal(zone.image.y,150);assert.ok(v.painted.nodes.filter(n=>n.role!=='frost-zone'&&n.role!=='storm-zone'&&n.role!=='lava').some((n,i)=>n.image.x!==old[i][0]||n.image.y!==old[i][1]||n.image.setAlphaValue[0]!==old[i][2]));
  for(const n of v.painted.nodes)if(!['lava','arctic-canopy','ice-tornado'].includes(n.role))assert.equal(s.textures.get(n.image.key).frames.size,0,'isolated drawings have no cropped frames');destroyPaintedSkill(v);
 }
});
test('lightning ultimate has drifting weather while E has a compact cloud and synchronized flash',()=>{
 const s=scene();preloadPaintedSkills(s);const v={e:{skill:'tempest',x:100,y:100,radius:205},age:1};v.painted=createPaintedSkill(s,v);updatePaintedSkill(s,v,.2);
 const weather=v.painted.nodes.filter(n=>['storm-cloud','storm-wind'].includes(n.role));assert.equal(weather.length,6);const positions=weather.map(n=>[n.image.x,n.image.y]);
 assert.ok(weather.every(n=>n.image.setAlphaValue[0]<=.42));v.age=1.1;updatePaintedSkill(s,v,.22);assert.ok(weather.every((n,i)=>n.image.x!==positions[i][0]||n.image.y!==positions[i][1]));
 const strike={e:{skill:'thunderstrike',x:100,y:100},age:.25};strike.painted=createPaintedSkill(s,strike);updatePaintedSkill(s,strike,.3);
 const clouds=strike.painted.nodes.filter(n=>n.role.startsWith('strike-cloud'));assert.equal(clouds.length,3);assert.ok(clouds.every(n=>n.image.y<strike.e.y-140));assert.ok(clouds.some(n=>n.role==='strike-cloud-flash'&&n.image.setAlphaValue[0]>0));
 destroyPaintedSkill(strike);destroyPaintedSkill(v);assert.ok([...weather,...clouds].every(n=>n.image.destroyed||n.image.visible===false));
});
test('archer Q uses painted flight, release and impact art and keeps green poison coloration',()=>{
 const s=scene();preloadPaintedSkills(s);const add=s.add.image;s.add.image=(...args)=>{const im=add(...args);im.setTint=color=>{im.tint=color;return im;};return im;};
 for(const poisonEnchanted of [false,true]){
  const flight=createArcherQProjectile(s,{skill:'multishot',poisonEnchanted});assert.equal(flight.length,3);assert.ok(flight.every(im=>im.key==='action-fx:archer-q'));assert.equal(flight[0].tint,poisonEnchanted?0xb8ff83:undefined);
  for(const action of [undefined,'arrow-hit']){const v={e:{type:'aoe',skill:'multishot',action,poisonEnchanted,x:100,y:100},age:.12};v.painted=createPaintedSkill(s,v);assert.equal(v.painted.isolatedKind,action?'q-hit':'q-release');updatePaintedSkill(s,v,.15);destroyPaintedSkill(v);}
 }
});
test('all mage ultimates have spell circles and blizzard gains tornadoes plus denser snowfall',()=>{
 const s=scene();preloadPaintedSkills(s);
 for(const skill of ['tempest','blizzard']){const v={e:{skill,x:10,y:20,radius:205},age:1};v.painted=createPaintedSkill(s,v);assert.ok(v.painted.nodes.some(n=>n.role==='ritual'));if(skill==='blizzard'){assert.equal(v.painted.nodes.filter(n=>n.role==='ice-tornado').length,5);assert.equal(v.painted.nodes.filter(n=>n.role==='snow').length,144);}updatePaintedSkill(s,v,.2);destroyPaintedSkill(v);}
 for(const type of ['skill-channel','meteor-fall','meteor-impact']){const v={e:{type,skill:'meteor',x:10,y:20,radius:205},age:.3};v.rune=createSpellCircle(s,v.e);assert.ok(v.rune);updateSpellCircle(s,v,.3);assert.equal(v.rune.x,10);assert.equal(v.rune.y,20);v.rune.destroy();}
});


import {elementAnimationFrame} from '../public/element-animation.js';
test('storm-first loading cannot alias the meteor first frame and every animation stays within its row',()=>{
 const s=scene();preloadPaintedSkills(s);elementAnimationFrame(s,3,0);
 for(let row=0;row<4;row++){const frames=new Set();for(const age of [0,.11,.21,.31,.41,.55,.7,.8]){const f=elementAnimationFrame(s,row,age),tx=s.textures.get(f.key),rect=tx.frames.get(f.frame),h=tx.getSourceImage().height;assert.equal(typeof f.frame,'string');assert.ok(f.frame.length>0);assert.ok(rect.y>=Math.round(row*h/4)&&rect.y+rect.h<=Math.round((row+1)*h/4));frames.add(f.frame);}assert.ok(frames.size>=3);}
});

test('blizzard vortices and flying ice remain inside the marked skill radius throughout their cycles',()=>{
 const s=scene();preloadPaintedSkills(s);const e={skill:'blizzard',x:170,y:230,radius:205},v={e,age:0};v.painted=createPaintedSkill(s,v);
 for(let step=0;step<200;step++){v.age=step*.037;updatePaintedSkill(s,v,.2);for(const n of v.painted.nodes){const im=n.image,d=Math.hypot(im.x-e.x,im.y-e.y);if(n.role==='ice-tornado'){const [w,h]=im.setDisplaySizeValue;assert.ok(d+Math.hypot(w,h)/2<=e.radius+1e-6);}if(['ice-fragment','snow','streak'].includes(n.role))assert.ok(d<e.radius);if(n.role==='arctic-canopy'){assert.equal(im.x,e.x);assert.equal(im.y,e.y);assert.equal(im.setDisplaySizeValue[0],im.setDisplaySizeValue[1]);}}}
 destroyPaintedSkill(v);
});
test('pooled rain impacts still cover every one of the 1000 arrow contacts',()=>{
 for(const duration of [2,5,8]){const e={x:0,y:0,radius:190,fieldRemaining:duration},seen=new Set(),pool=rainImpactPoolCount(e);assert.ok(pool<1000);for(let age=0;age<duration+.4;age+=.01)for(let slot=0;slot<pool;slot++){const i=rainImpactArrowIndex(e,age,slot);if(i>=1000)continue;const p=arrowRainMotion(e,age,i);if(p.impact>0&&p.impact<1)seen.add(i);}assert.equal(seen.size,1000);}
});
test('planted arrows retain their position without repeated transform updates',()=>{
 const s=scene();preloadPaintedSkills(s);const v={e:{type:'aoe',skill:'arrow-rain',x:0,y:0,radius:190,fieldRemaining:5},age:5.2};v.painted=createPaintedSkill(s,v);updatePaintedSkill(s,v,.8);
 const arrows=v.painted.nodes.filter(n=>n.role==='rain-arrow');assert.equal(arrows.length,1000);assert.ok(arrows.every(n=>n.planted));for(const n of arrows)n.image.setPosition=()=>{throw Error('stationary arrow was repositioned');};v.age=5.3;updatePaintedSkill(s,v,.81);destroyPaintedSkill(v);
});

test('secondary overload reduces snow particles, preserves primary art and restores detail',()=>{
 const s=scene();preloadPaintedSkills(s);const v={e:{skill:'blizzard',x:400,y:300,radius:205},age:1};v.painted=createPaintedSkill(s,v);
 s.secondaryFXRatio=.4;updatePaintedSkill(s,v,.2);
 const primary=v.painted.nodes.filter(n=>['ritual','arctic-canopy','ice-tornado','gust','frost-zone'].includes(n.role));
 assert.ok(primary.every(n=>n.image.visible));
 const snow=v.painted.nodes.filter(n=>n.role==='snow');assert.ok(snow.some(n=>!n.image.visible));assert.ok(snow.some(n=>n.image.visible));
 s.secondaryFXRatio=1;v.age=2;updatePaintedSkill(s,v,.4);assert.ok(v.painted.nodes.every(n=>n.image.visible));destroyPaintedSkill(v);
});

test('baked blizzard uses eight pooled images and bounded animated frames',()=>{const s=scene(true);preloadPaintedSkills(s);const v={e:{type:'aoe',skill:'blizzard',x:100,y:120,radius:205},age:1};v.painted=createPaintedSkill(s,v);assert.equal(v.painted.nodes.length,8);assert.equal(v.painted.nodes.filter(n=>n.role==='baked-snow').length,2);for(let i=0;i<100;i++){v.age=i/12;updatePaintedSkill(s,v,.3);for(const n of v.painted.nodes.filter(n=>n.role==='baked-snow'))assert.ok(n.image.frame>=0&&n.image.frame<24);}const images=v.painted.nodes.map(n=>n.image);destroyPaintedSkill(v);assert.ok(images.every(im=>im.destroyed||!im.visible));});

test('baked lava and storm weather preserve separate bolts and clean up',()=>{for(const [skill,count]of [['flamefield',2],['tempest',51]]){const s=scene(true);preloadPaintedSkills(s);const v={e:{type:'aoe',skill,x:0,y:0,radius:205},age:1};v.painted=createPaintedSkill(s,v);assert.equal(v.painted.nodes.length,count);updatePaintedSkill(s,v,.2);if(skill==='tempest')assert.equal(v.painted.nodes.filter(n=>n.role==='bolt').length,12);const images=v.painted.nodes.map(n=>n.image);destroyPaintedSkill(v);assert.ok(images.every(im=>im.destroyed||!im.visible));}});

test('baked effects skip unchanged transforms and only switch frames at twelve Hz',()=>{const s=scene(true);preloadPaintedSkills(s);const v={e:{type:'aoe',skill:'flamefield',x:20,y:30,radius:150},age:1};v.painted=createPaintedSkill(s,v);let frames=0,positions=0,sizes=0,alphas=0;for(const n of v.painted.nodes){for(const [method,count]of [['setFrame',()=>frames++],['setPosition',()=>positions++],['setDisplaySize',()=>sizes++],['setAlpha',()=>alphas++]]){const original=n.image[method];n.image[method]=(...args)=>{count();return original(...args);};}}for(let i=0;i<60;i++){v.age=1+i/60;updatePaintedSkill(s,v,.2);}assert.ok(frames<=26);assert.equal(positions,2);assert.equal(sizes,2);assert.equal(alphas,2);v.e.x=55;v.e.radius=180;updatePaintedSkill(s,v,.2);assert.equal(positions,4);assert.equal(sizes,4);destroyPaintedSkill(v);});

test('arrow trajectory cache keeps landing points stable and invalidates changed fields',()=>{const e={x:30,y:40,radius:190,fieldRemaining:5},before=JSON.stringify(e);const a=arrowRainMotion(e,1,400),b=arrowRainMotion(e,4,400);assert.equal(a.x,b.x);assert.equal(a.y,b.y);assert.equal(JSON.stringify(e),before);e.x+=100;assert.ok(Math.abs(arrowRainMotion(e,1,400).x-a.x-100)<1e-9);e.radius=100;const c=arrowRainMotion(e,1,400);assert.ok(Math.hypot(c.x-e.x,c.y-e.y)<=100);e.fieldRemaining=8;assert.notEqual(arrowRainMotion(e,1,400).local,c.local);});
