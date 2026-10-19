import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WorkoutTimer, buildSequence, validWorkout, formatTime } from '../timer.js';
const defaults = [{id:'test',name:'TEST',prepare:10,work:70,rest:30,rounds:3,cooldown:0}];
test('Example workout lasts 280 seconds without a final rest',()=>{
 const s=buildSequence(defaults[0]);
 assert.deepEqual(s.map(p=>p.type),['prepare','work','rest','work','rest','work']);
 assert.equal(s.reduce((n,p)=>n+p.duration,0),280);
});
test('phase boundaries, pause, resume and background catch-up',()=>{
 let now=0;const t=new WorkoutTimer(defaults[0],()=>now);t.play();now=10000;
 assert.equal(t.snapshot().phase.type,'work');assert.equal(t.snapshot().remaining,70);
 now=12500;t.pause();now=100000;assert.equal(t.snapshot().remaining,67.5);
 t.play();now+=67500;assert.equal(t.snapshot().phase.type,'rest');
 now+=200000;assert.equal(t.snapshot().status,'complete');assert.equal(t.snapshot().total,0);
 t.reset();assert.equal(t.snapshot().remaining,10);assert.equal(t.snapshot().status,'idle');
});
test('zero phases are skipped, cooldown runs and round count decreases',()=>{
 let now=0;const t=new WorkoutTimer({...defaults[0],prepare:0,work:1,rest:0,rounds:2,cooldown:1},()=>now);
 t.play();assert.equal(t.snapshot().phase.type,'work');now=1000;assert.equal(t.snapshot().rounds,1);
 now=2000;assert.equal(t.snapshot().phase.type,'cooldown');assert.equal(t.snapshot().rounds,0);
 now=3000;assert.equal(t.snapshot().status,'complete');
});
test('validation and formatting',()=>{
 assert.equal(validWorkout({...defaults[0],work:0}),false);assert.equal(validWorkout({...defaults[0],rounds:100}),false);
 assert.equal(formatTime(9.1),'00:10');assert.equal(formatTime(70,true),'01:10');assert.equal(formatTime(0,true),':00');
});

