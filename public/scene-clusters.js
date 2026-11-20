// Cụm cảnh ghép sẵn (Tree Clusters, Grass/Rock Clusters, Building/Camp Clusters)
export const SCENE_CLUSTERS={
 // 1. Cụm Cây (đa dạng số lượng: 2, 3, 4, 5, 6, 7 cây sát nhau)
 'grove-oak-canopy':{
  group:'tree-cluster',label:'Cụm 7 Cây Đại Thụ (tree1)',
  items:[
   {asset:'tree1',dx:-18,dy:-20,sc:.94},
   {asset:'tree1',dx:18,dy:-18,sc:.90},
   {asset:'tree1',dx:-38,dy:-2,sc:.84},
   {asset:'tree1',dx:0,dy:0,sc:1.16},
   {asset:'tree1',dx:38,dy:2,sc:.86},
   {asset:'tree1',dx:-22,dy:18,sc:.82},
   {asset:'tree1',dx:22,dy:18,sc:.84}
  ]
 },
 'grove-pine-ridge':{
  group:'tree-cluster',label:'Cụm 4 Cây Thông (christmas_tree1)',
  items:[
   {asset:'christmas_tree1',dx:-18,dy:-12,sc:.96},
   {asset:'christmas_tree1',dx:18,dy:-10,sc:.92},
   {asset:'christmas_tree1',dx:-2,dy:8,sc:1.12},
   {asset:'christmas_tree1',dx:26,dy:14,sc:.82}
  ]
 },
 'grove-autumn-glade':{
  group:'tree-cluster',label:'Cụm 3 Cây Rừng Thu (autumn_tree1)',
  items:[
   {asset:'autumn_tree1',dx:-20,dy:-10,sc:.92},
   {asset:'autumn_tree1',dx:20,dy:-8,sc:.88},
   {asset:'autumn_tree1',dx:0,dy:10,sc:1.12}
  ]
 },
 'grove-snow-pines':{
  group:'tree-cluster',label:'Cụm 6 Cây Tuyết (snow_tree1)',
  items:[
   {asset:'snow_tree1',dx:0,dy:-18,sc:1.10},
   {asset:'snow_tree1',dx:-26,dy:-6,sc:.94},
   {asset:'snow_tree1',dx:26,dy:-4,sc:.92},
   {asset:'snow_tree1',dx:-34,dy:14,sc:.80},
   {asset:'snow_tree1',dx:0,dy:12,sc:1.02},
   {asset:'snow_tree1',dx:34,dy:14,sc:.82}
  ]
 },
 'grove-dead-woods':{
  group:'tree-cluster',label:'Cụm Cây Khô Không Lá (broken_tree1)',
  items:[
   {asset:'broken_tree1',dx:-20,dy:-10,sc:1.06},
   {asset:'broken_tree1',dx:18,dy:-4,sc:.92},
   {asset:'broken_tree1',dx:-4,dy:12,sc:.86}
  ]
 },
 'grove-broken-trees':{
  group:'tree-cluster',label:'Cặp Cây Khô Trơ Cành (broken_tree2)',
  items:[
   {asset:'broken_tree2',dx:-16,dy:-6,sc:1.08},
   {asset:'broken_tree2',dx:16,dy:8,sc:.88}
  ]
 },
 'grove-willow-river':{
  group:'tree-cluster',label:'Cụm 3 Cây Rêu Ven Sông (moss_tree2)',
  items:[
   {asset:'moss_tree2',dx:-18,dy:-10,sc:.95},
   {asset:'moss_tree2',dx:20,dy:-4,sc:.88},
   {asset:'moss_tree2',dx:0,dy:10,sc:1.08}
  ]
 },
 'grove-flower-park':{
  group:'tree-cluster',label:'Cụm 4 Cây Hoa Đào (flower_tree1)',
  items:[
   {asset:'flower_tree1',dx:-20,dy:-12,sc:.94},
   {asset:'flower_tree1',dx:20,dy:-10,sc:.92},
   {asset:'flower_tree1',dx:0,dy:6,sc:1.10},
   {asset:'flower_tree1',dx:-28,dy:14,sc:.84}
  ]
 },
 'grove-fruit-orchard':{
  group:'tree-cluster',label:'Cặp Cây Ăn Quả (fruit_tree1)',
  items:[
   {asset:'fruit_tree1',dx:-16,dy:-6,sc:1.06},
   {asset:'fruit_tree1',dx:18,dy:8,sc:.86}
  ]
 },
 'grove-palm-oasis':{
  group:'tree-cluster',label:'Cụm Cọ Sa Mạc (palm_tree1_1)',
  items:[
   {asset:'palm_tree1_1',dx:-18,dy:-12,sc:.95},
   {asset:'palm_tree1_1',dx:20,dy:-8,sc:.90},
   {asset:'palm_tree1_1',dx:0,dy:8,sc:1.10}
  ]
 },

 // 2. Cụm Cỏ, Hoa & Nấm KHÔNG CẢN (radius = 0) + Cụm Đá CẢN (radius > 0)
 'patch-meadow-flowers':{
  group:'grass-cluster',label:'Cụm Bụi Hoa Hồng - Không Cản (bush_pink_flowers1)',
  items:[
   {asset:'bush_pink_flowers1',dx:-16,dy:-8,sc:.95},
   {asset:'bush_pink_flowers1',dx:16,dy:-6,sc:.92},
   {asset:'bush_pink_flowers1',dx:0,dy:4,sc:1.08},
   {asset:'bush_pink_flowers1',dx:-22,dy:10,sc:.86},
   {asset:'bush_pink_flowers1',dx:20,dy:12,sc:.88}
  ]
 },
 'patch-blue-blooms':{
  group:'grass-cluster',label:'Cụm Bụi Hoa Xanh - Không Cản (bush_blue_flowers1)',
  items:[
   {asset:'bush_blue_flowers1',dx:-16,dy:-8,sc:.95},
   {asset:'bush_blue_flowers1',dx:16,dy:-6,sc:.92},
   {asset:'bush_blue_flowers1',dx:0,dy:4,sc:1.08},
   {asset:'bush_blue_flowers1',dx:-20,dy:12,sc:.86}
  ]
 },
 'patch-fern-carpet':{
  group:'grass-cluster',label:'Cụm Dương Xỉ - Không Cản (fern1_1)',
  items:[
   {asset:'fern1_1',dx:-16,dy:-8,sc:.95},
   {asset:'fern1_1',dx:16,dy:-6,sc:.92},
   {asset:'fern1_1',dx:0,dy:4,sc:1.08},
   {asset:'fern1_1',dx:-20,dy:12,sc:.88},
   {asset:'fern1_1',dx:20,dy:12,sc:.86}
  ]
 },
 'patch-mushroom-ring':{
  group:'grass-cluster',label:'Cụm Nấm Rừng - Không Cản (chanterelles1)',
  items:[
   {asset:'chanterelles1',dx:-14,dy:-6,sc:.95},
   {asset:'chanterelles1',dx:14,dy:-4,sc:.90},
   {asset:'chanterelles1',dx:0,dy:6,sc:1.08},
   {asset:'chanterelles1',dx:-16,dy:12,sc:.85}
  ]
 },
 'patch-mossy-stones':{
  group:'grass-cluster',label:'Cụm Đá Rêu - Cản (rock1_1)',
  items:[
   {asset:'rock1_1',dx:-16,dy:-8,sc:.95},
   {asset:'rock1_1',dx:16,dy:-6,sc:.90},
   {asset:'rock1_1',dx:0,dy:6,sc:1.10},
   {asset:'rock1_1',dx:-22,dy:12,sc:.82}
  ]
 },
 'grove-arc-trees':{
  group:'tree-cluster',label:'Nhóm Cây Vòng Cung (To → Nhỏ)',
  items:[
   {asset:'tree1',dx:0,dy:-18,sc:1.18},
   {asset:'tree1',dx:-28,dy:-10,sc:.98},
   {asset:'tree1',dx:28,dy:-10,sc:.96},
   {asset:'tree2',dx:-46,dy:8,sc:.82},
   {asset:'tree2',dx:46,dy:8,sc:.80}
  ]
 },
 'grove-triangle-pines':{
  group:'tree-cluster',label:'Nhóm Thông Tam Giác (To → Nhỏ)',
  items:[
   {asset:'christmas_tree1',dx:0,dy:-22,sc:1.18},
   {asset:'christmas_tree1',dx:-18,dy:-4,sc:.96},
   {asset:'christmas_tree1',dx:18,dy:-4,sc:.96},
   {asset:'christmas_tree2',dx:-34,dy:14,sc:.78},
   {asset:'christmas_tree2',dx:0,dy:16,sc:.80},
   {asset:'christmas_tree2',dx:34,dy:14,sc:.78}
  ]
 },
 'grove-triangle-oak':{
  group:'tree-cluster',label:'Nhóm Cây Tam Giác (tree3)',
  items:[
   {asset:'tree3',dx:0,dy:-20,sc:1.18},
   {asset:'tree3',dx:-20,dy:-2,sc:.95},
   {asset:'tree3',dx:20,dy:-2,sc:.95},
   {asset:'tree3',dx:-36,dy:16,sc:.76},
   {asset:'tree3',dx:0,dy:18,sc:.78},
   {asset:'tree3',dx:36,dy:16,sc:.76}
  ]
 },
 'grove-mixed-size':{
  group:'tree-cluster',label:'Nhóm Cây To Cây Nhỏ Quây Quần',
  items:[
   {asset:'moss_tree1',dx:0,dy:-4,sc:1.22},
   {asset:'tree2',dx:-28,dy:-14,sc:.76},
   {asset:'tree2',dx:28,dy:-12,sc:.74},
   {asset:'tree2',dx:-24,dy:14,sc:.80},
   {asset:'tree2',dx:26,dy:14,sc:.78}
  ]
 },
 'patch-dense-flowers':{
  group:'grass-cluster',label:'Nhóm Hoa Dày Đặc Hồng - Không Cản',
  items:[
   {asset:'bush_pink_flowers1',dx:-18,dy:-10,sc:.96},
   {asset:'bush_pink_flowers1',dx:0,dy:-12,sc:1.06},
   {asset:'bush_pink_flowers1',dx:18,dy:-10,sc:.94},
   {asset:'bush_pink_flowers1',dx:-22,dy:2,sc:.92},
   {asset:'bush_pink_flowers1',dx:0,dy:2,sc:1.10},
   {asset:'bush_pink_flowers1',dx:22,dy:2,sc:.92},
   {asset:'bush_pink_flowers1',dx:-12,dy:12,sc:.88},
   {asset:'bush_pink_flowers1',dx:12,dy:12,sc:.88}
  ]
 },
 'patch-dense-blue-flowers':{
  group:'grass-cluster',label:'Nhóm Hoa Dày Đặc Xanh - Không Cản',
  items:[
   {asset:'bush_blue_flowers1',dx:-18,dy:-10,sc:.95},
   {asset:'bush_blue_flowers1',dx:0,dy:-12,sc:1.05},
   {asset:'bush_blue_flowers1',dx:18,dy:-10,sc:.95},
   {asset:'bush_blue_flowers1',dx:-20,dy:2,sc:.94},
   {asset:'bush_blue_flowers1',dx:0,dy:2,sc:1.10},
   {asset:'bush_blue_flowers1',dx:20,dy:2,sc:.94},
   {asset:'bush_blue_flowers1',dx:-10,dy:12,sc:.86},
   {asset:'bush_blue_flowers1',dx:10,dy:12,sc:.86}
  ]
 },
 'patch-boulders-mixed':{
  group:'grass-cluster',label:'Nhóm Đá To Nhỏ Sát Nhau - Cản',
  items:[
   {asset:'rock1_1',dx:0,dy:-6,sc:1.22},
   {asset:'rock2_1',dx:-22,dy:2,sc:.92},
   {asset:'rock2_1',dx:22,dy:4,sc:.88},
   {asset:'rock1_2',dx:-14,dy:14,sc:.72},
   {asset:'rock1_2',dx:10,dy:15,sc:.68},
   {asset:'rock2_2',dx:28,dy:14,sc:.65}
  ]
 },
 'patch-crystal-cluster-blue':{
  group:'grass-cluster',label:'Nhóm Khối Tinh Thể Xanh Sát Nhau - Cản',
  items:[
   {asset:'blue_crystal1',dx:0,dy:-8,sc:1.20},
   {asset:'blue_crystal2',dx:-16,dy:0,sc:.92},
   {asset:'blue_crystal2',dx:16,dy:0,sc:.90},
   {asset:'blue_crystal3',dx:-10,dy:12,sc:.76},
   {asset:'blue_crystal3',dx:12,dy:12,sc:.74},
   {asset:'white_crystal1',dx:0,dy:14,sc:.72}
  ]
 },
 'patch-crystal-cluster-red':{
  group:'grass-cluster',label:'Nhóm Khối Tinh Thể Đỏ Sát Nhau - Cản',
  items:[
   {asset:'red_crystal1',dx:0,dy:-8,sc:1.20},
   {asset:'red_crystal2',dx:-16,dy:0,sc:.92},
   {asset:'red_crystal2',dx:16,dy:0,sc:.90},
   {asset:'red_crystal3',dx:-10,dy:12,sc:.76},
   {asset:'red_crystal3',dx:12,dy:12,sc:.74}
  ]
 },
 'patch-crystal-cluster-violet':{
  group:'grass-cluster',label:'Nhóm Khối Tinh Thể Tím Sát Nhau - Cản',
  items:[
   {asset:'violet_crystal1',dx:0,dy:-8,sc:1.18},
   {asset:'violet_crystal2',dx:-15,dy:2,sc:.90},
   {asset:'violet_crystal2',dx:15,dy:2,sc:.88},
   {asset:'violet_crystal1',dx:-8,dy:12,sc:.72},
   {asset:'violet_crystal1',dx:10,dy:12,sc:.72}
  ]
 },
 'patch-frost-crystals':{
  group:'grass-cluster',label:'Cụm Bụi Tuyết - Không Cản (snow_bush1)',
  items:[
   {asset:'snow_bush1',dx:-16,dy:-8,sc:.95},
   {asset:'snow_bush1',dx:16,dy:-6,sc:.92},
   {asset:'snow_bush1',dx:0,dy:4,sc:1.08},
   {asset:'snow_bush1',dx:-22,dy:10,sc:.86},
   {asset:'snow_bush1',dx:20,dy:12,sc:.88}
  ]
 },
 'patch-ember-rocks':{
  group:'grass-cluster',label:'Cụm Tinh Thể Lửa - Cản (red_crystal1)',
  items:[
   {asset:'red_crystal1',dx:-14,dy:-8,sc:.94},
   {asset:'red_crystal1',dx:16,dy:-6,sc:.90},
   {asset:'red_crystal1',dx:0,dy:6,sc:1.10},
   {asset:'red_crystal1',dx:-20,dy:12,sc:.82}
  ]
 },

 // 3. Cụm Nhà & Trạm Gác - CẢN (Building & Settlement Clusters)
 'camp-watch-post':{
  group:'building-cluster',label:'Cụm Trạm Gác Tiền Tiêu',
  items:[
   {asset:'prop-fw-palisade',dx:-26,dy:-14,sc:1.0},
   {asset:'prop-fw-battlement',dx:28,dy:-14,sc:1.0},
   {asset:'prop-fw-tar-cauldron',dx:-34,dy:14,sc:1.0},
   {asset:'prop-fw-ration-cart',dx:22,dy:16,sc:1.0},
   {asset:'prop-wooden-signpost',dx:0,dy:26,sc:1.0}
  ]
 },
 'camp-ruin-shrine':{
  group:'building-cluster',label:'Cụm Nhà Đổ & Phế Tích',
  items:[
   {asset:'prop-lm-ruined-house',dx:0,dy:-10,sc:1.0},
   {asset:'prop-ruin-pillar',dx:-58,dy:10,sc:.96},
   {asset:'blue-gray_ruins1',dx:56,dy:12,sc:.95},
   {asset:'bush_simple1_2',dx:-32,dy:28,sc:.95},
   {asset:'fern1_1',dx:32,dy:28,sc:.95}
  ]
 },
 'camp-hunter-hearth':{
  group:'building-cluster',label:'Cụm Giếng Cổ & Trại Nghỉ',
  items:[
   {asset:'prop-lm-old-well',dx:-32,dy:-8,sc:1.0},
   {asset:'prop-lm-campfire-group',dx:28,dy:4,sc:1.0},
   {asset:'prop-wagon-broken',dx:-24,dy:28,sc:.96},
   {asset:'rock1_2',dx:48,dy:22,sc:.9}
  ]
 },
 'camp-stone-monolith':{
  group:'building-cluster',label:'Cụm Tượng Cổ & Pha Lê',
  items:[
   {asset:'prop-ruin-statue',dx:0,dy:-12,sc:1.0},
   {asset:'prop-mana-crystal',dx:-38,dy:10,sc:.95},
   {asset:'prop-mana-crystal',dx:38,dy:10,sc:.95},
   {asset:'bush_blue_flowers1',dx:0,dy:26,sc:.95}
  ]
 },
 'camp-supply-depot':{
  group:'building-cluster',label:'Cụm Kho Tiếp Tế & Rào Chắn',
  items:[
   {asset:'prop-fw-stone-cart',dx:-26,dy:-6,sc:1.0},
   {asset:'prop-fw-repair-oak',dx:26,dy:-4,sc:1.0},
   {asset:'prop-fw-sandbag-wall',dx:0,dy:20,sc:1.0}
  ]
 }
};

export function propBlockingRadius(asset){
 if(!asset)return 0;
 if(asset==='prop-ancient-oak')return 36;
 if(asset==='prop-giant-boulder')return 28;
 if(asset==='prop-ice-boulder')return 21;
 if(asset==='prop-bamboo-clump')return 16;
 if(asset.includes('bush')||asset.includes('fern')||asset.includes('mushroom')||asset.includes('chanterelles')||asset==='prop-wooden-signpost')return 0;
 if(asset.includes('tree')||asset.includes('oak')||asset.includes('pine')||asset.includes('willow')||asset.includes('palm')||asset.includes('sakura'))return 17;
 if(asset.includes('fw-')||asset.includes('lm-')||asset.includes('ruin')||asset.includes('well')||asset.includes('wagon')||asset.includes('campfire'))return 14;
 if(asset.includes('rock')||asset.includes('crystal')||asset.includes('spire')||asset.includes('monolith')||asset.includes('boulder'))return 11;
 return 0;
}

export function placeCluster(propsOut,clusterId,cx,cy,canPlace){
 const cl=SCENE_CLUSTERS[clusterId];
 if(!cl)return false;
 if(canPlace&&!canPlace(cx,cy))return false;
 for(const item of cl.items){
  const x=Math.round(cx+item.dx),y=Math.round(cy+item.dy);
  if(!canPlace||canPlace(x,y)){
   propsOut.push({id:'cl-'+propsOut.length,asset:item.asset,x,y,scale:item.sc||1,radius:propBlockingRadius(item.asset)});
  }
 }
 return true;
}
