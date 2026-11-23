import {unifiedPropAsset} from './terrain.js';
import {ensureCustomPropTexture} from './custom-props-art.js';
export function buildFortress(s,m,catalog){
 const b=m.base,f=m.fortress,objects=[];const texture=s.textures.get('castle');if(!texture.has('watchtower'))texture.add('watchtower',0,37,650,285,485);
 const floor=s.add.graphics().setDepth(b.y-210);floor.fillStyle(0x09110c,.3).fillEllipse(b.x+24,b.y+52,360*f.scale,96*f.scale);for(const p of m.fortifications||[])floor.fillStyle(0x0c1610,.28).fillEllipse(p.x+10,p.y+12,86,36);objects.push(floor);
 const keepKey=s.textures.exists('castle-'+m.id)?'castle-'+m.id:'castle';
 const keep=s.add.image(b.x,b.y+55,keepKey).setOrigin(.5,.94);keep.setTint(f.tint);keep.setDisplaySize(380*f.scale,380*keep.height/keep.width*f.scale).setDepth(b.y+55);objects.push(keep);
 for(const [i,p]of (m.fortifications||[]).entries()){
  const size=f.layout==='citadel'?88:f.layout==='ruins'?70:75,tower=s.add.image(p.x,p.y+15,'castle','watchtower').setOrigin(.5,.92).setTint(f.tint).setDisplaySize(size,size*1.7).setDepth(p.y+16);objects.push(tower);
  const flag=s.add.graphics().setDepth(p.y+17);flag.lineStyle(2,0xd5c39b).lineBetween(p.x,p.y-110,p.x,p.y-135);flag.fillStyle(f.accent,.95).fillTriangle(p.x,p.y-135,p.x+21,p.y-130,p.x,p.y-124);objects.push(flag);
 }
 const ornAsset=unifiedPropAsset(f.ornament),info=catalog.props.find(p=>p.id===ornAsset);if(info)for(const side of [-1,1])objects.push(s.add.image(b.x+side*256,b.y-64,ornAsset).setOrigin(.5,.85).setScale((f.layout==='grove'?135:85)/info.height).setDepth(b.y+20));
 for(const side of [-1,1]){const wall=s.add.image(b.x+side*128,b.y+45,'stone-wall-'+m.id).setOrigin(.5,1).setTint(f.tint);wall.setDisplaySize(128,128*wall.height/wall.width).setDepth(b.y+46);objects.push(wall);}
 // Phối cảnh vật thể Pháo đài (xe tiếp tế, vạc dầu, máy bắn đá, rào chắn, bao cát) quanh sân thành
 const siegeId=f.layout==='citadel'?'prop-fw-trebuchet':'prop-fw-ballista';
 const flankWallId=['forest','grove','desert'].includes(f.layout)?'prop-fw-palisade':'prop-fw-battlement';
 const courtProps=[
  ['prop-fw-tar-cauldron',b.x-92,b.y+96,0],['prop-fw-boiling-oil',b.x+92,b.y+96,1],
  ['prop-fw-shield-pile',b.x-156,b.y+86,0],['prop-fw-repair-stones',b.x+156,b.y+86,1],
  [siegeId,b.x-206,b.y-18,0],[siegeId,b.x+206,b.y-18,1],
  ['prop-fw-stone-cart',b.x-192,b.y+44,0],['prop-fw-ration-cart',b.x+192,b.y+44,1],
  ['prop-fw-repair-oak',b.x-146,b.y+62,0],['prop-fw-gabion',b.x+146,b.y+62,0],
  ['prop-fw-sandbag-wall',b.x-214,b.y+122,0],['prop-fw-cheval',b.x+214,b.y+122,1],
  [flankWallId,b.x-222,b.y-92,0],[flankWallId,b.x+222,b.y-92,1]
 ];
 for(const [pid,px,py,flip] of courtProps){
  const pm=ensureCustomPropTexture(s,pid);if(!pm)continue;
  floor.fillStyle(0x09110c,.24).fillEllipse(px+3,py+2,pm.width*.7,14);
  const sc=(pm.targetH||pm.height)/pm.height;
  objects.push(s.add.image(px,py,pid).setOrigin(.5,.88).setScale(sc).setFlipX(!!flip).setDepth(py));
 }
 const detail=s.add.graphics().setDepth(b.y+58);objects.push(detail);
 if(['forest','grove','desert'].includes(f.layout))for(const side of [-1,1])for(let j=0;j<7;j++){const x=b.x+side*(145+j*11);detail.fillStyle(f.layout==='desert'?0xd8bd84:0x775b37).fillRect(x,b.y+10,8,28);detail.fillStyle(0xc2aa6e).fillTriangle(x,b.y+3,x-4,b.y+10,x+8,b.y+10);}
 if(['ice','crystal','ember','citadel'].includes(f.layout))for(let j=0;j<10;j++){const a=j/10*Math.PI*2,x=b.x+Math.cos(a)*208,y=b.y+Math.sin(a)*75;detail.fillStyle(f.accent,.17).fillCircle(x,y,9).lineStyle(1,f.accent,.8).strokeCircle(x,y,4);}
 if(f.layout==='ruins'){detail.lineStyle(3,0x5a5b52,.7).lineBetween(b.x-155,b.y+28,b.x-123,b.y+5).lineBetween(b.x+145,b.y+23,b.x+115,b.y-3);}
 if(f.layout==='twin'){for(const side of [-1,1]){detail.lineStyle(2,0xf5d7ac).lineBetween(b.x+side*120,b.y-40,b.x+side*120,b.y-82);detail.fillStyle(0xdb7c53).fillTriangle(b.x+side*120,b.y-82,b.x+side*145,b.y-76,b.x+side*120,b.y-67);}}
 const label=s.add.text(b.x,b.y+81,f.name.toUpperCase(),{fontFamily:'Segoe UI',fontSize:'10px',color:'#f3dfb0',stroke:'#1b271b',strokeThickness:4}).setOrigin(.5).setDepth(2050);objects.push(label);
 return objects;
}
