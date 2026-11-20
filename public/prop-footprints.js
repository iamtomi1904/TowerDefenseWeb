// Ground contact footprints only. Sprite height and canopy never affect collisions.
export function propFootprint(prop){
 const original=Math.max(0,prop.radius||0);if(!original)return {x:prop.x,y:prop.y,rx:0,ry:0};
 if(Number.isFinite(prop.footprintY))return {x:prop.x,y:prop.y,rx:original,ry:prop.footprintY};
 const id=prop.asset||'';
 const cap=id==='prop-ancient-oak'?19:id==='prop-giant-boulder'?16:id==='prop-ice-boulder'?12:/tree|oak|pine|willow|palm|sakura/.test(id)?10:10;
 const rx=Math.max(2,Math.min(cap,Math.round(original*.55)));
 return {x:prop.x,y:prop.y,rx,ry:Math.max(2,Math.round(rx*.55))};
}
export function normalizePropFootprints(props){return props.map(prop=>{const f=propFootprint(prop);return {...prop,radius:f.rx,footprintY:f.ry};});}
export function propBlocks(prop,x,y,unitRadius=12){const f=propFootprint(prop);if(!f.rx)return false;return Math.hypot((x-f.x)/(f.rx+unitRadius),(y-f.y)/(f.ry+unitRadius))<1;}
