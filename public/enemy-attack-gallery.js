import {FOREST_LEADERS} from './forest-leaders.js';
import {BOSSES} from './bosses.js';
import {MONSTERS} from './content.js';
import {ENEMY_ATTACK_LAYOUT,preloadEnemyAttacks,createEnemyAttacks,playEnemyAttack,enemyAttackKey} from './enemy-attack-art.js';
const ids=Object.keys(ENEMY_ATTACK_LAYOUT),$=id=>document.getElementById(id),catalog=await(await fetch('/catalog-v4.json')).json();
const names=Object.fromEntries([...MONSTERS,...FOREST_LEADERS,...BOSSES.map(b=>({id:b.actor,name:b.name}))].map(a=>[a.id,a.name]));
let scene,mode='attack',manual=false;
for(let i=0;i<Math.ceil(ids.length/9);i++)$('page').add(new Option(`${i+1} · ${ids.slice(i*9,i*9+9).map(id=>names[id]||id).join(' / ')}`,i));
const fail=e=>$('status').textContent='Lỗi: '+(e.message||e);window.addEventListener('error',e=>fail(e.error||e.message));window.addEventListener('unhandledrejection',e=>fail(e.reason));
new Phaser.Game({type:Phaser.AUTO,width:1000,height:750,parent:'stage',pixelArt:true,backgroundColor:'#20382c',scene:{
 preload(){preloadEnemyAttacks(this);this.load.on('loaderror',f=>fail(f.key));for(const id of ids){const a=catalog.actors.find(a=>a.id===id);this.load.spritesheet('original:'+id,a.actions.idle.url,{frameWidth:a.frame,frameHeight:a.frameHeight||a.frame});}},
 create(){scene=this;createEnemyAttacks(this);this.add.grid(500,375,1000,750,32,32,0x20382c,1,0x899e72,.08);this.actors=[];showPage();},
 update(time){if(!this.actors)return;for(const obj of this.actors){obj.size=$('actual').checked?obj.actualSize:90;obj.unit.face=$('flip').checked?-1:1;
  if(mode==='idle'){obj.sprite.anims.stop();obj.sprite.setTexture('original:'+obj.unit.sprite,0).setOrigin(obj.info.originX,obj.info.originY).setScale(obj.size/obj.info.bodyHeight).setFlipX(obj.unit.face<0);continue;}
  if(!manual&&$('loop').checked&&time>=obj.nextAttack){obj.attackRestart=true;obj.nextAttack=time+1200;}
  playEnemyAttack(this,obj.unit,obj,'attack');
  if(manual){obj.sprite.anims.pause();obj.sprite.setFrame(Number($('frame').value));playEnemyAttack(this,obj.unit,obj,'attack');}else obj.sprite.anims.resume();
 }}
}});
function showPage(){for(const obj of scene.actors){obj.sprite.destroy();obj.label.destroy();}scene.actors=[];
 for(const [i,id]of ids.slice(Number($('page').value)*9,Number($('page').value)*9+9).entries()){
  const x=166+i%3*334,y=200+Math.floor(i/3)*245,def=MONSTERS.find(m=>m.id===id),info=catalog.actors.find(a=>a.id===id);
  scene.actors.push({unit:{sprite:id,hp:100,face:1},sprite:scene.add.sprite(x,y,enemyAttackKey(id)),label:scene.add.text(x,y+20,names[id]||id,{fontSize:'15px',color:'#ecdfbc'}).setOrigin(.5),info,size:90,actualSize:def?.size||115,attackDuration:600,attackRestart:true,nextAttack:0});
 }$('status').textContent=`${ids.length} bộ hình đã tải · Nhóm ${Number($('page').value)+1}/${Math.ceil(ids.length/9)}`;
}
$('page').onchange=()=>{mode='attack';manual=false;showPage();};
$('replay').onclick=()=>{mode='attack';manual=false;for(const obj of scene?.actors||[]){obj.attackRestart=true;obj.nextAttack=scene.time.now+1200;}};
$('frame').oninput=()=>{mode='attack';manual=true;};$('idle').onclick=()=>{mode='idle';manual=false;};
