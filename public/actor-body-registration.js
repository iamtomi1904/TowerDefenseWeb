import {ACTOR_BODY_LAYOUT} from './actor-body-layout.js';
// Resolve cleaned atlas aliases to the same anatomical measurements.
export function bodyLayoutFor(key){return ACTOR_BODY_LAYOUT[String(key||'').replace(/:clean-alpha-v\d+$/,'')];}
export function registerActorBody(s,u,obj){
 const sprite=obj.sprite;
 if(!obj.bodyRegistrationHook&&sprite.on){obj.bodyRegistrationHook=true;sprite.on('animationupdate',()=>registerActorBody(s,null,obj));}
 const layout=bodyLayoutFor(sprite.texture?.key);if(!layout||!Number.isFinite(obj.size))return false;
 const image=sprite.texture.getSourceImage(),frame=Number(sprite.frame?.name),n=Number.isInteger(frame)&&frame>=0&&frame<layout.columns*layout.rows?frame:0;
 const scale=obj.size*(layout.heightMultiplier||1)/(image.height/layout.rows*layout.bodyRatio);
 sprite.setScale(scale).setOrigin(layout.originX,layout.originsY[n]);return true;
}
