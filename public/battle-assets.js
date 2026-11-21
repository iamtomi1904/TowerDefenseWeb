import {HEROES} from './content.js';
const aliases={'holy-foot':'knight-2','holy-mounted':'knight-2','holy-paladin':'knight-2','dark-foot':'knight-3','dark-mounted':'knight-3','fallen-knight':'knight-3','fallen-mounted':'knight-3','vanguard-champion':'warrior-3','vanguard-giant':'warrior-3','wind-swordsman':'samurai'};
export function heroOwner(id){return aliases[id]||HEROES.find(h=>h.id===id||h.classId===id||id.startsWith(h.classId+'-'))?.id;}
const CLASS_TEXTURE_OWNERS={
 'guardian-ultimate':['knight-1'],'guardian-dome':['knight-1'],'guardian-actions':['knight-1'],'guardian-fx':['knight-1'],
 'ravager-redesign':['warrior-2'],'katana-forms':['samurai-commander'],'warrior-windup':['warrior-1'],'arctic-windup':['wanderer-magican']
};
export function battleTextureNeeded(key,heroes){const owners=CLASS_TEXTURE_OWNERS[key];return !heroes||!owners||owners.some(id=>heroes.includes(id));}
export function installBattleAssetLoader(scene,manifest,heroes){
 scene.optimizedAssets=manifest;
 const image=scene.load.image.bind(scene.load);
 for(const [key,info]of Object.entries(manifest))if(battleTextureNeeded(key,heroes)&&(info.extra||info.gear&&(!heroes||heroes.includes(heroOwner(info.owner)))))image(key,info.url);
 scene.load.once('complete',()=>{for(const [key,info]of Object.entries(manifest)){if(!info.extra||!info.frames||!scene.textures.exists(key))continue;const tx=scene.textures.get(key),im=tx.getSourceImage();for(let n=0;n<info.frames;n++)tx.add(n,0,(n%(info.columns||info.frames))*im.width/(info.columns||info.frames),Math.floor(n/(info.columns||info.frames))*im.height/(info.rows||1),im.width/(info.columns||info.frames),im.height/(info.rows||1));}});
 scene.load.image=(key,url,...rest)=>{
  if(typeof key!=='string')return image(key,url,...rest);
  if(!battleTextureNeeded(key,heroes))return scene.load;
  const replacement={'ritual-actors-raw':'ritual-actor:0','katana-summon-raw':'katana-summon:blade','moonfall-atlas':'moonfall:moon','moon-animated-atlas':'moon-animated-atlas:clean-alpha-v1','moon-air-thin':'moon-air-thin:clean-alpha-v1','moon-sigil':'moon-sigil:clean-alpha-v1'};
  if(manifest[replacement[key]]?.extra)return scene.load;
  const family=key.split(':')[0],id=key.slice(family.length+1),owner=heroOwner(id);
  if(heroes&&['refresh','ascended','passive-action','empowered','passive','knight-v2'].includes(family)&&owner&&!heroes.includes(owner))return scene.load;
  return image(key,manifest[key]?.url||url,...rest);
 };
}
