import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RAVAGER_ACTIONS,createRavagerAnimations,playRavagerActor,RAVAGER_BLADES,ravagerBladeMask,ravagerGlowActive,updateRavagerBladeGlow} from '../public/ravager-art.js';
const png=readFileSync(new URL('../public/assets/ravager/hero-v2.png',import.meta.url)),width=png.readUInt32BE(16),height=png.readUInt32BE(20);
function scene(){
 const frames=new Map(),animations=new Map(),texture={getSourceImage:()=>({width,height}),add:(id,_,x,y,w,h)=>{assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height);frames.set(id,{x,y,w,h});}};
 return {frames,animations,textures:{get:()=>texture},anims:{create:a=>animations.set(a.key,a)}};
}
function object(){const sprite={anims:{currentAnim:null,timeScale:1},plays:[],setOrigin(x,y){this.origin=[x,y];return this;},setScale(scale){assert.ok(Number.isFinite(scale)&&scale>0);this.scale=scale;return this;},play(key){this.plays.push(key);this.anims.currentAnim={key};return this;}};return {sprite,size:57};}
test('new ravager sheet supplies 36 bounded frames and six complete action sequences',()=>{
 assert.equal(png.readUInt8(25),6,'PNG retains alpha');const s=scene();createRavagerAnimations(s);
 assert.equal(s.frames.size,36);assert.equal(s.animations.size,6);
 for(const action of RAVAGER_ACTIONS){const anim=s.animations.get('ravager-v2:'+action);assert.equal(anim.frames.length,6);assert.equal(anim.repeat,['idle','walk'].includes(action)?-1:0);}
});
test('all ravager actions use new body even during Blood Rage, and one-shot death stays on its final frame',()=>{
 const s=scene(),obj=object(),u={hero:'warrior-2',hp:100,buffs:[{time:5,lifesteal:.18}],castAnim:.5};
 for(const action of RAVAGER_ACTIONS){obj.attackRestart=true;assert.equal(playRavagerActor(s,u,obj,action),true);assert.equal(obj.sprite.anims.currentAnim.key,'ravager-v2:'+action);assert.deepEqual(obj.sprite.origin,[.5,.98]);}
 const count=obj.sprite.plays.length;u.hp=0;playRavagerActor(s,u,obj,'dead');assert.equal(obj.sprite.plays.length,count);
 assert.equal(playRavagerActor(s,{hero:'warrior-1'},obj,'idle'),false);
});
test('Blood Rage uses its roar animation with stable duration instead of the generic attack or old empowered sheet',()=>{
 const s=scene(),obj=object(),u={hero:'warrior-2',hp:100,martialPose:'blood-roar',martialLock:.5,castAnim:.5};obj.attackDuration=500;
 playRavagerActor(s,u,obj,'attack');assert.equal(obj.sprite.anims.currentAnim.key,'ravager-v2:cast');const rate=obj.sprite.anims.timeScale;
 u.castAnim=.1;playRavagerActor(s,u,obj,'attack');assert.equal(obj.sprite.anims.timeScale,rate);
 u.martialLock=0;playRavagerActor(s,u,obj,'idle');assert.equal(obj.sprite.anims.currentAnim.key,'ravager-v2:idle');
});
test('greatsword glow follows all 36 blade positions and excludes the body center',()=>{
 assert.equal(RAVAGER_BLADES.length,36);
 for(const [frame,[gx,gy,tx,ty]]of RAVAGER_BLADES.entries()){
  assert.equal(ravagerBladeMask(gx+(tx-gx)*.6,gy+(ty-gy)*.6,frame),true);
  assert.equal(ravagerBladeMask(.5,.5,frame),false);
 }
});
test('Blood Rage glow stays on for the entire buff and ends on expiry or death',()=>{
 const u={hero:'warrior-2',hp:100,castAnim:0,martialLock:0};
 for(const time of [7,5,.1]){u.buffs=[{time,powerMultiplier:.25,lifesteal:.18}];assert.equal(ravagerGlowActive(u),true);}
 u.buffs[0].time=0;assert.equal(ravagerGlowActive(u),false);
 u.castAnim=.5;assert.equal(ravagerGlowActive(u),true);u.stun=1;assert.equal(ravagerGlowActive(u),false);
 u.buffs[0].time=5;assert.equal(ravagerGlowActive(u),true);u.hp=0;assert.equal(ravagerGlowActive(u),false);
});
test('emissive image tracks actual animation frame, position, scale and left flip, then hides and releases',()=>{
 const s=scene(),obj=object(),u={hero:'warrior-2',hp:100,castAnim:0,buffs:[{time:5,powerMultiplier:.25,lifesteal:.18}]};let destroy;
 Object.assign(obj.sprite,{x:140,y:210,originX:.5,originY:.98,scaleX:.34,scaleY:.34,flipX:true,flipY:false,rotation:0,depth:210,frame:{name:13},once:(_,fn)=>{destroy=fn;}});
 const glow={destroy(){this.destroyed=true;}};
 for(const method of ['setBlendMode','setVisible','setTexture','setPosition','setOrigin','setScale','setFlipX','setFlipY','setRotation','setDepth','setAlpha'])glow[method]=(...args)=>{glow[method+'Args']=args;return glow;};
 s.textures.exists=()=>true;s.add={image:()=>glow};s.time={now:4000};
 updateRavagerBladeGlow(s,u,obj);assert.deepEqual(glow.setTextureArgs,['ravager-blade-glow',13]);assert.deepEqual(glow.setPositionArgs,[140,210]);assert.deepEqual(glow.setFlipXArgs,[true]);
 obj.sprite.frame.name=17;obj.sprite.x=250;obj.sprite.flipX=false;updateRavagerBladeGlow(s,u,obj);assert.deepEqual(glow.setTextureArgs,['ravager-blade-glow',17]);assert.deepEqual(glow.setPositionArgs,[250,210]);assert.deepEqual(glow.setFlipXArgs,[false]);
 u.buffs=[];updateRavagerBladeGlow(s,u,obj);assert.deepEqual(glow.setVisibleArgs,[false]);destroy();assert.equal(glow.destroyed,true);
});
