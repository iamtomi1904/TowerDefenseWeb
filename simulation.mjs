import {tickMartial} from './martial-actions.mjs';
import {tickTide,tideReduction} from './tide-actions.mjs';
import {UPGRADES,upgradePrice,hiredStats} from './public/progression.js';
import {coneHits,segmentHits} from './public/combat-geometry.js';
import {WIND,windReduction} from './public/wind-config.js';
import {tickWind,windBasicHit} from './wind-actions.mjs';
import {VANGUARD,vanguardReduction} from './public/vanguard-config.js';
import {castVanguard,tickVanguardState,tickVanguardActions,endVanguard,spearTargets} from './vanguard-actions.mjs';
import {FALLEN} from './public/fallen-config.js';
import {tickFallen,endFallenForm,fallenBasicHit} from './fallen-actions.mjs';
import {PALADIN} from './public/paladin-config.js';
import {tickPaladins,endHolyForm} from './paladin-actions.mjs';
import {terrainModifiers,biomeAt,BIOMES,LEADER_BLESSINGS,BLESSING_DURATION} from './public/world-biomes.js';
import {scaleForestLeaders} from './forest-leaders.mjs';
import {FOREST_LEADER_RULES} from './public/forest-leaders.js';
import {SHADOW,BOSS_COOP} from './public/shadow-config.js';
import {tickShadow,tickSpirit} from './shadow-actions.mjs';
import {ATTACK_TIMING} from './public/actor-animation.js';
import {tickAssassinActions} from './assassin-actions.mjs';
import {GEM_RULES as GC,gemById,gemAllowed,equippedGem,gemStats,gemTier,gemUpgradeCost,gemTotalCost,nearCastle} from './public/gems.js';
import {gemArmorDamage,armorMultiplier,gemHit,gemKill,tickGemPlayer,tickGemTarget,tickPoisonPools,carryGems} from './gem-effects.mjs';
import {difficultyOf,difficultyId} from './public/difficulty.js';
import {enemyFamily} from './public/enemy-visuals.js';
import {dropForestLoot,tickLoot,useConsumable} from './loot.mjs';
import {healing,passiveUpkeep,passiveKill,passiveHit,passiveTakeDamage,passivePose} from './passives.mjs';
import {randomUUID} from 'node:crypto';
import {HEROES,MONSTERS,TROOPS,MAPS,WORLD,heroById} from './public/content.js';
import {CLASSES} from './public/skills.js';
import {initializeSkills,buySkill,buff,upkeep,cast,tickZones,tickStatuses,applyStatus,tickSkillChannels} from './abilities.mjs';
import {forestPopulation,bossDefinition,bossTick,tickHostileZones} from './encounters.mjs';
import {navigate} from './navigation.mjs';
import {launch,launchAimed,advanceProjectiles,canHitAir,shotStyle} from './projectiles.mjs';
export {HEROES,MONSTERS,TROOPS,MAPS,useConsumable};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createRoom(code,difficulty='easy'){return {code,difficulty:difficultyId(difficulty),phase:'lobby',stage:1,wave:0,gate:1400,maxGate:1400,players:[],loot:[],hostileZones:[],enemies:[],troops:[],zones:[],projectiles:[],events:[],kills:0,timer:0,spawn:0,spawnCd:0,peak:0,elapsed:0,recorded:false};}
export function stats(p){
 const h=heroById(p.hero),c=CLASSES[h.classId],lv=Math.max(0,(p.level||1)-1),hpLv=h.classId==='guardian'?40:['berserker','ravager','vanguard'].includes(h.classId)?36:h.classId==='tidecaller'?34:['ranger','darkelf'].includes(h.classId)?22:32,powLv=h.classId==='guardian'?2:h.classId==='assassin'?4.5:['ranger','darkelf','pyromancer'].includes(h.classId)?4:h.classId==='stormcaller'?3.5:h.classId==='duelist'?3.2:3,armLv=h.classId==='guardian'?Math.floor(lv*.75):h.classId==='paladin'?Math.floor(lv/2.5):['ranger','darkelf'].includes(h.classId)?Math.floor(lv/12):['pyromancer','stormcaller'].includes(h.classId)?Math.floor(lv/4.5):h.classId==='ravager'?Math.floor(lv/3.8):Math.floor(lv/3),hasteLv=h.classId==='windblade'?lv*.02:['ranger','darkelf'].includes(h.classId)?lv*.015:0,spdLv=['ranger','darkelf'].includes(h.classId)?lv*2.5:0;
 const maxHp=Math.round((h.hp+lv*hpLv+p.upHP*40+gemStats(p).hp)*(p.classId==='vanguard'&&p.vanguardTime>0?VANGUARD.giant.hp:p.classId==='paladin'?(p.holyMounted?PALADIN.mountedHP:PALADIN.hp):1));
 const hpPct=p.hp>0?p.hp/Math.max(1,maxHp):1;p._hpPct=hpPct;
 const warMult=p.hero==='warrior-1'?(p.warStacks||0)*(p.mastery>=2?.1:.05):0;
 const rageLow50=p.hero==='warrior-2'&&p.hp>0&&hpPct<.5,rageLow15=rageLow50&&p.mastery>=2&&hpPct<.15;
 const ragePow=rageLow15?.7:rageLow50?.35:0,rageHaste=rageLow15?.7:rageLow50?.35:0,rageSpd=rageLow15?.3:0;
 const vanStacks=p.hero==='warrior-3'&&p.hp>0?Math.min(4,Math.floor(Math.max(0,1-hpPct)/.15)):0;
 const duelPow=p.hero==='samurai-commander'?(!p.dualSwords?.2+(p.duelStacks||0)*.005:0)+(p.duelSwapTime>0?.15:0):0;
 const duelHaste=p.hero==='samurai-commander'?(p.dualSwords?.3+(p.duelStacks||0)*.01:0)+(p.duelSwapTime>0?.15:0):0;
 const focusHaste=p.hero==='samurai-archer'?(p.focusStacks||0)*.04:0;
 const moonRange=p.hero==='dark-elf'&&(p.moonStacks||0)>=8?100:0,moonHaste=p.hero==='dark-elf'&&(p.moonStacks||0)>=8?.2:0;
 const windPassSpd=p.hero==='samurai'?(p.windPassiveStacks||0)*.05:0,windPassHaste=p.hero==='samurai'?(p.windPassiveStacks||0)*.05:0;
 const baseSpeed=Math.round((h.speed+spdLv)*(p.classId==='vanguard'?1+VANGUARD.speedBonus:1)*(p.fallenMounted?FALLEN.mountedSpeed:p.holyMounted?PALADIN.mountedSpeed:1)*(1+gemStats(p).speed+windPassSpd+rageSpd+(p.buffs?buff(p,'speed'):0)+(p.classId==='windblade'?(p.windBladeStacks||0)*WIND.passive.speed+(p.windGuard>0?WIND.e.speed:0):0)+(p.windFieldBuff?WIND.r.speed:0)));
 const windBonusPower=p.hero==='samurai'?Math.round(Math.max(0,baseSpeed-h.speed)*.1):0;
 const guardArmMult=p.hero==='knight-1'?1+(p.guardArmorStacks||0)*.05:1;
 const rawArmor=((p.forestStats?.armor||0)+h.armor+(p.upArmor||0)*UPGRADES.armor.amount+gemStats(p).armor+armLv+(p.buffs?buff(p,'armor'):0)+(p.classId==='paladin'?(p.holyMounted?PALADIN.mountedArmor:PALADIN.armor):0)+(p.holyAura?.armor||0)+(p.classId==='vanguard'&&p.vanguardTime>0?VANGUARD.giant.armor:0))*guardArmMult*(p.environment?.armor||1);
 return {...h,hp:maxHp,range:(p.classId==='vanguard'&&p.vanguardTime>0?VANGUARD.giant.range:p.fallenMounted?FALLEN.mountedRange:p.holyMounted?PALADIN.mountedRange:h.range)+gemStats(p).range+moonRange,power:Math.round((h.power+lv*powLv+p.upPower*6+gemStats(p).power+(p.forestStats?.power||0)+windBonusPower)*(1+(p.mastery||0)*.08)*(1+(p.buffs?buff(p,'powerMultiplier'):0)+(p.fallenAura?.power||0)+(p.windFieldBuff?WIND.r.power:0)+warMult+ragePow+duelPow)*(p.classId==='vanguard'&&p.vanguardTime>0?1+VANGUARD.giant.power:1)*(p.classId==='fallen'?1+(p.fallenMounted?FALLEN.mountedPower:FALLEN.power):1)),healthRegen:p.forestStats?.healthRegen||0,armor:rageLow15?rawArmor*.2:rawArmor,maxEnergy:c.energy,regen:c.regen+(p.forestStats?.manaRegen||0),cooldown:h.cooldown/(1+hasteLv+(p.upHaste||0)*UPGRADES.haste.amount+gemStats(p).haste+(p.forestStats?.haste||0)+(p.buffs?buff(p,'haste'):0)+(p.fallenAura?.haste||0)+warMult+rageHaste+vanStacks*.05+duelHaste+focusHaste+moonHaste+windPassHaste+(p.classId==='windblade'?(p.windBladeStacks||0)*WIND.passive.haste:0)+(p.windFieldBuff?WIND.r.haste:0))/(p.environment?.attackSpeed||1),speed:baseSpeed};
}
export function addPlayer(r,{id=randomUUID(),name='Kỵ sĩ',hero='knight-1',token,assetsReady=true}={}){
 const p={id,token,assetsReady,name:String(name).slice(0,18),hero:heroById(hero).id,xp:0,level:1,upHP:0,upPower:0,upArmor:0,upHaste:0,troopUpgrades:{power:0,armor:0,hp:0},gold:120,kills:0,earned:0,guard:false,cd:0,anim:0,skillCd:0,respawn:0,input:{},x:0,y:0,face:1};
 p.forestStats={};p.forestRelics={};p.inventory={};p.itemCooldown=0;initializeSkills(p,heroById(p.hero).classId);p.hp=stats(p).hp;const b=MAPS[r.stage-1].base;p.x=b.x-45+r.players.length*30;p.y=b.y+140;r.players.push(p);r.peak=Math.max(r.peak,r.players.length);return p;
}
export function start(r){if(r.phase!=='lobby'||!r.players.length||r.players.some(p=>p.assetsReady===false))return false;r.phase='prepare';r.timer=5;return true;}
function grantXP(p,amount){const old=p.level;p.xp+=amount;p.level=Math.min(20,1+Math.floor(Math.sqrt(p.xp/40)));if(p.level>old)p.hp=Math.min(stats(p).hp,p.hp+(p.level-old)*22);}
export function buy(r,p,choice){
 if(!['lobby','prepare','battle','clear'].includes(r.phase))return 'Không thể mua lúc này.';
 if(typeof choice==='string'&&choice.startsWith('skill:'))return buySkill(p,choice.slice(6),r.stage);
 if(typeof choice==='string'&&choice.startsWith('gem:')){const id=choice.slice(4),g=gemById(id);if(!g)return 'Ngọc không hợp lệ.';if(!nearCastle(r,p,MAPS[r.stage-1]))return 'Hãy đến gần cổng thành để mua.';if(p.gem)return 'Mỗi nhân vật chỉ sở hữu 1 ngọc; bán ngọc cũ trước.';if(!gemAllowed(p,id))return 'Ngọc không phù hợp class.';if(p.gold<GC.price)return 'Không đủ vàng.';p.gold-=GC.price;p.gem=id;p.gemTier=1;p.gemEquipped=true;return null;}
 if(choice==='upgrade-gem'){if(!nearCastle(r,p,MAPS[r.stage-1]))return 'Hãy đến gần cổng thành để nâng cấp.';if(!p.gem)return 'Chưa có ngọc để nâng cấp.';const tier=gemTier(p),cost=gemUpgradeCost(p);if(!cost||tier>=GC.maxTier)return 'Ngọc đã đạt bậc tối đa.';if(p.gold<cost)return 'Không đủ vàng.';p.gold-=cost;p.gemTier=tier+1;return null;}
 if(choice==='sell-gem'){if(!nearCastle(r,p,MAPS[r.stage-1]))return 'Hãy đến gần cổng thành để bán.';if(!p.gem)return 'Không có ngọc để bán.';p.gold+=Math.floor(gemTotalCost(gemTier(p))*GC.sellRatio);p.gem=null;p.gemTier=1;p.gemEquipped=false;p.windStacks=0;p.windPermanent=0;p.thunderStacks=0;p.darkBossHits=0;p.darkSpawnCount=0;p.hp=Math.min(p.hp,stats(p).hp);return null;}
 if(choice==='equip-gem'||choice==='unequip-gem'){if(!p.gem||!gemAllowed(p,p.gem))return 'Không thể trang bị ngọc.';if(p.hp<=0)return 'Không thể đổi trang bị khi đang hồi sinh.';p.gemEquipped=choice==='equip-gem';p.hp=Math.min(p.hp,stats(p).hp);return null;}
 const type=TROOPS.find(t=>t.id===choice&&!t.summoned);
 if((type||choice==='repair'||UPGRADES[choice]?.troop)&&!nearCastle(r,p,MAPS[r.stage-1]))return 'Hãy đến gần cổng thành để mua.';
 let cost=type?.cost??upgradePrice(p,choice);
 if(choice==='power')cost=80+p.upPower*30;
 if(choice==='vitality')cost=80+p.upHP*30;
 if(choice==='repair')cost=75;
 if(choice==='mastery'){if(p.mastery>=3)return 'Tinh thông đã đạt bậc tối đa.';cost=100+p.mastery*100;}
 if(!Number.isFinite(cost))return 'Vật phẩm không hợp lệ.';
 if(type&&r.troops.filter(t=>!t.summoned&&t.hp>0).length>=12)return 'Đã đủ 12 lính trong đội.';
 if(choice==='repair'&&r.gate>=r.maxGate)return 'Nhà đang đầy máu.';
 if(p.gold<cost)return 'Không đủ vàng.';
 p.gold-=cost;
 if(type){const b=MAPS[r.stage-1].base;const offset=r.troops.length;const t={id:randomUUID(),owner:p.id,type:type.id,sprite:type.sprite,x:b.x+(offset%5-2)*34,y:b.y+130+Math.floor(offset/5)*24,hp:type.hp,maxHp:type.hp,cd:0,anim:0,face:1};Object.assign(t,hiredStats(type,p));t.hp=t.maxHp;r.troops.push(t);}
 else if(UPGRADES[choice]){const u=UPGRADES[choice];if(u.troop){p.troopUpgrades||={power:0,armor:0,hp:0};p.troopUpgrades[u.field]++;for(const t of r.troops.filter(t=>t.owner===p.id&&!t.summoned&&t.hp>0)){const def=TROOPS.find(d=>d.id===t.type);if(!def)continue;const old=t.maxHp;Object.assign(t,hiredStats(def,p));t.hp=Math.min(t.maxHp,t.hp+t.maxHp-old);}}else p[u.field]=(p[u.field]||0)+1;}
 else if(choice==='power')p.upPower++;
 else if(choice==='vitality'){p.upHP++;p.hp=Math.min(stats(p).hp,p.hp+40);}
 else if(choice==='mastery')p.mastery++;
 else r.gate=Math.min(r.maxGate,r.gate+300);
 return null;
}
export function nextStage(r){
 if(r.phase!=='clear'||r.stage>=10)return false;
 r.stage++;r.wave=0;r.phase='prepare';r.timer=8;r.recorded=false;r.gate=Math.min(r.maxGate,r.gate+250);
 const b=MAPS[r.stage-1].base;
 for(const [i,p]of r.players.entries()){if(p.holyMounted)endHolyForm(p,{stats});if(p.fallenMounted)endFallenForm(p,{});if(p.vanguardTime>0)endVanguard(p,{stats});p.vanguardPose=null;p.vanguardPoseTime=0;p.dashing=false;p.fallenAuraTime=0;p.fallenAura=null;p.fallenTarget=null;carryGems(p);p.x=b.x-45+i*30;p.y=b.y+140;p.hp=stats(p).hp;p.energy=stats(p).maxEnergy;p.cooldowns={};p.buffs=(p.buffs||[]).filter(b=>b.leaderBlessing&&b.time>0);p.shield=0;p.respawn=0;p.bossSlow=0;p.poisonTime=0;p.bossBurn=0;p.input={};p.gold+=45;}
 r.skillChannels=[];r.martialActions=[];r.tideFields=[];r.tideWaves=[];r.shadowDashes=[];r.shadowZones=[];for(const p of r.players)p.dashing=false;r.pendingMelee=[];r.combatActions=[];r.poisonPools=[];r.troops=r.troops.filter(t=>!t.summoned);r.zones=[];r.projectiles=[];r.loot=[];r.hostileZones=[];r.enemies=[];r.forestReady=false;
 for(const [i,t]of r.troops.entries()){t.x=b.x+(i%5-2)*34;t.y=b.y+130+Math.floor(i/5)*24;t.hp=t.maxHp;}
 return true;
}
export function canStand(map,x,y,radius=12){
 if(x<18||x>(map.width||WORLD.width)-18||y<35||y>(map.height||WORLD.height)-18)return false;
 if(BIOMES[biomeAt(map,{x,y})?.type]?.blocked)return false;
 // Only the house footprint is solid, leaving its southern gate accessible.
 if(x>map.base.x-145-radius&&x<map.base.x+145+radius&&y>map.base.y-205-radius&&y<map.base.y+45+radius)return false;
 if((map.fortifications||[]).some(o=>Math.hypot(x-o.x,y-o.y)<o.radius+radius))return false;
 return !map.props.some(o=>o.radius>0&&Math.hypot(x-o.x,y-o.y)<o.radius+radius);
}
function move(u,tx,ty,speed,dt,map){
 const dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy);if(d<.1)return;
 speed*=terrainModifiers(map,u).speed;const step=Math.min(d,speed*dt),nx=u.x+dx/d*step,ny=u.y+dy/d*step;u.face=dx<-.1?-1:dx>.1?1:u.face;
 u.direction=Math.abs(dx)>Math.abs(dy)?dx<0?2:3:dy<0?1:0;
 if(canStand(map,nx,ny)){u.x=nx;u.y=ny;return;}
 if(canStand(map,nx,u.y))u.x=nx;
 if(canStand(map,u.x,ny))u.y=ny;
}
const moveAI=(u,x,y,speed,dt,map)=>{
 if(u.flying){const dx=x-u.x,dy=y-u.y,d=Math.hypot(dx,dy)||1,step=Math.min(d,speed*terrainModifiers(map,u).speed*dt);u.x=clamp(u.x+dx/d*step,20,(map.width||WORLD.width)-20);u.y=clamp(u.y+dy/d*step,30,(map.height||WORLD.height)-20);u.face=dx<0?-1:1;u.direction=Math.abs(dx)>Math.abs(dy)?dx<0?2:3:dy<0?1:0;return;}
 navigate(u,x,y,speed,dt,map,move,canStand);
};
function strike(r,attacker,target,power,color,range){
 attacker.anim=.28;
 if(!attacker.hero)attacker.attackCount=(attacker.attackCount||0)+1;
 if(range>100){launch(r,attacker,target,()=>{strikeDamage(r,attacker,target,power);if(target.reward!==undefined)kill(r,target,attacker);if(attacker.hero&&stats(attacker).splash)for(const e of r.enemies)if(e!==target&&e.hp>0&&distance(target,e)<stats(attacker).splash){e.hp=Math.max(0,e.hp-power*.6);kill(r,e,attacker);}r.events.push({id:randomUUID(),type:'impact',family:enemyFamily(attacker),forestLeader:attacker.forestLeader,element:attacker.attackFx,fx:shotStyle(attacker).fx,x:target.x,y:target.y-18-(target.altitude||0),radius:20,color:shotStyle(attacker).color});});return;}
 const fx=attacker.attackFx==='earth'?'ground-spikes':CLASSES[attacker.classId]?.basicFx||'wind';
 r.events.push({id:randomUUID(),type:'effect',family:enemyFamily(attacker),element:attacker.attackFx,sourceX:attacker.x,sourceY:attacker.y,fx,x:(attacker.x+target.x)/2,y:(attacker.y+target.y)/2-20,tx:target.x,ty:target.y-18,size:95,color});
 strikeDamage(r,attacker,target,power);
}
function strikeDamage(r,attacker,target,power){
 if(target.neutral){target.aggro=8;target.threat={x:attacker.x,y:attacker.y};}
 if(attacker.hero==='dark-elf'){const d=distance(attacker,target);if(d>=180)power*=1+.15+Math.min(1,Math.max(0,(d-180)/120))*.2;}
 if(!attacker.hero&&attacker.fallenAura){power*=1+attacker.fallenAura.power;if(target.statuses?.bleed?.time>0)power*=1+attacker.fallenAura.woundedBonus;}power*=terrainModifiers(MAPS[r.stage-1],attacker).power;
 if(attacker.vanguardWeakenTime>0)power*=.9;
 let damage=attacker.hero&&target.reward!==undefined?gemArmorDamage(attacker,target,power):power;if(target.shield>0){const absorbed=Math.min(damage,target.shield);target.shield-=absorbed;damage-=absorbed;}
 const guardWaveDR=target.hero&&target.guardWaveTime>0?.1:0;
 const vanMissDR=target.hero==='warrior-3'?Math.min(4,Math.floor(Math.max(0,1-(target._hpPct??1))/.15))*.01:0;
 const rageVuln=target.hero==='warrior-2'&&target.mastery>=2&&(target._hpPct??1)<.15?1.1:1;
 damage*=(1-(target.holyAura?.reduction||0))*(1-vanguardReduction(target))*(1-windReduction(target))*(1-tideReduction(r,target))*(1-guardWaveDR)*(1-vanMissDR)*rageVuln;
 const actual=Math.min(target.hp,damage);target.hp=Math.max(0,target.hp-damage);if(target.classId==='vanguard'&&actual>stats(target).hp*.08)r.events.push({id:randomUUID(),type:'vanguard-vfx',action:'guard',x:target.x,y:target.y,radius:30});
 if(target.classId==='windblade'&&target.windGuard>0&&actual>0)r.events.push({id:randomUUID(),type:'wind-vfx',action:'guard',sourceId:target.id,x:target.x,y:target.y,radius:30});
 if(target.hero)passiveTakeDamage(r,target,attacker,actual,stats,applyStatus);
 if(target.reward!==undefined)fallenBasicHit(r,attacker,target,power,{status:applyStatus,fx:event=>r.events.push({id:randomUUID(),...event}),damage:(e,n,p)=>{if(e.hp<=0)return;let damage=gemArmorDamage(p,e,n);const absorbed=Math.min(e.shield||0,damage);e.shield=Math.max(0,(e.shield||0)-absorbed);damage-=absorbed;e.hp=Math.max(0,e.hp-damage);kill(r,e,p);}});
 if(attacker.special==='drain'){healing(r,attacker,actual*.35*(1-(attacker.gemHealCut||0)),attacker.maxHp,target);r.events.push({id:randomUUID(),type:'drain',x:target.x,y:target.y-20,tx:attacker.x,ty:attacker.y-20,color:0xd96a93});}
 if(attacker.special==='venom'&&target.hero){target.poisonTime=3;target.poisonClock=1;}
 if(attacker.hero){const poison=attacker.buffs?.find(b=>b.poisonArrows&&b.time>0);if(poison)applyStatus(target,{poison:poison.poison,slow:poison.poisonSlow,statusDuration:poison.poisonDuration},attacker,power);if(target.reward!==undefined)gemHit(r,attacker,target,actual,'basic',{damage:(e,n,p)=>{e.hp=Math.max(0,e.hp-gemArmorDamage(p,e,n));kill(r,e,p);}},r.random||Math.random);attacker.energy=Math.min(stats(attacker).maxEnergy,attacker.energy+2);const berserkerDark=attacker.hero==='warrior-2'&&equippedGem(attacker)?.id==='dark'&&attacker.hp>0&&attacker.hp<stats(attacker).hp*.4?GC.dark.berserkerBonusLifesteal:0;const warSteal=attacker.hero==='warrior-1'?(attacker.warStacks||0)*.03:0;const rageSteal=attacker.hero==='warrior-2'&&attacker.hp>0&&(attacker._hpPct??1)<.5?(attacker.mastery>=2&&(attacker._hpPct??1)<.15?.3:.15):0;const steal=gemStats(attacker).lifesteal+berserkerDark+warSteal+rageSteal+buff(attacker,'lifesteal')+(attacker.classId==='vanguard'?.1:0);if(steal){const healed=healing(r,attacker,actual*steal,stats(attacker).hp,target);if(attacker.classId==='vanguard'&&healed>0)r.events.push({id:randomUUID(),type:'vanguard-vfx',action:'drain',x:target.x,y:target.y,tx:attacker.x,ty:attacker.y-20});}
  windBasicHit(r,attacker,target,power,{fx:event=>r.events.push({id:randomUUID(),...event}),damage:(e,n,p)=>{e.hp=Math.max(0,e.hp-gemArmorDamage(p,e,n));kill(r,e,p);}});if(target.reward!==undefined)passiveHit(r,attacker,target,power,stats,applyStatus,kill,'basic');
 }
}
function kill(r,e,killer){
 if(e.dead||e.hp>0)return;e.dead=true;r.kills++;if(e.forestLeader)r.events.push({id:randomUUID(),type:'forest-leader-death',sprite:e.sprite,x:e.x,y:e.y,size:e.size*1.6*1.5});
 const owner=r.players.find(p=>p.id===(killer.owner||killer.id))||r.players[0];if(!owner)return;
 gemKill(r,e,owner,!killer.owner);dropForestLoot(r,e,owner);owner.kills++;if(!killer.owner)passiveKill(r,owner,e,stats);
 if(e.forestLeader){const def=LEADER_BLESSINGS[e.forestLeader];for(const [index,p]of r.players.entries()){const amount=Math.floor(e.reward/r.players.length)+(index<e.reward%r.players.length?1:0);p.gold+=amount;p.earned+=amount;grantXP(p,p===owner?12:5);p.buffs=p.buffs.filter(b=>b.leaderBlessing!==e.forestLeader);p.buffs.push({...def,time:BLESSING_DURATION,leaderBlessing:e.forestLeader});r.events.push({id:randomUUID(),type:'gold',x:p.x,y:p.y-50,amount});}return;}
 for(const p of r.players){const amount=p===owner?e.reward:Math.ceil(e.reward*.25);p.gold+=amount;p.earned+=amount;grantXP(p,p===owner?12:5);}
 r.events.push({id:randomUUID(),type:'gold',x:e.x,y:e.y-30,amount:e.reward,color:0xf3d57d});
 if(e.flying||e.special)r.events.push({id:randomUUID(),type:'enemy-death',fx:e.flying?'poison':'smoke',x:e.x,y:e.y-(e.altitude||0)-15,radius:e.flying?25:38,color:e.special==='drain'?0xd990c4:e.special==='venom'?0xb0d873:0xbac7a4});
}
export function spawnEnemy(r,random=Math.random,portal=true){
 const map=MAPS[r.stage-1],pool=MONSTERS.filter(m=>m.unlock<=r.stage);
 let definition=pool[Math.floor(random()*pool.length)];
 const boss=r.spawn===1;
 if(boss)definition={...MONSTERS.find(m=>m.id==='orc-berserk'),hp:90+r.stage*10,power:10+r.stage*2,speed:48+r.stage,range:60,cooldown:1.5};
 const elite=boss||(r.stage>=3&&r.wave===3&&r.spawn===1);
 const laneIndex=(r.spawn+r.wave)%map.lanes.length,lane=map.lanes[laneIndex];
 const hp=Math.round(definition.hp*difficultyOf(r.difficulty).health*map.healthScale*(1+(r.wave-1)*.1)*(1+(r.players.length-1)*(boss?BOSS_COOP.healthPerExtraPlayer:.18))*(boss?(r.wave===3?5:2.8):elite?2.3:1));
 const e={...definition,id:randomUUID(),sprite:definition.id,x:lane[0][0],y:lane[0][1],hp,maxHp:hp,power:Math.round(definition.power*difficultyOf(r.difficulty).damage*map.damageScale*(boss?1.6:elite?1.2:1)),speed:definition.speed*map.speedScale,reward:definition.reward*(boss?12:elite?3:1),lane:laneIndex,waypoint:1,elite,boss,cd:.5,healCd:4,anim:0,face:1};
 if(boss){Object.assign(e,bossDefinition(r.stage,r.wave));e.armor=(GC.armor.bossBase+(r.stage-1)*GC.armor.bossPerStage)*(GC.armor[r.difficulty]||1);}
 if(e.flying){e.x=clamp(e.x+(random()-.5)*180,25,(map.width||WORLD.width)-25);e.y=clamp(e.y+(random()-.5)*90,35,(map.height||WORLD.height)-25);}
 r.enemies.push(e);if(portal)r.events.push({id:randomUUID(),type:'enemy-summon',x:e.x,y:e.y,family:enemyFamily(e),boss:e.boss,sourceId:e.id});return e;
}
export function tick(r,dt=.05,random=Math.random){
 r.events=[];r.random=random;r.elapsed+=dt;const map=MAPS[r.stage-1];
 const ctx={stats,id:randomUUID,fx:event=>r.events.push({id:randomUUID(),...event}),damage:(e,n,p)=>{if(e.hp<=0)return;if(e.neutral){e.aggro=8;e.threat={x:p.x,y:p.y};}const absorbed=Math.min(e.shield||0,n);e.shield=Math.max(0,(e.shield||0)-absorbed);e.hp=Math.max(0,e.hp-(n-absorbed));},move:(p,x,y,max)=>{const from={x:p.x,y:p.y};for(let step=0;step<max;step+=8){const d=distance(p,{x,y});if(d<.01)break;const length=Math.min(8,max-step,d),nx=p.x+(x-p.x)/d*length,ny=p.y+(y-p.y)/d*length;if(!canStand(map,nx,ny))break;p.x=nx;p.y=ny;}p.face=p.x<from.x?-1:1;}};
 const rawDamage=ctx.damage,finishDamage=(e,n,p)=>{if(e.hp<=0)return;rawDamage(e,n,p);kill(r,e,p);};ctx.damage=(e,n,p,kind='skill',options={})=>{if(e.hp<=0)return;const dmgIn=p?.hero==='warrior-2'&&kind==='skill'?n*1.2:n;const actual=gemArmorDamage(p,e,dmgIn,options),before=e.hp;rawDamage(e,actual,p);if(kind!=='summon'&&kind!=='dot'&&gemStats(p).lifesteal)healing(r,p,Math.min(before,actual)*gemStats(p).lifesteal,stats(p).hp,e);if(kind!=='dot')gemHit(r,p,e,actual,kind,{damage:(a,d,owner)=>finishDamage(a,gemArmorDamage(owner,a,d),owner)},random);if(p?.hero&&e.reward!==undefined&&kind==='skill')passiveHit(r,p,e,actual,stats,applyStatus,kill,'skill');kill(r,e,kind==='summon'?{owner:p.id}:p);};
 ctx.moveUnit=(u,x,y,speed,dt)=>moveAI(u,x,y,speed*(u.bossSlow>0?(u.bossSlowFactor??.5):1),dt,map);ctx.launchAimed=(p,aim,range,hit,options)=>launchAimed(r,p,aim,range,hit,(x,y)=>canStand(map,x,y,2),options);
 ctx.clearLine=(a,b)=>{const d=distance(a,b)||1;for(let step=8;step<d;step+=8)if(!canStand(map,a.x+(b.x-a.x)/d*step,a.y+(b.y-a.y)/d*step,2))return false;return true;};
 ctx.heal=(u,n,max,from)=>healing(r,u,n,max,from);ctx.status=applyStatus;
 ctx.summon=(boss,index,family)=>{const count=r.spawn;r.spawn=2;const minion=spawnEnemy(r,()=>{const pool=MONSTERS.filter(m=>m.unlock<=r.stage),index=pool.findIndex(m=>m.id==='mob-'+family);return index<0?0:(index+.1)/pool.length;},false);r.spawn=count;minion.x=boss.x+(index-1)*35;minion.y=boss.y+35;minion.lane=boss.lane;minion.waypoint=boss.waypoint;r.events.push({id:randomUUID(),type:'enemy-summon',x:minion.x,y:minion.y,family:enemyFamily(minion),sourceId:minion.id});};
 ctx.launch=(p,target,onHit,options)=>launch(r,p,target,onHit,options);
 if(!r.forestReady&&r.phase==='prepare'){forestPopulation(r,map,canStand);r.forestReady=true;}
 if(r.phase==='prepare'){
  r.timer-=dt;if(r.timer<=0){r.wave++;r.phase='battle';r.spawn=Math.ceil((map.spawnCount+r.wave*2+(r.players.length-1)*4)*difficultyOf(r.difficulty).count);r.spawnCd=0;for(const p of r.players){p.hp=stats(p).hp;p.respawn=0;}for(const t of r.troops)t.hp=Math.min(t.maxHp,t.hp+40);}
 }
 if(!['battle','prepare','lobby','clear'].includes(r.phase))return;
 const combatActive=['battle','prepare'].includes(r.phase);if(combatActive){scaleForestLeaders(r);for(const u of [...r.players,...r.troops,...r.enemies]){if(u.hp<=0)continue;const env=terrainModifiers(map,u);if(!env.burn){u.terrainBurnClock=0;continue;}u.terrainBurnClock=(u.terrainBurnClock||0)+dt;while(u.terrainBurnClock>=1&&u.hp>0){u.terrainBurnClock-=1;const max=u.hero?stats(u).hp:u.maxHp;u.hp=Math.max(0,u.hp-max*env.burn*(1-vanguardReduction(u))*(1-windReduction(u))*(1-tideReduction(r,u)));r.events.push({id:randomUUID(),type:'dot',x:u.x,y:u.y-35,text:'−'+Math.ceil(max*env.burn)+' CHÁY',color:0xffa36b});}}}
 if(combatActive)advanceProjectiles(r,dt);
 tickMartial(r,dt,ctx,combatActive);tickSkillChannels(r,dt,ctx,combatActive);tickTide(r,dt,ctx,combatActive);tickWind(r,dt,ctx,combatActive);tickVanguardState(r,dt,ctx,combatActive);tickPaladins(r,dt,ctx);tickFallen(r,dt,ctx,combatActive);
 for(const p of r.players){
  p.environment=terrainModifiers(map,p);
  p.cd=Math.max(0,p.cd-dt);p.skillCd=Math.max(0,p.skillCd-dt);p.anim=Math.max(0,p.anim-dt);p.castAnim=Math.max(0,(p.castAnim||0)-dt);
  upkeep(p,dt);if(p.hp>0&&buff(p,'leaderRegen'))p.hp=Math.min(stats(p).hp,p.hp+stats(p).hp*buff(p,'leaderRegen')*dt);tickGemPlayer(p,dt);if(combatActive)passiveUpkeep(r,p,dt,stats,kill);p.bossSlow=Math.max(0,(p.bossSlow||0)-dt);
  if(p.bossBurn>0&&p.hp>0){p.bossBurn-=dt;p.bossBurnClock-=dt;if(p.bossBurnClock<=0){p.bossBurnClock=1;const n=Math.min(p.hp,(p.bossBurnDamage||4)*(1-vanguardReduction(p))*(1-windReduction(p))*(1-tideReduction(r,p)));p.hp-=n;r.events.push({id:randomUUID(),type:'dot',x:p.x,y:p.y-55,text:'−'+n+' CHÁY',color:0xffad73});if(p.hp<=0)p.respawn=8;}}
  if(p.poisonTime>0&&p.hp>0){p.poisonTime-=dt;p.poisonClock-=dt;if(p.poisonClock<=0){p.poisonClock=1;p.hp=Math.max(0,p.hp-3*(1-vanguardReduction(p))*(1-windReduction(p))*(1-tideReduction(r,p)));r.events.push({id:randomUUID(),type:'dot',x:p.x,y:p.y-55,text:'−3 ĐỘC',color:0xb1d983});if(p.hp<=0)p.respawn=8;}}
  if(p.hp<=0){p.respawn-=dt;if(p.respawn<=0){p.hp=stats(p).hp;p.energy=stats(p).maxEnergy;p.x=map.base.x;p.y=map.base.y+140;}else continue;}
  const s=stats(p),i=p.input;p.guard=!!i.guard;
  const x=clamp(Number(i.x)||0,-1,1),y=clamp(Number(i.y)||0,-1,1),len=Math.max(1,Math.hypot(x,y));
  const beforeMove={x:p.x,y:p.y};if(!(p.martialLock>0)&&!p.dashing&&p.vanguardPose!=='flurry')move(p,p.x+x/len*20,p.y+y/len*20,s.speed*(p.guard?.45:1)*(p.bossSlow>0?(p.bossSlowFactor??.5):1),dt,map);p.moving=Math.hypot(p.x-beforeMove.x,p.y-beforeMove.y)>.01;if(p.classId==='windblade')p.windFieldBuff=(r.windFields||[]).some(z=>z.owner===p.id&&z.time>0&&distance(z,p)<=z.radius);
  if(!combatActive)continue;
  if(i.skill||i.q)cast(r,p,'Q',ctx);else{p.holyQLock=0;p.fallenQLock=0;}
  if(i.e)cast(r,p,'E',ctx);
  if(i.r)cast(r,p,'R',ctx);
  if(i.attack&&!(p.martialLock>0)&&p.cd<=0&&!p.dashing&&!(p.classId==='vanguard'&&p.vanguardPoseTime>0)){
   const attackPower=s.power*(buff(p,'stealth')||1);if(buff(p,'stealth'))p.buffs=p.buffs.filter(b=>!b.stealth);
   const ax=Number.isFinite(i.aimX)?clamp(i.aimX,-1,1):p.face||1,ay=Number.isFinite(i.aimY)?clamp(i.aimY,-1,1):0,len=Math.hypot(ax,ay)||1,aim=Math.hypot(ax,ay)<.001?{x:p.face||1,y:0}:{x:ax/len,y:ay/len};
   p.face=aim.x<0?-1:1;p.direction=Math.abs(aim.x)>Math.abs(aim.y)?aim.x<0?2:3:aim.y<0?1:0;p.cd=s.cooldown;p.attackCount++;p.anim=.28;
   if(p.mastery>=2){if(p.hero==='warrior-2'&&p.hp<s.hp*.15)passivePose(r,p,'ravager');if(p.hero==='warrior-1'&&p.warStacks>=5)passivePose(r,p,'berserker');if(p.hero==='knight-1'&&p.attackCount%3===0)passivePose(r,p,'guardian');}

   const gemMelee=!!equippedGem(p)&&(s.range<=100||p.classId==='vanguard')&&!p.holyMounted&&!p.fallenMounted;
   const groundInReach=gemMelee&&r.enemies.some(e=>e.hp>0&&!e.flying&&coneHits(p,e,aim,s.range)&&ctx.clearLine(p,e));
   const rayEnd={x:p.x+aim.x*GC.airRange,y:p.y+aim.y*GC.airRange};
   const airInAim=gemMelee&&!groundInReach&&r.enemies.some(e=>e.hp>0&&e.flying&&segmentHits(e,p,rayEnd,GC.airAimWidth)&&ctx.clearLine(p,e));
   if(equippedGem(p)?.id==='wind'&&gemTier(p)>=3&&(p.windStacks||0)>=GC.wind.maxStacks&&p.attackCount%GC.wind.pierceEvery===0){const end={x:p.x+aim.x*GC.wind.pierceRange,y:p.y+aim.y*GC.wind.pierceRange};const hit=r.enemies.filter(e=>e.hp>0&&segmentHits(e,p,end,24)).sort((a,b)=>distance(p,a)-distance(p,b)).slice(0,GC.wind.pierceTargets);for(const e of hit){const d=gemArmorDamage(p,e,attackPower*GC.wind.piercePct);e.hp=Math.max(0,e.hp-d);kill(r,e,p);}r.events.push({id:randomUUID(),type:'wind-vfx',action:'slash',x:p.x+aim.x*50,y:p.y-20+aim.y*50,angle:Math.atan2(aim.y,aim.x),radius:GC.wind.pierceRange*.6,color:equippedGem(p).color});}
   if(airInAim){launchAimed(r,p,aim,GC.airRange,target=>{strikeDamage(r,p,target,attackPower);kill(r,target,p);},()=>true,{filter:e=>!!e.flying,speed:GC.projectileSpeed,width:GC.projectileWidth,color:equippedGem(p)?.color});}
   else if(p.classId==='vanguard'){r.events.push({id:randomUUID(),type:'vanguard-vfx',action:'thrust',sourceId:p.id,x:p.x,y:p.y,angle:Math.atan2(aim.y,aim.x),radius:s.range,giant:p.vanguardTime>0});const attackStage=r.stage,resolve=()=>{if(r.stage!==attackStage||p.hp<=0||p.classId!=='vanguard')return;for(const e of spearTargets(r,p,aim,s.range,p.vanguardTime>0?VANGUARD.giant.width:VANGUARD.basic.width,ctx)){strikeDamage(r,p,e,attackPower);kill(r,e,p);r.events.push({id:randomUUID(),type:'vanguard-vfx',action:'impact',x:e.x,y:e.y,radius:p.vanguardTime>0?40:22});}};r.pendingMelee||=[];r.pendingMelee.push({owner:p.id,delay:s.cooldown*VANGUARD.basic.windupFraction,resolve});}
   else if(s.range>100&&!p.holyMounted&&!p.fallenMounted)launchAimed(r,p,aim,s.range+70,target=>{strikeDamage(r,p,target,attackPower);kill(r,target,p);if(p.classId==='darkelf'&&p.mastery>=2){const other=r.enemies.find(e=>e!==target&&e.hp>0&&distance(e,target)<150);if(other)launch(r,p,other,()=>{other.hp=Math.max(0,other.hp-gemArmorDamage(p,other,s.power*SHADOW.elf.masteryArrow));kill(r,other,p);},{projectileType:'moon-arrow',color:0xaabede});}if(s.splash)for(const e of r.enemies)if(e!==target&&e.hp>0&&distance(target,e)<s.splash){e.hp=Math.max(0,e.hp-attackPower*.6);kill(r,e,p);}r.events.push({id:randomUUID(),type:'impact',...shotStyle(p),x:target.x,y:target.y-20,radius:25});},(x,y)=>canStand(map,x,y,2));
   else {r.events.push({id:randomUUID(),type:p.classId==='windblade'?'wind-vfx':p.classId==='fallen'?'fallen-vfx':p.classId==='paladin'?'holy-vfx':p.classId==='assassin'?'shadow-vfx':'melee-swing',action:p.classId==='windblade'?'slash':['fallen','paladin'].includes(p.classId)?'strike':'dagger',mounted:!!(p.holyMounted||p.fallenMounted),sourceId:p.id,dual:!!p.dualSwords,x:p.x,y:p.y-20,angle:Math.atan2(aim.y,aim.x),radius:s.range,color:p.classId==='berserker'?0xffb275:0xe5e6b3});
    const resolveMelee=()=>{if(p.hp<=0)return;for(const e of r.enemies)if(e.hp>0&&(!equippedGem(p)||!e.flying||p.holyMounted||p.fallenMounted)&&canHitAir(e,s.range)){const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);if(coneHits(p,e,aim,s.range)){strikeDamage(r,p,e,attackPower);kill(r,e,p);}}};if(ATTACK_TIMING[p.classId]||p.classId==='guardian'&&p.mastery>=2&&p.attackCount%3===0){r.pendingMelee||=[];r.pendingMelee.push({delay:p.classId==='guardian'?Math.max(.22,s.cooldown*.5):s.cooldown*ATTACK_TIMING[p.classId].windupFraction,resolve:resolveMelee});}else resolveMelee();
   }
  }
 }
 if(combatActive){const pending=[];for(const a of r.pendingMelee||[]){a.delay-=dt;if(a.delay<=0)a.resolve();else pending.push(a);}r.pendingMelee=pending;}
 for(const t of r.troops)if(t.summoned){t.lifetime-=dt;if(t.lifetime<=0)t.hp=0;}r.troops=r.troops.filter(t=>t.hp>0);
 tickLoot(r,dt,stats);
 if(!combatActive){for(const e of r.enemies)if(e.hp>0)tickGemTarget(r,e,dt,{damage:finishDamage});tickPoisonPools(r,dt,{damage:finishDamage});r.enemies=r.enemies.filter(e=>e.hp>0);return;}
 tickVanguardActions(r,dt,ctx);tickShadow(r,dt,ctx);tickAssassinActions(r,dt,ctx);tickPoisonPools(r,dt,{damage:finishDamage});tickZones(r,dt,ctx);tickHostileZones(r,dt,{fx:ctx.fx,stats,canStand:(x,y)=>canStand(map,x,y)});
 r.spawnCd-=dt;
 if(r.phase==='battle'&&r.spawn>0&&r.spawnCd<=0){spawnEnemy(r,random);r.spawn--;r.spawnCd=Math.max(.35,1.05-r.stage*.045);}
 for(const t of r.troops){
  if(t.type==='forest-spirit'&&t.hp>0){tickSpirit(r,t,dt,ctx);continue;}
  t.bossSlow=Math.max(0,(t.bossSlow||0)-dt);t.cd=Math.max(0,t.cd-dt*terrainModifiers(map,t).attackSpeed*(1+(t.fallenAura?.haste||0)));t.anim=Math.max(0,t.anim-dt);if(t.hp<=0)continue;const def=TROOPS.find(d=>d.id===t.type);
  const target=r.enemies.filter(e=>e.hp>0&&canHitAir(e,def.range)&&!e.neutral&&distance(e,map.base)<420).sort((a,b)=>distance(t,a)-distance(t,b))[0];
  if(def.healer){const patient=[...r.players,...r.troops].filter(a=>a.hp>0&&a.hp<(a.hero?stats(a).hp:a.maxHp)&&distance(t,a)<180).sort((a,b)=>a.hp-b.hp)[0];if(patient&&t.cd<=0){t.cd=2;healing(r,patient,22,patient.hero?stats(patient).hp:patient.maxHp);r.events.push({id:randomUUID(),type:'aura',x:patient.x,y:patient.y-20,radius:45,size:90,color:0x9deab4,fx:'water-spell'});continue;}}
  if(target){if(distance(t,target)>def.range-5)moveAI(t,target.x,target.y,def.speed*(t.bossSlow>0?(t.bossSlowFactor??.5):1),dt,map);else if(t.cd<=0){t.cd=def.cooldown;const boost=r.troops.some(a=>a.type==='captain'&&a.hp>0&&distance(t,a)<160)?1.1:1;strike(r,t,target,(t.power??def.power)*boost,0x9ce6d6,def.range);kill(r,target,t);}}
  else {const slot=r.troops.indexOf(t);moveAI(t,map.base.x+(slot%5-2)*34,map.base.y+130+Math.floor(slot/5)*24,def.speed*(t.bossSlow>0?(t.bossSlowFactor??.5):1),dt,map);}
 }
 for(const e of r.enemies){
  if(e.hp<=0||r.phase==='prepare'&&!e.neutral)continue;tickGemTarget(r,e,dt,{damage:finishDamage});tickStatuses(r,e,dt,{...ctx,damage:finishDamage});if(e.hp<=0)continue;e.environment=terrainModifiers(map,e);e.cd-=dt*(1-(e.gemSlow||0))*e.environment.attackSpeed;e.anim=Math.max(0,e.anim-dt);if(e.stun>0||e.gemStun>0||e.windAirTime>0){e.skillPose=null;continue;}
  if(e.neutral){if(e.forestLeader){const threatened=r.players.some(p=>p.hp>0&&!buff(p,'stealth')&&distance(p,e)<(e.aggro>0?(e.leash||FOREST_LEADER_RULES.leash):FOREST_LEADER_RULES.aggro));if(threatened&&distance(e,e.home)<(e.leash||FOREST_LEADER_RULES.leash)){bossTick(r,e,dt,{fx:ctx.fx,stats,canStand:(x,y)=>canStand(map,x,y)});if(e.bossCast||e.skillPose?.time>0){e.anim=.3;continue;}}else{e.bossCast=null;e.skillPose=null;}}const threat=r.players.filter(p=>p.hp>0&&!buff(p,'stealth')&&distance(p,e)<(e.forestLeader&&e.aggro>0?e.leash:200)).sort((a,b)=>distance(a,e)-distance(b,e))[0];e.aggro=Math.max(0,(e.aggro||0)-dt);if(e.animal){if((e.aggro>0||threat&&distance(threat,e)<90)&&threat){const dx=e.x-threat.x,dy=e.y-threat.y,d=Math.hypot(dx,dy)||1;moveAI(e,clamp(e.x+dx/d*80,40,(map.width||WORLD.width)-40),clamp(e.y+dy/d*80,50,(map.height||WORLD.height)-40),e.speed*(1-Math.max(e.slow||0,e.gemSlow||0)),dt,map);}else if(distance(e,e.home)>45)moveAI(e,e.home.x,e.home.y,e.speed*.5,dt,map);}else if(threat&&(e.aggro>0||distance(threat,e)<110)&&distance(e,e.home)<(e.forestLeader?e.leash:280)){if(distance(e,threat)>e.range)moveAI(e,threat.x,threat.y,e.speed*(1-Math.max(e.slow||0,e.gemSlow||0)),dt,map);else if(e.cd<=0){e.cd=e.cooldown;strike(r,e,threat,Math.max(2,e.power-stats(threat).armor)*(1-(e.gemDamageReduce||0)),0xf0bd83,e.range);}}else if(distance(e,e.home)>15){moveAI(e,e.home.x,e.home.y,e.speed*(1-Math.max(e.slow||0,e.gemSlow||0)),dt,map);e.hp=Math.min(e.maxHp,e.hp+dt*6*(1-(e.gemHealCut||0)));}continue;}
  bossTick(r,e,dt,{fx:ctx.fx,summon:ctx.summon,stats,canStand:(x,y)=>canStand(map,x,y)});if(e.bossCast||e.skillPose?.time>0){e.anim=.2;continue;}
  if(e.healer){e.healCd-=dt;if(e.healCd<=0){e.healCd=4;for(const other of r.enemies)if(other.hp>0&&distance(e,other)<150)healing(r,other,25*(1-(other.gemHealCut||0)),other.maxHp);r.events.push({id:randomUUID(),type:'heal',x:e.x,y:e.y,color:0x95e49a});}}
  const targets=[...r.players,...r.troops].filter(p=>p.hp>0&&!(p.hero&&buff(p,'stealth'))&&distance(p,e)<(e.range>100?e.range+20:135));
  const target=targets.sort((a,b)=>distance(e,a)-distance(e,b))[0];
  if(e.flying)e.altitude=e.range>100?40:distance(e,target||{x:map.base.x,y:map.base.y+110})<85?9:36;
  if(e.windup){e.windup.remaining-=dt;if(e.windup.remaining<=0){const victim=[...r.players,...r.troops].find(t=>t.id===e.windup.target);if(victim?.hp>0&&distance(victim,e)<e.range+45){const armor=victim.hero?stats(victim).armor:(victim.armor??TROOPS.find(t=>t.id===victim.type)?.armor??0);strike(r,e,victim,Math.max(2,e.power-armor)*(victim.guard?.3:1)*(1-(e.gemDamageReduce||0)),0xf18f76,e.range);r.events.push({id:randomUUID(),type:'impact',family:enemyFamily(e),element:e.attackFx,fx:e.attackFx==='earth'?'ground-spikes':'poison',x:victim.x,y:victim.y,radius:e.special==='slam'?95:45,color:e.special==='drain'?0xdc86ae:0xd8bb89});}e.windup=null;}continue;}
  if(e.special==='charge'&&target&&distance(e,target)>50&&distance(e,target)<240&&e.cd<=0){e.charge=1;e.cd=6;r.events.push({id:randomUUID(),type:'warning',x:target.x,y:target.y,radius:45,duration:.6,color:0xe9b782});}
  if(e.charge>0)e.charge=Math.max(0,e.charge-dt);
  if(target){
   if(distance(e,target)>e.range)moveAI(e,target.x,target.y,e.speed*(e.charge>0?2.6:1)*(1-Math.max(e.slow||0,e.gemSlow||0)),dt,map);
   else if(e.cd<=0){e.cd=e.cooldown;if(['slam','drain','dive'].includes(e.special)){e.windup={target:target.id,remaining:.4};r.events.push({id:randomUUID(),type:'warning',x:target.x,y:target.y,radius:e.special==='slam'?90:35,duration:.4,color:e.special==='drain'?0xdd91bc:0xe6b68b});continue;}const armor=target.hero?stats(target).armor:(target.armor??TROOPS.find(t=>t.id===target.type)?.armor??0);const damage=Math.max(1,e.power*armorMultiplier(armor))*(target.guard?.3:1)*(1-(e.gemDamageReduce||0));strike(r,e,target,damage,0xf18f76,e.range);
    if(e.splash)for(const other of targets)if(other!==target&&distance(other,target)<e.splash)other.hp=Math.max(0,other.hp-damage*.4*(1-tideReduction(r,other)));
   }
  }else{
   const lane=e.flying?[[e.x,e.y],[map.base.x,map.base.y+110]]:map.lanes[e.lane];if(e.flying)e.waypoint=1;const p=lane[e.waypoint]||lane.at(-1),d=Math.hypot(e.x-p[0],e.y-p[1]);
   if(d<15&&e.waypoint<lane.length-1)e.waypoint++;
   if(e.waypoint===lane.length-1&&d<Math.max(26,e.range>100?105:26)){
    if(e.cd<=0){e.cd=e.cooldown;e.anim=.3;e.attackCount=(e.attackCount||0)+1;r.gate=Math.max(0,r.gate-e.power*(1-(e.gemDamageReduce||0)));r.events.push({id:randomUUID(),type:e.range>100?'projectile':'impact',...shotStyle(e),x:e.x,y:e.y-20-(e.altitude||0),tx:map.base.x,ty:map.base.y+45,radius:30,duration:.3});}
   }else moveAI(e,p[0],p[1],e.speed*(1-Math.max(e.slow||0,e.gemSlow||0)),dt,map);
  }
 }
 for(const p of r.players)if(p.hp<=0&&p.respawn<=0)p.respawn=8;
 r.enemies=r.enemies.filter(e=>e.hp>0);r.troops=r.troops.filter(t=>t.hp>0);
 if(r.gate<=0){r.phase='defeat';r.recorded=false;}
 else if(r.phase==='battle'&&r.spawn===0&&r.enemies.every(e=>e.neutral)){
  if(r.wave>=map.waves){r.phase=r.stage===10?'victory':'clear';r.recorded=false;for(const p of r.players){p.gold+=60+r.stage*10;grantXP(p,30);}}
  else {r.phase='prepare';r.timer=10;}
 }
 if(!combatActive){r.pendingMelee=[];r.combatActions=[];r.shadowDashes=[];for(const p of r.players)p.dashing=false;}if(['defeat','victory'].includes(r.phase)){r.poisonPools=[];r.fireCarpets=[];r.projectiles=[];for(const e of r.enemies)e.gemEffects={};}
}
export function snapshot(r){return {type:'state',code:r.code,difficulty:r.difficulty||'easy',phase:r.phase,stage:r.stage,wave:r.wave,gate:r.gate,maxGate:r.maxGate,kills:r.kills,timer:Math.max(0,Math.ceil(r.timer)),remaining:r.spawn+r.enemies.filter(e=>!e.neutral).length,host:r.players[0]?.id,troops:r.troops,loot:r.loot,shadowZones:r.shadowZones||[],poisonPools:(r.poisonPools||[]).map(({touched,...pool})=>pool),fireCarpets:r.fireCarpets||[],hostileZones:r.hostileZones,zones:r.zones,windFields:r.windFields||[],events:r.events,enemies:r.enemies,players:r.players.map(({token,input,accountId,...p})=>({...p,stats:stats(p)}))};}






