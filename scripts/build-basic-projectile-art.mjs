import sharp from 'sharp';
import {readFile,writeFile,mkdir,copyFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const sourceDir=new URL('../art/basic-projectiles-v1/',import.meta.url),out=new URL('../public/assets/basic-projectiles-v1/',import.meta.url);
const generation=JSON.parse(await readFile(new URL('generation.json',sourceDir))),cell=128,parts=[],report=[];
await mkdir(out,{recursive:true});await mkdir(new URL('../.local/',import.meta.url),{recursive:true});
for(const [index,asset]of generation.assets.entries()){
 const file=new URL(asset.id+'.png',sourceDir);try{await access(file);}catch{await copyFile(asset.path,file);}
 const raw=await sharp(fileURLToPath(file)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),frames=[];
 for(let f=0;f<16;f++){
  const x0=Math.round(f%4*raw.info.width/4),x1=Math.round((f%4+1)*raw.info.width/4),y0=Math.round(Math.floor(f/4)*raw.info.height/4),y1=Math.round((Math.floor(f/4)+1)*raw.info.height/4);
  // Offline cell gutters prevent neighboring glow from leaking through frame edges.
  const w=x1-x0,h=y1-y0,pixels=Buffer.alloc(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const a=((y0+y)*raw.info.width+x0+x)*4,b=(y*w+x)*4,edge=Math.min(x,y,w-1-x,h-1-y),fade=Math.min(1,Math.max(0,(edge-4)/18));
   pixels[b]=raw.data[a];pixels[b+1]=raw.data[a+1];pixels[b+2]=raw.data[a+2];pixels[b+3]=Math.round(raw.data[a+3]*fade);
  }
  const input=await sharp(pixels,{raw:{width:w,height:h,channels:4}}).resize(cell-12,cell-12,{kernel:'nearest'}).extend({top:6,bottom:6,left:6,right:6,background:'#00000000'}).png().toBuffer();
  frames.push({input,left:f%4*cell,top:Math.floor(f/4)*cell});
 }
 const atlas=await sharp({create:{width:cell*4,height:cell*4,channels:4,background:'#00000000'}}).composite(frames).png().toBuffer();await writeFile(new URL(asset.id+'.png',out),atlas);
 report.push({id:asset.id,bytes:atlas.length,decoded:cell*cell*16*4});
 const strip=await sharp({create:{width:cell*4,height:cell,channels:4,background:'#20382c'}}).composite([0,5,10,14].map((n,i)=>({input:frames[n].input,left:i*cell,top:0}))).png().toBuffer();parts.push({input:strip,left:0,top:index*cell});
}
await sharp({create:{width:cell*4,height:cell*5,channels:4,background:'#20382c'}}).composite(parts).png().toFile(fileURLToPath(new URL('../.local/basic-projectiles-v1-review.png',import.meta.url)));
console.log(JSON.stringify(report));
