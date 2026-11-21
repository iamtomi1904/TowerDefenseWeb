import test from 'node:test';import assert from 'node:assert/strict';
import {createRoom,addPlayer,buy,stats,nextStage,tick,MAPS} from './simulation.mjs';
import {gemHit,gemKill,tickGemTarget,tickPoisonPools,gemArmorDamage,tickGemPlayer} from './gem-effects.mjs';
import {GEMS,GEM_RULES as C,gemTier,gemTotalCost} from './public/gems.js';
import {actorAction} from './public/actor-animation.js';
const setup=(hero='warrior-1')=>{const r=createRoom('GEM001'),p=addPlayer(r,{hero});p.gold=10000;return {r,p};};
const mob=(id='e')=>({id,x:100,y:100,hp:10000,maxHp:10000,armor:0,face:1});
const ctx={damage:(e,n)=>e.hp=Math.max(0,e.hp-n)};
function equip(p,id,tier=1){p.gem=id;p.gemTier=tier;p.gemEquipped=true;}

test('Option A free equip, 3-tier gem upgrades, sell refund and new campaign empty',()=>{
 const {r,p}=setup('fire-wizard');
 assert.equal(buy(r,p,'gem:ice'),null);
 assert.equal(p.gold,9700);
 assert.equal(gemTier(p),1);
 assert.ok(buy(r,p,'gem:fire'));
 assert.equal(buy(r,p,'upgrade-gem'),null);
 assert.equal(gemTier(p),2);
 assert.equal(p.gold,9350);
 assert.equal(buy(r,p,'upgrade-gem'),null);
 assert.equal(gemTier(p),3);
 assert.equal(p.gold,8800);
 assert.ok(buy(r,p,'upgrade-gem'));
 assert.equal(buy(r,p,'unequip-gem'),null);
 assert.equal(stats(p).power,50);
 assert.equal(buy(r,p,'equip-gem'),null);
 assert.equal(stats(p).power,61);
 p.x=50;p.y=1000;
 assert.ok(buy(r,p,'sell-gem'));
 assert.ok(buy(r,p,'militia'));
 assert.ok(buy(r,p,'repair'));
 p.x=MAPS[0].base.x;p.y=MAPS[0].base.y+140;
 assert.equal(buy(r,p,'sell-gem'),null);
 assert.equal(p.gold,8800+Math.floor(gemTotalCost(3)*C.sellRatio));
 assert.ok(!p.gem);
 assert.ok(!setup().p.gem);
});

test('gems offer real stats and never change base melee range',()=>{
 for(const g of GEMS){
  const {p}=setup();
  const before=stats(p);
  equip(p,g.id);
  if(g.id==='earth'){assert.equal(stats(p).power,before.power);assert.equal(stats(p).hp-before.hp,200);assert.equal(stats(p).armor-before.armor,12);p.gemTier=3;assert.equal(stats(p).hp-before.hp,350);assert.equal(stats(p).armor-before.armor,21);}else assert.ok(stats(p).power>before.power);
  assert.equal(stats(p).range,before.range);
 }
});

test('thunder stacks, chain stun/boss slow, lightning-mage passive boost and Tier 3 bonus bolt',()=>{
 const {r,p}=setup('lightning-mage');
 equip(p,'thunder',1);
 const e=mob();
 r.enemies=[e,...Array.from({length:10},(_,i)=>({...mob('x'+i),x:110+i}))];
 gemHit(r,p,e,100,'basic',ctx,()=>0);
 assert.equal(e.gemEffects.thunder.time,C.thunder.stun);
 assert.equal(r.enemies.filter(a=>a.hp===9975).length,2);
 assert.equal(p.passiveHits,1);
 for(let n=0;n<6;n++)gemHit(r,p,e,100,'basic',ctx,()=>1);
 assert.equal(p.thunderStacks,C.thunder.maxStacks);
 tickGemPlayer(p,3.6);
 assert.equal(p.thunderStacks,0);
 p.gemTier=3;
 const boss={...mob('b'),boss:true,hp:10000};
 r.enemies=[boss,mob('x0'),mob('x1')];
 gemHit(r,p,boss,100,'skill',ctx,()=>0);
 assert.equal(boss.gemEffects.thunder.slow,C.thunder.bossSlow);
 assert.ok(r.enemies.some(a=>a!==boss&&a.hp<10000));
});

test('ice slow, dmgReduce, freeze, tidecaller 5.5% heal synergy and Tier 3 frost aura',()=>{
 const {r,p}=setup('wanderer-magican');
 const e=mob();
 r.enemies=[e];
 equip(p,'ice',1);
 gemHit(r,p,e,10,'basic',ctx,()=>1);
 assert.equal(e.gemEffects['freeze-stack'].stacks,1);
 assert.equal(e.gemEffects.ice.slow,.2);
 assert.equal(e.gemEffects.ice.dmgReduce,.1);
 gemHit(r,p,e,10,'basic',ctx,()=>.15);
 assert.equal(e.gemEffects.freeze.time,C.ice.freeze);
 assert.ok(!e.gemEffects['freeze-stack']);
 tickGemTarget(r,e,3.1,ctx);
 assert.equal(Object.keys(e.gemEffects).length,0);
 p.gemTier=3;p.x=e.x+50;p.y=e.y;
 tickGemTarget(r,e,.05,ctx);
 assert.equal(e.gemSlow,C.ice.auraSlow);
 assert.equal(e.gemDamageReduce,C.ice.auraDmgReduce);
});

test('fire ticks 4 times, boss cap, Tier 2/3 detonation and fire-wizard Tan Hoa synergy',()=>{
 for(const [hero,tier,boss,loss]of [['warrior-2',1,false,800],['warrior-2',2,true,480]]){
  const {r,p}=setup(hero);
  const e={...mob(),boss};
  equip(p,'fire',tier);
  r.enemies=[e];
  gemHit(r,p,e,10,'basic',ctx,()=>0);
  for(let i=0;i<85;i++)tickGemTarget(r,e,.05,ctx);
  assert.ok(Math.abs(e.hp-(10000-loss))<.01);
  assert.ok(!e.gemEffects.fire);
 }
 const {r,p}=setup('fire-wizard');
 equip(p,'fire',3);
 const e=mob();e.statuses={burn:{time:3}};
 r.enemies=[e];
 gemHit(r,p,e,100,'basic',ctx,()=>1);
 assert.equal(e.hp,9940);
 assert.equal(r.fireCarpets.length,1);
});

test('poison 6-stack shared debuff, healCut, pools, knight-3 synergy and Tier 3 burst',()=>{
 const {r,p}=setup('knight-3');
 const b=addPlayer(r);
 const e={...mob(),boss:true};
 equip(p,'poison',1);equip(b,'poison',1);
 r.enemies=[e];
 for(let i=0;i<10;i++)gemHit(r,i%2?p:b,e,10,'basic',ctx,()=>1);
 assert.equal(e.gemEffects.poison.stacks,6);
 assert.ok(gemArmorDamage(p,e,100)>110);
 tickGemTarget(r,e,1,ctx);
 assert.equal(e.hp,9780);
 assert.equal(e.gemHealCut,C.poison.healCutByTier[0]);
 gemKill(r,e,p,false);
 const other=mob('other');
 r.enemies=[other];
 for(let i=0;i<20;i++)tickPoisonPools(r,.05,ctx);
 assert.equal(other.gemEffects.poison.stacks,1);
 for(let i=0;i<90;i++)tickPoisonPools(r,.05,ctx);
 assert.equal(r.poisonPools.length,0);
 p.gemTier=3;other.hp=5000;
 for(let i=0;i<6;i++)gemHit(r,p,other,100,'basic',ctx,()=>1);
 assert.ok(other.hp<5000);
});

test('dark armor debuff shared, penetration by tier, boss-hit skeleton spawn and Tier 3 commander',()=>{
 const {r,p}=setup();
 const b=addPlayer(r);
 const e={...mob(),boss:true,armor:100};
 equip(p,'dark',1);equip(b,'dark',1);
 r.enemies=[e];
 for(let i=0;i<10;i++)gemHit(r,i%2?p:b,e,10,'basic',ctx);
 assert.equal(e.gemEffects.dark.stacks,6);
 assert.ok(Math.abs(gemArmorDamage(p,e,100)-100*(25/(25+85*(1-.18))))<1e-9);
 b.gemEquipped=false;
 assert.ok(Math.abs(gemArmorDamage(b,e,100)-100*(25/(25+85)))<1e-9);
 for(let i=0;i<7;i++)gemHit(r,p,e,10,'basic',ctx);
 assert.equal(r.troops.filter(t=>t.type==='gem-skeleton'&&t.hp>0).length,1);
 p.gemTier=3;
 for(let i=0;i<11;i++){r.elapsed=i;gemKill(r,{...mob('kill'+i),x:p.x,y:p.y},p,true);}
 assert.equal(r.troops.filter(t=>t.hp>0).length,10);
 assert.ok(r.troops.some(t=>t.commander));
 const total=r.troops.length;
 gemKill(r,mob('summonkill'),p,false);
 assert.equal(r.troops.length,total);
 r.phase='prepare';r.timer=100;r.forestReady=true;
 for(let i=0;i<501;i++)tick(r,.05);
 assert.equal(r.troops.filter(t=>t.summoned).length,0);
});

test('wind 8-stack cap, full-stack speed/range, kill cap, map retention and death preserving gem',()=>{
 const {r,p}=setup();
 const e=mob();
 equip(p,'wind',1);
 const baseRange=stats(p).range;
 for(let i=0;i<10;i++)gemHit(r,p,e,10,'basic',ctx);
 assert.equal(p.windStacks,8);
 assert.equal(stats(p).range,baseRange+C.wind.fullRangeBonus);
 for(let i=0;i<100;i++)gemKill(r,e,p,true);
 assert.ok(Math.abs(p.windPermanent-C.wind.killCap)<1e-9);
 r.phase='clear';
 assert.equal(nextStage(r),true);
 assert.ok(Math.abs(p.windPermanent-C.wind.killCap*C.wind.carry)<1e-9);
 assert.equal(p.windStacks,0);
 assert.equal(p.gem,'wind');
 p.hp=0;p.respawn=.01;r.phase='lobby';
 tick(r,.05);
 assert.equal(p.gem,'wind');
 assert.ok(p.hp>0);
});

test('gem melee projectile can hit only air at extended range, ground range unchanged',()=>{
 const {r,p}=setup();equip(p,'ice');
 r.phase='battle';r.wave=1;r.spawn=99;r.spawnCd=10000;r.forestReady=true;p.x=900;p.y=900;
 const a={...mob('air'),x:1060,y:900,flying:true,altitude:40,speed:0,range:20,cooldown:100,cd:100,anim:0,lane:0,waypoint:1,power:0,reward:1};
 const ground={...a,id:'ground',x:1000,flying:false};
 r.enemies=[ground,a];
 p.input={attack:true,aimX:1,aimY:0};tick(r);p.input={};
 for(let i=0;i<8;i++)tick(r);
 assert.ok(a.hp<10000);assert.equal(ground.hp,10000);assert.equal(stats(p).range,72);
});

test('warrior E flag does not start an attack and real sequence plays once',()=>{
 const obj={},u={hero:'warrior-1',hp:100,anim:.5,attackCount:0,stats:{cooldown:.58}},info={actions:{attack:{frames:4}}};
 assert.equal(actorAction(u,obj,false,0,info),'idle');
 u.attackCount=1;assert.equal(actorAction(u,obj,false,10,info),'attack');
 const end=obj.attackUntil;actorAction(u,obj,true,100,info);assert.equal(obj.attackUntil,end);
});

test('dark lifesteal heals actual damage and warrior damage waits for windup without changing cooldown',()=>{
 const {r,p}=setup('knight-1');equip(p,'dark');
 r.phase='battle';r.wave=1;r.spawn=99;r.spawnCd=10000;r.forestReady=true;p.x=900;p.y=900;p.hp=50;
 const e={...mob('victim'),x:930,y:900,range:20,speed:0,power:0,cd:100,cooldown:1,anim:0,lane:0,waypoint:1,reward:1};
 r.enemies=[e];p.input={attack:true,aimX:1,aimY:0};tick(r);
 assert.ok(Math.abs(p.hp-52.6)<1e-9);
 const w=setup();w.r.phase='battle';w.r.spawn=99;w.r.spawnCd=10000;w.r.forestReady=true;w.p.x=900;w.p.y=900;
 const target={...e,id:'warrior-victim',hp:10000};w.r.enemies=[target];
 w.p.input={attack:true,aimX:1,aimY:0};tick(w.r);
 assert.equal(target.hp,10000);assert.equal(w.p.cd,.54);
 w.p.input={};tick(w.r);tick(w.r);assert.equal(target.hp,9954);
});
