const {createRequire}=require('node:module');
const req=createRequire('C:/Users/simon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=req('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const http=require('node:http'),path=require('node:path');const root=process.cwd();
 const server=http.createServer((request,response)=>{const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){response.writeHead(403).end();return;}fs.readFile(file,(error,data)=>{if(error){response.writeHead(404).end();return;}response.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream');response.end(data);});});
 await new Promise(resolve=>server.listen(5180,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 fs.mkdirSync('tests/screenshots',{recursive:true});
 await page.goto('http://127.0.0.1:5180');await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.workout-item').count(),0);
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('timerplus_workouts'))),[]);
 assert.equal(await page.getByRole('button',{name:'AGGIUNGI NUOVO TIMER',exact:true}).count(),1);
 await page.evaluate(()=>localStorage.setItem('timerplus_workouts',JSON.stringify(['chin','front','mcgill','pullups'].map(id=>({id,name:'OLD DEMO',prepare:10,work:70,rest:30,rounds:3,cooldown:0})))));
 await page.reload();assert.equal(await page.locator('.workout-item').count(),0);
 // A user-created workout survives reload and is independent of legacy demos.
 await page.evaluate(()=>localStorage.setItem('timerplus_workouts',JSON.stringify([{id:'user-test',name:'USER TEST',prepare:10,work:70,rest:30,rounds:3,cooldown:0}])));
 await page.reload();
 assert.equal(await page.locator('#total-time').textContent(),'04:40');
 for(const [width,height] of [[320,568],[375,812],[390,844],[393,852],[430,932],[768,1024],[844,390],[1024,768],[1366,768],[1920,1080],[2560,1440]]){
  await page.setViewportSize({width,height});await page.screenshot({path:`tests/screenshots/timer-${width}.png`});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const text=await page.locator('#countdown').boundingBox();assert.ok(text.x>=0&&text.x+text.width<=width+1);
  const shell=await page.locator('.app-shell').boundingBox();assert.equal(Math.round(shell.width),width);
  const contained=await page.evaluate(()=>{
   for(const [parent,children]of [['.timer-header',['.timer-header h1','#total-time']],['.timer-next',['#next-label','#next-time']],['.timer-current',['#phase-label','#countdown']]]){
    const box=document.querySelector(parent).getBoundingClientRect();
    for(const child of children){const r=document.querySelector(child).getBoundingClientRect();if(r.top<box.top+3||r.bottom>box.bottom-3||r.left<box.left||r.right>box.right)return false;}
   }return true;
  });assert.ok(contained,`Timer text must fit inside colored panels at ${width}x${height}`);
  await page.getByRole('button',{name:'Impostazioni timer',exact:true}).click();
  assert.ok(await page.evaluate(()=>document.querySelector('.scroll-content').scrollWidth<=innerWidth));
  if(width===1366)await page.screenshot({path:'tests/screenshots/settings-desktop.png'});
  await page.locator('[data-field="work"]').click();
  const wheel=await page.locator('.picker-group').boundingBox();
  assert.ok(wheel.x>=0&&wheel.x+wheel.width<=width&&wheel.y+wheel.height<=height,`Picker fits at ${width}`);
  await page.getByRole('button',{name:'INDIETRO',exact:true}).click();
  await page.getByRole('button',{name:'ANNULLA',exact:true}).click();
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Impostazioni timer',exact:true}).click();await page.screenshot({path:'tests/screenshots/settings.png'});
 await page.locator('[data-field="work"]').click();await page.screenshot({path:'tests/screenshots/picker.png'});
 await page.locator('[data-wheel="seconds"]').focus();await page.keyboard.press('ArrowDown');
 await page.getByRole('button',{name:'INDIETRO',exact:true}).click();assert.match(await page.locator('[data-field="work"]').textContent(),/01:10/);
 await page.getByRole('button',{name:'AGGIUNGI NUOVO TIMER',exact:true}).click();await page.screenshot({path:'tests/screenshots/add.png'});
 await page.locator('#workout-name').fill('TEST WORKOUT');
 for(const [field,minutes,seconds]of [['prepare',0,10],['work',0,45],['rest',0,15],['cooldown',0,20]]){
  await page.locator(`[data-field="${field}"]`).click();
  await page.locator('[data-wheel="minutes"]').evaluate((e,v)=>{e.scrollTop=v*126;e.dispatchEvent(new Event('scroll'));},minutes);
  await page.locator('[data-wheel="seconds"]').evaluate((e,v)=>{e.scrollTop=v*126;e.dispatchEvent(new Event('scroll'));},seconds);
  await page.getByRole('button',{name:'FATTO',exact:true}).click();
 }
 await page.locator('[data-field="rounds"]').click();await page.locator('[data-wheel="rounds"]').evaluate(e=>{e.scrollTop=3*126;e.dispatchEvent(new Event('scroll'));});await page.getByRole('button',{name:'FATTO',exact:true}).click();
 await page.getByRole('button',{name:'AGGIUNGI',exact:true}).click();await page.screenshot({path:'tests/screenshots/list.png'});
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('timerplus_workouts')).find(w=>w.name==='TEST WORKOUT'));
 assert.deepEqual([stored.prepare,stored.work,stored.rest,stored.rounds,stored.cooldown],[10,45,15,4,20]);
 await page.getByRole('button',{name:'Seleziona TEST WORKOUT',exact:true}).click();assert.equal(await page.locator('#total-time').textContent(),'04:15');
 await page.reload();assert.equal(await page.locator('.timer-header h1').textContent(),'TEST WORKOUT');
 await page.getByRole('button',{name:'AVVIA',exact:true}).click();await page.waitForTimeout(1100);await page.getByRole('button',{name:'PAUSA',exact:true}).click();const paused=await page.locator('#countdown').textContent();await page.waitForTimeout(1100);assert.equal(await page.locator('#countdown').textContent(),paused);
 await page.getByRole('button',{name:'CRONOMETRO',exact:true}).click();await page.getByRole('button',{name:'AVVIA',exact:true}).click();await page.waitForTimeout(150);await page.getByRole('button',{name:'PAUSA',exact:true}).click();assert.notEqual(await page.locator('#stopwatch-time').textContent(),'00:00.00');
 for(const [width,height]of [[375,812],[844,390],[1366,768],[1920,1080]]){
  await page.setViewportSize({width,height});
  for(const tab of ['CRONOMETRO','ALTRO','TABATA']){
   await page.getByRole('button',{name:tab,exact:true}).click();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(tab==='CRONOMETRO')assert.ok(await page.locator('#stopwatch-time').evaluate(e=>e.scrollWidth<=e.clientWidth));
  }
 }
 const otherVisitor=await browser.newPage();await otherVisitor.goto('http://127.0.0.1:5180');
 assert.equal(await otherVisitor.locator('.workout-item').count(),0);
 assert.deepEqual(await otherVisitor.evaluate(()=>JSON.parse(localStorage.getItem('timerplus_workouts'))),[]);
 assert.deepEqual(errors,[]);console.log('Browser checks passed: empty first visit, demo removal, separate visitors, viewports, picker, create, persist, pause, stopwatch; no console errors.');await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1);});
