// Logical actions may come from replacement artwork, not the base catalog.
export function resolveActorAnimation(info,requested,direction=0){
 const actions=info?.actions||{},valid=key=>actions[key]&&typeof actions[key]==='object',name=valid(requested)?requested:valid('idle')?'idle':Object.keys(actions).find(valid);
 if(!name)return null;const metadata=actions[name],rows=Number.isFinite(metadata?.rows)?Math.max(1,Math.floor(metadata.rows)):1;
 return {name,metadata,row:rows>1?Math.max(0,Math.min(direction||0,rows-1)):0};
}
