import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {MOONFALL_LAYOUT} from '../public/moonfall-layout.js';
import {RITUAL_ACTOR_ROWS,KATANA_SUMMON_LAYOUT} from '../public/ritual-casting-layout.js';
const base=new URL('../public/',import.meta.url),manifest=JSON.parse(await readFile(new URL('optimized-assets.json',base)));
async function save(key,input,floor,frames=0){
 const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=3;i<data.length;i+=4)data[i]=Math.round(255*Math.max(0,(data[i]-floor)/(255-floor)));
 const png=await sharp(data,{raw:info}).png().toBuffer(),name=createHash('sha256').update(png).digest('hex').slice(0,20)+'.png';await writeFile(new URL('assets/optimized/'+name,base),png);
 manifest[key]={url:'/assets/optimized/'+name,extra:true,frames};
}
async function cropSheet(file,layout,prefix){
 const source=await readFile(new URL('assets/'+file,base));
 for(const [id,[left,top,width,height]]of Object.entries(layout)){
 const size=prefix==='moonfall:'?(id==='moon'?[128,128]:id==='corona'?[192,192]:id==='impact'?[256,176]:[256,160]):id==='blade'?[96,256]:id==='impact'?[256,176]:[192,160];
 const scale=Math.min((size[0]-4)/width,(size[1]-4)/height),w=Math.round(width*scale),h=Math.round(height*scale);
 const part=await sharp(source).extract({left,top,width,height}).resize(w,h,{kernel:'nearest'}).toBuffer();
 const png=await sharp({create:{width:size[0],height:size[1],channels:4,background:'#00000000'}}).composite([{input:part,left:Math.round((size[0]-w)/2),top:Math.round((size[1]-h)/2)}]).png().toBuffer();await save(prefix+id,png,32);
 }
}
await cropSheet('shadow/moonfall-v1.png',MOONFALL_LAYOUT,'moonfall:');await cropSheet('casting/katana-summon-v1.png',KATANA_SUMMON_LAYOUT,'katana-summon:');
const source=await readFile(new URL('assets/casting/ritual-actors-v1.png',base)),meta=await sharp(source).metadata();
for(let row=0;row<4;row++){
 const info=RITUAL_ACTOR_ROWS[row],[x,y,w,h]=info.crop,scale=Math.min(180/w,210/h),parts=[];
 for(let n=0;n<6;n++){const input=await sharp(source).extract({left:Math.round(n*meta.width/6+x),top:Math.round(row*meta.height/4+y),width:w,height:h}).resize(Math.round(w*scale),Math.round(h*scale),{kernel:'nearest'}).png().toBuffer();parts.push({input,left:n*192+Math.round((192-w*scale)/2),top:Math.round(218-(info.foot-y)*scale)});}
 const png=await sharp({create:{width:1152,height:224,channels:4,background:'#00000000'}}).composite(parts).png().toBuffer();await save('ritual-actor:'+row,png,64,6);
}
await writeFile(new URL('optimized-assets.json',base),JSON.stringify(manifest));console.log('Prepared moon, ritual and sword summon art');
