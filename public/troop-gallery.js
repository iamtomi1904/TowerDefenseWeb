import {TROOPS} from './content.js';
import {TROOP_ART,preloadTroopArt,createTroopAnimations,playTroopActor} from './troop-art.js';
import {TROOP_LAYOUT} from './troop-layout.js';
const status=document.querySelector('#troop-status'),troops=TROOPS.filter(t=>TROOP_ART[t.sprite]);let scene;
const catalog=await (await fetch('/catalog-v4.json')).json();
const report=error=>status.textContent='Không tải được lính: '+(error.message||error);
window.addEventListener('error',e=>report(e.error||e.message));
window.addEventListener('unhandledrejection',e=>report(e.reason));
new Phaser.Game({type:Phaser.AUTO,width:1000,height:810,parent:'troop-stage',pixelArt:true,backgroundColor:'#20382c',scene:{
 preload(){this.load.on('progress',n=>status.textContent='Đang tải hình lính… '+Math.round(n*100)+'%');this.load.on('loaderror',f=>report('Không tải được '+f.key));preloadTroopArt(this);for(const t of troops){const a=catalog.actors.find(a=>a.id===t.sprite);this.load.spritesheet('troop-original:'+t.sprite,a.actions.idle.url,{frameWidth:a.frame,frameHeight:a.frameHeight||a.frame});}},
 create(){scene=this;createTroopAnimations(this);this.add.grid(500,405,1000,810,32,32,0x20382c,1,0x8c9b6d,.07);this.actors=[];
  for(const [i,t]of troops.entries()){
   const x=166+i%3*334,y=225+Math.floor(i/3)*268;
   this.add.text(x,34+Math.floor(i/3)*268,t.name,{fontFamily:'Georgia',fontSize:'20px',color:'#eddfb7'}).setOrigin(.5);
   this.add.text(x,y+31,t.description,{fontFamily:'Segoe UI',fontSize:'13px',color:'#b9c9af'}).setOrigin(.5);
   const originalInfo=catalog.actors.find(a=>a.id===t.sprite),layout=TROOP_LAYOUT[t.sprite],original=this.add.sprite(x-65,y,'troop-original:'+t.sprite,0).setDepth(y).setOrigin(layout.originalOriginX,layout.originalOriginY);
   const compareLabel=this.add.text(x,y+8,'GỐC                 NÂNG NÉT',{fontFamily:'Segoe UI',fontSize:'10px',color:'#c8bb96'}).setOrigin(.5);
   this.actors.push({unit:{sprite:t.sprite,hp:100},sprite:this.add.sprite(x+65,y,'troop-v2:'+t.sprite).setDepth(y),original,originalInfo,compareLabel,x,y,size:112,attackDuration:680});
  }status.textContent='9 loại lính · Chọn động tác để xem hoạt ảnh.';
 },
 update(){if(!this.actors)return;const action=document.querySelector('#troop-action').value,small=document.querySelector('#troop-size').checked;
  for(const obj of this.actors){const compare=document.querySelector('#troop-compare').checked,flip=document.querySelector('#troop-flip').checked;obj.size=small?38:96;obj.unit.hp=action==='dead'?0:100;obj.sprite.setPosition(obj.x+(compare?65:0),obj.y).setFlipX(flip);obj.original.setVisible(compare).setScale(obj.size/obj.originalInfo.bodyHeight).setFlipX(flip);obj.compareLabel.setVisible(compare);playTroopActor(this,obj.unit,obj,action);}
 }
}});
function replay(){if(!scene)return;for(const obj of scene.actors){obj.sprite.anims.stop();obj.sprite.anims.currentAnim=null;obj.attackRestart=true;}}
document.querySelector('#troop-action').onchange=replay;document.querySelector('#troop-replay').onclick=replay;
