import test from 'node:test';
import assert from 'node:assert/strict';
import {waterCurrent} from '../public/water-current.js';
const river={type:'deep',points:[[0,90],[500,90]]};
test('flow accelerates smoothly and displacement derivative matches its speed',()=>{const values=[];for(let t=0;t<18000;t+=100){const a=waterCurrent(river,1,1,t),b=waterCurrent(river,1,1,t+1);assert.ok(a.speed>0);assert.ok(Math.abs((b.distance-a.distance)*1000-a.speed)<.02);values.push(a.speed);}assert.ok(Math.max(...values)>Math.min(...values)*1.5);});
test('shallow water runs faster and channel center moves faster than banks',()=>{assert.ok(waterCurrent({...river,type:'shallow'},1,1,0).base>waterCurrent(river,1,1,0).base);assert.ok(waterCurrent(river,1,1,0).base>waterCurrent(river,1,0,0).base);assert.equal(waterCurrent(river,1,1,0).distance,0);assert.notEqual(waterCurrent(river,1,1,8000).speed,waterCurrent({...river,points:[[700,500],[1200,500]]},1,1,8000).speed);});
