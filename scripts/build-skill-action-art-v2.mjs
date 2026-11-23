// Normalize generated skill sheets offline; no pixel processing during combat.
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {effectAlpha} from '../public/effect-alpha.js';
const root=new URL('../public/assets/skill-actions-v2/',import.meta.url);await mkdir(root,{recursive:true});
const sources=new URL('../art/skill-actions-v2/',import.meta.url);
const files=JSON.parse(await readFile(new URL('sources.json',sources)));
const layout={};
for(const [id,name]of files){const file=fileURLToPath(new URL(name,sources));
 const rows=['knight-2','knight-3','samurai-commander'].includes(id)?12:6,meta=await sharp(file).metadata(),cw=meta.width/6,ch=meta.height/rows,frames=[],origins=[],ratios=[];
 const raw=await sharp(file).ensureAlpha().raw().toBuffer(),line=new Float64Array(meta.height+1);
 for(let y=0;y<meta.height;y++){let n=0;for(let x=0;x<meta.width;x++)if(x%cw>cw*.25&&x%cw<cw*.75&&raw[(y*meta.width+x)*4+3]>120)n++;line[y]=n/meta.width;}
 const min=Math.floor(ch*.5),max=Math.ceil(ch*1.7),history=[],cost=new Float64Array(meta.height+1);cost.fill(Infinity);cost[0]=0;let previous=cost;
 for(let k=1;k<=rows;k++){const current=new Float64Array(meta.height+1);current.fill(Infinity);const parent=new Int32Array(meta.height+1);for(let y=k===rows?meta.height:k*min;y<=Math.min(meta.height,k*max);y++){if(k===rows&&y!==meta.height)continue;for(let before=Math.max(0,y-max);before<=y-min;before++){const value=previous[before]+(k===rows?0:line[y])+.06*((y-before)/ch-1)**2;if(value<current[y]){current[y]=value;parent[y]=before;}}}history.push(parent);previous=current;}
 const bounds=Array(rows+1);bounds[rows]=meta.height;for(let k=rows;k>0;k--)bounds[k-1]=history[k-1][bounds[k]];

 for(let row=0;row<rows;row++)for(let col=0;col<6;col++){
  const left=Math.round(col*cw),top=bounds[row],width=Math.round((col+1)*cw)-left,height=bounds[row+1]-top;
  const {data,info}=await sharp(file).extract({left,top,width,height}).resize(192,224,{fit:'contain',position:'south',background:'#00000000',kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let y=0;y<224;y++)for(let x=0;x<192;x++){const i=(y*192+x)*4;data[i+3]=effectAlpha(data[i+3],Math.min(x,191-x,y,223-y),32,3);if(data[i+3]===0)data[i]=data[i+1]=data[i+2]=0;}
  // Remove detached fragments from adjacent generated cells, preserving the body and weapon clusters.
  const seen=new Uint8Array(192*224),components=[];for(let start=0;start<seen.length;start++){if(seen[start]||data[start*4+3]<48)continue;const todo=[start],pixels=[];seen[start]=1;while(todo.length){const k=todo.pop();pixels.push(k);const x=k%192,y=Math.floor(k/192);for(const next of [x>0?k-1:-1,x<191?k+1:-1,y>0?k-192:-1,y<223?k+192:-1])if(next>=0&&!seen[next]&&data[next*4+3]>=48){seen[next]=1;todo.push(next);}}components.push(pixels);}const largest=Math.max(1,...components.map(a=>a.length));for(const pixels of components)if(pixels.length<largest*.1)for(const k of pixels)data[k*4+3]=0;
  let topBody=224,feet=0;for(let y=0;y<224;y++){let solid=0;for(let x=48;x<144;x++)if(data[(y*192+x)*4+3]>120)solid++;if(solid>=5){topBody=Math.min(topBody,y);feet=y;}}origins.push((feet+1)/224);if(col===0)ratios.push(Math.max(.2,(feet-topBody+1)/224));
  frames.push({input:await sharp(data,{raw:info}).png().toBuffer(),left:col*192,top:row*224});
 }
 await writeFile(new URL(id+'.png',root),await sharp({create:{width:1152,height:rows*224,channels:4,background:'#00000000'}}).composite(frames).png().toBuffer());for(let start=0;start<ratios.length;start+=3){const group=ratios.slice(start,start+3).sort((a,b)=>a-b),fixed=group[Math.floor(group.length/2)];for(let i=start;i<Math.min(start+3,ratios.length);i++)ratios[i]=fixed;}layout[id]={rows,origins,ratios};console.log(id,rows*6,'frames');
}

// Merge independently referenced mounted actions into the two knight atlases.
for(const id of ['knight-2','knight-3']){
 const mount=id+'-mounted';if(!layout[mount])throw new Error('Missing mounted reference sheet '+id);
 const normalRows=id==='knight-2'?[0,1,2,3,4,6,7,8,9,10]:[0,1,2,3,4,5],parts=[],origins=[],ratios=[];
 const sources=[{id,rows:normalRows},{id:mount,rows:[0,1,2,3,4,5]}];let target=0;
 for(const source of sources)for(const row of source.rows){const input=await sharp(fileURLToPath(new URL(source.id+'.png',root))).extract({left:0,top:row*224,width:1152,height:224}).png().toBuffer();parts.push({input,left:0,top:target++*224});origins.push(...layout[source.id].origins.slice(row*6,row*6+6));ratios.push(layout[source.id].ratios[row]);}
 const groups=id==='knight-2'?[[0,5],[5,10],[10,13],[13,16]]:[[0,3],[3,6],[6,9],[9,12]];
 for(const [start,end]of groups){const sorted=ratios.slice(start,end).sort((a,b)=>a-b),ratio=sorted[Math.floor(sorted.length/2)];for(let n=start;n<end;n++)ratios[n]=ratio;}
 await writeFile(new URL(id+'.png',root),await sharp({create:{width:1152,height:target*224,channels:4,background:'#00000000'}}).composite(parts).png().toBuffer());
 const rowMap=id==='knight-2'?{normal:[0,3,4],max:[5,8,9],mounted:[10,11,12],mountedMax:[13,14,15]}:{normal:[0,1,2],max:[3,4,5],mounted:[6,7,8],mountedMax:[9,10,11]};
 layout[id]={rows:target,origins,ratios,rowMap};delete layout[mount];
}
await writeFile(new URL('../../skill-action-layout-v2.js',root),'export const SKILL_ACTION_LAYOUT='+JSON.stringify(layout)+';\n');
