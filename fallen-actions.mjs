import {coneHits} from './public/combat-geometry.js';
import {FALLEN as C} from './public/fallen-config.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function endFallenForm(p,ctx){if(!p.fallenMounted)return;p.fallenMounted=false;p.cooldowns['fallen-doom']=p.fallenFormCooldown||C.r.cooldown;p.fallenFormCooldown=0;ctx.fx?.({type:'fallen-vfx',action:'revert',sourceId:p.id,x:p.x,y:p.y,radius:100});}
function fallenFlurryStrike(r,p,ax,ay,range,mult,ctx){
 const mounted=!!p.fallenMounted,angle=Math.atan2(ay,ax),power=ctx.stats(p).power;
 ctx.fx({type:'fallen-vfx',action:'flurry',sourceId:p.id,x:p.x,y:p.y,angle,radius:range,mounted,step:p.fallenFlurry?.hitIndex||0});
 for(const e of r.enemies){if(e.hp>0&&(!e.flying||mounted)&&coneHits(p,e,{x:ax,y:ay},range,.2)&&(!ctx.clearLine||ctx.clearLine(p,e))){
  ctx.damage(e,power*mult*C.q.flurryMult*(mounted?C.q.mountedMult:1),p,'skill',{penetration:mounted?C.q.mountedPenetration:C.q.penetration});
  if(e.hp>0){if(ctx.status)ctx.status(e,{bleed:C.q.bleed,statusDuration:C.q.bleedDuration},p,power);fallenMarks(r,p,e,power,ctx);}
 }}
}
export function castFallen(r,p,s,ctx){
 p.castAnim=.5;p.castCount=(p.castCount||0)+1;p.castSkill=s.id;
 const ax=p.input?.aimX??p.face??1,ay=p.input?.aimY||0,d=Math.hypot(ax,ay)||1,x=ax/d,y=ay/d,angle=Math.atan2(y,x),mounted=!!p.fallenMounted;
 p.face=x<0?-1:1;p.direction=Math.abs(x)>Math.abs(y)?(x<0?2:3):(y<0?1:0);
 const fx=(action,radius,extra={})=>ctx.fx({type:'fallen-vfx',action,sourceId:p.id,x:p.x,y:p.y,angle,radius,mounted,...extra});
 if(s.kind==='fallen-slash'){
  const range=mounted?C.q.mountedRange:C.q.range;
  if(!p.fallenQStep){
   p.fallenQStep=1;p.fallenQWindow=C.q.window;p.fallenQLock=C.q.rePressLock;p.fallenQCooldown=s.cooldown;
   p.buffs=(p.buffs||[]).filter(b=>!b.fallenQSpeed);
   p.buffs.push({fallenQSpeed:true,speed:mounted?C.q.mountedSpeedBuff:C.q.speedBuff,time:C.q.speedDuration});
   const hits=mounted?C.q.mountedFlurryHits:C.q.flurryHits,interval=C.q.flurryDuration/hits;
   p.fallenFlurry={remaining:hits-1,hitIndex:0,interval,clock:interval,range,mult:s.mult};
   fx('q1',range);
   fallenFlurryStrike(r,p,x,y,range,s.mult,ctx);
  }else{
   p.fallenQStep=0;p.fallenQWindow=0;p.fallenQLock=0;p.fallenFlurry=null;p.cooldowns[s.id]=p.fallenQCooldown||s.cooldown;
   if(mounted){
    p.castAnim=1.55;
    p.fallenQCharge={delay:1.5,x,y,range:range+45,mult:s.mult};
    fx('q2-charge',140);
   }else{
    if(ctx.move){ctx.move(p,p.x+x*C.q.q2Dash,p.y+y*C.q.q2Dash,C.q.q2Dash);p.face=x<0?-1:1;}
    const xRange=range+20,power=ctx.stats(p).power,pen=C.q.q2Penetration;
    let dealt=0;
    for(const e of r.enemies){if(e.hp<=0||e.flying)continue;if(!coneHits(p,e,{x,y},xRange,.05)&&dist(p,e)>70||ctx.clearLine&&!ctx.clearLine(p,e))continue;
     const before=e.hp,bleedBonus=e.statuses?.bleed?.time>0?(e.statuses.bleed.damage*Math.min(3,Math.ceil(e.statuses.bleed.time))):0;
     if(bleedBonus>0)delete e.statuses.bleed;
     const dmg=power*s.mult*(C.q.q2Mult1+C.q.q2Mult2)+bleedBonus;
     ctx.damage(e,dmg,p,'skill',{penetration:pen});
     dealt+=Math.max(0,before-e.hp);
     if(e.hp>0)fallenMarks(r,p,e,power,ctx);
    }
    if(dealt>0&&ctx.heal){const maxHp=ctx.stats(p).hp;ctx.heal(p,Math.min(maxHp*C.q.leechCap,dealt*C.q.leech),maxHp);}
    fx('q2',xRange);
   }
  }
 }
 if(s.kind==='fallen-aura'){p.fallenAuraTime=s.duration;fx('aura',C.aura.radius);}
 if(s.kind==='fallen-form'){p.fallenMounted=true;p.fallenFormCooldown=s.cooldown;p.cooldowns[s.id]=0;fx('transform',110);}
}
function fallenMarks(r,p,e,power,ctx){
 if(e.hp<=0)return;
 e.fallenMarks||={};const old=e.fallenMarks[p.id],stacks=(old?.stacks||0)+(p.fallenMounted?C.marks.mountedPerHit:C.marks.perHit)+(p.fallenAura?C.marks.auraExtra:0);
 if(stacks>=C.marks.max){delete e.fallenMarks[p.id];const damage=power*Math.min(e.boss?C.marks.bossPowerCap:Infinity,p.fallenMounted?C.marks.mountedBurst:C.marks.burst);ctx.fx({type:'fallen-vfx',action:'rupture',x:e.x,y:e.y,radius:48,sourceId:p.id});ctx.damage(e,damage,p,'fallen-proc');}
 else e.fallenMarks[p.id]={source:p.id,stacks,time:C.marks.duration};
}
export function fallenBasicHit(r,attacker,e,power,ctx){
 if(e.hp<=0)return;const aura=attacker.fallenAura,owner=attacker.hero?attacker:r.players.find(p=>p.id===attacker.owner);
 if(aura&&owner&&(r.random||Math.random)()<aura.bleedChance){ctx.status(e,{bleed:aura.bleed,statusDuration:C.aura.bleedDuration},owner,power);ctx.fx({type:'fallen-vfx',action:'bleed',x:e.x,y:e.y,radius:24});}
 if(attacker.classId==='fallen')fallenMarks(r,attacker,e,power,ctx);
}
export function tickFallen(r,dt,ctx,active){
 for(const u of [...r.players,...r.troops])u.fallenAura=null;
 for(const p of r.players){if(p.classId!=='fallen')continue;p.fallenAuraTime=Math.max(0,(p.fallenAuraTime||0)-dt);p.fallenQLock=Math.max(0,(p.fallenQLock||0)-dt);
  if(p.fallenQStep>0){p.fallenQWindow=Math.max(0,(p.fallenQWindow||0)-dt);if(p.fallenQWindow<=0){p.fallenQStep=0;p.fallenFlurry=null;p.cooldowns['fallen-sunder']=Math.max(p.cooldowns['fallen-sunder']||0,p.fallenQCooldown||C.q.cooldown);}}
  if(p.fallenQCharge){p.fallenQCharge.delay-=dt;p.castAnim=Math.max(p.castAnim||0,.2);if(p.hp<=0||!active){p.fallenQCharge=null;}else if(p.fallenQCharge.delay<=0){const q=p.fallenQCharge;p.fallenQCharge=null;p.castAnim=.55;p.castCount=(p.castCount||0)+1;if(ctx.move){ctx.move(p,p.x+q.x*C.q.q2Dash,p.y+q.y*C.q.q2Dash,C.q.q2Dash);p.face=q.x<0?-1:1;}const waveDist=280,power=ctx.stats(p).power;let dealt=0;for(const e of r.enemies){if(e.hp<=0)continue;const dx=e.x-p.x,dy=e.y-p.y,proj=dx*q.x+dy*q.y,perp=Math.abs(-dx*q.y+dy*q.x);if(!(coneHits(p,e,{x:q.x,y:q.y},q.range,.05)||dist(p,e)<=75||proj>=0&&proj<=waveDist&&perp<=135)||ctx.clearLine&&!ctx.clearLine(p,e))continue;const before=e.hp,bleedBonus=e.statuses?.bleed?.time>0?(e.statuses.bleed.damage*Math.min(3,Math.ceil(e.statuses.bleed.time))):0;if(bleedBonus>0)delete e.statuses.bleed;const dmg=power*q.mult*(C.q.q2Mult1+C.q.q2Mult2)*C.q.mountedMult+bleedBonus;ctx.damage(e,dmg,p,'skill',{penetration:C.q.mountedQ2Penetration});dealt+=Math.max(0,before-e.hp);if(e.hp>0){fallenMarks(r,p,e,power,ctx);if(ctx.status)ctx.status(e,{slow:.35,statusDuration:1.5},p,power);}}if(dealt>0&&ctx.heal){const maxHp=ctx.stats(p).hp;ctx.heal(p,Math.min(maxHp*C.q.leechCap,dealt*C.q.leech),maxHp);}ctx.fx({type:'fallen-vfx',action:'q2',sourceId:p.id,x:p.x,y:p.y,angle:Math.atan2(q.y,q.x),radius:q.range,mounted:true,waveDist});}}
  if(p.fallenFlurry&&p.hp>0&&active){p.fallenFlurry.clock-=dt;if(p.fallenFlurry.clock<=0&&p.fallenFlurry.remaining>0){p.fallenFlurry.clock+=p.fallenFlurry.interval;p.fallenFlurry.remaining--;p.fallenFlurry.hitIndex++;p.castAnim=.32;p.castCount=(p.castCount||0)+1;const ax=p.input?.aimX??p.face??1,ay=p.input?.aimY||0,d=Math.hypot(ax,ay)||1;fallenFlurryStrike(r,p,ax/d,ay/d,p.fallenFlurry.range,p.fallenFlurry.mult,ctx);if(p.fallenFlurry.remaining<=0)p.fallenFlurry=null;}}
  if(p.fallenMounted){const rRank=Math.max(0,(p.skills?.['fallen-doom']||1)-1),drain=Math.max(3,C.manaDrain-rRank*.4);if(active)p.energy=Math.max(0,p.energy-drain*dt);if(p.energy<=0||p.hp<=0||!active)endFallenForm(p,ctx);}
  if(p.hp<=0||!active)continue;const eRank=Math.max(0,(p.skills?.['fallen-aura']||1)-1),enhanced=p.fallenMounted&&p.skills['fallen-aura']>0;if(!enhanced&&!(p.fallenAuraTime>0))continue;
  const radius=(enhanced?C.aura.mountedRadius:C.aura.radius)+eRank*8;
  for(const u of [...r.players,...r.troops])if(u.hp>0&&dist(p,u)<=radius){const old=u.fallenAura;u.fallenAura={power:Math.max(old?.power||0,(enhanced?C.aura.mountedPower:C.aura.power)+eRank*.02),haste:Math.max(old?.haste||0,(enhanced?C.aura.mountedHaste:C.aura.haste)+eRank*.02),bleedChance:Math.max(old?.bleedChance||0,(enhanced?C.aura.mountedBleedChance:C.aura.bleedChance)+eRank*.02),bleed:Math.max(old?.bleed||0,(enhanced?C.aura.mountedBleed:C.aura.bleed)+eRank*.02),woundedBonus:Math.max(old?.woundedBonus||0,enhanced?C.aura.woundedBonus+eRank*.015:0),enhanced:!!(old?.enhanced||enhanced)};}
 }
 for(const e of r.enemies)for(const [id,mark]of Object.entries(e.fallenMarks||{})){mark.time-=dt;if(mark.time<=0||e.hp<=0||!r.players.some(p=>p.id===id&&p.hp>0))delete e.fallenMarks[id];}
}
