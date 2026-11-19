import Phaser from 'phaser';
import {terrainAt,type SceneData,type Point} from '../shared/map-traversal';
import {stairCrossings} from './terrain-art-layout';
import {landing,softenAlpha,terrainStyle} from './terrain-upgrade';

/** Static material patches follow the same shoreline/face polygons as navigation. */
export class TerrainDetailRenderer {
  private images:Phaser.GameObjects.Image[]=[];
  private keys:string[]=[];
  private flow?:Phaser.GameObjects.Graphics;
  private streams:Point[][]=[];
  private foam:Point[]=[];
  private rapids:{a:Point;b:Point;width:number}[]=[];
  constructor(private scene:Phaser.Scene,data:SceneData){
    const geo=data.geology;if(!geo)return;
    const source=scene.textures.get('geology-materials').getSourceImage() as HTMLImageElement;
    const cliffSource=scene.textures.get('natural-cliff-r012').getSourceImage() as HTMLImageElement;
    const northCliff=scene.textures.get('north-cliff-r018').getSourceImage() as HTMLImageElement;
    const roadPattern=(g:CanvasRenderingContext2D)=>{const p=g.createPattern(scene.textures.get('ground-dirt').getSourceImage() as HTMLImageElement,'repeat')!;p.setTransform(new DOMMatrix().scale(.2));return p;};
    const meadow=scene.textures.get('ground-grass').getSourceImage() as HTMLImageElement,grass=document.createElement('canvas');grass.width=meadow.width;grass.height=meadow.height;const gg=grass.getContext('2d')!;gg.drawImage(meadow,0,0);gg.globalCompositeOperation='multiply';gg.fillStyle='#c6cf9b';gg.fillRect(0,0,grass.width,grass.height);
    const grassPattern=(g:CanvasRenderingContext2D)=>{const p=g.createPattern(grass,'repeat')!;p.setTransform(new DOMMatrix().scale(.35));return p;};
    const materials=[0,1,2,3,4,5].map(i=>{const c=document.createElement('canvas');c.width=i===0?96:160;c.height=c.width;const g=c.getContext('2d')!;g.imageSmoothingEnabled=false;g.drawImage(source,20+(i%3)*510,20+Math.floor(i/3)*500,470,470,0,0,c.width,c.height);return c;});
    const waterArt=scene.textures.get('water-materials-r010').getSourceImage() as HTMLImageElement;
    const sample=(col:number,row:number,size:number)=>{const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d')!;g.imageSmoothingEnabled=false;const w=waterArt.width/3,h=waterArt.height/2;g.drawImage(waterArt,col*w+w*.08,row*h+h*.08,w*.84,h*.84,0,0,size,size);return c;};
    materials[0]=sample(0,0,128);materials[4]=sample(1,0,224);materials[1]=sample(0,1,192);const deepWater=sample(2,0,256);
    const patch=(points:Point[],depth:number,paint:(g:CanvasRenderingContext2D)=>void,fringe=0)=>{
      const minX=Math.floor(Math.min(...points.map(p=>p[0])))-2,minY=Math.floor(Math.min(...points.map(p=>p[1])))-2;
      const w=Math.ceil(Math.max(...points.map(p=>p[0])))-minX+2,h=Math.ceil(Math.max(...points.map(p=>p[1])))-minY+2;
      const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d')!;g.imageSmoothingEnabled=false;g.translate(-minX,-minY);
      g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.clip();g.beginPath();g.rect(0,0,data.size[0]*data.scale,data.size[1]*data.scale);g.clip();paint(g);
      if(fringe){const pixels=g.getImageData(0,0,w,h);softenAlpha(pixels.data,w,h,fringe);g.putImageData(pixels,0,0);}
      const key='geo-patch-'+this.keys.length; if(scene.textures.exists(key))scene.textures.remove(key);
      scene.textures.addCanvas(key,c)?.setFilter(Phaser.Textures.FilterMode.NEAREST);this.keys.push(key);
      const image=scene.add.image(minX,minY,key).setOrigin(0).setDepth(depth);this.images.push(image);return image;
    };
    const fill=(g:CanvasRenderingContext2D,m:number)=>{g.fillStyle=m===3?grassPattern(g):g.createPattern(materials[m],'repeat')!;g.fillRect(0,0,6000,4500);};
    for(const r of geo.regions.filter(r=>r.level<0))patch(r.polygon,-104,g=>{g.globalAlpha=.12;fill(g,1);});
    for(const r of geo.regions.filter(r=>r.level>0))patch(r.polygon,-99.5,g=>{g.fillStyle='#c5c38a';g.globalAlpha=.055;g.fillRect(0,0,6000,4500);});
    const material=(g:CanvasRenderingContext2D,name:string)=>{const p=g.createPattern(scene.textures.get('terrain25-'+name).getSourceImage() as HTMLImageElement,'repeat')!;p.setTransform(new DOMMatrix().scale(.3));return p;};
    for(const h of geo.hydrology)patch(h.bank,-99,g=>{g.fillStyle=material(g,'damp');g.fillRect(0,0,6000,4500);},terrainStyle.bankFringe);
    for(const h of geo.hydrology)patch(h.bed,-98,g=>{g.fillStyle=material(g,'gravel');g.fillRect(0,0,6000,4500);},12);
    for(const h of [...geo.hydrology].sort((a,b)=>Number(a.deep)-Number(b.deep))){
      patch(h.water,h.deep?-95:-96,g=>{if(h.deep){g.fillStyle=g.createPattern(deepWater,'repeat')!;g.fillRect(0,0,6000,4500);g.globalAlpha=.35;g.fillStyle='#164f62';g.fillRect(0,0,6000,4500);g.globalAlpha=1;
        g.strokeStyle=g.createPattern(materials[4],'repeat')!;g.lineWidth=28;g.beginPath();h.water.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.stroke();
      }else{fill(g,0);g.globalAlpha=.3;g.fillStyle='#328b92';g.fillRect(0,0,6000,4500);g.globalAlpha=h.id==='irrigation'?.4:.52;fill(g,4);}},6);
    }
    for(const ford of geo.fords||[]){const water=geo.hydrology.find(h=>h.id===ford.water);if(!water)continue;const points=[ford.entry,...ford.points,ford.exit],left:Point[]=[],right:Point[]=[];for(let i=0;i<points.length;i++){const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;left.push([points[i][0]-dy/len*ford.width*.5,points[i][1]+dx/len*ford.width*.5]);right.push([points[i][0]+dy/len*ford.width*.5,points[i][1]-dx/len*ford.width*.5]);}
      patch([...left,...right.reverse()],-94.5,g=>{g.beginPath();water.water.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.clip();fill(g,0);g.globalAlpha=.3;g.fillStyle='#328b92';g.fillRect(0,0,6000,4500);g.globalAlpha=.26;g.fillStyle=material(g,'gravel');g.fillRect(0,0,6000,4500);g.globalAlpha=.22;fill(g,4);},14).setData({terrainFord:true,fordId:ford.id});
      for(const which of ['upper','lower'] as const)patch(landing(ford.entry,ford.exit,ford.width,which),-97,g=>{g.fillStyle=material(g,'damp');g.globalAlpha=.65;g.fillRect(0,0,6000,4500);g.globalCompositeOperation='destination-out';for(const h of geo.hydrology){g.beginPath();h.water.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill();}},18).setData('fordApproach',true);
    }
    this.streams=geo.hydrology.map(h=>h.center);this.flow=scene.add.graphics().setDepth(-94);
    this.foam=(data.objects||[]).filter(o=>o.kind==='boulders'&&[3,5].includes(terrainAt(data,o.x,o.y))).map(o=>[o.x*data.scale,o.y*data.scale]);
    const fallFaces=new Set<string>();
    const inside=(p:Point,q:Point[])=>{let v=false;for(let i=0,j=q.length-1;i<q.length;j=i++){const a=q[i],b=q[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])v=!v;}return v;};
    for(const f of geo.falls){const key=JSON.stringify(f.face);if(fallFaces.has(key))continue;fallFaces.add(key);const points=geo.hydrology.flatMap(h=>h.center.filter(p=>inside(p,f.face)));if(points.length>1)this.rapids.push({a:points[0],b:points.at(-1)!,width:f.width});}
    // Small bankside clusters break up the long material boundary without blocking feet.
    for(const h of geo.hydrology)for(let i=1;i<h.bank.length-1;i+=3){
      const p=h.bank[i];
      if(h.id==='river'&&p[1]<1250)continue; // Authored r020 shore modules replace the generic stamps here.
      if(geo.decks.some(d=>p[0]>d.rect[0]-60&&p[0]<d.rect[0]+d.rect[2]+60&&p[1]>d.rect[1]-60&&p[1]<d.rect[1]+d.rect[3]+60))continue;
      const image=scene.add.image(p[0],p[1],i%9===1?'land-rocks':'flora-'+(i%6)).setOrigin(.5,1).setDepth(p[1]);
      const width=i%9===1?(h.deep?70:48):38;image.setDisplaySize(width,width*image.height/image.width);this.images.push(image);
    }
    for(const f of geo.faces){
      const north=f.material==='rock';
      const side=north&&Math.abs(f.top[1][1]-f.top[0][1])>Math.abs(f.top[1][0]-f.top[0][0])*.35;
      const rockSource=north?northCliff:cliffSource;
      patch(f.quad,side?-92:Math.max(...f.base.map(p=>p[1]))-1,g=>{
        const facing=(f.base[0][1]+f.base[1][1]-f.top[0][1]-f.top[1][1])*.5;
        fill(g,north?3:f.material==='soil'?(facing>10?1:3):facing< -20?3:2);
        const band=(a:number,b:number,m:number)=>{g.save();const mix=(p:Point,q:Point,t:number):Point=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];const pts=[mix(f.top[0],f.base[0],a),mix(f.top[1],f.base[1],a),mix(f.top[1],f.base[1],b),mix(f.top[0],f.base[0],b)];g.beginPath();pts.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.clip();fill(g,m);g.restore();};
        if(f.material==='soil'&&facing>10){band(0,.2,3);band(.8,1,0);}
        else if(facing>=20&&!side){
          // Map narrow slices of the actual grass/root/rock asset onto the authored face.
          // Back slopes remain grassy; a full stone ring looked like a defensive wall.
          const a=f.top[0],b=f.top[1],c=f.base[0],d=f.base[1],len=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.max(1,Math.ceil(len/2));
          for(let i=0;i<count;i++){const t=i/count,u=(i+1)/count,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,bx=c[0]+(d[0]-c[0])*t,by=c[1]+(d[1]-c[1])*t;g.save();g.transform((b[0]-a[0])*(u-t),(b[1]-a[1])*(u-t),bx-x,by-y,x,y);const sx=((((f.u0??0)+t*len)*(north?1.5:3))%(rockSource.width-8)+rockSource.width-8)%(rockSource.width-8);g.drawImage(rockSource,sx,0,8,rockSource.height,0,0,1.05,1);g.restore();}
        }
        if(Math.abs(facing)>12&&!north){g.strokeStyle='rgba(16,31,24,.5)';g.lineWidth=12;g.beginPath();g.moveTo(...f.base[0]);g.lineTo(...f.base[1]);g.stroke();}
        if(facing>20&&!north){g.strokeStyle='#233d24';g.lineWidth=7;g.beginPath();g.moveTo(f.top[0][0],f.top[0][1]+5);g.lineTo(f.top[1][0],f.top[1][1]+5);g.stroke();g.strokeStyle='#a7b847';g.lineWidth=2;g.beginPath();g.moveTo(...f.top[0]);g.lineTo(...f.top[1]);g.stroke();}
        // Erase only the actual supported ramp, never paint an entire road across a cliff.
        g.globalCompositeOperation='destination-out';g.fillStyle='#fff';
        for(const link of data.topology?.transitions||[]){if(!link.id.startsWith(f.id+'-r'))continue;g.beginPath();link.polygon.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill();}
        // A terrain side must end at a creek, rather than painting a thin wall across it.
        g.globalCompositeOperation='destination-out';g.fillStyle='#fff';
        for(const h of geo.hydrology){if(h.bounds[2]<f.bounds[0]||h.bounds[0]>f.bounds[2]||h.bounds[3]<f.bounds[1]||h.bounds[1]>f.bounds[3])continue;g.beginPath();h.water.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill();}
      });
      // Upright rock modules describe steep side contours; shearing the front
      // cliff strip along these edges produced long flat diagonal smears.
      if(side){const a=f.base[0],b=f.base[1],len=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.max(1,Math.ceil(len/105));for(let i=0;i<count;i++){const t=(i+.5)/count,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,im=scene.add.image(x,y,'detail-mossboulder').setOrigin(.5,1).setDepth(y-1);if(stairCrossings(data.topology?.transitions||[],geo.roads,geo.faces).some(r=>{const vx=r.lower[0]-r.upper[0],vy=r.lower[1]-r.upper[1],t=Math.max(0,Math.min(1,((x-r.upper[0])*vx+(y-r.upper[1])*vy)/(vx*vx+vy*vy)));return Math.hypot(x-r.upper[0]-vx*t,y-r.upper[1]-vy*t)<r.walkWidth*.5+90;})){im.destroy();continue;}const width=145+(i%2)*18,topY=f.top[0][1]+(f.top[1][1]-f.top[0][1])*t;im.setDisplaySize(width,Math.max(width*im.height/im.width,(y-topY)*1.06));this.images.push(im);}}
    }
    // A complete sprite spans the whole crossing; no per-face clipping or repeated steps.
    for(const crossing of stairCrossings(data.topology?.transitions||[],geo.roads,geo.faces)){
      for(const which of ['upper','lower'] as const)patch(landing(crossing.upper,crossing.lower,crossing.walkWidth,which),-62,g=>{g.fillStyle=material(g,'dry');g.fillRect(0,0,6000,4500);},8).setData({terrainLanding:true,landing:which});
      const dx=crossing.lower[0]-crossing.upper[0],dy=crossing.lower[1]-crossing.upper[1],view=Math.abs(dx)<dy*.22?0:dx>0?1:2,stairs=scene.textures.get('stone-stair-view-'+view).getSourceImage() as HTMLImageElement;
      const upper:Point=view===0?[.5,.18]:view===1?[.30,.18]:[.70,.18],lower:Point=view===0?[.5,.82]:view===1?[.70,.82]:[.30,.82];
      // Fit the tread corridor, not the entire sprite including its rock shoulders.
      const width=Math.max(72,crossing.walkWidth)/.56,v=lower[1]-upper[1],bx=(dx-width*(lower[0]-upper[0]))/v,by=dy/v,ox=crossing.upper[0]-width*upper[0]-bx*upper[1],oy=crossing.upper[1]-by*upper[1];
      const corners:Point[]=[[ox,oy],[ox+width,oy],[ox+bx,oy+by],[ox+width+bx,oy+by]],left=Math.floor(Math.min(...corners.map(p=>p[0]))),top=Math.floor(Math.min(...corners.map(p=>p[1]))),right=Math.ceil(Math.max(...corners.map(p=>p[0]))),bottom=Math.ceil(Math.max(...corners.map(p=>p[1])));
      const c=document.createElement('canvas');c.width=right-left;c.height=bottom-top;const g=c.getContext('2d')!;g.imageSmoothingEnabled=false;g.transform(width/stairs.width,0,bx/stairs.height,by/stairs.height,ox-left,oy-top);g.drawImage(stairs,0,0);
      const key='geo-stair-'+this.keys.length;scene.textures.addCanvas(key,c)?.setFilter(Phaser.Textures.FilterMode.NEAREST);this.keys.push(key);
      const image=scene.add.image(left,top,key).setOrigin(0).setDepth(-61).setData({terrainStair:true,stairView:view,stairStyle:'natural-r012',heading:Math.atan2(dx,dy),upper:crossing.upper,lower:crossing.lower,walkWidth:crossing.walkWidth});this.images.push(image);
    }
  }
  update():void {const v=this.scene.cameras.main.worldView;for(const image of this.images){const x=image.x-image.displayWidth*image.originX,y=image.y-image.displayHeight*image.originY;image.setVisible(x<v.right&&y<v.bottom&&x+image.displayWidth>v.left&&y+image.displayHeight>v.top);}
    const g=this.flow;if(g){g.clear();g.lineStyle(2,0xd2eee0,.28);for(const points of this.streams)for(let n=0;n<12;n++){const t=(this.scene.time.now*.0009+n*points.length/12)%(points.length-1),i=Math.floor(t),a=points[i],b=points[i+1],x=a[0]+(b[0]-a[0])*(t-i),y=a[1]+(b[1]-a[1])*(t-i),length=Math.hypot(b[0]-a[0],b[1]-a[1])||1;if(v.contains(x,y))g.lineBetween(x,y,x+(b[0]-a[0])/length*14,y+(b[1]-a[1])/length*14);}
      for(let i=0;i<this.foam.length;i++){const p=this.foam[i];if(!v.contains(...p))continue;const t=(this.scene.time.now*.0006+i*.173)%1;g.lineStyle(1,0xdcefe2,(1-t)*.45);g.strokeEllipse(p[0],p[1]+4+t*5,18+t*14,6+t*5);}
      for(const r of this.rapids){const dx=r.b[0]-r.a[0],dy=r.b[1]-r.a[1],len=Math.hypot(dx,dy)||1;for(let i=0;i<14;i++){const t=(this.scene.time.now*.001+i*.13)%1,side=(i%5-2)*r.width/7,x=r.a[0]+dx*t-dy/len*side,y=r.a[1]+dy*t+dx/len*side;if(v.contains(x,y)){g.lineStyle(2,0xe7f4e8,.35+Math.sin(t*Math.PI)*.3);g.lineBetween(x,y,x+dx/len*13,y+dy/len*13);}}}
    }
  }
  destroy():void {this.flow?.destroy();for(const i of this.images)i.destroy();for(const k of this.keys)this.scene.textures.remove(k);}
}
