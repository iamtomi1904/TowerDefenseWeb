export const RECONNECT_GRACE=60000;
export function disconnectPlayer(room,id,now=Date.now()){const p=room.players.find(p=>p.id===id);if(!p)return;p.input={};p.disconnectedUntil=now+RECONNECT_GRACE;return p;}
export function resumePlayer(room,id,accountId,now=Date.now()){const p=room?.players.find(p=>p.id===id&&p.accountId===accountId&&p.disconnectedUntil>now);if(!p)return null;p.input={};delete p.disconnectedUntil;return p;}
export function expireDisconnected(room,now=Date.now()){const expired=room.players.filter(p=>p.disconnectedUntil&&p.disconnectedUntil<=now);const ids=new Set(expired.map(p=>p.id));room.players=room.players.filter(p=>!ids.has(p.id));room.troops=room.troops.filter(t=>!ids.has(t.owner));return expired;}
