// Frame-rate independent correction toward server positions, without client-side collision prediction.
export function movementBlend(dt,local=false){return 1-Math.exp(-Math.max(0,dt)/(local?35:70));}
export function settlePosition(current,target,blend){const next=current+(target-current)*blend;return Math.abs(target-next)<.35?target:next;}
export function visuallyMoving(unit,obj){return !!unit.moving||Math.hypot(obj.sprite.x-unit.x,obj.groundY-unit.y)>1;}
export function followGround(scene,obj){
 if(!scene.followAnchor)scene.followAnchor=scene.add.zone(obj.sprite.x,obj.groundY,1,1);
 scene.followAnchor.setPosition(obj.sprite.x,obj.groundY);
 if(scene.followSprite!==obj.sprite){scene.followSprite=obj.sprite;scene.cameras.main.startFollow(scene.followAnchor,false,1,1,0,85);}
}

// Fill the gaps between 20 Hz snapshots with a short, bounded visual continuation.
// No gameplay state is modified; collisions and final positions still come from the server.
export function renderMovementTarget(obj,unit,now,receivedAt=now){
 let sample=obj.motionSample;
 if(!sample){sample=obj.motionSample={unit,x:unit.x,y:unit.y,at:receivedAt,vx:0,vy:0};}
 else if(sample.unit!==unit){
  const elapsed=receivedAt-sample.at,dx=unit.x-sample.x,dy=unit.y-sample.y;
  const stable=elapsed>=15&&elapsed<=200&&Math.hypot(dx,dy)<100;
  sample=obj.motionSample={unit,x:unit.x,y:unit.y,at:receivedAt,vx:stable?dx/elapsed:0,vy:stable?dy/elapsed:0};
 }
 const special=unit.dashing||unit.guardianR||unit.martialLeap||unit.holyLeapTime>0||unit.hp<=0||unit.stun>0;
 const ahead=unit.moving===false||special?0:Math.max(0,Math.min(50,now-sample.at));
 return {x:sample.x+sample.vx*ahead,y:sample.y+sample.vy*ahead};
}
