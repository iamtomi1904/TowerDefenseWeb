import {drawClassPulse} from '../../public/class-effects.js';
import {writeFileSync} from 'node:fs';
const skills=['fireburst','frostnova','tempest','cleave','arrow-rain','bladestorm','shield-bash'];
const data=skills.map((skill,i)=>{const rects=[];let color=0,alpha=1;const g={fillStyle(c,a){color=c;alpha=a;return g},fillRect(x,y,w,h){rects.push([x,y,w,h,color,alpha]);return g}};drawClassPulse(g,{skill,x:150,y:170},.32,100);return {skill,rects}});writeFileSync('design/class-pixel-refresh/frames.json',JSON.stringify(data));
