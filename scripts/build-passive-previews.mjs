import {mkdirSync,writeFileSync} from 'node:fs';
import {PASSIVE_PREVIEW_CASES} from '../public/passive-preview-cases.js';
import {buildSkillPreview} from './build-skill-previews.mjs';
const dir=new URL('../public/passive-previews/',import.meta.url);mkdirSync(dir,{recursive:true});let count=0;
for(const [hero,cases]of Object.entries(PASSIVE_PREVIEW_CASES)){
 const data={};for(const c of cases){data[c.id]=buildSkillPreview(hero,'P',{...c.options,passiveCase:true});data[c.id].caseId=c.id;data[c.id].mastery=c.options.mastery;count++;}
 writeFileSync(new URL(hero+'.json',dir),JSON.stringify(data));
}
console.log('Generated',count,'passive scenarios in 14 lazily loaded hero files.');
