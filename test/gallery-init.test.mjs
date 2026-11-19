import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('gallery finishes initialization and animates both people without creating the glow canvas twice',async()=>{
 const elements=new Map(),textures=new Map(),animations=new Map(),sprites=[],callbacks=new Map();let scene;
 function element(){return {value:'idle',checked:false,children:[],dataset:{},textContent:'',append(el){this.children.push(el);},replaceChildren(){this.children=[];},setAttribute(){},click(){this.onclick?.();}};}
 const document={querySelector:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);},querySelectorAll:selector=>selector==='#classes button'?document.querySelector('#classes').children:document.querySelector('#skills').children,createElement:tag=>tag==='canvas'?{width:12,height:12,getContext(){return {drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(12*12*4)}),createImageData:()=>({data:new Uint8ClampedArray(12*12*4)}),putImageData(){}};}}:element()};
 function texture(){return {getSourceImage:()=>({width:12,height:12}),add(){},has:()=>false};}
 function display(){const o={x:0,y:0,frame:{name:0},anims:{isPlaying:false,currentAnim:null,timeScale:1},active:true,plays:0};for(const key of ['setDepth','setOrigin','setScale','setVisible','setScrollFactor','setText','setDisplaySize','setAlpha','setFrame','setRotation','setBlendMode','setTexture','setFlipY'])o[key]=()=>o; o.setPosition=(x,y)=>{o.x=x;o.y=y;return o;};o.setFlipX=value=>{o.flipX=value;return o;};o.play=key=>{assert.ok(animations.has(key),'animation exists: '+key);o.anims.currentAnim={key};o.anims.isPlaying=true;o.plays++;return o;};o.once=()=>o;o.destroy=()=>{o.active=false;};return o;}
 const addTexture=key=>{textures.set(key,texture());};
 const saved={document:globalThis.document,window:globalThis.window,fetch:globalThis.fetch,Phaser:globalThis.Phaser,location:globalThis.location};
 Object.assign(globalThis,{document,window:{addEventListener(){}},location:{search:''},fetch:async path=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../public'+path,import.meta.url)))}),Phaser:{AUTO:0,Game:class{
  constructor(config){
   scene={...config.scene,time:{now:0},textures:{get:key=>{assert.ok(textures.has(key),'texture loaded: '+key);return textures.get(key);},exists:key=>textures.has(key),remove:key=>textures.delete(key),addCanvas:(key)=>{assert.ok(!textures.has(key),'glow canvas is created once');addTexture(key);return textures.get(key);},addSpriteSheet:key=>addTexture(key)},load:{on(){},image:key=>addTexture(key),spritesheet:key=>addTexture(key)},anims:{create:a=>{assert.ok(!animations.has(a.key),'animation registered once: '+a.key);animations.set(a.key,a);},generateFrameNumbers:()=>[]},add:{grid:display,text:display,sprite:(x,y)=>{const o=display();o.x=x;o.y=y;sprites.push(o);return o;},graphics:()=>({setDepth(){return this;},clear(){return this;}})},cameras:{main:{setZoom(){return this;},setScroll(){return this;}}}};
   scene.preload();scene.create();
  }
 }}});
 try{
  await import('../public/class-gallery.js?init-regression');
  assert.ok(scene.actorObjects instanceof Map);assert.equal(scene.units.length,2);assert.ok(textures.has('ravager-blade-glow'));
  // Disable optional accents so this test isolates initialization and character animation.
  document.querySelector('#accents').checked=false;scene.update(16,16);
  assert.ok(scene.units.every(u=>u.sprite.anims.isPlaying));
  document.querySelector('#action').value='walk';scene.update(32,16);
  assert.ok(scene.units.every(u=>u.sprite.anims.currentAnim.key.includes('walk')));
  document.querySelector('#action').value='cast';scene.update(48,16);
  assert.equal(scene.units[1].sprite.anims.currentAnim.key,'refresh:fire-wizard:cast');
  // A reused gallery body must not retain the previous class's detached images.
  const remnants=[];const remnant=()=>{const image={destroy(){this.destroyed=true;}};remnants.push(image);return image;};
  const obj=scene.units[1];for(const key of ['ravagerBladeGlow','gearEmission','buffArt'])obj[key]=remnant();
  for(const key of ['progressionWisps','paintedBodies','classAuraSprites'])obj[key]=new Map([[0,remnant()]]);
  obj.weaponGlowUntil=99999;
  document.querySelector('#classes').children.find(b=>b.dataset.hero==='samurai-archer').click();
  assert.ok(remnants.every(image=>image.destroyed),'all previous class overlays are removed');
  assert.equal(obj.weaponGlowUntil,0);assert.equal(obj.ravagerBladeGlow,null);
  scene.update(64,16);assert.equal(obj.sprite.anims.currentAnim.key,'refresh:samurai-archer:cast');
 }finally{Object.assign(globalThis,saved);}
});
