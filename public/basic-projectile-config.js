// Shared by the simulation and renderer; these values affect artwork only.
export const BASIC_PROJECTILE_ART={
 darkelf:{hero:'dark-elf',name:'Dạ Tiễn',size:60,trail:116,trailHeight:34,impact:72,life:.42,arrow:true},
 ranger:{hero:'samurai-archer',name:'Cung Thủ',size:54,trail:102,trailHeight:24,impact:50,life:.34,arrow:true},
 stormcaller:{hero:'lightning-mage',name:'Lôi Sư',size:58,trail:122,trailHeight:38,impact:78,life:.36,flight:'diagonal'},
 tidecaller:{hero:'wanderer-magican',name:'Du Pháp',size:56,trail:112,trailHeight:38,impact:68,life:.44,flight:'sway'},
 pyromancer:{hero:'fire-wizard',name:'Hỏa Sư',size:56,trail:106,trailHeight:36,impact:76,life:.46,flight:'arc'}
};
export const basicProjectileKey=id=>'basic-shot-v1:'+id;
export function basicAttackVisual(source){
 if(!BASIC_PROJECTILE_ART[source.classId])return {};
 const poison=source.classId==='ranger'&&source.buffs?.some(b=>b.time>0&&b.poisonArrows);
 return {basicClass:source.classId,...(poison?{poisonEnchanted:true}:{}),...(source.gemEquipped&&source.gem?{gem:source.gem}:{})};
}
