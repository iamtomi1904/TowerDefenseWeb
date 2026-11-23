import {FALLEN} from './public/fallen-config.js';
import {PALADIN} from './public/paladin-config.js';
import {enemyFamily} from './public/enemy-visuals.js';
import {randomUUID} from 'node:crypto';
import {GEM_RULES as C,equippedGem,gemTier} from './public/gems.js';
import {TROOPS} from './public/content.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const emit=(r,e)=>r.events.push({id:randomUUID(),...e});
export function effect(e,id,p,duration,extra={}){e.gemEffects||={};const old=e.gemEffects[id];return e.gemEffects[id]={id,source:p.id,target:e.id,element:id,duration,time:duration,stacks:old?.stacks||0,clock:old?.clock??1,...old,source:p.id,...extra,time:duration};}
export const armorMultiplier=armor=>25/(25+Math.max(0,armor));
export function gemArmorDamage(p,e,n,options={}){
 const g=equippedGem(p),tier=gemTier(p);
 if(p.hero==='knight-2'){const base=p.holyMounted?.45:.25;n*=1+(enemyFamily(e)==='undead'?base*2:base);}
 if(p.hero==='samurai-archer'&&(p.focusStacks||0)>0)n*=1+(p.focusStacks||0)*.03;
 if(p.hero==='warrior-2'&&p.mastery>=2&&p._hpPct!==undefined&&p._hpPct<.4)n*=1+(.4-p._hpPct)*50*.005*(p.buffs?.some(b=>b.bloodRage&&b.time>0)?1.5:1);
 const poisonedFallen=g?.id==='poison'&&(e.gemEffects?.poison?.stacks||0)>0;
 if(p.classId==='fallen'&&(e.statuses?.bleed?.time>0||Object.values(e.fallenMarks||{}).some(m=>m.time>0)||poisonedFallen))n*=1+(p.fallenMounted?FALLEN.mountedWoundedBonus:FALLEN.woundedBonus);
 if(p.fallenAura?.woundedBonus&&e.statuses?.bleed?.time>0)n*=1+p.fallenAura.woundedBonus;
 if(e.fireCarpetAmp)n*=1+C.fire.carpetAmp;
 if(e.fireAmp5&&(e.statuses?.burn?.stacks||0)>=5)n*=1.05;
 if(e.assassinWeakenTime>0)n*=1.1;
 let armor=Math.max(0,(e.armor||0)*(e.environment?.armor||1)*(1-Math.min(C.dark.maxStacks,e.gemEffects?.dark?.stacks||0)*C.dark.armorPerStack));
 if(e.fallenArmorBreakTime>0)armor*=.7;
 if(e.moonBreakTime>0)armor*=.8;
 if(p.classId==='fallen')armor=Math.max(0,armor-(p.fallenMounted?FALLEN.mountedPenetration:FALLEN.penetration));
 if(p.hero==='goblin-assassin'&&p.mastery>=2&&e.statuses?.bleed?.time>0)armor*=.6;
 if(p.hero==='samurai-commander'&&p.mastery>=2&&(p.duelStacks||0)>=20)armor*=.7;
 if(p.hero==='warrior-2'&&p.mastery>=2&&p._hpPct!==undefined&&p._hpPct<.15)armor*=.6;
 armor*=1-(options.penetration||0);
 const pen=g?.id==='dark'?C.dark.penetrationByTier[tier-1]:0;
 const effectiveArmor=armor*(1-pen);
 return Math.max(1,n*armorMultiplier(effectiveArmor));
}
export function spawnGemSkeleton(r,p,near){
 const g=equippedGem(p);if(!g||g.id!=='dark')return null;
 const tier=gemTier(p),limit=C.dark.skeletonLimitByTier[tier-1];
 const owned=r.troops.filter(t=>t.type==='gem-skeleton'&&t.owner===p.id&&t.hp>0);
 if(owned.length>=limit)owned.sort((a,b)=>a.born-b.born)[0].hp=0;
 p.darkSpawnCount=(p.darkSpawnCount||0)+1;
 const isCommander=tier>=3&&p.darkSpawnCount%C.dark.commanderEvery===0;
 const def=TROOPS.find(t=>t.id==='gem-skeleton');
 const hp=Math.round(def.hp*(isCommander?1.65:1)),power=Math.round(def.power*(isCommander?1.4:1)),armor=Math.round(def.armor*(isCommander?1.6:1));
 const t={id:randomUUID(),owner:p.id,type:def.id,sprite:def.sprite,commander:isCommander,x:near.x,y:near.y,hp,maxHp:hp,power,armor,cd:0,anim:0,face:1,summoned:true,lifetime:C.dark.skeletonDuration,born:r.elapsed};
 r.troops.push(t);emit(r,{type:'gem-hit',gem:'dark',x:near.x,y:near.y-20,color:g.color});
 return t;
}
export function gemHit(r,p,e,n,kind,ctx,random=Math.random){
 const g=equippedGem(p);if(!g||!['basic','skill','zone'].includes(kind))return;
 const basic=kind==='basic',direct=kind!=='zone',tier=gemTier(p),ti=tier-1;
 emit(r,{type:'gem-hit',gem:g.id,targetId:e.id,x:e.x,y:e.y-20,color:g.color});
 if(g.id==='thunder'&&direct){
  const c=C.thunder;
  if(basic){p.thunderStacks=Math.min(c.maxStacks,(p.thunderStacks||0)+1);p.thunderTime=c.stackDuration;}
  const chance=(p.thunderStacks||0)>=c.maxStacks?c.fullChance:c.chance;
  const targets=r.enemies.filter(a=>a!==e&&a.hp>0&&dist(e,a)<=c.radius).sort((a,b)=>dist(e,a)-dist(e,b)).slice(0,Math.min(c.maxTargets,c.baseTargets+Math.max(0,(p.thunderStacks||0)-1)));
  if(random()<chance){
   effect(e,'thunder',p,e.boss?c.bossSlowDuration:c.stun,e.boss?{slow:c.bossSlow}:{stun:true});
   const splash=c.splashByTier[ti];
   for(const a of targets){ctx.damage(a,n*splash,p);emit(r,{type:'lightning',x:e.x,y:e.y-20,tx:a.x,ty:a.y-20,color:g.color});}
   if(p.hero==='lightning-mage'&&targets.length>=2)p.passiveHits=(p.passiveHits||0)+1;
   if(tier>=3){
    const extra=r.enemies.filter(a=>a!==e&&a.hp>0&&dist(e,a)<=c.radius).sort((a,b)=>b.hp-a.hp)[0];
    if(extra){ctx.damage(extra,n*c.awakenedBonus,p);emit(r,{type:'lightning',x:e.x,y:e.y-20,tx:extra.x,ty:extra.y-20,color:0xfff2a8});}
   }
  }
 }
 if(g.id==='ice'){
  const c=C.ice;
  effect(e,'ice',p,c.duration,{slow:c.slowByTier[ti],dmgReduce:c.dmgReduceByTier[ti]});
  if(basic){
   const s=effect(e,'freeze-stack',p,c.stackDuration,{stacks:Math.min(c.maxStacks,(e.gemEffects?.['freeze-stack']?.stacks||0)+1)});
   if(random()<s.stacks*c.step){effect(e,'freeze',p,c.freeze,{stun:true});delete e.gemEffects['freeze-stack'];}
  }
 }
 if(g.id==='fire'&&direct){
  const c=C.fire;
  if(random()<c.chance)effect(e,'fire',p,c.duration,{percent:c.percentByTier[ti],tickInterval:1,maxStacks:1,refresh:'refresh'});
  const burnActive=!!e.gemEffects?.fire;
  const pyroReady=p.hero==='fire-wizard'&&e.statuses?.burn?.time>0&&!(e.fireDetonateCd>0);
  const regularReady=burnActive&&((basic&&(p.attackCount||0)>0&&p.attackCount%c.detonateEvery===0)||kind==='skill');
  if(pyroReady||regularReady){
   if(pyroReady)e.fireDetonateCd=c.pyroCooldown;
   const boom=n*c.detonateByTier[ti];
   for(const a of r.enemies)if(a.hp>0&&dist(e,a)<=c.detonateRadius)ctx.damage(a,boom,p);
   emit(r,{type:'impact',fx:'fire',x:e.x,y:e.y-15,radius:c.detonateRadius,color:g.color});
   if(tier>=3){r.fireCarpets||=[];r.fireCarpets.push({id:randomUUID(),source:p.id,x:e.x,y:e.y,radius:c.detonateRadius,time:c.carpetDuration,clock:1,power:n});}
  }
 }
 if(g.id==='poison'&&direct){
  const s=addPoison(e,p,tier);
  if(tier>=3&&s.stacks>=C.poison.maxStacks&&!(e.poisonBurstCd>0)){
   e.poisonBurstCd=2;
   const burst=Math.min(Math.max(10,(e.maxHp-e.hp)*C.poison.burstMissingPct),n*C.poison.burstBossCapPower);
   for(const a of r.enemies)if(a.hp>0&&dist(e,a)<=C.poison.poolRadius)ctx.damage(a,burst,p);
   emit(r,{type:'impact',fx:'poison',x:e.x,y:e.y-15,radius:C.poison.poolRadius,color:g.color});
  }
 }
 if(g.id==='dark'&&direct){
  if(e.boss||e.elite)effect(e,'dark',p,C.dark.duration,{stacks:Math.min(C.dark.maxStacks,(e.gemEffects?.dark?.stacks||0)+1),maxStacks:C.dark.maxStacks,refresh:'refresh'});
  if(e.boss){p.darkBossHits=(p.darkBossHits||0)+1;if(p.darkBossHits>=C.dark.bossHitSpawnEvery){p.darkBossHits=0;spawnGemSkeleton(r,p,e);}}
 }
 if(g.id==='wind'&&basic){p.windStacks=Math.min(C.wind.maxStacks,(p.windStacks||0)+1);p.windTime=C.wind.duration;}
}
export function addPoison(e,p,tier=gemTier(p)){
 return effect(e,'poison',p,C.poison.duration,{stacks:Math.min(C.poison.maxStacks,(e.gemEffects?.poison?.stacks||0)+1),maxStacks:C.poison.maxStacks,percent:C.poison.percentByTier[tier-1],healCut:C.poison.healCutByTier[tier-1],tickInterval:1,refresh:'refresh'});
}
export function gemKill(r,e,p,direct){
 if(e.gemEffects?.poison){r.poisonPools||=[];r.poisonPools.push({id:randomUUID(),source:e.gemEffects.poison.source,x:e.x,y:e.y,time:C.poison.poolDuration,radius:C.poison.poolRadius,touched:[]});}
 if(!direct)return;const g=equippedGem(p);
 if(g?.id==='wind')p.windPermanent=Math.min(C.wind.killCap,(p.windPermanent||0)+C.wind.killBonus);
 if(g?.id==='dark')spawnGemSkeleton(r,p,e);
}
export function tickGemPlayer(p,dt){for(const [time,stacks]of [['windTime','windStacks'],['thunderTime','thunderStacks']]){p[time]=Math.max(0,(p[time]||0)-dt);if(!p[time])p[stacks]=0;}}
export function tickGemTarget(r,e,dt,ctx){
 e.gemStun=0;e.gemSlow=0;e.gemDamageReduce=0;e.gemHealCut=0;e.fireCarpetAmp=0;
 e.fireDetonateCd=Math.max(0,(e.fireDetonateCd||0)-dt);
 e.poisonBurstCd=Math.max(0,(e.poisonBurstCd||0)-dt);
 for(const p of r.players)if(p.hp>0&&equippedGem(p)?.id==='ice'&&gemTier(p)>=3&&dist(p,e)<=C.ice.auraRadius){e.gemSlow=Math.max(e.gemSlow,C.ice.auraSlow);e.gemDamageReduce=Math.max(e.gemDamageReduce,C.ice.auraDmgReduce);}
 for(const pool of r.poisonPools||[])if(pool.time>0&&!e.flying&&dist(e,pool)<=pool.radius)e.gemSlow=Math.max(e.gemSlow,C.poison.poolSlow);
 for(const c of r.fireCarpets||[])if(c.time>0&&!e.flying&&dist(e,c)<=c.radius)e.fireCarpetAmp=1;
 for(const [id,s]of Object.entries(e.gemEffects||{})){
  const elapsed=Math.min(dt,Math.max(0,s.time));s.time-=dt;
  if(s.stun)e.gemStun=Math.max(e.gemStun,s.time);
  if(s.slow&&s.time>0)e.gemSlow=Math.max(e.gemSlow,s.slow);
  if(s.dmgReduce&&s.time>0)e.gemDamageReduce=Math.max(e.gemDamageReduce,s.dmgReduce);
  if(s.healCut&&s.time>0)e.gemHealCut=Math.max(e.gemHealCut,s.healCut);
  if(s.tickInterval){
   const speedMult=id==='poison'?1+(e.statuses?.bleed?.time>0?.15:0)+(e.gemEffects?.dark?.stacks>0?.15:0):1;
   s.clock-=elapsed*speedMult;
   while(s.clock<=1e-6&&e.hp>0){
    s.clock+=s.tickInterval;
    const p=r.players.find(p=>p.id===s.source);
    if(p){
     const fraction=id==='poison'?Math.min(s.stacks*(s.percent||C.poison.percentByTier[0]),e.boss?C.poison.bossCap:Infinity):Math.min(s.percent,e.boss?C.fire.bossCap:Infinity),n=e.maxHp*fraction;
     ctx.damage(e,n,p);emit(r,{type:'dot',x:e.x,y:e.y-40,text:'−'+Math.round(n)+(id==='poison'?' ĐỘC':' CHÁY'),color:id==='poison'?0x97d66a:0xff8b44});
    }
   }
  }
  if(s.time<=1e-9)delete e.gemEffects[id];
  if(e.hp<=0){e.gemEffects={};break;}
 }
}
export function tickPoisonPools(r,dt,ctx){
 r.poisonPools=(r.poisonPools||[]).filter(pool=>{pool.time-=dt;if(pool.time<=0)return false;const p=r.players.find(p=>p.id===pool.source);if(p)for(const e of r.enemies)if(e.hp>0&&!e.flying&&!pool.touched.includes(e.id)&&dist(e,pool)<=pool.radius){pool.touched.push(e.id);addPoison(e,p);}return true;});
 r.fireCarpets=(r.fireCarpets||[]).filter(c=>{c.time-=dt;if(c.time<=0)return false;c.clock-=dt;if(c.clock<=1e-9&&ctx){c.clock+=1;const p=r.players.find(p=>p.id===c.source);if(p)for(const e of r.enemies)if(e.hp>0&&!e.flying&&dist(e,c)<=c.radius)ctx.damage(e,c.power*C.fire.carpetDps,p);}return true;});
}
export function carryGems(p){p.windPermanent=(p.windPermanent||0)*C.wind.carry;p.windStacks=0;p.windTime=0;p.thunderStacks=0;p.thunderTime=0;p.darkBossHits=0;}
