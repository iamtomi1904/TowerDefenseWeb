import test from 'node:test';
import assert from 'node:assert/strict';
import {drawOceanRing,drawSnowSquall,drawStormStrike,drawGroundSlam,drawWindDashPixels,drawSpearCone,drawFireRegion,drawMageOrbit,warriorLeapHeight} from '../public/pixel-skill-art.js';
import {createElementalVisual} from '../public/elemental-art.js';
function graphics(){const dots=[];return {dots,fillStyle(c,a){assert.ok(Number.isFinite(c)&&a>=0&&a<=1);return this;},fillRect(...v){assert.ok(v.every(Number.isFinite));dots.push(v);return this;}};}
test('radial water crest covers all four directions and never uses the old flat wave atlas',()=>{
 const g=graphics();drawOceanRing(g,{x:0,y:0,radius:210},.7);for(const axis of [0,1]){assert.ok(g.dots.some(v=>v[axis]>130));assert.ok(g.dots.some(v=>v[axis]<-130));}
 for(const e of [{type:'tide-wave'},{skill:'blizzard'},{skill:'flamefield'}])assert.equal(createElementalVisual({}, {e}),null);
});
test('new pixel effects remain finite at birth, during animation and at expiry',()=>{
 for(const fn of [drawSnowSquall,drawStormStrike,drawGroundSlam,drawWindDashPixels,drawSpearCone,drawFireRegion])for(const t of [0,.01,.2,.5,.99,1]){const g=graphics();fn(g,{x:0,y:0,angle:1,skill:'tempest'},t,205,.8);assert.ok(g.dots.length>0);}
});
test('mage elemental orbit grows with level and stops on death',()=>{
 for(const classId of ['pyromancer','tidecaller','stormcaller']){const count=level=>{const a=graphics(),b=graphics();drawMageOrbit({unitGlow:a,unitGround:b},{hp:10,classId,level},{sprite:{x:0,y:0},size:57},1200);return a.dots.length+b.dots.length;};assert.ok(count(16)>count(1));}
 const g=graphics();drawMageOrbit({unitGlow:g,unitGround:g},{hp:0,classId:'pyromancer',level:20},{},1);assert.equal(g.dots.length,0);
});
test('warrior accelerates downward and lands at exactly ground height',()=>{
 const h=t=>warriorLeapHeight({duration:1,time:1-t});assert.equal(h(0),0);assert.equal(h(1),0);assert.ok(h(.4)>h(.2));assert.ok(h(.8)-h(.9)>h(.5)-h(.6));
});
