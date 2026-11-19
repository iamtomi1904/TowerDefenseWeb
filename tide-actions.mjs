import {aimOf} from './shadow-actions.mjs';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function tideReduction(r,u){
 if(u.hp<=0||![...r.players,...r.troops].some(a=>a.id===u.id))return 0;
 return Math.max(0,...(r.tideFields||[]).filter(f=>f.stage===r.stage&&f.time>0&&dist(f,u)<=f.radius).map(f=>f.reduction));
}
export function castTide(r,p,s,ctx){
 if(s.id==='frostnova'){
  r.tideWaves||=[];r.tideWaves.push({owner:p.id,stage:r.stage,x:p.x,y:p.y,radius:s.radius,power:ctx.stats(p).power*s.mult,age:0,slow:s.slow,statusDuration:s.statusDuration,hits:[[],[],[]],launched:[true,false,false]});
  ctx.fx({type:'tide-wave',sourceId:p.id,x:p.x,y:p.y-15,radius:s.radius,duration:.6,wave:1});
 }
 if(s.id==='healing-tide'){
  r.tideFields||=[];r.tideFields.push({owner:p.id,stage:r.stage,x:p.x,y:p.y,radius:s.radius,time:s.duration,clock:1,heal:s.heal,reduction:s.reduction});
  ctx.fx({type:'tide-field',sourceId:p.id,x:p.x,y:p.y,radius:s.radius,duration:s.duration});
 }
 if(s.id==='blizzard'){
  const aim=aimOf(p),range=Number.isFinite(p.input?.aimDistance)?Math.max(1,Math.min(s.range,p.input.aimDistance)):s.range;
  const x=p.x+aim.x*range,y=p.y+aim.y*range;
  r.zones.push({id:ctx.id(),owner:p.id,x,y,radius:s.radius,remaining:s.duration,delay:0,interval:s.interval,clock:0,skill:s.id,rank:s.rank,fx:s.fx});
  ctx.fx({type:'aoe',skill:s.id,sourceId:p.id,x,y:y-10,radius:s.radius,duration:s.duration,previewDuration:s.duration,fx:s.fx});
 }
}
export function tickTide(r,dt,ctx,active){
 if(!active){r.tideWaves=[];r.tideFields=[];return;}
 for(const e of r.enemies)if(!(e.windAirTime>0))e.tideLiftDuration=0;
 for(const f of r.tideFields||[]){
  if(f.stage!==r.stage){f.time=0;continue;}
  const elapsed=Math.min(dt,Math.max(0,f.time));f.clock-=elapsed;f.time-=dt;
  while(f.clock<=1e-8){f.clock+=1;for(const u of [...r.players,...r.troops])if(u.hp>0&&dist(u,f)<=f.radius){const max=u.hero?ctx.stats(u).hp:u.maxHp;ctx.heal(u,max*f.heal,max);}}
 }
 r.tideFields=(r.tideFields||[]).filter(f=>f.time>1e-8&&f.stage===r.stage);
 for(const w of r.tideWaves||[]){
  if(w.stage!==r.stage){w.age=99;continue;}
  const owner=r.players.find(p=>p.id===w.owner);if(!owner){w.age=99;continue;}
  const before=w.age;w.age+=dt;
  for(let i=0;i<3;i++){
   const start=i*.45,duration=.6;
   if(!w.launched[i]&&w.age>=start){w.launched[i]=true;ctx.fx({type:'tide-wave',sourceId:w.owner,x:w.x,y:w.y-15,radius:w.radius,duration,wave:i+1});}
   if(w.age<start||before>start+duration)continue;
   const lo=Math.max(0,(before-start)/duration)*w.radius,hi=Math.min(1,(w.age-start)/duration)*w.radius;
   for(const e of r.enemies)if(e.hp>0&&!w.hits[i].includes(e.id)&&dist(e,w)<=w.radius&&dist(e,w)>=lo-12&&dist(e,w)<=hi+12){
    w.hits[i].push(e.id);ctx.damage(e,w.power,owner);ctx.status(e,{slow:w.slow,statusDuration:w.statusDuration},owner,w.power);
    if(e.hp>0&&!e.flying&&w.hits.every(h=>h.includes(e.id))){e.tideLiftDuration=.6;e.windAirTime=Math.max(e.windAirTime||0,.6);e.stun=Math.max(e.stun||0,.6);ctx.fx({type:'tide-lift',x:e.x,y:e.y-15,radius:30,duration:.6});}
   }
  }
 }
 r.tideWaves=(r.tideWaves||[]).filter(w=>w.age<1.5&&w.stage===r.stage);
}
