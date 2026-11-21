import {effectInView,setRenderDormant} from './render-budget.js';
import {cleanEffectTexture} from './effect-alpha.js';
import {MOONFALL_LAYOUT} from './moonfall-layout.js';
export function prepareMoonfallArt(scene){
 if(scene.textures.exists('moonfall:moon'))return true;if(!scene.textures.exists('moonfall-atlas')||typeof document==='undefined')return false;
 const source=scene.textures.get('moonfall-atlas').getSourceImage();
 for(const [id,bounds] of Object.entries(MOONFALL_LAYOUT)){
  const [x,y,w,h]=bounds,canvas=document.createElement('canvas'),size=id==='moon'?[128,128]:id==='corona'?[192,192]:id==='impact'?[256,176]:[256,160];canvas.width=size[0];canvas.height=size[1];const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  const scale=Math.min((size[0]-4)/w,(size[1]-4)/h),dw=Math.round(w*scale),dh=Math.round(h*scale);c.drawImage(source,x,y,w,h,Math.round((size[0]-dw)/2),Math.round((size[1]-dh)/2),dw,dh);
  const data=c.getImageData(0,0,...size);for(let i=3;i<data.data.length;i+=4)data.data[i]=Math.round(255*Math.max(0,(data.data[i]-32)/223));c.putImageData(data,0,0);scene.textures.addCanvas('moonfall:'+id,canvas);
 }
 for(const raw of ['moon-animated-atlas'])if(scene.textures.exists(raw)){
  const key=cleanEffectTexture(scene,raw,{columns:2,rows:2,matteFloor:72,maxSize:1024}),tx=scene.textures.get(key),im=tx.getSourceImage();
  for(let i=0;i<4;i++)if(!tx.has(i))tx.add(i,0,Math.round(i%2*im.width/2),Math.round(Math.floor(i/2)*im.height/2),Math.floor(im.width/2),Math.floor(im.height/2));
 }
 if(scene.textures.exists('moon-air-thin'))cleanEffectTexture(scene,'moon-air-thin',{columns:1,rows:1,matteFloor:48,maxSize:512});
 if(scene.textures.exists('moon-sigil'))cleanEffectTexture(scene,'moon-sigil',{columns:1,rows:1,matteFloor:100,maxSize:768});
 return true;
}
export function moonfallPose(z){const progress=Math.max(0,Math.min(1,(z.elapsed??(z.fallDuration-z.delay))/(z.fallDuration||3))),r=z.radius;return {progress,altitude:(r*.325+16.25)*(1-(.12*progress+.88*progress**2.6)),diameter:r*1.65};}
export function createMoonfallVisual(scene){
 if(!prepareMoonfallArt(scene))return null;
 return {moon:scene.add.image(0,0,'moonfall:moon').setDepth(2704),corona:scene.add.image(0,0,'moonfall:corona').setDepth(2703),air:scene.add.image(0,0,'moon-air-thin:clean-alpha-v1').setDepth(2705),airEcho:scene.add.image(0,0,'moon-air-thin:clean-alpha-v1').setDepth(2705),sigil:scene.add.image(0,0,'moon-sigil:clean-alpha-v1').setDepth(3)};
}
export function updateMoonfallVisual(scene,v,z,time){
 if(!v)return;const p=moonfallPose(z),camera=scene.cameras?.main,aspect=(camera?.zoomX||1)/(camera?.zoomY||1),y=z.y-p.altitude-p.diameter*.43;
 v.moon.setTexture('moon-animated-atlas:clean-alpha-v1',Math.floor((z.elapsed||0)*8)%4).setPosition(z.x,y).setDisplaySize(p.diameter*1.42,p.diameter*1.42*aspect).setAlpha(Math.min(1,.3+p.progress*6));
 v.corona.setPosition(z.x,y).setDisplaySize(p.diameter*1.24,p.diameter*1.24*aspect).setRotation(Math.sin(time/1400)*.08).setAlpha(.45+Math.sin(time/200)*.08);
 const slip=((z.elapsed||0)*2.5)%1,airSize=p.diameter*2.1;
 v.air.setPosition(z.x,y+p.diameter*.28*aspect).setDisplaySize(airSize,airSize/3*aspect).setAlpha(Math.min(.72,p.progress*5));
 v.airEcho.setPosition(z.x,y+p.diameter*(.28-slip*.04)*aspect).setDisplaySize(airSize*(1+slip*.12),airSize/3*(1+slip*.06)*aspect).setAlpha((1-slip)*.28*Math.min(1,p.progress*5));
 v.sigil.setPosition(z.x,z.y).setDisplaySize(z.radius*2/.86,z.radius*2/.86).setAlpha(.7+Math.sin(time/240)*.1);

}
export function destroyMoonfallVisual(v){if(!v)return;v.moon.destroy();v.corona.destroy();v.air.destroy();v.airEcho.destroy();v.sigil.destroy();}
export function addMoonImpact(scene,e){
 if(!prepareMoonfallArt(scene))return;
 scene.moonImpacts||=[];if(scene.moonImpacts.length>=12){const old=scene.moonImpacts.shift();old.blast.destroy();old.cracks.destroy();}
 scene.moonImpacts.push({e,age:0,duration:e.duration||.95,blast:scene.add.image(e.x,e.y,'moonfall:impact').setOrigin(.5,.74).setDepth(2705),cracks:scene.add.image(e.x,e.y,'moonfall:cracks').setDepth(4)});
}
export function updateMoonImpacts(scene,dt){scene.moonImpacts=(scene.moonImpacts||[]).filter(v=>{v.age+=dt;setRenderDormant(v,!effectInView(scene,v));if(v.renderDormant&&v.age<v.duration)return true;const t=Math.min(1,v.age/v.duration),scale=.8+Math.min(1,t*5)*.35,r=v.e.radius;
 v.blast.setDisplaySize(r*2.5*scale,r*1.7*scale).setAlpha(Math.max(0,1-t*t));v.cracks.setDisplaySize(r*2.15,r*1.4).setAlpha(Math.min(1,t*8)*(1-t));if(t>=1){v.blast.destroy();v.cracks.destroy();return false;}return true;});}
export function clearMoonImpacts(scene){for(const v of scene.moonImpacts||[]){v.blast.destroy();v.cracks.destroy();}scene.moonImpacts=[];}
