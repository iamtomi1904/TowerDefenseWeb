import {installAmbientLife,updateAmbientLife,AMBIENT_KINDS} from './ambient-life.js';
import {drawHydrology,updateHydrologyFX} from './landscape-art.js';
export function mountAmbientReview(ground,source){
 let scene,paused=false,clock=0;
 const list=document.querySelector('#ambient-kind');for(const [id,name] of Object.entries(AMBIENT_KINDS)){const option=new Option(name,id);list.add(option);}
 list.onchange=()=>{if(scene){scene.ambientFilter=list.value==='all'?null:kind=>kind===list.value;updateAmbientLife(scene,clock);}};
 const pause=document.querySelector('#ambient-pause');pause.onclick=()=>{paused=!paused;pause.textContent=paused?'Tiếp tục':'Tạm dừng';pause.setAttribute('aria-pressed',String(paused));};
 new Phaser.Game({type:Phaser.CANVAS,width:960,height:600,parent:'ambient-preview',pixelArt:true,audio:{noAudio:true},scene:{preload(){this.load.image('ambient-review-tree','/assets/v2/props/tree1.png');this.load.image('ambient-review-rock','/assets/v2/props/rock1_1.png');},create(){
  scene=this;this.mapObjects=[];
  const props=[...[150,310,475,640,810,875].map((x,i)=>({id:'tree-'+i,asset:'tree1',x,y:150+(i%3)*62,radius:8,footprintY:5})),...[[220,330],[580,350],[720,260]].map(([x,y],i)=>({id:'rock-'+i,asset:'rock1_1',x,y,radius:6,footprintY:4})),{id:'fire',asset:'prop-lm-campfire-group',x:820,y:310,radius:8,footprintY:5}];
  const map={id:1,width:960,height:600,base:{x:-1000,y:-1000},props,lanes:[],forestPaths:[],camps:[],environment:[{type:'flowers',x:420,y:230,rx:400,ry:140}],rivers:[{id:'pond',type:'deep',width:68,points:[[-20,410],[280,395],[600,425],[990,400]]},{id:'creek',type:'shallow',width:52,points:[[-20,525],[290,530],[590,510],[990,545]]}],bridges:[]};
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=600;const c=canvas.getContext('2d');ground(c,{...map,ground:0x536d3f,grassRow:0});drawHydrology(c,source,map);
  c.fillStyle='#63503a';c.fillRect(808,310,25,5);c.fillStyle='#8c7046';c.fillRect(813,306,18,4);c.fillStyle='#df9842';c.fillRect(817,296,5,12);c.fillStyle='#f0ca74';c.fillRect(819,298,2,8);
  this.textures.addCanvas('ambient-review-ground',canvas);this.add.image(0,0,'ambient-review-ground').setOrigin(0).setDepth(-100);
  const trees=[];for(const p of props){if(p.asset==='tree1'){const image=this.add.image(p.x,p.y,'ambient-review-tree').setOrigin(.5,.83).setDepth(p.y);trees.push({p,image});}else if(p.asset==='rock1_1')this.add.image(p.x,p.y,'ambient-review-rock').setOrigin(.5,.83).setDepth(p.y);}
  this.previewTrees=trees;this.hydrology=map.rivers;this.bridges=[];this.waterFX=this.add.graphics().setDepth(-95);installAmbientLife(this,map,{props:[{id:'tree1',targetH:128}]});
  document.querySelector('#ambient-count').textContent=`${this.ambientLife.length} chi tiết · Không cản đường · Cây, đá và lửa trại là điểm tương tác`;
 },update(t,dt){const rect=document.querySelector('#ambient-preview').getBoundingClientRect();if(paused||rect.bottom<0||rect.top>innerHeight)return;clock+=dt;updateHydrologyFX(this,clock);updateAmbientLife(this,clock);for(const {p,image} of this.previewTrees)image.rotation=Math.sin(clock/900+p.x)*.012+(this.ambientNudges.get(p.id)||0);}}});
}
