export function preloadMoonForestArt(s){s.load.image('moonforest-effects','/assets/moon-forest-v1/effects.png');s.load.image('moonforest-caster','/assets/moon-forest-v1/caster.png');}
export function playMoonForestCast(s,u,obj){
 if(u.hero!=='dark-elf'||u.castSkill!=='elf-spirit'||u.hp<=0||u.stun>0||!(u.castAnim>0)||!s.textures.exists('moonforest-caster'))return false;
 const preparing=u.skillPrepareTime>0,duration=preparing?(u.skillPrepareDuration||.45):(u.castDuration||.5),left=preparing?u.skillPrepareTime:u.castAnim,progress=Math.max(0,Math.min(.999,1-left/duration)),row=(u.level||1)>=16?1:0,frame=(preparing?0:3)+Math.min(2,Math.floor(progress*3)),n=row*6+frame,tx=s.textures.get('moonforest-caster');
 if(!tx.has(n))tx.add(n,0,frame*192,row*224,192,224);
 obj.sprite.anims.stop();obj.sprite.setTexture('moonforest-caster',n).setOrigin(.5,.94).setScale(obj.size/(224*.8)).setFlipX(u.face<0);obj.attackRestart=false;obj.refreshCastCount=u.castCount;obj.refreshCastUntil=0;return true;
}
