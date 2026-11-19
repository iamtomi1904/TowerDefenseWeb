import {preloadPassiveActionFX,createPassiveActionFX,updatePassiveActionFX} from './passive-action-fx.js';
import {preloadPassiveActivations,createPassiveActivation,updatePassiveActivation} from './passive-activation-art.js';
import {cleanEffectTexture} from './effect-alpha.js';
import {preloadActionSkills,createActionSkill,updateActionSkill,actionKind} from './action-skill-art.js';
const SHEETS={'painted-elements':{file:'elemental-v3',rows:6},'painted-martial':{file:'martial-v3',rows:4},'painted-motes':{file:'mage-orbits-v3',rows:3}};
function textureKey(s,key){return cleanEffectTexture(s,key,{rows:SHEETS[key].rows,matteFloor:key==='painted-martial'?76:16});}
export function preloadPaintedSkills(s){preloadPassiveActionFX(s);preloadPassiveActivations(s);preloadActionSkills(s);for(const [key,{file}]of Object.entries(SHEETS))s.load.image(key,'/assets/combat/'+file+'.png');}
export function paintedFrame(s,key,row,frame){
 if(!s.textures?.exists(key))return null;
 const tx=s.textures.get(textureKey(s,key)),im=tx.getSourceImage(),rows=SHEETS[key].rows,name='painted:'+row+':'+frame;
 if(!tx.has(name)){const x=Math.round(frame*im.width/6),y=Math.round(row*im.height/rows);tx.add(name,0,x,y,Math.round((frame+1)*im.width/6)-x,Math.round((row+1)*im.height/rows)-y);}return name;
}
function profile(e){
 if(e.type==='lightning')return {key:'painted-elements',row:5,beam:true};
 if(e.action==='quake-land')return {key:'painted-martial',row:0,ground:true,slam:true};
 if(e.type==='wind-vfx'&&['dash','whirl'].includes(e.action))return {key:'painted-martial',row:1,directed:true,follow:true};
 if(e.type==='vanguard-vfx'&&e.skill==='vanguard-flurry'&&['thrust','finisher'].includes(e.action))return {key:'painted-martial',row:2,directed:true,follow:true,cone:true};
 return null;
}
export function createPaintedSkill(s,v){
 if(v.e.type==='passive-action-fx')return createPassiveActionFX(s,v.e);
 if(v.e.type==='passive-vfx')return createPassiveActivation(s,v.e);
 if(actionKind(v.e))return createActionSkill(s,v.e);
 const p=profile(v.e);if(!p)return null;const frame=paintedFrame(s,p.key,p.row,0);if(frame===null)return null;
 const image=s.add.image(v.e.x,v.e.y,textureKey(s,p.key),frame).setDepth(p.ground?24:2501);
 if(p.slam)image.setOrigin(.5,.72);
 return {...p,image,parts:[]};
}
export function updatePaintedSkill(s,v,t){
 if(updatePassiveActionFX(s,v,t))return true;
 if(updatePassiveActivation(s,v,t))return true;
 if(updateActionSkill(s,v,t))return true;
 const p=v.painted;if(!p)return false;const e=v.e,r=e.radius||v.radius||75,owner=p.follow?s.actorObjects?.get(e.sourceId):null,x=owner?.sprite?.active?owner.sprite.x:e.x,y=owner?.sprite?.active?owner.groundY:e.y;
 const frame=Math.min(5,Math.floor(Math.min(.999,t)*6));let width=r*2.55,height=width,xx=x,yy=y;
 if(p.slam){width=r*2.3;height=width*.9;}
 if(p.cone){width=r*1.45;height=r*.95;xx=x+Math.cos(e.angle||0)*r*.47;yy=y-18+Math.sin(e.angle||0)*r*.47;}
 else if(p.directed){width=r*2.7;height=width;yy=y-16;}
 let rotation=p.directed?e.angle||0:0;
 if(p.beam){const dx=e.tx-e.x,dy=e.ty-e.y;width=Math.hypot(dx,dy)*1.25;height=Math.min(95,Math.max(48,width*.26));xx=(e.x+e.tx)/2;yy=(e.y+e.ty)/2;rotation=Math.atan2(dy,dx);}
 p.image.setFrame(paintedFrame(s,p.key,p.row,frame)).setPosition(xx,yy).setDisplaySize(Math.max(1,width),Math.max(1,height)).setRotation(rotation).setAlpha(Math.min(1,(1-t)*7)*.95);return true;
}
export function destroyPaintedSkill(v){if(!v)return;v.painted?.image.destroy();for(const image of v.painted?.parts||[])image.destroy();v.painted=null;}
function clearBodies(obj){for(const image of obj.paintedBodies?.values()||[])image.destroy();obj.paintedBodies?.clear();}
export function updatePaintedBody(s,u,obj,time){
 if(!s.textures?.exists('painted-motes')||!s.textures?.exists('painted-martial'))return false;
 obj.paintedBodies||=new Map();
 if(!obj.paintedBodyCleanup){obj.paintedBodyCleanup=true;obj.sprite.once?.('destroy',()=>clearBodies(obj));}
 const mage=false,giant=u.classId==='vanguard'&&u.vanguardTime>0;
 if(u.hp<=0||!mage&&!giant){clearBodies(obj);return true;}
 const tier=Math.min(3,Math.floor(Math.max(0,(u.level||1)-1)/5)),count=mage?3+tier*2:1;
 for(const [id,image]of obj.paintedBodies)if(id>=count){image.destroy();obj.paintedBodies.delete(id);}
 for(let i=0;i<count;i++){
  const key=mage?'painted-motes':'painted-martial',row=mage?['pyromancer','tidecaller','stormcaller'].indexOf(u.classId):3,frame=paintedFrame(s,key,row,Math.floor(time/110+i*1.7)%6);
  let image=obj.paintedBodies.get(i);if(!image){image=s.add.image(0,0,textureKey(s,key),frame);obj.paintedBodies.set(i,image);}
  if(mage){const a=time/(1400-tier*140)+i*Math.PI*2/count,d=24+tier*3,size=16+tier*2,x=obj.sprite.x+Math.cos(a)*d,y=obj.sprite.y-(obj.size||57)*.5+Math.sin(a)*13;image.setFrame(frame).setPosition(x,y).setDisplaySize(size,size).setDepth(Math.sin(a)>0?20008:obj.sprite.depth-1).setAlpha(.9);}
  else{const h=obj.size||96;image.setFrame(frame).setPosition(obj.sprite.x,(obj.groundY??u.y??obj.sprite.y)-h*.42).setDisplaySize(h*1.3,h*1.6).setDepth(20007).setAlpha(.82);}
 }
 return true;
}
