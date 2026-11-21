import {propsBlock} from './prop-spatial-index.js';
import {terrainModifiers,biomeAt,BIOMES} from './world-biomes.js';
import {WORLD} from './content.js';
export function canStand(map,x,y,radius=12){
 if(x<18||x>(map.width||WORLD.width)-18||y<35||y>(map.height||WORLD.height)-18)return false;
 if(BIOMES[biomeAt(map,{x,y})?.type]?.blocked)return false;
 // Only the house footprint is solid, leaving its southern gate accessible.
 if(x>map.base.x-145-radius&&x<map.base.x+145+radius&&y>map.base.y-205-radius&&y<map.base.y+45+radius)return false;
 if((map.fortifications||[]).some(o=>Math.hypot(x-o.x,y-o.y)<o.radius+radius))return false;
 return !propsBlock(map,x,y,radius);
}
export function move(u,tx,ty,speed,dt,map){
 const dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy);if(d<.1)return;
 speed*=terrainModifiers(map,u).speed;const step=Math.min(d,speed*dt),nx=u.x+dx/d*step,ny=u.y+dy/d*step;u.face=dx<-.1?-1:dx>.1?1:u.face;
 u.direction=Math.abs(dx)>Math.abs(dy)?dx<0?2:3:dy<0?1:0;
 if(canStand(map,nx,ny)){u.x=nx;u.y=ny;return;}
 if(canStand(map,nx,u.y))u.x=nx;
 if(canStand(map,u.x,ny))u.y=ny;
}
