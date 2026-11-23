import {BASIC_PROJECTILE_ART,basicProjectileKey} from './basic-projectile-config.js';
import {acquireSkillImage,releaseSkillImage} from './skill-image-pool.js';

export function preloadBasicProjectiles(scene){
 for(const id of Object.keys(BASIC_PROJECTILE_ART))scene.load.image(basicProjectileKey(id),'/assets/basic-projectiles-v1/'+id+'.png');
}
function profileFor(scene,e){
 if(e.silent||e.skill||!BASIC_PROJECTILE_ART[e.basicClass])return null;
 const key=basicProjectileKey(e.basicClass);
 if(!scene.textures?.exists(key))return null;
 const texture=scene.textures.get(key);
 if(!texture.has(15)){
  const image=texture.getSourceImage(),w=image.width/4,h=image.height/4;
  for(let i=0;i<16;i++)if(!texture.has(i))texture.add(i,0,Math.round(i%4*w),Math.round(Math.floor(i/4)*h),Math.round(w),Math.round(h));
 }
 return {...BASIC_PROJECTILE_ART[e.basicClass],key};
}
const gemTints={fire:0xffb36d,ice:0xb5f4ff,thunder:0xffedb0,poison:0xb9f578,dark:0xd2a5ff,wind:0xc7ffe9,earth:0xebd7a1};
function imageFor(scene,e,p,frame){
 const image=acquireSkillImage(scene,e.x,e.y,p.key,frame).setDepth(2600);
 const tint=e.poisonEnchanted?0xb8ff79:gemTints[e.gem];
 if(tint)image.setTint(tint);
 return image;
}
export function createBasicProjectile(scene,e){
 const profile=profileFor(scene,e);if(!profile)return null;
 return {profile,head:imageFor(scene,e,profile,0).setDisplaySize(profile.size,profile.size),trail:imageFor(scene,e,profile,4).setOrigin(.8,.5).setDepth(2599).setAlpha(0)};
}
// Analytic heading stays correct after offscreen frames and when a homing target moves.
export function basicProjectilePose(scene,e,t,arrow=false){
 const target=scene.actorObjects?.get(e.targetId)?.sprite;
 const tx=target?.active?target.x:e.tx,ty=target?.active?target.y-20:e.ty;
 const dx=tx-e.x,dy=ty-e.y,distance=Math.hypot(dx,dy),profile=BASIC_PROJECTILE_ART[e.basicClass];
 let x=e.x+dx*t,y=e.y+dy*t,vx=dx,vy=dy;
 // Class-specific offsets move the painted artwork only, preserving hit timing and destination.
 if(profile?.flight==='arc'){
  const rise=Math.min(18,distance*.065);
  y-=Math.sin(t*Math.PI)*rise;vy-=Math.cos(t*Math.PI)*Math.PI*rise;
 }else if(profile?.flight==='sway'){
  const amplitude=Math.min(9,distance*.045),nx=distance?-dy/distance:0,ny=distance?dx/distance:0;
  const wave=Math.sin(t*Math.PI*2)*Math.sin(t*Math.PI)*amplitude;
  const tangent=(Math.PI*2*Math.cos(t*Math.PI*2)*Math.sin(t*Math.PI)+Math.PI*Math.sin(t*Math.PI*2)*Math.cos(t*Math.PI))*amplitude;
  x+=nx*wave;y+=ny*wave;vx+=nx*tangent;vy+=ny*tangent;
 }else if(profile?.flight==='diagonal'){
  const lift=Math.min(18,distance*.09);
  y-=lift*(1-t);vy+=lift;
 }else{
  const bend=e.straight||arrow||profile?.arrow?0:Math.min(24,distance*.08);
  y-=Math.sin(t*Math.PI)*bend;vy-=Math.cos(t*Math.PI)*Math.PI*bend;
 }
 return {x,y,angle:Math.atan2(vy,vx)};
}
export function updateBasicProjectile(scene,v,t){
 const art=v.basicProjectile;if(!art)return false;
 const {profile:p,head,trail}=art,{x,y,angle}=basicProjectilePose(scene,v.e,t,p.arrow),frame=Math.floor(v.age*16)%4;
 head.setFrame(frame).setPosition(x,y).setRotation(angle);
 const length=Math.min(p.trail,Math.hypot(x-v.e.x,y-v.e.y)/.68);
 trail.setFrame(4+frame).setPosition(x-Math.cos(angle)*7,y-Math.sin(angle)*7).setRotation(angle).setDisplaySize(Math.max(1,length),p.trailHeight).setAlpha(Math.min(1,v.age/.055)*.85);
 return true;
}
export function createBasicImpact(scene,e){
 const profile=profileFor(scene,e);if(!profile)return null;
 return {profile,image:imageFor(scene,e,profile,8).setDisplaySize(profile.impact,profile.impact)};
}
export function updateBasicImpact(v,t){
 const art=v.basicImpact;if(!art)return false;
 art.image.setFrame(8+Math.min(7,Math.floor(t*8))).setAlpha(Math.min(1,(1-t)*8));
 return true;
}
export function destroyBasicProjectile(v){
 if(!v)return;
 releaseSkillImage(v.basicProjectile?.head);releaseSkillImage(v.basicProjectile?.trail);releaseSkillImage(v.basicImpact?.image);
 v.basicProjectile=null;v.basicImpact=null;
}
