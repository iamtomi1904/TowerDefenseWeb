import {updateVFX} from '../public/effects.js';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {preloadPaintedSkills,createPaintedSkill,updatePaintedSkill,destroyPaintedSkill} from '../public/painted-skill-art.js';
function scene(){const textures=new Map(),metrics={images:0,mutations:0};return {metrics,textures:{exists:k=>textures.has(k),get:k=>textures.get(k)},load:{image(k,path){const b=readFileSync(new URL('../public'+path,import.meta.url)),frames=new Set();textures.set(k,{getSourceImage:()=>({width:b.readUInt32BE(16),height:b.readUInt32BE(20)}),has:f=>frames.has(f),add(f){frames.add(f)}})}},add:{image(){metrics.images++;const im={visible:true,scene:{},setVisible(v){this.visible=v;metrics.mutations++;return this;},destroy(){}};for(const method of ['setPosition','setDisplaySize','setOrigin','setAlpha','setDepth','setRotation','setFrame','setTexture','setTint','clearTint','setBlendMode'])im[method]=()=>{metrics.mutations++;return im};return im}}};}
for(const [name,e]of [['rain',{type:'aoe',skill:'arrow-rain',fieldRemaining:5}],['blizzard',{skill:'blizzard'}]]){const s=scene();preloadPaintedSkills(s);const v={e:{x:0,y:0,radius:205,...e},age:0};const start=performance.now();v.painted=createPaintedSkill(s,v);s.metrics.mutations=0;for(let f=0;f<300;f++){v.age=f/60;updatePaintedSkill(s,v,f/300)}const ms=performance.now()-start;destroyPaintedSkill(v);console.log(JSON.stringify({name,frames:300,...s.metrics,cpuMs:+ms.toFixed(1)}))}

for(const mode of ['full','budget','offscreen']){
 const s=scene();preloadPaintedSkills(s);s.cameras={main:{worldView:{x:0,y:0,width:800,height:600}}};
 s.liveVFX=Array.from({length:4},()=>{const v={e:{x:mode==='offscreen'?5000:400,y:300,radius:205,skill:'blizzard'},age:0,duration:5};v.painted=createPaintedSkill(s,v);return v;});
 s.metrics.mutations=0;const start=performance.now();
 for(let f=0;f<240;f++)if(mode==='full'){for(const v of s.liveVFX){v.age=f/60;updatePaintedSkill(s,v,f/300);}}else updateVFX(s,1/60);
 const ms=performance.now()-start;
 for(const v of s.liveVFX)destroyPaintedSkill(v);
 console.log(JSON.stringify({name:'4 blizzards '+mode,frames:240,...s.metrics,cpuMs:+ms.toFixed(1)}));
}
