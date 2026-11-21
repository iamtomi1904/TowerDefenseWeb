import {waterAt} from './landscape-layout.js';
import {propBlocks} from './prop-footprints.js';
import {getActiveViews,inAnyView,boxInAnyView} from './weather-visibility.js';
export const AMBIENT_KINDS={butterfly:'Bướm ghé hoa',bird:'Chim đậu cây',crow:'Quạ đậu cây, đá',frog:'Ếch bờ nước',fish:'Cá dưới nước',rabbit:'Thỏ dưới tán cây',squirrel:'Sóc nhặt hạt',deer:'Nai nghỉ dưới tán cây',flock:'Đàn chim bay',flower:'Hoa cúc',poppy:'Hoa anh túc',iris:'Hoa diên vĩ',bluebell:'Hoa chuông',glowflower:'Hoa phát sáng',firefly:'Đàn đom đóm',ember:'Đốm lửa',smoke:'Khói',lily:'Súng thủy sinh',reed:'Lau sậy',duckweed:'Bèo nước',flame:'Lửa trại'};
const waterKinds=new Set(['fish','lily','duckweed']);
const plantKinds=new Set(['flower','poppy','iris','bluebell','glowflower','reed','lily','duckweed']);
const fract=n=>n-Math.floor(n),smooth=t=>t*t*(3-2*t);
const treeId=id=>/tree|oak|pine|willow|palm|sakura|bamboo/.test(id)&&!/dead|burned|broken|charred/.test(id);
const rockId=id=>/rock|boulder|ruin|monolith/.test(id);
export function createAmbientLife(map,catalog={props:[]}){
 const records=[],props=map.props||[],trees=props.filter(p=>treeId(p.asset)),dead=props.filter(p=>/dead|burned|broken|charred/.test(p.asset)),rocks=props.filter(p=>rockId(p.asset));
 const defs=new Map((catalog.props||[]).map(p=>[p.id,p]));
 let state=map.id*971+41;const rand=()=>{state=(state*16807)%2147483647;return state/2147483647;};
 const add=(kind,x,y,extra={})=>records.push({id:'ambient-'+records.length,kind,x,y,phase:rand()*6.28,period:7+rand()*5,radius:0,...extra});
 const ordinary=(map.id!==5&&map.id!==6&&map.id!==9&&map.id!==10);
 const blocked=(x,y)=>x<36||y<40||x>map.width-36||y>map.height-36||waterAt(map,{x,y})||props.some(p=>Math.abs(p.x-x)<50&&Math.abs(p.y-y)<40&&propBlocks(p,x,y,7));
 const height=p=>p.asset==='prop-ancient-oak'?280:p.asset==='prop-bamboo-clump'?160:p.asset==='prop-giant-boulder'?148:p.asset==='prop-ice-boulder'?92:defs.get(p.asset)?.targetH||(rockId(p.asset)?58:132);
 const perch=(p)=>({x:p.x+9,y:p.y-height(p)*.68,propId:p.id,groundY:p.y,kind:rockId(p.asset)?'rock':'tree'});
 const maxTrees=Math.min(28,Math.max(5,Math.ceil(map.width*map.height/900000)));
 for(let i=0;i<Math.min(maxTrees,trees.length);i++){
  const p=trees[Math.floor(i*trees.length/Math.min(maxTrees,trees.length))],q=trees.filter(v=>v!==p&&Math.hypot(v.x-p.x,v.y-p.y)<400).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]||p;
  if(i%2===0)add('bird',p.x,p.y,{from:perch(p),to:perch(q),anchorId:p.id});
  if(ordinary){
   const x=p.x+35,y=p.y+22,tx=x+40+(i%2?25:-25),ty=y+Math.sin(i)*30;
   if(!blocked(x,y)&&!blocked(tx,ty)&&Array.from({length:6},(_,k)=>blocked(x+(tx-x)*k/5,y+(ty-y)*k/5)).every(v=>!v))add(i%4===0?'deer':i%3===0?'squirrel':'rabbit',x,y,{to:{x:tx,y:ty},anchorId:p.id,period:14+rand()*8});
   const fx=p.x+(i%2?-50:50),fy=p.y+34;
   if(!blocked(fx,fy)){
    add(['flower','poppy','iris','bluebell'][i%4],fx,fy,{anchorId:p.id});
    add('glowflower',fx+13,fy+8,{anchorId:p.id});
    add('butterfly',fx,fy,{anchorId:p.id,flower:{x:fx,y:fy-12}});
    if(i%3===0)for(let j=0;j<7;j++)add('firefly',fx,fy,{swarm:'swarm-'+i,anchorId:p.id,phase:j*.83+rand()*.3,orbit:12+j*3});
   }
  }
 }
 const perches=[...dead,...rocks].slice(0,12);
 for(let i=0;i<perches.length;i+=2){const p=perches[i],q=perches[(i+1)%perches.length],from=perch(p),to=perch(q);add('crow',p.x,p.y,{from,to,anchorId:p.id,period:11+rand()*8});}
 for(const river of map.rivers||[]){
  if(!['deep','shallow'].includes(river.type)||river.surface||map.id===9||map.id===10)continue;
  for(let k=1;k<river.points.length;k+=Math.max(1,Math.floor(river.points.length/5))){
   const a=river.points[k-1],b=river.points[k],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
   const cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2;
   if(cx<25||cx>map.width-25||cy<25||cy>map.height-25)continue;
   add('fish',cx,cy,{riverId:river.id,segment:{a,b,width:river.width},period:6+rand()*5});
   if(river.type==='shallow'&&map.id!==6){
    const wx=cx+nx*river.width*.27,wy=cy+ny*river.width*.27;
    add('lily',wx,wy,{riverId:river.id});add('duckweed',wx+12,wy-8,{riverId:river.id});
    const x=cx+nx*(river.width/2+18),y=cy+ny*(river.width/2+18);
    add('reed',x,y,{riverId:river.id});
    const nearby=rocks.find(p=>Math.hypot(x-p.x,y-p.y)<85),to=nearby?{x:nearby.x+14,y:nearby.y-5}:{x:x+dx/len*18,y:y+dy/len*18};
    add('frog',x,y,{to,anchorId:nearby?.id,riverId:river.id});
    add('glowflower',x+14,y+8,{riverId:river.id});
    for(let j=0;j<5;j++)add('firefly',x,y,{swarm:'river-'+river.id+'-'+k,orbit:15+j*4,phase:j*1.2});
   }
  }
 }
 const fires=props.filter(p=>/campfire|torch|geyser/.test(p.asset)).slice(0,10);
 for(const p of fires){const top=/torch/.test(p.asset)?48:12;add('flame',p.x,p.y-top+6,{anchorId:p.id});for(let i=0;i<5;i++)add('ember',p.x,p.y-top,{anchorId:p.id,period:2+rand()*2});for(let i=0;i<3;i++)add('smoke',p.x,p.y-top-4,{anchorId:p.id,period:4+rand()*3});}
 for(let i=0;i<3;i++)add('flock',map.width*(.15+i*.3),map.height*(.2+i*.22),{members:5+i,period:20+i*7});
 // All records are client-only decoration and are never appended to map.props.
 return records;
}
export function ambientPose(item,time){
 const t=time/1000,cycle=fract(t/item.period+item.phase),out={x:item.x,y:item.y,groundY:item.y,frame:Math.floor(t*8+item.phase)%8,alpha:1,flip:false,interaction:null};
 if(item.from){
  const leg=Math.floor(t/item.period+item.phase)%2,from=leg?item.to:item.from,to=leg?item.from:item.to;
  const flying=cycle>.65,u=flying?smooth((cycle-.65)/.35):0;
  out.x=from.x+(to.x-from.x)*u;out.y=from.y+(to.y-from.y)*u-(flying?Math.sin(u*Math.PI)*45:0);out.groundY=flying?out.y+60:from.groundY;out.flying=flying;out.frame=flying?out.frame:0;out.flip=flying&&to.x<from.x;
  if(cycle<.055&&from.kind==='tree')out.interaction={propId:from.propId,strength:Math.sin(cycle/.055*Math.PI)*.025,x:from.x,y:from.y};
 }else if(item.kind==='butterfly'){
  const u=cycle<.35?0:Math.sin((cycle-.35)/.65*Math.PI);out.x=item.flower.x+Math.sin(t*1.3+item.phase)*u*24;out.y=item.flower.y-3-u*18;out.groundY=item.flower.y;
 }else if(item.kind==='fish'){
  const {a,b,width}=item.segment,u=.15+(.5-.5*Math.cos(cycle*Math.PI*2))*.7,dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,lat=Math.sin(t+item.phase)*width*.12;
  out.x=a[0]+dx*u-dy/len*lat;out.y=a[1]+dy*u+dx/len*lat;out.flip=(dx<0)!==(cycle>.5);out.rotation=Math.atan2(dy,Math.abs(dx)||1);out.alpha=.5+Math.sin(cycle*Math.PI)*.3;
 }else if(item.kind==='rabbit'||item.kind==='squirrel'||item.kind==='deer'||item.kind==='frog'){
  const moving=cycle>.55&&cycle<.9,u=cycle<=.55?0:cycle>=.9?1:smooth((cycle-.55)/.35),back=Math.floor(t/item.period+item.phase)%2;
  const q=back?1-u:u;out.x=item.x+(item.to.x-item.x)*q;out.y=item.y+(item.to.y-item.y)*q;out.groundY=out.y;out.flip=(item.to.x<item.x)!==!!back;
  out.frame=moving?out.frame:0;if(moving)out.y-=Math.abs(Math.sin(t*(item.kind==='deer'?9:12)))*(item.kind==='frog'?9:3);
  out.interaction=item.kind==='frog'&&cycle>.9&&cycle<.95?{splash:true,x:out.x,y:out.groundY,progress:(cycle-.9)/.05}:null;
 }else if(item.kind==='firefly'){
  out.x+=Math.cos(t*.8+item.phase)*(item.orbit||18);out.y+=Math.sin(t*1.1+item.phase)*(item.orbit||18)*.55-16;out.alpha=.2+Math.max(0,Math.sin(t*2+item.phase))*.75;
 }else if(item.kind==='ember'||item.kind==='smoke'){
  out.x+=Math.sin(cycle*4+item.phase)*(item.kind==='smoke'?15:8);out.y-=cycle*(item.kind==='smoke'?75:45);out.alpha=Math.sin(cycle*Math.PI)*(item.kind==='smoke'?.3:.85);out.scale=item.kind==='smoke'?.6+cycle*.8:1;
 }else if(item.kind==='flock'){
  out.x=(item.x+t*28)%(item.worldWidth||3000);out.y=item.y+Math.sin(t*.3+item.phase)*30;out.groundY=out.y;
 }else if(item.kind==='glowflower')out.alpha=.75+Math.sin(t*1.4+item.phase)*.2;
 else if(plantKinds.has(item.kind)){out.rotation=Math.sin(t*1.5+item.phase)*.04;}
 return out;
}
export function installAmbientLife(scene,map,catalog){
 makeAmbientTextures(scene);scene.ambientNudges=new Map();scene.ambientPropCoordinates=new Map((map.props||[]).map(p=>[p.x+':'+p.y,p.id]));scene.critters=[];scene.crows=[];
 scene.ambientLife=createAmbientLife(map,catalog).map(item=>{
  item.worldWidth=map.width;
  if(item.kind==='flock'){item.isFlock=true;}
  else if(item.from&&item.to){item.minX=Math.min(item.from.x,item.to.x)-85;item.maxX=Math.max(item.from.x,item.to.x)+85;item.minY=Math.min(item.from.y,item.to.y)-110;item.maxY=Math.max(item.from.y,item.to.y)+85;}
  else if(item.to){item.minX=Math.min(item.x,item.to.x)-80;item.maxX=Math.max(item.x,item.to.x)+80;item.minY=Math.min(item.y,item.to.y)-90;item.maxY=Math.max(item.y,item.to.y)+80;}
  else if(item.segment){const {a,b,width}=item.segment;item.minX=Math.min(a[0],b[0])-width-60;item.maxX=Math.max(a[0],b[0])+width+60;item.minY=Math.min(a[1],b[1])-width-60;item.maxY=Math.max(a[1],b[1])+width+60;}
  else{item.minX=item.x-75;item.maxX=item.x+75;item.minY=item.y-105;item.maxY=item.y+75;}
  const sprite=scene.add.sprite(item.x,item.y,'ambient:'+item.kind,0).setOrigin(.5,.84);
  scene.mapObjects.push(sprite);
  return {item,sprite};
 });
 scene.ambientEffects=scene.add.graphics().setDepth(2750);scene.mapObjects.push(scene.ambientEffects);
}
export function updateAmbientLife(scene,time,views=getActiveViews(scene)){
 if(!scene.ambientLife)return;const g=scene.ambientEffects;g.clear();scene.ambientNudges.clear();
 if(!views.length)return;
 for(const {item,sprite}of scene.ambientLife){
  if(!item.isFlock&&!boxInAnyView(views,item.minX,item.minY,item.maxX,item.maxY,0)){
   if(sprite.visible){sprite.setVisible(false);sprite.anims?.pause();}
   continue;
  }
  const p=ambientPose(item,time),visible=inAnyView(views,p.x,p.y,85);
  const show=visible&&(!scene.ambientFilter||scene.ambientFilter(item.kind));
  if(sprite.visible!==show){sprite.setVisible(show);if(show)sprite.anims?.resume();else sprite.anims?.pause();}
  if(!show)continue;
  sprite.setPosition(p.x,p.y).setFrame(p.frame).setAlpha(p.alpha).setFlipX(p.flip).setRotation(p.rotation||0).setScale(p.scale||1);const depth=waterKinds.has(item.kind)?-93:item.kind==='flock'?2600:Math.round(p.groundY)+2;if(sprite.depth!==depth)sprite.setDepth(depth);
  const hit=p.interaction;if(hit?.propId){scene.ambientNudges.set(hit.propId,hit.strength);g.fillStyle(0x80994c,.6).fillRect(hit.x-8,hit.y+10+(time/70)%22,3,2);}
  if(hit?.splash)g.lineStyle(1,0xd5eee0,(1-hit.progress)*.55).strokeEllipse(hit.x,hit.y,8+hit.progress*14,3+hit.progress*5);
  if(item.kind==='fish'&&Math.sin(time/800+item.phase)>.9)g.lineStyle(1,0xbadfd4,.25).strokeEllipse(p.x,p.y,9,3);
 }
}
export function makeAmbientTextures(scene){
 if(scene.textures.exists('ambient:bird'))return;
 for(const kind of Object.keys(AMBIENT_KINDS)){
  const canvas=document.createElement('canvas');canvas.width=64*8;canvas.height=64;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  for(let frame=0;frame<8;frame++){c.save();c.translate(frame*64,0);c.scale(2,2);drawCreature(c,kind,frame);c.restore();}
  const texture=scene.textures.addCanvas('ambient:'+kind,canvas);for(let i=0;i<8;i++)texture.add(i,0,i*64,0,64,64);
 }
}
function drawCreature(c,kind,frame){
 const rect=(x,y,w,h,color,alpha=1)=>{c.globalAlpha=alpha;c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);c.globalAlpha=1;};
 const shape=(points,color,alpha=1)=>{c.globalAlpha=alpha;c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill();c.globalAlpha=1;};
 const flap=Math.round(Math.sin(frame/8*Math.PI*2)*4),step=frame%4<2?1:-1;
 if(['bird','crow','flock'].includes(kind)){
  const dark=kind==='crow'? '#25252c':'#4a5843',light=kind==='crow'?'#62616d':'#b4b59a';
  const bird=(x,y,f)=>{shape([[x-5,y-2],[x-2,y-4],[x+3,y-3],[x+5,y],[x+2,y+2],[x-3,y+2]],dark);rect(x+1,y-5,4,4,light);rect(x+3,y-4,1,1,'#171e19');rect(x+5,y-3,2,1,'#c2a46f');if(frame){shape([[x-1,y],[x-9,y-2-f],[x-6,y-4-f],[x+1,y-2]],light);shape([[x+1,y],[x+7,y-3+f],[x+10,y-1+f],[x+2,y+1]],dark);}else{rect(x-2,y-1,4,2,light);rect(x-1,y+2,1,2,'#665b42');rect(x+2,y+2,1,2,'#665b42');}};
  if(kind==='flock'){c.save();c.scale(.55,.55);bird(10,33,flap);bird(26,24,-flap);bird(42,15,flap);bird(42,35,-flap);bird(26,44,flap);c.restore();}else bird(16,24,flap);
 }else if(kind==='butterfly'){
  const w=2+Math.abs(flap);shape([[15,21],[15-w,16],[12-w,18],[13-w,22],[15,24]],'#d6ad59');shape([[17,21],[17+w,16],[20+w,18],[19+w,22],[17,24]],'#9bb9cb');rect(15,19,2,6,'#4b4839');rect(15-w,19,2,2,'#f0dca0');
 }else if(kind==='rabbit'){
  shape([[7,23],[8,20],[11,17],[17,17],[20,19],[24,19],[25,22],[22,25],[18,27],[10,27]],'#515344');
  shape([[9,21],[12,18],[17,18],[21,21],[21,24],[17,25],[10,25]],'#c4bca4');rect(12,19,5,2,'#e2dbc4');rect(10,23,7,2,'#a89d85');rect(20,19,4,4,'#d9d1b8');
  rect(19,10,3,10,'#626452');rect(20,11,1,8,'#d5cab1');rect(23,11,3,9,'#626452');rect(24,12,1,7,'#c2b59e');rect(22,20,1,1,'#282e26');rect(24,22,1,1,'#8d8068');rect(9+step,25,4,2,'#c4bba4');rect(18-step,25,4,2,'#a89c83');rect(7,22,3,3,'#ded5bd');
 }else if(kind==='squirrel'){
  shape([[8,22],[5,19],[5,12],[9,9],[13,11],[13,15],[10,17],[11,21]],'#68513b');shape([[8,20],[7,15],[8,12],[11,12],[11,15],[9,18]],'#ab7c4c');shape([[10,22],[13,18],[20,19],[23,22],[20,26],[12,26]],'#8d633e');rect(15,20,5,4,'#c49b66');rect(20,17,4,5,'#a67d4f');rect(21,15,2,3,'#6c533a');rect(22,18,1,1,'#2b3225');rect(11+step,25,4,2,'#65513a');rect(20-step,25,3,2,'#65513a');
 }else if(kind==='deer'){
  shape([[4,17],[8,13],[18,13],[22,16],[23,21],[18,24],[7,23]],'#51503c');shape([[6,17],[9,14],[17,14],[21,18],[18,22],[7,21]],'#98764f');rect(10,15,7,2,'#ba9869');rect(8,20,10,2,'#c1ae86');rect(8,17,2,1,'#cfba8d');rect(13,18,2,1,'#c4ad80');rect(20,10,3,9,'#ad8960');shape([[21,10],[24,8],[28,9],[27,13],[22,13]],'#bda178');rect(25,9,1,1,'#263126');rect(27,11,2,1,'#4f4434');rect(21,6,2,4,'#a58e68');rect(25,6,2,3,'#d4bd94');rect(22,3,1,5,'#a99570');rect(19,3,1,4,'#a99570');rect(19,6,3,1,'#a99570');rect(8+step,21,2,7,'#68533f');rect(16-step,21,2,7,'#68533f');rect(7+step,27,3,1,'#3c3e31');rect(15-step,27,3,1,'#3c3e31');rect(4,16,3,2,'#dfd0ac');
 }else if(kind==='frog'){
  shape([[8,23],[11,18],[20,18],[24,23],[21,27],[10,27]],'#364a32');shape([[9,23],[11,19],[20,19],[23,23],[19,26],[11,26]],'#4a6d40');rect(12,20,8,4,'#7f9b50');rect(11,18,3,3,'#a8b96b');rect(18,18,3,3,'#a8b96b');rect(12,19,1,1,'#222e23');rect(19,19,1,1,'#222e23');rect(8-step,25,5,2,'#617d45');rect(19+step,25,5,2,'#617d45');
 }else if(kind==='fish'){
  shape([[7,22],[11,19],[19,19],[24,22],[19,25],[11,25]],'#496e6d');shape([[10,22],[12,20],[19,20],[22,22],[18,23],[12,23]],'#a0b9a1');shape([[9,22],[4,19+step],[4,25-step]],'#7d9e8f');rect(20,21,1,1,'#1f3936');
 }else if(['flower','poppy','iris','bluebell','glowflower'].includes(kind)){
  rect(15,19,1,8,'#55723f');rect(12,23,3,1,'#779057');rect(16,21,3,1,'#66834c');
  const col=kind==='poppy'?'#c67962':kind==='iris'?'#aa96c4':kind==='bluebell'?'#8faecb':kind==='glowflower'?'#a3e4cf':'#e4dec1';
  if(kind==='glowflower'){const pulse=.04+frame*.007;shape([[15,12],[18,16],[23,17],[18,20],[15,24],[12,20],[8,17],[12,15]],'#8ed9bb',pulse);rect(11,15,9,6,'#84c9b6',pulse);shape([[15,12],[17,14],[20,15],[21,18],[18,21],[14,22],[11,19],[10,16],[13,14]],'#476d65');}
  if(kind==='iris'){shape([[15,19],[10,14],[13,13],[15,10],[17,14],[21,13],[18,18]],col);rect(15,15,1,4,'#e2cc8c');}
  else if(kind==='bluebell'){for(let i=0;i<3;i++){rect(12+i*3,14+i*2,1,6,'#62834a');shape([[11+i*3,18+i*2],[14+i*3,18+i*2],[15+i*3,21+i*2],[10+i*3,21+i*2]],col);}}
  else{rect(12,16,3,3,col);rect(16,16,3,3,col);rect(14,14,3,3,col);rect(14,19,3,2,col);rect(14,17,3,2,kind==='glowflower'?'#e8edb1':'#c5ab61');}
 }else if(kind==='lily'||kind==='duckweed'){
  const color=kind==='lily'?'#769766':'#648c68';shape([[9,23],[12,20],[21,20],[25,23],[20,26],[12,26]],color);if(kind==='lily'){rect(15,20,4,3,'#ceacb9');rect(16,19,2,1,'#e9d5d3');rect(17,22,1,1,'#e4d293');}else {rect(6,20,3,2,'#92ab76');rect(23,19,3,2,'#769861');}
 }else if(kind==='reed'){
  for(let i=0;i<4;i++){const x=10+i*3;rect(x,16+i%2*3,1,12-i%2*3,'#68844e');rect(x-1,14+i%2*3,2,4,'#8e7852');}rect(20,21,1,7,'#789255');rect(21,19,1,4,'#789255');
 }else if(kind==='firefly'){
  shape([[16,17],[18,20],[22,21],[18,23],[16,26],[14,23],[10,21],[14,20]],'#e6eaa2',.12+frame*.015);rect(15,20,3,3,'#d6e591',.6);rect(16,21,1,1,'#f5ffce');
 }else if(kind==='ember'||kind==='flame'){
  const h=kind==='flame'?10:4;shape([[14,25],[13,22],[16+step,25-h],[17,20],[19,23],[18,26]],'#d57736');rect(15,23,2,3,'#f5c365');if(kind==='flame')rect(15,21,1,4,'#f4dfa0');
 }else if(kind==='smoke'){
  shape([[9,20],[10,16],[14,16],[15,13],[20,14],[21,17],[24,19],[22,23],[13,24]],'#a9aaa0',.55);rect(12,16,7,2,'#c1c1b4',.3);
 }
}
