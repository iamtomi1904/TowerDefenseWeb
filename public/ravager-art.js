import {playPassiveAction} from './passive-action-art.js';
export const RAVAGER_ACTIONS=['idle','walk','attack','cast','hurt','dead'];
export function ravagerIcon(el,id){
 const map={'blood-cleave':'/assets/v4/cleave.png','blood-rage':'/assets/v4/fury.png','bloodstorm':'/assets/v4/earthquake.png'};
 if(!map[id])return false;
 el.style.setProperty('--icon',`url("${map[id]}")`);
 el.style.setProperty('background-image','var(--icon)','important');
 el.style.setProperty('background-size','100% 100%','important');
 el.style.setProperty('background-position','50% 50%','important');
 return true;
}
// Grip/tip coordinates measured on the new sheet, not the previous helmet-and-shield sprite.
export const RAVAGER_BLADES=[
 [[.35,.70,.88,.92],[.35,.70,.88,.92],[.35,.70,.88,.92],[.35,.70,.88,.92],[.35,.70,.88,.92],[.35,.70,.88,.92]],
 [[.36,.63,.03,.94],[.39,.61,.04,.91],[.38,.59,.04,.88],[.39,.65,.04,.95],[.38,.61,.03,.92],[.38,.61,.03,.91]],
 [[.40,.76,.02,.91],[.59,.25,.09,.48],[.67,.21,.12,.07],[.58,.70,.91,.97],[.57,.79,.92,.92],[.40,.71,.94,.85]],
 [[.34,.75,.88,.98],[.56,.74,.14,.98],[.52,.77,.12,.98],[.56,.74,.16,.98],[.53,.76,.16,.98],[.38,.75,.89,.98]],
 [[.38,.79,.87,.96],[.38,.79,.87,.96],[.39,.78,.87,.96],[.42,.79,.87,.96],[.38,.79,.87,.96],[.37,.79,.88,.96]],
 [[.38,.80,.87,.96],[.43,.89,.89,.98],[.47,.94,.91,.99],[.49,.96,.91,.99],[.51,.97,.91,.99],[.51,.97,.91,.99]]
].flat();
export function ravagerBladeMask(x,y,frame){
 const blade=RAVAGER_BLADES[frame];if(!blade)return false;
 const [gx,gy,tx,ty]=blade,dx=tx-gx,dy=ty-gy,len2=dx*dx+dy*dy,t=((x-gx)*dx+(y-gy)*dy)/len2;
 return t>=.12&&t<=1.04&&Math.abs((x-gx)*dy-(y-gy)*dx)/Math.sqrt(len2)<.045;
}
export function ravagerGlowActive(u){
 if(u.hero!=='warrior-2'||u.hp<=0)return false;
 return (u.level||1)>=16||!!u.buffs?.some(b=>b.time>0&&b.powerMultiplier>0&&b.lifesteal>0)||(!(u.stun>0)&&((u.castAnim||0)>0||(u.martialLock||0)>0));
}
function createRavagerBladeTexture(scene,source){
 if(typeof document==='undefined'||!scene.textures.addCanvas||scene.textures.exists?.('ravager-blade-glow'))return;
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);
 const input=ctx.getImageData(0,0,canvas.width,canvas.height),output=ctx.createImageData(canvas.width,canvas.height),w=source.width/6,h=source.height/6;
 for(let frame=0;frame<36;frame++){
  const x0=Math.round(frame%6*w),y0=Math.round(Math.floor(frame/6)*h),x1=Math.round((frame%6+1)*w),y1=Math.round((Math.floor(frame/6)+1)*h);
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   const i=(y*canvas.width+x)*4;if(input.data[i+3]<40||!ravagerBladeMask((x-x0)/(x1-x0),(y-y0)/(y1-y0),frame))continue;
   const light=input.data[i]*.23+input.data[i+1]*.58+input.data[i+2]*.19;
   // Keep source blade shading, with a bright hot edge rather than tinting the whole hero.
   output.data[i]=255;output.data[i+1]=Math.min(235,95+light*.7);output.data[i+2]=35+light*.2;output.data[i+3]=Math.min(245,input.data[i+3]);
   for(const [dx,dy]of [[-2,0],[2,0],[0,-2],[0,2]]){
    const xx=x+dx,yy=y+dy;if(xx<x0||xx>=x1||yy<y0||yy>=y1)continue;const j=(yy*canvas.width+xx)*4;
    if(output.data[j+3]<50){output.data[j]=255;output.data[j+1]=55;output.data[j+2]=20;output.data[j+3]=50;}
   }
  }
 }
 ctx.putImageData(output,0,0);const texture=scene.textures.addCanvas('ravager-blade-glow',canvas);
 for(let n=0;n<36;n++){const x=Math.round(n%6*w),y=Math.round(Math.floor(n/6)*h);texture.add(n,0,x,y,Math.round((n%6+1)*w)-x,Math.round((Math.floor(n/6)+1)*h)-y);}
}
export function updateRavagerBladeGlow(scene,u,obj){
 // Passive atlases have their own weapon poses (and painted max-level glow).
 // A six-by-six legacy weapon mask cannot follow a three-by-two body atlas.
 const active=!obj.sprite.texture?.key?.startsWith('passive-action:')&&ravagerGlowActive(u)&&scene.textures.exists?.('ravager-blade-glow');
 if(!active){obj.ravagerBladeGlow?.setVisible(false);return;}
 const sprite=obj.sprite;
 if(!obj.ravagerBladeGlow){
  obj.ravagerBladeGlow=scene.add.image(sprite.x,sprite.y,'ravager-blade-glow',sprite.frame.name).setBlendMode('ADD');
  const glow=obj.ravagerBladeGlow;sprite.once('destroy',()=>glow.destroy());
 }
 const time=scene.time?.now||0,glowSource=scene.textures.get?.('ravager-blade-glow')?.getSourceImage?.(),bodySource=sprite.texture?.getSourceImage?.(),ratioX=bodySource&&glowSource?bodySource.width/glowSource.width:1,ratioY=bodySource&&glowSource?bodySource.height/glowSource.height:1;
 obj.ravagerBladeGlow.setVisible(true).setTexture('ravager-blade-glow',sprite.frame.name).setPosition(sprite.x,sprite.y).setOrigin(sprite.originX,sprite.originY).setScale(sprite.scaleX*ratioX,sprite.scaleY*ratioY).setFlipX(sprite.flipX).setFlipY(sprite.flipY).setRotation(sprite.rotation).setDepth(sprite.depth+.1).setAlpha(.85+Math.sin(time/95)*.12);
}
export function preloadRavagerArt(scene){scene.load.image('ravager-redesign','/assets/ravager/hero-v2.png');}
export function createRavagerAnimations(scene){
 if(!scene.textures.exists('ravager-redesign'))return;
 const texture=scene.textures.get('ravager-redesign'),source=texture.getSourceImage(),w=source.width/6,h=source.height/6;
 for(let n=0;n<36;n++){
  const x=Math.round(n%6*w),y=Math.round(Math.floor(n/6)*h);
  texture.add(n,0,x,y,Math.round((n%6+1)*w)-x,Math.round((Math.floor(n/6)+1)*h)-y);
 }
 for(const [row,action]of RAVAGER_ACTIONS.entries())scene.anims.create({key:'ravager-v2:'+action,frames:Array.from({length:6},(_,i)=>({key:'ravager-redesign',frame:row*6+i})),frameRate:action==='attack'?12:8,repeat:['idle','walk'].includes(action)?-1:0});
 createRavagerBladeTexture(scene,source);
}
export function playRavagerActor(scene,u,obj,requested){
 if(playPassiveAction(scene,u,obj,requested))return true;
 if(u.hero!=='warrior-2')return false;
 const action=u.hp>0&&u.martialPose==='blood-roar'&&u.martialLock>0?'cast':requested;
 if(!RAVAGER_ACTIONS.includes(action))return false;
 const sprite=obj.sprite,key='ravager-v2:'+action,source=scene.textures.get('ravager-redesign').getSourceImage();
 sprite.setOrigin(.5,.98).setScale(obj.size/(source.height/6*.8));
 if(obj.attackRestart&&action==='attack'){sprite.play(key,false);obj.attackRestart=false;}
 else if(['idle','walk'].includes(action)||sprite.anims.currentAnim?.key!==key)sprite.play(key,true);
 sprite.anims.timeScale=action==='attack'?6/Math.max(.12,(obj.attackDuration||500)/1000)/12:action==='cast'?6/Math.max(.2,(obj.attackDuration||500)/1000)/8:action==='walk'?1.25:1;
 updateRavagerBladeGlow(scene,u,obj);
 // Suppress the old glow line at a fixed point beside the hand.
 obj.empoweredId=ravagerGlowActive(u)?'ravager-v2':null;
 return true;
}
