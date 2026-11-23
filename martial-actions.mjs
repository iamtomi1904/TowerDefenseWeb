import {aimOf} from './shadow-actions.mjs';
import {coneHits} from './public/combat-geometry.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const event=(ctx,p,action,s,extra={})=>ctx.fx({type:'martial-vfx',action,sourceId:p.id,x:p.x,y:p.y-18,radius:s.radius||75,angle:Math.atan2(aimOf(p).y,aimOf(p).x),dual:!!p.dualSwords,...extra});
function queue(r,p,s,delay,action,extra={}){r.martialActions||=[];r.martialActions.push({owner:p.id,stage:r.stage,skill:s.id,delay,action,s:{...s},aim:aimOf(p),...extra});}
function lock(p,time,pose){p.martialLock=time;p.martialPose=pose;p.castAnim=time;}
export function castMartial(r,p,s,ctx){
 if(p.classId==='ranger'){
  if(s.kind==='poison-enchant'){p.buffs=p.buffs.filter(b=>!b.poisonArrows);p.buffs.push({time:s.duration,poisonArrows:true,poison:s.poison,poisonSlow:s.slow,poisonDuration:s.statusDuration});lock(p,.5,'enchant');event(ctx,p,'poison-enchant',s,{duration:.6});return true;}
  if(s.kind==='arrow-volley'){
   const target=r.enemies.filter(e=>e.hp>0&&distance(p,e)<=s.range).sort((a,b)=>distance(p,a)-distance(p,b))[0],aim=aimOf(p),d=Number.isFinite(p.input?.aimDistance)?Math.min(s.range,Math.max(1,p.input.aimDistance)):s.range;
   lock(p,1.5,'bow-charge');p.castDuration=1.5;event(ctx,p,'bow-charge',s,{duration:1.5,radius:48});const enchant=p.buffs.find(b=>b.poisonArrows&&b.time>0);queue(r,p,s,1.5,'arrow-zone',{poison:enchant?{poison:enchant.poison,slow:enchant.poisonSlow,statusDuration:enchant.poisonDuration}:null,x:target?.x??p.x+aim.x*d,y:target?.y??p.y+aim.y*d});return true;
  }
  return false;
 }
 if(p.classId==='duelist'){
  if(s.kind==='sword-form'){p.dualSwords=!p.dualSwords;if(s.rank>1){p.buffs=p.buffs.filter(b=>!b.stanceShift);p.buffs.push({stanceShift:true,time:3,speed:(s.rank-1)*.04,haste:(s.rank-1)*.04});}lock(p,.5,'draw-swords');event(ctx,p,p.dualSwords?'dual-draw':'single-draw',s,{duration:.7});return true;}
  const dual=!!p.dualSwords;
  if(s.kind==='sword-strike'){
   lock(p,dual?.55:1.1,dual?'cross-cut':'heavy-cut');
   if(dual){const aim=aimOf(p);ctx.move(p,p.x+aim.x*180,p.y+aim.y*180,180);queue(r,p,{...s,mult:s.mult/2.4,radius:125},.12,'sword-hit',{dual:true});queue(r,p,{...s,mult:s.mult/2.4,radius:125},.32,'sword-hit',{dual:true,reverse:true});}
   else{event(ctx,p,'heavy-charge',s,{duration:.8});queue(r,p,s,.8,'sword-hit');}return true;
  }
  if(s.kind==='sword-ultimate'){
   if(dual){lock(p,2.85,'dual-storm');p.castAnim=.9;event(ctx,p,'dual-charge',s,{duration:.9});for(let i=0;i<6;i++)queue(r,p,{...s,mult:s.mult/3.8*.55},.9+i*.25,'sword-hit',{dual:true,reverse:i%2===1,radial:true});queue(r,p,{...s,mult:s.mult/3.8*1.4},2.5,'sword-hit',{dual:true,finisher:true,radial:true});}
   else{
    const aim=aimOf(p),cursor={x:p.x+aim.x*s.range,y:p.y+aim.y*s.range};
    const target=r.enemies.filter(e=>e.hp>0&&!e.flying&&distance(p,e)<=s.range&&(!ctx.clearLine||ctx.clearLine(p,e))).sort((a,b)=>distance(a,cursor)-distance(b,cursor))[0];
    lock(p,1,'single-summon');p.castDuration=1;event(ctx,p,'sword-summon',s,{duration:1,targetX:target?.x??cursor.x,targetY:target?.y??cursor.y});queue(r,p,s,1,'sword-drop',{target:target?.id,x:target?.x??cursor.x,y:target?.y??cursor.y});
   }return true;
  }
 }
 if(p.classId==='ravager'){
  if(s.kind==='blood-rage'){p.buffs=(p.buffs||[]).filter(b=>!b.bloodRage);p.buffs.push({bloodRage:true,time:s.duration,speed:.3});lock(p,.5,'blood-roar');event(ctx,p,'blood-roar',s,{duration:.7});return true;}
  if(s.kind==='blood-cleave'){lock(p,1.3,'blood-cleave');event(ctx,p,'blood-charge',s,{duration:.7});for(let i=0;i<2;i++)queue(r,p,s,.7+i*.3,'blood-hit',{reverse:i===1});return true;}
  if(s.kind==='bloodstorm'){p.bloodstormTime=3.6;lock(p,3.6,'bloodstorm');p.castAnim=.9;event(ctx,p,'blood-charge',s,{duration:.9});for(let i=0;i<6;i++)queue(r,p,s,.9+i*.45,'blood-hit',{radial:true,reverse:i%2===1});return true;}
 }
 if(p.classId==='berserker'){
  if(s.kind==='warrior-cleave'){lock(p,1.05,'axe-cut');event(ctx,p,'axe-charge',s,{duration:.68});queue(r,p,s,.68,'axe-hit',{radial:true});return true;}
  if(s.kind==='warrior-leap'){
   const aim=aimOf(p),range=Number.isFinite(p.input?.aimDistance)?Math.min(s.range,Math.max(0,p.input.aimDistance)):s.range;
   lock(p,1.95,'leap-windup');p.castDuration=1.95;event(ctx,p,'leap-windup',s,{duration:1});queue(r,p,s,1,'leap-start',{x:p.x+aim.x*range,y:p.y+aim.y*range,range});return true;
  }
 }
 return false;
}
export function tickMartial(r,dt,ctx,active){
 const pending=[];
 for(const p of r.players){
  p.martialLock=Math.max(0,(p.martialLock||0)-dt);if(!p.martialLock)p.martialPose=null;
  if(p.martialLeap){p.martialLeap.time=Math.max(0,p.martialLeap.time-dt);const leap=p.martialLeap,t=1-leap.time/leap.duration;ctx.move(p,leap.fromX+(leap.tx-leap.fromX)*t,leap.fromY+(leap.ty-leap.fromY)*t,leap.range*dt/leap.duration+1);if(!p.martialLeap.time||p.hp<=0)p.martialLeap=null;}
  if(p.hp<=0)p.dualSwords=false;
 }
 for(const a of r.martialActions||[]){
  if(a.action==='stun-after-fall'){if(active&&a.stage===r.stage){a.delay-=dt;if(a.delay>1e-8)pending.push(a);else{const e=r.enemies.find(e=>e.id===a.target&&e.hp>0);if(e)e.stun=Math.max(e.stun||0,a.s.stun);}}continue;}
  const p=r.players.find(p=>p.id===a.owner);
  if(!active||a.stage!==r.stage||!p||p.hp<=0){if(p){p.martialLock=0;p.martialPose=null;p.martialLeap=null;p.castAnim=0;p.bloodstormTime=0;}continue;}
  a.delay-=dt;if(a.delay>1e-8){pending.push(a);continue;}
  const s=a.s;
  if(a.action==='stun-after-fall'){const e=r.enemies.find(e=>e.id===a.target&&e.hp>0);if(e)e.stun=Math.max(e.stun||0,s.stun);continue;}
  if(a.action==='sword-drop'){
   const target=r.enemies.find(e=>e.id===a.target&&e.hp>0),center=target?{x:target.x,y:target.y}:{x:a.x,y:a.y};
   event(ctx,p,'sword-descend',s,{...center,duration:.45});pending.push({...a,...center,action:'sword-impact',delay:.45});continue;
  }
  if(a.action==='sword-impact'){
   const center={x:a.x,y:a.y};event(ctx,p,'sword-impact',s,{...center,duration:.75});
   for(const e of r.enemies)if(e.hp>0&&!e.flying&&distance(center,e)<=s.radius&&(!ctx.clearLine||ctx.clearLine(center,e)))ctx.damage(e,ctx.stats(p).power*s.mult,p);continue;
  }
  if(a.action==='arrow-zone'){r.zones.push({id:ctx.id(),owner:p.id,x:a.x,y:a.y,radius:s.radius,remaining:s.duration,delay:0,interval:s.interval,clock:0,skill:s.id,rank:s.rank,fx:s.fx,poison:a.poison});event(ctx,p,'bow-release',s,{duration:.35});continue;}
  if(a.action==='leap-start'){
   p.martialPose='leap';p.martialLeap={time:.65,duration:.65,fromX:p.x,fromY:p.y,tx:a.x,ty:a.y,range:a.range};event(ctx,p,'leap-charge',s,{duration:.65});pending.push({...a,action:'land',delay:.65});continue;
  }
  if(a.action==='land'){
   ctx.move(p,a.x,a.y,s.range);p.martialLeap=null;event(ctx,p,'quake-land',s,{duration:.9,y:p.y});
   for(const e of r.enemies)if(e.hp>0&&!e.flying&&distance(p,e)<=s.radius){ctx.damage(e,ctx.stats(p).power*s.mult,p);if(e.hp<=0)continue;e.windAirTime=.55;e.tideLiftDuration=.55;pending.push({...a,action:'stun-after-fall',target:e.id,delay:.55});}
   continue;
  }
  if(a.dual||a.action==='blood-hit'){p.castCount=(p.castCount||0)+1;p.castAnim=.25;}
  event(ctx,p,a.action==='sword-hit'?(a.finisher?'sword-finish':a.dual?'dual-cut':'heavy-cut'):a.action==='blood-hit'?'blood-cut':'axe-cut',s,{dual:!!a.dual,reverse:!!a.reverse,duration:.45,radial:!!a.radial,angle:Math.atan2(a.aim.y,a.aim.x)});
  const isBloodstorm=s.id==='bloodstorm';
  let bloodstormMult=1,hitAny=false;
  if(isBloodstorm){
   const st=ctx.stats(p),hasteBonus=Math.max(0,.7/st.cooldown-1);
   const rageBuff=p.buffs?.find(b=>b.bloodRage&&b.time>0);
   const rageSteal=p.hp>0&&(p._hpPct??1)<.5?(p.mastery>=2&&(p._hpPct??1)<.15?.3:.15)*(rageBuff?1.5:1):0;
   const buffSteal=p.buffs?.filter(b=>b.time>0).reduce((m,b)=>Math.max(m,b.lifesteal||0),0)||0;
   bloodstormMult=1+hasteBonus*.5+rageSteal+buffSteal;
  }
  p._inBloodstorm=isBloodstorm;
  try{
   for(const e of r.enemies)if(e.hp>0&&!e.flying&&(a.radial?distance(p,e)<=s.radius:coneHits(p,e,a.aim,s.radius,.05))&&(!ctx.clearLine||ctx.clearLine(p,e))){
    hitAny=true;
    ctx.damage(e,ctx.stats(p).power*s.mult*bloodstormMult,p);
    if(a.action==='blood-hit'&&!isBloodstorm)ctx.status(e,{bleed:.2,statusDuration:3},p,ctx.stats(p).power);
    if(a.action==='axe-hit')ctx.status(e,{bleed:.3,statusDuration:4},p,ctx.stats(p).power);
   }
  }finally{p._inBloodstorm=false;}
  if(isBloodstorm&&hitAny)for(const b of p.buffs||[])if(b.bloodRage&&b.time>0)b.time+=.5;
 }
 r.martialActions=pending;
}
