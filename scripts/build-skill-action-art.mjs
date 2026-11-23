// Normalize generated skill sheets offline; no pixel processing during combat.
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {effectAlpha} from '../public/effect-alpha.js';
const root=new URL('../public/assets/skill-actions-v1/',import.meta.url);await mkdir(root,{recursive:true});
const sources=new URL('../art/skill-actions-v1/',import.meta.url);
const files=JSON.parse(await readFile(new URL('sources.json',sources)));
const layout={};
for(const [id,name]of files){const file=fileURLToPath(new URL(name,sources));
 const rows=['knight-2','knight-3','samurai-commander'].includes(id)?12:6,meta=await sharp(file).metadata(),cw=meta.width/6,ch=meta.height/rows,frames=[],origins=[],ratios=[];
 const raw=await sharp(file).ensureAlpha().raw().toBuffer(),bounds=[0];
 for(let k=1;k<rows;k++){const expected=Math.round(k*ch),span=Math.floor(ch*.32);let best=expected,score=Infinity;for(let y=Math.max(bounds[k-1]+8,expected-span);y<Math.min(meta.height,expected+span);y++){let n=0;for(let x=0;x<meta.width;x++)if((x%cw)>cw*.25&&(x%cw)<cw*.75&&raw[(y*meta.width+x)*4+3]>120)n++;const value=n+Math.abs(y-expected)*.02;if(value<score){score=value;best=y;}}bounds.push(best);}bounds.push(meta.height);
 const measured={'samurai-commander':[0,131,252,378,505,626,748,850,948,1028,1110,1186,meta.height],'knight-3':[0,128,237,339,443,545,651,750,851,947,1037,1132,meta.height],'knight-2':[0,114,231,345,456,571,681,798,909,1015,1120,1231,meta.height]};if(measured[id])bounds.splice(0,bounds.length,...measured[id]);
 for(let row=0;row<rows;row++)for(let col=0;col<6;col++){
  const left=Math.round(col*cw),top=bounds[row],width=Math.round((col+1)*cw)-left,height=bounds[row+1]-top;
  const {data,info}=await sharp(file).extract({left,top,width,height}).resize(192,224,{fit:'contain',position:'south',background:'#00000000',kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let y=0;y<224;y++)for(let x=0;x<192;x++){const i=(y*192+x)*4;data[i+3]=effectAlpha(data[i+3],Math.min(x,191-x,y,223-y),32,3);if(data[i+3]===0)data[i]=data[i+1]=data[i+2]=0;}
  // Remove detached fragments from adjacent generated cells, preserving the body and weapon clusters.
  const seen=new Uint8Array(192*224),components=[];for(let start=0;start<seen.length;start++){if(seen[start]||data[start*4+3]<48)continue;const todo=[start],pixels=[];seen[start]=1;while(todo.length){const k=todo.pop();pixels.push(k);const x=k%192,y=Math.floor(k/192);for(const next of [x>0?k-1:-1,x<191?k+1:-1,y>0?k-192:-1,y<223?k+192:-1])if(next>=0&&!seen[next]&&data[next*4+3]>=48){seen[next]=1;todo.push(next);}}components.push(pixels);}const largest=Math.max(1,...components.map(a=>a.length));for(const pixels of components)if(pixels.length<largest*.1)for(const k of pixels)data[k*4+3]=0;
  let topBody=224,feet=0;for(let y=0;y<224;y++){let solid=0;for(let x=48;x<144;x++)if(data[(y*192+x)*4+3]>120)solid++;if(solid>=5){topBody=Math.min(topBody,y);feet=y;}}origins.push((feet+1)/224);if(col===0)ratios.push(Math.max(.2,(feet-topBody+1)/224));
  frames.push({input:await sharp(data,{raw:info}).png().toBuffer(),left:col*192,top:row*224});
 }
 await writeFile(new URL(id+'.png',root),await sharp({create:{width:1152,height:rows*224,channels:4,background:'#00000000'}}).composite(frames).png().toBuffer());layout[id]={rows,origins,ratios};console.log(id,rows*6,'frames');
}

await writeFile(new URL('../../skill-action-layout.js',root),'export const SKILL_ACTION_LAYOUT='+JSON.stringify(layout)+';\n');
