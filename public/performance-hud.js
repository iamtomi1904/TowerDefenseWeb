// Client frame rate and application-level round-trip latency on the battle socket.
export class BattleMetrics{
 constructor(){this.resetFrames();this.sequence=0;this.pending=null;this.lastSent=-Infinity;this.ping=null;this.lastReply=-Infinity;}
 resetFrames(){this.start=null;this.frames=0;this.fps=null;this.previousFrame=undefined;this.worstFrame=0;}
 frame(now){if(this.previousFrame!==undefined){const gap=now-this.previousFrame;if(gap>=(this.worstFrame||0))this.worstFrame=gap;}this.previousFrame=now;if(this.start===null){this.start=now;return;}this.frames++;const elapsed=now-this.start;if(elapsed>=500){this.fps=Math.round(this.frames*1000/elapsed);this.frames=0;this.start=now;}}
 probe(now){if(now-this.lastSent<2000||this.pending&&now-this.pending.at<5000)return null;this.pending={id:++this.sequence,at:now};this.lastSent=now;return {type:'ping',id:this.sequence};}
 receive(message,now){if(message.type!=='pong'||message.id!==this.pending?.id)return false;const elapsed=now-this.pending.at;this.pending=null;if(elapsed<0||elapsed>5000)return false;this.serverTickMs=message.serverTickMs;this.serverLoopMs=message.serverLoopMs;this.ping=Math.round(elapsed);this.lastReply=now;return true;}
 text(now,connected=true){const ping=connected&&now-this.lastReply<5000?this.ping:null;return `FPS ${this.fps??'—'} · Ping ${ping===null?'—':ping+' ms'}`;}
}
export function createPerformanceHUD(scene,socket){
 const meter=new BattleMetrics(),label=document.getElementById('battle-performance');let lastPaint=-Infinity;
 const reset=()=>{meter.resetFrames();meter.pending=null;meter.ping=null;meter.lastSent=-Infinity;};
 document.addEventListener('visibilitychange',reset);
 scene.events.once('shutdown',()=>document.removeEventListener('visibilitychange',reset));
 return {receive:(message,now)=>meter.receive(message,now),update(now){
  if(document.hidden)return;
  meter.frame(now);const connected=socket.readyState===1;
  if(connected){const probe=meter.probe(now);if(probe)socket.send(JSON.stringify(probe));}
  if(label&&now-lastPaint>=500){lastPaint=now;label.textContent=meter.text(now,connected);label.title='Khung hình chậm nhất: '+Math.round(meter.worstFrame||0)+' ms · Server tick: '+(meter.serverTickMs??'—')+' ms · Server nghẽn: '+(meter.serverLoopMs??'—')+' ms';}
 }};
}
