import {cleanEffectTexture} from './effect-alpha.js';
import {CLASS_WISP_LAYOUT} from './class-wisp-layout.js';
import {GEAR_LAYOUT} from './gear-glow-layout.js';
import {ACTION_LAYOUT} from './action-fx-layout.js';
import {RAVAGER_BLADES} from './ravager-art.js';
export const CLASS_WISPS={windblade:'fan',duelist:'fan',ranger:'bow',darkelf:'bow',berserker:'body',ravager:'blade',vanguard:'shield',guardian:'shield',paladin:'weapon',fallen:'weapon',assassin:'daggers',pyromancer:'fire',tidecaller:'water',stormcaller:'storm'};
const GEAR=Object.keys(GEAR_LAYOUT),OLD=['sword-wisp','arrow-wisp','battle-ember','knight-ward','iron-ward','dagger-wisp'],TAU=Math.PI*2,fract=n=>n-Math.floor(n);
export function progressionTier(level){return Math.min(3,Math.floor(Math.max(0,(level||1)-1)/5));}
export function preloadClassProgression(s){for(const id of OLD)s.load.image('class-wisp:'+id,'/assets/combat/class-wisps/'+id+'.png');for(const id of GEAR)s.load.image('gear-glow:'+id,'/assets/combat/gear-glows/'+id+'.png');}
function source(id){return GEAR.includes(id)?{key:'gear-glow:'+id,layout:GEAR_LAYOUT[id]}:OLD.includes(id)?{key:'class-wisp:'+id,layout:CLASS_WISP_LAYOUT[id]}:{key:'action-fx:'+id,layout:ACTION_LAYOUT[id]};}
export function bowPoint(frame,t,dark=false){
 const row=Math.floor(frame/6),f=frame%6,aiming=row===2&&f>=1&&f<=4,raised=row===3&&f>=2&&f<=4;
 const top=raised?[.49,.08]:aiming?[.8,.12]:row===1?[.9,.2]:[.83,.30],bottom=raised?[.86,.56]:aiming?[.81,.77]:[.73,.72],bend=raised?[1,.14]:aiming?[1,.43]:[.9,.51],q=1-t,shift=dark?-.07:0;
 return {x:q*q*top[0]+2*q*t*bend[0]+t*t*bottom[0]+shift,y:q*q*top[1]+2*q*t*bend[1]+t*t*bottom[1]};
}
export function weaponLine(u,frame){
 const row=Math.floor(frame/6),f=frame%6;
 if(u.classId==='ravager'){const b=RAVAGER_BLADES[frame]||RAVAGER_BLADES[0];return [[b[0],b[1]],[b[2],b[3]]];}
 if(['pyromancer','tidecaller','stormcaller'].includes(u.classId))return row===2&&f>=2&&f<=4?[[.62,.46],[.95,.43]]:row===3&&f>=2&&f<=4?[[.57,.38],[.58,.07]]:[[.73,.69],[.82,.23]];
 if(u.classId==='vanguard')return row===3&&f>=3?[[.42,.62],[.95,.12]]:[[.25,.67],[.97,.59]];
 if(u.classId==='paladin')return u.holyMounted?[[.46,.31],[.91,.12]]:row===2&&f>=2?[[.57,.32],[.18,.10]]:[[.53,.45],[.94,.08]];
 if(u.classId==='fallen')return u.fallenMounted?[[.46,.43],[.94,.47]]:row===2&&f>=1&&f<=2?[[.57,.30],[.12,.08]]:[[.43,.72],[.92,.87]];
 return [[.33,.59],[.65,.75]];
}
export function progressionShape(u,time,frame=0){
 const type=CLASS_WISPS[u.classId];if(!type)return [];const tier=progressionTier(u.level),max=tier===3,t=time/1000,items=[];
 const add=(id,x,y,w,h,angle=0,alpha=.7,behind=false,tint=null,origin=null)=>items.push({id,x,y,w,h,angle,alpha,behind,tint,origin});
 const onWeapon=(id,count,tint,orbit=false)=>{const [a,b]=weaponLine(u,frame),dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;for(let i=0;i<count;i++){const phase=t*1.8+i*TAU/count,k=orbit?.5+.4*Math.sin(phase):.25+fract(t*.7+i/count)*.75,side=orbit?Math.cos(phase)*.027:0;add(id,a[0]+dx*k-dy/len*side,a[1]+dy*k+dx/len*side,.045+.009*tier,.07,Math.atan2(dy,dx),.5+tier*.13,false,tint);}};
 if(type==='bow')for(let i=0;i<12+tier*4;i++){
  const k=i/(11+tier*4),p=bowPoint(frame,k,u.classId==='darkelf'),q=bowPoint(frame,Math.min(1,k+.01),u.classId==='darkelf'),pulse=(1+Math.cos((k-fract(t*.55))*TAU))/2;
  add('gear-spark',p.x,p.y,.018+tier*.004+pulse*.012,.035,Math.atan2(q.y-p.y,q.x-p.x)-Math.PI/2,.22+pulse*.65,false,u.classId==='darkelf'?0xc8ceff:0xc9ff91);
 }
 if(type==='fan'){
  const count=2+tier,spread=.12+(.22+tier*.035)*(.5+.5*Math.sin(t*1.65));
  for(let i=0;i<count;i++){const a=(i-(count-1)/2)*spread;add(u.classId==='windblade'?'wind-katana':'power-katana',.38,.66+Math.sin(t*1.65)*.015,.09+(u.classId==='duelist'?.035:0),.64+tier*.035,a,.65+tier*.1,true,null,'hilt');}
  if(u.classId==='duelist')for(let i=0;i<count;i++){
   const a=(i-(count-1)/2)*spread,k=.3+fract(t*.5+i/count)*.4;add('gear-spark',.38+Math.sin(a)*k,.66-Math.cos(a)*k,.035,.07,a,.6+.25*Math.sin(t*4+i)**2,true,0xffefb7);
  }
  if(u.classId==='windblade')for(let i=0;i<2+tier;i++){
   const phase=fract(t*.55+i/(2+tier));add('wind-body',.5+Math.sin(phase*TAU)*.10,.76-phase*.5,.6+tier*.055,.11,Math.sin(phase*TAU)*.12,Math.sin(phase*Math.PI)*(.45+tier*.09),phase>.5);
  }
 }
 if(type==='body')for(let i=0;i<2+tier;i++){const a=t*.7+i*TAU/(2+tier);add('battle-ember',.5+Math.cos(a)*.3,.57+Math.sin(a)*.16,.06,.09,a,.5+tier*.1,Math.sin(a)<0,0xff6a61);}
 if(type==='blade')onWeapon('battle-ember',3+tier,0xff6a61,true);
 if(type==='shield'){for(let i=0;i<3+tier;i++){const a=t*1.3+i*TAU/(3+tier),round=u.classId==='vanguard';add(round?'battle-ember':'iron-ward',round?.73+Math.cos(a)*.16:.79+Math.cos(a)*.09,.55+Math.sin(a)*(round?.25:.3),.035,.045,a,.55+tier*.12,false,round?0xffde9c:0xd2edff);}if(max)onWeapon('battle-ember',5,u.classId==='vanguard'?0xffdf9b:0xd8efff);}
 if(type==='weapon')onWeapon('sword-wisp',1+tier,u.classId==='paladin'?0xffe7a8:0xd9a1ff);
 if(type==='daggers'&&max)for(let i=0;i<4;i++){const side=i%2;add('dagger-wisp',side?.77:.36,.65-Math.sin(t*3+i)*.025,.05,.08,side?.6:-.5,.8,false,0xc3ffe0);}
 if(type==='fire'){const [,tip]=weaponLine(u,frame);for(let i=0;i<1+tier;i++)add('fire-tuft',tip[0]+Math.sin(t*5+i)*.018,tip[1]-.025*i,.10,.13,Math.sin(t*4+i)*.1,.6+tier*.1);}
 if(type==='water'){
  for(let i=0;i<3+tier;i++){const phase=fract(t*(.22+i*.02)+i*.371);add('water-ribbon',.28+i%2*.43+Math.sin(t*1.3+i)*.07,.78-phase*.5,.19,.085,Math.sin(t+i)*.45,.45+tier*.1,i%2===0);}
  const [,tip]=weaponLine(u,frame);add('water-ribbon',tip[0],tip[1],.16,.09,t*.7,.75);
  for(let i=0;i<6+tier*2;i++){const f=fract(t*(.19+i%3*.025)+i*.618);add('water-bubble',.18+(i%4)*.21+Math.sin(t*.9+i)*.045,.88-f*.82,.035+i%3*.012,.035+i%3*.012,0,Math.sin(f*Math.PI)*(.45+tier*.12),i%3===0);}
 }
 if(type==='storm'){
  add('spell-circle',.46,.35,.63+tier*.1,.63+tier*.1,t*.24,.32+tier*.12,true,0xb5caff);
  onWeapon('lightning-bolt',2+tier,0xd3e6ff);
  for(let i=0;i<2+tier*2;i++)add('lightning-bolt',.33+i%3*.14,.35+i%4*.12,.035,.13,(i%2?1:-1)*.5,(.25+Math.sin(t*9+i*2)**2*.5)*(tier+1)/4,false,0xd5eaff);
  for(let i=0;i<3+tier;i++){
   const a=i*TAU/(3+tier)+Math.floor(t*5)*.21,phase=fract(t*3+i*.37),r=.2+phase*.18;
   add('lightning-bolt',.48+Math.cos(a)*r,.48+Math.sin(a)*r,.035,.16+phase*.14,a-Math.PI/2,Math.sin(phase*Math.PI)*(.5+tier*.13),i%2===0,0xc7deff);
  }
 }
 if(type==='weapon'){
  const mounted=u.holyMounted||u.fallenMounted;
  add(u.classId==='paladin'?'angel-halo':'reaper-halo',mounted?.47:.49,(mounted?.08:.015)+Math.sin(t*1.8)*.008,.27+tier*.025,.12,Math.sin(t*.8)*.035,.48+tier*.15);
 }
 if(u.classId==='darkelf'){
  add('moon-crescent',.45,.01+Math.sin(t*1.6)*.012,.13+tier*.012,.17,0,.55+tier*.12);
  add('moon-aura',.48,.53,.47+tier*.04,.79,0,.13+tier*.06,true);
 }
 if(u.classId==='ranger'||u.classId==='assassin')for(let i=0;i<2+tier;i++){
  const phase=fract(t*.28+i*.37),poison=u.classId==='ranger';
  add(poison?'poison-vapor':'shadow-smoke',.3+i%3*.18+Math.sin(t+i)*.025,.8-phase*.55,.10+phase*.045,.17+phase*.08,Math.sin(t+i)*.08,Math.sin(phase*Math.PI)*(poison?.25:.19)*(1+tier*.2),i%2===0);
 }
 if(['vanguard','paladin','fallen'].includes(u.classId)){
  const mounted=u.holyMounted||u.fallenMounted,dark=u.classId==='fallen';
  add(dark?'moon-aura':'solar-radiance',.49,mounted?.52:.5,mounted?.95:.72,mounted?.96:.94,0,.23+tier*.075,true,dark?0xe69aff:u.classId==='vanguard'?0xffc750:0xfff0c4);
  for(let i=0;i<2+tier;i++){const phase=fract(t*.3+i*.618);add('gear-spark',.22+i%3*.26,.86-phase*.75,.024,.05,0,Math.sin(phase*Math.PI)*.7,false,dark?0xc18aff:0xffecc0);}
 }
 if(type==='fire')for(let i=0;i<2+tier;i++){
  const phase=fract(t*.32+i*.37);add('heat-smoke',.3+i%3*.18+Math.sin(t+i)*.035,.55-phase*.6,.14+phase*.08,.26,Math.sin(t+i)*.08,Math.sin(phase*Math.PI)*(.22+tier*.045),true);
 }
 return items;
}
export function progressionPoint(obj,x,y){
 const s=obj.sprite,w=(s.width||obj.size*1.2)*(s.scaleX||1),h=(s.height||obj.size*1.2)*(s.scaleY||1),dx=(x-(s.originX??.5))*w*(s.flipX?-1:1),dy=(y-(s.originY??.98))*h,a=s.rotation||0;
 return {x:s.x+dx*Math.cos(a)-dy*Math.sin(a),y:s.y+dx*Math.sin(a)+dy*Math.cos(a)};
}
function clear(obj){for(const image of obj.progressionWisps?.values()||[])image.destroy();obj.progressionWisps?.clear();obj.progressionStyle=null;}
export function updateClassProgression(s,u,obj,time){
 if(!CLASS_WISPS[u.classId]||u.hp<=0){clear(obj);return;}
 obj.progressionWisps||=new Map();if(!obj.progressionCleanup){obj.progressionCleanup=true;obj.sprite.once?.('destroy',()=>clear(obj));}
 const style=u.classId+':'+!!u.holyMounted+':'+!!u.fallenMounted;if(obj.progressionStyle!==style){clear(obj);obj.progressionStyle=style;}
 const shapes=progressionShape(u,time,Number(obj.sprite.frame?.name)||0),frameHeight=(obj.sprite.height||obj.size*1.2)*(obj.sprite.scaleY||1);
 for(const [i,image]of obj.progressionWisps)if(i>=shapes.length){image.destroy();obj.progressionWisps.delete(i);}
 for(const [i,n]of shapes.entries()){
  const {key,layout:l}=source(n.id);if(!l||!s.textures?.exists(key))continue;
  const tx=cleanEffectTexture(s,key,{columns:1,rows:1,matteFloor:12,maxSize:256});let image=obj.progressionWisps.get(i);if(!image){image=s.add.image(0,0,tx);obj.progressionWisps.set(i,image);}else if(image.texture&&image.texture.key!==tx)image.setTexture(tx);
  const p=progressionPoint(obj,n.x,n.y),mirror=obj.sprite.flipX?-1:1;
  const smoke=['shadow-smoke','poison-vapor','heat-smoke'].includes(n.id),sword=n.origin==='hilt';
  image.setBlendMode?.(smoke?'NORMAL':sword?'SCREEN':'ADD');
  image.setOrigin(l.cx,n.origin==='hilt'?l.foot??l.cy+l.height/2:l.cy).setPosition(p.x,p.y).setDisplaySize(n.w*frameHeight/l.width,n.h*frameHeight/l.height).setRotation(n.angle*mirror+(obj.sprite.rotation||0)).setDepth((obj.sprite.depth||u.y||0)+(n.behind?-1:2)).setAlpha(Math.min(1,n.alpha*(smoke?1.35:sword?1.2:1.65)));
  if(n.tint)image.setTint?.(n.tint);else image.clearTint?.();
 }
}
