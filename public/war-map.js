const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function project(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return [a[0]+dx*t,a[1]+dy*t];}
export function warLayout(base,index){
 const xs=[90,500,960,1420,1830],ys=[110,430,800,1160],nodes=[];
 const blocked=([x,y])=>x>base[0]-215&&x<base[0]+215&&y>base[1]-275&&y<base[1]+100;
 for(let row=0;row<ys.length;row++)for(let col=0;col<xs.length;col++){const p=[xs[col],ys[row]];if(!blocked(p))nodes.push({col,row,p});}
 const edgeSafe=(a,b)=>{const steps=Math.ceil(distance(a,b)/20);for(let n=0;n<=steps;n++){if(blocked([a[0]+(b[0]-a[0])*n/steps,a[1]+(b[1]-a[1])*n/steps]))return false;}return true;};
 const nearest=p=>[...nodes].sort((a,b)=>distance(a.p,p)-distance(b.p,p))[0];
 const exit=[...nodes].filter(n=>n.p[1]>base[1]+110).sort((a,b)=>distance(a.p,[base[0],base[1]+175])-distance(b.p,[base[0],base[1]+175]))[0];
 function route(from,to,variant){
  const queue=[from],came=new Map([[from,null]]);
  for(let n=0;n<queue.length;n++){const a=queue[n];if(a===to)break;const directions=variant%2?[[0,1],[-1,0],[1,0],[0,-1]]:[[1,0],[0,-1],[-1,0],[0,1]];
   for(const [dx,dy]of directions){const b=nodes.find(b=>b.col===a.col+dx&&b.row===a.row+dy);if(b&&!came.has(b)&&edgeSafe(a.p,b.p)){came.set(b,a);queue.push(b);}}
  }
  if(!came.has(to))throw Error('Map graph disconnected');
  const result=[];for(let p=to;p;p=came.get(p))result.unshift(p.p);return result;
 }
 const gatePoints=[[90,1160],[1830,1160],[90,430],[1830,430],[960,110],[90,110],[1830,110]],hubs=[[500,800],[1420,800],[960,1160],[500,430],[1420,430]];
 const lanes=gatePoints.slice(0,Math.min(7,3+Math.floor(index/2))).map((point,n)=>{
  const start=nearest(point),hub=nearest(hubs[(n+index)%hubs.length]),raw=[...route(start,hub,index+n),...route(hub,exit,index+n+1).slice(1)],path=[];
  for(const p of raw){const old=path.findIndex(q=>q===p);if(old>=0)path.splice(old+1);else path.push(p);}
  path.push([base[0],base[1]+175],[base[0],base[1]+110]);return path;
 });
 const mainCandidates=[[300,615],[730,615],[1190,615],[1630,615],[300,975],[730,975],[1190,975],[1630,975],[300,260],[730,260],[1190,260],[1630,260],[500,615],[1420,615],[500,975],[1420,975],[180,260],[1740,260],[180,615],[1740,615],[180,975],[1740,975],[730,1100],[1190,1100]];
 const smallCandidates=[[180,150],[420,150],[700,150],[1220,150],[1500,150],[1740,150],[240,520],[640,520],[1280,520],[1680,520],[240,920],[660,920],[1260,920],[1680,920],[420,1080],[960,1040],[1500,1080],[140,640],[1780,640],[140,980],[1780,980],[580,230],[1340,230],[960,560],[360,220],[1560,220],[360,1060],[1560,1060],[200,320],[1720,320],[740,340],[1180,340],[740,520],[1180,520],[400,720],[1520,720],[740,900],[1180,900],[600,1140],[1320,1140],[200,1140],[1720,1140],[820,170],[1100,170],[280,1010],[1640,1010],[700,720],[1220,720]];
 const families=['wolf','serpent','undead','harpy','stone','dragon'];
 const campLimit=index<3?10:index<6?14:18;
 const validSpot=(p,picked,roadGap=110)=>distance(p,base)>340&&lanes.every(l=>l.every((b,n)=>!n||distance(p,project(p,l[n-1],b))>roadGap))&&picked.every(q=>distance(p,q.p)>135);
 const chosen=[];
 for(const p of mainCandidates)if(chosen.length<campLimit&&validSpot(p,chosen,115))chosen.push({p,small:chosen.length>=6});
 for(const p of smallCandidates)if(chosen.length<campLimit&&validSpot(p,chosen,95))chosen.push({p,small:true});
 for(let y=140;y<=1150&&chosen.length<campLimit;y+=95)if(y<330||y>390&&(y<720||y>820))for(let x=120;x<=1800&&chosen.length<campLimit;x+=115)if(validSpot([x,y],chosen,95))chosen.push({p:[x,y],small:true});
 const camps=chosen.map(({p,small},n)=>({id:'camp-'+n,x:p[0],y:p[1],family:families[(n+index)%6],radius:small?64:95,small}));
 const forestPaths=camps.map(c=>{const from=[c.x,c.y],ends=lanes.flatMap(l=>l.slice(1).map((b,n)=>project(from,l[n],b)));return [from,ends.sort((a,b)=>distance(from,a)-distance(from,b))[0]];});
 const bigCamps=camps.filter(c=>!c.small),seen=new Set(),campCorridors=[];
 for(const a of bigCamps){
  const peers=bigCamps.filter(b=>b!==a).sort((u,v)=>distance([a.x,a.y],[u.x,u.y])-distance([a.x,a.y],[v.x,v.y])).slice(0,2);
  for(const b of peers){
   const key=a.id<b.id?a.id+'|'+b.id:b.id+'|'+a.id;
   if(!seen.has(key)){seen.add(key);campCorridors.push([[a.x,a.y],[b.x,b.y]]);}
  }
 }
 return {lanes,camps,forestPaths,campCorridors};
}
