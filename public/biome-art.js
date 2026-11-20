// Painted terrain materials shared by battle, map viewer and biome catalogue.
export const BIOME_ART_IDS=['mountain','high','low','deep','abyss','shallow','ice','lava','fire','wind','dense','dead','flowers','swamp','desert','snow'];
export const BIOME_ATLAS_CELLS={flowers:[0,0],swamp:[1,0],desert:[0,1],snow:[1,1]};
export const biomeArtwork=id=>id in BIOME_ATLAS_CELLS?'/assets/biomes-v2/materials.png':BIOME_ART_IDS.includes(id)?'/assets/biomes-v1/'+id+'.png':null;
export function preloadBiomeArt(s){for(const id of BIOME_ART_IDS)s.load.image('biome-material:'+id,biomeArtwork(id));}
const patterns=new WeakMap();
export function biomePattern(c,scene,id){
 const key='biome-material:'+id;if(!scene?.textures?.exists?.(key)||typeof document==='undefined'||!c.createPattern)return null;
 let cache=patterns.get(scene);if(!cache){cache=new Map();patterns.set(scene,cache);}
 if(!cache.has(id)){
  const source=scene.textures.get(key).getSourceImage(),tile=document.createElement('canvas'),n=256;tile.width=tile.height=n*2;
  const g=tile.getContext('2d');g.imageSmoothingEnabled=false;
  // Mirrored repeats meet exactly at their edges; originals stay unchanged.
  for(let row=0;row<2;row++)for(let col=0;col<2;col++){g.save();g.translate(col?n*2:0,row?n*2:0);g.scale(col?-1:1,row?-1:1);if(id in BIOME_ATLAS_CELLS){const [col,row]=BIOME_ATLAS_CELLS[id],w=source.width/2,h=source.height/2;g.drawImage(source,col*w,row*h,w,h,0,0,n,n);}else g.drawImage(source,0,0,n,n);g.restore();}
  cache.set(id,tile);
 }
 return c.createPattern(cache.get(id),'repeat');
}
