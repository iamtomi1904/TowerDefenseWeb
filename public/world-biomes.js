import {normalizePropFootprints} from './prop-footprints.js';
import {EXTRA_BY_BIOME,FORTRESS_PROP_IDS} from './custom-props-art.js';
import {inCastleCourt} from './castle-court.js';
import {zoneContains} from './terrain-grid.js';
import {habitatProps} from './habitat-props.js';
import {createLandscape,waterAt} from './landscape-layout.js';
import {FOREST_LEADERS} from './forest-leaders.js';
import {placeCluster,propBlockingRadius} from './scene-clusters.js';
export const BOSS_DISPLAY_SCALE=1.5;
export const leaderCount=stage=>Math.min(4,1+Math.floor((stage-1)/3));
export const mapExpansion=stage=>stage<=3?2:stage<=6?3:4;
export const BIOMES={
 mountain:{name:'Núi đá',color:0x7b8179,blocked:true},high:{name:'Gò cao',color:0x829257},low:{name:'Vùng trũng',color:0x59664b},
 deep:{name:'Sông sâu',color:0x245576,blocked:true},
 abyss:{name:'Vực sâu',color:0x16131c,blocked:true},
 shallow:{name:'Suối cạn',color:0x67b7bd,speed:.9},
 ice:{name:'Băng giá',color:0xa5d9eb,speed:.65,attackSpeed:.75},
 lava:{name:'Dung nham',color:0xd65b32,burn:.03},
 fire:{name:'Lửa',color:0xf19e42,burn:.02},
 wind:{name:'Gió',color:0xa7d8c5,speed:1.2,flyingPower:1.25},
 dense:{name:'Rừng rậm',color:0x335b35,forestPower:1.25},
 flowers:{name:'Thảm hoa',color:0x71834e},swamp:{name:'Đầm lầy',color:0x53604a},desert:{name:'Sa mạc',color:0xb69d67},snow:{name:'Tuyết phủ',color:0xc5d9df},
 dead:{name:'Đất chết',color:0x6f5279,armor:.75},
};
export function biomeAt(map,u){if(inCastleCourt(map,u))return null;const water=waterAt(map,u);if(water)return water;return (map.environment||[]).find(z=>zoneContains(z,u))||null;}
export function terrainModifiers(map,u){const z=biomeAt(map,u),b=BIOMES[z?.type]||{};if(u.flying)return {speed:b.speed>1?b.speed:1,attackSpeed:1,power:b.flyingPower||1,armor:1,burn:0,type:z?.type};return {speed:b.speed||1,attackSpeed:b.attackSpeed||1,power:u.neutral?(b.forestPower||1):1,armor:b.armor||1,burn:b.burn||0,type:z?.type};}
const pointDistance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);};
export function expandBattlefield(m){const scale=mapExpansion(m.id),pos=p=>({...p,x:Math.round(p.x*scale),y:Math.round(p.y*scale)}),base=pos(m.base),lanes=m.lanes.map(l=>l.map(([x,y],i)=>i===l.length-1?[base.x,base.y+110]:i===l.length-2?[base.x,base.y+175]:[x*scale,y*scale])),camps=m.camps.map(pos),count=leaderCount(m.id),defs=Array.from({length:count},(_,i)=>FOREST_LEADERS[(m.id-1+i)%4]),territories=defs.map((def,i)=>({...camps[i],leaderId:def.id,name:def.name,family:def.family,color:def.color,radius:480+scale*60}));
 // Habitat patches are centered on actual monster camps rather than scattered at random.
 const habitat={dragon:'dense',harpy:'wind',undead:'dead',serpent:'dense',wolf:m.id===6?'ice':'dense',stone:'high'},environment=camps.map((camp,i)=>{const territory=territories.find(t=>t.id===camp.id),family=territory?.family||camp.family;return {id:'habitat-'+camp.id,type:m.id===6&&i===0?'ice':m.id===9&&i===0?'lava':habitat[family]||'dense',family,campId:camp.id,x:camp.x,y:camp.y,rx:Math.round(1920*scale*(.095+(i%2)*.02)),ry:Math.round(1280*scale*(.095+(i%2)*.02))};});
 const props=m.props.map(pos);
 const CRAFTPIX_BIOME={
  forest:['tree1','tree2','tree3','moss_tree1','moss_tree2','moss_tree3','fruit_tree1','fruit_tree2','fruit_tree3','flower_tree1','flower_tree2','flower_tree3','christmas_tree1','christmas_tree2','christmas_tree3','bush_simple1_1','bush_simple1_2','bush_simple1_3','bush_simple2_1','bush_simple2_2','bush_blue_flowers1','bush_blue_flowers2','bush_pink_flowers1','bush_pink_flowers2','fern1_1','fern1_2','fern1_3','fern2_1','fern2_2','rock1_1','rock1_2','rock2_1','rock2_2','rock3_1','rock3_2','chanterelles1','chanterelles2','beige_green_mushroom1','blue-gray_ruins1','blue-gray_ruins2','water_ruins1'],
  autumn:['autumn_tree1','autumn_tree2','autumn_tree3','tree1','tree2','fruit_tree1','fruit_tree2','autumn_bush1','autumn_bush2','autumn_bush3','bush_orange_flowers1','bush_orange_flowers2','bush_orange_flowers3','fern1_1','fern2_1','rock2_1','rock2_2','rock4_1','rock4_2','brown_ruins1','brown_ruins2','brown_ruins3','chanterelles2','white-red_mushroom1'],
  desert:['palm_tree1_1','palm_tree1_2','palm_tree1_3','palm_tree2_1','palm_tree2_2','palm_tree2_3','cactus1_1','cactus1_2','cactus1_3','cactus2_1','cactus2_2','cactus2_3','bush_orange_flowers1','rock5_1','rock5_2','rock6_1','rock6_2','sand_ruins1','sand_ruins2','sand_ruins3','yellow_ruins1','yellow_ruins2'],
  ice:['snow_tree1','snow_tree2','snow_tree3','snow_christmass_tree1','snow_christmass_tree2','snow_christmass_tree3','snow_bush1','snow_bush2','snow_bush3','white_crystal1','white_crystal2','white_crystal3','blue_crystal1','blue_crystal2','snow_ruins1','snow_ruins2','snow_ruins3','white_ruins1','white_ruins2','rock3_1','rock3_2','rock4_1','rock4_2'],
  lava:['burned_tree1','burned_tree2','burned_tree3','broken_tree1','broken_tree2','broken_tree3','red_crystal1','red_crystal2','red_crystal3','dark_red_-crystal1','dark_red_-crystal2','black_crystal1','black_crystal2','black_crystal3','rock7_1','rock7_2','rock8_1','rock8_2','brown-gray_ruins1','brown-gray_ruins2','brown-gray_ruins3']
 };
 const biomeSets={
  forest:{trees:['tree1','tree2','moss_tree1','moss_tree2','christmas_tree1','flower_tree1'],shrubs:['bush_simple1_1','bush_blue_flowers1','bush_pink_flowers1','fern1_1','fern2_1'],accents:['rock1_1','rock2_1','chanterelles1','chanterelles2','blue-gray_ruins1']},
  autumn:{trees:['autumn_tree1','autumn_tree2','autumn_tree3','tree1','fruit_tree1'],shrubs:['autumn_bush1','autumn_bush2','bush_orange_flowers1','fern1_1'],accents:['rock2_1','rock4_1','chanterelles2','brown_ruins1']},
  desert:{trees:['palm_tree1_1','palm_tree1_2','palm_tree2_1'],shrubs:['cactus1_1','cactus2_1','bush_orange_flowers1'],accents:['rock5_1','rock6_1','sand_ruins1']},
  ice:{trees:['snow_tree1','snow_tree2','snow_christmass_tree1','snow_christmass_tree2'],shrubs:['snow_bush1','snow_bush2','snow_bush3'],accents:['white_crystal1','blue_crystal1','rock3_1','snow_ruins1']},
  lava:{trees:['burned_tree1','burned_tree2','broken_tree1','broken_tree2'],shrubs:['red_crystal1','dark_red_-crystal1','black_crystal1'],accents:['rock7_1','rock8_1','brown-gray_ruins1']}
 };
 const bSet=m.id===6?biomeSets.ice:m.id===3?biomeSets.autumn:m.id===5?biomeSets.desert:(m.id===9||m.id===10)?biomeSets.lava:biomeSets.forest;
 const corridors=(m.campCorridors||[]).map(l=>l.map(([x,y])=>[x*scale,y*scale]));
 const expanded={...m,width:1920*scale,height:1280*scale,expansion:scale,riverY:m.id>=2?(740+(m.id%3)*70)*scale:null,base,lanes,camps,territories,environment,props,flowers:m.flowers.map(pos),fortifications:m.fortifications.map(p=>({...p,x:base.x+(p.x-m.base.x),y:base.y+(p.y-m.base.y)})),forestPaths:m.forestPaths.map(l=>l.map(([x,y])=>[x*scale,y*scale])),campCorridors:corridors,description:m.description+' · '+count+' lãnh địa thủ lĩnh.'};expanded.environment=expanded.environment.filter(z=>!['deep','shallow'].includes(z.type));const landscape=createLandscape(expanded);expanded.rivers=landscape.rivers;expanded.bridges=landscape.bridges;expanded.fords=landscape.fords;expanded.environment.push(...landscape.relief);// Additional ground habitats are decorative and keep the existing combat modifiers unchanged.
 const groundTypes=m.id===5?['desert']:m.id===6||m.id===8?['snow']:m.id>=9?[]:m.id===7?['swamp']:['flowers','swamp'];
 for(const [j,type] of groundTypes.entries()){
  let placed=0;
  for(let k=0;k<30&&placed<2;k++){
   const x=180+((k*739+m.id*197+j*431)%(expanded.width-360)),y=180+((k*593+m.id*317+j*173)%(expanded.height-360)),rx=210+scale*24,ry=145+scale*14;
   if(inCastleCourt(expanded,{x,y})||waterAt(expanded,{x,y})||camps.some(c=>Math.hypot(x-c.x,y-c.y)<rx+230)||expanded.environment.some(z=>Math.hypot((x-z.x)/(z.rx+rx*.6),(y-z.y)/(z.ry+ry*.6))<1))continue;
   expanded.environment.push({id:`ground-${type}-${placed}`,type,x,y,rx,ry});placed++;
  }
 }
 const onBridge=(x,y,pad=56)=>(expanded.bridges||[]).some(b=>{const dx=x-b.x,dy=y-b.y,ca=Math.cos(b.angle),sa=Math.sin(b.angle);return Math.abs(dx*ca+dy*sa)<b.length*.5+pad&&Math.abs(-dx*sa+dy*ca)<(b.width||160)*.5+pad;});
 expanded.props=expanded.props.filter(p=>!inCastleCourt(expanded,p)&&!onBridge(p.x,p.y,56)&&!waterAt(expanded,p)&&!landscape.relief.some(z=>z.type==='mountain'&&zoneContains(z,p))&&Math.hypot(p.x-base.x,p.y-base.y)>300&&!lanes.some(l=>l.some((v,k)=>k&&pointDistance(p.x,p.y,l[k-1],v)<85))&&!camps.some(c=>Math.hypot(p.x-c.x,p.y-c.y)<110)&&!corridors.some(l=>pointDistance(p.x,p.y,l[0],l[1])<64));
 const okSpot=(x,y,minGap=48,blocking=true)=>x>60&&x<expanded.width-60&&y>70&&y<expanded.height-70&&!inCastleCourt(expanded,{x,y})&&!onBridge(x,y,56)&&!waterAt(expanded,{x,y})&&!landscape.relief.some(z=>z.type==='mountain'&&zoneContains(z,{x,y}))&&Math.hypot(x-base.x,y-base.y)>(blocking?300:260)&&!lanes.some(l=>l.some((v,k)=>k&&pointDistance(x,y,l[k-1],v)<(blocking?96:56)))&&!m.forestPaths.some(l=>pointDistance(x,y,[l[0][0]*scale,l[0][1]*scale],[l[1][0]*scale,l[1][1]*scale])<(blocking?58:38))&&!camps.some(c=>Math.hypot(x-c.x,y-c.y)<(blocking?112:82))&&!corridors.some(l=>pointDistance(x,y,l[0],l[1])<(blocking?68:44))&&!expanded.props.some(p=>Math.hypot(p.x-x,p.y-y)<minGap);
 const addOrdered=(asset,x,y,sc=1,minGap=48)=>{const r=propBlockingRadius(asset);if(okSpot(x,y,minGap,r>0))expanded.props.push({id:'ord-'+expanded.props.length,asset,x:Math.round(x),y:Math.round(y),scale:sc,radius:r});};
 for(const asset of m.id===6?['prop-ice-boulder','prop-giant-boulder']:m.id>=9||m.id===5?['prop-giant-boulder']:['prop-ancient-oak','prop-giant-boulder']){
  let count=0;for(let k=0;k<60&&count<3;k++){
   const x=150+(k*839+m.id*367)%(expanded.width-300),y=160+(k*617+m.id*257)%(expanded.height-320);
   const clearance=asset==='prop-ancient-oak'?200:130;
   if(lanes.some(l=>l.some((b,j)=>j&&pointDistance(x,y,l[j-1],b)<clearance))||expanded.props.some(p=>Math.hypot(p.x-x,p.y-y)<clearance*.6))continue;
   const before=expanded.props.length;addOrdered(asset,x,y,1,clearance*.6);if(expanded.props.length>before)count++;
  }
 }
 // Painted ecosystem props: compact fungi/bamboo and rare full-size landmarks.
 for(const [zi,z] of expanded.environment.entries()){
  const ids=z.type==='snow'||z.type==='ice'?['prop-ice-boulder']:z.type==='swamp'?['prop-bamboo-clump','prop-mushroom-woodland']:z.type==='flowers'||z.type==='dense'?['prop-mushroom-woodland','prop-mushroom-russet']:[];
  for(const [j,asset] of ids.entries())for(let k=0;k<6;k++){
   const a=k*2.399+j*1.2,x=z.x+Math.cos(a)*z.rx*.6,y=z.y+Math.sin(a)*z.ry*.55;
   const count=expanded.props.length;addOrdered(asset,x,y,1,62);if(expanded.props.length>count)break;
  }
 }
 // Quy luật 1: Ghép các cụm cây, cụm cỏ (không cản) & cụm nhà/trạm gác (cản) theo lưới sinh thái
 const treePool=m.id===6?['grove-snow-pines']:m.id===3?['grove-autumn-glade','grove-fruit-orchard','grove-arc-trees']:m.id===5?['grove-dead-woods','grove-broken-trees','grove-palm-oasis']:(m.id===9||m.id===10)?['grove-dead-woods','grove-broken-trees']:m.id===7?['grove-dead-woods','grove-broken-trees']:['grove-oak-canopy','grove-arc-trees','grove-triangle-pines','grove-triangle-oak','grove-mixed-size','grove-flower-park','grove-fruit-orchard'];
 const grassPool=m.id===6?['patch-frost-crystals','patch-crystal-cluster-blue']:m.id===5?['patch-boulders-mixed','patch-mossy-stones']:(m.id===9||m.id===10)?['patch-crystal-cluster-red','patch-ember-rocks']:m.id===7?['patch-crystal-cluster-violet','patch-boulders-mixed']:['patch-dense-flowers','patch-dense-blue-flowers','patch-boulders-mixed','patch-crystal-cluster-blue','patch-fern-carpet','patch-mushroom-ring','patch-mossy-stones'];
 const bldClusters=['camp-watch-post','camp-hunter-hearth','camp-ruin-shrine','camp-stone-monolith','camp-supply-depot'];
 const gxCount=Math.max(6,Math.round(expanded.width/310)),gyCount=Math.max(4,Math.round(expanded.height/300));
 for(let gy=0;gy<gyCount;gy++)for(let gx=0;gx<gxCount;gx++){
  const cx=(gx+.55+(gy%2?.12:-.12))*(expanded.width/gxCount),cy=(gy+.52+(gx%2?.1:-.1))*(expanded.height/gyCount);
  const idx=gy*gxCount+gx,inDead=expanded.environment.some(z=>z.type==='dead'&&zoneContains(z,{x:cx,y:cy}));
  const isSparseMap=m.id===5||m.id===7||inDead;
  let cid=idx%7===3?bldClusters[idx%bldClusters.length]:(isSparseMap?(idx%4===0?treePool[idx%treePool.length]:grassPool[idx%grassPool.length]):(idx%3!==2?treePool[idx%treePool.length]:grassPool[idx%grassPool.length]));
  if(inDead&&cid.startsWith('grove-'))cid=idx%2?'grove-dead-woods':'grove-broken-trees';
  else if(inDead&&cid.startsWith('patch-'))cid='patch-crystal-cluster-violet';
  const isNonBlock=cid.startsWith('patch-')&&!cid.includes('stone')&&!cid.includes('boulder')&&!cid.includes('ember')&&!cid.includes('crystal-cluster');
  placeCluster(expanded.props,cid,cx,cy,(x,y)=>okSpot(x,y,isNonBlock?12:18,!isNonBlock));
  if(idx%2===0)placeCluster(expanded.props,m.id===9||m.id===10?'patch-ember-rocks':'patch-boulders-mixed',cx+72,cy+44,(x,y)=>okSpot(x,y,16,true));
 }
 // Quy luật 2: Dải cây rêu ven sông (cản) & cụm dương xỉ/hoa ven bờ (không cản)
 for(const w of expanded.rivers||[]){
  if(w.type==='abyss')continue;
  for(let i=1;i<w.points.length;i++){
   const [ax,ay]=w.points[i-1],[bx,by]=w.points[i],len=Math.hypot(bx-ax,by-ay)||1,nx=-(by-ay)/len,ny=(bx-ax)/len;
   const side=i%2?1:-1,px=(ax+bx)*.5+nx*side*(w.width*.55+42),py=(ay+by)*.5+ny*side*(w.width*.55+42);
   if(i%2===0&&m.id!==6&&m.id!==9&&m.id!==10)placeCluster(expanded.props,'grove-willow-river',px,py,(x,y)=>okSpot(x,y,20,true));
   else addOrdered(i%2?bSet.shrubs[0]:bSet.accents[0],px,py,.96,38);
  }
 }
 // Quy luật 3: Hàng cây bóng mát (cản, cách xa đường) & bụi hoa không cản (sát mép đường)
 for(const l of lanes)for(let k=1;k<l.length;k++){
  const [ax,ay]=l[k-1],[bx,by]=l[k],len=Math.hypot(bx-ax,by-ay)||1,nx=-(by-ay)/len,ny=(bx-ax)/len;
  for(let t=140;t<len-120;t+=135){
   const side=Math.floor(t/135)%2?1:-1;
   addOrdered(bSet.trees[1%bSet.trees.length],ax+(bx-ax)*t/len+nx*side*116,ay+(by-ay)*t/len+ny*side*116,.98,48);
   addOrdered(bSet.shrubs[1%bSet.shrubs.length],ax+(bx-ax)*t/len-nx*side*70,ay+(by-ay)*t/len-ny*side*70,.94,28);
  }
 }
 expanded.props.push(...habitatProps(expanded));
 const bKey=m.id===6?'ice':m.id===3?'autumn':(m.id===9||m.id===10)?'lava':m.id===7?'dead':'forest',extraPool=EXTRA_BY_BIOME[bKey]||EXTRA_BY_BIOME.forest;
 const canPlace=(x,y,blocking=true)=>x>60&&x<expanded.width-60&&y>60&&y<expanded.height-60&&!inCastleCourt(expanded,{x,y})&&!onBridge(x,y,56)&&!waterAt(expanded,{x,y})&&!landscape.relief.some(z=>z.type==='mountain'&&zoneContains(z,{x,y}))&&!lanes.some(l=>l.some((v,k)=>k&&pointDistance(x,y,l[k-1],v)<(blocking?82:54)))&&!camps.some(c=>Math.hypot(x-c.x,y-c.y)<(blocking?98:76));
 const addScene=(asset,x,y,sc=1)=>{const r=propBlockingRadius(asset);if(canPlace(x,y,r>0))expanded.props.push({id:'scene-'+expanded.props.length,asset,x:Math.round(x),y:Math.round(y),scale:sc,radius:r});};
 // 1. Biển chỉ đường, xe hỏng & đuốc canh dọc đường chính & đầu cầu
 for(const [li,l]of lanes.entries())if(l.length>2){const p=l[1],dx=l[1][0]-l[0][0],dy=l[1][1]-l[0][1],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;addScene('prop-wooden-signpost',p[0]+nx*92,p[1]+ny*92,1.05);if(li===0)addScene('prop-wagon-broken',p[0]-nx*96,p[1]-ny*96,1);}
 for(const br of expanded.bridges||[]){const nx=-Math.sin(br.angle),ny=Math.cos(br.angle),tx=Math.cos(br.angle)*(br.length*.46+22),ty=Math.sin(br.angle)*(br.length*.46+22);addScene('prop-lm-torch',br.x+tx+nx*62,br.y+ty+ny*62,1);}
 // 2. Lửa trại, cờ chiến & miếu đá quanh trại quái
 for(const [ci,c]of camps.entries()){const a=(ci*1.7+.6);addScene(ci%2?'prop-lm-campfire-group':'prop-campfire-pot',c.x+Math.cos(a)*132,c.y+Math.sin(a)*104,1);addScene(extraPool[15+(ci%4)]||'prop-ruin-pillar',c.x+Math.cos(a+2.2)*138,c.y+Math.sin(a+2.2)*108,1);}
 // 3. Điểm nhấn Landmark, Custom & Extra Biome trong từng vùng địa hình
 const LM_MAP={dense:['prop-lm-giant-tree','prop-lm-old-well','prop-berry-bush','prop-bloom-shrub','prop-fern-giant'],high:['prop-lm-stone-gate','prop-ruin-pillar','prop-ruin-statue','prop-mana-crystal'],low:['prop-ancient-well','prop-reed-cluster','prop-glow-shroom','prop-moss-boulder'],dead:['prop-lm-ruined-house','prop-lm-square-cage','prop-dead-twisted','prop-thorn-briar'],ice:['prop-lm-ice-statue','prop-ice-monolith','prop-frost-shrub'],lava:['prop-lm-lava-geyser','prop-ember-crystal','prop-obsidian-spire'],fire:['prop-lm-lava-geyser','prop-ember-crystal','prop-charred-ash']};
 for(const [zi,z]of expanded.environment.entries()){
  if(z.ridge||z.type==='mountain')continue;
  const list=LM_MAP[z.type];if(list){addScene(list[0],z.x+(zi%2?-42:42),z.y-18,1);if(list[1])addScene(list[1],z.x+(zi%2?54:-54),z.y+28,1);if(list[2])addScene(list[2],z.x,z.y+46,1);}
  addScene(extraPool[(zi*3+7)%extraPool.length],z.x-z.rx*.36,z.y+z.ry*.22,1);
  addScene(extraPool[(zi*5+11)%extraPool.length],z.x+z.rx*.36,z.y-z.ry*.18,1);
 }
 expanded.props=normalizePropFootprints(expanded.props);
 expanded.props=expanded.props.filter(p=>p.radius===0||(!lanes.some(l=>l.some((v,k)=>k&&pointDistance(p.x,p.y,l[k-1],v)<62))&&!m.forestPaths.some(l=>pointDistance(p.x,p.y,[l[0][0]*scale,l[0][1]*scale],[l[1][0]*scale,l[1][1]*scale])<42)&&!corridors.some(l=>pointDistance(p.x,p.y,l[0],l[1])<46)));
 return expanded;
}
export const LEADER_BLESSINGS={
 'forest-dragon':{name:'Bùa Đại Ngàn',color:0x8edc78,powerMultiplier:.12,leaderRegen:.005},
 'forest-harpy':{name:'Bùa Nữ Hoàng',color:0xd4b0f5,speed:.15,haste:.1},
 'forest-orc':{name:'Bùa Tù Trưởng',color:0xe3b66e,powerMultiplier:.18,armor:4},
 'forest-undead':{name:'Bùa Kỵ Sĩ Xương',color:0xbca1ed,lifesteal:.08,armor:3},
};
export const BLESSING_DURATION=120;
