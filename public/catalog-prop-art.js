import {CATALOG_PROP_LAYOUT,CATALOG_PROP_SHEETS} from './catalog-prop-layout.js';
export {CATALOG_PROP_LAYOUT,CATALOG_PROP_SHEETS};
export function preloadCatalogProps(scene){for(const sheet of CATALOG_PROP_SHEETS)scene.load.image('catalog-prop:'+sheet,'/assets/catalog-props-v1/'+sheet+'.png');}
// Catalog-v4 props use compact palettes (the reference oak uses 14 solid colors).
// Reduce generated shading at native sprite size instead of introducing smooth gradients.
export function limitPropPalette(data,maxColors=24){
 const histogram=new Map();for(let i=0;i<data.length;i+=4)if(data[i+3]>32){const key=(data[i]>>3)<<10|(data[i+1]>>3)<<5|data[i+2]>>3;let p=histogram.get(key);if(!p){p={key,r:0,g:0,b:0,n:0};histogram.set(key,p);}p.r+=data[i];p.g+=data[i+1];p.b+=data[i+2];p.n++;}
 const colors=[...histogram.values()].map(p=>({...p,r:p.r/p.n,g:p.g/p.n,b:p.b/p.n}));if(!colors.length)return;
 const describe=items=>{const ranges=['r','g','b'].map(k=>Math.max(...items.map(p=>p[k]))-Math.min(...items.map(p=>p[k]))),axis=['r','g','b'][ranges.indexOf(Math.max(...ranges))];return {items,axis,score:Math.max(...ranges)*Math.sqrt(items.reduce((n,p)=>n+p.n,0))};};
 const boxes=[describe(colors)];while(boxes.length<maxColors){let index=-1,score=-1;for(let i=0;i<boxes.length;i++)if(boxes[i].items.length>1&&boxes[i].score>score){index=i;score=boxes[i].score;}if(index<0)break;const {items,axis}=boxes.splice(index,1)[0];items.sort((a,b)=>a[axis]-b[axis]);const half=items.reduce((n,p)=>n+p.n,0)/2;let count=0,mid=1;for(;mid<items.length;mid++){count+=items[mid-1].n;if(count>=half)break;}mid=Math.min(items.length-1,mid);boxes.push(describe(items.slice(0,mid)),describe(items.slice(mid)));}
 const palette=boxes.map(({items})=>{const n=items.reduce((v,p)=>v+p.n,0);return ['r','g','b'].map(k=>Math.round(items.reduce((v,p)=>v+p[k]*p.n,0)/n));}),lookup=new Map();
 for(const p of colors){let best=palette[0],distance=Infinity;for(const color of palette){const d=(p.r-color[0])**2+(p.g-color[1])**2+(p.b-color[2])**2;if(d<distance){distance=d;best=color;}}lookup.set(p.key,best);}
 for(let i=0;i<data.length;i+=4)if(data[i+3]>32){const color=lookup.get((data[i]>>3)<<10|(data[i+1]>>3)<<5|data[i+2]>>3);if(color)[data[i],data[i+1],data[i+2]]=color;}
}
export function installCatalogProp(scene,id,meta){
 const entry=CATALOG_PROP_LAYOUT[id];if(!entry||!scene.textures.exists('catalog-prop:'+entry.sheet))return false;
 const image=scene.textures.get('catalog-prop:'+entry.sheet).getSourceImage();
 const canvas=document.createElement('canvas');canvas.width=meta.width;canvas.height=meta.height;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 const [x,y,w,h]=entry.bounds,scale=Math.min((meta.width-4)/w,(meta.height-8)/h),dw=Math.max(1,Math.round(w*scale)),dh=Math.max(1,Math.round(h*scale));
 c.drawImage(image,x,y,w,h,Math.round((meta.width-dw)/2),meta.height-5-dh,dw,dh);
 // Keep real alpha and remove only faint atlas matte, never key out dark outlines.
 const pixels=c.getImageData(0,0,canvas.width,canvas.height);for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=Math.round(255*Math.max(0,(pixels.data[i]-32)/223));limitPropPalette(pixels.data);c.putImageData(pixels,0,0);
 scene.textures.addCanvas(id,canvas);return true;
}
export function prepareCatalogProps(scene,metadata){
 if(typeof document==='undefined')return;
 for(const [id,meta]of Object.entries(metadata))if(!scene.textures.exists(id))installCatalogProp(scene,id,meta);
 // Keep the small registered sprites, release the large source atlases from GPU memory.
 for(const sheet of CATALOG_PROP_SHEETS){const entries=Object.entries(CATALOG_PROP_LAYOUT).filter(([,e])=>e.sheet===sheet);if(entries.every(([id])=>scene.textures.exists(id)))scene.textures.remove?.('catalog-prop:'+sheet);}
}
export async function loadCatalogPropImages(){
 const images=new Map();await Promise.all(CATALOG_PROP_SHEETS.map(sheet=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{images.set('catalog-prop:'+sheet,image);resolve();};image.onerror=()=>reject(Error('Không tải được bộ vật thể '+sheet));image.src='/assets/catalog-props-v1/'+sheet+'.png';})));return images;
}
