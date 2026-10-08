/* Local UI verification. Set NODE_PATH to a directory containing playwright. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const phase = process.argv[2] || 'after';
const output = path.join(root, 'docs', 'ui-review', phase);
fs.mkdirSync(output, { recursive: true });
const courses = Array.from({ length: 7 }, (_, i) => ({day:i+1,time:'09:10',name:'互動設計'}));
const reminders = [{type:'fixed',course:'互動設計',text:'帶筆記本'}, {type:'once',date:'2026-10-09',text:'確認期中報告'}];
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript'})[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel:'chrome', headless:true });
  try {
    const context = await browser.newContext({timezoneId:'Asia/Taipei',locale:'zh-TW'});
    await context.addInitScript(({courses,reminders}) => {
      if (sessionStorage.getItem('ui-seeded')) return;
      sessionStorage.setItem('ui-seeded', 'yes');
      localStorage.setItem('courses', JSON.stringify(courses));
      localStorage.setItem('reminders', JSON.stringify(reminders));
    }, {courses,reminders});
    const page = await context.newPage();
    await page.clock.install({time:new Date('2026-10-09T10:00:00+08:00')});
    await page.route('**/frame?day=*', route => route.abort());
    const errors=[];
    page.on('pageerror', error => errors.push(error.message));
    const report={ widths:{}, errors };
    for (const width of [360,390,768,1024,1440]) {
      await page.setViewportSize({width,height:1000});
      await page.goto(base+'/Web/index.html');
      await page.evaluate(() => drawExitCard());
      report.widths[width]=await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        controls: [...document.querySelectorAll('h1,h2,#month-title,input,select,button,.day-number,canvas')].map(el=>{
          const r=el.getBoundingClientRect(); const s=getComputedStyle(el);
          return {key:el.id||el.className||el.tagName,text:el.textContent.trim(),x:r.x,y:r.y,width:r.width,height:r.height,font:s.font,lineHeight:s.lineHeight};
        }),
        bitmap: canvasToBase64()
      }));
      await page.screenshot({path:path.join(output,`web-${width}.png`),fullPage:true});
    }
    await page.setViewportSize({width:366,height:650});
    await page.goto(base+'/tku-connector/popup.html');
    report.popup=await page.locator('body').boundingBox();
    await page.screenshot({path:path.join(output,'connector.png'),fullPage:true});
    if (phase === 'after') {
      const baseline = JSON.parse(fs.readFileSync(path.join(root,'docs/ui-review/before/measurements.json')));
      const geometryExceptions=[];
      for (const [width, snapshot] of Object.entries(report.widths)) {
        assert.equal(snapshot.overflow,false,`overflow at ${width}`);
        assert.equal(snapshot.bitmap,baseline.widths[width].bitmap,`bitmap changed at ${width}`);
        assert.equal(snapshot.controls.length,baseline.widths[width].controls.length);
        snapshot.controls.forEach((control,index)=>{
          const old=baseline.widths[width].controls[index];
          assert.equal(control.key,old.key);
          assert.equal(control.text,old.text);
          for (const dimension of ['x','y','width','height']) {
            if (Math.abs(control[dimension]-old[dimension])<.1) continue;
            const mobileFit=Number(width)<400 && ((dimension==='x' && (control.key.startsWith('day-number') || control.key==='next-week')) || (control.key==='epaper-canvas' && ['width','height'].includes(dimension)));
            assert.ok(mobileFit,`${width}: unexpected ${control.key} ${dimension} change`);
            geometryExceptions.push({width,key:control.key,dimension});
          }
        });
      }
      assert.deepEqual(report.popup,baseline.popup);
      await page.setViewportSize({width:390,height:1000});
      await page.goto(base+'/Web/index.html');
      const dialogs=[];
      page.on('dialog', async dialog=>{dialogs.push(dialog.message());await dialog.accept();});
      await page.locator('#add-course').click();
      assert.equal(dialogs.at(-1),'請輸入時間與課程名稱');
      await page.locator('#course-time').fill('11:10');
      await page.locator('#course-name').fill('UI 驗證課程');
      await page.locator('#add-course').click();
      assert.equal(await page.locator('.course').count(),2);
      await page.reload();
      assert.equal(await page.locator('.course').count(),2,'course persists after reload');
      await page.locator('.course').filter({hasText:'UI 驗證課程'}).locator('button').click();
      assert.equal(await page.locator('.course').count(),1);
      await page.locator('#add-fixed-reminder').click();
      assert.equal(dialogs.at(-1),'請輸入課程 / 標籤與提醒內容');
      await page.locator('#reminder-course').fill('互動設計');
      await page.locator('#reminder-text').fill('UI 驗證提醒');
      await page.locator('#add-fixed-reminder').click();
      await page.locator('#add-once-reminder').click();
      assert.equal(dialogs.at(-1),'請選擇日期並輸入提醒事項');
      await page.locator('#reminder-date').fill('2026-10-10');
      await page.locator('#reminder-once-text').fill('一次性驗證');
      await page.locator('#add-once-reminder').click();
      await page.reload();
      assert.equal(await page.locator('.reminder').count(),4,'reminders persist');
      await page.locator('.reminder').filter({hasText:'UI 驗證提醒'}).locator('button').click();
      await page.locator('.reminder').filter({hasText:'一次性驗證'}).locator('button').click();
      assert.equal(await page.locator('.reminder').count(),2);
      await page.locator('#next-week').click();
      assert.equal(await page.locator('#selected-date-title').textContent(),'10/16');
      await page.locator('#prev-week').click();
      assert.equal(await page.locator('#selected-date-title').textContent(),'Today');
      await page.locator('.day-number').first().click();
      assert.equal(await page.locator('#course-day').inputValue(),'1');
      assert.equal(await page.locator('#selected-date-title').textContent(),'10/5');
      // Intercept the transport, keeping the real bitmap and seven-day sync code.
      await page.evaluate(()=>{
        window.__frames=[];
        HTMLFormElement.prototype.submit=function(){window.__frames.push({action:this.action,target:this.target,frame:this.querySelector('input').value});};
        window.__sync=syncWeekToExitCard();
      });
      await page.clock.runFor(11000);
      await page.evaluate(()=>window.__sync);
      const frames=await page.evaluate(()=>window.__frames);
      assert.equal(frames.length,7);
      frames.forEach((frame,i)=>{
        assert.equal(new URL(frame.action).searchParams.get('day'),String(i+1));
        assert.equal(frame.target,'sync-frame');
        assert.equal(Buffer.from(frame.frame,'base64').length,15000);
      });
      assert.equal(await page.locator('#selected-date-title').textContent(),'Today');
      assert.equal(dialogs.at(-1),'一週課表已同步到 ExitCard！');
      // Actual keyboard traversal compared with the original style in an isolated page.
      const originalCss=fs.readFileSync(path.join(root,'docs/ui-review/before/style.css'),'utf8');
      const oldPage=await context.newPage();
      await oldPage.route('**/style.css',route=>route.fulfill({contentType:'text/css',body:originalCss}));
      await oldPage.goto(base+'/Web/index.html');
      await page.reload();
      const tabSequence=async target=>{
        const sequence=[];
        for(let i=0;i<22;i++){await target.keyboard.press('Tab');sequence.push(await target.evaluate(()=>document.activeElement.id||document.activeElement.className||document.activeElement.tagName));}
        return sequence;
      };
      assert.deepEqual(await tabSequence(page),await tabSequence(oldPage));
      await oldPage.close();
      await page.locator('#course-name').focus();
      assert.notEqual(await page.locator('#course-name').evaluate(el=>getComputedStyle(el).outlineStyle),'none');
      await page.screenshot({path:path.join(output,'focus.png'),fullPage:true});
      const primary=page.locator('#add-course');
      const defaultBox=await primary.boundingBox();
      await primary.hover();
      await page.clock.runFor(150);
      await new Promise(resolve => setTimeout(resolve, 180));
      assert.deepEqual(await primary.boundingBox(),defaultBox);
      await page.mouse.down();
      assert.deepEqual(await primary.boundingBox(),defaultBox);
      await page.screenshot({path:path.join(output,'pressed.png'),fullPage:true});
      await page.mouse.move(1,1);await page.mouse.up();
      await primary.evaluate(el=>el.disabled=true);
      await primary.hover({force:true});
      await page.clock.runFor(150);
      await new Promise(resolve => setTimeout(resolve, 180));
      assert.equal(await primary.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(217, 208, 194)');
      await page.screenshot({path:path.join(output,'disabled.png'),fullPage:true});
      await primary.evaluate(el=>el.disabled=false);
      await page.emulateMedia({reducedMotion:'reduce'});
      assert.equal(await primary.evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.evaluate(()=>{courses=[];reminders=[];showCourses();showReminders();drawExitCard();});
      assert.equal(await page.locator('#course-list').textContent(),'這天沒有課程');
      await page.screenshot({path:path.join(output,'empty.png'),fullPage:true});
      await page.evaluate(()=>{
        courses=Array.from({length:12},(_,i)=>({day:5,time:`${i+8}:10`,name:`課程${i}：`+'VeryLongCourseTitle'.repeat(8)}));
        reminders=Array.from({length:8},(_,i)=>({type:'fixed',course:'長標籤'.repeat(10),text:'提醒內容'.repeat(30)}));
        showCourses();showReminders();drawExitCard();
      });
      for(const width of [360,390,768,1024,1440]) {
        await page.setViewportSize({width,height:1000});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`long text overflow ${width}`);
        assert.equal(await page.locator('.course').count(),12);
        assert.equal(await page.locator('.reminder').count(),8);
      }
      await page.setViewportSize({width:360,height:1000});
      await page.screenshot({path:path.join(output,'long-content.png'),fullPage:true});
      // Extension APIs are mocked; no school account, tab or storage is accessed.
      await page.addInitScript(()=>{
        if(!location.pathname.includes('popup.html'))return;
        window.__mode='wrong-page';
        window.__applied=null;
        window.chrome={tabs:{query:async()=>[{id:1,url:window.__mode==='read'?'https://sso.tku.edu.tw/TMWC090_result.aspx':'https://example.invalid/'}]},scripting:{executeScript:async opts=>{
          if(opts.args){window.__applied=opts.args[0];return [];}
          return [{result:{day1:[{period:'一',course:'互動設計',teacher:'測試',room:'E101'}]}}];
        }}};
      });
      await page.setViewportSize({width:366,height:650});
      await page.goto(base+'/tku-connector/popup.html');
      await page.locator('#applyBtn').click();
      assert.match(await page.locator('#status').textContent(),/請先讀取淡江課表/);
      await page.locator('#readBtn').click();
      assert.match(await page.locator('#status').textContent(),/請先開啟淡江個人課表/);
      await page.screenshot({path:path.join(output,'connector-error.png'),fullPage:true});
      await page.evaluate(()=>window.__mode='read');
      await page.locator('#readBtn').click();
      assert.match(await page.locator('#status').textContent(),/讀取成功/);
      await page.locator('#applyBtn').click();
      assert.match(await page.locator('#status').textContent(),/已套用到 ExitCard/);
      assert.equal((await page.evaluate(()=>window.__applied))[0].name,'互動設計');
      await page.screenshot({path:path.join(output,'connector-success.png'),fullPage:true});
      assert.deepEqual(errors,[]);
      report.validation={geometry:'all unchanged except mobile date spacing and preview scaling',geometryExceptions,bitmap:'identical at all five widths',flows:'course/reminder CRUD, validation, persistence, week navigation, seven-day mocked sync, connector mocked import passed',keyboard:'22 Tab stops match baseline',states:'focus, hover, pressed, disabled, reduced motion, empty and long content passed'};
    }
    fs.writeFileSync(path.join(output,'measurements.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({phase,widths:Object.fromEntries(Object.entries(report.widths).map(([k,v])=>[k,{overflow:v.overflow,controls:v.controls.length}])),errors,output},null,2));
  } finally {await browser.close(); server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
