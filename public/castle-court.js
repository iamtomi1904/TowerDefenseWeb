import {TERRAIN_TILE as T} from './terrain-grid.js';
export function castleCourt(map){const b=map?.base;if(!b)return {left:0,right:0,top:0,bottom:0};return {left:Math.floor((b.x-256)/T)*T,right:Math.ceil((b.x+256)/T)*T,top:Math.floor((b.y-288)/T)*T,bottom:Math.ceil((b.y+224)/T)*T};}
export function inCastleCourt(map,p){if(!map?.base||!p)return false;const r=castleCourt(map);return p.x>=r.left&&p.x<r.right&&p.y>=r.top&&p.y<r.bottom;}

const COURT_THEMES=[
 {bed:'#727766',stones:['#787d6b','#828775','#6d7261','#7c806e','#878c79'],curb:'#4e5446',carpet:'#9e9676',trim:'#c9be9366'},
 {bed:'#5b6b54',stones:['#62735a','#6c7d63','#54634d','#67785e','#73856a'],curb:'#3b4a36',carpet:'#7e8c66',trim:'#b3cf8c66'},
 {bed:'#7d675b',stones:['#856e61','#8f7668','#735d52','#80695d','#947b6d'],curb:'#544139',carpet:'#a85c48',trim:'#f0b07566'},
 {bed:'#686d70',stones:['#6e7378','#777c82','#5f6469','#6a6f74','#7e8389'],curb:'#44494e',carpet:'#7d8896',trim:'#c7d6e666'},
 {bed:'#9c855e',stones:['#a68e66','#b0976e','#917b56','#9e8760','#b89f76'],curb:'#6e5838',carpet:'#c48a47',trim:'#fae09866'},
 {bed:'#7b93a3',stones:['#849dad','#8fa8b8','#718999','#7e96a6','#9ab4c4'],curb:'#4b6475',carpet:'#649eb8',trim:'#dff6ff66'},
 {bed:'#4c6352',stones:['#526b58','#5c7562','#45594a','#4e6654','#637d69'],curb:'#2f4234',carpet:'#638c67',trim:'#b6e89b66'},
 {bed:'#756e87',stones:['#7e7791','#88819c','#6a637a','#77708a','#928ba6'],curb:'#4c455e',carpet:'#896ca6',trim:'#dec7ff66'},
 {bed:'#4a3b38',stones:['#52413d','#5c4945','#423431','#4d3d39','#66514c'],curb:'#2b201e',carpet:'#9c452b',trim:'#ffb06666'},
 {bed:'#3b3647',stones:['#433d52','#4c455c','#363142','#3f394d','#554d66'],curb:'#221e2b',carpet:'#664587',trim:'#cc9eff66'},
];

// Cohesive medieval stone courtyard on the exact castleCourt footprint, themed per stage.
export function drawCastleCourt(c,scene,map){
 const r=castleCourt(map),w=r.right-r.left,h=r.bottom-r.top;
 const theme=COURT_THEMES[(map.id-1)%COURT_THEMES.length];
 const stone=scene.textures.get(map.roadTile).getSourceImage();
 c.save();

 // Beveled footprint with softer ground contact, baked once into map terrain.
 const edge=24;
 const outline=()=>{c.beginPath();c.moveTo(r.left+edge,r.top);c.lineTo(r.right-edge,r.top);c.lineTo(r.right,r.top+edge);c.lineTo(r.right,r.bottom-edge);c.lineTo(r.right-edge,r.bottom);c.lineTo(r.left+edge,r.bottom);c.lineTo(r.left,r.bottom-edge);c.lineTo(r.left,r.top+edge);c.closePath();};
 c.save();outline();c.clip();
 c.fillStyle='#131d1538';
 c.fillRect(r.left-8,r.top-6,w+16,h+16);

 c.fillStyle=theme.bed;
 c.fillRect(r.left,r.top,w,h);

 c.save();
 c.beginPath();c.rect(r.left,r.top,w,h);c.clip();
 c.globalAlpha=.18;
 for(let y=r.top;y<r.bottom;y+=T)for(let x=r.left;x<r.right;x+=T)c.drawImage(stone,24,24,32,32,x,y,T,T);

 c.globalAlpha=1;
 const bw=24,bh=16;
 for(let row=0,y=r.top;y<r.bottom;row++,y+=bh){
  const off=(row%2)*(bw/2);
  for(let col=0,x=r.left-off;x<r.right;col++,x+=bw){
   const shade=((row*13+col*29+map.id)%5);
   c.fillStyle=theme.stones[shade];
   c.fillRect(x+1,y+1,bw-2,bh-2);
   c.fillStyle='#ffffff14';
   c.fillRect(x+2,y+2,bw-4,2);
   c.fillStyle='#00000026';
   c.fillRect(x+1,y+bh-2,bw-2,2);
  }
 }

 c.strokeStyle=theme.curb;
 c.lineWidth=10;
 outline();c.stroke();
 c.strokeStyle='#ffffff28';
 c.lineWidth=2;
 c.strokeRect(r.left+12,r.top+12,w-24,h-24);
 // Sparse moss and chipped joints soften the meeting with each biome.
 for(let i=0;i<80;i++){const x=r.left+12+(i*97%(w-24)),y=i%2?r.top+10+(i%3)*3:r.bottom-16-(i%4)*2;c.fillStyle=i%3?'#34433366':'#b8b39a44';c.fillRect(x,y,3+i%5,2);}

 const gx=map.base.x-58,gy=map.base.y+36,gw=116,gh=r.bottom-gy;
 c.fillStyle=theme.bed;
 c.fillRect(gx,gy,gw,gh);
 for(let row=0,y=gy;y<r.bottom;y+=18,row++)for(let col=0;col<4;col++){c.fillStyle=theme.stones[(row+col+2)%5];c.fillRect(gx+col*29+2,y+1,26,15);c.fillStyle='#ffffff18';c.fillRect(gx+col*29+3,y+2,23,1);}
 c.fillStyle=theme.curb;
 c.fillRect(gx-4,gy,4,gh);
 c.fillRect(gx+gw,gy,4,gh);

 c.restore();
 c.restore();
 c.restore();
}