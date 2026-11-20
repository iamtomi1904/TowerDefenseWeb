import {installCatalogProp} from './catalog-prop-art.js';
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
 'prop-ember-crystal':{group:'crystals',width:52,height:68,targetH:66},
 'prop-mtn-main':{group:'mountains',width:168,height:124,targetH:138},
 'prop-mtn-wide':{group:'mountains',width:192,height:112,targetH:124},
 'prop-mtn-spur':{group:'mountains',width:136,height:96,targetH:108}
};

function makeCanvas(w,h){
 const canvas=document.createElement('canvas');
 canvas.width=w;canvas.height=h;
 const c=canvas.getContext('2d');
 c.imageSmoothingEnabled=false;
 return {canvas,c};
}

function pxRect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,Math.round(w/2)*2,Math.round(h/2)*2);}

function px1(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}

function trunk(c,x,y,w,h,dark,mid,light,out='#24140b'){
 const cx=Math.round(x),by=Math.round(y);
 // 5 splayed 3D perspective roots matching CraftPix tree1.png
 const roots=[[-w*.85,2,w*.48],[-w*.45,4,w*.44],[0,5,w*.42],[w*.45,4,w*.44],[w*.85,2,w*.48]];
 for(const [rx,ry,rw] of roots){
  const x0=cx,y0=by-4,x1=cx+rx,y1=by+ry;
  const steps=Math.max(4,Math.ceil(Math.hypot(x1-x0,y1-y0)));
  for(let i=0;i<=steps;i++){
   const u=i/steps,px=Math.round(x0+(x1-x0)*u),py=Math.round(y0+(y1-y0)*u),r=Math.max(2,Math.round(rw*(1-u*.45)));
   px1(c,px-r/2-1,py-r/2-1,r+2,r+2,out);
  }
  for(let i=0;i<=steps;i++){
   const u=i/steps,px=Math.round(x0+(x1-x0)*u),py=Math.round(y0+(y1-y0)*u),r=Math.max(2,Math.round(rw*(1-u*.45)));
   px1(c,px-r/2,py-r/2,r,r,dark);
   px1(c,px-r/2,py-r/2,Math.max(1,r-1),Math.max(1,r-1),mid);
   px1(c,px-r/2+1,py-r/2,Math.max(1,Math.floor(r*.55)),Math.max(1,Math.floor(r*.5)),light);
  }
 }
 // Tapered curved bark trunk with vertical grain
 for(let dy=0;dy<h;dy++){
  const t=dy/h,sway=Math.round(Math.sin(t*2.8)*1.5),hw=Math.max(3,Math.round(w*.52*(1-t*.32)+(t<.18?(1-t/.18)*3:0)));
  px1(c,cx-hw-1+sway,by-dy-1,hw*2+2,1,out);
  px1(c,cx-hw+sway,by-dy-1,hw*2,1,dark);
  px1(c,cx-hw+1+sway,by-dy-1,Math.max(2,Math.round(hw*1.25)),1,mid);
  if(dy%3!==0)px1(c,cx-hw+2+sway,by-dy-1,Math.max(1,Math.round(hw*.55)),1,light);
 }
}

function pxLimb(c,x0,y0,x1,y1,w0,w1,out,dark,mid,light){
 const steps=Math.max(6,Math.ceil(Math.hypot(x1-x0,y1-y0)));
 for(let i=0;i<=steps;i++){
  const u=i/steps,x=x0+(x1-x0)*u,y=y0+(y1-y0)*u,r=Math.max(1,Math.round(w0+(w1-w0)*u));
  px1(c,x-r/2-1,y-r/2-1,r+2,r+2,out);
 }
 for(let i=0;i<=steps;i++){
  const u=i/steps,x=x0+(x1-x0)*u,y=y0+(y1-y0)*u,r=Math.max(1,Math.round(w0+(w1-w0)*u));
  px1(c,x-r/2,y-r/2,r,r,i%3===0?dark:mid);
  if(r>=3)px1(c,x-r/2,y-r/2,Math.max(1,r/2),Math.max(1,r/2),light);
 }
}

function leafTuft(c,x,y,r,col,hi,out){
 const cx=Math.round(x),cy=Math.round(y),rad=Math.max(2,Math.round(r));
 if(out){
  for(let dy=-rad;dy<=rad;dy++){
   const hw=Math.max(0,rad-Math.abs(dy)+1);
   px1(c,cx-hw,cy+dy,hw*2+1,1,out);
  }
 }
 for(let dy=-rad+1;dy<=rad-1;dy++){
  const hw=Math.max(0,rad-Math.abs(dy));
  px1(c,cx-hw,cy+dy,hw*2+1,1,col);
 }
 if(hi&&rad>=3){
  px1(c,cx-1,cy-rad+2,3,Math.max(1,rad-1),hi);
  px1(c,cx,cy-rad+1,1,Math.max(1,rad),hi);
 }
}

function puff(c,cx,cy,r,outline,dark,mid,light,accent){
 // Lush multi-layered CraftPix canopy: clean outer silhouette + painterly inner leaf sprays
 const seed=((cx*73+cy*139)|0)&1023;
 const tufts=[];
 const count=Math.max(34,Math.round(r*2.4));
 for(let i=0;i<count;i++){
  const a=(i/count)*Math.PI*2+((seed+i*17)%13)*.12;
  const d=Math.pow(((i*37+seed)%100)/100,.58)*r*.90;
  const lx=cx+Math.cos(a)*d,ly=cy+Math.sin(a)*d*.90;
  const lr=Math.max(3,Math.round(r*.20+((i*7)%3)));
  tufts.push([lx,ly,lr,ly-cy,d/Math.max(1,r)]);
 }
 // Pass 1: Outer silhouette outline only
 for(const [lx,ly,lr] of tufts)leafTuft(c,lx,ly,lr,outline,null,null);
 // Pass 2: Deep shaded base foliage
 tufts.sort((a,b)=>a[3]-b[3]);
 for(const [lx,ly,lr] of tufts)leafTuft(c,lx,ly,Math.max(2,lr-1),dark,null,null);
 // Pass 3: Mid-tone foliage sprays
 for(const [lx,ly,lr,dy] of tufts){
  if(dy<r*.38)leafTuft(c,lx,ly,Math.max(2,lr-1),mid,null,null);
 }
 // Pass 4: Sunlit upper-left leaf sprays & bright leaf-center highlights
 for(const [lx,ly,lr,dy,nd] of tufts){
  if(dy<r*.08&&lx<cx+r*.42){
   leafTuft(c,lx,ly,Math.max(2,lr-1),light,nd<.55?(accent||light):null,null);
  }
 }
}

function pxBoulder(c,cx,by,rx,ry,out,dark,mid,light,moss){
 // 1px 2.5D fluted rock plates matching CraftPix rock1_1.png
 const x=Math.round(cx),y=Math.round(by),w=Math.round(rx),h=Math.round(ry);
 c.fillStyle='rgba(12,18,12,0.28)';c.beginPath();c.ellipse(x+2,y+1,w+2,Math.max(3,h*.36),0,0,Math.PI*2);c.fill();
 const fluteAt=u=>Math.abs(Math.sin(u*Math.PI*3))*3;
 for(let col=-w;col<=w;col++){
  const u=col/w,arch=Math.sqrt(Math.max(0,1-u*u));
  const top=Math.max(4,Math.round(h*(.48+arch*.52)-fluteAt(u)));
  px1(c,x+col,y-top-1,1,top+2,out);
 }
 for(let col=-w+1;col<=w-1;col++){
  const u=col/w,arch=Math.sqrt(Math.max(0,1-u*u));
  const top=Math.max(4,Math.round(h*(.48+arch*.52)-fluteAt(u)));
  const plateBot=Math.round(top*.42);
  for(let row=0;row<top;row++){
   const isVertCleft=(Math.abs(col)===Math.round(w*.45)||col===0)&&row<top-2;
   const isTopLip=row===plateBot||row===plateBot+1;
   const isTopPlate=row>plateBot+1;
   let colHex;
   if(isVertCleft&&row>plateBot-4)colHex=out;
   else if(isTopLip)colHex=light;
   else if(isTopPlate)colHex=(u>.30&&row<top-3)?mid:light;
   else colHex=(u>.10||isVertCleft)?dark:mid;
   px1(c,x+col,y-row-1,1,1,colHex);
  }
  if(moss&&u>-.55&&u<.35&&((Math.abs(col)%5)<3))px1(c,x+col,y-top+1,1,3,moss);
 }
}

function pxSpire(c,cx,by,w,h,out,dark,mid,light){
 const shards=[[cx-w*.34,h*.66,w*.42],[cx+w*.30,h*.56,w*.38],[cx,h,w*.52]];
 for(const [sx,sh,sw] of shards){
  for(let dy=0;dy<sh;dy++){
   const hw=Math.max(1,Math.round(sw*(dy/sh)));
   px1(c,sx-hw-1,by-sh+dy,hw*2+2,1,out);
   px1(c,sx-hw,by-sh+dy,hw*2,1,dark);
   px1(c,sx-hw+1,by-sh+dy,Math.max(1,hw),1,mid);
   if(dy<sh*.72)px1(c,sx-hw+1,by-sh+dy,Math.max(1,Math.round(hw*.45)),1,light);
  }
 }
}

function drawTreeBase(c,w,h,pal,variant){
 const cx=w/2,by=h-8;
 if(variant==='pine'||variant==='snow'){
  trunk(c,cx,by,11,26,pal.tDark,pal.tMid,pal.tLight,pal.out);
  for(let tier=0;tier<4;tier++){
   const ty=by-22-tier*16,rad=22-tier*3.5;
   puff(c,cx,ty,rad,pal.out,pal.dark,pal.mid,pal.light,pal.flecks);
   if(tier<3){
    puff(c,cx-rad*.55,ty+6,rad*.6,pal.out,pal.dark,pal.mid,pal.light);
    puff(c,cx+rad*.55,ty+6,rad*.6,pal.out,pal.dark,pal.mid,pal.light);
   }
  }
  return;
 }
 if(variant==='willow'){
  trunk(c,cx,by,15,36,pal.tDark,pal.tMid,pal.tLight,pal.out);
  puff(c,cx-18,by-44,18,pal.out,pal.dark,pal.mid,pal.light);
  puff(c,cx+18,by-44,18,pal.out,pal.dark,pal.mid,pal.light);
  puff(c,cx,by-56,24,pal.out,pal.dark,pal.mid,pal.light);
  for(let i=-5;i<=5;i++){
   const vx=cx+i*5,len=20+(Math.abs(i*3)%4)*4;
   for(let dy=0;dy<len;dy++){
    px1(c,vx-1,by-40+dy,3,1,dy>len-5?pal.dark:(i%2?pal.mid:pal.dark));
    if(dy<len-7&&i<2)px1(c,vx-1,by-40+dy,1,1,pal.light);
   }
  }
  return;
 }
 if(variant==='palm'){
  for(let dy=0;dy<52;dy++){
   const t=dy/52,sx=cx+Math.round(Math.sin(t*2.4)*6),hw=Math.max(3,Math.round(5.5-t*2));
   px1(c,sx-hw-1,by-dy-1,hw*2+2,1,pal.out);
   px1(c,sx-hw,by-dy-1,hw*2,1,dy%4===0?pal.tDark:pal.tMid);
   px1(c,sx-hw+1,by-dy-1,2,1,pal.tLight);
  }
  const topX=cx+4,topY=by-54;
  for(let a=0;a<6;a++){
   const ang=a/6*Math.PI*2+.15,dx=Math.cos(ang),dy=Math.sin(ang)*.65;
   for(let s=0;s<16;s++){
    const u=s/15,fx=topX+dx*u*30,fy=topY+dy*u*24-Math.sin(u*Math.PI)*10+u*u*8;
    leafTuft(c,fx,fy,3,u<.5?pal.light:pal.mid,pal.light,pal.out);
   }
  }
  return;
 }
 if(variant==='dead'||variant==='charred'){
  trunk(c,cx,by,13,32,pal.tDark,pal.tMid,pal.tLight,pal.out);
  pxLimb(c,cx-2,by-28,cx-18,by-50,7,3,pal.out,pal.tDark,pal.tMid,pal.tLight);
  pxLimb(c,cx-18,by-50,cx-28,by-64,3,1,pal.out,pal.tDark,pal.tMid,pal.tLight);
  pxLimb(c,cx-14,by-44,cx-6,by-66,3,1,pal.out,pal.tDark,pal.tMid,pal.tLight);
  pxLimb(c,cx+2,by-30,cx+18,by-48,7,3,pal.out,pal.tDark,pal.tMid,pal.tLight);
  pxLimb(c,cx+18,by-48,cx+26,by-62,3,1,pal.out,pal.tDark,pal.tMid,pal.tLight);
  pxLimb(c,cx+10,by-40,cx+4,by-68,3,1,pal.out,pal.tDark,pal.tMid,pal.tLight);
  if(variant==='charred'){px1(c,cx-2,by-18,3,7,'#ea580c');px1(c,cx-1,by-16,2,4,'#fde047');}
  return;
 }
 trunk(c,cx,by,14,34,pal.tDark,pal.tMid,pal.tLight,pal.out);
 puff(c,cx-16,by-40,19,pal.out,pal.dark,pal.mid,pal.light,pal.flecks);
 puff(c,cx+16,by-40,19,pal.out,pal.dark,pal.mid,pal.light,pal.flecks);
 puff(c,cx,by-56,23,pal.out,pal.dark,pal.mid,pal.light,pal.flecks);
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
   trunk(c,cx-8,by,8,38,p.tDark,p.tMid,p.tLight,p.out);trunk(c,cx+8,by,8,32,p.tDark,p.tMid,p.tLight,p.out);
   puff(c,cx-14,by-44,18,p.out,p.dark,p.mid,p.light,p.accent);puff(c,cx+14,by-38,16,p.out,p.dark,p.mid,p.light,p.accent);
  }else{
   trunk(c,cx,by,20,42,p.tDark,p.tMid,p.tLight,p.out);
   puff(c,cx-18,by-48,18,p.out,p.dark,p.mid,p.light);puff(c,cx+18,by-48,18,p.out,p.dark,p.mid,p.light);puff(c,cx,by-60,22,p.out,p.dark,p.mid,p.light,p.accent);
  }
 }else if(spec.cat==='flora'){
  if(spec.shape==='flowering-hedge'){
   puff(c,cx-9,by-12,11,p.out,p.dark,p.mid,p.light,p.accent);puff(c,cx+9,by-12,11,p.out,p.dark,p.mid,p.light,p.accent);puff(c,cx,by-18,12,p.out,p.dark,p.mid,p.light,p.accent);
   for(const [ox,oy] of [[-8,-16],[6,-18],[0,-11]])pxRect(c,cx+ox,by+oy,4,4,p.accent);
  }else if(spec.shape==='berry-thicket'){
   puff(c,cx-7,by-10,10,p.out,p.dark,p.mid,p.light);puff(c,cx+7,by-10,10,p.out,p.dark,p.mid,p.light);puff(c,cx,by-16,12,p.out,p.dark,p.mid,p.light);
   for(const [ox,oy] of [[-5,-14],[4,-17],[0,-9]])pxRect(c,cx+ox,by+oy,4,4,'#ef4444');
  }else if(spec.shape==='giant-fern'){
   for(let i=0;i<7;i++){
    const a=i/7*Math.PI*2+.2;
    for(let s=1;s<8;s++){
     const u=s/7,fx=cx+Math.cos(a)*u*20,fy=by-12+Math.sin(a)*u*12;
     pxRect(c,fx-2,fy-2,6,6,p.out);pxRect(c,fx,fy,4,4,s>4?p.light:p.mid);
    }
   }
  }else if(spec.shape==='mushroom-ring'){
   for(const [ox,oy,w] of [[-11,-8,10],[10,-7,9],[0,-15,12]]){
    pxRect(c,cx+ox-2,by+oy,4,10,p.out);pxRect(c,cx+ox-2,by+oy,2,8,'#e2e8f0');
    pxBoulder(c,cx+ox,by+oy+2,w/2,5,p.out,p.dark,p.accent,'#fff7d6');
   }
  }else{
   trunk(c,cx,by,10,34,p.dark,p.mid,p.light,p.out);
   pxLimb(c,cx-4,by-18,cx-12,by-28,6,4,p.out,p.dark,p.mid,p.light);
   pxLimb(c,cx+4,by-14,cx+12,by-24,6,4,p.out,p.dark,p.mid,p.light);
   pxRect(c,cx-2,by-38,4,4,p.accent);
  }
 }else if(spec.cat==='rock'){
  if(spec.shape==='craggy-boulder'){
   pxBoulder(c,cx,by-2,22,18,p.out,p.stoneD,p.stoneM,p.stoneL,p.mid);
  }else if(spec.shape==='twin-spire'){
   pxSpire(c,cx,by-2,36,42,p.out,p.stoneD,p.stoneM,p.stoneL);
  }else if(spec.shape==='rune-stone'){
   pxBoulder(c,cx,by-2,14,38,p.out,p.stoneD,p.stoneM,p.stoneL,p.mid);
   pxRect(c,cx-2,by-30,4,14,p.accent);pxRect(c,cx-6,by-24,12,2,p.accent);
  }else{
   pxSpire(c,cx,by-2,34,46,p.out,p.crysD,p.crysM,p.crysL);
  }
 }else{
  if(spec.shape==='stone-shrine'){
   pxBoulder(c,cx,by-2,18,12,p.out,p.stoneD,p.stoneM,p.stoneL);
   pxRect(c,cx-10,by-44,20,34,p.out);pxRect(c,cx-8,by-42,16,30,p.stoneM);pxRect(c,cx-8,by-42,6,28,p.stoneL);
   pxBoulder(c,cx,by-40,16,10,p.out,p.stoneD,p.stoneM,p.stoneL,p.mid);
   pxRect(c,cx-2,by-30,4,8,p.accent);
  }else if(spec.shape==='war-banner'){
   pxRect(c,cx-2,by-52,4,52,p.tDark);pxRect(c,cx-12,by-48,24,4,p.tLight);
   pxRect(c,cx-10,by-44,20,24,p.out);pxRect(c,cx-8,by-42,16,20,p.dark);pxRect(c,cx-4,by-38,8,10,p.accent);
  }else if(spec.shape==='supply-crates'){
   pxRect(c,cx-18,by-20,20,20,p.out);pxRect(c,cx-16,by-18,16,16,p.tMid);pxRect(c,cx-16,by-18,16,4,p.tLight);
   pxRect(c,cx,by-16,18,16,p.out);pxRect(c,cx+2,by-14,14,12,p.tMid);pxRect(c,cx+2,by-14,14,4,p.tLight);
  }else{
   pxRect(c,cx-22,by-42,44,42,p.out);pxRect(c,cx-20,by-40,40,38,p.stoneM);
   pxRect(c,cx-18,by-40,14,38,p.stoneL);pxRect(c,cx-10,by-24,20,24,'#121614');
   pxRect(c,cx-16,by-36,8,6,p.mid);pxRect(c,cx+10,by-30,8,6,p.mid);
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
 const cols=Math.max(6,Math.round(hw/2)*2);
 for(let col=-cols;col<=cols;col+=2){
  const u=col/cols,slope=1-Math.abs(u),jag=Math.sin(col*.55)*3;
  const top=Math.max(4,Math.round((h*(slope*.88+.12)+jag)/2)*2);
  pxRect(c,cx+col-2,by-top-2,4,top+4,out);
 }
 for(let col=-cols+2;col<=cols-2;col+=2){
  const u=col/cols,slope=1-Math.abs(u),jag=Math.sin(col*.55)*3;
  const top=Math.max(4,Math.round((h*(slope*.88+.12)+jag)/2)*2);
  for(let row=0;row<top;row+=2){
   const frac=row/Math.max(2,top),strata=(row+Math.abs(col))%10===0;
   let colHex;
   if(capCol&&frac>.66)colHex=u>0.15?mid:capCol;
   else if(u>0.08)colHex=strata?out:dark;
   else colHex=strata?dark:(frac>.55?light:mid);
   pxRect(c,cx+col,by-row-2,2,2,colHex);
  }
 }
}

function drawLandmarkProp(c,id,meta){
 const cx=meta.width/2,by=meta.height-6;
 if(id==='prop-lm-rock-peak'){
  drawPixelMound(c,cx,by,46,78,'#1b211c','#3d453d','#636d61','#919c8d','#3e7335');
 }else if(id==='prop-lm-stone-gate'){
  pxBoulder(c,cx-30,by,14,68,'#1b201c','#3e453e','#616a5f','#8c9688','#3d6b34');
  pxBoulder(c,cx+30,by,14,68,'#1b201c','#3e453e','#616a5f','#8c9688','#3d6b34');
  pxRect(c,cx-46,by-82,92,20,'#1b201c');pxRect(c,cx-44,by-80,88,16,'#6f786d');pxRect(c,cx-42,by-78,84,4,'#a8b0a4');
  for(let x=-36;x<=36;x+=12)pxRect(c,cx+x,by-80,2,16,'#3d453e');
  pxRect(c,cx-34,by-68,12,6,'#4b7d3b');pxRect(c,cx+22,by-74,10,6,'#4b7d3b');
 }else if(id==='prop-lm-lava-geyser'){
  drawPixelMound(c,cx,by,28,24,'#261310','#4d2017','#7a3122','#a8442c');
  pxRect(c,cx-12,by-14,24,6,'#ea580c');pxRect(c,cx-8,by-68,16,56,'#f97316');pxRect(c,cx-4,by-72,8,58,'#fde047');
  for(const [ox,oy] of [[-14,-54],[14,-48],[-18,-36],[18,-32]])pxRect(c,cx+ox,by+oy,4,4,'#fb923c');
 }else if(id==='prop-lm-ice-statue'){
  pxBoulder(c,cx,by,22,16,'#18384d','#396e8a','#5ca8cc','#bae6fd');
  pxSpire(c,cx,by-12,26,52,'#18384d','#396e8a','#7cc8e6','#f0fcff');
  puff(c,cx,by-58,10,'#18384d','#5ca8cc','#bae6fd','#f0fcff');
 }else if(id==='prop-lm-old-well'){
  pxBoulder(c,cx,by,22,22,'#1e241f','#454d44','#697066','#949c90','#437538');
  pxRect(c,cx-14,by-20,28,10,'#142a36');pxRect(c,cx-10,by-18,20,6,'#285b73');
  pxRect(c,cx-18,by-48,4,28,'#4a3221');pxRect(c,cx+14,by-48,4,28,'#4a3221');
  drawPixelMound(c,cx,by-42,24,18,'#291a10','#593822','#784e30','#9c6842');
 }else if(id==='prop-lm-campfire-group'){
  for(const [lx,ly] of [[-26,-8],[24,-10],[-18,-26],[20,-24]]){pxRect(c,cx+lx-6,by+ly,12,6,'#3b2718');pxRect(c,cx+lx-5,by+ly,10,2,'#785236');}
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;pxRect(c,cx+Math.cos(a)*14-3,by-16+Math.sin(a)*8-2,6,6,'#525951');}
  pxRect(c,cx-8,by-24,16,14,'#ea580c');pxRect(c,cx-4,by-28,8,14,'#fb923c');pxRect(c,cx-2,by-24,4,8,'#fde047');
 }else if(id==='prop-lm-giant-tree'){
  trunk(c,cx,by,28,62,'#382315','#5c3b24','#805536','#162915');
  puff(c,cx-30,by-68,28,'#132412','#214a1e','#377830','#64ad49');
  puff(c,cx+30,by-68,28,'#132412','#214a1e','#377830','#64ad49');
  puff(c,cx,by-92,34,'#132412','#214a1e','#377830','#64ad49');
  puff(c,cx-16,by-80,24,'#132412','#2d6328','#48913d','#82cc5e');
  puff(c,cx+16,by-80,24,'#132412','#2d6328','#48913d','#82cc5e');
 }else if(id==='prop-lm-big-cave'){
  drawPixelMound(c,cx,by,52,76,'#1b211c','#454c45','#697067','#8e968b','#3e7335');
  pxBoulder(c,cx,by,26,42,'#0b0d0c','#0b0d0c','#141816','#1e2420');
 }else if(id==='prop-lm-volcano'){
  drawPixelMound(c,cx,by,56,82,'#1c1212','#3d201c','#633128','#854434');
  pxRect(c,cx-18,by-82,36,8,'#ea580c');pxRect(c,cx-12,by-84,24,4,'#fde047');
  pxRect(c,cx-4,by-76,6,36,'#f97316');pxRect(c,cx+2,by-50,4,28,'#ea580c');
 }else if(id==='prop-lm-ice-mountain'){
  drawPixelMound(c,cx,by,54,84,'#183447','#3e7d9e','#68b2d4','#a8e0f5','#eefaff');
 }else if(id==='prop-lm-ruined-house'){
  pxRect(c,cx-44,by-46,88,46,'#212420');pxRect(c,cx-40,by-42,80,40,'#696e64');
  for(let yy=by-34;yy<by-6;yy+=8)pxRect(c,cx-38,yy,76,2,'#464d45');
  pxRect(c,cx-10,by-26,20,24,'#171310');
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
 if(installCatalogProp(scene,id,meta))return meta;
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
 else if(id==='prop-berry-bush'){puff(c,cx-8,by-12,11,'#142915','#234d22','#387834','#5ba84b');puff(c,cx+8,by-12,11,'#142915','#234d22','#387834','#5ba84b');puff(c,cx,by-18,13,'#142915','#234d22','#387834','#5ba84b');for(const [x,y] of [[-7,-16],[5,-20],[0,-11],[9,-10]])pxRect(c,cx+x,by+y,4,4,'#e11d48');}
 else if(id==='prop-bloom-shrub'){puff(c,cx-8,by-12,11,'#142915','#265224','#3f8038','#65b352','#ffe478');puff(c,cx+8,by-12,11,'#142915','#265224','#3f8038','#65b352','#ffe478');puff(c,cx,by-18,13,'#142915','#265224','#3f8038','#65b352','#ffe478');for(const [x,y] of [[-8,-17],[6,-19],[0,-12],[-2,-23]])pxRect(c,cx+x,by+y,4,4,'#ffe478');}
 else if(id==='prop-fern-giant'){for(let i=0;i<7;i++){const a=i/7*Math.PI*2+.2;for(let s=1;s<8;s++){const u=s/7,fx=cx+Math.cos(a)*u*20,fy=by-12+Math.sin(a)*u*12;pxRect(c,fx-2,fy-2,6,6,'#173317');pxRect(c,fx,fy,4,4,s>4?'#74bd55':'#4f943c');}}}
 else if(id==='prop-cactus-saguaro'){trunk(c,cx,by,12,42,'#214a22','#3b7d39','#66b058','#142915');pxLimb(c,cx-4,by-22,cx-14,by-34,8,6,'#142915','#214a22','#3b7d39','#66b058');pxLimb(c,cx+4,by-18,cx+14,by-32,8,6,'#142915','#214a22','#3b7d39','#66b058');pxRect(c,cx-2,by-46,4,4,'#ff708d');}
 else if(id==='prop-frost-shrub'){puff(c,cx-8,by-12,11,'#1f3e4d','#396e85','#79bcd6','#dcf7ff');puff(c,cx+8,by-12,11,'#1f3e4d','#396e85','#79bcd6','#dcf7ff');puff(c,cx,by-18,13,'#1f3e4d','#396e85','#79bcd6','#dcf7ff');}
 else if(id==='prop-glow-shroom'){for(const [ox,oy,w,col] of [[-10,-12,12,'#5eead4'],[8,-10,10,'#a78bfa'],[0,-18,14,'#38bdf8']]){pxRect(c,cx+ox-2,by+oy,4,10,'#1b2421');pxRect(c,cx+ox-2,by+oy,2,8,'#e2e8f0');pxBoulder(c,cx+ox,by+oy+2,w/2,5,'#162226','#254552',col,'#e0f7ff');}}
 else if(id==='prop-reed-cluster'){for(let i=-3;i<=3;i++){const rx=cx+i*5,rh=28+(i%2)*8;pxRect(c,rx-2,by-rh,4,rh,'#172915');pxRect(c,rx,by-rh,2,rh,'#3f7337');if(i%2===0)pxRect(c,rx-2,by-rh-6,4,8,'#6b4423');}}
 else if(id==='prop-thorn-briar'){puff(c,cx-7,by-12,11,'#1a101c','#36213b','#593861','#7d5285','#d946ef');puff(c,cx+7,by-12,11,'#1a101c','#36213b','#593861','#7d5285','#d946ef');}
 else if(id==='prop-moss-boulder'){pxBoulder(c,cx,by-2,24,18,'#1b211b','#434942','#6a7366','#97a191','#4e853c');}
 else if(id==='prop-obsidian-spire'){pxSpire(c,cx,by-2,34,52,'#140d1a','#2c1a3d','#522b73','#a855f7');}
 else if(id==='prop-sandstone-arch'){pxBoulder(c,cx-14,by-2,10,32,'#3d2616','#7a4b2a','#a66d3f','#d99f62');pxBoulder(c,cx+14,by-2,10,32,'#3d2616','#7a4b2a','#a66d3f','#d99f62');pxRect(c,cx-24,by-38,48,12,'#3d2616');pxRect(c,cx-22,by-36,44,8,'#a66d3f');pxRect(c,cx-20,by-36,40,4,'#d99f62');}
 else if(id==='prop-ice-monolith'){pxSpire(c,cx,by-2,34,54,'#18384d','#2c678a','#7ecae8','#f0fcff');}
 else if(id==='prop-ruin-pillar'){pxBoulder(c,cx,by-2,14,10,'#242924','#4a5248','#6d756b','#9ea69b');pxRect(c,cx-10,by-56,20,46,'#242924');pxRect(c,cx-8,by-54,16,42,'#6d756b');pxRect(c,cx-8,by-54,6,40,'#9ea69b');for(let yy=by-46;yy<by-14;yy+=10)pxRect(c,cx-8,yy,16,2,'#464d45');pxRect(c,cx-8,by-26,10,6,'#4f8242');}
 else if(id==='prop-ruin-statue'){pxBoulder(c,cx,by-2,16,12,'#242924','#4a5248','#6d756b','#9ea69b');pxRect(c,cx-10,by-50,20,38,'#242924');pxRect(c,cx-8,by-48,16,34,'#737a70');pxRect(c,cx-8,by-48,6,32,'#9ea69b');pxBoulder(c,cx,by-46,10,12,'#242924','#4a5248','#737a70','#9ea69b');pxRect(c,cx-6,by-32,12,6,'#548c46');}
 else if(id==='prop-ancient-well'){pxBoulder(c,cx,by-2,20,18,'#242924','#4a5248','#757d72','#9ea69b','#4f8242');pxRect(c,cx-12,by-18,24,8,'#193542');pxRect(c,cx-16,by-42,4,26,'#4a3221');pxRect(c,cx+12,by-42,4,26,'#4a3221');drawPixelMound(c,cx,by-38,20,14,'#291a10','#593822','#784e30','#9c6842');}
 else if(id==='prop-wooden-signpost'){pxRect(c,cx-4,by-36,8,36,'#2b1d12');pxRect(c,cx-2,by-34,4,32,'#6e4b2e');pxRect(c,cx-16,by-34,32,14,'#3b2718');pxRect(c,cx-14,by-32,28,10,'#9c6f44');pxRect(c,cx-12,by-32,24,2,'#c2925e');pxRect(c,cx-10,by-28,18,2,'#5c3d22');pxRect(c,cx-10,by-24,14,2,'#5c3d22');}
 else if(id==='prop-campfire-pot'){for(let i=0;i<8;i++){const a=i/8*Math.PI*2;pxBoulder(c,cx+Math.cos(a)*12,by-8+Math.sin(a)*6,4,3,'#1b211b','#383d36','#5b6158','#858c80');}pxRect(c,cx-6,by-16,12,8,'#ff6b2b');pxRect(c,cx-4,by-14,8,4,'#ffe07d');pxBoulder(c,cx,by-18,8,6,'#16191c','#24292e','#474f57','#727c85');}
 else if(id==='prop-wagon-broken'){pxRect(c,cx-24,by-24,48,18,'#2b1c12');pxRect(c,cx-22,by-22,44,14,'#784e2e');pxRect(c,cx-22,by-22,44,4,'#a67247');for(const wx of [-16,14])pxBoulder(c,cx+wx,by,8,8,'#2b1c12','#52341d','#8c623d','#b58559');}
 else if(id==='prop-mana-crystal'){pxSpire(c,cx,by-2,30,52,'#183f5e','#226494','#38bdf8','#e0f7ff');}
 else if(id==='prop-ember-crystal'){pxSpire(c,cx,by-2,30,52,'#4a1410','#9a2614','#f97316','#fef08a');}
 else if(id==='prop-mtn-main'||id==='prop-mtn-wide'||id==='prop-mtn-spur'){
  const cols=Math.floor(meta.width/2),rows=Math.floor(meta.height/2);
  const peakU=id==='prop-mtn-main'?.44:id==='prop-mtn-wide'?.58:.38;
  const sh1U=id==='prop-mtn-main'?.73:id==='prop-mtn-wide'?.26:.70;
  const baseRow=rows-5;
  // Tính đường đỉnh núi gồ ghề (không phải tam giác thẳng hay hình tròn)
  const topR=[];
  for(let col=0;col<cols;col++){
   const u=col/(cols-1),edge=Math.sin(u*Math.PI);
   const main=Math.max(0,1-Math.abs(u-peakU)/.42);
   const sh1=Math.max(0,1-Math.abs(u-sh1U)/.28)*.68;
   const jag=((Math.sin(u*29+peakU*10)+Math.cos(u*47))*.5+1)*.045*edge;
   const hFrac=Math.min(.92,(Math.max(main,sh1)*.82+edge*.12+jag)*(edge<.18?edge/.18:1));
   topR.push(Math.max(2,Math.round(baseRow-hFrac*(baseRow-3))));
  }
  // Bóng đổ chân núi
  c.fillStyle='rgba(12,20,14,0.30)';
  c.fillRect(8,(baseRow-1)*2,meta.width-16,8);
  for(let col=1;col<cols-1;col++){
   const tr=topR[col],u=col/(cols-1);
   const rSpine=Math.round((peakU+(u-peakU)*.18+Math.sin(col*.32)*.03)*cols);
   const isSun=col<rSpine;
   // Viền tối đỉnh núi
   pxRect(c,col*2,(tr-1)*2,2,2,'#171d18');
   if(col>1&&topR[col-1]>tr+1)pxRect(c,col*2-2,tr*2,2,(topR[col-1]-tr)*2,'#171d18');
   if(col<cols-2&&topR[col+1]>tr+1)pxRect(c,col*2+2,tr*2,2,(topR[col+1]-tr)*2,'#171d18');
   for(let row=tr;row<=baseRow;row++){
    const depth=row-tr,frac=(row-tr)/Math.max(1,baseRow-tr);
    const strata=(row+Math.floor(Math.sin(col*.45)*2))%7===0;
    const isCrevice=Math.abs(col-rSpine)<=0||(col%9===0&&depth>4&&depth<16);
    let colHex;
    if(frac>.80&&((col+row)%3!==0)){
     // Chân núi đất & cỏ rêu
     colHex=(col+row)%5===0?'#594938':isSun?'#4f803c':'#2d5227';
    }else if(frac>.56&&Math.abs(topR[Math.min(cols-1,col+1)]-tr)<=1&&((col*3+row)%4<2)){
     // Vạt cỏ mọc trên bậc đá thoải
     colHex=isSun?'#5d9144':'#36612d';
    }else if(isCrevice){
     colHex='#222923';
    }else if(isSun){
     colHex=depth<4?'#aeb8a6':strata?'#657061':((col+row)%4===0?'#949f8d':'#7a8575');
    }else{
     colHex=strata?'#29302a':((col+row)%3===0?'#4b564b':'#394239');
    }
    pxRect(c,col*2,row*2,2,2,colHex);
   }
   // Nền đất/rêu chuyển tiếp mềm xuống mặt cỏ
   if(col%2===0)pxRect(c,col*2,(baseRow+1)*2,2,2,'#2a4724');
  }
 }

 scene.textures.addCanvas(id,canvas);
 return meta;
}

Object.assign(CUSTOM_PROP_META,{"prop-mushroom-woodland": {"group": "forest", "width": 72, "height": 54, "targetH": 42}, "prop-bamboo-clump": {"group": "trees", "width": 128, "height": 160, "targetH": 160}, "prop-ice-boulder": {"group": "rocks", "width": 104, "height": 100, "targetH": 92}, "prop-ancient-oak": {"group": "trees", "width": 224, "height": 256, "targetH": 280}, "prop-giant-boulder": {"group": "rocks", "width": 168, "height": 136, "targetH": 148}, "prop-mushroom-russet": {"group": "forest", "width": 72, "height": 54, "targetH": 42}});

CUSTOM_PROP_META['prop-mushroom-woodland'].group='bushes';CUSTOM_PROP_META['prop-mushroom-russet'].group='bushes';
