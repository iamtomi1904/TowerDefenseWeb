import {coneHits} from './public/combat-geometry.js';
import {PALADIN as C} from './public/paladin-config.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function endHolyForm(p,ctx){if(!p.holyMounted)return;const ratio=p.hp/ctx.stats(p).hp;p.holyMounted=false;p.hp=Math.max(0,Math.min(ctx.stats(p).hp,ctx.stats(p).hp*ratio));p.cooldowns['holy-ascend']=p.holyFormCooldown||30;p.holyFormCooldown=0;}
export function castHoly(r,p,s,ctx){p.castAnim=.55;p.castCount=(p.castCount||0)+1;p.castSkill=s.id;const fx=(action,radius,extra={})=>ctx.fx({type:'holy-vfx',action,skill:s.id,angle:s.kind==='holy-slash'?p.castAngle:Math.atan2(p.input?.aimY||0,p.input?.aimX??p.face??1),sourceId:p.id,x:p.x,y:p.y,radius,mounted:p.holyMounted,...extra});
 if(s.kind==='holy-slash'){
  const ax=Math.cos(p.castAngle),ay=Math.sin(p.castAngle),mounted=!!p.holyMounted,step=(p.holyQStep||0)+1,range=s.range+(mounted?45:0)+(step===2?25:0),power=ctx.stats(p).power*s.mult*(C.q.steps[step-1]||1)*(mounted?C.mountedQ:1);
  if(step<3){
   p.holyQStep=step;p.holyQWindow=C.q.window;p.holyQLock=C.q.rePressLock;p.holyQCooldown=s.cooldown;
   const arc=step===1?.15:.75;
   for(const e of r.enemies)if(e.hp>0&&(!e.flying||mounted)&&coneHits(p,e,{x:ax,y:ay},range,arc)&&(!ctx.clearLine||ctx.clearLine(p,e))){
    ctx.damage(e,power,p);
    if(step===2&&e.hp>0&&ctx.status)ctx.status(e,{slow:.25,statusDuration:1},p,ctx.stats(p).power);
   }
   fx(step===1?'q1':'q2',range,{step});
  }else{
   p.holyQStep=0;p.holyQWindow=0;p.holyQLock=0;p.cooldowns[s.id]=p.holyQCooldown||s.cooldown;
   if(mounted){
    p.castAnim=1.05;
    p.holyQCharge={delay:1.0,ax,ay,range:C.q.mountedShockRadius,power,cooldown:s.cooldown};
    fx('q3-charge',140,{step:3});
   }else{
    p.holyLeapTime=.28;p.holyLeapDuration=.28;
    const leap=C.q.leap;
    if(ctx.move){ctx.move(p,p.x+ax*leap,p.y+ay*leap,leap);p.face=ax<0?-1:1;}
    const hitRadius=125;
    for(const e of r.enemies)if(e.hp>0&&!e.flying&&distance(p,e)<=hitRadius&&(!ctx.clearLine||ctx.clearLine(p,e)))ctx.damage(e,power,p);
    const maxHp=ctx.stats(p).hp,shieldAmt=Math.round(maxHp*C.q.shieldRatio);
    p.shield=Math.max(p.shield||0,shieldAmt);
    p.buffs=(p.buffs||[]).filter(b=>!b.holyShield);
    p.buffs.push({shield:true,holyShield:true,time:C.q.shieldDuration});
    fx('q3',hitRadius,{step:3,leap});
   }
  }
  p.buffs=(p.buffs||[]).filter(b=>!b.holyQ);p.buffs.push({holyQ:true,time:C.q.duration,armor:C.q.armor});
 }
 if(s.kind==='holy-aura'){p.holyAuraTime=C.aura.duration+(s.rank-1);fx('aura',C.aura.radius);}
 if(s.kind==='holy-form'){const ratio=p.hp/ctx.stats(p).hp;p.holyMounted=true;p.holyFormCooldown=s.cooldown;p.cooldowns[s.id]=0;p.hp=ctx.stats(p).hp*ratio;fx('ascend',110);}
}
export function tickPaladins(r,dt,ctx,active=true){for(const u of [...r.players,...r.troops])u.holyAura=null;
 for(const p of r.players){if(p.classId!=='paladin')continue;p.holyAuraTime=Math.max(0,(p.holyAuraTime||0)-dt);p.holyQLock=Math.max(0,(p.holyQLock||0)-dt);p.holyLeapTime=Math.max(0,(p.holyLeapTime||0)-dt);if(p.holyQCharge){p.holyQCharge.delay-=dt;p.castAnim=Math.max(p.castAnim||0,.2);if(p.hp<=0||!active){p.holyQCharge=null;}else if(p.holyQCharge.delay<=0){const q=p.holyQCharge;p.holyQCharge=null;p.castAnim=.55;p.castCount=(p.castCount||0)+1;p.holyLeapTime=.32;p.holyLeapDuration=.32;if(ctx.move){ctx.move(p,p.x+q.ax*C.q.mountedLeap,p.y+q.ay*C.q.mountedLeap,C.q.mountedLeap);p.face=q.ax<0?-1:1;}const waveDist=260;for(const e of r.enemies){if(e.hp<=0)continue;const dx=e.x-p.x,dy=e.y-p.y,proj=dx*q.ax+dy*q.ay,perp=Math.abs(-dx*q.ay+dy*q.ax);if((distance(p,e)<=q.range||proj>=0&&proj<=waveDist&&perp<=130)&&(!ctx.clearLine||ctx.clearLine(p,e))){ctx.damage(e,q.power,p);if(e.hp>0&&ctx.status)ctx.status(e,{stun:.4},p,ctx.stats(p).power);}}const maxHp=ctx.stats(p).hp,shieldAmt=Math.round(maxHp*C.q.mountedShieldRatio);p.shield=Math.max(p.shield||0,shieldAmt);p.buffs=(p.buffs||[]).filter(b=>!b.holyShield);p.buffs.push({shield:true,holyShield:true,time:C.q.mountedShieldDuration});ctx.fx({type:'holy-vfx',action:'q3',skill:'holy-slash',angle:Math.atan2(q.ay,q.ax),sourceId:p.id,x:p.x,y:p.y,radius:q.range,mounted:true,waveDist});}}if(p.holyQStep>0){p.holyQWindow=Math.max(0,(p.holyQWindow||0)-dt);if(p.holyQWindow<=0){p.holyQStep=0;p.cooldowns['holy-slash']=Math.max(p.cooldowns['holy-slash']||0,p.holyQCooldown||7);}}if(p.holyMounted){const rRank=(p.skills?.['holy-ascend']||1)-1,drain=Math.max(4,C.manaDrain-rRank*.8);if(active)p.energy=Math.max(0,p.energy-drain*dt);if(p.energy<=0||p.hp<=0||!active)endHolyForm(p,ctx);}if(p.hp<=0)continue;const eRank=Math.max(0,(p.skills?.['holy-aura']||1)-1),enhanced=p.holyMounted&&p.skills?.['holy-aura']>0;if(!enhanced&&!(p.holyAuraTime>0))continue;const radius=(enhanced?C.aura.mountedRadius:C.aura.radius)+eRank*8,armor=(enhanced?C.aura.mountedArmor:C.aura.armor)+eRank,reduction=Math.min(.45,(enhanced?C.aura.mountedReduction:C.aura.reduction)+eRank*.015),healRate=C.aura.healPerSecond+eRank*.0025;for(const u of [...r.players,...r.troops])if(u.hp>0&&distance(p,u)<=radius){const old=u.holyAura;u.holyAura={armor:Math.max(old?.armor||0,armor),reduction:Math.max(old?.reduction||0,reduction),enhanced:!!(old?.enhanced||enhanced),healPerSecond:Math.max(old?.healPerSecond||0,enhanced?healRate:0)};if(enhanced)u.holyAura.healPerSecond=Math.max(old?.healPerSecond||0,healRate);}}
 for(const u of [...r.players,...r.troops])if(u.hp>0&&u.holyAura?.healPerSecond){const max=u.hero?ctx.stats(u).hp:u.maxHp;u.holyHealClock=(u.holyHealClock||0)+dt;while(u.holyHealClock>=1-1e-9){u.holyHealClock-=1;ctx.heal(u,max*u.holyAura.healPerSecond,max);}}
}
