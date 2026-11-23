import {randomUUID} from 'node:crypto';
import {gemArmorDamage,armorMultiplier} from './gem-effects.mjs';
const passiveFX=(r,p,target=p)=>r.events.push({id:randomUUID(),type:'passive-vfx',classId:p.classId,sourceId:p.id,targetId:target.id,x:target.x,y:target.y-20,duration:.65,radius:48});
export function passivePose(r,p,kind,target=p){
 if(p.passivePose?.kind!==kind||p.passivePose?.attack!==p.attackCount||!(p.passivePose?.time>0))p.passivePose={kind,time:kind==='guardian'?1.75:['ranger','darkelf'].includes(kind)?.22:.55,duration:kind==='guardian'?1.75:['ranger','darkelf'].includes(kind)?.22:.55,attack:p.attackCount,serial:(p.passivePose?.serial||0)+1};
 if((kind==='guardian'&&target===p)||p.passivePose.fxEmitted)return;
 p.passivePose.fxEmitted=true;
 r.events.push({id:randomUUID(),type:'passive-action-fx',level:p.level||1,face:p.face||1,action:kind,sourceId:p.id,targetId:target.id,x:p.x,y:p.y-24,tx:target.x,ty:target.y-24,duration:.55});
}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function healing(r,u,amount,maxHp,drainFrom){
 const poisonCut=(u.poisonTime>0||u.statuses?.poison?.time>0)?.6:1;
 const actual=Math.min(amount*poisonCut,Math.max(0,maxHp-u.hp));if(actual<=0||u.hp<=0)return 0;u.hp+=actual;
 r.events.push({id:randomUUID(),type:'healing',targetId:u.id,x:u.x,y:u.y-25,amount:Math.round(actual),drainFrom:drainFrom?{x:drainFrom.x,y:drainFrom.y-20}:null,color:0x64ed8e});return actual;
}
export function triggerGuardianWave(r,p,stats,applyStatus){
 if(p.hp<=0)return;
 const s=stats(p),hadShield=p.shield>0;
 p.guardWaveTime=3;passiveFX(r,p);
 const mult=hadShield&&p.mastery>=2?2:1;
 const raw=(s.armor*.15+s.hp*.01)*mult;
 let totalReflected=0;
 for(const e of r.enemies){
  if(e.hp>0&&dist(p,e)<=130){
   const d=Math.max(1,raw*armorMultiplier(e.armor||0));
   e.hp=Math.max(0,e.hp-d);totalReflected+=d;
  }
 }
 if(totalReflected>0){
  p.shield=Math.min(s.hp*.4,(p.shield||0)+totalReflected*.1);
  p.buffs=p.buffs.filter(b=>!b.guardWaveShield);
  p.buffs.push({time:3,shield:true,guardWaveShield:true});
 }
 r.events.push({id:randomUUID(),type:'aura',x:p.x,y:p.y-20,radius:130,color:0xffdc94});
}
function triggerWaterHeal(r,p,stats){
 passiveFX(r,p);passivePose(r,p,'tidecaller');
 const s=stats(p),pct=p.mastery>=2?.12:.08,count=p.mastery>=2?2:1;
 healing(r,p,s.hp*pct,s.hp);
 const allies=r.players.filter(a=>a!==p&&a.hp>0&&dist(p,a)<=280).sort((a,b)=>(a.hp/stats(a).hp)-(b.hp/stats(b).hp)).slice(0,count);
 for(const a of allies){const healed=healing(r,a,stats(a).hp*pct,stats(a).hp);if(healed>0)r.events.push({id:randomUUID(),type:'passive-action-fx',level:p.level||1,face:p.face||1,action:'heal-water',sourceId:p.id,targetId:a.id,x:p.x,y:p.y-25,tx:a.x,ty:a.y-25,duration:.65});}
}
export function passiveUpkeep(r,p,dt,stats,kill){
 if(p.passivePose){p.passivePose.time=Math.max(0,p.passivePose.time-dt);if(p.hp<=0||p.stun>0)p.passivePose.time=0;}
 p.passiveCd=Math.max(0,(p.passiveCd||0)-dt);
 for(const k of ['warTime','duelStackTime','duelSwapTime','windPassiveTime','focusTime','moonTime','guardWaveTime','fallenDoubleHealTime','stealthGraceTime','guardArmorTime']){
  if(p[k]>0){p[k]=Math.max(0,p[k]-dt);if(p[k]===0){if(k==='warTime')p.warStacks=0;if(k==='duelStackTime')p.duelStacks=0;if(k==='windPassiveTime')p.windPassiveStacks=0;if(k==='focusTime')p.focusStacks=0;if(k==='moonTime')p.moonStacks=0;if(k==='guardArmorTime')p.guardArmorStacks=0;}}
 }
 if(p.hero==='knight-1'&&p.mastery>=2&&p.shield>0&&p.hp>0)healing(r,p,stats(p).hp*.015*dt,stats(p).hp);
 if(p.hero==='samurai'&&p.moving&&p.hp>0){
  p.windMoveAcc=(p.windMoveAcc||0)+dt;
  if(p.windMoveAcc>=.4){p.windMoveAcc=0;p.windPassiveStacks=Math.min(5,(p.windPassiveStacks||0)+1);p.windPassiveTime=4;}
 }
 if(p.pendingLightning?.length){
  const next=[];
  for(const job of p.pendingLightning){
   job.delay-=dt;
   if(job.delay<=0){
    const e=r.enemies.find(a=>a.id===job.targetId&&a.hp>0);
    if(e){
     const d=gemArmorDamage(p,e,job.power*.3);e.hp=Math.max(0,e.hp-d);kill?.(r,e,p);
     for(const o of r.enemies)if(o!==e&&o.hp>0&&dist(e,o)<=100){o.hp=Math.max(0,o.hp-gemArmorDamage(p,o,job.power*.2));kill?.(r,o,p);p.lightningStacks=(p.lightningStacks||0)+1;r.events.push({id:randomUUID(),type:'lightning',skill:'chain-lightning',x:e.x,y:e.y-20,tx:o.x,ty:o.y-20,color:0x9edfff});}
    }
   }else next.push(job);
  }
  p.pendingLightning=next;
 }
}
export function passiveCast(r,p,slot,stats,applyStatus){
 const h=p.hero;
 if(h==='knight-1'&&(slot==='Q'||slot==='E'))triggerGuardianWave(r,p,stats,applyStatus);
 if(h==='warrior-2'){
  const s=stats(p),free=p.mastery>=2&&!!p.ravagerFuryActive;
  if(!free&&p.hp>1)p.hp=Math.max(1,p.hp-s.hp*.1);
 }
 if(h==='samurai-commander'&&slot==='E'&&p.mastery>=2){p.duelSwapTime=3;p.cd=0;}
 if(h==='lightning-mage'){p.lightningStacks=(p.lightningStacks||0)+1;}
 if(h==='wanderer-magican'){
  p.waterStacks=(p.waterStacks||0)+(slot==='Q'?3:1);
  if(p.waterStacks>=4){p.waterStacks-=4;triggerWaterHeal(r,p,stats);}
 }
 if(h==='samurai'){p.windPassiveStacks=Math.min(5,(p.windPassiveStacks||0)+1);p.windPassiveTime=4;}
 if(h==='goblin-assassin'&&slot==='E'){p.stealthGraceTime=3;}
}
export function passiveTakeDamage(r,p,attacker,damage,stats,applyStatus){
 if(p.hero==='knight-1'&&p.hp>0){
  p.guardHitsTaken=(p.guardHitsTaken||0)+1;
  if(p.guardHitsTaken>=4){p.guardHitsTaken=0;triggerGuardianWave(r,p,stats,applyStatus);}
 }
}
export function passiveKill(r,p,target,stats){
 if(p.hp<=0)return;
 if(p.hero==='warrior-1'){
  passiveFX(r,p);const s=stats(p),missing=Math.max(0,s.hp-p.hp);
  healing(r,p,missing*(p.mastery>=2?.1:.05),s.hp);
  p.warStacks=Math.min(5,(p.warStacks||0)+1);p.warTime=20;
 }
 if(p.hero==='goblin-assassin'&&p.mastery>=2&&target?.statuses?.bleed?.time>0){
  for(const id of ['assassin-double','assassin-veil'])if(p.cooldowns?.[id]>0)p.cooldowns[id]=Math.max(0,p.cooldowns[id]-2);
  p.buffs=p.buffs.filter(b=>!b.assassinKill);
  p.buffs.push({time:2,speed:.25,assassinKill:true});
 }
}
export function passiveHit(r,p,target,power,stats,applyStatus,kill,kind='basic'){
 p.passiveHits=(p.passiveHits||0)+1;const n=p.passiveHits,h=p.hero,basic=kind==='basic';
 if(basic&&h==='warrior-1'&&p.mastery>=2&&p.warStacks>=5)passivePose(r,p,'berserker',target);
 if(basic&&h==='warrior-2'&&p.mastery>=2&&p.hp<stats(p).hp*.15)passivePose(r,p,'ravager',target);
 if(h==='warrior-2'&&p.hp<stats(p).hp*.5)passiveFX(r,p);
 if(h==='warrior-3'&&basic)passiveFX(r,p);
 // 1. Fire Wizard: Hoả Thiêu
 if(h==='fire-wizard'){
  passiveFX(r,p,target);target.statuses||={};const prev=target.statuses.burn,stacks=Math.min(5,(prev?.stacks||0)+1);
  const pct=p.mastery>=2?.04:(.01+(stacks-1)*.0025),dur=p.mastery>=2?10:5;
  target.statuses.burn={time:dur,clock:prev?.clock??1,stacks,percentMaxHp:pct,damage:0,owner:p.id};
  if(p.mastery>=2&&stacks>=5)target.fireAmp5=true;
 }
 // 2. Lightning Mage: Tích Điện
 if(h==='lightning-mage'){
  p.lightningStacks=(p.lightningStacks||0)+1;
  if(p.lightningStacks>=4){
   passiveFX(r,p,target);
   p.lightningStacks=0;
   const mainMult=p.mastery>=2?.3:.4,rad=p.mastery>=2?100:50;
   const d=gemArmorDamage(p,target,power*mainMult);target.hp=Math.max(0,target.hp-d);kill(r,target,p);
   r.events.push({id:randomUUID(),type:'dot',x:target.x,y:target.y-45,text:'TÍCH ĐIỆN −'+Math.round(d),color:0x9edfff});
   for(const other of r.enemies)if(other!==target&&other.hp>0&&dist(target,other)<=rad){
    other.hp=Math.max(0,other.hp-gemArmorDamage(p,other,power*.2));kill(r,other,p);
    p.lightningStacks=(p.lightningStacks||0)+1;
    r.events.push({id:randomUUID(),type:'lightning',skill:'chain-lightning',x:target.x,y:target.y-20,tx:other.x,ty:other.y-20,color:0x9edfff});
   }
   if(p.mastery>=2){p.pendingLightning||=[];p.pendingLightning.push({targetId:target.id,delay:1,power});}
  }
 }
 // 3. Tidecaller: Thủy Lưu
 if(h==='wanderer-magican'){
  applyStatus(target,{slow:p.mastery>=2?.25:.15,statusDuration:p.mastery>=2?2:1.5},p,power);
  if(basic){p.waterStacks=(p.waterStacks||0)+1;if(p.waterStacks>=4){p.waterStacks-=4;triggerWaterHeal(r,p,stats);}}
 }
 // 4. Guardian Tier 2: every 3rd basic
 if(h==='knight-1'&&basic&&p.mastery>=2&&p.attackCount%3===0){
  passivePose(r,p,'guardian',target);passiveFX(r,p,target);
  const s=stats(p),extra=gemArmorDamage(p,target,s.hp*.03+s.armor*.35);
  target.hp=Math.max(0,target.hp-extra);applyStatus(target,{stun:.45},p,power);
  p.guardArmorStacks=Math.min(3,(p.guardArmorStacks||0)+1);p.guardArmorTime=4;
 }
 // 5. Warrior-1: Boss hits build Chiến Ý
 if(h==='warrior-1'&&target.boss){
  if(basic){p.warBossBasic=(p.warBossBasic||0)+1;if(p.warBossBasic>=2){passiveFX(r,p);p.warBossBasic=0;p.warStacks=Math.min(5,(p.warStacks||0)+1);p.warTime=20;}}
  else {p.warStacks=Math.min(5,(p.warStacks||0)+1);p.warTime=20;}
 }
 // 6. Warrior-2: Cuồng Nộ
 if(h==='warrior-2'){
  const s=stats(p);
  if(basic){
   if(p.hp>1)p.hp=Math.max(1,p.hp-s.hp*.03);
   for(const e of r.enemies)if(e!==target&&e.hp>0&&dist(target,e)<=30){e.hp=Math.max(0,e.hp-gemArmorDamage(p,e,power*.4));applyStatus(e,{bleed:.2,statusDuration:2},p,power);kill(r,e,p);}
  }
  if(!p._inBloodstorm)applyStatus(target,{bleed:.2,statusDuration:2},p,power);
 }
 // 7. Warrior-3: Ý Chí Bất Khuất + Tinh thông bậc 2
 if(h==='warrior-3'&&basic){
  const maxHp=stats(p).hp,vanStacks=p.hp>0?Math.min(4,Math.floor(Math.max(0,1-p.hp/Math.max(1,maxHp))/.1)):0;
  if(vanStacks>0){
   const bonusRaw=maxHp*vanStacks*.01,before=target.hp,dealt=gemArmorDamage(p,target,bonusRaw);
   target.hp=Math.max(0,target.hp-dealt);
   const actualBonus=Math.max(0,before-target.hp);
   if(actualBonus>0)healing(r,p,actualBonus,maxHp,target);
  }
  if(p.mastery>=2&&p.attackCount%4===0){
   passivePose(r,p,'vanguard',target);
   applyStatus(target,{stun:.4},p,power);
   if(p.vanguardTime>0&&(p.vanguardExtended||0)<15){const add=Math.min(.5,15-(p.vanguardExtended||0));p.vanguardTime+=add;p.vanguardExtended=(p.vanguardExtended||0)+add;}
   if(p.vanguardTime>0)target.vanguardWeakenTime=3;
  }
 }
 // 8. Knight-2: Thánh Ước Quang Minh
 if(h==='knight-2'){
  p.holyMarks=(p.holyMarks||0)+1;
  const need=p.mastery>=2&&basic?3:4;
  if(p.holyMarks>=need){
   if(basic)passivePose(r,p,p.holyMounted?'paladin-mounted':'paladin',target);passiveFX(r,p);
   p.holyMarks=0;
   const s=stats(p),base=p.holyMounted?.12:.06,mult=p.holyMounted&&p.mastery>=2?1.25:1;
   healing(r,p,s.hp*base*mult,s.hp);
   const ally=r.players.filter(a=>a!==p&&a.hp>0&&dist(p,a)<=220).sort((a,b)=>(a.hp/stats(a).hp)-(b.hp/stats(b).hp))[0];
   if(ally)healing(r,ally,stats(ally).hp*base*mult,stats(ally).hp,p);
   if(p.mastery>=2&&basic)applyStatus(target,{stun:.35},p,power);
  }
 }
 // 9. Knight-3: Lời Thề Phá Giáp
 if(h==='knight-3'){
  if(basic&&p.mastery>=2&&(r.random||Math.random)()<.3)applyStatus(target,{bleed:.2,statusDuration:2},p,power);
  target.darkOathStacks=(target.darkOathStacks||0)+1;
  if(target.darkOathStacks>=4){
   passiveFX(r,p,target);
   target.darkOathStacks=0;
   const boom=Math.max(1,power*.4*armorMultiplier(Math.max(0,(target.armor||0)*.7)));
   target.hp=Math.max(0,target.hp-boom);
   applyStatus(target,{bleed:.2,slow:.15,statusDuration:2},p,power);
   if(p.mastery>=2){target.fallenArmorBreakTime=3;p.fallenDoubleHealTime=3;}
   r.events.push({id:randomUUID(),type:'dot',x:target.x,y:target.y-45,text:'THA HÓA −'+Math.round(boom),color:0xb69be0});
  }
 }
 // 10. Samurai Commander: Kiếm Tâm Song Thể
 if(h==='samurai-commander'&&basic){
  p.duelStacks=Math.min(20,(p.duelStacks||0)+1);p.duelStackTime=4;
  if(!p.dualSwords){
   if(p.swordIntent>0){passivePose(r,p,'duelist-critical',target);passiveFX(r,p,target);const mult=p.duelStacks>=20?1.25:.65;const bonus=gemArmorDamage(p,target,power*mult);target.hp=Math.max(0,target.hp-bonus);p.swordIntent=0;r.events.push({id:randomUUID(),type:'dot',x:target.x,y:target.y-45,text:'CHÍ MẠNG −'+Math.round(bonus),color:0xffd787});}
   else if(p.attackCount%3===0)p.swordIntent=Math.min(3,(p.swordIntent||0)+1);
  }else if(p.attackCount%4===0){passivePose(r,p,'duelist-dual',target);passiveFX(r,p,target);
   const slash=gemArmorDamage(p,target,power*.6);target.hp=Math.max(0,target.hp-slash);
   r.events.push({id:randomUUID(),type:'dot',x:target.x,y:target.y-45,text:'SONG KIẾM −'+Math.round(slash),color:0xb6e2ab});
  }
 }
 // 11. Samurai: Thuận Phong
 if(h==='samurai'&&basic){
  passiveFX(r,p);
  p.windPassiveStacks=Math.min(5,(p.windPassiveStacks||0)+1);p.windPassiveTime=4;
  if(p.mastery>=2&&p.windPassiveStacks>=5&&p.attackCount%3===0){
   passivePose(r,p,'windblade',target);
   const d=gemArmorDamage(p,target,power*.45);target.hp=Math.max(0,target.hp-d);
   const dx=target.x-p.x,dy=target.y-p.y,len=Math.hypot(dx,dy)||1;
   target.x+=dx/len*18;target.y+=dy/len*18;
  }
 }
 // 12. Goblin Assassin: Ám Sát Chí Mạng
 if(h==='goblin-assassin'){
  if(p.mastery>=2&&target?.boss&&target.statuses?.bleed?.time>0){
   for(const id of ['assassin-double','assassin-veil','assassin-flurry'])if(p.cooldowns?.[id]>0)p.cooldowns[id]=Math.max(0,p.cooldowns[id]-1);
   p.buffs=(p.buffs||[]).filter(b=>!b.assassinBoss);
   p.buffs.push({time:2,haste:.2,speed:.25,assassinBoss:true});
  }
  const backstab=(p.x-target.x)*(target.face||1)<-8,stealthed=(p.stealthGraceTime||0)>0||p.buffs?.some(b=>b.stealth&&b.time>0);
  if(backstab||stealthed){
   if(basic)passivePose(r,p,'assassin',target);passiveFX(r,p,target);
   if(stealthed)p.stealthGraceTime=0;
   const mult=p._inAssassinR?.5:1;
   const extra=gemArmorDamage(p,target,power*mult);target.hp=Math.max(0,target.hp-extra);
   applyStatus(target,{bleed:.22,statusDuration:3},p,basic?power:stats(p).power);
   r.events.push({id:randomUUID(),type:'dot',x:target.x,y:target.y-45,text:'ÁM SÁT −'+Math.round(extra),color:0xffd787});
  }
 }
 // 13. Samurai Archer: Liên Xạ Truy Kích
 if(h==='samurai-archer'&&basic){
  const add=p.lastFocusTarget===target.id?2:1;p.lastFocusTarget=target.id;
  p.focusStacks=Math.min(10,(p.focusStacks||0)+add);p.focusTime=5;
  if(p.focusStacks>=10){
   p.focusShotCount=(p.focusShotCount||0)+1;
   if(p.focusShotCount>=3){
    passiveFX(r,p,target);
    p.focusShotCount-=3;
    const behind=r.enemies.find(e=>e!==target&&e.hp>0&&dist(target,e)<=140);
    if(behind){r.events.push({id:randomUUID(),type:'passive-action-fx',level:p.level||1,face:p.face||1,action:'piercing-arrow',sourceId:p.id,targetId:behind.id,x:p.x,y:p.y-24,tx:behind.x,ty:behind.y-24,duration:.55});const pDmg=power*.5;behind.hp=Math.max(0,behind.hp-gemArmorDamage(p,behind,pDmg));if(behind.statuses?.poison?.time>0&&behind.hp>0){behind.hp=Math.max(0,behind.hp-pDmg*.05);behind.statuses.poison.damage+=stats(p).power*.01;}kill(r,behind,p);}
   }
   if(p.mastery>=2){
    passivePose(r,p,'ranger',target);
    const bonusArrow=gemArmorDamage(p,target,power*.2);target.hp=Math.max(0,target.hp-bonusArrow);
    p.focusShotCount=(p.focusShotCount||0)+1;
    if(p.focusShotCount>=3){
    passiveFX(r,p,target);
     p.focusShotCount-=3;
     const behind=r.enemies.find(e=>e!==target&&e.hp>0&&dist(target,e)<=140);
     if(behind){r.events.push({id:randomUUID(),type:'passive-action-fx',level:p.level||1,face:p.face||1,action:'piercing-arrow',sourceId:p.id,targetId:behind.id,x:p.x,y:p.y-24,tx:behind.x,ty:behind.y-24,duration:.55});behind.hp=Math.max(0,behind.hp-gemArmorDamage(p,behind,power*.5));kill(r,behind,p);}
    }
   }
  }
 }
 // 14. Dark Elf: Nguyệt Ảnh Xuyên Tâm
 if(h==='dark-elf'){
  if(basic&&(p.moonStacks||0)>=7)passiveFX(r,p);
  if(basic){p.moonStacks=Math.min(8,(p.moonStacks||0)+1);p.moonTime=5;}
  if(p.mastery>=2){
   target.moonHits=(target.moonHits||0)+1;
   if(target.moonHits>=3){target.moonHits=0;target.moonBreakTime=3;}
   if(basic){
    const other=r.enemies.find(e=>e!==target&&e.hp>0&&dist(target,e)<=160);
    if(other){
     passivePose(r,p,'darkelf',other);
     other.hp=Math.max(0,other.hp-gemArmorDamage(p,other,power*.45));
     other.moonHits=(other.moonHits||0)+1;
     if(other.moonHits>=3){other.moonHits=0;other.moonBreakTime=3;}
     kill(r,other,p);
    }
   }
  }
 }
}
