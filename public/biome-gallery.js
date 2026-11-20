import {BIOMES} from './world-biomes.js';
import {biomeArtwork} from './biome-art.js';
import {drawEnvironmentPatch} from './environment-art.js';
import {drawHydrology} from './landscape-art.js';
const textures=new Map(),scene={textures:{exists:k=>textures.has(k),get:k=>({getSourceImage:()=>textures.get(k)})}};
try{
 await Promise.all(Object.keys(BIOMES).map(id=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{textures.set('biome-material:'+id,im);resolve();};im.onerror=()=>reject(Error('Không tải được '+BIOMES[id].name));im.src=biomeArtwork(id);}))); 
 for(const [id,b]of Object.entries(BIOMES)){
  const card=document.createElement('article');card.id=id;const title=document.createElement('h2');title.textContent=b.name;const canvas=document.createElement('canvas');canvas.width=480;canvas.height=300;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  c.fillStyle='#30462e';c.fillRect(0,0,480,300);
  // Context stays deliberately modest, matching the existing green battlefield.
  for(let i=0;i<160;i++){const x=(i*71)%480,y=(i*37)%300;c.fillStyle=i%2?'#395335':'#293f2b';c.fillRect(x,y,3,2);}
  if(['deep','shallow','abyss'].includes(id))drawHydrology(c,scene,{id:1,rivers:[{type:id,points:[[20,160],[155,115],[310,175],[460,130]],width:id==='abyss'?94:86}],bridges:[]});
  else drawEnvironmentPatch(c,scene,{type:id,x:240,y:150,rx:166,ry:98});
  const detail=document.createElement('p'),rules=[];if(b.blocked)rules.push('Chặn đi qua');if(b.speed)rules.push('Tốc độ ×'+b.speed);if(b.attackSpeed)rules.push('Tốc đánh ×'+b.attackSpeed);if(b.burn)rules.push('Thiêu đốt '+Math.round(b.burn*100)+'% máu/s');if(b.armor)rules.push('Giáp ×'+b.armor);if(b.forestPower)rules.push('Sức mạnh thú rừng ×'+b.forestPower);if(b.flyingPower)rules.push('Đơn vị bay ×'+b.flyingPower);detail.textContent=rules.join(' · ')||'Địa hình trang trí / chiến thuật';
  card.append(canvas,title,detail);document.querySelector('#biomes').append(card);
 }
 document.querySelector('#status').textContent=`${Object.keys(BIOMES).length} thảm nền · Dùng chung texture với bản đồ trong trận`;
 if(location.hash)document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
}catch(e){document.querySelector('#status').textContent=e.message;}
