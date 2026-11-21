// Fixed simulation steps; elapsed wall time is accumulated rather than discarded.
export function createFixedStepper({stepMs=50,maxSteps=4,now=0}={}){
 let deadline=now+stepMs;
 return {advance(time,step){let count=0;while(time>=deadline&&count<maxSteps){step(stepMs/1000,count);deadline+=stepMs;count++;}if(time>=deadline&&count===maxSteps)deadline=time+stepMs;return count;},delay(time){return Math.max(1,deadline-time);}};
}
export function advanceRooms(rooms,dt,index,{tick,record}){
 for(const r of rooms.values()){if(r.phase==='lobby'||r.players?.length&&r.players.every(p=>p.disconnectedUntil))continue;const previous=index?r.events:[];tick(r,dt);if(previous.length)r.events=previous.concat(r.events);if(['clear','victory','defeat'].includes(r.phase)&&!r.recorded)record(r);}
}
