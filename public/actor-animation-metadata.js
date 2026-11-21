// Logical actions may come from replacement artwork, not the base catalog.
export function resolveActorAnimation(info,requested,direction=0){
 const actions=info?.actions||{},name=actions[requested]?requested:actions.idle?'idle':Object.keys(actions)[0];
 if(!name)return null;const metadata=actions[name],rows=Math.max(1,metadata.rows||1);
 return {name,metadata,row:rows>1?Math.max(0,Math.min(direction||0,rows-1)):0};
}
