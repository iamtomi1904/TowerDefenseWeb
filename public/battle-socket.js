// Stable facade: HUD and input handlers keep the same reference across reconnects.
export function createBattleSocket(url){
 let ws,timer,lastPacket=Date.now(),attempt=0,identity=null,stopped=false,phase=null,resumeError=null;
 const api={get readyState(){return ws?.readyState??3;},send(data){if(ws?.readyState===1)ws.send(data);},onopen:null,onclose:null,onmessage:null,onerror:null};
 function connect(){if(stopped)return;ws=new WebSocket(url);lastPacket=Date.now();
 ws.onopen=e=>{lastPacket=Date.now();if(identity)ws.send(JSON.stringify({type:'resume',...identity}));else api.onopen?.(e);};
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch{return;}if(m.type==='state'||m.type==='joined')lastPacket=Date.now();if(m.type==='state')phase=m.phase;if(m.type==='joined'){identity={code:m.code,id:m.id};attempt=0;}if(m.type==='resume-failed'){stopped=true;resumeError=m.error;api.onmessage?.({data:JSON.stringify({error:'Không thể khôi phục trận: '+m.error})});ws.close();return;}api.onmessage?.(e);};
 ws.onclose=e=>{api.onclose?.(resumeError?{code:4002,reason:resumeError}:e);if(e.code===4001){stopped=true;return;}if(identity&&!stopped){clearTimeout(timer);timer=setTimeout(connect,Math.min(5000,500*2**Math.min(attempt++,4)));}};
 ws.onerror=e=>api.onerror?.(e);
 }
 connect();const watchdog=setInterval(()=>{if(identity&&['prepare','battle'].includes(phase)&&ws?.readyState===1&&Date.now()-lastPacket>10000){console.warn('battle-socket-stall',{silenceMs:Date.now()-lastPacket,buffered:ws.bufferedAmount});ws.close(4000,'Snapshot timeout');}},2000);
 window.addEventListener('pagehide',()=>{stopped=true;clearTimeout(timer);clearInterval(watchdog);ws?.close();},{once:true});return api;
}
