// Cosmetic work only; terrain geometry, collision and weather gameplay stay unchanged.
export function updateSceneryBudget(scene,time){
 let b=scene.sceneryBudget;
 if(!b||time<b.last)b=scene.sceneryBudget={last:time,meanFrame:16.7,quality:1,busySince:null,quietSince:null};
 const delta=time-b.last;b.last=time;
 if(delta>0&&delta<250)b.meanFrame+=(delta-b.meanFrame)*.05;
 const busy=(scene.secondaryFXRatio??1)<.75||b.meanFrame>25;
 if(busy){b.quietSince=null;b.busySince??=time;if(time-b.busySince>=1000)b.quality=.6;}
 else{b.busySince=null;b.quietSince??=time;if(time-b.quietSince>=3000)b.quality=1;}
 return b;
}
const particleWeight=kind=>kind==='rain'?1.5:kind==='snow'?1:kind==='wind'?1/7:.5;
export function weatherParticlePlan(kinds,viewCount,width,height,quality=1){
 const plan=new Map();if(!viewCount||!kinds.length)return plan;
 const density=Math.max(1,Math.ceil(Math.min(85,Math.max(40,Math.ceil(width*height/14000)))/viewCount));
 const slots=[];
 for(let view=0;view<viewCount;view++)for(const kind of kinds){const desired=Math.ceil(density*particleWeight(kind));slots.push({view,kind,desired});}
 const demand=slots.reduce((n,s)=>n+s.desired,0),limit=Math.min(demand,Math.floor(160*quality)),ratio=limit/demand;
 let remaining=limit;
 for(const slot of slots){slot.count=Math.floor(slot.desired*ratio);remaining-=slot.count;}
 // Largest remainders share a single screen budget across every layer and viewport.
 const ranked=[...slots].sort((a,b)=>(b.desired*ratio-b.count)-(a.desired*ratio-a.count));
 for(let i=0;i<remaining;i++)ranked[i].count++;
 for(const slot of slots)plan.set(slot.view+':'+slot.kind,slot);
 return plan;
}
const CELL=512;
function viewCells(views){const cells=new Set();for(const v of views){for(let x=Math.floor((v.x-160)/CELL);x<=Math.floor((v.right+160)/CELL);x++)for(let y=Math.floor((v.y-160)/CELL);y<=Math.floor((v.bottom+160)/CELL);y++)cells.add(x+':'+y);}return cells;}
export function indexStaticScenery(scene,objects,views=[]){
 if(!scene._staticSceneryCleanup){scene._staticSceneryCleanup=true;scene.events?.once('shutdown',()=>{for(const obj of scene.staticSceneryIndex?.items||[])obj.destroy?.();scene.staticSceneryIndex=null;scene._staticSceneryCleanup=false;});}
 const grid=new Map(),items=new Set();
 for(const obj of objects){
  if(!['Image','Text','Sprite'].includes(obj.type)||obj.visible===false||typeof obj.getBounds!=='function')continue;
  const b=obj.getBounds();if(![b.x,b.y,b.width,b.height].every(Number.isFinite))continue;
  items.add(obj);obj.setVisible(false);if(!obj.parentContainer)scene.children?.remove(obj);
  for(let x=Math.floor((b.x-24)/CELL);x<=Math.floor((b.x+b.width+24)/CELL);x++)for(let y=Math.floor((b.y-24)/CELL);y<=Math.floor((b.y+b.height+24)/CELL);y++){
   const key=x+':'+y;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(obj);
  }
 }
 scene.staticSceneryIndex={grid,items,active:new Set(),cells:new Set()};updateStaticScenery(scene,views);
}
export function updateStaticScenery(scene,views){
 const index=scene.staticSceneryIndex;if(!index)return;
 const cells=viewCells(views);
 if(cells.size===index.cells.size&&[...cells].every(k=>index.cells.has(k)))return;
 const active=new Set();for(const key of cells)for(const obj of index.grid.get(key)||[])active.add(obj);
 for(const obj of index.active)if(!active.has(obj)){obj.setVisible(false);if(!obj.parentContainer)scene.children?.remove(obj);}
 for(const obj of active)if(!index.active.has(obj)){if(!obj.parentContainer)scene.children?.add(obj);obj.setVisible(true);}
 index.active=active;index.cells=cells;
}
