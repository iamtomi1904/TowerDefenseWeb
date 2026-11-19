import type {SceneData,Point} from '../shared/map-traversal';
export interface Ford {id:string;road:number;water:string;width:number;points:Point[];entry:Point;exit:Point}
export const terrainStyle={roadFringe:12,bankFringe:16,landingLength:48,stairTreadFraction:.78};
const inside=(p:Point,q:Point[])=>{let v=false;for(let i=0,j=q.length-1;i<q.length;j=i++){const a=q[i],b=q[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])v=!v;}return v;};
/** Pixel fringe generated once; collision data is never changed. */
export function softenAlpha(rgba:Uint8ClampedArray,w:number,h:number,radius:number,seed=17):void {
 const d=new Uint16Array(w*h),max=Math.ceil(radius)+1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;d[i]=rgba[i*4+3]<128?0:Math.min(max,x?d[i-1]+1:1,y?d[i-w]+1:1);}
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;if(!d[i]){rgba[i*4+3]=0;continue;}d[i]=Math.min(d[i],x<w-1?d[i+1]+1:1,y<h-1?d[i+w]+1:1);let hash=Math.imul(x+seed,374761393)^Math.imul(y+seed,668265263);hash=Math.imul(hash^(hash>>>13),1274126177);rgba[i*4+3]=(hash>>>0)/4294967296<Math.min(1,d[i]/radius)?255:0;}
}
export function landing(upper:Point,lower:Point,width:number,which:'upper'|'lower',length=terrainStyle.landingLength):Point[]{const dx=lower[0]-upper[0],dy=lower[1]-upper[1],len=Math.hypot(dx,dy)||1,n:Point=[-dy/len*width/2,dx/len*width/2],p=which==='upper'?upper:lower,sign=which==='upper'?-1:1,q:Point=[p[0]+dx/len*length*sign,p[1]+dy/len*length*sign];return[[p[0]+n[0],p[1]+n[1]],[q[0]+n[0],q[1]+n[1]],[q[0]-n[0],q[1]-n[1]],[p[0]-n[0],p[1]-n[1]]];}
/** Candidates become authored data only after the compiler script validates them. */
export function findFords(scene:SceneData):Ford[]{const geo=scene.geology,grid=scene.navigation||scene.grid;if(!geo||!grid)return[];const cell=grid.cell*scene.scale,out:Ford[]=[];
 const wet=(p:Point)=>{const id=grid.data[Math.floor(p[1]/cell)*grid.width+Math.floor(p[0]/cell)];return id===5?geo.hydrology.find(h=>!h.deep&&h.id!=='irrigation'&&inside(p,h.water)):undefined;};
 for(const [ri,road]of geo.roads.entries()){const samples:Point[]=[];for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/8));for(let j=0;j<n;j++)samples.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);}samples.push(road.points.at(-1)!);
  for(let i=1;i<samples.length-1;i++){const water=wet(samples[i]);if(!water||wet(samples[i-1]))continue;const start=i;while(i<samples.length&&wet(samples[i])?.id===water.id)i++;if(i>=samples.length)break;const points=samples.slice(start,i);if(points.length<3)continue;const mid=points[Math.floor(points.length/2)];if(out.some(f=>f.water===water.id&&Math.hypot(f.points[Math.floor(f.points.length/2)][0]-mid[0],f.points[Math.floor(f.points.length/2)][1]-mid[1])<100))continue;out.push({id:'ford-'+ri+'-'+start,road:ri,water:water.id,width:road.width,points,entry:samples[start-1],exit:samples[i]});}
 }return out;
}
