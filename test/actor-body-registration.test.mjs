import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ACTOR_BODY_LAYOUT} from '../public/actor-body-layout.js';
import {bodyLayoutFor,registerActorBody} from '../public/actor-body-registration.js';
import {heroDisplayHeight} from '../public/hero-stature.js';
function actor(key,size=70){
 const layout=bodyLayoutFor(key),files=key.startsWith('passive-action:')?'assets/passive-actions-v1/'+key.split(':')[1]+'.png':key.startsWith('knight-v2:')?'assets/knights-v2/'+key.split(':')[1]+'.png':key.startsWith('ascended:')?'assets/ascended/'+key.split(':')[1]+'.png':key.startsWith('troop-v2:')?'assets/troops-v2/'+key.split(':')[1]+'.png':'assets/heroes-v2/'+key.split(':')[1]+'.png';
 const png=readFileSync(new URL('../public/'+files,import.meta.url)),texture={key:key+':clean-alpha-v1',getSourceImage:()=>({height:png.readUInt32BE(20),width:png.readUInt32BE(16)})};
 const listeners=new Map(),sprite={texture,frame:{name:0},on(k,fn){listeners.set(k,fn);},setScale(n){this.scale=n;return this;},setOrigin(x,y){this.ox=x;this.oy=y;return this;}};return {sprite,size,layout,listeners};
}
test('standing body remains the same height when swapping passive, normal, max and mounted atlases',()=>{
 // Source-art skull-to-sole landmarks, excluding sword tips/plumes/glow.
 for(const [key,span,cellHeight]of [['passive-action:paladin',204,512],['passive-action:paladin-max',206,512],['knight-v2:holy-foot',122.76,208],['passive-action:guardian',333,512],['passive-action:guardian-max',344,512],['passive-action:paladin-mounted',256,512],['passive-action:paladin-mounted-max',304,512]]){
  const mounted=key.includes('mounted'),size=heroDisplayHeight({hero:'knight-2',holyMounted:mounted}),obj=actor(key,size);registerActorBody({},null,obj);
  assert.ok(Math.abs(obj.sprite.scale*span-size)<.3,key);
  const scale=obj.sprite.scale;for(let f=0;f<6;f++){obj.sprite.frame.name=f;registerActorBody({},null,obj);assert.equal(obj.sprite.scale,scale,'crouching never stretches the body');}
  assert.ok(mounted?size>140:size<80);
 }
});
test('every troop keeps its established size and updates the foot anchor even during detached death playback',()=>{
 for(let i=1;i<=9;i++){
  const obj=actor('troop-v2:soldier-'+i,38);registerActorBody({},null,obj);const scale=obj.sprite.scale;
  for(let n=0;n<36;n++){obj.sprite.frame.name=n;obj.listeners.get('animationupdate')();assert.equal(obj.sprite.scale,scale);assert.equal(obj.sprite.oy,obj.layout.originsY[n]);}
  assert.equal(obj.listeners.size,1);assert.equal(obj.sprite.texture.key,'troop-v2:soldier-'+i+':clean-alpha-v1');
 }
});
test('registration is absolute and never accumulates scaling across texture changes or repeated updates',()=>{
 const obj=actor('passive-action:guardian');for(let i=0;i<100;i++){const key=i%2?'ascended:knight-1':'passive-action:guardian',next=actor(key);obj.sprite.texture=next.sprite.texture;registerActorBody({},null,obj);const scale=obj.sprite.scale;for(let j=0;j<10;j++)registerActorBody({},null,obj);assert.equal(obj.sprite.scale,scale);}
 assert.equal(bodyLayoutFor('unregistered-monster'),undefined);assert.equal(registerActorBody({},null,{sprite:{texture:{key:'unregistered-monster'}},size:70}),false);
 assert.equal(Object.keys(ACTOR_BODY_LAYOUT).length,61);
});
