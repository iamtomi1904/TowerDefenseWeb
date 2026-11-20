import {cleanEffectTexture} from './effect-alpha.js';
export function preloadWindupActors(s){s.load.image('warrior-windup','/assets/casting/warrior-charge-v1.png');s.load.image('arctic-windup','/assets/casting/arctic-chant-v1.png');s.load.image('meteor-painted','/assets/casting/meteor-v2.png');}
export function playWindupActor(s,u,obj){
 const warrior=u.hero==='warrior-1'&&u.martialPose==='leap-windup',arctic=u.hero==='wanderer-magican'&&u.martialPose==='arctic-chant'&&u.castAnim>0;
 if(u.hp<=0||u.stun>0||!warrior&&!arctic)return false;
 const raw=warrior?'warrior-windup':'arctic-windup',row=(u.level||1)>=16?1:0,key=cleanEffectTexture(s,raw,{columns:6,rows:2,matteFloor:60,maxSize:2172}),tx=s.textures.get(key),im=tx.getSourceImage(),w=im.width/6,h=im.height/2;
 const progress=warrior?Math.max(0,Math.min(1,(1.95-u.castAnim))):Math.max(0,Math.min(1,1-u.castAnim/1.5)),n=Math.min(5,Math.floor(progress*6)),f=row*6+n;
 if(!tx.has(f))tx.add(f,0,Math.round(n*w),Math.round(row*h),Math.round(w),Math.round(h));
 obj.sprite.anims.stop();obj.sprite.setTexture(key,f).setOrigin(.5,warrior?.965:.845).setScale(obj.size/(h*(warrior?.84:.64))).setFlipX(u.face<0);obj.refreshCastCount=u.castCount;obj.refreshCastUntil=0;return true;
}
