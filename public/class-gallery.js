import {PASSIVES} from './passives.js';
import {heroDisplayHeight} from './hero-stature.js';
import {warriorLeapHeight} from './pixel-skill-art.js';
import {REFRESH_HEROES} from './hero-refresh-art.js';
import {preloadShadowArt} from './shadow-art.js';
import {preloadMartialArt,createMartialAnimations,playMartialActor} from './martial-art.js';
import {CLASS_ART,prepareClassArt,drawClassIdentity} from './class-art.js';
import {CLASSES,SKILLS,displaySkill} from './skills.js';
import {renderEvent,updateVFX,clearVFX,clearActorVFX,unitVFX} from './effects.js';
import {actorAction} from './actor-animation.js';
import {preloadEmpowered,createEmpoweredAnimations,playEmpowered} from './empowered.js';
import {WIND} from './wind-config.js';
import {VANGUARD} from './vanguard-config.js';
import {drawWindState,drawWindFields} from './wind-vfx.js';
import {drawVanguardState} from './vanguard-vfx.js';
import {drawFallenState} from './fallen-vfx.js';
import {drawHolyAura} from './holy-vfx.js';
import {drawShadowState} from './shadow-vfx.js';
const readout=document.querySelector('#readout');
const reportError=error=>{readout.textContent='Không mở được hoạt ảnh: '+(error?.message||error)+'. Hãy tải lại trang.';};
window.addEventListener('error',e=>reportError(e.error||e.message));window.addEventListener('unhandledrejection',e=>reportError(e.reason));
readout.textContent='Đang tải nhân vật và bản xem kỹ năng…';
const [catalog,previews]=await Promise.all(['/catalog-v4.json','/skill-previews.json'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error('Không tải được '+url);return r.json();}));
let selected='fire-wizard',scene,replay=null,elapsed=0,cursor=0,current=null;const seen=new Set();
const names={'dark-elf':'Dạ Tiễn','goblin-assassin':'Quỷ Ảnh','knight-1':'Thiết Vệ','knight-2':'Thánh Kỵ Sĩ','knight-3':'Hắc Kỵ Sĩ',samurai:'Phong Kiếm Khách','samurai-commander':'Kiếm Chủ','samurai-archer':'Cung Thủ','warrior-1':'Chiến Binh','warrior-2':'Cuồng Chiến','warrior-3':'Chiến Tướng','fire-wizard':'Hỏa Sư','lightning-mage':'Lôi Sư','wanderer-magican':'Du Pháp'};
const actorIdOf=u=>u.hero==='samurai'?'wind-swordsman':u.hero==='warrior-3'?(u.vanguardTime>0?'vanguard-giant':'vanguard-champion'):u.hero==='knight-3'?(u.fallenMounted?'fallen-mounted':'fallen-knight'):u.hero==='knight-2'?(u.holyMounted?'holy-mounted':'holy-paladin'):u.hero||u.sprite;
function reset(){replay=null;current=null;seen.clear();if(!scene)return;clearVFX(scene);scene.cameras.main.setZoom(1).setScroll(0,0);for(const obj of scene.actorObjects.values()){clearActorVFX(scene,obj);obj.sprite.destroy();obj.label?.destroy();}scene.actorObjects.clear();for(const obj of scene.units){clearActorVFX(scene,obj);obj.sprite.setVisible(true);}scene.titles.forEach(t=>t.setVisible(true));}
function select(id){selected=id;reset();for(const b of document.querySelectorAll('#classes button'))b.setAttribute('aria-pressed',String(b.dataset.hero===id));const nav=document.querySelector('#skills');nav.replaceChildren();
 for(const skillId of [...CLASSES[CLASS_ART[id].classId].skills,'passive']){const skill=skillId==='passive'?{id:'passive',slot:'P',name:PASSIVES[id].name}:SKILLS.find(s=>s.id===skillId),b=document.createElement('button');b.textContent=skill.slot+' · '+(skill.slot==='P'?skill:displaySkill(skill,{classId:CLASS_ART[id].classId,dualSwords:document.querySelector('#dual-form').checked})).name;b.disabled=!scene;b.onclick=()=>{
  reset();const suffix=selected==='samurai-commander'&&document.querySelector('#dual-form').checked?':dual':selected==='samurai-archer'&&['Q','R'].includes(skill.slot)&&document.querySelector('#poison-combo').checked?':poison':['knight-2','knight-3'].includes(selected)&&document.querySelector('#mounted-form').checked&&previews[selected+':'+skill.slot+':mounted']?':mounted':'';replay=previews[selected+':'+skill.slot+suffix];elapsed=0;cursor=0;
  scene.units.forEach(o=>o.sprite.setVisible(false));scene.titles.forEach(t=>t.setVisible(false));scene.cameras.main.setZoom(skill.id==='healing-tide'?.47:skill.id==='rally'?.64:['holy-ascend','fallen-doom'].includes(skill.id)?.72:['holy-aura','fallen-aura'].includes(skill.id)?.82:1);scene.cameras.main.centerOn(replay.origin.x+(skill.id==='blizzard'?160:70),replay.origin.y-30);
  document.querySelector('#readout').textContent=(skill.slot==='P'?PASSIVES[selected].name+' · '+PASSIVES[selected].text+' · '+CLASSES[CLASS_ART[selected].classId].passive:skill.name)+(skill.slot==='P'?' · Tinh thông bậc 2':' · Bậc 1')+' · Mục tiêu tập đứng yên'+(['healing-tide','rally','holy-ascend','fallen-doom','holy-aura','fallen-aura'].includes(skill.id)?' · Thu nhỏ camera để thấy toàn vùng hào quang':' · Kích thước trong trận');
 };nav.append(b);}
}
for(const [id,name]of Object.entries(names)){const b=document.createElement('button');b.textContent=name;b.dataset.hero=id;b.onclick=()=>select(id);document.querySelector('#classes').append(b);}select(selected);
document.querySelector('#mounted-form').onchange=()=>select(selected);document.querySelector('#poison-combo').onchange=()=>select(selected);document.querySelector('#dual-form').onchange=()=>select(selected);document.querySelector('#action').onchange=reset;document.querySelector('#flip').onchange=reset;
const actorIds=new Set([...Object.keys(CLASS_ART),'wind-swordsman','vanguard-champion','vanguard-giant','fallen-knight','fallen-mounted','holy-paladin','holy-mounted','green-slime','forest-spirit']);
const actors=catalog.actors.filter(a=>actorIds.has(a.id));
new Phaser.Game({type:Phaser.AUTO,width:1000,height:560,parent:'stage',pixelArt:true,backgroundColor:'#20382c',scene:{
 preload(){this.load.on('progress',value=>{readout.textContent='Đang tải hình nhân vật… '+Math.round(value*100)+'%';});this.load.on('loaderror',file=>reportError(new Error('Không tải được '+file.key)));preloadShadowArt(this);preloadMartialArt(this);preloadEmpowered(this,catalog);
  for(const a of actors)for(const [action,info]of Object.entries(a.actions))if(!a.packed||action==='idle'){if(a.preciseAtlas)this.load.image(a.id+':'+action,info.url);else this.load.spritesheet(a.id+':'+action,info.url,{frameWidth:info.frameWidth||a.frame,frameHeight:info.frameHeight||a.frameHeight||a.frame});}
  for(const fx of catalog.effects)this.load.spritesheet('fx:'+fx.id,fx.url,{frameWidth:fx.frame,frameHeight:fx.frame});for(const art of catalog.spellArt||[])this.load.image('art:'+art.id,art.url);
 },
 create(){createMartialAnimations(this);scene=this;prepareClassArt(this,catalog,{suffix:':renewed'});createEmpoweredAnimations(this,catalog);
  for(const a of actors)if(a.preciseAtlas){const texture=this.textures.get(a.id+':idle');for(const info of Object.values(a.actions))for(const [i,rect]of info.frameRects.entries())texture.add((info.start||0)+i,0,rect.x,rect.y,rect.width,rect.height);}
  for(const a of actors)for(const [action,info]of Object.entries(a.actions))for(const suffix of CLASS_ART[a.id]&&!a.packed?['',':renewed']:[''])this.anims.create({key:a.id+':'+action+suffix,frames:this.anims.generateFrameNumbers(a.id+':'+(a.packed?'idle':action)+suffix,{start:info.start||0,end:(info.start||0)+info.frames-1}),frameRate:action==='attack'?12:8,repeat:['attack','dead','hurt','cast','dash','leap','charge','flurry'].includes(action)?0:-1});
  for(const fx of catalog.effects)this.anims.create({key:'fx:'+fx.id,frames:this.anims.generateFrameNumbers('fx:'+fx.id,{start:0,end:fx.frames-1}),frameRate:Math.max(14,fx.frames*1.7),repeat:0});
  this.add.grid(500,280,1000,560,32,32,0x20382c,1,0x8c9b6d,.07).setScrollFactor(0);
  this.titles=[this.add.text(250,40,'BẢN GỐC',{fontSize:'15px',color:'#aebda8'}).setOrigin(.5),this.add.text(750,40,'BẢN NÂNG CẤP / BIẾN HÌNH',{fontSize:'15px',color:'#e7d5a2'}).setOrigin(.5)];
  this.units=[250,750].map(x=>({sprite:this.add.sprite(x,320,selected+':idle').setDepth(100),size:88,groundY:320}));this.unitGlow=this.add.graphics().setDepth(20010);this.unitGround=this.add.graphics().setDepth(2);this.actorObjects=new Map();const params=new URLSearchParams(location.search);select(names[params.get('hero')]?params.get('hero'):selected);const slot=params.get('slot');if(['Q','E','R','P'].includes(slot))document.querySelectorAll('#skills button')[['Q','E','R','P'].indexOf(slot)].click();else readout.textContent='Chọn động tác để xem nhân vật chuyển động, hoặc chọn Q/E/R/P để xem kỹ năng và nội tại.';
 },
 update(time,delta){if(!this.actorObjects)return;this.unitGlow.clear();this.unitGround.clear();
  if(replay){
   elapsed+=Math.min(delta,100);while(cursor<replay.frames.length&&cursor*replay.step<=elapsed){current=replay.frames[cursor++];for(const e of current.events)renderEvent(this,e.type==='passive-action-fx'?{...e,level:Number(document.querySelector('#visual-level').value)||1}:e,seen);}
   if(current){
    drawWindFields(this,current,time);drawShadowState(this,current,time);
    for(const u of [...current.players,...(current.troops||[]),...current.enemies]){
     const hero=!!u.hero,id=actorIdOf(u),a=catalog.actors.find(a=>a.id===id);if(!a)continue;
     let obj=this.actorObjects.get(u.id);
     if(obj&&obj.actor!==id){obj.sprite.destroy();obj.label?.destroy();this.actorObjects.delete(u.id);obj=null;}
     if(!obj){const size=hero?(heroDisplayHeight(u)):u.type==='forest-spirit'?84:u.size||30;obj={actor:id,size,sprite:this.add.sprite(u.x,u.y,id+':idle'),label:this.add.text(u.x,u.y+10,'',{fontSize:'10px',color:'#d9e8c2'}).setOrigin(.5)};this.actorObjects.set(u.id,obj);}
     obj.groundY=u.y;obj.sprite.setPosition(u.x,u.y-warriorLeapHeight(u.martialLeap)-(u.holyLeapTime>0?Math.sin(Math.PI*Math.max(0,Math.min(1,u.holyLeapTime/(u.holyLeapDuration||.28))))*(u.holyMounted?58:42):0)-(u.windLift||0)-(u.windAirTime>0?Math.sin(Math.PI*(1-u.windAirTime/(u.tideLiftDuration||.5)))*26:0)).setDepth(u.y).setFlipX(u.face<0);
     if(u.castCount!==obj.lastCastCount){obj.lastCastCount=u.castCount;if(u.castAnim>0)obj.attackRestart=true;}
     const anim=actorAction(u,obj,!!u.moving,time,a),action=u.classId==='windblade'&&u.windAction?(u.windAction.kind==='dash'?'dash':u.windAction.time>WIND.r.leap?'cast':'leap'):u.classId==='windblade'&&u.windLanding>0?'attack':u.classId==='windblade'&&u.windCast>0?'cast':u.classId==='vanguard'&&u.vanguardPoseTime>0&&a.actions[u.vanguardPose]?u.vanguardPose:['paladin','fallen'].includes(u.classId)&&u.castAnim>0?(u.classId==='paladin'&&u.holyQStep===1?'attack':'cast'):a.actions[anim]?anim:'idle';
     if(!playMartialActor(this,{...u,level:Number(document.querySelector('#visual-level').value)||1},obj,action)&&!playEmpowered(this,u,obj,action,catalog)){
      const suffix=hero&&CLASS_ART[id]&&!a.packed?':renewed':'',key=id+':'+action+suffix;obj.sprite.setOrigin(a.actions[action]?.originX??a.originX,a.actions[action]?.originY??a.originY).setScale(obj.size/(a.actions[action]?.bodyHeight||a.bodyHeight));
      if(action==='flurry'&&u.vanguardThrust!==obj.vanguardThrust){obj.vanguardThrust=u.vanguardThrust;obj.sprite.play(key,false);}
      else if(obj.attackRestart&&action==='attack'){obj.sprite.play(key,false);obj.attackRestart=false;}else if(action!=='attack'||obj.sprite.anims.currentAnim?.key!==key)obj.sprite.play(key,true);
      const pivot=a.actions[action]?.framePivots?.[Number(obj.sprite.frame.name)-(a.actions[action]?.start||0)];if(pivot)obj.sprite.setOrigin(pivot.x,pivot.y);
      obj.sprite.anims.timeScale=action==='attack'?a.actions.attack.frames/Math.max(.12,(obj.attackDuration||300)/1000)/12:action==='walk'?1.25:1;
     }
     obj.label.setPosition(u.x,u.y+12).setText(hero?'':u.type==='forest-spirit'?'Tinh linh cây':String(Math.round(u.maxHp-u.hp))+' sát thương');
     unitVFX(this,{...u,level:Number(document.querySelector('#visual-level').value)||1},obj,time);drawHolyAura(this,u,obj,time);drawFallenState(this,u,obj,time);if(hero){drawClassIdentity(this,u,obj,time);drawVanguardState(this,u,obj,time);drawWindState(this,u,obj,time);}
    }
   }
  }else{
   const action=document.querySelector('#action').value;
   for(const [i,obj]of this.units.entries()){
    obj.sprite.setFlipX(document.querySelector('#flip').checked);
    if(i&&(REFRESH_HEROES[selected]||['samurai-commander','warrior-2','knight-2','knight-3'].includes(selected))){const u={hero:selected,classId:CLASS_ART[selected].classId,level:Number(document.querySelector('#visual-level').value)||1,hp:action==='dead'?0:100,holyMounted:document.querySelector('#mounted-form').checked,fallenMounted:document.querySelector('#mounted-form').checked,dualSwords:document.querySelector('#dual-form')?.checked};obj.size=heroDisplayHeight(u,88);playMartialActor(this,u,obj,action==='cast'&&selected==='samurai-commander'?'attack':action);unitVFX(this,{...u,hp:document.querySelector('#accents').checked?u.hp:0},obj,time);continue;}
    const id=selected==='samurai'?'wind-swordsman':selected==='warrior-3'?(i?'vanguard-giant':'vanguard-champion'):selected==='knight-3'?(i?'fallen-mounted':'fallen-knight'):selected==='knight-2'?(i?'holy-mounted':'holy-paladin'):selected,a=catalog.actors.find(a=>a.id===id);
    const act=a.actions[action]?action:'attack',suffix=i&&CLASS_ART[id]&&!a.packed?':renewed':'';
    obj.sprite.setOrigin(a.actions[act]?.originX??a.originX,a.actions[act]?.originY??a.originY).setScale((i&&['warrior-3','knight-2','knight-3'].includes(selected)?112:obj.size)/(a.actions[act]?.bodyHeight||a.bodyHeight)).play(id+':'+act+suffix,true);
    const pivot=a.actions[act]?.framePivots?.[Number(obj.sprite.frame.name)-(a.actions[act]?.start||0)];if(pivot)obj.sprite.setOrigin(pivot.x,pivot.y);
    obj.sprite.anims.timeScale=1;if(i&&document.querySelector('#accents').checked)drawClassIdentity(this,{hero:selected,hp:action==='dead'?0:100,face:obj.sprite.flipX?-1:1,moving:action==='walk',anim:action==='attack'?1:0},obj,time);
   }
  }
  updateVFX(this,delta/1000);
 }
}});

