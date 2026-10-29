// Actual DOMParser, renderer, CSS and content orchestration; all network I/O is mocked.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join((process.env.USERPROFILE || process.env.HOME), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))); }
const root = path.resolve(__dirname, '..');
const source = file => {
  const old = process.env.OTTSub_TEST_SOURCE && path.join(process.env.OTTSub_TEST_SOURCE, file);
  return fs.readFileSync(old && fs.existsSync(old) ? old : path.join(root, file), 'utf8');
};
(async () => {
  const browser = await chromium.launch({ headless: true }); const errors = [], cases = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1032 } });
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', r => r.fulfill({ contentType: 'text/html', body: '<div data-uia="player" style="width:1900px;height:1000px;position:relative"><video style="width:1900px;height:1000px"></video></div>' }));
    await page.goto('https://ottsub.test/watch/100');
    await page.evaluate(() => {
      window.audit = { time: 10, callbacks: [], changes: new Set(), saved: {}, writes: [], vtt: 'WEBVTT\n\n00:00:00.000 --> 00:01:00.000\nSECONDARY\n' };
      const storage = { get: (keys, cb) => cb({...audit.saved}), set: (values, cb) => {
        const changes = Object.fromEntries(Object.entries(values).filter(([k,v]) => audit.saved[k] !== v).map(([k,v]) => [k,{oldValue:audit.saved[k],newValue:v}]));
        Object.assign(audit.saved, values);audit.writes.push({...values});cb?.();
        queueMicrotask(() => { if(Object.keys(changes).length) for(const fn of audit.changes) fn(changes,'local'); });
      } };
      window.chrome = { i18n: { getUILanguage: () => 'en', getMessage: k => k }, runtime: { id: 'test', onMessage: { addListener: fn => audit.callbacks.push(fn) } },
        storage: { local: storage, sync: storage, onChanged: { addListener: fn => audit.changes.add(fn), removeListener: fn => audit.changes.delete(fn) } } };
      const v = document.querySelector('video');
      for (const [key, value] of Object.entries({ paused: true, ended: false, readyState: 4 })) Object.defineProperty(v, key, { get: () => value });
      Object.defineProperty(v, 'currentTime', { get: () => audit.time });
      window.fetch = async url => ({ url, ok: true, status: 200, text: async () => audit.vtt });
      window.command = (action, value) => audit.callbacks[0]({ action, value }, { id: 'test' }, () => {});
      window.settle = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
      window.renderAt = time => { audit.time = time; command('adjust_offset', 0); };
      window.resetPositionHistory = () => v.dispatchEvent(new Event('seeking'));
    });
    const manifest = JSON.parse(source('manifest.json'));
    const group = manifest.content_scripts.find(g => g.world === 'ISOLATED');
    for (const file of group.css) await page.addStyleTag({ content: source(file) });
    for (const file of group.js) await page.addScriptTag({ content: source(file) });
    const result = await page.evaluate(async () => {
      const checks = [];
      const check = (name, passed, detail) => checks.push({ name, passed: !!passed, detail });
      await settle();
      const xml = (region, paragraph = '<p begin="1s" end="20s" region="r">TEXT</p>', head = '', rootAttrs = '') =>
        `<tt xmlns="http://www.w3.org/ns/ttml" xmlns:tts="http://www.w3.org/ns/ttml#styling" ${rootAttrs}><head><styling>${head}</styling><layout>${region}</layout></head><body><div>${paragraph}</div></body></tt>`;
      const parseTop = doc => { const cues = OTTSubParser.parse(doc); return cues.length === 1 ? cues[0].isTop : 'parse-failed'; };
      const fixtures = [
        ['bottom before alignment', xml('<region xml:id="r" tts:origin="10% 80%" tts:extent="80% 15%" tts:displayAlign="before"/>'), false],
        ['top small region with after alignment', xml('<region xml:id="r" tts:origin="10% 5%" tts:extent="80% 20%" tts:displayAlign="after"/>'), true],
        ['full-frame after alignment', xml('<region xml:id="r" tts:origin="0% 0%" tts:extent="100% 100%" tts:displayAlign="after"/>'), false],
        ['full-frame before alignment', xml('<region xml:id="r" tts:origin="0% 0%" tts:extent="100% 100%" tts:displayAlign="before"/>'), true],
        ['default geometry before alignment', xml('<region xml:id="r" tts:displayAlign="before"/>'), true],
        ['pixel region with root extent', xml('<region xml:id="r" tts:origin="192px 864px" tts:extent="1536px 162px" tts:displayAlign="before"/>', undefined, '', 'tts:extent="1920px 1080px"'), false],
        ['referenced region style', xml('<region xml:id="r" style="b"/>', undefined, '<style xml:id="a" tts:origin="10% 80%"/><style xml:id="b" style="a" tts:extent="80% 15%" tts:displayAlign="before"/>'), false],
        ['inline style child', xml('<region xml:id="r"><style tts:origin="10% 80%" tts:extent="80% 15%" tts:displayAlign="before"/></region>'), false],
        ['geometry overrides top name', xml('<region xml:id="r_top" tts:origin="10% 80%"/>', '<p region="r_top" begin="1s" end="20s">TEXT</p>'), false],
        ['inherited div region', xml('<region xml:id="r" tts:origin="10% 5%" tts:extent="80% 20%"/>', '<div region="r"><p begin="1s" end="20s">TEXT</p></div>'), true],
        ['paragraph geometry overrides region', xml('<region xml:id="r" tts:origin="10% 5%"/>', '<p region="r" tts:origin="10% 80%" begin="1s" end="20s">TEXT</p>'), false],
        ['cyclic styles do not hang', xml('<region xml:id="r" style="a"/>', undefined, '<style xml:id="a" style="b"/><style xml:id="b" style="a" tts:origin="10% 80%"/>'), false]
      ];
      for (const [name, input, expected] of fixtures) { const actual = parseTop(input); check(name, actual === expected, { actual, expected }); }
      const vtt = OTTSubParser.parse('WEBVTT\n\n00:00:01.000 --> 00:00:02.000 line:10%\nTOP\n\n00:00:02.000 --> 00:00:03.000 line:-1\nBOTTOM\n');
      check('WebVTT line placement', vtt[0]?.isTop && !vtt[1]?.isTop);
      dispatchEvent(new CustomEvent('ottsub_manifest_data', { detail: { source: 'ottsub_injected', movieId: '100', urls: ['https://cdn.nflxvideo.net/primary'], tracksByLang: { ko: ['https://cdn.nflxvideo.net/secondary'] } } }));
      await settle();
      const primary = rows => OTTSubSyncEngine.setCues('100', rows.map((row, id) => ({ id, ...row })));
      primary([{ begin: 0, end: 11, text: 'PRIMARY TOP', isTop: true }, { begin: 11, end: 60, text: 'PRIMARY BOTTOM', isTop: false }]);
      resetPositionHistory(); renderAt(10);
      check('primary top lifts secondary in the same render', OTTSubRenderer.topBox.textContent.includes('PRIMARY TOP') && OTTSubRenderer.topBox.textContent.includes('SECONDARY') && !OTTSubRenderer.bottomBox.textContent);
      renderAt(11.1);
      check('hold moves both bottom cues together', OTTSubRenderer.topBox.textContent.includes('PRIMARY BOTTOM') && OTTSubRenderer.topBox.textContent.includes('SECONDARY') && !OTTSubRenderer.bottomBox.textContent);
      resetPositionHistory(); renderAt(11.1);
      check('seek resets top hold', OTTSubRenderer.bottomBox.textContent.includes('PRIMARY BOTTOM') && OTTSubRenderer.bottomBox.textContent.includes('SECONDARY'));
      command('set_dual_mode', false); resetPositionHistory();
      primary([{ begin: 0, end: 11, text: 'PRIMARY TOP', isTop: true }, { begin: 11, end: 60, text: 'PRIMARY BOTTOM', isTop: false }]);
      renderAt(10); renderAt(11.1);
      check('single mode has no secondary-driven hold', !OTTSubRenderer.topBox.textContent && OTTSubRenderer.bottomBox.textContent.includes('PRIMARY BOTTOM') && !OTTSubRenderer.bottomBox.textContent.includes('SECONDARY'));
      command('set_dual_mode', true); command('set_lock_pos', true); resetPositionHistory();
      primary([{ begin: 1, end: 10, text: 'OLD FIRST', isTop: false }, { begin: 1, end: 10, text: 'OLD SECOND', isTop: false }, { begin: 10, end: 15, text: 'NEW FIRST\nNEW SECOND', isTop: false }]);
      const frames = [];
      for (const t of [9.98, 9.99, 9.995, 9.999, 10, 10.001, 10.01]) {
        renderAt(t);
        const el = OTTSubRenderer.bottomBox.querySelector('.ottsub-line-primary');
        frames.push({ t, text: el.textContent, top: el.getBoundingClientRect().top, height: el.getBoundingClientRect().height });
      }
      check('no ghost row across the exact hand-off', frames.every(f => f.t < 10 ? f.text === 'OLD FIRST\nOLD SECOND' : f.text === 'NEW FIRST\nNEW SECOND'), frames);
      check('two-line hand-off preserves pixel height and top', Math.max(...frames.map(f => f.height)) - Math.min(...frames.map(f => f.height)) < 0.5 && Math.max(...frames.map(f => f.top)) - Math.min(...frames.map(f => f.top)) < 0.5, frames);
      // Hold primary fixed while secondary disappears: measure the real CSS slot.
      primary([{ begin: 0, end: 120, text: 'PRIMARY FIXED', isTop: false }]); resetPositionHistory(); renderAt(59);
      const yWith = OTTSubRenderer.bottomBox.querySelector('.ottsub-line-primary').getBoundingClientRect().top;
      renderAt(61);
      const yWithout = OTTSubRenderer.bottomBox.querySelector('.ottsub-line-primary').getBoundingClientRect().top;
      check('primary lower baseline stable when secondary disappears', Math.abs(yWith - yWithout) < 0.5, { yWith, yWithout });
      return checks;
    });
    cases.push(...result);
    const check = async (name, action) => { await action();cases.push({name,passed:true}); };
    await check('common and per-language backgrounds survive storage notifications and remount', async () => {
      const states = await page.evaluate(async () => {
        const R=OTTSubRenderer, states=[];
        renderAt(10);resetPositionHistory();
        const state=()=>({p:R.primaryBgBoxEnabled,s:R.secondaryBgBoxEnabled,
          pPaint:getComputedStyle(R.bottomBox.querySelector('.ottsub-line-primary')).backgroundColor,
          sPaint:getComputedStyle(R.bottomBox.querySelector('.ottsub-line-secondary')).backgroundColor});
        command('set_bg_box',true);
        states.push({common:R.bgBoxEnabled,commonClass:R.container.classList.contains('has-bg-box')});
        await settle();states.push(state());
        command('set_primary_bg_box',false);await settle();states.push(state());
        R.destroy();R.ensureMounted(document.querySelector('video'));renderAt(10);states.push(state());
        command('set_bg_box',false);await settle();states.push(state());
        return states;
      });
      assert.deepEqual(states[0],{common:true,commonClass:true});
      assert.deepEqual(states.slice(1).map(s=>[s.p,s.s]),[[true,true],[false,true],[false,true],[false,false]]);
      const transparent='rgba(0, 0, 0, 0)';
      assert.notEqual(states[1].pPaint,transparent);assert.notEqual(states[1].sPaint,transparent);
      assert.equal(states[2].pPaint,transparent);assert.notEqual(states[2].sPaint,transparent);
      assert.equal(states[4].pPaint,transparent);assert.equal(states[4].sPaint,transparent);
    });
    const drag = async () => {
      const rect=await page.locator('.ottsub-line-primary').filter({visible:true}).first().boundingBox();
      assert.ok(rect);const x=rect.x+rect.width/2,y=rect.y+rect.height/2;
      await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+95,y-100,{steps:5});
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.mouse.up();
    };
    await check('real mouse drag saves both coordinates; reset clears rendered and stored position', async () => {
      await page.evaluate(()=>{command('set_lock_pos',false);command('reset_custom_position');});
      await drag();
      const state=await page.evaluate(()=>({x:OTTSubRenderer.customPosX,y:OTTSubRenderer.customPosY,saved:audit.saved}));
      assert.ok(state.x>0 && state.y<0);assert.equal(state.saved.ottsub_custom_pos_x,state.x);assert.equal(state.saved.ottsub_custom_pos_y,state.y);
      await page.evaluate(()=>command('reset_custom_position'));
      assert.deepEqual(await page.evaluate(()=>[OTTSubRenderer.customPosX,OTTSubRenderer.customPosY,audit.saved.ottsub_custom_pos_x,audit.saved.ottsub_custom_pos_y]),[0,0,0,0]);
    });
    await check('position lock blocks actual dragging while keeping subtitle pointer hit testing', async () => {
      await page.evaluate(()=>command('set_lock_pos',true));await drag();
      assert.deepEqual(await page.evaluate(()=>[OTTSubRenderer.customPosX,OTTSubRenderer.customPosY]),[0,0]);
      const hit=await page.locator('.ottsub-line-primary').filter({visible:true}).first().evaluate(el=>{
        const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
      });assert.equal(hit,true);
    });
    await check('saved blur is painted and actual mouse hover reveals it while position is locked', async () => {
      await page.mouse.move(1,1);
      await page.evaluate(()=>{for(const fn of audit.changes) fn({ottsub_blur_target:{newValue:'primary'},ottsub_blur_mode:{newValue:'blur_8'}},'local');renderAt(10);});
      const line=page.locator('.ottsub-line-primary').filter({visible:true}).first();
      await page.waitForFunction(()=>getComputedStyle(OTTSubRenderer.bottomBox.querySelector('.ottsub-line-primary')).filter==='blur(8px)');
      await line.hover();
      await page.waitForFunction(()=>getComputedStyle(OTTSubRenderer.bottomBox.querySelector('.ottsub-line-primary')).filter==='none');
      await page.mouse.move(1,1);
      await page.waitForFunction(()=>getComputedStyle(OTTSubRenderer.bottomBox.querySelector('.ottsub-line-primary')).filter==='blur(8px)');
    });
    await check('long subtitles wrap inside the player and retain explicit line breaks', async () => {
      await page.setViewportSize({width:640,height:600});
      const layout=await page.evaluate(()=>{
        document.querySelector('[data-uia="player"]').style.cssText='width:620px;height:570px;position:relative';
        document.querySelector('video').style.cssText='width:620px;height:570px';
        OTTSubSyncEngine.setCues('100',[{begin:0,end:60,text:('Subtitle wrapping sample ').repeat(12)+'\nEXPLICIT LAST LINE',isTop:false}]);
        resetPositionHistory();renderAt(10);
        const el=OTTSubRenderer.bottomBox.querySelector('.ottsub-line-primary'),r=el.getBoundingClientRect(),p=document.querySelector('video').getBoundingClientRect();
        return {left:r.left,right:r.right,playerLeft:p.left,playerRight:p.right,height:r.height,lineHeight:parseFloat(getComputedStyle(el).lineHeight),text:el.innerText};
      });
      assert.ok(layout.left>=layout.playerLeft-1 && layout.right<=layout.playerRight+1,JSON.stringify(layout));
      assert.ok(layout.height>layout.lineHeight*2);assert.ok(layout.text.includes('\nEXPLICIT LAST LINE'));
    });
    console.log(JSON.stringify({ browser: browser.version(), passed: cases.filter(c => c.passed).length, total: cases.length, errors, cases }, null, 2));
    assert.deepEqual(errors, []);
    assert.equal(cases.filter(c => !c.passed).length, 0, cases.filter(c => !c.passed).map(c => c.name).join(', '));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
