import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ASCENDED_IDS,ascendedId,applyAscended,preloadAscended} from '../public/ascended-art.js';
function setup(){
 const textures=new Map();const texture=(key,width,height)=>{const frames=new Set();return {key,getSourceImage:()=>({width,height}),has:n=>frames.has(n),add(n,source,x,y,w,h){assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height);frames.add(n);},frames};};
 const base=texture('refresh:warrior-1',1200,1200);textures.set(base.key,base);
 const s={load:{image(k,path){const b=readFileSync(new URL('../public'+path,import.meta.url));assert.equal(b[25],6);textures.set(k,texture(k,b.readUInt32BE(16),b.readUInt32BE(20)));}},textures:{exists:k=>textures.has(k),get:k=>textures.get(k)}};preloadAscended(s);
 const sprite={texture:base,frame:{name:14},scaleX:2,scaleY:2,setTexture(k,n){this.texture=textures.get(k);this.frame={name:n};return this;},setScale(x,y=x){this.scaleX=x;this.scaleY=y;return this;}};
 return {s,obj:{sprite},textures};
}
test('max-level atlases preserve all36 frames, body height and stable paused scale',()=>{
 for(const id of ASCENDED_IDS){const {s,obj,textures}=setup(),u={hero:id,level:16};if(id.startsWith('holy-'))Object.assign(u,{hero:'knight-2',holyMounted:id.endsWith('mounted')});if(id.startsWith('dark-'))Object.assign(u,{hero:'knight-3',fallenMounted:id.endsWith('mounted')});
  assert.equal(applyAscended(s,u,obj),true);const height=obj.sprite.scaleY*obj.sprite.texture.getSourceImage().height,scale=obj.sprite.scaleY;assert.equal(height,2400);assert.equal(obj.sprite.frame.name,14);assert.equal(textures.get('ascended:'+id).frames.size,36);
  for(let i=0;i<20;i++)applyAscended(s,u,obj);assert.equal(obj.sprite.scaleY,scale);
  u.level=1;applyAscended(s,u,obj);assert.equal(obj.sprite.texture.key,'refresh:warrior-1');assert.equal(obj.sprite.scaleY,2);
 }
});
test('normal levels keep original body and mount variants follow mount state',()=>{
 const {s,obj}=setup();assert.equal(applyAscended(s,{hero:'warrior-1',level:11},obj),false);assert.equal(obj.sprite.texture.key,'refresh:warrior-1');
 assert.equal(ascendedId({hero:'knight-2',holyMounted:true}),'holy-mounted');assert.equal(ascendedId({hero:'knight-3',fallenMounted:false}),'dark-foot');
});
