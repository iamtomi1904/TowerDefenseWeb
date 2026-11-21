import {move} from './shared-movement.js';
export class MovementTimeline{
 constructor(){this.reset();}
 reset(){this.samples=new Map();this.latest=0;this.received=0;this.stage=null;this.offset=Infinity;this.cursor=-Infinity;this.delay=100;}
 push(state,now){
  if(this.stage!==state.stage){this.reset();this.stage=state.stage;}
  this.delay=state.snapshotHz?Math.max(100,1500/state.snapshotHz):100;
  const at=state.serverTime??(state.tick||0)*50;if(at<this.latest)return;
  this.latest=at;this.received=now;const offset=now-at;if(!Number.isFinite(this.offset)||offset<this.offset||offset-this.offset>1000)this.offset=offset;else this.offset+=(offset-this.offset)*.01;const live=new Set();
  for(const u of [...state.players,...state.enemies,...state.troops]){live.add(u.id);let list=this.samples.get(u.id)||[];if(list.length&&Math.hypot(u.x-list.at(-1).x,u.y-list.at(-1).y)>150)list=[];if(list.at(-1)?.at===at)list.pop();list.push({at,x:u.x,y:u.y});if(list.length>8)list.shift();this.samples.set(u.id,list);}
  for(const id of this.samples.keys())if(!live.has(id))this.samples.delete(id);
 }
 target(u,now){if(u.dashing||u.guardianR||u.martialLeap||u.holyLeapTime>0||u.hp<=0){this.samples.set(u.id,[{at:this.latest,x:u.x,y:u.y}]);return u;}const list=this.samples.get(u.id);if(!list?.length)return u;const time=Math.min(this.latest,Math.max(this.cursor,now-this.offset-this.delay));this.cursor=time;let a=list[0];for(const b of list){if(b.at>=time){const t=Math.max(0,Math.min(1,(time-a.at)/(b.at-a.at||1)));return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}a=b;}return a;}
}
export function predictLocal(obj,u,input,dt,map,now,received,serverTime=0){
 const special=u.hp<=0||u.stun>0||u.gemStun>0||u.windAirTime>0||u.dashing||u.guardianR||u.martialLeap||u.holyLeapTime>0||u.vanguardPose==='flurry'||u.martialLock>0&&!['dual-storm','bloodstorm'].includes(u.martialPose);
 if(!obj.predicted||special||Math.hypot(obj.predicted.x-u.x,obj.predicted.y-u.y)>100){obj.predicted={x:u.x,y:u.y};obj.predictedHistory=[];obj.predictionError=null;}
 const p=obj.predicted;
 if(special){obj.predictedMoving=false;return p;}
 if(obj.predictedState!==u){obj.predictedState=u;const history=obj.predictedHistory||[];let reference=p;for(let i=1;i<history.length;i++){const a=history[i-1],b=history[i];if(a.at<=serverTime&&b.at>=serverTime){const t=(serverTime-a.at)/(b.at-a.at||1);reference={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};break;}}obj.predictionError={x:u.x-reference.x,y:u.y-reference.y};}
 const step=Math.min(50,Math.max(0,dt))/1000;
 const correction=1-Math.exp(-step/.15),err=obj.predictionError;
 if(err){const next={...u,x:p.x,y:p.y};move(next,p.x+err.x*correction,p.y+err.y*correction,Math.hypot(err.x,err.y)*correction/(step||1),step,map);p.x=next.x;p.y=next.y;err.x*=1-correction;err.y*=1-correction;}
 if(now-received>250)return p;
 const x=input.x,y=input.y,len=Math.max(1,Math.hypot(x,y)),next={...u,x:p.x,y:p.y};
 move(next,p.x+x/len*20,p.y+y/len*20,(u.stats?.speed||0)*(input.guard?.45:1)*(u.bossSlow>0?(u.bossSlowFactor??.5):1),step,map);obj.predictedMoving=Math.hypot(next.x-p.x,next.y-p.y)>.001;p.x=next.x;p.y=next.y;const history=obj.predictedHistory??=[];history.push({at:serverTime+Math.min(250,Math.max(0,now-received)),x:p.x,y:p.y});if(history.length>90)history.shift();return p;
}
