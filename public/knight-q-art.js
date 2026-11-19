// Crisp pixel-art canvas VFX textures for Paladin (Tam Thap Tu Tram) & Fallen (Lien Hoan Bao Tram)

function makeCanvas(w,h){
 const canvas=document.createElement('canvas');
 canvas.width=w;canvas.height=h;
 const c=canvas.getContext('2d');
 c.imageSmoothingEnabled=false;
 return {canvas,c};
}

function drawTaperedArc(c,cx,cy,r,startA,endA,maxThick,layers){
 const steps=44;
 for(const [scale,color] of layers){
  c.fillStyle=color;
  c.beginPath();
  for(let i=0;i<=steps;i++){
   const t=i/steps,a=startA+(endA-startA)*t;
   const w=Math.sin(t*Math.PI)*maxThick*scale;
   const px=cx+Math.cos(a)*(r+w*0.55),py=cy+Math.sin(a)*(r+w*0.55);
   if(i===0)c.moveTo(px,py);else c.lineTo(px,py);
  }
  for(let i=steps;i>=0;i--){
   const t=i/steps,a=startA+(endA-startA)*t;
   const w=Math.sin(t*Math.PI)*maxThick*scale;
   const px=cx+Math.cos(a)*(r-w*0.45),py=cy+Math.sin(a)*(r-w*0.45);
   c.lineTo(px,py);
  }
  c.closePath();
  c.fill();
 }
}

function drawBeveledBlade(c,x1,y1,x2,y2,maxW,layers){
 const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
 for(const [scale,color] of layers){
  const w=maxW*scale;
  c.fillStyle=color;
  c.beginPath();
  c.moveTo(x1,y1);
  c.lineTo(x1+dx*0.22+nx*w*0.7,y1+dy*0.22+ny*w*0.7);
  c.lineTo(x1+dx*0.5+nx*w,y1+dy*0.5+ny*w);
  c.lineTo(x1+dx*0.78+nx*w*0.7,y1+dy*0.78+ny*w*0.7);
  c.lineTo(x2,y2);
  c.lineTo(x1+dx*0.78-nx*w*0.7,y1+dy*0.78-ny*w*0.7);
  c.lineTo(x1+dx*0.5-nx*w,y1+dy*0.5-ny*w);
  c.lineTo(x1+dx*0.22-nx*w*0.7,y1+dy*0.22-ny*w*0.7);
  c.closePath();
  c.fill();
 }
}

function addSparks(c,points,colors){
 for(let i=0;i<points.length;i++){
  const [x,y,sz]=points[i];
  c.fillStyle=colors[i%colors.length];
  c.fillRect(Math.round(x-sz/2),Math.round(y-sz/2),sz,sz);
 }
}

export function ensureKnightQTexture(scene,name){
 if(typeof document==='undefined'||!scene?.textures?.addCanvas)return null;
 if(scene.textures.exists(name))return name;

 if(name==='knight-q-holy-1'){
  const {canvas,c}=makeCanvas(224,140);
  drawBeveledBlade(c,14,70,210,70,24,[
   [1.45,'rgba(190,228,255,0.28)'],
   [1.0,'#d8eeff'],
   [0.64,'#ffffff'],
   [0.25,'#fff9d6']
  ]);
  addSparks(c,[[46,52,4],[178,52,4],[46,88,4],[178,88,4],[112,48,3],[112,92,3]],['#ffffff','#fff3b0','#dbeeff']);
  scene.textures.addCanvas(name,canvas);
  return name;
 }

 if(name==='knight-q-holy-2'){
  const {canvas,c}=makeCanvas(160,220);
  drawBeveledBlade(c,80,14,80,206,24,[
   [1.45,'rgba(190,228,255,0.26)'],
   [1.0,'#d4ecff'],
   [0.65,'#ffffff'],
   [0.25,'#fff9d6']
  ]);
  c.fillStyle='#ffffff';
  c.beginPath();c.ellipse(80,192,34,10,0,0,Math.PI*2);c.fill();
  c.fillStyle='rgba(212,236,255,0.45)';
  c.beginPath();c.ellipse(80,192,48,15,0,0,Math.PI*2);c.fill();
  addSparks(c,[[56,168,4],[104,168,4],[46,192,5],[114,192,5],[66,110,3],[94,132,3]],['#ffffff','#fff3b0']);
  scene.textures.addCanvas(name,canvas);
  return name;
 }

 if(name==='knight-q-holy-3'){
  const {canvas,c}=makeCanvas(224,224);
  drawBeveledBlade(c,14,112,210,112,24,[
   [1.45,'rgba(190,228,255,0.28)'],
   [1.0,'#d8eeff'],
   [0.64,'#ffffff']
  ]);
  drawBeveledBlade(c,112,14,112,210,24,[
   [1.45,'rgba(190,228,255,0.28)'],
   [1.0,'#d8eeff'],
   [0.64,'#ffffff']
  ]);
  c.fillStyle='rgba(255,244,184,0.65)';
  c.beginPath();c.arc(112,112,26,0,Math.PI*2);c.fill();
  c.fillStyle='#ffffff';
  c.beginPath();c.arc(112,112,15,0,Math.PI*2);c.fill();
  addSparks(c,[[72,72,5],[152,72,5],[72,152,5],[152,152,5],[112,32,4],[112,192,4],[32,112,4],[192,112,4]],['#ffffff','#fff3b0','#dbeeff']);
  scene.textures.addCanvas(name,canvas);
  return name;
 }

 if(name==='knight-q-fallen-1'){
  const {canvas,c}=makeCanvas(192,192);
  drawTaperedArc(c,86,96,68,-1.18,1.18,28,[
   [1.35,'rgba(126,34,206,0.35)'],
   [1.0,'#9333ea'],
   [0.68,'#e11d48'],
   [0.28,'#1b0926']
  ]);
  addSparks(c,[[146,56,4],[160,90,5],[154,124,4],[132,146,3],[134,44,4],[164,104,3]],['#f43f5e','#a855f7','#4c1d95']);
  scene.textures.addCanvas(name,canvas);
  return name;
 }

 if(name==='knight-q-fallen-2'){
  const {canvas,c}=makeCanvas(224,224);
  drawBeveledBlade(c,24,24,200,200,24,[
   [1.45,'rgba(126,34,206,0.34)'],
   [1.05,'#7e22ce'],
   [0.68,'#e11d48'],
   [0.26,'#170721']
  ]);
  drawBeveledBlade(c,200,24,24,200,24,[
   [1.45,'rgba(126,34,206,0.34)'],
   [1.05,'#7e22ce'],
   [0.68,'#e11d48'],
   [0.26,'#170721']
  ]);
  c.fillStyle='rgba(225,29,72,0.55)';
  c.beginPath();c.arc(112,112,24,0,Math.PI*2);c.fill();
  c.fillStyle='#190724';
  c.beginPath();c.arc(112,112,11,0,Math.PI*2);c.fill();
  addSparks(c,[[112,56,5],[112,168,5],[56,112,5],[168,112,5],[42,42,4],[182,182,4]],['#f43f5e','#a855f7']);
  scene.textures.addCanvas(name,canvas);
  return name;
 }

 return null;
}
