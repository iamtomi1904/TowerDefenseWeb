import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createActionSkill,updateActionSkill} from '../public/action-skill-art.js';
const root=new URL('../public/',import.meta.url),manifest=JSON.parse(await readFile(new URL('optimized-assets.json',root)));
const textures=new Map(),images=[];
for(const [key,entry] of Object.entries(manifest)){const buf=await readFile(new URL('.'+entry.url,root)),meta=await sharp(buf).metadata();textures.set(key,{buf,width:meta.width,height:meta.height,frames:new Map(),getSourceImage(){return this;},has(n){return this.frames.has(n);},add(n,_,x,y,w,h){this.frames.set(n,{x,y,w,h});}});}
function image(x,y,key,frame){const im={x,y,key,frame,ox:.5,oy:.5,alpha:1,rotation:0,depth:0,visible:true};for(const [name,fn]of Object.entries({setTexture(k,f){this.key=k;this.frame=f;},setPosition(x,y){this.x=x;this.y=y;},setOrigin(x,y){this.ox=x;this.oy=y;},setAlpha(a){this.alpha=a;},setRotation(r){this.rotation=r;},setDepth(d){this.depth=d;},setDisplaySize(w,h){this.w=w;this.h=h;},setVisible(v){this.visible=v;},setScale(){},setFlipX(){},setFlipY(){},setBlendMode(){},clearTint(){}}))im[name]=function(...args){fn.apply(this,args);return this;};images.push(im);return im;}
const scene={optimizedAssets:manifest,textures:{exists:k=>textures.has(k),get:k=>textures.get(k)},add:{image}};
const e={type:'aoe',skill:'blizzard',x:0,y:0,radius:205},p=createActionSkill(scene,e),size=320,count=24,cols=6,rows=4;
const selected=p.nodes.filter(n=>!['ritual','frost-zone','frost'].includes(n.role));
const layers={back:[],front:[]};
for(let f=0;f<count;f++){
 const age=1+f/12;updateActionSkill(scene,{painted:p,e,age},.2);
 const defs=[],ids=new Map();for(const n of selected){const im=n.image,id=im.key+':'+im.frame;if(ids.has(id))continue;const tx=textures.get(im.key),fr=tx.frames.get(im.frame),buf=fr?await sharp(tx.buf).extract({left:fr.x,top:fr.y,width:fr.w,height:fr.h}).png().toBuffer():tx.buf,tag='im'+ids.size;ids.set(id,tag);defs.push(`<image id="${tag}" width="1" height="1" preserveAspectRatio="none" href="data:image/png;base64,${buf.toString('base64')}"/>`);}
 for(const layer of Object.keys(layers)){const nodes=selected.filter(n=>(n.image.depth<2500?'back':'front')===layer).sort((a,b)=>a.image.depth-b.image.depth);const body=nodes.map(({image:i})=>`<g transform="translate(${i.x} ${i.y}) rotate(${i.rotation*180/Math.PI})"><use href="#${ids.get(i.key+':'+i.frame)}" transform="translate(${-i.ox*i.w} ${-i.oy*i.h}) scale(${i.w} ${i.h})" opacity="${i.visible?i.alpha:0}"/></g>`).join('');const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="-250 -250 500 500"><defs>${defs.join('')}</defs>${body}</svg>`;layers[layer].push({input:await sharp(Buffer.from(svg)).png().toBuffer(),left:f%cols*size,top:Math.floor(f/cols)*size});}
}
await mkdir(new URL('assets/baked-skills/',root),{recursive:true});for(const [layer,frames]of Object.entries(layers)){const png=await sharp({create:{width:cols*size,height:rows*size,channels:4,background:'#00000000'}}).composite(frames).png().toBuffer();await writeFile(new URL(`assets/baked-skills/blizzard-${layer}.png`,root),png);console.log(layer,png.length);}
console.log(JSON.stringify({frames:count,size,rgbaBytes:count*size*size*4*2,oldNodes:p.nodes.length,newNodes:8}));
