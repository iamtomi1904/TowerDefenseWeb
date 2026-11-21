import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {fileURLToPath} from 'node:url';import sharp from 'sharp';
import {CUSTOM_PROP_META} from '../public/custom-props-art.js';import {CATALOG_PROP_LAYOUT} from '../public/catalog-prop-layout.js';import {MAPS} from '../public/content.js';import {mapSceneryAssets} from '../public/map-assets.js';import {unifiedPropAsset} from '../public/terrain.js';
test('baked catalog preserves every registered atlas sprite size and covers all map references',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../public/catalog-props-baked.json',import.meta.url)));const catalog=JSON.parse(await readFile(new URL('../public/catalog-v4.json',import.meta.url)));
 for(const [id,entry]of Object.entries(CATALOG_PROP_LAYOUT)){const meta=CUSTOM_PROP_META[id];if(!meta)continue;assert.ok(manifest[id],id);const image=await sharp(fileURLToPath(new URL('../public'+manifest[id].url,import.meta.url))).metadata();assert.equal(image.width,meta.width);assert.equal(image.height,meta.height);assert.equal(image.hasAlpha,true);}
 for(const map of MAPS){const plan=new Map(mapSceneryAssets({mapAssetCatalog:catalog,mapPropAsset:unifiedPropAsset,mapBakedProps:manifest},map.id));for(const p of map.props){const id=unifiedPropAsset(p.asset);if(manifest[id])assert.ok(plan.has(id),id);}}
});
