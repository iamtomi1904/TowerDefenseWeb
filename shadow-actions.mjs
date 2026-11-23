import {randomUUID} from 'node:crypto';import {SHADOW} from './public/shadow-config.js';import {distanceToSegment} from './public/content.js';import {applyStatus} from './abilities.mjs';import {launch} from './projectiles.mjs';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function aimOf(p){const x=p.input?.aimX??p.face??1,y=p.input?.aimY||0,d=Math.hypot(x,y)||1;return {x:x/d,y:y/d};}
export function summonSpirit(r,p,ctx){for(const t of r.troops)if(t.type==='forest-spirit'&&t.owner===p.id)t.hp=0;const c=SHADOW.spirit,rank=Math.max(1,p.skills?.['elf-spirit']||1),hp=Math.round(c.hp*(1+(rank-1)*.18)),power=ctx.stats(p).power*c.powerRatio*(1+(rank-1)*.18),t={id:randomUUID(),owner:p.id,type:'forest-spirit',sprite:'forest-spirit',x:p.x,y:p.y+28,hp,maxHp:hp,power,cd:0,anim:0,face:p.face,summoned:true,lifetime:c.lifetime+(rank-1)*4,born:r.elapsed,spiritCooldowns:{root:2,leaves:4,heal:6}};r.troops.push(t);ctx.fx({type:'shadow-vfx',action:'summon',sourceId:t.id,x:t.x,y:t.y,radius:80,color:0xb6a0e6});return t;}
export function tickSpirit(r,t,dt,ctx){const p=r.players.find(p=>p.id===t.owner);if(!p){t.hp=0;return;}const c=SHADOW.spirit;t.hp=Math.min(t.maxHp,t.hp+t.maxHp*c.regen*dt);t.cd=Math.max(0,t.cd-dt);t.anim=Math.max(0,t.anim-dt);t.castAnim=Math.max(0,(t.castAnim||0)-dt);for(const k of Object.keys(t.spiritCooldowns))t.spiritCooldowns[k]=Math.max(0,t.spiritCooldowns[k]-dt);const enemies=r.enemies.filter(e=>e.hp>0&&!e.animal&&(!e.neutral||e.aggro>0)&&distance(e,t)<c.vision).sort((a,b)=>distance(t,a)-distance(t,b)),target=enemies[0];const fx=(action,x=t.x,y=t.y,radius=80)=>ctx.fx({type:'shadow-vfx',action,sourceId:t.id,x,y,radius,color:0xb6a0e6});
 if(t.spiritCooldowns.root<=0&&enemies.some(e=>!e.flying&&distance(t,e)<c.root.radius)){t.spiritCooldowns.root=c.root.cooldown;for(const e of enemies)if(!e.flying&&distance(t,e)<c.root.radius){ctx.damage(e,t.power*c.root.mult,p,'summon');applyStatus(e,{stun:c.root.stun},p,t.power);}t.anim=.35;t.castAnim=.45;fx('roots',t.x,t.y,c.root.radius);}
 if(t.spiritCooldowns.leaves<=0&&target){t.spiritCooldowns.leaves=c.leaves.cooldown;for(const e of enemies.filter(e=>distance(t,e)<c.leaves.range).slice(0,c.leaves.targets))launch(r,t,e,()=>{ctx.damage(e,t.power*c.leaves.mult,p,'summon');fx('leaf-hit',e.x,e.y,30);},{projectileType:'leaf',color:0xb6e3ce});t.anim=.35;}
 if(t.spiritCooldowns.heal<=0){const allies=[...r.players,...r.troops].filter(a=>a.hp>0&&distance(t,a)<c.heal.radius&&a.hp<(a.hero?ctx.stats(a).hp:a.maxHp));if(allies.length){t.spiritCooldowns.heal=c.heal.cooldown;for(const a of allies){const max=a.hero?ctx.stats(a).hp:a.maxHp;ctx.heal(a,max*c.heal.fraction,max);}t.castAnim=.55;fx('bloom',t.x,t.y,c.heal.radius);}}
 if(target&&!target.flying){if(distance(t,target)>c.range)ctx.moveUnit(t,target.x,target.y,c.speed,dt);else if(t.cd<=0){t.cd=c.cooldown;t.anim=.32;t.face=target.x<t.x?-1:1;ctx.damage(target,t.power,p,'summon');fx('branch',target.x,target.y,45);}}else if(distance(t,p)>70)ctx.moveUnit(t,p.x-35*(p.face||1),p.y+20,c.speed,dt);
}
export function tickShadow(r,dt,ctx){const dashes=[];for(const d of r.shadowDashes||[]){const p=r.players.find(p=>p.id===d.owner);if(!p||p.hp<=0){if(p){p.dashing=false;p.assassinRTime=0;}continue;}const from={x:p.x,y:p.y};const step=Math.min(dt,d.remaining)/d.duration*d.range;ctx.move(p,p.x+d.dx*step,p.y+d.dy*step,step);d.remaining-=dt;p._inAssassinR=true;try{for(const e of r.enemies)if(e.hp>0&&!e.flying&&!d.hits.includes(e.id)&&distanceToSegment(e.x,e.y,[from.x,from.y],[p.x,p.y])<=d.radius&&(!ctx.clearLine||ctx.clearLine(p,e))){d.hits.push(e.id);const wasBleeding=e.statuses?.bleed?.time>0;ctx.damage(e,ctx.stats(p).power*d.mult,p);if(e.hp>0){e.windAirTime=Math.max(e.windAirTime||0,.5);e.tideLiftDuration=.5;e.stun=Math.max(e.stun||0,.5);if(wasBleeding)e.assassinWeakenTime=4;}}}finally{p._inAssassinR=false;}ctx.fx({type:'shadow-vfx',action:'dash-slash',sourceId:p.id,x:p.x,y:p.y,fromX:from.x,fromY:from.y,angle:Math.atan2(d.dy,d.dx),radius:d.radius,color:0xd6e8b7});if(d.remaining>0&&distance(from,p)>step*.3)dashes.push(d);else{p.dashing=false;p.assassinRTime=0;}}r.shadowDashes=dashes;
 const zones=[];
 for(const z of r.shadowZones||[]){
  const p=r.players.find(p=>p.id===z.owner);if(!p)continue;
  const step=Math.min(dt,Math.max(0,z.delay));z.delay=Math.max(0,z.delay-step);z.elapsed=Math.min(z.fallDuration,z.elapsed+step);z.clock+=step;
  while(z.clock+1e-8>=z.interval){z.clock=Math.max(0,z.clock-z.interval);for(const e of r.enemies)if(e.hp>0&&distance(e,z)<=z.radius)ctx.damage(e,ctx.stats(p).power*z.fallMult,p,'zone');}
  if(z.delay<=1e-8){
   for(const e of r.enemies)if(e.hp>0&&distance(e,z)<=z.radius){ctx.damage(e,ctx.stats(p).power*z.mult,p);applyStatus(e,{stun:1},p,ctx.stats(p).power);}
   ctx.fx({type:'shadow-vfx',action:'moonfall',x:z.x,y:z.y,radius:z.radius,duration:.95,color:0xc39af3});
  }else zones.push(z);
 }
 r.shadowZones=zones;
}
export function beginMoonfall(r,p,s,center,ctx){
 const duration=s.delay||3;const z={id:ctx.id(),owner:p.id,...center,radius:s.radius,mult:s.mult,stun:1,delay:duration,fallDuration:duration,elapsed:0,interval:s.fallInterval||.5,fallMult:s.fallMult||.35,clock:0};
 r.shadowZones||=[];r.shadowZones.push(z);ctx.fx({type:'shadow-vfx',action:'eclipse-warn',...center,radius:s.radius,duration,stateDriven:true,color:0xc39af3});return z;
}
