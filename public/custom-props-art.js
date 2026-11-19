// 30 distinct 2D top-down pixel-art prop textures + 100 extra + 13 landmarks + 100 fortress/siege props
import {FORTRESS_PROP_META,FORTRESS_PROP_IDS,drawFortressProp} from './fortress-props-art.js';
export {FORTRESS_PROP_IDS};

export const CUSTOM_PROP_META={
 'prop-oak-lush':{group:'trees',width:96,height:112,targetH:132},
 'prop-pine-tall':{group:'trees',width:84,height:120,targetH:136},
 'prop-willow-weeping':{group:'trees',width:104,height:112,targetH:132},
 'prop-birch-silver':{group:'trees',width:88,height:112,targetH:128},
 'prop-autumn-maple':{group:'trees',width:96,height:112,targetH:132},
 'prop-dead-twisted':{group:'trees',width:88,height:108,targetH:122},
 'prop-snow-spruce':{group:'trees',width:88,height:120,targetH:134},
 'prop-palm-oasis':{group:'trees',width:100,height:116,targetH:130},
 'prop-charred-ash':{group:'trees',width:88,height:112,targetH:124},
 'prop-sakura-wind':{group:'trees',width:96,height:112,targetH:132},
 'prop-berry-bush':{group:'bushes',width:52,height:48,targetH:46},
 'prop-bloom-shrub':{group:'bushes',width:54,height:48,targetH:46},
 'prop-fern-giant':{group:'bushes',width:56,height:44,targetH:40},
 'prop-cactus-saguaro':{group:'bushes',width:50,height:64,targetH:58},
 'prop-frost-shrub':{group:'bushes',width:52,height:48,targetH:46},
 'prop-glow-shroom':{group:'bushes',width:48,height:44,targetH:40},
 'prop-reed-cluster':{group:'bushes',width:48,height:54,targetH:48},
 'prop-thorn-briar':{group:'bushes',width:54,height:48,targetH:46},
 'prop-moss-boulder':{group:'rocks',width:64,height:52,targetH:50},
 'prop-obsidian-spire':{group:'rocks',width:56,height:68,targetH:62},
 'prop-sandstone-arch':{group:'rocks',width:72,height:58,targetH:56},
 'prop-ice-monolith':{group:'rocks',width:56,height:72,targetH:66},
 'prop-ruin-pillar':{group:'ruins',width:52,height:76,targetH:86},
 'prop-ruin-statue':{group:'ruins',width:60,height:80,targetH:92},
 'prop-ancient-well':{group:'ruins',width:64,height:60,targetH:68},
 'prop-wooden-signpost':{group:'ruins',width:44,height:56,targetH:52},
 'prop-campfire-pot':{group:'ruins',width:54,height:48,targetH:48},
 'prop-wagon-broken':{group:'ruins',width:76,height:54,targetH:58},
 'prop-mana-crystal':{group:'crystals',width:52,height:68,targetH:66},
 'prop-ember-crystal':{group:'crystals',width:52,height:68,targetH:66}
};

function makeCanvas(w,h){
 const canvas=document.createElement('canvas');
 canvas.width=w;canvas.height=h;
 const c=canvas.getContext('2d');
 c.imageSmoothingEnabled=false;
 return {canvas,c};
}

function pxRect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,Math.round(w/2)*2,Math.round(h/2)*2);}

function trunk(c,x,y,w,h,dark,mid,light){
 pxRect(c,x-w/2-2,y-h,w+4,h+2,'#141812');
 pxRect(c,x-w/2,y-h,w,h,dark);
 pxRect(c,x-w/2+2,y-h,Math.max(2,w-4),h-2,mid);
 pxRect(c,x-w/2+4,y-h+2,2,h-4,light);
 // Spreading pixel roots matching CraftPix style
 pxRect(c,x-w/2-6,y-4,8,4,dark);pxRect(c,x+w/2-2,y-4,8,4,dark);
 pxRect(c,x-w/2-4,y-4,6,2,mid);pxRect(c,x+w/2-2,y-4,6,2,mid);
 pxRect(c,x-w/2-8,y-2,4,2,'#141812');pxRect(c,x+w/2+4,y-2,4,2,'#141812');
}

function puff(c,cx,cy,r,outline,dark,mid,light){
 // Organic CraftPix-style overlapping leaf clusters (no checkerboard!)
 const seed=((cx*73+cy*139)|0)&1023;
 for(let i=0;i<18;i++){
  const a=(i/18)*Math.PI*2+(seed%7)*.2,d=((i*37+seed)%100)/100*r*.72;
  const lx=Math.round((cx+Math.cos(a)*d)/2)*2,ly=Math.round((cy+Math.sin(a)*d)/2)*2;
  const lr=Math.max(4,Math.round((r*.34)/2)*2);
  pxRect(c,lx-lr-2,ly-lr,lr*2+4,lr*2,outline);
  pxRect(c,lx-lr,ly-lr-2,lr*2,lr*2+4,outline);
 }
 for(let i=0;i<18;i++){
  const a=(i/18)*Math.PI*2+(seed%7)*.2,d=((i*37+seed)%100)/100*r*.72;
  const lx=Math.round((cx+Math.cos(a)*d)/2)*2,ly=Math.round((cy+Math.sin(a)*d)/2)*2;
  const lr=Math.max(4,Math.round((r*.34)/2)*2);
  const col=ly>cy+r*.2?dark:(ly<cy-r*.2&&i%2===0?light:mid);
  pxRect(c,lx-lr,ly-lr,lr*2,lr*2,col);
  if(ly<cy)pxRect(c,lx-lr+2,ly-lr,Math.max(2,lr),2,light);
 }
}

function drawTreeBase(c,w,h,pal,variant){
 const cx=w/2,by=h-10;
 trunk(c,cx,by,14,34,pal.tDark,pal.tMid,pal.tLight);
 if(variant==='pine'||variant==='snow'){
  for(let layer=0;layer<3;layer++){
   const ly=by-26-layer*20,lw=34-layer*7,bh=26;
   for(let dy=0;dy<bh;dy+=2){
    const frac=dy/bh,hw=Math.max(2,Math.round((lw*frac)/2)*2),jag=((dy*3+layer*5)&2);
    pxRect(c,cx-hw-2-jag,ly-bh+dy,hw*2+4+jag*2,2,pal.out);
    pxRect(c,cx-hw-jag,ly-bh+dy,hw*2+jag*2,2,dy>bh*0.72?pal.dark:pal.mid);
    if(dy<bh*0.65)pxRect(c,cx-hw+2,ly-bh+dy,Math.max(2,hw),2,pal.light);
   }
  }
  return;
 }
 if(variant==='willow'){
  puff(c,cx,by-50,28,pal.out,pal.dark,pal.mid,pal.light);
  puff(c,cx-18,by-40,18,pal.out,pal.dark,pal.mid,pal.light);
  puff(c,cx+18,by-40,18,pal.out,pal.dark,pal.mid,pal.light);
  for(let i=-3;i<=3;i++){
   c.fillStyle=i%2?pal.dark:pal.mid;
   c.fillRect(cx+i*9-2,by-38,4,24+(Math.abs(i)%2)*6);
   c.fillStyle=pal.light;c.fillRect(cx+i*9-1,by-36,2,18);
  }
  return;
 }
 if(variant==='palm'){
  trunk(c,cx,by,10,48,pal.tDark,pal.tMid,pal.tLight);
  for(let a=0;a<6;a++){
   const ang=a/6*Math.PI*2+.2,fx=cx+Math.cos(ang)*32,fy=by-52+Math.sin(ang)*20;
   c.strokeStyle=pal.out;c.lineWidth=8;c.beginPath();c.moveTo(cx,by-52);c.quadraticCurveTo(cx+Math.cos(ang)*16,by-66,fx,fy);c.stroke();
   c.strokeStyle=a%2?pal.mid:pal.light;c.lineWidth=4;c.beginPath();c.moveTo(cx,by-52);c.quadraticCurveTo(cx+Math.cos(ang)*16,by-66,fx,fy);c.stroke();
  }
  return;
 }
 if(variant==='dead'||variant==='charred'){
  c.strokeStyle=pal.out;c.lineWidth=8;c.lineCap='round';
  for(const [dx,dy] of [[-24,-24],[24,-26],[-16,-44],[18,-42],[0,-50]]){
   c.beginPath();c.moveTo(cx,by-26);c.lineTo(cx+dx,by-26+dy);c.stroke();
  }
  c.strokeStyle=pal.tMid;c.lineWidth=4;
  for(const [dx,dy] of [[-24,-24],[24,-26],[-16,-44],[18,-42],[0,-50]]){
   c.beginPath();c.moveTo(cx,by-26);c.lineTo(cx+dx,by-26+dy);c.stroke();
  }
  if(variant==='charred'){
   c.fillStyle='#ff6b2b';c.fillRect(cx-2,by-18,4,6);c.fillStyle='#ffd166';c.fillRect(cx-1,by-17,2,3);
  }
  return;
 }
 // Lush multi-dome crown (oak, birch, maple, sakura)
 puff(c,cx-16,by-38,20,pal.out,pal.dark,pal.mid,pal.light);
 puff(c,cx+16,by-38,20,pal.out,pal.dark,pal.mid,pal.light);
 puff(c,cx,by-54,24,pal.out,pal.dark,pal.mid,pal.light);
 if(pal.flecks){
  for(const [fx,fy] of [[-12,-48],[10,-52],[-4,-36],[14,-34],[0,-62]]){
   c.fillStyle=pal.flecks;c.fillRect(cx+fx,by+fy,4,4);
  }
 }
}

export const EXTRA_PROP_IDS=[];
export const EXTRA_BY_BIOME={forest:[],autumn:[],ice:[],dead:[],lava:[]};
const EXTRA_SPECS={};
const BIOME_SETS=[
 {tag:'forest',out:'#142613',dark:'#244d21',mid:'#3e7d34',light:'#72ba50',tDark:'#3d281a',tMid:'#63422c',tLight:'#8a6042',accent:'#ffe478',stoneD:'#4a5248',stoneM:'#737a6f',stoneL:'#a4ab9e',crysD:'#184261',crysM:'#38bdf8',crysL:'#e0f7ff'},
 {tag:'autumn',out:'#2e140c',dark:'#852e17',mid:'#cc5923',light:'#f59e3b',tDark:'#382317',tMid:'#593825',tLight:'#7d5036',accent:'#ffd166',stoneD:'#54473d',stoneM:'#7d6b5c',stoneL:'#ab9582',crysD:'#5e3214',crysM:'#f59e0b',crysL:'#fef3c7'},
 {tag:'ice',out:'#172c38',dark:'#2d576e',mid:'#7ec2de',light:'#ebfbff',tDark:'#332924',tMid:'#52433b',tLight:'#735e53',accent:'#bae6fd',stoneD:'#3a5163',stoneM:'#62829c',stoneL:'#a8c8e0',crysD:'#1d4e6e',crysM:'#67e8f9',crysL:'#ffffff'},
 {tag:'dead',out:'#19121c',dark:'#392942',mid:'#5b4369',light:'#866796',tDark:'#261d26',tMid:'#453645',tLight:'#665066',accent:'#c084fc',stoneD:'#332c38',stoneM:'#524759',stoneL:'#7a6b82',crysD:'#3b1659',crysM:'#a855f7',crysL:'#f3e8ff'},
 {tag:'lava',out:'#1f0d0b',dark:'#4d1a14',mid:'#8a2e1e',light:'#d9572b',tDark:'#1c1212',tMid:'#362220',tLight:'#593834',accent:'#fde047',stoneD:'#2b1e1d',stoneM:'#4a3431',stoneL:'#73524d',crysD:'#5c1410',crysM:'#f97316',crysL:'#fef08a'}
];
const TREE_SHAPES=['broad-oak','layered-pine','weeping-willow','twisted-dead','oasis-palm','twin-canopy','giant-baobab'];
const FLORA_SHAPES=['flowering-hedge','berry-thicket','giant-fern','mushroom-ring','cactus-cluster'];
const ROCK_SHAPES=['craggy-boulder','twin-spire','rune-stone','crystal-cluster'];
const RUIN_SHAPES=['stone-shrine','war-banner','supply-crates','ruin-arch'];
{
 let idx=1;
 for(let s=0;s<TREE_SHAPES.length;s++)for(let b=0;b<BIOME_SETS.length;b++){const id=`prop-extra-${idx++}`;EXTRA_PROP_IDS.push(id);EXTRA_BY_BIOME[BIOME_SETS[b].tag].push(id);CUSTOM_PROP_META[id]={group:'trees',width:96,height:116,targetH:128+(s%3)*6};EXTRA_SPECS[id]={cat:'tree',shape:TREE_SHAPES[s],pal:BIOME_SETS[b],seed:idx*37};}
 for(let s=0;s<FLORA_SHAPES.length;s++)for(let b=0;b<BIOME_SETS.length;b++){const id=`prop-extra-${idx++}`;EXTRA_PROP_IDS.push(id);EXTRA_BY_BIOME[BIOME_SETS[b].tag].push(id);CUSTOM_PROP_META[id]={group:'bushes',width:54,height:50,targetH:44+(s%2)*6};EXTRA_SPECS[id]={cat:'flora',shape:FLORA_SHAPES[s],pal:BIOME_SETS[b],seed:idx*41};}
 for(let s=0;s<ROCK_SHAPES.length;s++)for(let b=0;b<BIOME_SETS.length;b++){const id=`prop-extra-${idx++}`;EXTRA_PROP_IDS.push(id);EXTRA_BY_BIOME[BIOME_SETS[b].tag].push(id);CUSTOM_PROP_META[id]={group:s===3?'crystals':'rocks',width:60,height:64,targetH:54+(s%2)*8};EXTRA_SPECS[id]={cat:'rock',shape:ROCK_SHAPES[s],pal:BIOME_SETS[b],seed:idx*43};}
 for(let s=0;s<RUIN_SHAPES.length;s++)for(let b=0;b<BIOME_SETS.length;b++){const id=`prop-extra-${idx++}`;EXTRA_PROP_IDS.push(id);EXTRA_BY_BIOME[BIOME_SETS[b].tag].push(id);CUSTOM_PROP_META[id]={group:'ruins',width:64,height:72,targetH:64+(s%2)*10};EXTRA_SPECS[id]={cat:'ruin',shape:RUIN_SHAPES[s],pal:BIOME_SETS[b],seed:idx*47};}
}

function drawExtraProp(c,meta,spec){
 const cx=meta.width/2,by=meta.height-6,p=spec.pal;
 if(spec.cat==='tree'){
  if(spec.shape==='broad-oak')drawTreeBase(c,meta.width,meta.height,p,'oak');
  else if(spec.shape==='layered-pine')drawTreeBase(c,meta.width,meta.height,p,'pine');
  else if(spec.shape==='weeping-willow')drawTreeBase(c,meta.width,meta.height,p,'willow');
  else if(spec.shape==='twisted-dead')drawTreeBase(c,meta.width,meta.height,p,'dead');
  else if(spec.shape==='oasis-palm')drawTreeBase(c,meta.width,meta.height,p,'palm');
  else if(spec.shape==='twin-canopy'){
   trunk(c,cx-6,by,8,38,p.tDark,p.tMid,p.tLight);trunk(c,cx+7,by,7,32,p.tDark,p.tMid,p.tLight);
   puff(c,cx-14,by-44,18,p.out,p.dark,p.mid,p.light);puff(c,cx+14,by-38,16,p.out,p.dark,p.mid,p.light);
   c.fillStyle=p.accent;c.fillRect(cx-16,by-48,4,4);c.fillRect(cx+12,by-40,4,4);
  }else{
   trunk(c,cx,by,20,42,p.tDark,p.tMid,p.tLight);
   puff(c,cx-18,by-48,18,p.out,p.dark,p.mid,p.light);puff(c,cx+18,by-48,18,p.out,p.dark,p.mid,p.light);puff(c,cx,by-58,22,p.out,p.dark,p.mid,p.light);
  }
 }else if(spec.cat==='flora'){
  if(spec.shape==='flowering-hedge'){
   puff(c,cx-9,by-12,11,p.out,p.dark,p.mid,p.light);puff(c,cx+9,by-12,11,p.out,p.dark,p.mid,p.light);puff(c,cx,by-18,12,p.out,p.dark,p.mid,p.light);
   for(const [ox,oy] of [[-8,-16],[6,-18],[0,-11]]){c.fillStyle=p.accent;c.fillRect(cx+ox,by+oy,4,4);}
  }else if(spec.shape==='berry-thicket'){
   puff(c,cx-7,by-10,10,p.out,p.dark,p.mid,p.light);puff(c,cx+7,by-10,10,p.out,p.dark,p.mid,p.light);puff(c,cx,by-16,12,p.out,p.dark,p.mid,p.light);
   for(const [ox,oy] of [[-5,-14],[4,-17],[0,-9]]){c.fillStyle='#ef4444';c.fillRect(cx+ox,by+oy,3,3);}
  }else if(spec.shape==='giant-fern'){
   for(let i=0;i<8;i++){const a=i/8*Math.PI*2;c.strokeStyle=p.out;c.lineWidth=6;c.beginPath();c.moveTo(cx,by-12);c.lineTo(cx+Math.cos(a)*20,by-12+Math.sin(a)*12);c.stroke();c.strokeStyle=i%2?p.mid:p.light;c.lineWidth=3;c.beginPath();c.moveTo(cx,by-12);c.lineTo(cx+Math.cos(a)*19,by-12+Math.sin(a)*11);c.stroke();}
  }else if(spec.shape==='mushroom-ring'){
   for(const [ox,oy,w] of [[-11,-8,10],[10,-7,9],[0,-15,12]]){c.fillStyle='#1b2421';c.fillRect(cx+ox-2,by+oy,4,9);c.fillStyle='#e2e8f0';c.fillRect(cx+ox-1,by+oy,2,8);c.fillStyle=p.out;c.beginPath();c.ellipse(cx+ox,by+oy,w/2+1.5,4.5,0,0,Math.PI*2);c.fill();c.fillStyle=p.accent;c.beginPath();c.ellipse(cx+ox,by+oy,w/2,3.5,0,0,Math.PI*2);c.fill();}
  }else{
   trunk(c,cx,by,10,34,p.dark,p.mid,p.light);c.fillStyle=p.dark;c.fillRect(cx-13,by-24,9,6);c.fillRect(cx-13,by-32,6,10);c.fillRect(cx+5,by-20,9,6);c.fillRect(cx+8,by-30,6,12);c.fillStyle=p.accent;c.fillRect(cx-2,by-38,4,4);
  }
 }else if(spec.cat==='rock'){
  if(spec.shape==='craggy-boulder'){
   c.fillStyle=p.out;c.beginPath();c.ellipse(cx,by-14,22,15,0,0,Math.PI*2);c.fill();
   c.fillStyle=p.stoneD;c.beginPath();c.ellipse(cx,by-15,20,13,0,0,Math.PI*2);c.fill();
   c.fillStyle=p.stoneM;c.beginPath();c.ellipse(cx-2,by-17,15,9,0,0,Math.PI*2);c.fill();
   c.fillStyle=p.stoneL;c.beginPath();c.ellipse(cx-5,by-20,7,4,0,0,Math.PI*2);c.fill();
  }else if(spec.shape==='twin-spire'){
   for(const [ox,h2] of [[-7,42],[7,32]]){c.fillStyle=p.out;c.beginPath();c.moveTo(cx+ox-11,by);c.lineTo(cx+ox,by-h2);c.lineTo(cx+ox+11,by);c.closePath();c.fill();c.fillStyle=p.stoneM;c.beginPath();c.moveTo(cx+ox-8,by-2);c.lineTo(cx+ox,by-h2+4);c.lineTo(cx+ox+6,by-2);c.closePath();c.fill();}
  }else if(spec.shape==='rune-stone'){
   c.fillStyle=p.out;c.fillRect(cx-11,by-44,22,44);c.fillStyle=p.stoneD;c.fillRect(cx-9,by-42,18,40);c.fillStyle=p.stoneM;c.fillRect(cx-7,by-40,12,36);c.fillStyle=p.accent;c.fillRect(cx-2,by-32,4,14);c.fillRect(cx-5,by-27,10,3);
  }else{
   for(const [ox,h2] of [[-7,38],[6,48],[0,30]]){c.fillStyle=p.crysD;c.beginPath();c.moveTo(cx+ox-8,by-2);c.lineTo(cx+ox,by-h2);c.lineTo(cx+ox+8,by-2);c.closePath();c.fill();c.fillStyle=p.crysM;c.beginPath();c.moveTo(cx+ox-5,by-4);c.lineTo(cx+ox,by-h2+5);c.lineTo(cx+ox+4,by-4);c.closePath();c.fill();c.fillStyle=p.crysL;c.fillRect(cx+ox-2,by-h2+10,2,14);}
  }
 }else{
  if(spec.shape==='stone-shrine'){
   c.fillStyle=p.out;c.fillRect(cx-16,by-10,32,10);c.fillRect(cx-10,by-46,20,36);c.fillStyle=p.stoneM;c.fillRect(cx-14,by-8,28,6);c.fillRect(cx-8,by-42,16,32);c.fillStyle=p.stoneL;c.fillRect(cx-14,by-48,28,6);c.fillStyle=p.accent;c.fillRect(cx-3,by-30,6,8);
  }else if(spec.shape==='war-banner'){
   c.fillStyle=p.tDark;c.fillRect(cx-2,by-52,4,52);c.fillStyle=p.tLight;c.fillRect(cx-12,by-48,24,4);c.fillStyle=p.dark;c.fillRect(cx-9,by-44,18,24);c.fillStyle=p.accent;c.fillRect(cx-3,by-38,6,10);
  }else if(spec.shape==='supply-crates'){
   c.fillStyle=p.tDark;c.fillRect(cx-18,by-20,20,20);c.fillRect(cx,by-16,18,16);c.fillStyle=p.tMid;c.fillRect(cx-16,by-18,16,16);c.fillRect(cx+2,by-14,14,12);c.fillStyle=p.tLight;c.fillRect(cx-16,by-18,16,3);c.fillRect(cx+2,by-14,14,3);
  }else{
   c.fillStyle=p.out;c.fillRect(cx-22,by-42,44,42);c.fillStyle=p.stoneM;c.fillRect(cx-20,by-40,40,38);c.fillStyle=p.stoneL;c.fillRect(cx-18,by-40,36,8);c.fillStyle='#121614';c.fillRect(cx-9,by-24,18,24);
  }
 }
}

export const LANDMARK_PROP_IDS=[
 'prop-lm-rock-peak','prop-lm-stone-gate','prop-lm-lava-geyser','prop-lm-ice-statue',
 'prop-lm-old-well','prop-lm-campfire-group','prop-lm-giant-tree','prop-lm-big-cave',
 'prop-lm-volcano','prop-lm-ice-mountain','prop-lm-ruined-house','prop-lm-torch','prop-lm-square-cage'
];
const LANDMARK_META={
 'prop-lm-rock-peak':{group:'ruins',width:112,height:96,targetH:155},
 'prop-lm-stone-gate':{group:'ruins',width:104,height:92,targetH:108},
 'prop-lm-lava-geyser':{group:'crystals',width:76,height:84,targetH:88},
 'prop-lm-ice-statue':{group:'ruins',width:72,height:96,targetH:102},
 'prop-lm-old-well':{group:'ruins',width:72,height:68,targetH:76},
 'prop-lm-campfire-group':{group:'ruins',width:84,height:68,targetH:72},
 'prop-lm-giant-tree':{group:'trees',width:140,height:152,targetH:190},
 'prop-lm-big-cave':{group:'ruins',width:128,height:96,targetH:145},
 'prop-lm-volcano':{group:'ruins',width:128,height:104,targetH:225},
 'prop-lm-ice-mountain':{group:'ruins',width:124,height:104,targetH:225},
 'prop-lm-ruined-house':{group:'ruins',width:112,height:92,targetH:102},
 'prop-lm-torch':{group:'ruins',width:36,height:64,targetH:58},
 'prop-lm-square-cage':{group:'ruins',width:68,height:68,targetH:68}
};
Object.assign(CUSTOM_PROP_META,LANDMARK_META,FORTRESS_PROP_META);

function drawPixelMound(c,cx,by,hw,h,out,dark,mid,light,capCol){
 for(let dy=0;dy<h;dy+=2){
  const t=dy/h,w=Math.max(4,Math.round((hw*(0.22+t*0.78))/2)*2),jag=((dy*5)&2);
  pxRect(c,cx-w-2-jag,by-h+dy,w*2+4+jag*2,2,out);
  pxRect(c,cx-w-jag,by-h+dy,w*2+jag*2,2,dy>h*0.75?dark:mid);
  if(dy<h*0.7)pxRect(c,cx-w+2,by-h+dy,Math.max(2,w),2,light);
  if(capCol&&dy<h*0.36)pxRect(c,cx-w*0.65,by-h+dy,Math.max(2,w*1.3),2,capCol);
 }
}

function drawLandmarkProp(c,id,meta){
 const cx=meta.width/2,by=meta.height-6;
 if(id==='prop-lm-rock-peak'){
  drawPixelMound(c,cx,by,46,78,'#1b211c','#464d45','#6f786d','#9ca698','#c2ccc0');
 }else if(id==='prop-lm-stone-gate'){
  pxRect(c,cx-42,by-72,22,72,'#1b201c');pxRect(c,cx+20,by-72,22,72,'#1b201c');pxRect(c,cx-46,by-82,92,20,'#1b201c');
  pxRect(c,cx-40,by-70,18,68,'#5b6359');pxRect(c,cx+22,by-70,18,68,'#5b6359');pxRect(c,cx-44,by-80,88,16,'#6f786d');
  pxRect(c,cx-38,by-68,6,64,'#91998e');pxRect(c,cx+24,by-68,6,64,'#91998e');pxRect(c,cx-42,by-78,84,4,'#a8b0a4');
  pxRect(c,cx-36,by-32,12,6,'#3d6b34');pxRect(c,cx+24,by-48,12,6,'#3d6b34');
 }else if(id==='prop-lm-lava-geyser'){
  drawPixelMound(c,cx,by,28,22,'#261310','#4d2017','#7a3122','#a8442c');
  pxRect(c,cx-12,by-14,24,6,'#ea580c');pxRect(c,cx-8,by-68,16,56,'#f97316');pxRect(c,cx-4,by-72,8,58,'#fde047');
  for(const [ox,oy] of [[-14,-54],[14,-48],[-18,-36],[18,-32]])pxRect(c,cx+ox,by+oy,4,4,'#fb923c');
 }else if(id==='prop-lm-ice-statue'){
  pxRect(c,cx-22,by-16,44,16,'#18384d');pxRect(c,cx-12,by-58,24,42,'#18384d');
  pxRect(c,cx-20,by-14,40,12,'#5ca8cc');pxRect(c,cx-10,by-56,20,40,'#7cc8e6');
  puff(c,cx,by-64,10,'#18384d','#5ca8cc','#bae6fd','#f0fcff');
  pxRect(c,cx-8,by-52,6,34,'#f0fcff');pxRect(c,cx+12,by-72,4,56,'#e0f7ff');
 }else if(id==='prop-lm-old-well'){
  pxRect(c,cx-22,by-24,44,24,'#1e241f');pxRect(c,cx-20,by-22,40,20,'#697066');pxRect(c,cx-14,by-20,28,10,'#193847');
  pxRect(c,cx-18,by-48,4,28,'#4a3221');pxRect(c,cx+14,by-48,4,28,'#4a3221');
  drawPixelMound(c,cx,by-42,24,18,'#291a10','#593822','#784e30','#9c6842');
 }else if(id==='prop-lm-campfire-group'){
  for(const [lx,ly] of [[-26,-8],[24,-10],[-18,-26],[20,-24]]){pxRect(c,cx+lx-6,by+ly,12,6,'#3b2718');pxRect(c,cx+lx-5,by+ly,10,2,'#785236');}
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;pxRect(c,cx+Math.cos(a)*14-3,by-16+Math.sin(a)*8-2,6,6,'#525951');}
  pxRect(c,cx-8,by-24,16,14,'#ea580c');pxRect(c,cx-4,by-28,8,14,'#fb923c');pxRect(c,cx-2,by-24,4,8,'#fde047');
 }else if(id==='prop-lm-giant-tree'){
  trunk(c,cx,by,28,62,'#382315','#5c3b24','#805536');
  puff(c,cx-30,by-68,28,'#132412','#214a1e','#377830','#64ad49');
  puff(c,cx+30,by-68,28,'#132412','#214a1e','#377830','#64ad49');
  puff(c,cx,by-92,34,'#132412','#214a1e','#377830','#64ad49');
  puff(c,cx-16,by-80,24,'#132412','#2d6328','#48913d','#82cc5e');
  puff(c,cx+16,by-80,24,'#132412','#2d6328','#48913d','#82cc5e');
 }else if(id==='prop-lm-big-cave'){
  drawPixelMound(c,cx,by,52,76,'#1b211c','#454c45','#697067','#8e968b');
  pxRect(c,cx-24,by-34,48,34,'#0b0d0c');pxRect(c,cx-18,by-42,36,10,'#0b0d0c');pxRect(c,cx-12,by-46,24,6,'#1a1f1c');
 }else if(id==='prop-lm-volcano'){
  drawPixelMound(c,cx,by,56,82,'#1c1212','#3d201c','#633128','#854434');
  pxRect(c,cx-18,by-82,36,8,'#ea580c');pxRect(c,cx-12,by-84,24,4,'#fde047');
  pxRect(c,cx-4,by-76,6,36,'#f97316');pxRect(c,cx+2,by-50,4,28,'#ea580c');
 }else if(id==='prop-lm-ice-mountain'){
  drawPixelMound(c,cx,by,54,84,'#183447','#3e7d9e','#68b2d4','#a8e0f5','#eefaff');
 }else if(id==='prop-lm-ruined-house'){
  pxRect(c,cx-44,by-46,88,46,'#212420');pxRect(c,cx-40,by-42,80,40,'#696e64');pxRect(c,cx-10,by-26,20,24,'#171310');
  drawPixelMound(c,cx-8,by-40,42,30,'#291a10','#593822','#784e30','#9c6842');
 }else if(id==='prop-lm-torch'){
  pxRect(c,cx-3,by-42,6,42,'#242624');pxRect(c,cx-2,by-40,4,38,'#6e4b2e');pxRect(c,cx-5,by-44,10,6,'#474d4b');
  pxRect(c,cx-5,by-56,10,12,'#ea580c');pxRect(c,cx-2,by-54,4,8,'#fde047');
 }else if(id==='prop-lm-square-cage'){
  pxRect(c,cx-24,by-48,48,48,'#1e2124');pxRect(c,cx-20,by-44,40,40,'#0e1012');
  for(let i=-18;i<=18;i+=8)pxRect(c,cx+i-1,by-44,2,40,'#7c8591');
  pxRect(c,cx-22,by-46,44,4,'#7c8591');pxRect(c,cx-22,by-8,44,4,'#7c8591');pxRect(c,cx-22,by-26,44,4,'#7c8591');
  pxRect(c,cx-8,by-14,8,6,'#d6c7a9');
 }
}

export function ensureCustomPropTexture(scene,id){
 const meta=CUSTOM_PROP_META[id];
 if(!meta)return null;
 if(typeof document==='undefined'||!scene?.textures?.addCanvas)return meta;
 if(scene.textures.exists(id))return meta;
 const {canvas,c}=makeCanvas(meta.width,meta.height);
 if(FORTRESS_PROP_META[id]){drawFortressProp(c,id,meta);scene.textures.addCanvas(id,canvas);return meta;}
 if(LANDMARK_META[id]){drawLandmarkProp(c,id,meta);scene.textures.addCanvas(id,canvas);return meta;}
 if(EXTRA_SPECS[id]){drawExtraProp(c,meta,EXTRA_SPECS[id]);scene.textures.addCanvas(id,canvas);return meta;}
 const cx=meta.width/2,by=meta.height-6;

 if(id==='prop-oak-lush')drawTreeBase(c,meta.width,meta.height,{out:'#162915',dark:'#265223',mid:'#3d8033',light:'#72ba50',tDark:'#3d281a',tMid:'#63422c',tLight:'#8a6042'},'oak');
 else if(id==='prop-pine-tall')drawTreeBase(c,meta.width,meta.height,{out:'#11241a',dark:'#1b4733',mid:'#2c6e4e',light:'#4e9c72',tDark:'#362419',tMid:'#593b28',tLight:'#7a533a'},'pine');
 else if(id==='prop-willow-weeping')drawTreeBase(c,meta.width,meta.height,{out:'#172b1b',dark:'#2c5c34',mid:'#4a8f4d',light:'#83c472',tDark:'#3d2f22',tMid:'#634c38',tLight:'#87694f'},'willow');
 else if(id==='prop-birch-silver')drawTreeBase(c,meta.width,meta.height,{out:'#1d2b16',dark:'#4b6e28',mid:'#7aa63c',light:'#b4d962',tDark:'#9ca3a6',tMid:'#d8dee0',tLight:'#ffffff'},'oak');
 else if(id==='prop-autumn-maple')drawTreeBase(c,meta.width,meta.height,{out:'#30140d',dark:'#8c2d19',mid:'#d15824',light:'#f59b38',tDark:'#3d261a',tMid:'#5e3a28',tLight:'#80523a',flecks:'#ffd166'},'oak');
 else if(id==='prop-dead-twisted')drawTreeBase(c,meta.width,meta.height,{out:'#1c161d',dark:'#3d3240',mid:'#5e4f61',light:'#857387',tDark:'#2b2229',tMid:'#4f404a',tLight:'#705c69'},'dead');
 else if(id==='prop-snow-spruce')drawTreeBase(c,meta.width,meta.height,{out:'#1b303d',dark:'#2f5b73',mid:'#8bc4de',light:'#eefaff',tDark:'#382a24',tMid:'#59433a',tLight:'#785c50'},'snow');
 else if(id==='prop-palm-oasis')drawTreeBase(c,meta.width,meta.height,{out:'#1b2e13',dark:'#3b6921',mid:'#639c35',light:'#99cf5b',tDark:'#4f3722',tMid:'#785332',tLight:'#9e7147'},'palm');
 else if(id==='prop-charred-ash')drawTreeBase(c,meta.width,meta.height,{out:'#171010',dark:'#2e1e1e',mid:'#4a3131',light:'#6e4b45',tDark:'#1c1414',tMid:'#362523',tLight:'#593b36'},'charred');
 else if(id==='prop-sakura-wind')drawTreeBase(c,meta.width,meta.height,{out:'#361826',dark:'#9c4166',mid:'#de739d',light:'#ffc2da',tDark:'#3d2729',tMid:'#5e3d3f',tLight:'#825759',flecks:'#fff0f7'},'oak');
 else if(id==='prop-berry-bush'){puff(c,cx-8,by-12,11,'#142915','#234d22','#387834','#5ba84b');puff(c,cx+8,by-12,11,'#142915','#234d22','#387834','#5ba84b');puff(c,cx,by-18,13,'#142915','#234d22','#387834','#5ba84b');for(const [x,y] of [[-7,-16],[5,-20],[0,-11],[9,-10]]){c.fillStyle='#e11d48';c.fillRect(cx+x,by+y,4,4);}}
 else if(id==='prop-bloom-shrub'){puff(c,cx-8,by-12,11,'#142915','#265224','#3f8038','#65b352');puff(c,cx+8,by-12,11,'#142915','#265224','#3f8038','#65b352');puff(c,cx,by-18,13,'#142915','#265224','#3f8038','#65b352');for(const [x,y] of [[-8,-17],[6,-19],[0,-12],[-2,-23]]){c.fillStyle='#ffe478';c.fillRect(cx+x-1,by+y,5,3);c.fillRect(cx+x,by+y-1,3,5);c.fillStyle='#fff';c.fillRect(cx+x,by+y,2,2);}}
 else if(id==='prop-fern-giant'){for(let i=0;i<7;i++){const a=i/7*Math.PI*2;c.strokeStyle='#173317';c.lineWidth=7;c.beginPath();c.moveTo(cx,by-12);c.lineTo(cx+Math.cos(a)*20,by-12+Math.sin(a)*12);c.stroke();c.strokeStyle=i%2?'#4f943c':'#74bd55';c.lineWidth=3.5;c.beginPath();c.moveTo(cx,by-12);c.lineTo(cx+Math.cos(a)*19,by-12+Math.sin(a)*11);c.stroke();}}
 else if(id==='prop-cactus-saguaro'){trunk(c,cx,by,12,42,'#214a22','#3b7d39','#66b058');c.fillStyle='#214a22';c.fillRect(cx-16,by-30,12,8);c.fillRect(cx-16,by-40,8,14);c.fillRect(cx+6,by-24,12,8);c.fillRect(cx+10,by-36,8,16);c.fillStyle='#ff708d';c.fillRect(cx-3,by-46,6,5);}
 else if(id==='prop-frost-shrub'){puff(c,cx-8,by-12,11,'#1f3e4d','#396e85','#79bcd6','#dcf7ff');puff(c,cx+8,by-12,11,'#1f3e4d','#396e85','#79bcd6','#dcf7ff');puff(c,cx,by-18,13,'#1f3e4d','#396e85','#79bcd6','#dcf7ff');}
 else if(id==='prop-glow-shroom'){for(const [ox,oy,w,col] of [[-10,-12,12,'#5eead4'],[8,-10,10,'#a78bfa'],[0,-18,14,'#38bdf8']]){c.fillStyle='#1b2421';c.fillRect(cx+ox-2,by+oy,4,10);c.fillStyle='#e2e8f0';c.fillRect(cx+ox-1,by+oy,2,9);c.fillStyle='#162226';c.beginPath();c.ellipse(cx+ox,by+oy,w/2+2,5,0,0,Math.PI*2);c.fill();c.fillStyle=col;c.beginPath();c.ellipse(cx+ox,by+oy,w/2,4,0,0,Math.PI*2);c.fill();}}
 else if(id==='prop-reed-cluster'){for(let i=-3;i<=3;i++){c.fillStyle='#2d5428';c.fillRect(cx+i*5,by-32-(i%2)*6,2,32+(i%2)*6);if(i%2===0){c.fillStyle='#6b4423';c.fillRect(cx+i*5-1,by-38,4,8);}}}
 else if(id==='prop-thorn-briar'){puff(c,cx-7,by-12,11,'#1a101c','#36213b','#593861','#7d5285');puff(c,cx+7,by-12,11,'#1a101c','#36213b','#593861','#7d5285');c.fillStyle='#d946ef';c.fillRect(cx-4,by-18,3,3);c.fillRect(cx+4,by-14,3,3);}
 else if(id==='prop-moss-boulder'){c.fillStyle='#202620';c.beginPath();c.ellipse(cx,by-14,26,18,0,0,Math.PI*2);c.fill();c.fillStyle='#5c6358';c.beginPath();c.ellipse(cx,by-15,23,15,0,0,Math.PI*2);c.fill();c.fillStyle='#8c9486';c.beginPath();c.ellipse(cx-4,by-19,14,8,0,0,Math.PI*2);c.fill();c.fillStyle='#4e853c';c.fillRect(cx-12,by-24,14,5);c.fillRect(cx+2,by-20,10,4);}
 else if(id==='prop-obsidian-spire'){c.fillStyle='#140d1a';c.beginPath();c.moveTo(cx-18,by);c.lineTo(cx-6,by-52);c.lineTo(cx+8,by-44);c.lineTo(cx+18,by);c.closePath();c.fill();c.fillStyle='#3b234d';c.beginPath();c.moveTo(cx-13,by-2);c.lineTo(cx-5,by-46);c.lineTo(cx+4,by-2);c.closePath();c.fill();c.fillStyle='#a855f7';c.fillRect(cx-5,by-38,3,18);}
 else if(id==='prop-sandstone-arch'){c.fillStyle='#3d2616';c.fillRect(cx-26,by-36,52,34);c.fillStyle='#a66d3f';c.fillRect(cx-24,by-34,48,30);c.fillStyle='#d99f62';c.fillRect(cx-22,by-34,44,10);c.fillStyle='#261910';c.fillRect(cx-10,by-20,20,20);}
 else if(id==='prop-ice-monolith'){c.fillStyle='#255775';c.beginPath();c.moveTo(cx-18,by);c.lineTo(cx-8,by-56);c.lineTo(cx+10,by-48);c.lineTo(cx+18,by);c.closePath();c.fill();c.fillStyle='#7ecae8';c.beginPath();c.moveTo(cx-14,by-2);c.lineTo(cx-7,by-50);c.lineTo(cx+6,by-2);c.closePath();c.fill();c.fillStyle='#f0fcff';c.fillRect(cx-7,by-44,4,24);}
 else if(id==='prop-ruin-pillar'){c.fillStyle='#242924';c.fillRect(cx-14,by-10,28,10);c.fillRect(cx-10,by-58,20,50);c.fillStyle='#6d756b';c.fillRect(cx-12,by-8,24,6);c.fillRect(cx-8,by-54,16,44);c.fillStyle='#9ea69b';c.fillRect(cx-6,by-52,5,40);c.fillStyle='#4f8242';c.fillRect(cx-8,by-24,10,5);}
 else if(id==='prop-ruin-statue'){c.fillStyle='#242924';c.fillRect(cx-16,by-14,32,14);c.fillRect(cx-10,by-52,20,38);c.fillStyle='#737a70';c.fillRect(cx-14,by-12,28,10);c.fillRect(cx-8,by-48,16,34);c.beginPath();c.arc(cx,by-54,9,0,Math.PI*2);c.fill();c.fillStyle='#548c46';c.fillRect(cx-8,by-32,12,6);}
 else if(id==='prop-ancient-well'){c.fillStyle='#242924';c.beginPath();c.ellipse(cx,by-14,22,13,0,0,Math.PI*2);c.fill();c.fillStyle='#757d72';c.beginPath();c.ellipse(cx,by-16,19,11,0,0,Math.PI*2);c.fill();c.fillStyle='#193542';c.beginPath();c.ellipse(cx,by-17,12,6,0,0,Math.PI*2);c.fill();c.fillStyle='#4a3221';c.fillRect(cx-16,by-42,4,26);c.fillRect(cx+12,by-42,4,26);c.fillStyle='#6e4930';c.fillRect(cx-20,by-48,40,8);}
 else if(id==='prop-wooden-signpost'){c.fillStyle='#2b1d12';c.fillRect(cx-3,by-36,6,36);c.fillStyle='#6e4b2e';c.fillRect(cx-2,by-34,4,32);c.fillStyle='#3b2718';c.fillRect(cx-16,by-34,32,14);c.fillStyle='#9c6f44';c.fillRect(cx-14,by-32,28,10);c.fillStyle='#5c3d22';c.fillRect(cx-10,by-29,18,2);c.fillRect(cx-10,by-25,14,2);}
 else if(id==='prop-campfire-pot'){c.fillStyle='#424740';for(let i=0;i<8;i++){const a=i/8*Math.PI*2;c.fillRect(cx+Math.cos(a)*14-3,by-12+Math.sin(a)*8-2,6,5);}c.fillStyle='#ff6b2b';c.beginPath();c.arc(cx,by-12,7,0,Math.PI*2);c.fill();c.fillStyle='#ffe07d';c.beginPath();c.arc(cx,by-13,3.5,0,Math.PI*2);c.fill();c.fillStyle='#24292e';c.fillRect(cx-6,by-24,12,8);c.fillStyle='#474f57';c.fillRect(cx-5,by-23,10,3);}
 else if(id==='prop-wagon-broken'){c.fillStyle='#2b1c12';c.fillRect(cx-24,by-24,48,18);c.fillStyle='#784e2e';c.fillRect(cx-22,by-22,44,14);c.fillStyle='#52341d';c.fillRect(cx-18,by-20,36,2);c.fillRect(cx-18,by-14,36,2);for(const wx of [-16,14]){c.strokeStyle='#2b1c12';c.lineWidth=4;c.beginPath();c.arc(cx+wx,by-8,8,0,Math.PI*2);c.stroke();c.strokeStyle='#8c623d';c.lineWidth=2;c.stroke();}}
 else if(id==='prop-mana-crystal'){c.fillStyle='#183f5e';c.beginPath();c.moveTo(cx-14,by-4);c.lineTo(cx-4,by-54);c.lineTo(cx+10,by-42);c.lineTo(cx+14,by-4);c.closePath();c.fill();c.fillStyle='#38bdf8';c.beginPath();c.moveTo(cx-10,by-6);c.lineTo(cx-3,by-48);c.lineTo(cx+6,by-6);c.closePath();c.fill();c.fillStyle='#e0f7ff';c.fillRect(cx-4,by-42,3,22);}
 else if(id==='prop-ember-crystal'){c.fillStyle='#4a1410';c.beginPath();c.moveTo(cx-14,by-4);c.lineTo(cx-4,by-54);c.lineTo(cx+10,by-42);c.lineTo(cx+14,by-4);c.closePath();c.fill();c.fillStyle='#f97316';c.beginPath();c.moveTo(cx-10,by-6);c.lineTo(cx-3,by-48);c.lineTo(cx+6,by-6);c.closePath();c.fill();c.fillStyle='#fef08a';c.fillRect(cx-4,by-42,3,22);}

 scene.textures.addCanvas(id,canvas);
 return meta;
}
