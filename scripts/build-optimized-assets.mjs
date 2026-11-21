import sharp from 'sharp';
import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {effectAlpha} from '../public/effect-alpha.js';
const base=new URL('../public/',import.meta.url),out=new URL('assets/optimized/',base);await mkdir(out,{recursive:true});
const manifest={};let before=0,after=0;
async function build(key,url,columns,rows,matteFloor,maxSize){
 const input=await readFile(new URL('.'+url,base));const meta=await sharp(input).metadata();const scale=Math.min(1,maxSize/Math.max(meta.width,meta.height));
 const {data,info}=await sharp(input).resize(Math.max(1,Math.round(meta.width*scale)),Math.max(1,Math.round(meta.height*scale)),{kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
 const x0=Math.round(col*info.width/columns),x1=Math.round((col+1)*info.width/columns),y0=Math.round(row*info.height/rows),y1=Math.round((row+1)*info.height/rows),gutter=Math.max(2,Math.min(x1-x0,y1-y0)*.035);
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*info.width+x)*4;data[i+3]=effectAlpha(data[i+3],Math.min(x-x0,x1-1-x,y-y0,y1-1-y),matteFloor,gutter);if(!data[i+3])data[i]=data[i+1]=data[i+2]=0;}}
 const png=await sharp(data,{raw:info}).png().toBuffer(),hash=createHash('sha256').update(png).digest('hex').slice(0,20),file=hash+'.png';await writeFile(new URL(file,out),png);
 manifest[key]={url:'/assets/optimized/'+file,columns,rows,matteFloor,maxSize};before+=meta.width*meta.height*4;after+=info.width*info.height*4;
}
for(const [folder,prefix,c,r,f,max]of [['ascended','ascended:',6,6,10,1024],['enemy-attacks-v1','enemy-attack:',3,2,48,768],['passive-actions-v1','passive-action:',3,2,20,1024],['troops-v2','troop-v2:',6,6,16,1024]]){
 for(const file of await readdir(new URL('assets/'+folder+'/',base))){if(!file.endsWith('.png'))continue;let id=file.slice(0,-4);if(folder==='ascended'&&id==='samurai-archer')continue;if(id==='samurai-archer-charge-v3')id='samurai-archer';await build(prefix+id,'/assets/'+folder+'/'+file,c,r,f,max);}}
for(const [key,file,c,r,f,max]of [['element-animation','element-animations-v3',4,4,48,1280],['arctic-giant','arctic-giant-v1',2,2,110,1280],['arctic-round','arctic-round-v2',2,2,80,1280],['arctic-shard','arctic-shard-v1',1,1,40,256],['arctic-curved-gust','arctic-curved-gust-v1',1,1,64,512],['meteor-air','meteor-air-v1',1,1,48,512]])await build(key,'/assets/casting/'+file+'.png',c,r,f,max);

const {preloadActionSkills,ACTION_FX}=await import('../public/action-skill-art.js');const urls=new Map();preloadActionSkills({load:{image:(key,url)=>urls.set(key,url)}});
for(const id of ACTION_FX)await build('action-fx:'+id,urls.get('action-fx:'+id),1,1,22,512);
await build('guardian-ultimate','/assets/guardian/ultimate-leap-v2.png',6,2,40,2172);
await build('guardian-dome','/assets/guardian/protective-dome-v1.png',1,1,80,512);
await build('warrior-windup','/assets/casting/warrior-windup-v1.png',6,2,60,2172).catch(e=>{if(e.code!=='ENOENT')throw e;});

const {gearEmissionMask}=await import('../public/gear-emission.js');const gearSources=new Map();
const cat=JSON.parse(await readFile(new URL('catalog-v4.json',base),'utf8'));
for(const [hero,id]of [['warrior-1','berserker'],['knight-1','guardian'],['samurai-commander','duelist']]){
 for(const [action,info]of Object.entries(cat.actors.find(a=>a.id===hero).actions))gearSources.set(id+'|'+hero+':'+action,info.url);
 gearSources.set(id+'|refresh:'+hero,'/assets/heroes-v2/'+hero+'.png');
 if(hero!=='samurai-commander')gearSources.set(id+'|ascended:'+hero,'/assets/ascended/'+hero+'.png');
}
gearSources.set('duelist|katana-forms','/assets/blademaster/katana-forms.png');
for(const [identity,url]of gearSources){
 const [id,key]=identity.split('|');let source;try{source=await readFile(new URL('.'+url,base));}catch(e){if(e.code==='ENOENT')continue;throw e;}
 // Use exactly the same source resolution as the preprocessed body texture.
 if(manifest[key])source=await readFile(new URL('.'+manifest[key].url,base));
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
 const col=Math.min(5,Math.floor(x*6/info.width)),row=Math.min(5,Math.floor(y*6/info.height)),x0=Math.round(col*info.width/6),y0=Math.round(row*info.height/6),w=Math.round((col+1)*info.width/6)-x0,h=Math.round((row+1)*info.height/6)-y0,i=(y*info.width+x)*4;
 if(data[i+3]<60||!gearEmissionMask(id,row*6+col,(x-x0)/w,(y-y0)/h,data[i],data[i+1],data[i+2])){data[i+3]=0;continue;}
 const light=(data[i]+data[i+1]+data[i+2])/3;data[i]=255;data[i+1]=id==='berserker'?65+light*.45:200+light*.2;data[i+2]=id==='berserker'?25:100+light*.4;data[i+3]=Math.round(data[i+3]*(id==='guardian'?.45:.8));
 }
 const png=await sharp(data,{raw:info}).png().toBuffer(),name=createHash('sha256').update(png).digest('hex').slice(0,20)+'.png';await writeFile(new URL(name,out),png);
 manifest['gear-emission:'+id+':'+key]={url:'/assets/optimized/'+name,gear:true,owner:id};
}

for(const [key,file,c,r,f,max]of [['moon-animated-atlas','moon-animated-v2',2,2,72,1024],['moon-air-thin','moon-air-shear-v4',1,1,48,512],['moon-sigil','moon-sigil-v1',1,1,100,768]]){
 await build(key,'/assets/shadow/'+file+'.png',c,r,f,max);
 manifest[key+':clean-alpha-v1']={url:manifest[key].url,extra:true,frames:c*r,columns:c,rows:r};
}
await writeFile(new URL('optimized-assets.json',base),JSON.stringify(manifest));console.log(JSON.stringify({textures:Object.keys(manifest).length,sourceRGBA:before,optimizedRGBA:after}));

await import('./build-ritual-assets.mjs');

await import('./build-catalog-props.mjs');
