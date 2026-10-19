// Unsaved template used when creating the first workout.
export const defaultWorkout = {id:'new',name:'NUOVO WORKOUT',prepare:10,work:30,rest:15,rounds:3,cooldown:0};
export function validWorkout(w){return w && typeof w.id==='string' && typeof w.name==='string' && w.name.trim().length>0 && w.name.length<=80 && ['prepare','work','rest','cooldown'].every(k=>Number.isInteger(w[k])&&w[k]>=(k==='work'?1:0)&&w[k]<=5999)&&Number.isInteger(w.rounds)&&w.rounds>=1&&w.rounds<=99;}
export function formatTime(seconds,short=false){const s=Math.max(0,Math.ceil(seconds));return `${short&&s<60?'':String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
export function buildSequence(w){const p=[];const add=(type,duration,round)=>{if(duration>0)p.push({type,duration,round});};add('prepare',w.prepare,1);for(let r=1;r<=w.rounds;r++){add('work',w.work,r);if(r<w.rounds)add('rest',w.rest,r);}add('cooldown',w.cooldown,w.rounds+1);return p;}
// Rendering frequency never affects duration: elapsed time comes from timestamps.
export class WorkoutTimer{
 constructor(workout,now=()=>Date.now()){this.now=now;this.reset(workout);}
 reset(workout=this.workout){this.workout={...workout};this.phases=buildSequence(workout);this.elapsed=0;this.startedAt=0;this.status='idle';}
 get total(){return this.phases.reduce((sum,p)=>sum+p.duration*1000,0);}
 play(){if(this.status==='complete')this.reset();if(this.status!=='running'){this.startedAt=this.now();this.status='running';}}
 pause(){if(this.status==='running'){this.elapsed+=this.now()-this.startedAt;this.status='paused';}}
 snapshot(){const elapsed=this.elapsed+(this.status==='running'?Math.max(0,this.now()-this.startedAt):0);let offset=elapsed,index=0;while(index<this.phases.length&&offset>=this.phases[index].duration*1000)offset-=this.phases[index++].duration*1000;if(index===this.phases.length){this.status='complete';this.elapsed=this.total;}return {index,phase:this.phases[index],next:this.phases[index+1],remaining:Math.max(0,(this.phases[index]?.duration||0)-offset/1000),total:Math.max(0,(this.total-elapsed)/1000),rounds:index===this.phases.length?0:Math.max(0,this.workout.rounds-this.phases[index].round+1),status:this.status};}
}
