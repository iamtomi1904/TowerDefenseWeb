import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TROOP_ART,TROOP_ACTIONS,preloadTroopArt,createTroopAnimations,playTroopActor} from '../public/troop-art.js';
import {TROOP_LAYOUT,TROOP_ART_READY} from '../public/troop-layout.js';
import {TROOPS} from '../public/content.js';
function scene(){
 const textures=new Map(),animations=new Map();
 const s={textures:{exists:k=>textures.has(k),get:k=>textures.get(k)},load:{image(key,path){const bytes=readFileSync(new URL('../public'+path,import.meta.url));assert.equal(bytes[25],6,'PNG alpha retained');const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20),frames=new Map();textures.set(key,{frames,getSourceImage:()=>({width,height}),has:n=>frames.has(n),add(n,_,x,y,w,h){assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height,'frame inside texture');frames.set(n,{x,y,w,h});}});}},anims:{create:a=>animations.set(a.key,a)}};
 preloadTroopArt(s);createTroopAnimations(s);return {s,textures,animations};
}
test('nine regular troop templates have36 bounded frames and6 complete actions',()=>{
 assert.ok(TROOP_ART_READY);const {textures,animations}=scene();assert.equal(textures.size,9);assert.equal(animations.size,54);
 assert.deepEqual(Object.keys(TROOP_ART).sort(),TROOPS.filter(t=>!t.summoned).map(t=>t.sprite).sort());
 for(const [id]of Object.entries(TROOP_ART)){assert.equal(textures.get('troop-v2:'+id).frames.size,36);for(const action of TROOP_ACTIONS){const a=animations.get('troop-v2:'+id+':'+action);assert.equal(a.frames.length,6);assert.equal(a.repeat,['idle','walk'].includes(action)?-1:0);}}
});
test('troops use ten percent larger visible height and planted origin through all actions; dead does not replay',()=>{
 const {s}=scene();for(const id of Object.keys(TROOP_ART)){
  const sprite={anims:{currentAnim:null,timeScale:1},plays:0,setOrigin(x,y){this.origin=[x,y];return this;},setScale(n){this.scale=n;return this;},play(key){this.plays++;this.anims.currentAnim={key};return this;}},obj={sprite,size:38,attackDuration:350},u={sprite:id,hp:100};
  for(const action of TROOP_ACTIONS){assert.ok(playTroopActor(s,u,obj,action));assert.equal(sprite.anims.currentAnim.key,'troop-v2:'+id+':'+action);const l=TROOP_LAYOUT[id],image=s.textures.get('troop-v2:'+id).getSourceImage();assert.ok(Math.abs(sprite.scale*image.height/6*l.bodyRatio-38*1.1*l.originalRatio)<1e-8);assert.deepEqual(sprite.origin,[l.originX,l.originY]);}
  u.hp=0;playTroopActor(s,u,obj,'idle');const plays=sprite.plays;playTroopActor(s,u,obj,'idle');assert.equal(sprite.plays,plays);assert.equal(sprite.anims.currentAnim.key,'troop-v2:'+id+':dead');assert.ok(Number.isFinite(sprite.scale));
 }
 assert.equal(playTroopActor(s,{hero:'knight-1',sprite:'soldier-1',hp:100},{},'idle'),false);
 assert.equal(playTroopActor(s,{sprite:'skeleton',hp:100},{},'idle'),false);
});
