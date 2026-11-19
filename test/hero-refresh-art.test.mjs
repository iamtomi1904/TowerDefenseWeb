import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {REFRESH_HEROES,REFRESH_ACTIONS,createHeroRefreshAnimations,playRefreshedHero,warriorSlamFrame,archerChargeFrame} from '../public/hero-refresh-art.js';

test('archer draws and holds for the full second, then releases; stun never releases',()=>{
 const obj={},u={hero:'samurai-archer',hp:100,martialPose:'bow-charge',castAnim:1};
 assert.deepEqual([1,.8,.6,.3,.05].map(t=>archerChargeFrame({...u,castAnim:t},obj,(1-t)*1000)),[18,19,20,21,22]);
 assert.equal(archerChargeFrame({...u,castAnim:0,martialPose:null},obj,1000),23);assert.equal(archerChargeFrame({...u,castAnim:0,martialPose:null},obj,1200),null);
 const cancelled={};archerChargeFrame({...u,castAnim:.1},cancelled,900);assert.equal(archerChargeFrame({...u,castAnim:0,stun:1},cancelled,1000),null);
});
function scene(){
 const textures=new Map(),animations=new Map();
 for(const hero of Object.keys(REFRESH_HEROES)){
  const png=readFileSync(new URL('../public/assets/heroes-v2/'+hero+'.png',import.meta.url)),width=png.readUInt32BE(16),height=png.readUInt32BE(20);assert.equal(png.readUInt8(25),6,'alpha: '+hero);
  const frames=new Map();textures.set('refresh:'+hero,{frames,getSourceImage:()=>({width,height}),add:(id,_,x,y,w,h)=>{assert.ok(Number.isInteger(x)&&Number.isInteger(y)&&Number.isInteger(w)&&Number.isInteger(h));assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height);frames.set(id,{x,y,w,h});}});
 }
 return {textures:{get:key=>textures.get(key)},registered:textures,animations,time:{now:0},anims:{create:anim=>animations.set(anim.key,anim)}};
}
function object(){const sprite={anims:{currentAnim:null,timeScale:1},plays:[],setOrigin(x,y){this.origin=[x,y];return this;},setScale(scale){assert.ok(scale>0&&Number.isFinite(scale));this.scale=scale;return this;},play(key){this.plays.push(key);this.anims.currentAnim={key};return this;}};return {sprite,size:57};}
test('warrior earthquake raises axe, holds it during jump, then drives it down and holds impact',()=>{
 const u={hero:'warrior-1',hp:100,castSkill:'earthquake',martialPose:'leap'};
 const at=t=>warriorSlamFrame({...u,martialLeap:{time:1-t,duration:1}});
 assert.deepEqual([at(0),at(.2),at(.5),at(.9)],[19,20,21,22]);assert.equal(warriorSlamFrame(u),22);assert.equal(warriorSlamFrame({...u,stun:1}),null);
});
test('eight redesigned heroes retain alpha and have 36 complete frames and six action sequences each',()=>{
 const s=scene();createHeroRefreshAnimations(s);assert.equal(s.registered.size,10);assert.equal(s.animations.size,60);
 for(const [key,texture]of s.registered){assert.equal(texture.frames.size,36);for(const action of REFRESH_ACTIONS){const anim=s.animations.get(key+':'+action);assert.equal(anim.frames.length,6);assert.equal(anim.repeat,['idle','walk'].includes(action)?-1:0);}}
});
test('every action uses the new body and the dead pose holds instead of replaying',()=>{
 const s=scene();createHeroRefreshAnimations(s);
 for(const hero of Object.keys(REFRESH_HEROES)){
  const obj=object(),u={hero,hp:100,anim:0,buffs:[{time:5,lifesteal:.25}]};
  for(const action of REFRESH_ACTIONS){assert.equal(playRefreshedHero(s,u,obj,action),true);assert.equal(obj.sprite.anims.currentAnim.key,'refresh:'+hero+':'+action);}
  const count=obj.sprite.plays.length;u.hp=0;playRefreshedHero(s,u,obj,'dead');assert.equal(obj.sprite.plays.length,count);
 }
 assert.equal(playRefreshedHero(s,{hero:'knight-2'},object(),'idle'),false);
});
test('mages cast, the axe warrior swings Q, and older elf skill markers still trigger their new casting row',()=>{
 const s=scene(),mage=object();mage.attackDuration=650;
 playRefreshedHero(s,{hero:'fire-wizard',hp:100,castAnim:.65,anim:.5},mage,'attack');assert.equal(mage.sprite.anims.currentAnim.key,'refresh:fire-wizard:cast');
 const axe=object();playRefreshedHero(s,{hero:'warrior-1',hp:100,castSkill:'cleave',castAnim:.55},axe,'attack');assert.equal(axe.sprite.anims.currentAnim.key,'refresh:warrior-1:attack');
 const elf=object();playRefreshedHero(s,{hero:'dark-elf',hp:100,anim:.5},elf,'idle');assert.equal(elf.sprite.anims.currentAnim.key,'refresh:dark-elf:cast');
 s.time.now=600;playRefreshedHero(s,{hero:'dark-elf',hp:100,anim:0},elf,'idle');assert.equal(elf.sprite.anims.currentAnim.key,'refresh:dark-elf:idle');
});
