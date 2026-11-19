import {cleanEffectTexture} from './effect-alpha.js';
// Each row is a separately painted six-frame effect, never a recolored generic spark.
export const PASSIVE_FX_PROFILES={
 guardian:['martial',0,'ground',96,66],assassin:['martial',1,'contact',65,65],
 paladin:['martial',2,'cleave',92,90],'paladin-mounted':['martial',2,'cleave',115,108],
 windblade:['martial',3,'flight',95,48],
 'duelist-critical':['weapons',0,'cleave',90,82],'duelist-dual':['weapons',1,'cleave',92,84],
 ranger:['weapons',2,'flight',64,30],darkelf:['weapons',3,'flight',66,34],
 'piercing-arrow':['weapons',2,'pierce',90,28],
 berserker:['power',0,'cleave',98,84],ravager:['power',1,'cleave',112,96],
 vanguard:['power',2,'thrust',116,45],'heal-water':['power',3,'water',61,38],
 tidecaller:['power',3,'gather',48,40]
};
export function preloadPassiveActionFX(s){for(const id of ['martial','weapons','power'])s.load.image('passive-impact:'+id,'/assets/passive-effects-v2/'+id+'.png');}
function frame(s,sheet,row,n){
 const raw='passive-impact:'+sheet,key=cleanEffectTexture(s,raw,{columns:6,rows:4,matteFloor:24,maxSize:1536}),tx=s.textures.get(key),im=tx.getSourceImage(),name=row*6+n;
 if(!tx.has(name)){const x=Math.round(n*im.width/6),y=Math.round(row*im.height/4);tx.add(name,0,x,y,Math.round((n+1)*im.width/6)-x,Math.round((row+1)*im.height/4)-y);}
 return {key,name};
}
const clamp=n=>Math.max(0,Math.min(1,n));
export function createPassiveActionFX(s,e){
 const profile=e.type==='passive-action-fx'&&PASSIVE_FX_PROFILES[e.action];if(!profile||!s.textures.exists('passive-impact:'+profile[0]))return null;
 const f=frame(s,profile[0],profile[1],0),image=s.add.image(e.x,e.y,f.key,f.name).setDepth(profile[2]==='ground'?25:2503);
 return {passiveMotion:true,profile,image,parts:[]};
}
export function updatePassiveActionFX(s,v,t){
 const p=v.painted;if(!p?.passiveMotion)return false;
 const e=v.e,[sheet,row,kind,w,h]=p.profile,owner=s.actorObjects?.get(e.sourceId),target=s.actorObjects?.get(e.targetId);
 const x=owner?.sprite?.x??e.x,y=owner?.sprite?owner.sprite.y-24:e.y;
 const face=e.face??(owner?.sprite?.flipX?-1:1),tx=target?.sprite?.x??e.tx??x+face*45,ty=target?.sprite?target.sprite.y-24:e.ty??y;
 const dx=tx-x,dy=ty-y,distance=Math.hypot(dx,dy),angle=distance>3?Math.atan2(dy,dx):face<0?Math.PI:0;
 const phase=clamp(t),travel=clamp((phase-.12)/.7),max=(e.level||1)>=16,boost=max?1.12:1;
 let xx=x,yy=y,rotation=angle,width=w,height=h;
 if(['flight','pierce','water'].includes(kind)){
  const reach=kind==='pierce'?1.2:1;xx=x+dx*travel*reach;yy=y+dy*travel*reach;
  if(kind==='water'){xx+=Math.sin(travel*Math.PI*2)*8;yy-=Math.sin(travel*Math.PI)*24;rotation=angle+Math.sin(travel*Math.PI)*.35;}
 }else if(kind==='ground'){
  xx=distance>3?tx:x+face*24;yy=(target?.groundY??owner?.groundY??ty+24)-3;rotation=0;
 }else if(kind==='contact'){
  xx=tx;yy=ty;rotation=0;
 }else if(kind==='gather'){
  xx=x+Math.cos(phase*Math.PI)*12;yy=y-8-Math.sin(phase*Math.PI)*10;rotation=-Math.PI/2;
 }else if(kind==='thrust'){
  xx=x+Math.cos(angle)*Math.min(distance*.55,50);yy=y+Math.sin(angle)*Math.min(distance*.55,50);width=Math.max(w,Math.min(150,distance+48));
 }else{
  xx=x+Math.cos(angle)*Math.min(distance*.55,30);yy=y+Math.sin(angle)*Math.min(distance*.55,30);
 }
 const f=frame(s,sheet,row,Math.min(5,Math.floor(phase*6)));
 p.image.setTexture(f.key,f.name).setPosition(xx,yy).setOrigin(.5,.5).setDisplaySize(width*boost,height*boost).setRotation(rotation).setAlpha(phase>=1?0:Math.min(1,.55+Math.sin(phase*Math.PI)*.55)).setBlendMode?.('ADD');
 return true;
}
