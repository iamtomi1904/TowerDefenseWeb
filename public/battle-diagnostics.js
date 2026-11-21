export function createBattleDiagnostics(socket,report){
 let lastFrame=performance.now(),lastState=lastFrame,lastReport=-Infinity,stage=null;
 const entries=[];
 function record(kind,error){const now=performance.now();if(document.hidden||now-lastReport<5000)return;lastReport=now;const entry={kind,stage,frameAge:Math.round(now-lastFrame),stateAge:Math.round(now-lastState),message:String(error?.message||error||'').slice(0,300),stack:String(error?.stack||'').slice(0,1800)};entries.push(entry);if(entries.length>20)entries.shift();console.error('battle-diagnostic',entry);report(kind==='client-error'?'Lỗi hiển thị: '+entry.message:kind==='render-stalled'?'Vòng vẽ đã dừng. Mở F12 → Console để xem lỗi.':'Đang chờ dữ liệu trận từ server…');if(socket.readyState===1)socket.send(JSON.stringify({type:'client-diagnostic',...entry}));}
 const onError=e=>record('client-error',e.error||e.message),onReject=e=>record('client-error',e.reason);
 window.addEventListener('error',onError);window.addEventListener('unhandledrejection',onReject);
 document.addEventListener('visibilitychange',()=>{lastFrame=lastState=performance.now();});
 const timer=setInterval(()=>{const now=performance.now();if(stage===null||document.hidden)return;if(now-lastFrame>3000)record('render-stalled','No render update');else if(now-lastState>5000)record('state-stalled','No snapshot');},2000);
 window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});window.battleDiagnostics=entries;
 return {frame(){lastFrame=performance.now();},state(m){lastState=performance.now();stage=m.stage;}};
}
