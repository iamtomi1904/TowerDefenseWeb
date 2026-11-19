import {cleanEffectTexture} from './effect-alpha.js';
import {ENEMY_ATTACK_LAYOUT} from './enemy-attack-layout.js';
export {ENEMY_ATTACK_LAYOUT};
export const ENEMY_ATTACK_FRAMES=6;
export const enemyAttackKey=id=>'enemy-attack:'+id;
export function preloadEnemyAttacks(scene){
 for(const id of Object.keys(ENEMY_ATTACK_LAYOUT))scene.load.image(enemyAttackKey(id),'/assets/enemy-attacks-v1/'+id+'.png');
}
export function createEnemyAttacks(scene){
 for(const id of Object.keys(ENEMY_ATTACK_LAYOUT)){
  const raw=enemyAttackKey(id),key=cleanEffectTexture(scene,raw,{columns:3,rows:2,matteFloor:48,maxSize:768});
  const tx=scene.textures.get(key),im=tx.getSourceImage();
  for(let n=0;n<6;n++){const x=Math.round(n%3*im.width/3),y=Math.round(Math.floor(n/3)*im.height/2);if(!tx.has(n))tx.add(n,0,x,y,Math.round((n%3+1)*im.width/3)-x,Math.round((Math.floor(n/3)+1)*im.height/2)-y);}
  if(!scene.anims.exists(raw))scene.anims.create({key:raw,frames:Array.from({length:6},(_,frame)=>({key,frame})),frameRate:12,repeat:0});
 }
}
export function playEnemyAttack(scene,unit,obj,action){
 const layout=ENEMY_ATTACK_LAYOUT[unit.sprite];
 if(!layout||unit.hero||unit.hp<=0||action!=='attack'||unit.bossCast||unit.skillPose?.time>0)return false;
 const key=enemyAttackKey(unit.sprite),sprite=obj.sprite;
 if(obj.attackRestart||sprite.anims.currentAnim?.key!==key){sprite.play(key,false);obj.attackRestart=false;}
 const image=scene.textures.get(sprite.texture.key).getSourceImage(),fh=image.height/2;
 const scale=obj.size*layout.originalRatio/(fh*layout.bodyRatio),frame=Math.max(0,Math.min(5,Number(sprite.frame.name)||0));
 sprite.setScale(scale).setOrigin(layout.originX,layout.bottoms[frame]-obj.size*layout.footOffset/(scale*fh)).setFlipX(unit.face<0);
 sprite.anims.timeScale=500/Math.max(120,obj.attackDuration||500);
 return true;
}
