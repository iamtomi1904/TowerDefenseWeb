import {cleanEffectTexture} from './effect-alpha.js';
export function preloadGuardianActions(s){s.load.image('guardian-actions','/assets/guardian/actions-v3.png');s.load.image('guardian-fx','/assets/guardian/effects-v3.png');}
function frame(s,raw,row,n,rows){const key=cleanEffectTexture(s,raw,{columns:6,rows,matteFloor:raw==='guardian-fx'?68:28,maxSize:1536,pixelMask:raw==='guardian-fx'?((x,y,c,r,w,h)=>{const edge=Math.min(x/w,1-x/w,y/h,1-y/h);return Math.max(0,Math.min(1,(edge-.055)/.04));}):null}),tx=s.textures.get(key),im=tx.getSourceImage(),name=row*6+n;if(!tx.has(name)){const x=Math.round(n*im.width/6),y=Math.round(row*im.height/rows);tx.add(name,0,x,y,Math.round((n+1)*im.width/6)-x,Math.round((row+1)*im.height/rows)-y);}return {key,name,im};}
export function playGuardianAction(s,u,obj,action){
 if(u.hero!=='knight-1'||u.hp<=0||u.stun>0)return false;
 const now=s.time?.now||0,q=u.castSkill==='shield-bash'&&(u.castAnim>0||now<(obj.guardQEnd||0));
 if(u.castSkill==='shield-bash'&&u.castAnim>0&&obj.guardCast!==u.castCount){obj.guardCast=u.castCount;obj.guardQStart=now;obj.guardQEnd=now+1250;}
 const third=action==='attack'&&u.mastery>=2&&u.attackCount>0&&u.attackCount%3===0;
 if(!q&&!third)return false;
 if(third&&obj.guardAttack!==u.attackCount){obj.guardAttack=u.attackCount;obj.guardAttackStart=now;}
 const duration=q?1250:Math.max(420,obj.attackDuration||500),start=q?obj.guardQStart:obj.guardAttackStart,n=Math.min(5,(q?((now-(start??now))<1000?Math.min(2,Math.floor((now-(start??now))/334)):3+Math.min(2,Math.floor((now-(start??now)-1000)/84))):Math.floor(Math.max(0,(now-(start??now))/duration)*6))),f=frame(s,'guardian-actions',q?0:1,n,2);
 obj.sprite.anims.stop();obj.sprite.setTexture(f.key,f.name).setOrigin(.5,.94).setScale(obj.size/(f.im.height/2*.66));obj.attackRestart=false;return true;
}
export function updateGuardianEffects(s,u,obj,time){
 if(u.hero!=='knight-1'||u.hp<=0){for(const im of obj.guardImages||[])im.destroy();obj.guardImages=null;return;}
 if(!obj.guardImages){obj.guardImages=Array.from({length:3},()=>s.add.image(0,0,'guardian-fx'));obj.sprite.once?.('destroy',()=>{for(const im of obj.guardImages||[])im.destroy();obj.guardImages=null;});}
 if((u.guardWaveTime||0)>(obj.guardLastWave||0)+.1)obj.guardReflectAt=time;obj.guardLastWave=u.guardWaveTime||0;
 if(u.attackCount!==obj.guardFxAttack){obj.guardFxAttack=u.attackCount;if(u.mastery>=2&&u.attackCount>0&&u.attackCount%3===0)obj.guardImpactAt=time+250;}
 if(u.castCount!==obj.guardFxCast){obj.guardFxCast=u.castCount;if(u.castSkill==='shield-bash'&&u.castAnim>0)obj.guardImpactAt=time+1000;}
 for(let row=0;row<3;row++){const im=obj.guardImages[row],age=(time-(row===0?obj.guardImpactAt:obj.guardReflectAt))/1000,active=row===2?u.shield>0:age>=0&&age<.6;if(!active){im.setVisible(false);continue;}const n=row===2?Math.floor(time/120)%6:Math.min(5,Math.floor(age*10)),f=frame(s,'guardian-fx',row,n,3),size=obj.size;
  im.setVisible(true).setTexture(f.key,f.name).setPosition(obj.sprite.x+(row===0?(u.face||1)*18:0),row===0?obj.groundY:obj.sprite.y-size*.45).setOrigin(.5,row===0?.65:.5).setDisplaySize(row===0?size*2.4:size*1.5,row===0?size*1.3:size*1.6).setDepth(row===0?obj.groundY-1:obj.sprite.depth+1).setBlendMode('ADD').setAlpha(row===2?.7:1);
 }
}
