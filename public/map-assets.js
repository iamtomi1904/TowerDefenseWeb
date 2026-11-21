import {LUSH_ROADSIDE,HARSH_ROADSIDE} from './roadside-assets.js';
import {MAPS} from './content.js';
export function mapSceneryAssets(scene,stage){
 const m=MAPS[stage-1],catalog=scene?.mapAssetCatalog;if(!m||!catalog)return [];
 const normalize=scene.mapPropAsset||((id)=>id),needed=new Set([...LUSH_ROADSIDE,...HARSH_ROADSIDE,'chanterelles1','bush_simple1_1','rock1_1','cloud-1','cloud-2','cloud-3']);
 if(m.environment?.some(z=>z.type==='mountain'&&z.ridge)){needed.add(m.id===6?'snow_tree1':m.id===3?'autumn_tree1':m.id===9||m.id===10?'burned_tree1':'christmas_tree1');needed.add(m.id===6?'rock2_1':m.id===3?'tree1':m.id===9||m.id===10?'rock3_1':'rock1_1');}
 for(const p of m.props){needed.add(p.asset);needed.add(normalize(p.asset));}needed.add(m.fortress.ornament);needed.add(normalize(m.fortress.ornament));
 const result=catalog.props.filter(p=>needed.has(p.id)&&!scene.mapBakedProps?.[p.id]).map(p=>[p.id,p.url]);
 for(const [id,info]of Object.entries(scene.mapBakedProps||{}))if(info.shared||needed.has(id))result.push([id,info.url]);
 return result;
}
export function mapBuildingAssets(stage,scene){return [['castle-'+stage,'/assets/castles/castle-'+stage+'.png'],['stone-wall-'+stage,'/assets/v4/stone-tower-'+stage+'.png'],...mapSceneryAssets(scene,stage)];}
export function preloadMapBuildings(scene,stage){for(const n of [stage,stage+1])if(n<=10)for(const [key,url]of mapBuildingAssets(n,scene))if(!scene.textures.exists(key))scene.load.image(key,url);}
export function ensureMapBuildings(scene,stage){
 const jobs=scene.mapBuildingJobs??=new Map();if(jobs.has(stage))return jobs.get(stage);
 const missing=mapBuildingAssets(stage,scene).filter(([key])=>!scene.textures.exists(key));if(!missing.length)return Promise.resolve();
 const job=new Promise((resolve,reject)=>{
  const run=()=>{const failed=[];const onError=file=>{if(missing.some(([key])=>key===file.key))failed.push(file.key);};scene.load.on('loaderror',onError);scene.load.once('complete',()=>{scene.load.off('loaderror',onError);if(failed.length)reject(Error('Không tải được '+failed.join(', ')));else resolve();});for(const [key,url]of missing)if(!scene.textures.exists(key))scene.load.image(key,url);scene.load.start();};
  if(scene.load.isLoading())scene.load.once('complete',run);else run();
 });jobs.set(stage,job);job.catch(()=>jobs.delete(stage));return job;
}
export function releaseOldBuildings(scene,stage){
 const keep=new Set([...mapBuildingAssets(stage,scene),...mapBuildingAssets(stage+1,scene)].map(([key])=>key));
 for(let n=1;n<=10;n++)for(const [key]of mapBuildingAssets(n,scene))if(!keep.has(key)&&scene.textures.exists(key))scene.textures.remove(key);
 for(const n of scene.mapBuildingJobs?.keys()||[])if(n!==stage&&n!==stage+1)scene.mapBuildingJobs.delete(n);
}
