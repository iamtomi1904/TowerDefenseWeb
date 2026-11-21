import sharp from 'sharp';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {CATALOG_PROP_LAYOUT,limitPropPalette} from '../public/catalog-prop-art.js';import {CUSTOM_PROP_META} from '../public/custom-props-art.js';
const base=new URL('../public/',import.meta.url),out=new URL('assets/catalog-props-baked/',base);await mkdir(out,{recursive:true});const manifest={};
const sharedSource=await readFile(new URL('terrain.js',base),'utf8')+await readFile(new URL('fortress.js',base),'utf8');
for(const [id,entry]of Object.entries(CATALOG_PROP_LAYOUT)){
 const meta=CUSTOM_PROP_META[id];if(!meta)continue;const [left,top,width,height]=entry.bounds,scale=Math.min((meta.width-4)/width,(meta.height-8)/height),w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale));
 const part=await sharp(await readFile(new URL('assets/catalog-props-v1/'+entry.sheet+'.png',base))).extract({left,top,width,height}).resize(w,h,{kernel:'nearest'}).png().toBuffer();
 const {data,info}=await sharp({create:{width:meta.width,height:meta.height,channels:4,background:'#00000000'}}).composite([{input:part,left:Math.round((meta.width-w)/2),top:meta.height-5-h}]).raw().toBuffer({resolveWithObject:true});
 for(let i=3;i<data.length;i+=4)data[i]=Math.round(255*Math.max(0,(data[i]-32)/223));limitPropPalette(data);
 const png=await sharp(data,{raw:info}).png().toBuffer(),name=createHash('sha256').update(png).digest('hex').slice(0,20)+'.png';await writeFile(new URL(name,out),png);
 manifest[id]={url:'/assets/catalog-props-baked/'+name,shared:!['trees','forest'].includes(meta.group)||sharedSource.includes("'"+id+"'")};
}
await writeFile(new URL('catalog-props-baked.json',base),JSON.stringify(manifest));console.log('Baked props:',Object.keys(manifest).length);
