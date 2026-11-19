import test from 'node:test';
import assert from 'node:assert/strict';
import {heroDisplayHeight} from '../public/hero-stature.js';
test('heavy fighters are taller than swordsmen, archers and mages; goblin stays short',()=>{
 const h=hero=>heroDisplayHeight({hero});
 const normal=['samurai','samurai-commander','samurai-archer','dark-elf','fire-wizard','lightning-mage','wanderer-magican'];
 for(const heavy of ['knight-1','knight-2','knight-3','warrior-1','warrior-2','warrior-3'])for(const other of normal)assert.ok(h(heavy)>h(other),heavy+' > '+other);
 for(const other of normal)assert.ok(h('goblin-assassin')<h(other));
 for(const hero of ['knight-2','knight-3'])assert.ok(heroDisplayHeight({hero,holyMounted:hero==='knight-2',fallenMounted:hero==='knight-3'})>=h(hero)*2);
 assert.equal(heroDisplayHeight({hero:'warrior-3',vanguardTime:90},57,0),h('warrior-3'));
});
