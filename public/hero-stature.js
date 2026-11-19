// Height of the visible body, independent of empty atlas padding or weapon length.
export const HERO_HEIGHT={
 'goblin-assassin':.78,'dark-elf':1,'samurai-archer':1,
 'fire-wizard':1,'lightning-mage':1,'wanderer-magican':1,
 samurai:1.06,'samurai-commander':1.08,
 'knight-1':1.22,'knight-2':1.22,'knight-3':1.22,
 'warrior-1':1.2,'warrior-2':1.24,'warrior-3':1.22
};
export function heroDisplayHeight(u,base=57,growth=1){
 if(u.holyMounted||u.fallenMounted)return base*2.5;
 const foot=base*(HERO_HEIGHT[u.hero]||1);
 return u.vanguardTime>0?foot+(base*1.95-foot)*Math.max(0,Math.min(1,growth)):foot;
}
