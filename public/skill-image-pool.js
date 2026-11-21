// Scene-owned pool for transient skill Images; detached while idle.
const owners=new WeakMap();
export function acquireSkillImage(scene,x,y,key,frame){
 let pool=scene.skillImagePool;
 if(!pool){pool=scene.skillImagePool={free:[],all:new Set(),closed:false};scene.events?.once('shutdown',()=>{pool.closed=true;for(const im of pool.all)im.destroy();pool.all.clear();pool.free.length=0;scene.skillImagePool=null;});}
 let image=pool.free.pop();
 if(image){scene.children?.add(image);image.setTexture(key,frame);image.setPosition(x,y);image.setVisible(true);image.setActive?.(true);}
 else {image=scene.add.image(x,y,key,frame);pool.all.add(image);owners.set(image,{pool,idle:false});}
 owners.get(image).idle=false;
 image.setAlpha(1);image.setRotation(0);image.setScale?.(1);image.setOrigin(.5,.5);image.clearTint?.();image.setFlipX?.(false);image.setFlipY?.(false);image.setBlendMode?.('NORMAL');image.setDepth(0);
 return image;
}
export function releaseSkillImage(image){
 if(!image)return;const record=owners.get(image);
 if(!record){image.destroy();return;}if(record.idle)return;
 const {pool}=record;record.idle=true;
 if(pool.closed||pool.free.length>=1600){pool.all.delete(image);owners.delete(image);image.destroy();return;}
 image.scene?.tweens?.killTweensOf(image);image.setVisible(false);image.setActive?.(false);image.scene?.children?.remove(image);pool.free.push(image);
}
