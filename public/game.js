import {resolveActorAnimation} from './actor-animation-metadata.js';
import {createBattleDiagnostics} from './battle-diagnostics.js';
import {createBattleSocket} from './battle-socket.js';
import {preloadMapBuildings,ensureMapBuildings,releaseOldBuildings} from './map-assets.js';
let initialMapStage=1,mapSwitchJob=null;
import {MovementTimeline} from './movement-timeline.js';
const movementTimeline=new MovementTimeline();
import {installBattleAssetLoader,heroOwner} from './battle-assets.js';
import {movementBlend,settlePosition,visuallyMoving,followGround,renderMovementTarget} from './movement-render.js';
import {createPerformanceHUD} from './performance-hud.js';
import {renderViews,unitInView,setRenderDormant} from './render-budget.js';
import {guardianRHeight} from './guardian-ultimate.js';
import {preloadCatalogProps,prepareCatalogProps} from './catalog-prop-art.js';
import {CUSTOM_PROP_META} from './custom-props-art.js';
import {preloadBiomeArt} from './biome-art.js';
import {playTroopActor} from './troop-art.js';
import {preloadEnemyAttacks,createEnemyAttacks,playEnemyAttack} from './enemy-attack-art.js';
import {heroDisplayHeight} from './hero-stature.js';
import {warriorLeapHeight} from './pixel-skill-art.js';
import {REFRESH_HEROES} from './hero-refresh-art.js';
import {preloadHeroRefresh,createHeroRefreshAnimations,playRefreshedHero} from './hero-refresh-art.js';
import {preloadRavagerArt,createRavagerAnimations,playRavagerActor} from './ravager-art.js';
import {preloadSlashArt} from './slash-art.js';
import {preloadMartialArt,createMartialAnimations,playMartialActor} from './martial-art.js';
import {prepareClassArt,drawClassIdentity} from './class-art.js';
import {requireAccount,accountMenu} from './auth-client.js';
const account=await requireAccount();accountMenu(account);
import {WIND} from './wind-config.js';
import {updateStatusHUD} from './status-hud.js';
import {UPGRADES,upgradePrice,upgradeRank} from './progression.js';
import {drawWindState,drawWindFields} from './wind-vfx.js';
import {drawVanguardState} from './vanguard-vfx.js';
import {VANGUARD} from './vanguard-config.js';
import {drawFallenState} from './fallen-vfx.js';
import {FALLEN} from './fallen-config.js';
import {drawHolyAura} from './holy-vfx.js';
import {BOSS_DISPLAY_SCALE} from './world-biomes.js';
import {drawLeaderAuras,clearLeaderAuras} from './leader-auras.js';
import {SHADOW} from './shadow-config.js';
import {preloadShadowArt} from './shadow-art.js';
import {initBattleControls,updateBattleNotice} from './battle-controls.js';
import {beginBattleLoading,updateBattleLoading,finishBattleLoading,failBattleLoading} from './battle-loading.js';
import {drawShadowState} from './shadow-vfx.js';
import {gemWeaponVFX,gemTargetVFX,drawGemPools} from './gem-vfx.js';
import {initGemUI,updateGemUI,openCastle} from './gem-ui.js';
import {DIFFICULTIES,difficultyOf} from './difficulty.js';
import {initCombatWindow,updateCombatWindow} from './combat-window.js';
import {preloadBossCasting,playBossCasting,createBossCastingFrames} from './boss-casting.js';

import {buildInventory,updateInventory,drawLoot} from './loot-ui.js';
import {drawHostileZones} from './boss-vfx.js';
import {preloadEmpowered,createEmpoweredAnimations,playEmpowered} from './empowered.js';
import {actorAction} from './actor-animation.js';
import {PASSIVES} from './passives.js';
import {HEROES,TROOPS,MAPS,WORLD,heroById} from './content.js';
import {CLASSES,skillCap,skillById,skillAtRank,skillPrice,describeSkill,displaySkill} from './skills.js';
import {renderMap,drawMiniMap,updateScenery,unifiedPropAsset} from './terrain.js';
import {renderEvent,updateVFX,clearVFX,unitVFX,clearActorVFX} from './effects.js';
const $=id=>document.getElementById(id),held={},entities=new Map(),seenEvents=new Set();
let assetHeroes=null;
let state,myId,game,scene,currentMap=0,showRange=false,hero='knight-1',catalog,noticeUntil=0,bookClass='',lastUIUpdate=-Infinity,stateReceivedAt=0;
function readLocal(key,fallback=''){try{return localStorage.getItem(key)||fallback;}catch{return fallback;}}
function writeLocal(key,value){try{localStorage.setItem(key,value);}catch{}}
hero=heroById(readLocal('gct-hero',account.hero||'knight-1')).id;$('name').value=readLocal('gct-name',account.displayName)||account.displayName;
const urlParams=new URLSearchParams(location.search);
let bakedProps={};const bakedPropsReady=fetch('/catalog-props-baked.json').then(r=>{if(!r.ok)throw Error('Thiếu ảnh cảnh vật');return r.json();}).then(data=>bakedProps=data);
const optimizedReady=fetch('/optimized-assets.json').then(r=>{if(!r.ok)throw Error('Thiếu ảnh tối ưu');return r.json();});let optimizedAssets={};
const catalogReady=fetch('/catalog-v4.json').then(r=>{if(!r.ok)throw Error('Không tải được danh sách asset.');return r.json();}).then(data=>catalog=data);catalogReady.catch(e=>notify(e.message));
const socket=createBattleSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}`);
const battleDiagnostics=createBattleDiagnostics(socket,text=>notify(text));
function send(m){if(m.type==='buy')m.requestId=crypto.randomUUID();if(socket.readyState===1)socket.send(JSON.stringify(m));}
function notify(text){$('error').textContent=text;$('notice').textContent=text;noticeUntil=Date.now()+4000;}
socket.onopen=()=>{
 $('connection').textContent='● SERVER SẴN SÀNG';
 for(const id of ['solo','create','join'])if($(id))$(id).disabled=false;
 if(urlParams.get('autostart')==='1'){
  if(urlParams.get('difficulty')&&$('difficulty'))$('difficulty').value=urlParams.get('difficulty');
  const code=(urlParams.get('code')||'').trim();
  const mode=urlParams.get('mode')||'solo';
  const stage=Number(urlParams.get('stage'))||undefined;
  join(code?{code,stage,replaceSession:true}:mode==='coop'?{stage,replaceSession:true}:{solo:true,stage,replaceSession:true});
 }
};
socket.onclose=event=>{if(event.code===4002){$('status').textContent='Không thể vào lại phòng: '+event.reason;notify('Phòng đã hết thời gian giữ chỗ. Hãy về sảnh tạo phòng mới.');$('again').hidden=false;return;}if(event.code===4001){location.replace('/login.html?next=/defense.html');return;}for(const k in held)held[k]=false;$('connection').textContent='● MẤT KẾT NỐI';for(const id of ['solo','create','join','start','next'])if($(id))$(id).disabled=true;notify('Mất kết nối. Đang tự kết nối lại, giữ trận tối đa 60 giây.');if(state)$('status').textContent='Đang kết nối lại…';};
socket.onerror=()=>notify('Không kết nối được server.');
function join(extra){$('error').textContent='';writeLocal('gct-name',$('name').value);send({type:'join',waitForAssets:true,name:$('name').value,hero,difficulty:$('difficulty').value,...extra});}
function openLobbyRoom(mode,code=''){
 $('error').textContent='';
 writeLocal('gct-name',$('name').value);
 const q=new URLSearchParams({mode,difficulty:$('difficulty').value||'normal'});
 if(code)q.set('code',code);
 location.href='/lobby.html?'+q.toString();
}
buildInventory(send);
$('solo').onclick=()=>openLobbyRoom('solo');
$('create').onclick=()=>openLobbyRoom('coop');
$('join').onclick=()=>{const code=$('code').value.trim().toUpperCase();if(!code){notify('Nhập mã phòng của bạn bè.');return;}openLobbyRoom('join',code);};
$('start').onclick=()=>send({type:'start'});$('next').onclick=()=>send({type:'next'});$('again').onclick=()=>location.replace('/defense.html');$('range').onclick=()=>{showRange=!showRange;$('range').textContent=showRange?'ẨN TẦM ĐÁNH':'TẦM ĐÁNH';};
for(const b of document.querySelectorAll('[data-panel]'))b.onclick=()=>{for(const other of document.querySelectorAll('[data-panel]'))other.classList.toggle('active',other===b);$('skills-panel').hidden=b.dataset.panel!=='skills';$('army-panel').hidden=b.dataset.panel!=='army';};
function statsMarkup(h){return [['Máu',h.classId==='paladin'?Math.round(h.hp*1.25):h.hp],['Công',h.classId==='fallen'?Math.round(h.power*(1+FALLEN.power)):h.power],['Giáp',h.armor+(h.classId==='paladin'?4:0)],['Tốc chạy',h.classId==='vanguard'?Math.round(h.speed*(1+VANGUARD.speedBonus)):h.speed],['Tầm đánh',h.range],['Đòn / giây',(1/h.cooldown).toFixed(1)]].map(([n,v])=>`<div class="stat">${n}<b>${v}</b></div>`).join('');}
function selectHero(id){
 hero=id;writeLocal('gct-hero',id);const h=heroById(id),c=CLASSES[h.classId];
 if($('selected-name'))$('selected-name').textContent=h.name+' · '+c.name;
 if($('hero-grid'))for(const card of $('hero-grid').children){card.classList.toggle('active',card.dataset.hero===id);card.setAttribute('aria-pressed',String(card.dataset.hero===id));}
 const gemHint={darkelf:'Ngọc Hỏa / Ngọc Gió',assassin:'Ngọc Hắc Ám / Ngọc Hỏa',guardian:'Ngọc Băng / Ngọc Độc',paladin:'Ngọc Băng / Ngọc Hắc Ám',fallen:'Ngọc Độc / Ngọc Hắc Ám',windblade:'Ngọc Gió (Cộng hưởng) / Ngọc Sấm',duelist:'Ngọc Gió / Ngọc Hắc Ám',ranger:'Ngọc Gió / Ngọc Sấm',berserker:'Ngọc Hắc Ám / Ngọc Hỏa',ravager:'Ngọc Hắc Ám (Cộng hưởng) / Ngọc Gió',vanguard:'Ngọc Độc / Ngọc Băng',pyromancer:'Ngọc Hỏa (Cộng hưởng) / Ngọc Độc',stormcaller:'Ngọc Sấm (Cộng hưởng) / Ngọc Gió',tidecaller:'Ngọc Băng (Cộng hưởng) / Ngọc Độc'}[h.classId]||'Tự do cả 6 Ngọc';
 if($('hero-detail'))$('hero-detail').innerHTML=`<div class="hero-preview-top"><div class="detail-title"><h3>${h.name}</h3><span>${c.name} · ${c.energy} năng lượng · Hồi ${c.regen}/giây</span></div><div class="stat-list">${statsMarkup(h)}</div></div><div class="hero-preview-passive"><b>Nội tại · ${PASSIVES[h.id].name}:</b> ${PASSIVES[h.id].text}<br><b>Tinh thông bậc 2:</b> ${c.passive.replace(/^Tinh thông bậc 2:\s*/i,'')}<br><b>Ngọc gợi ý (Phương án A):</b> ${gemHint}</div><div class="hero-preview-skills">${c.skills.map(id=>{const s=skillById(id);return `<div><b>${s.slot} · ${s.name}</b><p>${describeSkill(s,1,h.power)}</p><p>${s.slot==='Q'?'Có sẵn':`Mở ở cấp ${s.requiredLevel} · ${s.unlockCost} vàng`} · Ải 1–4: 3 bậc · Từ ải 5: Q/E 10, R 6</p></div>`;}).join('')}</div>`;
 if(myId&&state?.phase==='lobby')send({type:'hero',hero:id});
}
if($('hero-grid')){for(const h of HEROES){const b=document.createElement('button');b.className='hero-card';b.dataset.hero=h.id;b.innerHTML=`${REFRESH_HEROES[h.id]?'<span style="display:block;width:42px;height:62px;flex-shrink:0;background:url(/assets/heroes-v2/'+h.id+'.png) 0 0/600% 600%"></span>':['knight-2','knight-3','warrior-3','samurai','warrior-2','samurai-commander'].includes(h.id)?'<span style="display:block;width:42px;height:62px;flex-shrink:0;background:url(/assets/'+(h.id==='knight-2'?'knights-v2/holy-foot':h.id==='knight-3'?'knights-v2/dark-foot':h.id==='samurai-commander'?'blademaster/katana-forms':h.id==='warrior-2'?'ravager/hero-v2':h.id==='samurai'?'windblade/hero-v1':h.id==='warrior-3'?'vanguard/foot-v2':h.id==='knight-3'?'fallen/foot-v1':'paladin/foot')+'.png) 0 0/600% '+(h.id==='warrior-3'?'700':'600')+'%"></span>':'<img src="/assets/v2/'+h.id+'/portrait.png" alt="">'}<span><strong>${h.name}</strong><small>${CLASSES[h.classId].name}</small></span>`;b.onclick=()=>selectHero(h.id);$('hero-grid').append(b);}}selectHero(hero);
const hex=n=>'#'+n.toString(16).padStart(6,'0');
for(const m of MAPS){const card=document.createElement('div');card.className='map-card';card.dataset.stage=m.id;card.innerHTML=`<span class="map-tag">MỐC ${String(m.id).padStart(2,'0')}</span><svg viewBox="0 0 ${m.width} ${m.height}" aria-hidden="true"><rect width="${m.width}" height="${m.height}" fill="${hex(m.ground)}"/>${m.props.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="${p.radius+16}" fill="#273d2c" opacity=".7"/>`).join('')}${m.lanes.map(l=>`<polyline points="${l.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${hex(m.road)}" stroke-width="80"/>`).join('')}<rect x="${m.base.x-100}" y="${m.base.y-70}" width="200" height="130" fill="#d9c892"/></svg><h3>${m.name}</h3><p>${m.description}</p><small>${m.lanes.length} hướng · ${m.width} × ${m.height}</small>`;$('map-grid').append(card);}
for(const t of TROOPS.filter(t=>!t.summoned)){const div=document.createElement('div');div.className='shop-item';div.innerHTML=`<div class="description"><b>${t.name}</b><small>${t.description} · HP ${t.hp}</small></div><button data-buy="${t.id}">${t.cost} ◈</button>`;$('shop').append(div);}
for(const id of ['power','vitality','repair']){const b=document.createElement('button');b.className='upgrade secondary';b.dataset.buy=id;$('shop-upgrades').append(b);}
for(const b of document.querySelectorAll('[data-buy]'))b.onclick=()=>send({type:'buy',choice:b.dataset.buy});$('mastery').onclick=()=>send({type:'buy',choice:'mastery'});
function buildSkillbook(p){
 const formKey=p.classId+':'+!!p.dualSwords;if(bookClass===formKey)return;bookClass=formKey;$('skillbook').replaceChildren();$('hotbar').replaceChildren();
 for(const id of CLASSES[p.classId].skills){const s=displaySkill(skillById(id),p),card=document.createElement('div');card.className='skill-card';card.dataset.skill=id;card.innerHTML=`<h4>${s.slot} · ${s.name}<span class="rank"></span></h4><span class="skill-tag"></span><p class="description"></p><p class="requirement"></p><button></button>`;card.querySelector('button').onclick=()=>send({type:'buy',choice:'skill:'+id});$('skillbook').append(card);
  const hot=document.createElement('button');hot.className='hotkey';hot.dataset.cast=id;hot.innerHTML=`<b>${s.slot}</b><span>${s.name}<small></small></span>`;hot.onclick=()=>{held['spell'+s.slot]=true;setTimeout(()=>held['spell'+s.slot]=false,150);};$('hotbar').append(hot);
 }
}
const uiCache={};
function setText(id,val){if(uiCache[id]===val)return;uiCache[id]=val;$(id).textContent=val;}
function updateUI(m,p){
 updateInventory(p,m.phase);
 const map=MAPS[m.stage-1],h=p.stats,c=CLASSES[p.classId];
 setText('stage',`${m.stage} / 10`);setText('map-name',map.name+' · '+difficultyOf(m.difficulty).name);setText('wave',`ĐỢT ${m.wave} / 3${m.phase==='battle'?' · CÒN '+m.remaining:''}`);setText('gate',`${Math.ceil(m.gate)} / ${m.maxGate}`);setText('gold',String(Math.floor(p.gold)));setText('kills',`${p.kills} HẠ GỤC`);
 $('start').hidden=m.phase!=='lobby'||m.host!==myId;$('start').disabled=m.players.some(p=>p.assetsReady===false);setText('start',`▶ BẮT ĐẦU · ${m.players.length} NGƯỜI`);$('next').hidden=m.phase!=='clear'||m.host!==myId;$('again').hidden=!['victory','defeat'].includes(m.phase);
 setText('status',m.phase==='lobby'?`${m.players.length}/4 chỉ huy · Có thể bắt đầu một mình · Mã mời ${m.code}`:m.phase==='prepare'?`Đợt ${m.wave+1} bắt đầu sau ${m.timer}s · Mua kỹ năng hoặc thuê lính`:m.phase==='clear'?`ĐÃ GIỮ VỮNG MỐC ${m.stage}! ${m.host===myId?'Sẵn sàng sang chiến trường tiếp theo.':'Chờ chủ phòng sang mốc tiếp theo.'}`:m.phase==='victory'?'CHIẾN THẮNG CHIẾN DỊCH!':m.phase==='defeat'?'THẤT THỦ — Nhà đã bị phá. XP được giữ lại.':p.hp<=0?`Đang hồi sinh · ${Math.ceil(p.respawn)}s`:`Đợt ${m.wave}/3 · Còn ${m.remaining} quái · Q / E / R để thi triển`);
 const pStatHTML=`<strong>${h.name} · Cấp ${p.level}</strong><div>${c.name} · HP ${Math.ceil(p.hp)} / ${h.hp}${p.shield>0?` · Khiên ${Math.ceil(p.shield)}`:''}</div><div class="hp-track" style="position:relative"><div style="width:${Math.max(0,p.hp/Math.max(h.hp,p.hp+(p.shield||0))*100)}%"></div>${p.shield>0?`<span style="position:absolute;top:0;bottom:0;left:${p.hp/Math.max(h.hp,p.hp+p.shield)*100}%;width:${p.shield/Math.max(h.hp,p.hp+p.shield)*100}%;background:#c7d1db"></span>`:''}</div><div>Công <b>${h.power}</b> · Giáp <b>${h.armor}</b> · Tốc <b>${h.speed}</b></div><div>Tầm ${h.range} · ${(1/h.cooldown).toFixed(1)} đòn/s · XP ${p.xp}</div>`;
 if(uiCache.pStats!==pStatHTML){uiCache.pStats=pStatHTML;$('player-stats').innerHTML=pStatHTML;}
 setText('class-passive',PASSIVES[p.hero].name+': '+PASSIVES[p.hero].text+' '+c.passive);setText('energy-label',`NL ${Math.floor(p.energy)} / ${h.maxEnergy}`);
 const ePct=`${p.energy/h.maxEnergy*100}%`;if(uiCache.ePct!==ePct){uiCache.ePct=ePct;$('energy-fill').style.width=ePct;}
 const troopCnt=m.troops.filter(t=>!t.summoned).length;setText('troop-count',String(troopCnt));
 const canBuy=['lobby','prepare','battle','clear'].includes(m.phase),costs={power:80+p.upPower*30,vitality:80+p.upHP*30,repair:75};
 for(const b of document.querySelectorAll('[data-buy]')){const t=TROOPS.find(t=>t.id===b.dataset.buy),cost=t?.cost??costs[b.dataset.buy]??upgradePrice(p,b.dataset.buy);b.disabled=!canBuy||p.gold<cost||(t&&troopCnt>=12)||(b.dataset.buy==='repair'&&m.gate>=m.maxGate);if(!t)b.textContent=`${UPGRADES[b.dataset.buy]?(UPGRADES[b.dataset.buy].name+' · Bậc '+upgradeRank(p,b.dataset.buy)):{power:'Công +6',vitality:'Máu +40',repair:'Sửa nhà +300'}[b.dataset.buy]} · ${cost} ◈`;}
 buildSkillbook(p);
 for(const card of $('skillbook').children){const s=displaySkill(skillById(card.dataset.skill),p),rank=p.skills[s.id]||0,price=skillPrice(s,rank),cd=p.cooldowns[s.id]||0;
  card.querySelector('.rank').textContent=`${rank} / ${skillCap(s,m.stage)}`;card.querySelector('.description').textContent=describeSkill(s,rank,h.power);card.querySelector('.skill-tag').textContent=rank?`${cd>0?'Hồi '+cd.toFixed(1)+'s':'Sẵn sàng'} · Bậc ${rank}`:'CHƯA HỌC';
  const b=card.querySelector('button');b.disabled=!canBuy||rank>=skillCap(s,m.stage)||p.level<s.requiredLevel||p.gold<price;b.textContent=rank>=skillCap(s,m.stage)?'ĐÃ TỐI ĐA':`${rank?'Nâng bậc '+(rank+1):'Học kỹ năng'} · ${price} ◈`;
  card.querySelector('.requirement').textContent=p.level<s.requiredLevel?`Cần cấp ${s.requiredLevel}`:rank>=skillCap(s,m.stage)?'Sát thương / phạm vi tăng theo bậc':'Mỗi bậc tăng sức mạnh và giảm hồi chiêu';
 }
 for(const b of $('hotbar').children){const s=displaySkill(skillById(b.dataset.cast),p),rank=p.skills[s.id]||0,a=skillAtRank(s,rank),cd=p.cooldowns[s.id]||0;b.classList.toggle('locked',!rank);b.classList.toggle('cooldown',cd>0);b.disabled=p.martialLock>0||(p.classId==='vanguard'&&(p.vanguardPoseTime>0||s.id==='vanguard-giant'&&p.vanguardTime>0))||((p.holyMounted&&['holy-ascend','holy-aura'].includes(s.id))||(p.fallenMounted&&['fallen-doom','fallen-aura'].includes(s.id)))||!rank||p.hp<=0||!['battle','prepare'].includes(m.phase)||cd>0||p.energy<a.cost;b.querySelector('small').textContent=p.vanguardTime>0&&s.id==='vanguard-giant'?'Cự Nhân · '+Math.ceil(p.vanguardTime)+'s':p.fallenMounted&&s.id==='fallen-doom'?'Diệt Vong · Hao 6 NL/giây':p.fallenMounted&&s.id==='fallen-aura'?'Vực Máu · Aura tự động':p.holyMounted&&s.id==='holy-ascend'?'Thiên mã · Hao 6 NL/giây':p.holyMounted&&s.id==='holy-aura'?'Aura tự động · Hồi máu':!rank?`Chưa học · Cấp ${s.requiredLevel}`:cd>0?`Hồi ${cd.toFixed(1)}s`:`${a.cost} NL · Bậc ${rank}`;}
 const price=100+p.mastery*100;$('mastery').disabled=!canBuy||p.mastery>=3||p.gold<price;setText('mastery',`Tinh thông đòn thường ${p.mastery}/3${p.mastery<3?' · '+price+' ◈':' · Tối đa'}`);setText('mastery-description','Mỗi bậc +8% Công. Bậc 2 mở hiệu ứng nội tại của class trên đòn thường.');
 const teamSig=m.players.map(t=>`${t.id}:${t.name}:${t.hero}:${t.level}`).join('|');
 if(uiCache.teamSig!==teamSig){uiCache.teamSig=teamSig;$('team').replaceChildren();for(const t of m.players){const el=document.createElement('div');el.className='team-member';el.textContent=`${t.id===myId?'◆':'◇'} ${t.name} · ${heroById(t.hero).name} · Cấp ${t.level}`;$('team').append(el);}}
 const mapSig=`${m.stage}:${m.phase==='victory'}`;
 if(uiCache.mapSig!==mapSig){uiCache.mapSig=mapSig;for(const card of $('map-grid').children){const n=Number(card.dataset.stage);card.classList.toggle('current',n===m.stage);card.classList.toggle('done',n<m.stage||m.phase==='victory');}}
 if(m.players.some(player=>player.assetsReady===false)&&m.phase==='lobby')setText('status','Đang chờ chỉ huy tải xong chiến trường…');
 if(Date.now()>noticeUntil){$('notice').textContent='';$('error').textContent='';}updateCombatWindow(m,p,catalog);updateGemUI(m,p);updateStatusHUD(m,p);updateBattleNotice(m);document.querySelector('#arena>.toolbar').hidden=['battle','prepare'].includes(m.phase);
}
socket.onmessage=async({data})=>{
 const m=JSON.parse(data);if(m.type==='pong'){scene?.fpsHUD?.receive(m,performance.now());return;}if(m.error){notify(m.error);return;}
 if(m.type==='joined'&&m.resumed){myId=m.id;lastUIUpdate=-Infinity;movementTimeline.reset();for(const id of ['solo','create','join','start','next'])if($(id))$(id).disabled=false;$('connection').textContent='● ĐÃ KHÔI PHỤC KẾT NỐI';notify('Đã kết nối lại trận.');return;}
 if(m.type==='joined'){beginBattleLoading();document.body.classList.add('in-battle');myId=m.id;$('lobby').hidden=true;if($('selection'))$('selection').hidden=true;$('arena').hidden=false;$('room').textContent=m.code;$('arena').scrollIntoView({block:'start'});try{await catalogReady;await bakedPropsReady;optimizedAssets=await optimizedReady;assetHeroes=m.assetHeroes||null;initialMapStage=m.stage||state?.stage||1;if(!game)boot();}catch(e){notify('Không khởi tạo được hình ảnh: '+e.message);failBattleLoading('Không khởi tạo được hình ảnh. Hãy tải lại để thử lại.');}return;}
 if(m.type!=='state')return;battleDiagnostics.state(m);const old=state;state=m;const p=m.players.find(p=>p.id===myId);if(!p)return;const receivedAt=performance.now();stateReceivedAt=receivedAt;movementTimeline.push(m,receivedAt);if(receivedAt-lastUIUpdate>=200||old?.phase!==m.phase||old?.stage!==m.stage){lastUIUpdate=receivedAt;updateUI(m,p);}
 if(scene){if(currentMap!==m.stage)switchMap(scene,m.stage);for(const event of m.events)renderEvent(scene,event,seenEvents);}
 if(old?.phase!==m.phase&&['clear','defeat','victory'].includes(m.phase))history();
};
function switchMap(s,stage){if(mapSwitchJob)return;beginBattleLoading();mapSwitchJob=ensureMapBuildings(s,stage).then(()=>{if(state?.stage===stage){drawMap(s,MAPS[stage-1]);finishBattleLoading();}}).catch(e=>failBattleLoading(e.message)).finally(()=>{mapSwitchJob=null;});}
function drawMap(s,m){currentMap=m.id;for(const obj of entities.values())clearActorVFX(s,obj);clearVFX(s);s.cameras.main.stopFollow();s.followAnchor?.destroy();s.followAnchor=null;s.followSprite=null;renderMap(s,m,catalog,entities);s.cameras.main.setBounds(0,0,m.width,m.height);s.cameras.main.setZoom(1.04,.86);s.cameras.main.centerOn(m.base.x,m.base.y+100);releaseOldBuildings(s,m.id);if(m.id<10)ensureMapBuildings(s,m.id+1).catch(e=>console.warn('Map prefetch:',e.message));}
function boot(){
 game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:960,height:640,pixelArt:true,roundPixels:false,resolution:1,fps:{target:60},backgroundColor:'#344b2b',scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},scene:{
 preload(){this.mapAssetCatalog=catalog;this.mapPropAsset=unifiedPropAsset;this.mapBakedProps=bakedProps;installBattleAssetLoader(this,optimizedAssets,assetHeroes);if(assetHeroes)catalog={...catalog,actors:catalog.actors.filter(a=>!heroOwner(a.id)||assetHeroes.includes(heroOwner(a.id))),empoweredActors:(catalog.empoweredActors||[]).filter(a=>assetHeroes.includes(a.hero))};preloadBiomeArt(this);preloadEnemyAttacks(this);preloadHeroRefresh(this);preloadRavagerArt(this);preloadSlashArt(this);preloadMartialArt(this);preloadShadowArt(this);this.load.spritesheet('gem-poison-pool','/assets/gems/poison-pool.png',{frameWidth:543,frameHeight:724});preloadBossCasting(this,catalog);preloadEmpowered(this,catalog);this.failedAssets=[];this.load.on('progress',v=>updateBattleLoading(v));this.load.once('complete',()=>updateBattleLoading(1));this.load.image('bridge-atlas','/assets/v4/Bridges.png');this.mapAssetCatalog=catalog;this.mapPropAsset=unifiedPropAsset;preloadMapBuildings(this,initialMapStage);this.load.image('castle','/assets/v3/castle.png');for(const a of catalog.actors)for(const [action,info]of Object.entries(a.actions))if(!a.packed||action==='idle'){if(a.preciseAtlas)this.load.image(`${a.id}:${action}`,info.url);else this.load.spritesheet(`${a.id}:${action}`,info.url,{frameWidth:info.frameWidth||a.frame,frameHeight:info.frameHeight||a.frameHeight||a.frame});}for(const t of catalog.terrain)this.load.image(t.id,t.url);for(const fx of catalog.effects)this.load.spritesheet('fx:'+fx.id,fx.url,{frameWidth:fx.frame,frameHeight:fx.frame});for(const art of catalog.spellArt||[])this.load.image('art:'+art.id,art.url);this.load.on('loaderror',file=>{this.failedAssets.push(file.key);notify('Không tải được asset: '+file.key);failBattleLoading('Không tải được '+file.key+'. Hãy thử tải lại.');});},
 create(){
  this.fpsHUD=createPerformanceHUD(this,socket);this.actorInfoById=new Map(catalog.actors.map(a=>[a.id,a]));createEnemyAttacks(this);createHeroRefreshAnimations(this);createRavagerAnimations(this);createMartialAnimations(this);prepareClassArt(this,catalog);scene=this;this.game.events.once('postrender',()=>{if(this.failedAssets.length){failBattleLoading('Một số tài nguyên chưa tải được. Hãy thử tải lại.');return;}finishBattleLoading();send({type:'ready'});});if(new URLSearchParams(location.search).has('perf')){this.perfLabel=document.createElement('output');this.perfLabel.id='performance-readout';this.perfLabel.style.cssText='position:absolute;top:36px;left:5px;z-index:30;background:#102019dd;color:#d4debd;font:11px monospace;padding:5px;pointer-events:none';document.querySelector('.battlefield').append(this.perfLabel);this.perfFrames=[];}createBossCastingFrames(this,catalog);createEmpoweredAnimations(this,catalog);for(const a of catalog.actors)if(a.preciseAtlas){const texture=this.textures.get(`${a.id}:idle`);for(const info of Object.values(a.actions))for(const [i,rect]of info.frameRects.entries())texture.add((info.start||0)+i,0,rect.x,rect.y,rect.width,rect.height);}for(const a of catalog.actors)for(const [action,info]of Object.entries(a.actions))for(let row=0;row<(info.rows||1);row++)this.anims.create({key:`${a.id}:${action}${row?':'+row:''}`,frames:this.anims.generateFrameNumbers(`${a.id}:${a.packed?'idle':action}`,{start:(info.start||0)+row*info.frames,end:(info.start||0)+(row+1)*info.frames-1}),frameRate:action==='attack'?12:8,repeat:['attack','cast','dead','hurt'].includes(action)?0:-1});
  for(const fx of catalog.effects)this.anims.create({key:'fx:'+fx.id,frames:this.anims.generateFrameNumbers('fx:'+fx.id,{start:0,end:fx.frames-1}),frameRate:Math.max(14,fx.frames*1.7),repeat:0});
  this.actorObjects=entities;drawMap(this,MAPS[(state?.stage||1)-1]);this.bars=this.add.graphics().setDepth(3500);this.zones=this.add.graphics().setDepth(1);this.unitGlow=this.add.graphics().setDepth(20010);this.unitGround=this.add.graphics().setDepth(2);this.mini=this.add.graphics().setDepth(30000).setScrollFactor(0);
  this.input.keyboard.on('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();const changed=!held[e.code];held[e.code]=true;if(changed)sendInput();});this.input.keyboard.on('keyup',e=>{held[e.code]=false;sendInput();});this.input.on('pointermove',pointer=>{held.pointerAim=true;const p=state?.players.find(p=>p.id===myId);if(!p)return;const world=this.cameras.main.getWorldPoint(pointer.x,pointer.y),dx=world.x-p.x,dy=world.y-(p.y-20),len=Math.hypot(dx,dy);if(len>5){held.aimDistance=len;held.aimX=dx/len;held.aimY=dy/len;}});this.input.on('pointerdown',pointer=>{const map=MAPS[(state?.stage||1)-1],w=this.cameras.main.getWorldPoint(pointer.x,pointer.y);if(w.x>map.base.x-160&&w.x<map.base.x+160&&w.y>map.base.y-220&&w.y<map.base.y+100&&pointer.event?.ctrlKey){pointer.event.preventDefault();held.mouse=false;openCastle();return;}held.mouse=true;});this.input.on('pointerup',()=>held.mouse=false);this.input.on('gameout',()=>held.mouse=false);
 },
 update(time,dt){
  battleDiagnostics.frame();
  this.fpsHUD?.update(performance.now());if(!state||!this.bars||currentMap!==state.stage)return;const renderStart=performance.now();const live=new Set(),map=MAPS[state.stage-1],views=renderViews(this);let renderedUnits=0;this.bars.clear();this.zones.clear();this.unitGlow.clear();this.unitGround.clear();drawWindFields(this,state,time);
  if(held.pointerAim){const p=state.players.find(p=>p.id===myId),pointer=this.input.activePointer;if(p){const w=this.cameras.main.getWorldPoint(pointer.x,pointer.y),dx=w.x-p.x,dy=w.y-(p.y-20),len=Math.hypot(dx,dy);if(len>5){held.aimDistance=len;held.aimX=dx/len;held.aimY=dy/len;}}}
  drawShadowState(this,state,time);drawGemPools(this,state.poisonPools,time,state.fireCarpets);drawLoot(this,state.loot,time);drawHostileZones(this,state.hostileZones,time);
  for(const z of state.zones||[]){const color=z.fx.includes('fire')||z.fx==='explosion'?0xffaa69:z.fx.includes('water')?0x8cdeea:z.fx==='lightning'?0x8fcfff:0xc6e3a2;this.zones.fillStyle(color,.07).fillCircle(z.x,z.y,z.radius);this.zones.lineStyle(2,color,.4).strokeCircle(z.x,z.y,z.radius);}
  for(const u of [...state.players,...state.enemies,...state.troops]){
   live.add(u.id);const player=!!u.hero,troop=!!u.owner,actorId=player?(u.hero==='samurai'?'wind-swordsman':u.hero==='warrior-3'?(u.vanguardTime>0?'vanguard-giant':'vanguard-champion'):u.hero==='knight-3'?(u.fallenMounted?'fallen-mounted':'fallen-knight'):u.hero==='knight-2'?(u.holyMounted?'holy-mounted':'holy-paladin'):u.hero):u.sprite,info=this.actorInfoById.get(actorId);if(!info)continue;let obj=entities.get(u.id);
   if(!unitInView(views,u,myId)){if(obj)setRenderDormant(obj,true);continue;}
   const reentered=obj?.renderDormant;if(obj)setRenderDormant(obj,false);if(reentered){obj.motionSample=null;obj.predicted=null;obj.groundY=u.y;obj.lastHp=u.hp;obj.lastCastCount=u.castCount;obj.attackRestart=false;}
   if(obj&&obj.actor!==actorId){clearLeaderAuras(obj);clearActorVFX(this,obj);obj.sprite.destroy();obj.label.destroy();entities.delete(u.id);obj=null;}
   if(!obj){const size=player?(heroDisplayHeight(u)):troop?(u.type==='forest-spirit'?SHADOW.spirit.displaySize:38):(u.size||45)*(u.boss?1.6*BOSS_DISPLAY_SCALE:u.elite?1.25:1),sprite=this.add.sprite(u.x,u.y,`${actorId}:idle`).setOrigin(info.originX,info.originY).setScale(size/info.bodyHeight),label=this.add.text(u.x,u.y-size-15,'',{fontFamily:'Segoe UI',fontSize:'10px',color:player?'#fff0c8':troop?'#b4e9d0':'#ffd1b2',stroke:'#172017',strokeThickness:3}).setOrigin(.5).setDepth(3600);if(u.bossArt&&!u.animatedBoss&&this.textures.exists('art:'+u.bossArt)){sprite.setTexture('art:'+u.bossArt).setOrigin(.5,.94).setScale(140*BOSS_DISPLAY_SCALE/sprite.height);sprite.setTint(u.bossColor);}
 obj={sprite,label,actor:actorId,size:u.boss?115:size,groundY:u.y,bossArt:u.bossArt&&!u.animatedBoss};entities.set(u.id,obj);}
   renderedUnits++;if(player)obj.size=heroDisplayHeight(u,57,u.vanguardTime>0?Math.max(0,Math.min(1,(VANGUARD.giant.duration+Math.max(0,(u.skills?.['vanguard-giant']||1)-1)*VANGUARD.giant.durationStep-u.vanguardTime)/.65)):1);
   const s=obj.sprite,motionTarget=movementTimeline.target(u,performance.now()),walk=Math.hypot(s.x-u.x,obj.groundY-u.y)>1,renderY=motionTarget.y-guardianRHeight(u.guardianR,obj.size)-warriorLeapHeight(u.martialLeap)-(u.holyLeapTime>0?Math.sin(Math.PI*Math.max(0,Math.min(1,u.holyLeapTime/(u.holyLeapDuration||.28))))*(u.holyMounted?58:42):0)-(u.flying?(u.altitude||35)+Math.sin(time/140)*3:0)-(u.windLift||0)-(u.windAirTime>0?Math.sin(Math.PI*(1-u.windAirTime/(u.tideLiftDuration||.5)))*26:0);
   const motionBlend=1;obj.groundY=settlePosition(obj.groundY,motionTarget.y,motionBlend);if(reentered||u.guardianR||(u.hero==='warrior-1'&&(u.martialLeap||u.martialPose==='leap'))||Math.hypot(s.x-u.x,s.y-renderY)>250){s.x=u.x;s.y=renderY;}else{s.x=settlePosition(s.x,motionTarget.x,motionBlend);s.y=settlePosition(s.y,renderY,motionBlend);}
   const depth=Math.round(obj.groundY)+(u.flying?1500:0);if(s.depth!==depth)s.setDepth(depth);s.setFlipX((info.directions||1)===1&&u.face<0).setAlpha(player&&u.hp<=0?.25:u.buffs?.some(b=>b.time>0&&b.stealth)?.38:1);if((troop&&u.sprite?.startsWith('soldier-')||u.forestLeader||['fallen','vanguard','ravager','darkelf','assassin','guardian','ranger','pyromancer','stormcaller','tidecaller','berserker'].includes(u.classId))&&obj.lastHp!==undefined&&u.hp<obj.lastHp)obj.hurtUntil=time+180;obj.lastHp=u.hp;if(u.castCount!==obj.lastCastCount){obj.lastCastCount=u.castCount;if(u.castAnim>0)obj.attackRestart=true;}const anim=actorAction(u,obj,(u.moving||walk)||u.flying,time,info),action=u.classId==='windblade'&&u.windAction?(u.windAction.kind==='dash'?'dash':u.windAction.time>WIND.r.leap?'cast':'leap'):u.classId==='windblade'&&u.windLanding>0?'attack':u.classId==='windblade'&&u.windCast>0?'cast':u.classId==='vanguard'&&u.vanguardPoseTime>0&&info.actions[u.vanguardPose]?u.vanguardPose:['paladin','fallen'].includes(u.classId)&&u.castAnim>0?(u.classId==='paladin'&&u.holyQStep===1?'attack':'cast'):(troop&&u.sprite?.startsWith('soldier-')||u.forestLeader||['fallen','vanguard','ravager','darkelf','assassin','guardian','ranger','pyromancer','stormcaller','tidecaller','berserker'].includes(u.classId))&&time<(obj.hurtUntil||0)&&anim!=='attack'?'hurt':info.actions[anim]?anim:'idle',resolved=resolveActorAnimation(info,action,u.direction),actionInfo=resolved?.metadata,row=resolved?.row||0;if(!resolved)continue;if(u.stun>0||u.gemStun>0||u.windAirTime>0){s.anims.pause();}else s.anims.resume();if((!u.bossArt||u.animatedBoss)&&!(u.stun>0||u.gemStun>0||u.windAirTime>0)){if(!playMartialActor(this,u,obj,action)&&!playBossCasting(this,u,obj,catalog)&&!playEnemyAttack(this,u,obj,action)&&!playEmpowered(this,u,obj,action,catalog)){s.setOrigin(actionInfo.originX??info.originX,actionInfo.originY??info.originY).setScale(obj.size/(actionInfo.bodyHeight||info.bodyHeight));const key=`${actorId}:${resolved.name}${row?':'+row:''}`;if(action==='flurry'&&u.vanguardThrust!==obj.vanguardThrust){obj.vanguardThrust=u.vanguardThrust;s.play(key,false);}else if(obj.attackRestart&&action==='attack'){s.play(key,false);obj.attackRestart=false;}else if(action!=='attack'||s.anims.currentAnim?.key!==key)s.play(key,true);const pivot=actionInfo.framePivots?.[Number(s.frame.name)-(actionInfo.start||0)];if(pivot)s.setOrigin(pivot.x,pivot.y);s.anims.timeScale=action==='attack'?(actionInfo.frames||1)/Math.max(.12,(obj.attackDuration||300)/1000)/12:action==='cast'&&['fallen','paladin'].includes(u.classId)?actionInfo.frames/Math.max(.12,(obj.attackDuration||550)/1000)/8:action==='flurry'?actionInfo.frames/Math.max(.07,u.vanguardThrustInterval||.14)/8:u.classId==='windblade'&&['cast','dash','leap'].includes(action)?actionInfo.frames/(action==='dash'?WIND.q.duration:action==='cast'?WIND.r.charge:WIND.r.leap)/8:action==='charge'?1.5:action==='walk'?1.25:1;}}else if(u.bossArt&&!u.animatedBoss)s.setScale((140*BOSS_DISPLAY_SCALE/s.height)*(1+Math.sin(time/210)*.018));s.clearTint();if(u.bossColor&&!u.animatedBoss)s.setTint(u.bossColor);if(u.elite&&!u.boss)s.setTint(0xffcf9a);if(u.summoned)s.setTint(0xb6e4d9);if(u.stun>0)s.setTint(0xc4dfff);else if(u.statuses?.poison)s.setTint(0xb2dc86);else if(u.statuses?.burn)s.setTint(0xffb37c);if(!player&&!troop&&action==='idle')s.anims.timeScale=.5;unitVFX(this,u,obj,time);drawClassIdentity(this,u,obj,time);drawHolyAura(this,u,obj,time);drawFallenState(this,u,obj,time);drawVanguardState(this,u,obj,time);drawWindState(this,u,obj,time);if(player)drawLeaderAuras(this,u,obj,time);gemWeaponVFX(this,u,obj,time);gemTargetVFX(this,u,obj,time);
   const labelText=player?`${u.name}${u.id===myId?' ◆':''} · ${u.level}`:u.type==='forest-spirit'?'Tinh linh ánh trăng · '+Math.ceil(u.lifetime)+'s':u.boss?u.name:u.neutral?(u.animal?'THÚ RỪNG':'QUÁI RỪNG')+' · '+u.reward+' vàng':u.elite?'TINH ANH':'';if(obj.labelText!==labelText){obj.labelText=labelText;obj.label.setText(labelText);}obj.label.setPosition(s.x,s.y-obj.size-15);
   const max=player?u.stats.hp:u.maxHp,y=s.y-obj.size-5;this.bars.fillStyle(0x15221b).fillRect(s.x-18,y,36,4);this.bars.fillStyle(player?0xc8d895:troop?0x84cfbf:0xda8c6a).fillRect(s.x-18,y,36*Math.max(0,u.hp)/Math.max(max,u.hp+(u.shield||0)),4);if(u.shield>0){const total=Math.max(max,u.hp+u.shield);this.bars.fillStyle(0xc7d1db).fillRect(s.x-18+36*Math.max(0,u.hp)/total,y,36*u.shield/total,4);}
   if(player&&u.id===myId){followGround(this,obj);if(u.hp>0){this.bars.lineStyle(1,0xe9daa6,.7).strokeEllipse(s.x,s.y+1,28,11);if(showRange)this.bars.lineStyle(1,0xffe5ab,.25).strokeCircle(s.x,s.y,u.stats.range);}}
   if(u.classId!=='guardian'&&(u.guard||u.shield>0)&&u.hp>0)this.bars.lineStyle(u.shield>0?3:2,u.classId==='guardian'?0xffdc94:0x9dd6ff,.6).strokeCircle(s.x,s.y-24,31);
  }
  for(const [id,obj]of entities)if(!live.has(id)){clearLeaderAuras(obj);clearActorVFX(this,obj);obj.label.destroy();const info=this.actorInfoById.get(obj.actor);if(info?.actions.dead&&!obj.bossArt){const dead=info.actions.dead,troopDeath=playTroopActor(this,{sprite:obj.actor,hp:0},obj,'dead');if(!troopDeath)obj.sprite.setOrigin(dead.originX??info.originX,dead.originY??info.originY).setScale(obj.size/(dead.bodyHeight||info.bodyHeight));obj.sprite.anims.timeScale=1;if(!troopDeath)obj.sprite.play(`${obj.actor}:dead`);this.tweens.add({targets:obj.sprite,alpha:0,duration:650,onComplete:()=>obj.sprite.destroy()});}else obj.sprite.destroy();entities.delete(id);}
  this.bars.fillStyle(0x142019).fillRect(map.base.x-90,map.base.y+60,180,10);this.bars.fillStyle(0xd6bd7e).fillRect(map.base.x-88,map.base.y+62,176*state.gate/state.maxGate,6);updateVFX(this,dt/1000);updateScenery(this,time);if(time-(this.lastMiniMap||-1000)>=200){this.lastMiniMap=time;drawMiniMap(this,state,map);}if(this.perfLabel){this.perfFrames.push({dt,cpu:performance.now()-renderStart});if(this.perfFrames.length>180)this.perfFrames.shift();if(time-(this.lastPerf||0)>1000){this.lastPerf=time;const list=this.perfFrames,n=list.length,mean=list.reduce((v,f)=>v+f.dt,0)/n,cpu=list.reduce((v,f)=>v+f.cpu,0)/n;this.perfLabel.textContent='FPS '+(1000/mean).toFixed(1)+' · Render '+cpu.toFixed(2)+'ms · Entities '+entities.size+' · VFX '+(this.liveVFX?.length||0)+' · FX detail '+Math.round((this.secondaryFXRatio??1)*100)+'% · Heap '+(performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576)+'MB':'n/a');}}
 }
 }});
}
function sendInput(){if(!myId)return;const x=Number(!!(held.KeyD||held.ArrowRight||held.right))-Number(!!(held.KeyA||held.ArrowLeft||held.left)),y=Number(!!(held.KeyS||held.ArrowDown||held.down))-Number(!!(held.KeyW||held.ArrowUp||held.up)),p=state?.players.find(p=>p.id===myId),facing=[[0,1],[0,-1],[-1,0],[1,0]][p?.direction]||[p?.face||1,0];let aimX=x||y?x:facing[0],aimY=x||y?y:facing[1];if(held.pointerAim&&Number.isFinite(held.aimX)&&Number.isFinite(held.aimY)){aimX=held.aimX;aimY=held.aimY;}const length=Math.hypot(aimX,aimY)||1;send({type:'input',aimDistance:held.pointerAim?held.aimDistance:undefined,aimX:aimX/length,aimY:aimY/length,x,y,attack:!!(held.KeyJ||held.mouse||held.attack),guard:!!(held.Space||held.KeyK||held.guard),q:!!(held.KeyQ||held.spellQ),e:!!(held.KeyE||held.spellE),r:!!(held.KeyR||held.spellR)});}
setInterval(sendInput,50);
window.addEventListener('blur',()=>{for(const k in held)held[k]=false;sendInput();});for(const b of document.querySelectorAll('[data-key]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held[b.dataset.key]=true;sendInput();};for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{held[b.dataset.key]=false;sendInput();});}
async function history(){try{const rows=await fetch('/api/history').then(r=>r.json());$('history').replaceChildren();if(!rows.length)$('history').textContent='Chưa có trận hoàn tất.';for(const row of rows){const div=document.createElement('div');div.className='record';for(const value of [row.result==='victory'?'⚑ THẮNG CHIẾN DỊCH':row.result==='clear'?'⚑ VƯỢT MỐC':'THẤT THỦ',`Mốc ${row.stage||1} · ${difficultyOf(row.difficulty).name} · Phòng ${row.room}`,`${row.players} người · ${row.kills} hạ gục`,row.ended_at+' UTC']){const span=document.createElement('span');span.textContent=value;div.append(span);}$('history').append(div);}}catch{$('history').textContent='Chưa tải được lịch sử.';}}
$('refresh').onclick=history;history();





initCombatWindow(send);initGemUI(send);initBattleControls();

const difficultySelect=$('difficulty');for(const [id,d]of Object.entries(DIFFICULTIES)){const o=document.createElement('option');o.value=id;o.textContent=d.name;difficultySelect.append(o);}difficultySelect.value=readLocal('gct-difficulty','easy');if(!DIFFICULTIES[difficultySelect.value])difficultySelect.value='easy';function showDifficulty(){ $('difficulty-note').textContent=difficultyOf(difficultySelect.value).text;writeLocal('gct-difficulty',difficultySelect.value);}difficultySelect.onchange=showDifficulty;showDifficulty();

