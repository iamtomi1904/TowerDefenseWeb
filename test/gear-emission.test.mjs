import test from 'node:test';
import assert from 'node:assert/strict';
import {gearEmissionActive,gearEmissionMask} from '../public/gear-emission.js';
import {progressionShape} from '../public/class-progression-art.js';
test('Cuồng Huyết keeps axe emission throughout buff and stops on expiry or death',()=>{
 const u={classId:'berserker',level:1,hp:100,buffs:[{time:7,haste:.3,lifesteal:.25}]};assert.equal(gearEmissionActive(u),true);u.buffs[0].time=.01;assert.equal(gearEmissionActive(u),true);u.buffs[0].time=0;assert.equal(gearEmissionActive(u),false);u.buffs[0].time=7;u.hp=0;assert.equal(gearEmissionActive(u),false);
 assert.ok(gearEmissionMask('berserker',0,.82,.45,160,160,160));assert.ok(!gearEmissionMask('berserker',0,.4,.5,160,160,160));assert.ok(gearEmissionMask('berserker',14,.16,.18,180,180,180));assert.ok(!gearEmissionMask('berserker',14,.8,.5,180,180,180));
});
test('both sword fans open and close; wind, smoke, outward lightning and class radiance animate',()=>{
 for(const classId of ['windblade','duelist']){const swords=t=>progressionShape({classId,level:16},t).filter(n=>n.origin==='hilt');assert.notEqual(swords(0)[0].angle,swords(1000)[0].angle);assert.equal(swords(0).length,5);}
 for(const [classId,id]of [['windblade','wind-body'],['pyromancer','heat-smoke'],['vanguard','solar-radiance'],['paladin','solar-radiance'],['fallen','moon-aura']]){const nodes=progressionShape({classId,level:16},1000);assert.ok(nodes.some(n=>n.id===id),classId);}
 const bolts=progressionShape({classId:'stormcaller',level:16},1000).filter(n=>n.id==='lightning-bolt');assert.ok(bolts.some(n=>n.x<.3||n.x>.7));
 for(const classId of ['guardian','duelist']){assert.ok(gearEmissionActive({classId,level:16,hp:10}));assert.ok(!gearEmissionActive({classId,level:11,hp:10}));}
});
