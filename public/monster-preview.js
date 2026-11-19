import {KNIGHT_ATLASES,KNIGHT_ACTIONS} from './knight-refresh-art.js';
import {KNIGHT_LAYOUT} from './knight-frame-layout.js';
export function monsterPreview(canvas,actor,catalog,{size=90,action='idle'}={}){
 const a=catalog.actors.find(a=>a.id===actor);if(!a)return;
 const redesign=KNIGHT_ATLASES[actor],newRow=Math.max(0,KNIGHT_ACTIONS.indexOf(action)),info=redesign?{frames:6,start:newRow*6,atlasColumns:6,originX:.5,originY:.98}:a.actions[action]||a.actions.idle,img=new Image();let running=true,last=-1;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function draw(time){if(!running)return;const f=reduced?0:Math.floor(time/140)%info.frames;
  if(img.complete&&img.naturalWidth&&f!==last){last=f;const bounds=canvas.getBoundingClientRect();if(bounds.bottom>=0&&bounds.top<=innerHeight){const c=canvas.getContext('2d'),idx=(info.start||0)+f,cols=info.atlasColumns||a.sheetColumns||info.frames,rect=redesign?{x:Math.round(f*img.naturalWidth/6),y:Math.round(newRow*img.naturalHeight/6),width:Math.round((f+1)*img.naturalWidth/6)-Math.round(f*img.naturalWidth/6),height:Math.round((newRow+1)*img.naturalHeight/6)-Math.round(newRow*img.naturalHeight/6)}:info.frameRects?.[f],fw=rect?.width||info.frameWidth||a.frame,fh=rect?.height||info.frameHeight||a.frameHeight||a.frame,scale=size/(redesign?img.naturalHeight/6*(KNIGHT_LAYOUT[redesign]?.bodyRatio||.8):info.bodyHeight||a.bodyHeight);c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;c.drawImage(img,(rect?.x??idx%cols*fw),(rect?.y??Math.floor(idx/cols)*fh),fw,fh,canvas.width/2-(info.framePivots?.[f]?.x??info.originX??a.originX)*fw*scale,canvas.height-15-(redesign?KNIGHT_LAYOUT[redesign]?.originY[idx]??.98:info.framePivots?.[f]?.y??info.originY??a.originY)*fh*scale,fw*scale,fh*scale);}else last=-1;}
  requestAnimationFrame(draw);
 }
 img.onload=()=>requestAnimationFrame(draw);img.src=redesign?'/assets/knights-v2/'+redesign+'.png':info.url;return ()=>running=false;
}
