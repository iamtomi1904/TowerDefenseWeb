import fs from 'node:fs';
import {CUSTOM_PROP_META,EXTRA_PROP_IDS,LANDMARK_PROP_IDS} from '../public/custom-props-art.js';
import {FORTRESS_PROP_META} from '../public/fortress-props-art.js';
const extra=new Set(EXTRA_PROP_IDS),landmark=new Set(LANDMARK_PROP_IDS),fortress=new Set(Object.keys(FORTRESS_PROP_META));
const palettes=['summer forest green','orange autumn','snowy icy blue','dead muted plum','scorched volcanic red brown'];
const shapeGroups=[['broad oak tree','layered pine tree','weeping willow tree','twisted dead tree','oasis palm tree','twin canopy tree','giant baobab tree'],['flowering hedge','berry thicket','giant fern','mushroom ring','cactus cluster'],['craggy boulder','twin stone spires','rune stone','crystal cluster'],['stone shrine','war banner','supply crates','ruined arch']];
function description(id){if(!extra.has(id))return id.replace(/^prop-(fw-|lm-)?/,'').replaceAll('-',' ');let n=Number(id.split('-').at(-1))-1;let shapes;for(const g of shapeGroups){if(n<g.length*5){shapes=g;break;}n-=g.length*5;}return shapes[Math.floor(n/5)]+' in '+palettes[n%5]+' biome';}
const all=Object.entries(CUSTOM_PROP_META).map(([id,meta])=>({id,...meta,description:description(id),source:fortress.has(id)?'fortress':extra.has(id)?'extra':landmark.has(id)?'landmark':'custom'}));
const groups=[['custom',all.filter(a=>a.source==='custom'||a.source==='landmark')],['extra',all.filter(a=>a.source==='extra')],['fortress',all.filter(a=>a.source==='fortress')]];
const sheets=[];for(const [group,items]of groups)for(let i=0;i<items.length;i+=16)sheets.push({id:group+'-'+String(i/16+1).padStart(2,'0'),items:items.slice(i,i+16)});
fs.writeFileSync('.local/catalog-style-props-plan.json',JSON.stringify({items:all,sheets},null,2));console.log('Unique props',all.length,'sheets',sheets.length);
