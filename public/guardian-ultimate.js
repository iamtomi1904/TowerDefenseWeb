export const GUARDIAN_R_TIMING={charge:1,rise:.75,hold:.5,fall:.5,recovery:.25};
export function guardianRHeight(state,height=76){
 if(!state)return 0;const t=state.elapsed||0,peak=height*1.45;
 if(t<=1||t>=2.75-1e-8)return 0;
 if(t<1.75){const p=(t-1)/.75;return peak*(1-(1-p)**2);}
 if(t<2.25)return peak;
 return peak*(1-((t-2.25)/.5)**2);
}
export function guardianRFrame(t){return t<.45?0:t<1?1:t<1.4?2:t<2.25?3:t<2.75?4:5;}
