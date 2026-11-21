export const GEM_RULES={
 price:300,upgradePrices:[0,350,550],maxTier:3,tierStatMult:[1,1.35,1.75],sellRatio:.7,slots:6,castleRadius:240,airRange:230,airAimWidth:12,projectileWidth:9,projectileSpeed:650,
 thunder:{radius:150,baseTargets:2,maxTargets:5,maxStacks:4,stackDuration:3.5,stun:.4,bossSlow:.25,bossSlowDuration:1,chance:.22,fullChance:.35,splashByTier:[.25,.35,.45],awakenedBonus:.5},
 ice:{duration:3,slowByTier:[.2,.25,.3],dmgReduceByTier:[.1,.12,.14],step:.1,maxStacks:3,freeze:.9,stackDuration:3,tideHealMult:1.375,auraRadius:120,auraSlow:.15,auraDmgReduce:.08},
 fire:{chance:.3,duration:4,tick:1,percentByTier:[.02,.025,.025],bossCap:.012,detonateRadius:75,detonateByTier:[.3,.45,.6],detonateEvery:4,pyroCooldown:2,carpetDuration:2.5,carpetDps:.2,carpetAmp:.08},
 poison:{maxStacks:6,percentByTier:[.008,.01,.01],duration:5,tick:1,bossCap:.022,healCutByTier:[.3,.35,.45],poolDuration:4.5,poolRadius:60,poolSlow:.15,burstMissingPct:.06,burstBossCapPower:1.5},
 dark:{penetrationByTier:[.18,.22,.26],armorPerStack:.025,maxStacks:6,duration:5,skeletonLimitByTier:[8,8,10],skeletonDuration:25,skeletonHP:.55,skeletonArmor:.5,bossHitSpawnEvery:12,berserkerBonusLifesteal:.06,commanderEvery:4},
 wind:{hastePerStackByTier:[.04,.04,.05],maxStacks:8,duration:4,killBonus:.004,killCap:.2,carry:.3,fullSpeedBonus:.1,fullRangeBonus:20,pierceEvery:3,piercePct:.35,pierceTargets:3,pierceRange:260},
 armor:{bossBase:2,bossPerStage:1,normal:1.2,insane:1.55}
};
export const GEMS=[
 {id:'earth',name:'Ngọc Đất',color:0xd5b878,glyph:'⬟',power:0,hp:200,armor:12,text:'Thạch Giáp: tăng 200/270/350 Máu tối đa và 12/16/21 Giáp theo bậc I/II/III. Thiên về chống chịu, bảo vệ tuyến đầu.'},
 {id:'thunder',name:'Ngọc Sấm',color:0xe7cb67,glyph:'ϟ',power:8,haste:.14,text:'Tích 1→4 tầng Dẫn Điện (3,5s). 22% (35% ở 4 tầng) phóng Sét Chuỗi nảy 2→5 mục tiêu gây 25–45% Công và choáng 0,4s (Boss giảm 25% tốc đánh). Cộng hưởng Lôi Sư: nảy ≥2 mục tiêu tăng thêm +1 đếm Điện Tích.'},
 {id:'ice',name:'Ngọc Băng',color:0x91e5ff,glyph:'❄',power:6,armor:5,hp:100,text:'Làm chậm 20–30% chạy/tốc đánh và giảm 10–14% sát thương quái trong 3s. Đòn thường tích xác suất đóng băng 10→30% trong 0,9s. Cộng hưởng Du Pháp: tăng hồi máu Mạch Nước lên 5,5%.'},
 {id:'fire',name:'Ngọc Hỏa',color:0xff8b44,glyph:'♨',power:16,text:'30% gây Thiêu Đốt 2–2,5% HP tối đa/s (Boss 1,2%). Mỗi đòn thường thứ 4 hoặc kỹ năng lên mục tiêu đang cháy kích nổ 30–60% Công lan 75px. Cộng hưởng Hỏa Sư: Tàn Hỏa kích nổ nhiệt ngay.'},
 {id:'poison',name:'Ngọc Độc',color:0x97d66a,glyph:'☠',power:7,hp:125,text:'Độc cộng dồn tối đa 6 tầng chung (0,8–1% HP/tầng/s, Boss 2,2%), giảm 30–45% hồi máu/giáp ảo. Chết để lại Vũng Độc 4,5s làm chậm 15%. Cộng hưởng Hắc Kỵ Sĩ: kích hoạt sẵn +15% sát thương.'},
 {id:'dark',name:'Ngọc Hắc Ám',color:0xb696ed,glyph:'◈',power:10,lifesteal:.1,text:'Hút 10–16% máu, xuyên 18–26% giáp. Boss/Tinh anh mất 2,5% giáp/tầng (tối đa 6 tầng). Hạ quái hoặc mỗi 12 đòn vào Boss gọi Xương 25s. Cộng hưởng Cuồng Chiến: dưới 40% máu +6% hút máu.'},
 {id:'wind',name:'Ngọc Gió',color:0x8be4cf,glyph:'≋',power:7,haste:.14,speed:.06,text:'Đòn thường tích Cuồng Phong +4–5% tốc đánh/tầng (tối đa 8 tầng/4s); đủ 8 tầng +10% tốc chạy & +20 tầm. Hạ quái +0,4% tốc đánh (tối đa 20%, qua map giữ 30%). Cộng hưởng Phong Kiếm Khách & Song Kiếm.'}
];
export const gemById=id=>GEMS.find(g=>g.id===id);
export const gemAllowed=(p,id)=>Boolean(gemById(id));
export const equippedGem=p=>p.gemEquipped?gemById(p.gem):null;
export const gemTier=p=>Math.max(1,Math.min(GEM_RULES.maxTier,p.gemTier||1));
export const gemUpgradeCost=p=>p.gem&&gemTier(p)<GEM_RULES.maxTier?GEM_RULES.upgradePrices[gemTier(p)]:0;
export const gemTotalCost=(tier=1)=>GEM_RULES.price+GEM_RULES.upgradePrices.slice(1,Math.max(1,Math.min(GEM_RULES.maxTier,tier))).reduce((a,b)=>a+b,0);
export const nearCastle=(r,p,map)=>p.hp>0&&['lobby','prepare','battle','clear'].includes(r.phase)&&Math.hypot(p.x-map.base.x,p.y-(map.base.y+100))<=GEM_RULES.castleRadius;
export const gemStatsAt=(id,tier=1)=>{
 const g=gemById(id),m=GEM_RULES.tierStatMult[Math.max(0,Math.min(GEM_RULES.maxTier-1,tier-1))]||1;
 if(!g)return {power:0,hp:0,armor:0,lifesteal:0,haste:0,speed:0,range:0};
 const r2=n=>Math.round(n*100)/100;
 return {power:Math.round((g.power||0)*m),hp:Math.round((g.hp||0)*m),armor:Math.round((g.armor||0)*m),lifesteal:r2((g.lifesteal||0)*(tier===1?1:tier===2?1.3:1.6)),haste:r2((g.haste||0)*m),speed:r2((g.speed||0)*m),range:0};
};
export const gemStats=p=>{
 const g=equippedGem(p);if(!g)return {power:0,hp:0,armor:0,lifesteal:0,haste:0,speed:0,range:0};
 const tier=gemTier(p),base=gemStatsAt(g.id,tier);
 if(g.id==='wind'){
  const full=(p.windStacks||0)>=GEM_RULES.wind.maxStacks;
  base.haste+=(p.windStacks||0)*GEM_RULES.wind.hastePerStackByTier[tier-1]+(p.windPermanent||0);
  if(full){base.speed+=GEM_RULES.wind.fullSpeedBonus;base.range+=GEM_RULES.wind.fullRangeBonus;}
 }
 return base;
};
