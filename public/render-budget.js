// Rendering only: these helpers never change authoritative combat state.
export function renderViews(scene){
 const cameras=scene.cameras?.cameras||[scene.cameras?.main];
 const views=cameras.filter(c=>c&&c.visible!==false).map(c=>c.worldView).filter(v=>v&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&v.width>0&&v.height>0);
 return views.length?views:null; // Preview/test scenes without cameras retain full rendering.
}
export function visibleBox(views,x,y,rx=0,ry=rx){
 return !views||views.some(v=>x+rx>=v.x&&x-rx<=v.x+v.width&&y+ry>=v.y&&y-ry<=v.y+v.height);
}
export function unitInView(views,u,localId){return u.id===localId||visibleBox(views,u.x,u.y,Math.max(180,u.size||0),Math.max(320,(u.altitude||0)+(u.windLift||0)+180));}
export function effectInView(scene,v,views=renderViews(scene)){
 const e=v.e||v,follow=v.painted?.follow||v.kind==='channel'||['charge','thrust','finisher','grow','shrink','slash','dash','guard','whirl','veil'].includes(e.action),owner=follow?scene.actorObjects?.get(e.sourceId)?.sprite:null,target=scene.actorObjects?.get(e.targetId)?.sprite;
 const xs=[e.x,e.tx,e.fromX,...(e.points||[]).map(p=>p.x),owner?.x,target?.x].filter(Number.isFinite),ys=[e.y,e.ty,e.fromY,...(e.points||[]).map(p=>p.y),owner?.y,target?.y].filter(Number.isFinite);
 if(!xs.length||!ys.length)return true;
 const r=Math.max(100,e.radius||v.radius||e.size||150),meteor=v.fall||v.kind==='meteor'||e.type==='meteor-fall';
 const minX=Math.min(...xs)-r*1.5-(meteor?400:0),maxX=Math.max(...xs)+r*1.5;
 const minY=Math.min(...ys)-r*1.5-(meteor?700:280),maxY=Math.max(...ys)+r*1.5;
 return visibleBox(views,(minX+maxX)/2,(minY+maxY)/2,(maxX-minX)/2,(maxY-minY)/2);
}
// Traverse ownership records, stopping at Phaser display objects (never their scene/parent).
export function setRenderDormant(record,dormant){
 if(!!record.renderDormant===dormant)return false;
 record.renderDormant=dormant;
 if(dormant){
  const hidden=[],seen=new Set();
  function visit(value,depth){
   if(!value||typeof value!=='object'||seen.has(value)||depth>5)return;seen.add(value);
   if(typeof value.setVisible==='function'){
    hidden.push({value,visible:value.visible!==false,paused:value.anims?.isPaused});value.setVisible(false);value.anims?.pause();return;
   }
   if(value instanceof Map||Array.isArray(value)){for(const child of value.values())visit(child,depth+1);return;}
   if(Object.getPrototypeOf(value)!==Object.prototype)return;
   for(const [key,child]of Object.entries(value))if(!['e','scene','renderHidden','layout'].includes(key))visit(child,depth+1);
  }
  visit(record,0);record.renderHidden=hidden;
 }else{
  for(const {value,visible,paused}of record.renderHidden||[])if(value.scene!==null&&value.scene!==undefined&&!value.destroyed){value.setVisible(visible);if(paused===false)value.anims?.resume();}
  record.renderHidden=null;
 }
 return true;
}
export const SECONDARY_ROLES=new Set(['snow','streak','ember','foam','rain-poison','ice-fragment']);
export function prepareEffectBudget(scene,views=renderViews(scene),limit=384){
 let demand=0;
 for(const v of scene.liveVFX||[])if(v.age<v.duration&&effectInView(scene,v,views))demand+=v.painted?.secondaryCount||0;
 scene.secondaryFXRatio=demand>limit?limit/demand:1;
}
export function secondaryVisible(index,ratio){return ratio>=1||Math.floor((index+1)*ratio)>Math.floor(index*ratio);}
