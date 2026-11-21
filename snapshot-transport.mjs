// Keep a single pending world state while the preceding snapshot is in flight.
// Events from replaced states are retained by ID; overload disconnects explicitly.
export function sendSnapshot(ws,state,encoded=JSON.stringify(state)){
 if(ws.readyState!==1)return;
 if(ws.pendingSnapshot){
  const events=new Map((ws.pendingSnapshot?.events||[]).map(e=>[e.id,e]));
  for(const e of state.events||[])events.set(e.id,e);
  if(events.size>2048){ws.close(1013,'Client is too slow');return;}
  state={...state,events:[...events.values()]};encoded=JSON.stringify(state);ws.pendingSnapshot=null;
 }
 if(ws.snapshotSending||ws.bufferedAmount>32768){ws.pendingSnapshot=state;return;}
 ws.snapshotSending=true;
 const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ws._socket?.remoteAddress);
 ws.send(encoded,{compress:!local},error=>{
  ws.snapshotSending=false;
  if(error){ws.pendingSnapshot=null;return;}
  const pending=ws.pendingSnapshot;ws.pendingSnapshot=null;
  if(pending)sendSnapshot(ws,pending);
 });
}
