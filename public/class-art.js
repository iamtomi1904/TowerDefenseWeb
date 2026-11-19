// Pixel-material grading runs once at load; animation geometry and alpha stay intact.
export const CLASS_ART = {
 'dark-elf':{classId:'darkelf',color:0xc4aedb,cloth:[86,59,112],light:[228,213,243]},
 'goblin-assassin':{classId:'assassin',color:0xb1c985,cloth:[64,86,53],light:[217,226,171]},
 'fire-wizard': {classId:'pyromancer',color:0xf5a657,cloth:[170,57,36],light:[255,216,139]},
 'wanderer-magican': {classId:'tidecaller',color:0x91ddd5,cloth:[40,123,141],light:[199,246,231]},
 'lightning-mage': {classId:'stormcaller',color:0xaacfff,cloth:[79,87,163],light:[220,235,255]},
 'warrior-1': {classId:'berserker',color:0xe5a473,cloth:[145,67,48],light:[243,204,154]},
 'warrior-2': {classId:'ravager',color:0xe5a473,cloth:[145,67,48],light:[243,204,154]},
 'warrior-3': {classId:'vanguard',color:0xd6ae76,cloth:[135,98,58],light:[242,218,170]},
 'samurai': {classId:'windblade',color:0xa2dddb,cloth:[54,116,114],light:[212,248,242]},
 'samurai-archer': {classId:'ranger',color:0xb3d59b,cloth:[65,108,69],light:[220,230,168]},
 'samurai-commander': {classId:'duelist',color:0xc0e7ca,cloth:[49,111,102],light:[221,244,216]},
 'knight-1': {classId:'guardian',color:0xe1c58a,cloth:[52,88,115],light:[241,225,179]},
 'knight-2': {classId:'paladin',color:0xf2e3ae,cloth:[115,102,62],light:[252,243,205]},
 'knight-3': {classId:'fallen',color:0xb69be0,cloth:[76,52,110],light:[224,205,248]}
};

export function gradePixel(r,g,b,style) {
 const hi=Math.max(r,g,b),lo=Math.min(r,g,b),l=r*.23+g*.58+b*.19;
 // Keep skin, timber and ink recognizable; recolor saturated cloth and cool metals.
 const skin=r>g*1.13&&g>b*1.12&&g>70;
 if(hi-lo>35&&!skin){
  const k=Math.min(1,l/210),shade=k<.52?style.cloth.map(v=>v*(.38+k)):style.cloth.map((v,i)=>v+(style.light[i]-v)*(k-.52)/.48);
  return shade.map(v=>Math.round(Math.max(0,Math.min(255,v))));
 }
 const contrast=(l-110)*.09;
 return [r,g,b].map((v,i)=>Math.round(Math.max(0,Math.min(255,v+contrast+(hi-lo<32&&l>115?(style.light[i]-190)*.13:0)))));
}

export function prepareClassArt(scene,catalog,{suffix=''}={}) {
 for(const actor of catalog.actors){
  const style=CLASS_ART[actor.id];if(!style)continue;
  for(const [action,info] of Object.entries(actor.actions)){
   const key=actor.id+':'+action;if(!scene.textures.exists(key))continue;
   const source=scene.textures.get(key).getSourceImage(),canvas=document.createElement('canvas');
   canvas.width=source.width;canvas.height=source.height;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);
   const image=ctx.getImageData(0,0,canvas.width,canvas.height),d=image.data;
   for(let i=0;i<d.length;i+=4)if(d[i+3]){const rgb=gradePixel(d[i],d[i+1],d[i+2],style);d[i]=rgb[0];d[i+1]=rgb[1];d[i+2]=rgb[2];}
   ctx.putImageData(image,0,0);
   const target=key+suffix;if(scene.textures.exists(target))scene.textures.remove(target);
   scene.textures.addSpriteSheet(target,canvas,{frameWidth:info.frameWidth||actor.frame,frameHeight:info.frameHeight||actor.frameHeight||actor.frame});
  }
 }
}

// Small, restrained accents: readable at the actual 57px battlefield size.
export function drawClassIdentity(scene,u,obj,time){
 const style=CLASS_ART[u.hero];if(!style||u.hp<=0)return;
 const g=scene.unitGlow,ground=scene.unitGround,x=obj.sprite.x,y=obj.sprite.y;
 const k=obj.size/57,c=style.color,t=time/1000,face=u.face<0?-1:1;
 const mage=['pyromancer','tidecaller','stormcaller'].includes(style.classId);
 if(mage){return; }else if(u.anim>0||u.moving){
  const wx=x-face*14*k,wy=y-23*k;
  g.lineStyle(1,c,.4).lineBetween(wx,wy,wx-face*(u.moving?12:5)*k,wy+5*k);
 }
 if(style.classId==='guardian'&&u.shield>0){
  const px=x+face*20*k,py=y-26*k;
  g.lineStyle(2,c,.75).strokePoints([{x:px-10*k,y:py-13*k},{x:px+10*k,y:py-13*k},{x:px+8*k,y:py+7*k},{x:px,y:py+15*k},{x:px-8*k,y:py+7*k}],true);
 }
}
