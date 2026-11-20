import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CUSTOM_PROP_META,ensureCustomPropTexture} from '../public/custom-props-art.js';
import {CATALOG_PROP_LAYOUT,CATALOG_PROP_SHEETS,preloadCatalogProps,installCatalogProp,prepareCatalogProps} from '../public/catalog-prop-art.js';
test('every non-catalog prop has one bounded painted sprite and original Catalog-v4 entries stay independent',()=>{
 assert.equal(Object.keys(CATALOG_PROP_LAYOUT).length,252);assert.deepEqual(Object.keys(CATALOG_PROP_LAYOUT).sort(),Object.keys(CUSTOM_PROP_META).sort());
 const source=new Map();preloadCatalogProps({load:{image(key,url){const b=readFileSync(new URL('../public'+url,import.meta.url));assert.equal(b[25],6,'RGBA transparency');source.set(key,{w:b.readUInt32BE(16),h:b.readUInt32BE(20)});}}});assert.equal(source.size,CATALOG_PROP_SHEETS.length);
 for(const [id,e]of Object.entries(CATALOG_PROP_LAYOUT)){const im=source.get('catalog-prop:'+e.sheet),[x,y,w,h]=e.bounds;assert.ok(im&&w>0&&h>0);assert.ok(x>=0&&y>=0&&x+w<=im.w&&y+h<=im.h,id);const [cols,rows]=e.grid||[4,4],col=e.cell%cols,row=Math.floor(e.cell/cols);assert.ok(x>=Math.round(col*im.w/cols)&&x+w<=Math.round((col+1)*im.w/cols));assert.ok(y>=Math.round(row*im.h/rows)&&y+h<=Math.round((row+1)*im.h/rows));}
 const catalog=JSON.parse(readFileSync(new URL('../public/catalog-v4.json',import.meta.url)));assert.ok(catalog.props.every(p=>!CATALOG_PROP_LAYOUT[p.id]));
});
test('painted props preserve registered canvas dimensions, alpha cleanup and single texture registration',()=>{
 const old=globalThis.document,canvases=[];globalThis.document={createElement(){const canvas={getContext:()=>({drawImage(...args){canvas.draw=args;},getImageData:()=>({data:new Uint8ClampedArray([10,20,30,16,40,50,60,255])}),putImageData(p){canvas.pixels=p.data;}})};canvases.push(canvas);return canvas;}};
 try{
  const added=new Map(),removed=[],scene={textures:{exists:k=>k.startsWith('catalog-prop:')||added.has(k),get:()=>({getSourceImage:()=>({})}),addCanvas:(id,c)=>added.set(id,c),remove:key=>removed.push(key)}};
  for(const [id,meta]of Object.entries(CUSTOM_PROP_META)){assert.equal(ensureCustomPropTexture(scene,id),meta);const c=added.get(id);assert.equal(c.width,meta.width);assert.equal(c.height,meta.height);assert.equal(c.pixels[3],0);assert.equal(c.pixels[7],255);const [,, ,,,x,y,w,h]=c.draw;assert.ok(x>=0&&y>=0&&x+w<=meta.width&&y+h<=meta.height);const count=canvases.length;ensureCustomPropTexture(scene,id);assert.equal(canvases.length,count);}
  assert.equal(installCatalogProp(scene,'tree1',{}),false);
  prepareCatalogProps(scene,CUSTOM_PROP_META);assert.equal(removed.length,CATALOG_PROP_SHEETS.length);assert.ok(removed.every(k=>k.startsWith('catalog-prop:')));
 }finally{globalThis.document=old;}
});

test('limited sprite palettes remove smooth color noise without changing transparency',async()=>{
 const {limitPropPalette}=await import('../public/catalog-prop-art.js');const data=new Uint8ClampedArray(64*64*4);
 for(let i=0;i<data.length;i+=4){const n=i/4;data[i]=n%256;data[i+1]=(n*7)%256;data[i+2]=(n*13)%256;data[i+3]=n%5===0?0:255;}
 const alpha=Array.from(data).filter((_,i)=>i%4===3);limitPropPalette(data,24);const colors=new Set();for(let i=0;i<data.length;i+=4)if(data[i+3])colors.add(data.slice(i,i+3).join(','));assert.ok(colors.size<=24);assert.deepEqual(Array.from(data).filter((_,i)=>i%4===3),alpha);
});
