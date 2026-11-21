import {effectInView,setRenderDormant} from './render-budget.js';
import {elementAnimationFrame,meteorAirTexture} from './element-animation.js';
import {createSpellCircle,updateSpellCircle} from './action-skill-art.js';
import {cleanEffectTexture} from './effect-alpha.js';
function texture(s){const key=cleanEffectTexture(s,'meteor-painted',{columns:2,rows:2,matteFloor:40,maxSize:1280}),tx=s.textures.get(key),im=tx.getSourceImage();for(let n=0;n<4;n++)if(!tx.has(n))tx.add(n,0,Math.round(n%2*im.width/2),Math.round(Math.floor(n/2)*im.height/2),Math.floor(im.width/2),Math.floor(im.height/2));return key;}
export function meteorEvent(s,e){
 if(!['meteor-fall','meteor-impact'].includes(e.type))return false;if(!s.textures.exists('meteor-painted'))return false;
 const key=texture(s),fall=e.type==='meteor-fall',nodes=fall?[s.add.image(0,0,key,1),s.add.image(0,0,key,1),s.add.image(0,0,key,0),s.add.image(0,0,meteorAirTexture(s))]:[s.add.image(e.x,e.y,key,3),s.add.image(e.x,e.y,key,2)];
 nodes.forEach((im,i)=>im.setDepth(fall?2700+i:i?2702:23));s.paintedMeteors||=[];if(s.paintedMeteors.length>=24){const old=s.paintedMeteors.shift();old.nodes.forEach(im=>im.destroy());old.rune?.destroy();}s.paintedMeteors.push({e,fall,nodes,rune:createSpellCircle(s,{...e,skill:'meteor'}),age:0,duration:fall?e.duration||1.1:1.2});return true;
}
export function updateMeteors(s,dt){s.paintedMeteors=(s.paintedMeteors||[]).filter(v=>{
 v.age+=dt;const t=Math.min(1,v.age/v.duration),r=v.e.radius||205;setRenderDormant(v,!effectInView(s,v));if(t<1&&!v.renderDormant){updateSpellCircle(s,v,t);
 if(v.fall){const d=1-t*t,x=v.e.x-160*d,y=v.e.y-360*d,diameter=r*.96,aspect=(s.cameras?.main?.zoomX||1)/(s.cameras?.main?.zoomY||1);for(let i=0;i<2;i++){const slip=(v.age*1.6+i*.5)%1;v.nodes[i].setFlipX(true).setPosition(x-diameter*.42-slip*30,y-diameter*.82-slip*65).setDisplaySize(diameter*1.3,diameter*1.75*aspect).setAlpha((1-slip)*.58);}const frame=elementAnimationFrame(s,0,v.age);v.nodes[2].setTexture(frame.key,frame.frame).setPosition(x,y-diameter*.23).setDisplaySize(diameter*1.5,diameter*1.5*aspect).setRotation(t*.22);v.nodes[3].setPosition(x,y-diameter*.23).setDisplaySize(diameter*1.5,diameter*1.5*aspect).setRotation(.38).setAlpha(.55+Math.sin(v.age*28)*.1);}
 else{const fade=Math.max(0,1-t);v.nodes[0].setDisplaySize(r*1.6,r*1.05).setAlpha(fade*.8);const frame=elementAnimationFrame(s,1,v.age);v.nodes[1].setTexture(frame.key,frame.frame).setOrigin(.5,.67).setPosition(v.e.x,v.e.y).setDisplaySize(r*2,r*1.3).setAlpha(Math.min(1,fade*3));}
 }
 if(t>=1){v.nodes.forEach(im=>im.destroy());v.rune?.destroy();return false;}return true;
 });}
export function clearMeteors(s){for(const v of s.paintedMeteors||[]){v.nodes.forEach(im=>im.destroy());v.rune?.destroy();}s.paintedMeteors=[];}
