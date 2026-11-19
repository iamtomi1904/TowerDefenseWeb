import {EXTRA_BY_BIOME,FORTRESS_PROP_IDS} from './custom-props-art.js';
import {inCastleCourt} from './castle-court.js';
import {zoneContains} from './terrain-grid.js';
import {habitatProps} from './habitat-props.js';
import {createLandscape,waterAt} from './landscape-layout.js';
import {FOREST_LEADERS} from './forest-leaders.js';
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
 dead:{name:'Đất chết',color:0x6f5279,armor:.75},
};
export function biomeAt(map,u){if(inCastleCourt(map,u))return null;const water=waterAt(map,u);if(water)return water;return (map.environment||[]).find(z=>zoneContains(z,u))||null;}
export function terrainModifiers(map,u){const z=biomeAt(map,u),b=BIOMES[z?.type]||{};if(u.flying)return {speed:b.speed>1?b.speed:1,attackSpeed:1,power:b.flyingPower||1,armor:1,burn:0,type:z?.type};return {speed:b.speed||1,attackSpeed:b.attackSpeed||1,power:u.neutral?(b.forestPower||1):1,armor:b.armor||1,burn:b.burn||0,type:z?.type};}
const pointDistance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);};
export function expandBattlefield(m){const scale=mapExpansion(m.id),pos=p=>({...p,x:Math.round(p.x*scale),y:Math.round(p.y*scale)}),base=pos(m.base),lanes=m.lanes.map(l=>l.map(([x,y],i)=>i===l.length-1?[base.x,base.y+110]:i===l.length-2?[base.x,base.y+175]:[x*scale,y*scale])),camps=m.camps.map(pos),count=leaderCount(m.id),defs=Array.from({length:count},(_,i)=>FOREST_LEADERS[(m.id-1+i)%4]),territories=defs.map((def,i)=>({...camps[i],leaderId:def.id,name:def.name,family:def.family,color:def.color,radius:480+scale*60}));
 // Habitat patches are centered on actual monster camps rather than scattered at random.
 const habitat={dragon:'dense',harpy:'wind',undead:'dead',serpent:'dense',wolf:m.id===6?'ice':'dense',stone:'high'},environment=camps.map((camp,i)=>{const territory=territories.find(t=>t.id===camp.id),family=territory?.family||camp.family;return {id:'habitat-'+camp.id,type:m.id===6&&i===0?'ice':m.id===9&&i===0?'lava':habitat[family]||'dense',family,campId:camp.id,x:camp.x,y:camp.y,rx:territory?territory.radius*.9:300,ry:territory?territory.radius*.7:230};});
 const props=m.props.map(pos);
 const CRAFTPIX_BIOME={
  forest:['tree1','tree2','tree3','moss_tree1','moss_tree2','moss_tree3','fruit_tree1','fruit_tree2','fruit_tree3','flower_tree1','flower_tree2','flower_tree3','christmas_tree1','christmas_tree2','christmas_tree3','bush_simple1_1','bush_simple1_2','bush_simple1_3','bush_simple2_1','bush_simple2_2','bush_blue_flowers1','bush_blue_flowers2','bush_pink_flowers1','bush_pink_flowers2','fern1_1','fern1_2','fern1_3','fern2_1','fern2_2','rock1_1','rock1_2','rock2_1','rock2_2','rock3_1','rock3_2','chanterelles1','chanterelles2','beige_green_mushroom1','blue-gray_ruins1','blue-gray_ruins2','water_ruins1'],
  autumn:['autumn_tree1','autumn_tree2','autumn_tree3','tree1','tree2','fruit_tree1','fruit_tree2','autumn_bush1','autumn_bush2','autumn_bush3','bush_orange_flowers1','bush_orange_flowers2','bush_orange_flowers3','fern1_1','fern2_1','rock2_1','rock2_2','rock4_1','rock4_2','brown_ruins1','brown_ruins2','brown_ruins3','chanterelles2','white-red_mushroom1'],
  desert:['palm_tree1_1','palm_tree1_2','palm_tree1_3','palm_tree2_1','palm_tree2_2','palm_tree2_3','cactus1_1','cactus1_2','cactus1_3','cactus2_1','cactus2_2','cactus2_3','bush_orange_flowers1','rock5_1','rock5_2','rock6_1','rock6_2','sand_ruins1','sand_ruins2','sand_ruins3','yellow_ruins1','yellow_ruins2'],
  ice:['snow_tree1','snow_tree2','snow_tree3','snow_christmass_tree1','snow_christmass_tree2','snow_christmass_tree3','snow_bush1','snow_bush2','snow_bush3','white_crystal1','white_crystal2','white_crystal3','blue_crystal1','blue_crystal2','snow_ruins1','snow_ruins2','snow_ruins3','white_ruins1','white_ruins2','rock3_1','rock3_2','rock4_1','rock4_2'],
  lava:['burned_tree1','burned_tree2','burned_tree3','broken_tree1','broken_tree2','broken_tree3','red_crystal1','red_crystal2','red_crystal3','dark_red_-crystal1','dark_red_-crystal2','black_crystal1','black_crystal2','black_crystal3','rock7_1','rock7_2','rock8_1','rock8_2','brown-gray_ruins1','brown-gray_ruins2','brown-gray_ruins3']
 };
 const biomePool=m.id===6?CRAFTPIX_BIOME.ice:m.id===3?CRAFTPIX_BIOME.autumn:m.id===5?CRAFTPIX_BIOME.desert:(m.id===9||m.id===10)?CRAFTPIX_BIOME.lava:CRAFTPIX_BIOME.forest;
 const corridors=(m.campCorridors||[]).map(l=>l.map(([x,y])=>[x*scale,y*scale]));
 const megaPeak=m.id===6?'snow_ruins3':(m.id===9||m.id===10)?'dark_red_-crystal3':'rock6_3';
 let megaCount=0;
 for(let n=0;n<880*scale;n++){const x=50+((n*1237+m.id*197)%Math.floor(1920*scale-100)),y=80+((n*733+m.id*317)%Math.floor(1280*scale-160));if(Math.hypot(x-base.x,y-base.y)<350||lanes.some(l=>l.some((p,k)=>k&&pointDistance(x,y,l[k-1],p)<115))||m.forestPaths.some(l=>pointDistance(x,y,[l[0][0]*scale,l[0][1]*scale],[l[1][0]*scale,l[1][1]*scale])<50)||corridors.some(l=>pointDistance(x,y,l[0],l[1])<68))continue;
  let source;
  if((m.id===6||m.id===9||m.id===10)&&n%120===45&&megaCount<2){megaCount++;source={asset:megaPeak,scale:1.18};}
  else{source={asset:biomePool[(n+m.id*7)%biomePool.length],scale:.9+(n%5)*.06};}
  props.push({...source,id:'expanded-'+n,x,y});
 }
 const expanded={...m,width:1920*scale,height:1280*scale,expansion:scale,riverY:m.id>=2?(740+(m.id%3)*70)*scale:null,base,lanes,camps,territories,environment,props,flowers:m.flowers.map(pos),fortifications:m.fortifications.map(p=>({...p,x:base.x+(p.x-m.base.x),y:base.y+(p.y-m.base.y)})),forestPaths:m.forestPaths.map(l=>l.map(([x,y])=>[x*scale,y*scale])),campCorridors:corridors,description:m.description+' · '+count+' lãnh địa thủ lĩnh.'};expanded.environment=expanded.environment.filter(z=>!['deep','shallow'].includes(z.type));const landscape=createLandscape(expanded);expanded.rivers=landscape.rivers;expanded.bridges=landscape.bridges;expanded.environment.push(...landscape.relief);expanded.props=expanded.props.filter(p=>!inCastleCourt(expanded,p)&&!waterAt(expanded,p)&&!landscape.relief.some(z=>z.type==='mountain'&&zoneContains(z,p))&&Math.hypot(p.x-base.x,p.y-base.y)>300&&!lanes.some(l=>l.some((v,k)=>k&&pointDistance(p.x,p.y,l[k-1],v)<85))&&!camps.some(c=>Math.hypot(p.x-c.x,p.y-c.y)<110)&&!corridors.some(l=>pointDistance(p.x,p.y,l[0],l[1])<64));expanded.props.push(...habitatProps(expanded));return expanded;
}
export const LEADER_BLESSINGS={
 'forest-dragon':{name:'Bùa Đại Ngàn',color:0x8edc78,powerMultiplier:.12,leaderRegen:.005},
 'forest-harpy':{name:'Bùa Nữ Hoàng',color:0xd4b0f5,speed:.15,haste:.1},
 'forest-orc':{name:'Bùa Tù Trưởng',color:0xe3b66e,powerMultiplier:.18,armor:4},
 'forest-undead':{name:'Bùa Kỵ Sĩ Xương',color:0xbca1ed,lifesteal:.08,armor:3},
};
export const BLESSING_DURATION=120;
