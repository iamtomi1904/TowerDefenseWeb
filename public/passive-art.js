import {cleanEffectTexture} from './effect-alpha.js';
import {GEAR_LAYOUT} from './gear-glow-layout.js';
const PROFILES={guardian:['solar-radiance','guardWaveTime',3],paladin:['solar-radiance','holyMarks',4],fallen:['reaper-halo','attackCount',4],windblade:['wind-body','windPassiveStacks',5],duelist:['power-katana','duelStacks',20],ranger:['gear-spark','focusStacks',10],darkelf:['moon-aura','moonStacks',8],assassin:['shadow-smoke','stealthGraceTime',3],berserker:['solar-radiance','warStacks',5],ravager:['heat-smoke','attackCount',3],vanguard:['solar-radiance','attackCount',4],pyromancer:['heat-smoke','attackCount',5],stormcaller:['gear-spark','lightningStacks',4],tidecaller:['water-ribbon','waterStacks',4]};
export function updatePassiveArt(s,u,obj,time){
 const profile=u.hero&&PROFILES[u.classId];
 if(!profile||u.hp<=0){obj.passiveArt?.destroy();obj.passiveArt=null;return;}
 const [id,field,max]=profile,value=u[field]||0,changed=obj.passiveValue!==undefined&&value!==obj.passiveValue;
 if(changed)obj.passivePulse=time;obj.passiveValue=value;
 const pulse=Math.max(0,1-(time-(obj.passivePulse??-9999))/650),strength=Math.min(1,value/max);
 const low=u.classId==='ravager'&&u.hp<(u.stats?.hp||u.maxHp||1)*.5;
 if(!strength&&!pulse&&!low){obj.passiveArt?.setVisible(false);return;}
 const raw='gear-glow:'+id;if(!s.textures?.exists(raw))return;
 if(!obj.passiveArt){obj.passiveArt=s.add.image(0,0,raw);obj.sprite.once?.('destroy',()=>{obj.passiveArt?.destroy();obj.passiveArt=null;});}
 const l=GEAR_LAYOUT[id],key=cleanEffectTexture(s,raw,{columns:1,rows:1,matteFloor:48,maxSize:512}),size=obj.size*(.7+strength*.35+pulse*.18),im=obj.passiveArt;
 im.setVisible(true).setTexture(key).setOrigin(l.cx,l.cy).setPosition(obj.sprite.x,obj.sprite.y-obj.size*.45).setDisplaySize(size/l.width,size/l.height).setDepth(obj.sprite.depth-1).setAlpha(.15+strength*.25+pulse*.45+(low?.2:0)).setBlendMode(id.includes('smoke')?'SCREEN':'ADD');
 if(['berserker','ravager'].includes(u.classId))im.setTint?.(0xff6555);
}
