// Compile walkable floor connections from authored terrain and road corridors.
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
const area=p=>p.reduce((v,a,i)=>{const b=p[(i+1)%p.length];return v+a[0]*b[1]-b[0]*a[1];},0)/2;
const inside=(x,y,p)=>{let v=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])v=!v;}return v;};
function clip(subject,mask){let out=subject;const sign=area(mask)>=0?1:-1;for(let i=0;i<mask.length&&out.length;i++){const a=mask[i],b=mask[(i+1)%mask.length],input=out;out=[];for(let j=0;j<input.length;j++){const p=input[j],q=input[(j+1)%input.length],cp=cross(a,b,p)*sign,cq=cross(a,b,q)*sign;if(cp>=-1e-7)out.push(p);if((cp>=0)!==(cq>=0)){const t=cp/(cp-cq);out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}}}return out;}
export function buildTerrainTopology(geo,size){
 if(!geo)return undefined;const unit=geo.surface?.heightPerLevel||64;
 const surfaces=geo.regions.map((r,i)=>({id:'region-'+i,name:r.name,level:r.level,height:r.level*unit,polygon:r.polygon}));
 const floor=(x,y)=>{let hit;for(const s of surfaces)if(inside(x,y,s.polygon)&&(!hit||s.level>hit.level))hit=s;return hit||{id:'ground',height:0,level:0};};
 const transitions=[];
 for(const f of geo.faces){const top=[(f.top[0][0]+f.top[1][0])/2,(f.top[0][1]+f.top[1][1])/2],base=[(f.base[0][0]+f.base[1][0])/2,(f.base[0][1]+f.base[1][1])/2],dx=top[0]-base[0],dy=top[1]-base[1],low=floor(base[0]-dx*.15,base[1]-dy*.15),high=floor(top[0]+dx*.15,top[1]+dy*.15);if(low.id===high.id||low.height===high.height)continue;
  for(let ri=0;ri<geo.roads.length;ri++){const road=geo.roads[ri],r=road.width/2+18;for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],vx=b[0]-a[0],vy=b[1]-a[1],len=Math.hypot(vx,vy);if(!len)continue;
   if(Math.max(a[0],b[0])+r<f.bounds[0]||Math.min(a[0],b[0])-r>f.bounds[2]||Math.max(a[1],b[1])+r<f.bounds[1]||Math.min(a[1],b[1])-r>f.bounds[3])continue;
   const nx=-vy/len*r,ny=vx/len*r,ex=vx/len*3,ey=vy/len*3,corridor=[[a[0]-ex+nx,a[1]-ey+ny],[b[0]+ex+nx,b[1]+ey+ny],[b[0]+ex-nx,b[1]+ey-ny],[a[0]-ex-nx,a[1]-ey-ny]],polygon=clip(f.quad,corridor);if(polygon.length<3||Math.abs(area(polygon))<1)continue;
   transitions.push({id:f.id+'-r'+ri+'-'+i,kind:'ramp',from:low.id,to:high.id,fromHeight:low.height,toHeight:high.height,base,top,polygon,heightQuad:[f.top[0],f.top[1],f.base[1],f.base[0]]});
  }}
 }
 const bridges=geo.decks.map(d=>{const [x,y,w,h]=d.rect,a=w>=h?[x-8,y+h/2]:[x+w/2,y-8],b=w>=h?[x+w+8,y+h/2]:[x+w/2,y+h+8],from=floor(...a),to=floor(...b);return{id:'bridge-'+d.id,kind:'bridge',from:from.id,to:to.id,fromHeight:from.height,toHeight:to.height,base:a,top:b,polygon:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]};});
 const cell=5,width=Math.ceil(size[0]/cell),height=Math.ceil(size[1]/cell),data=new Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const s=floor((x+.5)*cell,(y+.5)*cell);data[y*width+x]=s.id==='ground'?0:surfaces.indexOf(s)+1;}
 return{version:2,base:{id:'ground',name:'Đất nền',height:0,level:0},maxStepHeight:geo.surface?.maxStepHeight||18,surfaces,surfaceGrid:{width,height,cell,data},barriers:geo.faces.map(f=>({id:f.id,polygon:f.quad})),transitions,bridges};
}
