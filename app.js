import { defaultWorkout, validWorkout, formatTime, WorkoutTimer } from './timer.js';

const $ = s => document.querySelector(s);
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels = {prepare:'PREPARA',work:'LAVORA',rest:'RIPOSA',rounds:'ROUND',cooldown:'RINFRESCATI'};
const colors = {prepare:'#fdff3c',work:'#99ff46',rest:'#f13d35',rounds:'#3ca9e0',cooldown:'#3ca9e0'};
const subtitles = {prepare:'CONTO ALLA ROVESCIA PRIMA DI INIZIARE',work:'FAI ESERCIZI PER QUESTO TEMPO',rest:'RIPOSA PER QUESTO TEMPO',rounds:'UN ROUND È LAVORO + RIPOSO',cooldown:"RINFRESCATI DOPO L'ALLENAMENTO"};
const paths = {
 stopwatch:'<circle cx="18" cy="20" r="14"/><path d="M18 6V2m-3 0h6m7 7 2-2M18 11v14"/><circle cx="18" cy="20" r="1"/>',
 round:'<circle cx="18" cy="19" r="14"/><circle cx="18" cy="19" r="12"/><path d="m18 19-6-7M18 5v3"/>',
 chrono:'<circle cx="18" cy="18" r="15"/><circle cx="18" cy="18" r=".8" fill="currentColor"/>',
 more:'<path d="M18 3a15 15 0 1 1-12 6M18 3v5"/>',
 restart:'<path d="M28 19a10 10 0 1 1-10-10h3"/><path d="m18 4 8 5-8 5z" fill="currentColor" stroke="none"/>',
 gear:'<path d="m14 3 1 4h6l1-4 5 3-2 4 3 5 4-1v6l-4 1-3 5 2 4-5 3-2-4h-5l-2 4-5-3 2-4-3-5-4-1v-6l4 1 3-5-2-4z"/><circle cx="18" cy="18" r="5"/>',
 edit:'<path d="M23 5H6v27h21V19M23 5v8h8L23 5m-12 13h10m-10 5h6m3 5 11-11 4 4-11 11-6 2z"/>',
 check:'<path d="m8 18 7 7L29 10"/>',
 play:'<path d="m11 6 20 12-20 12z"/>',
 pause:'<path d="M10 7h5v22h-5zM22 7h5v22h-5z"/>'
};
const icon = name => `<svg viewBox="0 0 36 36" aria-hidden="true">${paths[name]||paths.round}</svg>`;
function read(key,fallback){try{const x=localStorage.getItem(key);return x===null?fallback:JSON.parse(x);}catch{return fallback;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{notify('Salvataggio non disponibile in questo browser.');}}
let saved=read('timerplus_workouts',null);
// Remove the old bundled demos, including copies persisted by previous versions.
const legacyDemoIds=new Set(['chin','front','mcgill','pullups']);
let workouts=Array.isArray(saved)?saved.filter(w=>validWorkout(w)&&!legacyDemoIds.has(w.id)):[];
let selected=read('timerplus_selected_workout',null);
if(!workouts.some(w=>w.id===selected))selected=workouts[0]?.id||null;
let tabata=read('timerplus_tabata',null);
if(!validWorkout(tabata))tabata={id:'tabata',name:'TABATA',prepare:10,work:20,rest:10,rounds:8,cooldown:0};
const storedPreferences=read('timerplus_preferences',{});
const preferences={sound:true,vibration:false,awake:true};
for(const key of Object.keys(preferences))if(typeof storedPreferences?.[key]==='boolean')preferences[key]=storedPreferences[key];
const state={tab:'round',screen:'timer',draft:null,returnScreen:null,field:null,picker:{},management:false,scroll:0};
const activeWorkout=()=>workouts.find(w=>w.id===selected)||defaultWorkout;
const timers={round:new WorkoutTimer(activeWorkout()),tabata:new WorkoutTimer(tabata)};
const timer=()=>timers[state.tab==='tabata'?'tabata':'round'];
const stopwatch={elapsed:0,startedAt:0,running:false,laps:[]};
let audio,lock,noticeTimeout,lastPhases={round:0,tabata:0};
function persist(){write('timerplus_workouts',workouts);write('timerplus_selected_workout',selected);write('timerplus_tabata',tabata);write('timerplus_preferences',preferences);}
persist();
function notify(message){$('#notice').textContent=message;$('#notice').hidden=false;clearTimeout(noticeTimeout);noticeTimeout=setTimeout(()=>$('#notice').hidden=true,3000);}
function unlockAudio(){try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch{}}
function signal(type){if(preferences.sound&&audio){const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.connect(gain);gain.connect(audio.destination);oscillator.frequency.value=type==='work'?880:type==='complete'?1046:520;gain.gain.setValueAtTime(.12,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.25);oscillator.start();oscillator.stop(audio.currentTime+.28);}if(preferences.vibration&&navigator.vibrate)navigator.vibrate(type==='complete'?[150,80,150]:100);}
async function syncWake(){const needed=preferences.awake&&Object.values(timers).some(t=>t.status==='running')&&document.visibilityState==='visible';try{if(needed&&!lock&&navigator.wakeLock){lock=await navigator.wakeLock.request('screen');lock.addEventListener('release',()=>lock=null);}else if(!needed&&lock){await lock.release();lock=null;}}catch{}}
function header(title,left='ANNULLA',right='SALVA',leftAction='cancel',rightAction='save'){return `<header class="app-header"><button class="header-action" data-action="${leftAction}">${left}</button><h1>${title}</h1><button class="header-action" data-action="${rightAction}">${right}</button></header>`;}
function navigation(){return `<nav class="bottom-navigation" aria-label="Navigazione principale">${[['tabata','TABATA','stopwatch'],['round','ROUND','round'],['stopwatch','CRONOMETRO','chrono'],['more','ALTRO','more']].map(([id,name,i])=>`<button class="nav-item ${state.tab===id?'active':''}" data-tab="${id}" ${state.tab===id?'aria-current="page"':''}>${icon(i)}<span>${name}</span></button>`).join('')}</nav>`;}
function rows(w,circles=true){return `<div class="settings-rows">${Object.keys(labels).map(key=>`<button class="settings-row" data-field="${key}" aria-label="${labels[key]}: ${key==='rounds'?w[key]:formatTime(w[key])}"><span class="row-copy"><span class="row-title">${circles?`<i class="row-dot" style="background:${colors[key]}"></i>`:''}${labels[key]}</span><span class="row-subtitle">${subtitles[key]}</span></span><span class="row-value">${key==='rounds'?w[key]:formatTime(w[key],true)}</span><span class="chevron" aria-hidden="true"></span></button>`).join('')}</div>`;}
function workoutList(){return `<div class="section-heading" id="workout-heading">I MIEI WORKOUT<button data-action="manage" aria-label="Gestisci workout" aria-pressed="${state.management}">${icon('edit')}</button></div><div class="workout-list">${workouts.map(w=>`<article class="workout-item ${w.id===selected?'selected':''}"><button class="workout-select" data-select="${escape(w.id)}" aria-label="Seleziona ${escape(w.name)}"><h2>${escape(w.name)}</h2><div class="workout-summary"><div class="summary-column"><span>PREPARA</span><span>${formatTime(w.prepare,true)}</span><span>LAVORA</span><span>${formatTime(w.work,true)}</span><span>RINFRESCATI</span><span>${formatTime(w.cooldown,true)}</span></div><div class="summary-column"><span>RIPOSA</span><span>${formatTime(w.rest,true)}</span><span>ROUND</span><span>${w.rounds}</span></div></div><span class="check">${icon('check')}</span></button>${state.management?`<div class="management"><button data-edit="${escape(w.id)}">MODIFICA</button><button class="delete" data-delete="${escape(w.id)}">ELIMINA</button></div>`:''}</article>`).join('')||'<p class="hint">Nessun workout. Aggiungi il tuo primo timer.</p>'}</div>`;}
function settings(){return (state.tab==='round'&&!workouts.length?header('ROUND','','','none','none'):header(state.tab==='tabata'?'TABATA':'ROUND'))+`<div class="scroll-content settings-content">${state.screen==='list'?'':`<div class="section-heading">INTERVALLI</div>${rows(state.draft)}`}${state.tab==='round'?`<button class="add-button" data-action="add">${icon('stopwatch')}AGGIUNGI NUOVO TIMER</button>${workoutList()}`:''}</div>`;}
function form(){return header(state.screen==='add'?'AGGIUNGI NUOVO':'MODIFICA WORKOUT','ANNULLA',state.screen==='add'?'AGGIUNGI':'SALVA','form-cancel','form-save')+`<div class="scroll-content form-content"><input class="name-input" id="workout-name" aria-label="Nome del workout" maxlength="80" autocomplete="off" placeholder="INSERISCI NOME DEL WORKOUT ROUND" value="${escape(state.draft.name)}"><p id="form-error" class="field-error" role="alert"></p>${rows(state.draft,false)}</div>`;}
function wheel(id,count,start=0){return `<div class="wheel-wrap"><div class="picker-wheel" role="spinbutton" tabindex="0" aria-label="${id==='minutes'?'Minuti':id==='seconds'?'Secondi':'Round'}" aria-valuemin="${start}" aria-valuemax="${count-1+start}" data-wheel="${id}" data-start="${start}">${Array.from({length:count},(_,i)=>`<div class="picker-wheel__item" data-value="${i+start}">${String(i+start).padStart(2,'0')}</div>`).join('')}</div></div>`;}
function picker(){return header(labels[state.field],'INDIETRO','FATTO','picker-cancel','picker-save')+`<div class="picker-content"><div class="picker-group">${state.field==='rounds'?`${wheel('rounds',99,1)}<span class="picker-unit">ROUND</span>`:`${wheel('minutes',100)}<span class="picker-unit">MIN</span>${wheel('seconds',60)}<span class="picker-unit">SEC</span>`}</div></div>`;}
function timerScreen(){return `<header class="timer-header"><h1>${escape(timer().workout.name)}</h1><span class="total-time" id="total-time"></span><button class="gear" data-action="settings" aria-label="Impostazioni timer">${icon('gear')}</button><button class="restart" data-action="reset" aria-label="Riavvia timer">${icon('restart')}</button><button class="library" data-action="library" aria-label="I miei workout">${icon('more')}</button></header><section class="timer-current"><h2 class="timer-phase-label" id="phase-label"></h2><div class="timer-countdown" id="countdown" role="timer" aria-label="Tempo rimanente"></div><span id="phase-announcement" class="sr-only" aria-live="polite"></span></section><section class="timer-next"><h2 id="next-label"></h2><strong id="next-time"></strong></section><section class="timer-controls"><div class="round-counter"><strong id="rounds-left"></strong><span>ROUND RIMASTI</span></div><div class="play-group"><button class="play-button" data-action="play" id="play-button"></button><span id="play-label"></span></div></section>`;}
function stopwatchScreen(){return header('CRONOMETRO','AZZERA','','stop-reset','none')+`<div class="simple-page"><div class="stopwatch-time" id="stopwatch-time"></div><div class="stopwatch-actions"><button class="secondary-button" data-action="stop-toggle">${stopwatch.running?'PAUSA':stopwatch.elapsed?'RIPRENDI':'AVVIA'}</button><button class="secondary-button" data-action="lap">GIRO</button></div><div>${stopwatch.laps.map((lap,i)=>`<div class="lap"><span>GIRO ${i+1}</span><span>${stopwatchFormat(lap)}</span></div>`).reverse().join('')}</div></div>`;}
function more(){return header('ALTRO','','','none','none')+`<div class="simple-page">${[['sound','SUONI'],['vibration','VIBRAZIONE'],['awake','MANTIENI SCHERMO ACCESO']].map(([key,label])=>`<button class="preference" role="switch" aria-checked="${preferences[key]}" data-pref="${key}"><span>${label}</span><span class="toggle ${preferences[key]?'on':''}"></span></button>`).join('')}<p class="hint">Suoni e schermo acceso dipendono dal supporto del browser. Al ritorno nell’app il timer recupera il tempo trascorso.</p><p class="hint">TIMER PLUS · WORKOUT TIMER<br>I tuoi workout sono salvati su questo dispositivo.</p></div>`;}
function render(){if(state.tab==='round'&&state.screen==='timer'&&!workouts.length){state.screen='list';state.draft={...defaultWorkout};}let content;if(state.screen==='timer')content=timerScreen();else if(['settings','list'].includes(state.screen))content=settings();else if(['add','edit'].includes(state.screen))content=form();else if(state.screen==='picker')content=picker();else if(state.tab==='stopwatch')content=stopwatchScreen();else content=more();$('#app').innerHTML=`<main id="screen" class="${state.screen==='timer'?'timer-screen':''}">${content}</main>${navigation()}`;if(state.screen==='picker')setupWheels();tick();}
function openSettings(list=false){timer().pause();syncWake();state.draft={...(state.tab==='tabata'?tabata:activeWorkout())};state.screen=list?'list':'settings';render();}
function updateText(selector,value){const node=$(selector);if(node&&node.textContent!==String(value))node.textContent=value;}
function tick(){for(const [key,t]of Object.entries(timers)){const snap=t.snapshot();if(snap.index!==lastPhases[key]){if(t.status==='running'||t.status==='complete')signal(snap.phase?.type||'complete');lastPhases[key]=snap.index;if(t.status==='complete')syncWake();}}if(state.screen==='timer'){const s=timer().snapshot(),phase=s.phase?.type,accent=colors[phase]||colors.work;$('#screen').style.setProperty('--accent',accent);updateText('#total-time',formatTime(s.total));updateText('#phase-label',labels[phase]||'COMPLETATO');updateText('#countdown',formatTime(s.remaining));$('#countdown').classList.toggle('long',s.remaining>=6000);updateText('#next-label',s.next?labels[s.next.type]:s.status==='complete'?'OTTIMO LAVORO':'AL TERMINE');updateText('#next-time',s.next?formatTime(s.next.duration):s.status==='complete'?'✓':'FINE');$('.timer-next').style.background=colors[s.next?.type]||colors.work;updateText('#rounds-left',s.rounds);const action=s.status==='running'?'PAUSA':s.status==='paused'?'RIPRENDI':s.status==='complete'?'RICOMINCIA':'AVVIA';updateText('#play-label',action);const b=$('#play-button');if(b.getAttribute('aria-label')!==action){b.setAttribute('aria-label',action);b.innerHTML=icon(s.status==='running'?'pause':'play');}updateText('#phase-announcement',labels[phase]||'Allenamento completato');}if(state.tab==='stopwatch')updateText('#stopwatch-time',stopwatchFormat(stopElapsed()));}
function stopElapsed(){return stopwatch.elapsed+(stopwatch.running?Date.now()-stopwatch.startedAt:0);}
function stopwatchFormat(ms){const hundredths=Math.floor(ms/10);return `${String(Math.floor(hundredths/6000)).padStart(2,'0')}:${String(Math.floor(hundredths/100)%60).padStart(2,'0')}.${String(hundredths%100).padStart(2,'0')}`;}
function setupWheels(){document.querySelectorAll('[data-wheel]').forEach(el=>{const start=Number(el.dataset.start);const update=()=>{const index=Math.max(0,Math.min(el.children.length-1,Math.round(el.scrollTop/126)));state.picker[el.dataset.wheel]=index+start;el.setAttribute('aria-valuenow',index+start);Array.from(el.children).forEach((child,i)=>{child.classList.toggle('selected',i===index);child.classList.toggle('distant',Math.abs(i-index)>1);});};el.scrollTop=(state.picker[el.dataset.wheel]-start)*126;update();el.addEventListener('scroll',update,{passive:true});el.addEventListener('keydown',event=>{let target=state.picker[el.dataset.wheel]-start;if(event.key==='ArrowDown')target++;else if(event.key==='ArrowUp')target--;else if(event.key==='Home')target=0;else if(event.key==='End')target=el.children.length-1;else return;event.preventDefault();el.scrollTo({top:Math.max(0,Math.min(el.children.length-1,target))*126,behavior:'instant'});update();});el.addEventListener('click',e=>{const item=e.target.closest('[data-value]');if(item)el.scrollTo({top:(Number(item.dataset.value)-start)*126,behavior:'smooth'});});});}
function commitDraft(){if(!validWorkout(state.draft)){notify('Il tempo di lavoro deve essere almeno un secondo.');return false;}if(state.tab==='tabata'){tabata={...state.draft};timers.tabata.reset(tabata);}else{const index=workouts.findIndex(w=>w.id===state.draft.id);if(index<0)workouts.push({...state.draft});else workouts[index]={...state.draft};selected=state.draft.id;timers.round.reset(activeWorkout());}persist();return true;}
$('#app').addEventListener('input',e=>{if(e.target.id==='workout-name')state.draft.name=e.target.value;});
$('#app').addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b)return;
 if(b.dataset.tab){state.tab=b.dataset.tab;state.screen=['round','tabata'].includes(state.tab)?'timer':state.tab;state.draft=null;render();return;}
 if(b.dataset.field){state.scroll=$('.scroll-content').scrollTop;state.returnScreen=state.screen;state.field=b.dataset.field;const v=state.draft[state.field];state.picker=state.field==='rounds'?{rounds:v}:{minutes:Math.floor(v/60),seconds:v%60};state.screen='picker';render();return;}
 if(b.dataset.select){selected=b.dataset.select;state.draft={...activeWorkout()};timers.round.reset(activeWorkout());persist();state.screen='timer';render();return;}
 if(b.dataset.edit){state.draft={...workouts.find(w=>w.id===b.dataset.edit)};state.screen='edit';render();return;}
 if(b.dataset.delete){const w=workouts.find(w=>w.id===b.dataset.delete);if(confirm(`Eliminare "${w.name}"?`)){workouts=workouts.filter(x=>x.id!==w.id);if(selected===w.id){selected=workouts[0]?.id||null;timers.round.reset(activeWorkout());}persist();state.draft={...activeWorkout()};render();}return;}
 if(b.dataset.pref){preferences[b.dataset.pref]=!preferences[b.dataset.pref];if(preferences.sound)unlockAudio();persist();syncWake();render();return;}
 switch(b.dataset.action){
  case 'settings':openSettings();break;
  case 'library':openSettings(state.tab==='round');break;
  case 'cancel':state.screen='timer';render();break;
  case 'save':if(commitDraft()){state.screen='timer';render();}break;
  case 'add':state.draft={id:globalThis.crypto?.randomUUID?.()||`workout-${Date.now()}`,name:'',prepare:1,work:1,rest:1,rounds:1,cooldown:1};state.screen='add';render();break;
  case 'form-cancel':state.draft={...activeWorkout()};state.screen='list';render();break;
  case 'form-save':state.draft.name=state.draft.name.trim().toUpperCase();if(!state.draft.name){$('#form-error').textContent='INSERISCI UN NOME PER IL WORKOUT';$('#workout-name').focus();break;}if(commitDraft()){state.screen='list';render();}break;
  case 'picker-save':{const value=state.field==='rounds'?state.picker.rounds:state.picker.minutes*60+state.picker.seconds;if(state.field==='work'&&value===0){notify('Imposta almeno 1 secondo di lavoro.');break;}state.draft[state.field]=value;state.screen=state.returnScreen;render();$('.scroll-content').scrollTop=state.scroll;break;}
  case 'picker-cancel':state.screen=state.returnScreen;render();$('.scroll-content').scrollTop=state.scroll;break;
  case 'manage':{const y=$('.scroll-content').scrollTop;state.management=!state.management;render();$('.scroll-content').scrollTop=y;break;}
  case 'play':unlockAudio();if(timer().status==='running')timer().pause();else timer().play();syncWake();tick();break;
  case 'reset':timer().reset();syncWake();tick();break;
  case 'stop-toggle':if(stopwatch.running){stopwatch.elapsed=stopElapsed();stopwatch.running=false;}else{stopwatch.startedAt=Date.now();stopwatch.running=true;}render();break;
  case 'stop-reset':stopwatch.elapsed=0;stopwatch.running=false;stopwatch.laps=[];render();break;
  case 'lap':if(stopElapsed()>0){stopwatch.laps.push(stopElapsed());render();}break;
 }
});
document.addEventListener('visibilitychange',()=>{tick();syncWake();});
render();setInterval(tick,50);
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./service-worker.js').catch(()=>{});

