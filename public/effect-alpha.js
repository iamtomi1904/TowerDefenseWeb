// Generated atlases can retain a faint matte across a whole cell. Remove that
// matte once at upload, and feather the cell gutter so neighboring art cannot bleed.
export function effectAlpha(alpha,edgeDistance,matteFloor=16,gutter=5){
 const body=Math.max(0,(alpha-matteFloor)/(255-matteFloor));
 const edge=Math.max(0,Math.min(1,(edgeDistance-1)/gutter));
 return Math.round(255*body*edge*edge*(3-2*edge));
}
export function cleanEffectTexture(scene,key,{columns=6,rows=6,matteFloor=16,pixelMask=null,maxSize=Infinity}={}){
 const prepared=scene.optimizedAssets?.[key];
 if(prepared&&!pixelMask&&prepared.columns===columns&&prepared.rows===rows&&prepared.matteFloor===matteFloor&&prepared.maxSize===maxSize)return key;
 const clean=key+':clean-alpha-v1';
 if(scene.textures.exists(clean))return clean;
 if(typeof document==='undefined'||!scene.textures.addCanvas)return key;
 const source=scene.textures.get(key).getSourceImage(),canvas=document.createElement('canvas');
 const scale=Math.min(1,maxSize/Math.max(source.width,source.height));
 canvas.width=Math.max(1,Math.round(source.width*scale));canvas.height=Math.max(1,Math.round(source.height*scale));
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(source,0,0,canvas.width,canvas.height);
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),data=pixels.data;
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const x0=Math.round(col*canvas.width/columns),x1=Math.round((col+1)*canvas.width/columns),y0=Math.round(row*canvas.height/rows),y1=Math.round((row+1)*canvas.height/rows),gutter=Math.max(2,Math.min(x1-x0,y1-y0)*.035);
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   const i=(y*canvas.width+x)*4,edge=Math.min(x-x0,x1-1-x,y-y0,y1-1-y);
   data[i+3]=Math.round(effectAlpha(data[i+3],edge,matteFloor,gutter)*(pixelMask?pixelMask(x-x0,y-y0,col,row,x1-x0,y1-y0):1));
   if(!data[i+3])data[i]=data[i+1]=data[i+2]=0;
  }
 }
 ctx.putImageData(pixels,0,0);scene.textures.addCanvas(clean,canvas);return clean;
}
