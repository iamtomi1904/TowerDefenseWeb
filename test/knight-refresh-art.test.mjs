import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {KNIGHT_ATLASES,KNIGHT_ACTIONS,knightForm,createKnightRefresh,playKnightRefresh} from '../public/knight-refresh-art.js';
test('knights have complete transparent foot and mounted animations',()=>{
 const textures=new Map(),animations=new Map();
 for(const id of Object.values(KNIGHT_ATLASES)){
  const png=readFileSync(new URL('../public/assets/knights-v2/'+id+'.png',import.meta.url)),width=png.readUInt32BE(16),height=png.readUInt32BE(20),frames=[];
  assert.equal(png[25],6);
  textures.set('knight-v2:'+id,{getSourceImage:()=>({width,height}),frames,add:(i,_,x,y,w,h)=>{assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height);frames.push(i);}});
 }
 const s={textures:{get:k=>textures.get(k)},anims:{create:a=>animations.set(a.key,a)}};
 createKnightRefresh(s);assert.equal(animations.size,24);
 for(const tx of textures.values())assert.equal(tx.frames.length,36);
 for(const a of animations.values()){assert.equal(a.frames.length,6);assert.equal(a.repeat,/:idle$|:walk$/.test(a.key)?-1:0);}
 const sprite={anims:{},plays:[],setOrigin(){return this;},setScale(v){assert.ok(v>0);return this;},play(key){this.plays.push(key);this.anims.currentAnim={key};}},obj={sprite,size:57},u={hero:'knight-2',hp:100,castCount:1,castAnim:1};
 playKnightRefresh(s,u,obj,'attack');assert.equal(sprite.anims.currentAnim.key,'knight-v2:holy-foot:cast');
 const n=sprite.plays.length;playKnightRefresh(s,u,obj,'attack');assert.equal(sprite.plays.length,n);
 u.castCount++;playKnightRefresh(s,u,obj,'attack');assert.equal(sprite.plays.length,n+1);
 u.holyMounted=true;playKnightRefresh(s,u,obj,'idle');assert.equal(sprite.anims.currentAnim.key,'knight-v2:holy-mounted:idle');
 u.hp=0;playKnightRefresh(s,u,obj,'idle');const d=sprite.plays.length;playKnightRefresh(s,u,obj,'idle');assert.equal(sprite.plays.length,d);
 assert.equal(knightForm({hero:'knight-3',fallenMounted:true}),'dark-mounted');assert.equal(knightForm({hero:'warrior-1'}),null);
});
