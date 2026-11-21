// Fixed-size reusable text pool. No per-label tween or destroy callback.
export function emitFloatingText(scene,e,color){
 let pool=scene.floatingTextPool;
 if(!pool){pool=scene.floatingTextPool={items:[]};scene.events?.once('shutdown',()=>{for(const p of pool.items)p.text.destroy();pool.items.length=0;scene.floatingTextPool=null;});}
 let item=pool.items.find(p=>!p.active);if(!item){if(pool.items.length>=64)return;item={text:scene.add.text(0,0,'',{fontFamily:'Segoe UI',fontSize:'9px',fontStyle:'bold',stroke:'#21321b',strokeThickness:3}).setOrigin(.5).setDepth(3200),active:false};pool.items.push(item);}
 const gold=e.type==='gold';item.active=true;item.age=0;item.y=e.y;
 item.text.setText(gold?`+${e.amount} ◈`:e.text).setFontSize(gold?13:9).setColor(gold?'#ffe19b':'#'+color.toString(16).padStart(6,'0')).setPosition(e.x,e.y).setAlpha(1).setVisible(true);
}
export function updateFloatingTexts(scene,dt){for(const p of scene.floatingTextPool?.items||[]){if(!p.active)continue;p.age+=dt;if(p.age>=.8){p.active=false;p.text.setVisible(false);continue;}p.text.y=p.y-40*p.age;p.text.setAlpha(1-p.age/.8);}}
export function clearFloatingTexts(scene){for(const p of scene.floatingTextPool?.items||[]){p.active=false;p.text.setVisible(false);}}
