// Analytically integrated flow: speed changes smoothly, with no particle jumps.
export function waterCurrent(water,segment,lane,time){
 const a=water.points[segment-1],b=water.points[segment],seed=(a[0]*.013+a[1]*.017+segment*.83),t=time/1000;
 const lanes=water.type==='deep'?4:3,center=Math.sin(lane/(lanes-1)*Math.PI);
 const base=(water.flowSpeed??(water.type==='deep'?48:88))*(.68+center*.42);
 const phase=seed+lane*.4,second=seed*.7;
 const speed=base*(1+.35*Math.cos(t*.7+phase)+.18*Math.sin(t*.31+second));
 const distance=base*(t+.35/.7*(Math.sin(t*.7+phase)-Math.sin(phase))-.18/.31*(Math.cos(t*.31+second)-Math.cos(second)));
 return {speed,distance,base};
}
