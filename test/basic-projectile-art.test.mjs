import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {BASIC_PROJECTILE_ART,basicAttackVisual,basicProjectileKey} from '../public/basic-projectile-config.js';
import {preloadBasicProjectiles,basicProjectilePose} from '../public/basic-projectile-art.js';
import {battleTextureNeeded} from '../public/battle-assets.js';
import {renderEvent,updateVFX,clearVFX} from '../public/effects.js';
import {buildBasicAttackPreview} from '../scripts/build-basic-attack-previews.mjs';
import {buildSkillPreview} from '../scripts/build-skill-previews.mjs';

function scene(){
 const textures=new Map(),display=new Set();let created=0,shutdown;
 const s={actorObjects:new Map(),children:{add:i=>display.add(i),remove:i=>display.delete(i)},events:{once:(name,fn)=>shutdown=fn},textures:{exists:k=>textures.has(k),get:k=>textures.get(k)},load:{image(key,url){const png=readFileSync(new URL('../public'+url,import.meta.url)),frames=new Map();textures.set(key,{has:f=>frames.has(f),getSourceImage:()=>({width:png.readUInt32BE(16),height:png.readUInt32BE(20)}),add(f,_,x,y,w,h){assert.ok(x>=0&&y>=0&&x+w<=512&&y+h<=512);frames.set(f,{x,y,w,h});}});}},add:{image(x,y,key,frame){
  created++;const image={scene:s,x,y,key,frame,visible:true,active:true,destroy(){this.destroyed=true;display.delete(this);}};
  for(const fn of ['setTexture','setPosition','setVisible','setActive','setAlpha','setRotation','setScale','setOrigin','clearTint','setFlipX','setFlipY','setBlendMode','setDepth','setDisplaySize','setTint','setFrame'])image[fn]=function(...a){this[fn+'Value']=a;if(fn==='setPosition')[this.x,this.y]=a;if(fn==='setFrame')this.frame=a[0];if(fn==='setVisible')this.visible=a[0];return this;};display.add(image);return image;
 },graphics(){throw Error('Basic attacks must not allocate Graphics');},container(){throw Error('Basic attacks must not allocate Containers');}}};
 return Object.assign(s,{display,created:()=>created,shutdown:()=>shutdown?.()});
}
test('five atlases have real alpha, transparent frame gutters, and load only for their hero',async()=>{
 const s=scene();preloadBasicProjectiles(s);
 for(const [id,p]of Object.entries(BASIC_PROJECTILE_ART)){
  assert.equal(battleTextureNeeded(basicProjectileKey(id),[p.hero]),true);assert.equal(battleTextureNeeded(basicProjectileKey(id),['knight-1']),false);
  const {data,info}=await sharp(fileURLToPath(new URL('../public/assets/basic-projectiles-v1/'+id+'.png',import.meta.url))).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,512);assert.equal(info.height,512);
  let opaque=0;for(let y=0;y<512;y++)for(let x=0;x<512;x++){const a=data[(y*512+x)*4+3];if(x%128<5||y%128<5||x%128>122||y%128>122)assert.equal(a,0);opaque+=a>0?1:0;}assert.ok(opaque>1000);
 }
});
test('painted shots and contacts allocate no Graphics and pool images through expiration and clearing',()=>{
 const s=scene();preloadBasicProjectiles(s);const seen=new Set(),shot={id:'a',type:'projectile',basicClass:'stormcaller',x:0,y:0,tx:300,ty:100,duration:.5,straight:true};
 renderEvent(s,shot,seen);assert.equal(s.display.size,2);assert.equal(s.liveVFX[0].kind,'painted-projectile');updateVFX(s,.2);assert.ok(s.liveVFX[0].basicProjectile.head.x>0);
 renderEvent(s,{id:'hit',type:'impact',basicClass:'stormcaller',x:300,y:100},seen);assert.equal(s.display.size,3);updateVFX(s,1);assert.equal(s.display.size,0);assert.equal(s.skillImagePool.free.length,3);
 renderEvent(s,{...shot,id:'b'},seen);assert.equal(s.created(),3);clearVFX(s);assert.equal(s.display.size,0);s.shutdown();assert.equal(s.skillImagePool,null);
});
test('offscreen shots age, resume at their real flight position, and still return images to the pool',()=>{
 const s=scene();preloadBasicProjectiles(s);s.cameras={main:{worldView:{x:5000,y:5000,width:800,height:600}}};
 renderEvent(s,{id:'a',type:'projectile',basicClass:'tidecaller',x:0,y:0,tx:300,ty:100,duration:1},new Set());const v=s.liveVFX[0];updateVFX(s,.2);assert.equal(v.basicProjectile.head.visible,false);
 s.cameras.main.worldView={x:0,y:0,width:800,height:600};updateVFX(s,.2);assert.equal(v.basicProjectile.head.visible,true);const head=v.basicProjectile.head;assert.ok(Math.abs((head.x*300+head.y*100)/100000-.4)<1e-9);updateVFX(s,1);assert.equal(s.display.size,0);
});
test('the VFX limit and collision-stop release both painted images without leaking',()=>{
 const s=scene();preloadBasicProjectiles(s);const seen=new Set();for(let i=0;i<181;i++)renderEvent(s,{id:String(i),type:'projectile',basicClass:'darkelf',x:0,y:0,tx:100,ty:0,duration:1},seen);
 assert.equal(s.liveVFX.length,180);assert.equal(s.display.size,360);assert.equal(s.created(),362);
 renderEvent(s,{id:'stop',type:'projectile-hit',shotId:'180',x:30,y:0},seen);assert.equal(s.liveVFX.at(-1).basicProjectile.head.visible,false);updateVFX(s,.01);assert.equal(s.display.size,358);clearVFX(s);assert.equal(s.display.size,0);
});
test('flight points at moving targets and remains stable for vertical and zero-length shots',()=>{
 const s={actorObjects:new Map([['target',{sprite:{active:true,x:0,y:320}}]])},e={x:0,y:0,tx:20,ty:0,targetId:'target',straight:true};
 const p=basicProjectilePose(s,e,.5,true);assert.deepEqual(p,{x:0,y:150,angle:Math.PI/2});
 assert.equal(basicProjectilePose({}, {x:5,y:5,tx:5,ty:5},.5).angle,0);
});
test('fire follows a restrained arc even for aimed shots and lands at the original endpoint',()=>{
 const e={basicClass:'pyromancer',straight:true,x:40,y:80,tx:340,ty:80},pose=t=>basicProjectilePose({},e,t);
 assert.equal(pose(0).y,80);assert.ok(Math.abs(pose(1).y-80)<1e-9);
 assert.ok(pose(.5).y<pose(.25).y&&pose(.25).y<80);assert.ok(80-pose(.5).y<=18);
 assert.ok(pose(.1).angle<0&&pose(.9).angle>0);assert.equal(pose(.5).x,190);
});
test('water sways gently to both sides of the flight direction and returns to the target',()=>{
 const e={basicClass:'tidecaller',straight:true,x:40,y:80,tx:340,ty:80},pose=t=>basicProjectilePose({},e,t);
 assert.ok(pose(.25).y>80&&pose(.75).y<80);assert.ok(Math.abs(pose(.25).y-80)<9);
 for(const t of [0,.5,1])assert.ok(Math.abs(pose(t).y-80)<1e-9);
 const vertical={...e,tx:40,ty:380};assert.ok(basicProjectilePose({},vertical,.25).x<40);assert.ok(basicProjectilePose({},vertical,.75).x>40);
});
test('lightning descends on a straight diagonal with a constant heading in either facing direction',()=>{
 for(const tx of [340,-260]){
  const e={basicClass:'stormcaller',straight:true,x:40,y:80,tx,ty:80},pose=t=>basicProjectilePose({},e,t),start=pose(0),end=pose(1);
  assert.ok(start.y<end.y&&end.y-start.y<=18);assert.equal(end.y,80);assert.equal(end.x,tx);
  for(const t of [.25,.5,.75]){assert.equal(pose(t).y,start.y+(end.y-start.y)*t);assert.equal(pose(t).angle,start.angle);}
 }
});
test('painted heads and wakes face the actual tangent of each mage path',()=>{
 for(const basicClass of ['pyromancer','tidecaller','stormcaller'])for(const [tx,ty]of [[340,80],[-260,180],[40,380]]){
  const e={basicClass,straight:true,x:40,y:80,tx,ty};
  for(const t of [.2,.5,.8]){const a=basicProjectilePose({},e,t-.00001),b=basicProjectilePose({},e,t+.00001),p=basicProjectilePose({},e,t);assert.ok(Math.cos(p.angle-Math.atan2(b.y-a.y,b.x-a.x))>.999999);}
 }
});
test('simulation tags all five regular attacks and real hits without tagging active skills',()=>{
 for(const [id,p]of Object.entries(BASIC_PROJECTILE_ART)){
  const replay=buildBasicAttackPreview(p.hero),events=replay.frames.flatMap(f=>f.events),shots=events.filter(e=>e.type==='projectile'&&e.basicClass===id),hits=events.filter(e=>e.type==='impact'&&e.basicClass===id);
  assert.ok(shots.length>0,p.hero);assert.ok(hits.length>0,p.hero);assert.ok(replay.frames.at(-1).enemies[0].hp<100000);assert.ok(shots.every(e=>e.duration>0&&Number.isFinite(e.tx+e.ty)));
  const q=buildSkillPreview(p.hero,'Q').frames.flatMap(f=>f.events).filter(e=>e.type==='projectile');assert.ok(q.every(e=>!e.basicClass));
 }
 const poison=buildBasicAttackPreview('samurai-archer',{poison:true}).frames.flatMap(f=>f.events);assert.ok(poison.some(e=>e.type==='projectile'&&e.basicClass==='ranger'&&e.poisonEnchanted));
 const s=scene();preloadBasicProjectiles(s);renderEvent(s,{id:'poison',type:'projectile',basicClass:'ranger',poisonEnchanted:true,gem:'fire',x:0,y:0,tx:100,ty:0,duration:1},new Set());assert.deepEqual(s.liveVFX[0].basicProjectile.head.setTintValue,[0xb8ff79]);
 const source={classId:'ranger',gemEquipped:true,gem:'ice',buffs:[{time:1,poisonArrows:true}]};assert.deepEqual(basicAttackVisual(source),{basicClass:'ranger',poisonEnchanted:true,gem:'ice'});assert.deepEqual(basicAttackVisual({classId:'guardian'}),{});
});
