// 100 non-blocking medieval pixel-art decorations (drawn on ground/courtyard canvas, zero collision)

export const COURTYARD_DECOR_IDS=[
 'wall-torch','wrought-torch-bracket','hanging-oil-lamp','beeswax-candle','candelabra','single-candlestick',
 'hearth-fire','hearth-ash','glowing-embers','kitchen-smoke','flanders-rug','hall-runner',
 'linen-curtain','red-velvet-drape','gonfalon-banner','clan-banner','crusader-banner','tattered-siege-banner',
 'arch-pennant','carved-wood-crest','ceremonial-shield','ceremonial-sword','ornate-spear','wall-crossbow',
 'display-helm','hanging-hauberk','knight-cloak','iron-gauntlet','horse-spur','hanging-saddle',
 'leather-bridle','fallen-horseshoe','stable-straw','loose-hay','small-ale-keg','drinking-horn',
 'oak-mug','wineskin','rye-loaf','cheese-wheel','smoked-sausage','cured-ham',
 'salt-pouch','small-flour-sack','apple-basket','turnip-basket','hanging-onions','hanging-herbs',
 'apothecary-vial','stone-mortar','medical-bandage','writing-quill','inkwell','parchment-scroll',
 'red-wax-seal','wall-siege-map','commander-orders','sign-armoury','sign-stables','sign-great-hall',
 'sign-chapel','wooden-cross','virgin-statuette','patron-statue','chapel-candle','prayer-book',
 'rosary-beads','chapel-bell','funeral-flowers','laurel-wreath','arch-cobweb','wall-moss',
 'climbing-ivy','courtyard-cobbles','wagon-wheel-ruts','soldier-mud-prints','sabaton-prints','dried-blood-stain',
 'broken-longbow-arrow','shattered-kite-shield','plate-armor-shard','broken-spearhead','hanging-chains','iron-shackles',
 'wall-birdcage','crow-nest','crow-feather','horse-dung','wooden-bucket','water-dipper',
 'straw-broom','wooden-stool','small-wood-table','barrel-seat','dry-oak-leaves','rain-puddle',
 'torch-wall-glow','stained-glass-shards','knight-ribbon','courtyard-rose-lily'
];

function px(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,Math.max(2,Math.round(w/2)*2),Math.max(2,Math.round(h/2)*2));}

export function drawDecorItem(c,id,x,y,rand){
 c.save();
 c.translate(Math.round(x/2)*2,Math.round(y/2)*2);
 // Soft CraftPix-style ground shadow
 c.fillStyle='rgba(20,30,18,0.22)';c.beginPath();c.ellipse(0,2,7,3.5,0,0,Math.PI*2);c.fill();

 if(id.includes('torch')||id.includes('lamp')||id.includes('candle')||id.includes('candelabra')){
  px(c,-2,-8,4,10,'#3b2a1e');px(c,-2,-10,4,2,'#5e635b');
  px(c,-2,-14,4,4,'#d97736');px(c,-1,-13,2,2,'#f5d076');
  c.fillStyle='rgba(245,208,118,0.16)';c.beginPath();c.arc(0,-11,10,0,Math.PI*2);c.fill();
 }else if(id.includes('hearth')||id.includes('embers')||id.includes('smoke')){
  px(c,-6,-4,12,6,'#464d46');px(c,-4,-2,8,4,'#2b2825');
  if(id==='hearth-ash'){px(c,-4,-2,8,2,'#7c827b');}
  else if(id==='kitchen-smoke'){c.fillStyle='rgba(195,205,200,0.3)';c.beginPath();c.arc(-2,-8,4,0,Math.PI*2);c.arc(2,-12,3,0,Math.PI*2);c.fill();}
  else{px(c,-4,-2,8,2,'#c95c2b');px(c,-2,-2,4,2,'#e8b358');}
 }else if(id.includes('rug')||id.includes('runner')||id.includes('curtain')||id.includes('drape')||id.includes('banner')||id.includes('pennant')||id.includes('cloak')||id.includes('ribbon')){
  const col=id.includes('crusader')?'#d9d2be':id.includes('flanders')||id.includes('banner')||id.includes('drape')?'#8c372b':'#754829';
  const trim=id.includes('crusader')?'#9e3a2b':'#c49a52';
  px(c,-6,-6,12,8,'#261c17');px(c,-6,-4,12,6,col);px(c,-6,-4,12,2,trim);px(c,-6,0,12,2,trim);
  if(id==='tattered-siege-banner'){px(c,-2,0,4,2,'#3a3530');}
 }else if(id.includes('shield')||id.includes('sword')||id.includes('spear')||id.includes('crossbow')||id.includes('helm')||id.includes('hauberk')||id.includes('gauntlet')||id.includes('plate')||id.includes('arrow')){
  if(id.includes('arrow')||id.includes('spear')){
   px(c,-8,-2,14,2,'#6b4c30');px(c,4,-2,4,2,'#88918b');px(c,-8,-2,2,2,'#cfc8b4');
  }else if(id.includes('shield')){
   px(c,-6,-6,12,10,'#2b332e');px(c,-4,-4,8,6,'#8d968e');px(c,-2,-4,4,4,'#9e3a2b');
  }else{
   px(c,-4,-6,8,8,'#353d38');px(c,-4,-4,8,6,'#7d857e');px(c,-2,-4,4,2,'#b5bdb4');
  }
 }else if(id.includes('straw')||id.includes('hay')||id.includes('leaves')||id.includes('broom')){
  const col=id.includes('leaves')?'#965224':'#b58d47',hi=id.includes('leaves')?'#bd7235':'#cfa95f';
  for(let i=-3;i<=3;i++){px(c,i*2,-2+(i%2)*2,4,2,col);px(c,i*2,-4+(i%2)*2,2,2,hi);}
 }else if(id.includes('keg')||id.includes('horn')||id.includes('mug')||id.includes('wineskin')||id.includes('loaf')||id.includes('cheese')||id.includes('sausage')||id.includes('ham')||id.includes('pouch')||id.includes('sack')||id.includes('basket')||id.includes('onions')||id.includes('herbs')){
  px(c,-4,-6,8,8,'#2e2117');px(c,-4,-4,8,6,id.includes('cheese')?'#cfa446':id.includes('apple')?'#a83b2e':id.includes('herbs')?'#4f8037':'#855734');
  px(c,-2,-6,4,2,'#ab7b4f');
 }else if(id.includes('vial')||id.includes('mortar')||id.includes('bandage')||id.includes('quill')||id.includes('inkwell')||id.includes('parchment')||id.includes('seal')||id.includes('map')||id.includes('orders')||id.includes('book')||id.includes('sign-')){
  if(id.startsWith('sign-')){
   px(c,-2,-10,4,10,'#4a321e');px(c,-8,-12,16,6,'#7d5836');px(c,-6,-10,12,2,'#d4c49c');
  }else{
   px(c,-6,-4,12,6,'#cfc2a3');px(c,-4,-2,8,2,'#7a705c');
   if(id.includes('seal')||id.includes('vial')){px(c,2,-2,4,2,'#9e3a2b');}
  }
 }else if(id.includes('cross')||id.includes('statue')||id.includes('bell')||id.includes('rosary')||id.includes('wreath')||id.includes('flowers')||id.includes('rose-lily')){
  if(id.includes('rose')||id.includes('flowers')||id.includes('wreath')){
   px(c,-4,-2,8,4,'#386628');px(c,-4,-4,4,4,'#c9596b');px(c,2,-2,4,4,'#e3dac3');px(c,0,-4,2,2,'#e6c365');
  }else{
   px(c,-4,-8,8,10,'#4a524a');px(c,-2,-10,4,8,'#8c9489');px(c,-4,-8,8,2,'#8c9489');
  }
 }else if(id.includes('puddle')){
  c.fillStyle='rgba(72,128,148,0.34)';c.beginPath();c.ellipse(0,0,10,5,0,0,Math.PI*2);c.fill();
  c.strokeStyle='rgba(176,216,224,0.35)';c.lineWidth=1;c.stroke();
 }else if(id.includes('prints')||id.includes('ruts')||id.includes('stain')||id.includes('dung')||id.includes('feather')){
  const col=id.includes('stain')?'rgba(105,32,28,0.45)':id.includes('dung')?'#4d3620':'rgba(54,46,34,0.35)';
  px(c,-4,-2,4,2,col);px(c,2,0,4,2,col);
 }else if(id.includes('cobweb')||id.includes('moss')||id.includes('ivy')||id.includes('cobbles')){
  const col=id.includes('cobweb')?'rgba(210,218,215,0.35)':id.includes('cobbles')?'#6e7368':'#457830';
  px(c,-6,-4,10,4,col);px(c,-2,-6,6,6,col);
 }else{
  px(c,-6,-6,12,8,'#2e2117');px(c,-4,-4,8,6,'#734f30');px(c,-4,-4,8,2,'#9c7149');
  if(id.includes('chains')||id.includes('shackles')||id.includes('horseshoe')){px(c,-4,-4,8,4,'#6d7570');}
 }
 c.restore();
}

export function drawNonBlockingDecor(c,m,inCastleCourt,rand){
 // 1. Scatter courtyard & fortress-perimeter decorations inside/around castle court (zero collision)
 const courtCount=42;
 for(let i=0;i<courtCount;i++){
  const dx=m.base.x+(rand()-.5)*420,dy=m.base.y-40+rand()*260;
  if(Math.hypot(dx-m.base.x,dy-m.base.y)<75)continue;
  const id=COURTYARD_DECOR_IDS[Math.floor(rand()*COURTYARD_DECOR_IDS.length)];
  drawDecorItem(c,id,dx,dy,rand);
 }
 // 2. Scatter battlefield & roadside non-blocking relics/decorations across the map
 const fieldIds=[
  'broken-longbow-arrow','shattered-kite-shield','plate-armor-shard','broken-spearhead',
  'wagon-wheel-ruts','soldier-mud-prints','sabaton-prints','dry-oak-leaves',
  'rain-puddle','wooden-bucket','straw-broom','small-ale-keg','barrel-seat',
  'crow-nest','crow-feather','fallen-horseshoe','wall-moss','courtyard-rose-lily',
  'sign-armoury','sign-stables','wall-torch','wrought-torch-bracket'
 ];
 const fieldCount=Math.floor((m.width*m.height)/24000);
 for(let i=0;i<fieldCount;i++){
  const dx=60+rand()*(m.width-120),dy=60+rand()*(m.height-120);
  if(inCastleCourt(m,{x:dx,y:dy}))continue;
  const id=fieldIds[i%fieldIds.length];
  drawDecorItem(c,id,dx,dy,rand);
 }
}
