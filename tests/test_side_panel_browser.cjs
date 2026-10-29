const {supportedUILocales}=require('./helpers/ui-locales.cjs');
// The real unpacked extension, plus a controlled active-tab switch in its settings UI.
const path = require('node:path');
const assert = require('node:assert/strict');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join((process.env.USERPROFILE || process.env.HOME), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))); }

(async () => {
  const root = path.resolve(__dirname, '..');
  const artifacts = process.env.OTTSUB_QA_ARTIFACT_DIR || path.join(root,'artifacts/qa/manual/side-panel');
  require('node:fs').mkdirSync(artifacts,{recursive:true});
  const context = await chromium.launchPersistentContext('', { headless: true, channel: 'chromium',
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`] });
  const cases = [];
  const check = async (name, action) => { await action(); cases.push({ name, passed: true }); };
  try {
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const extensionId = new URL(worker.url()).host;
    await check('toolbar action is configured to open the side panel', async () => {
      const state = await worker.evaluate(async () => ({
        manifest: chrome.runtime.getManifest(), behavior: await chrome.sidePanel.getPanelBehavior()
      }));
      assert.equal(state.manifest.action.default_popup, undefined);
      assert.equal(state.manifest.side_panel.default_path, 'popup/popup.html');
      assert.equal(state.behavior.openPanelOnActionClick, true);
    });

    const panel = await context.newPage();
    await panel.addInitScript(() => {
      window.__testActiveTabId = 101;
      window.__testMode = 'ok'; window.__testReloads = [];
      chrome.tabs.reload = (id, cb) => { __testReloads.push(id); cb?.(); };
      chrome.tabs.query = (_options, callback) => callback(__testMode === 'empty' ? [] : [{ id: window.__testActiveTabId, url: __testMode === 'other-host' ? undefined : 'https://www.netflix.com/watch/100' }]);
      chrome.tabs.sendMessage = (tabId, _message, callback) => {
        if (__testMode === 'dropped') return;
        if (__testMode === 'missing') return callback();
        callback({
        build: __testMode === 'old-build' ? 'previous-build' : chrome.runtime.getManifest().version_name,
        ready: tabId === 101, movieId: String(tabId), hasCues: tabId === 101, cueCount: 1,
        hasSecondaryCues: false, isDualMode: true, availableTracks: [], ...window.__testPayload
      }); };
    });
    await panel.setViewportSize({ width: 380, height: 720 });
    await panel.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await check('settings fit a side panel and remain scrollable', async () => {
      await panel.waitForFunction(() => document.querySelector('#status-badge')?.classList.contains('active'));
      const layout = await panel.evaluate(() => ({ width: document.body.getBoundingClientRect().width,
        minHeight: getComputedStyle(document.body).minHeight, overflow: getComputedStyle(document.body).overflowY }));
      assert.equal(layout.width, 380);
      assert.equal(layout.minHeight, '720px');
      assert.equal(layout.overflow, 'auto');
      await panel.setViewportSize({ width: 650, height: 720 });
      const wide = await panel.evaluate(() => ({ body: document.body.getBoundingClientRect().width,
        content: document.querySelector('.popup-container').getBoundingClientRect().width,
        background: getComputedStyle(document.body).backgroundColor }));
      assert.equal(wide.body, 650);
      assert.equal(wide.content, 520);
      assert.equal(wide.background, 'rgb(20, 20, 20)');
    });
    await check('packaged local dynamic import and injected lastError check work in the real extension context', async () => {
      const actual = await panel.evaluate(async () => {
        const { bindPopupSettings } = await import('./modules/settings-binding.js');
        let observed = false, applies = 0, complete;
        const done = new Promise(resolve => { complete = resolve; });
        const binding = bindPopupSettings({
          storage: { local: { get: (_, callback) => chrome.tabs.get(2147483647, callback) }, onChanged: chrome.storage.onChanged },
          selectChanges: () => ({}), apply: () => { applies++; },
          hasReadError: () => { observed = !!chrome.runtime.lastError; queueMicrotask(complete); return observed; }
        });
        await done; binding.destroy(); return { observed, applies };
      });
      assert.deepEqual(actual, { observed: true, applies: 0 });
    });
    await check('persistent settings panel follows the newly active tab', async () => {
      await panel.evaluate(() => { window.__testActiveTabId = 202; });
      await panel.waitForFunction(() => !document.querySelector('#status-badge')?.classList.contains('active'));
      await panel.evaluate(() => { window.__testActiveTabId = 101; });
      await panel.waitForFunction(() => document.querySelector('#status-badge')?.classList.contains('active'));
    });
    await check('five UI languages fit 320px and Japanese selection survives reopening',async()=>{
      await panel.setViewportSize({width:320,height:800});
      for(const lang of ['ko','en','es','de','ja']){
        await panel.selectOption('#ui-lang-select',lang);
        assert.equal(await panel.evaluate(()=>document.documentElement.scrollWidth<=320),true,lang);
        assert.equal(await panel.evaluate(()=>document.documentElement.lang),lang);
      }
      await panel.waitForTimeout(500);await panel.reload();
      await panel.waitForFunction(()=>document.getElementById('ui-lang-select').value==='ja');
      assert.equal(await panel.locator('[data-i18n="primary_lang_label"]').textContent(),'主字幕の言語');
      await panel.screenshot({path:path.join(artifacts,'japanese-panel.png'),fullPage:true});
    });
    await check('supported Spanish with no URL shows secondary-only notice, not unsupported; primary stays ready',async()=>{
      await panel.selectOption('#ui-lang-select','ko');
      await panel.evaluate(async()=>{
        const dual=await import('./modules/ui-dual.js');dual.restoreSecondaryLanguage('es-es');
        const primary=await import('./modules/ui-primary.js');primary.restorePrimaryLanguage('en');
        window.__testPayload={primaryLang:'en',secondaryLang:'es-es',cueCount:1108,hasCues:true,hasSecondaryCues:false,secondaryNeedsSelection:true,
          availableTracks:[{bcp47:'en',hasUrls:true},{bcp47:'es-ES',hasUrls:false}]};
      });
      await panel.waitForFunction(()=>!document.getElementById('secondary-track-notice').hidden);
      assert.equal(await panel.locator('#primary-track-notice').isVisible(),false);
      assert.equal(await panel.locator('#track-notice').count(),0);
      assert.equal(await panel.locator('#secondary-sub-status').textContent(),'자막 주소 대기 중');
      assert.equal(await panel.locator('#sub-status').textContent(),'준비됨 (1,108묶음)');
      assert.equal(await panel.locator('#secondary-sub-status').getAttribute('data-status-key'),'track_download_pending');
      assert.equal(await panel.locator('#primary-auto-description').isVisible(),false);
      await panel.locator('#sub-status').click();assert.match(await panel.locator('#popover-body').textContent(),/시작·종료 시간/);
      await panel.keyboard.press('Escape');
      await panel.screenshot({path:path.join(artifacts,'secondary-pending.png'),fullPage:true});
      await panel.evaluate(()=>{__testPayload.hasCues=false;__testPayload.primaryNeedsSelection=true;__testPayload.hasSecondaryCues=true;__testPayload.secondaryNeedsSelection=false;__testPayload.secondaryCueCount=900;});
      await panel.waitForFunction(()=>!document.getElementById('primary-track-notice').hidden&&document.getElementById('secondary-track-notice').hidden);
      assert.equal(await panel.locator('#secondary-sub-status').textContent(),'준비됨 (900묶음)');
      await panel.evaluate(()=>{__testPayload.hasSecondaryCues=false;__testPayload.secondaryNeedsSelection=true;});
      await panel.waitForFunction(()=>!document.getElementById('primary-track-notice').hidden&&!document.getElementById('secondary-track-notice').hidden);
      await panel.evaluate(()=>{__testPayload.availableTracks=[{bcp47:'en'}];});
      await panel.waitForFunction(()=>document.getElementById('secondary-sub-status').textContent.includes('지원 안 함'));
      assert.equal(await panel.locator('#secondary-track-notice').isVisible(),false);
      await panel.evaluate(()=>{__testPayload.isDualMode=false;});
      await panel.waitForFunction(()=>document.getElementById('secondary-sub-status').dataset.statusKey==='secondary_status_off');
      await panel.evaluate(async()=>{__testPayload=undefined;const primary=await import('./modules/ui-primary.js');primary.restorePrimaryLanguage('auto');const dual=await import('./modules/ui-dual.js');dual.restoreSecondaryLanguage('ko');});
    });
    await check('missing receiver and old content build are disconnected, not waiting or subtitles off', async () => {
      for (const mode of ['missing','old-build','dropped']) {
        await panel.evaluate(mode=>{__testMode=mode;},mode);
        await panel.waitForFunction(()=>document.querySelector('#status-badge').dataset.statusKey==='panel_disconnected');
        assert.equal(await panel.locator('#secondary-sub-status').getAttribute('data-status-key'),'panel_disconnected');
        assert.equal(await panel.locator('#reload-video').isVisible(),true);
        await panel.evaluate(()=>__testMode='ok');
        await panel.waitForFunction(()=>document.querySelector('#status-badge').dataset.statusKey==='status_connected');
      }
      assert.deepEqual(await panel.evaluate(()=>__testReloads),[],'never reload playback automatically');
      await panel.evaluate(()=>__testMode='missing');
      await panel.waitForFunction(()=>!document.querySelector('#reload-video').hidden);
      await panel.locator('#reload-video').click();assert.deepEqual(await panel.evaluate(()=>__testReloads),[101]);
      await panel.evaluate(()=>__testMode='ok');
    });
    await check('empty active-tab result does not permanently stop status polling', async () => {
      await panel.evaluate(()=>__testMode='empty');
      await panel.waitForFunction(()=>document.querySelector('#status-badge').dataset.statusKey==='panel_no_tab');
      await panel.evaluate(()=>__testMode='ok');
      await panel.waitForFunction(()=>document.querySelector('#status-badge').dataset.statusKey==='status_connected');
    });
    await check('another host without URL permission is not reported as a broken Netflix connection', async () => {
      await panel.evaluate(()=>__testMode='other-host');
      await panel.waitForFunction(()=>document.querySelector('#status-badge').dataset.statusKey==='panel_no_tab');
      await panel.evaluate(()=>__testMode='ok');
      await panel.waitForFunction(()=>document.querySelector('#status-badge').dataset.statusKey==='status_connected');
    });
    await check('accepted remote settings update local UI; a delayed older echo cannot revert it', async () => {
      await panel.evaluate(async()=>{const ui=await import('./popup.js');ui.queuePopupStorageSave('ottsub_secondary_lang','ja');ui.flushPopupStorageSave();});
      await panel.waitForFunction(()=>document.querySelector('#secondary-lang-select').value==='ja');
      await panel.evaluate(async()=>{
        const key='ottsub_revision_ottsub_secondary_lang';
        window.__oldRecord=(await chrome.storage.local.get(key))[key];
        await chrome.storage.sync.set({[key]:{n:__oldRecord.n+1,origin:'other-device',value:'es'},ottsub_secondary_lang:'es'});
      });
      await panel.waitForFunction(()=>document.querySelector('#secondary-lang-select').value==='es');
      await panel.evaluate(async()=>chrome.storage.sync.set({ottsub_revision_ottsub_secondary_lang:__oldRecord,ottsub_secondary_lang:'ja'}));
      await panel.waitForFunction(async()=>{
        const s=await chrome.storage.sync.get('ottsub_secondary_lang');return s.ottsub_secondary_lang==='es';
      });
      assert.equal(await panel.locator('#secondary-lang-select').inputValue(),'es');
    });
    await check('accordion collapse, inert focus isolation and reload persistence', async () => {
      for (const id of ['sub-settings', 'lang-adjust', 'shortcuts', 'learning']) {
        const button = panel.locator(`#${id}-toggle-btn`);
        if (await button.getAttribute('aria-expanded') === 'false') await button.click();
        await button.click();
        assert.equal(await button.getAttribute('aria-expanded'), 'false');
        const isolated = await button.evaluate(btn => {
          const body = document.getElementById(btn.getAttribute('aria-controls'));
          const child = body.querySelector('button, input, select, [tabindex="0"]');
          child?.focus();
          return body.inert && !body.contains(document.activeElement);
        });
        assert.equal(isolated, true, id);
      }
      await panel.waitForFunction(async () => {
        const s = await chrome.storage.local.get(null);
        return ['sub_settings', 'lang_adjust', 'shortcuts', 'learning'].every(k => s[`ottsub_${k}_collapsed`] === true);
      });
      await panel.reload();
      for (const id of ['sub-settings', 'lang-adjust', 'shortcuts', 'learning']) {
        const button = panel.locator(`#${id}-toggle-btn`);
        await panel.waitForFunction(id => document.getElementById(`${id}-toggle-btn`).getAttribute('aria-expanded') === 'false', id);
        await button.click();
        assert.equal(await button.getAttribute('aria-expanded'), 'true');
        assert.equal(await button.evaluate(btn => document.getElementById(btn.getAttribute('aria-controls')).inert), false);
      }
    });
    await check('Arabic UI persists, mirrors the panel and keeps timing controls LTR', async () => {
      await panel.locator('#ui-lang-select').selectOption('ar');
      await panel.waitForFunction(()=>document.documentElement.dir==='rtl');
      assert.equal(await panel.locator('html').getAttribute('lang'), 'ar');
      assert.equal(await panel.locator('#ui-lang-select').getAttribute('aria-label'), 'لغة الواجهة');
      assert.equal(await panel.locator('.stepper-group').first().evaluate(el=>getComputedStyle(el).direction), 'ltr');
      assert.equal(await panel.locator('.slider-row').evaluate(el=>getComputedStyle(el).direction), 'ltr');
      await panel.waitForFunction(async()=> (await chrome.storage.local.get('ottsub_ui_lang')).ottsub_ui_lang==='ar');
      await panel.reload();
      await panel.waitForFunction(()=>document.documentElement.dir==='rtl' && document.querySelector('#ui-lang-select').value==='ar');
      const viewport = panel.viewportSize();
      await panel.setViewportSize({width:360,height:900});
      assert.equal(await panel.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), true);
      await panel.screenshot({path:path.join(artifacts,'arabic-panel.png'),fullPage:true});
      await panel.setViewportSize(viewport);
      await panel.locator('#ui-lang-select').selectOption('en');
      await panel.waitForFunction(()=>document.documentElement.dir==='ltr');
    });
    await check('Malay language and LTR persist through real extension storage and panel reload', async () => {
      await panel.selectOption('#ui-lang-select', 'he');
      await panel.waitForFunction(() => document.documentElement.dir === 'rtl');
      await panel.selectOption('#ui-lang-select', 'ms');
      await panel.waitForFunction(async () => (await chrome.storage.local.get('ottsub_ui_lang')).ottsub_ui_lang === 'ms');
      await panel.reload();
      await panel.waitForFunction(() => document.documentElement.lang === 'ms' && document.documentElement.dir === 'ltr');
      assert.equal(await panel.locator('#ui-lang-select').inputValue(), 'ms');
      assert.equal(await panel.locator('#ui-lang-select').getAttribute('aria-label'), 'Bahasa antara muka');
      assert.equal(await panel.locator('[data-i18n="primary_lang_label"]').textContent(), 'Bahasa utama');
      assert.equal(await panel.locator('#primary-track-kind option[value="cc"]').getAttribute('title'), 'CC (penerangan bunyi)');
      await panel.setViewportSize({width:320,height:900});
      assert.equal(await panel.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await panel.screenshot({path:path.join(artifacts,'malay-extension-panel.png'),fullPage:true});
    });
    await check('Bengali persists through real extension storage and restores LTR after Hebrew', async () => {
      await panel.selectOption('#ui-lang-select', 'he');
      await panel.waitForFunction(() => document.documentElement.dir === 'rtl');
      await panel.selectOption('#ui-lang-select', 'bn');
      await panel.waitForFunction(async () => (await chrome.storage.local.get('ottsub_ui_lang')).ottsub_ui_lang === 'bn');
      await panel.reload();
      await panel.waitForFunction(() => document.documentElement.lang === 'bn' && document.documentElement.dir === 'ltr');
      assert.equal(await panel.locator('#ui-lang-select').inputValue(), 'bn');
      assert.equal(await panel.locator('[data-i18n="primary_lang_label"]').textContent(), 'প্রধান ভাষা');
      assert.equal(await panel.locator('#primary-track-kind option[value="cc"]').getAttribute('title'), 'CC (শব্দের বিবরণ)');
      assert.equal(await panel.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await panel.screenshot({path:path.join(artifacts,'bengali-extension-panel.png'),fullPage:true});
    });
    await check('Turkish persists through real extension storage and restores LTR after Arabic', async () => {
      await panel.selectOption('#ui-lang-select', 'ar');
      await panel.waitForFunction(() => document.documentElement.dir === 'rtl');
      await panel.selectOption('#ui-lang-select', 'tr');
      await panel.waitForFunction(async () => (await chrome.storage.local.get('ottsub_ui_lang')).ottsub_ui_lang === 'tr');
      await panel.reload();
      await panel.waitForFunction(() => document.documentElement.lang === 'tr' && document.documentElement.dir === 'ltr');
      assert.equal(await panel.locator('#ui-lang-select').inputValue(), 'tr');
      assert.equal(await panel.locator('#ui-lang-select').getAttribute('aria-label'), 'Arayüz dili');
      assert.equal(await panel.locator('[data-i18n="primary_lang_label"]').textContent(), 'Ana alt yazı dili');
      assert.equal(await panel.locator('#primary-track-kind option[value="cc"]').getAttribute('title'), 'CC (ses açıklamaları)');
      assert.equal(await panel.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await panel.screenshot({path:path.join(artifacts,'turkish-extension-panel.png'),fullPage:true});
    });
    await check('Traditional Chinese survives normalized real storage and restores LTR after Hebrew', async () => {
      await panel.selectOption('#ui-lang-select', 'he');
      await panel.waitForFunction(() => document.documentElement.dir === 'rtl');
      await panel.selectOption('#ui-lang-select', 'zh-TW');
      await panel.waitForFunction(async () => (await chrome.storage.local.get('ottsub_ui_lang')).ottsub_ui_lang === 'zh-tw');
      await panel.reload();
      await panel.waitForFunction(() => document.documentElement.lang === 'zh-TW' && document.documentElement.dir === 'ltr');
      assert.equal(await panel.locator('#ui-lang-select').inputValue(), 'zh-TW');
      assert.equal(await panel.locator('#ui-lang-select').getAttribute('aria-label'), '介面語言');
      assert.equal(await panel.locator('[data-i18n="primary_lang_label"]').textContent(), '主要字幕語言');
      assert.equal(await panel.locator('#primary-track-kind option[value="cc"]').getAttribute('title'), 'CC（聲音描述）');
      assert.equal(await panel.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await panel.screenshot({path:path.join(artifacts,'taiwan-extension-panel.png'),fullPage:true});
    });
    await check('Actual extension menu pins browser UI language and alphabetizes the remaining English names', async () => {
      const state=await panel.evaluate(()=>({detected:OTTSubI18n.detectBrowserLanguage(),selected:document.getElementById('ui-lang-select').value,options:[...document.getElementById('ui-lang-select').options].map(e=>({value:e.value,name:e.dataset.englishName}))}));
      assert.equal(state.options.length,supportedUILocales().length);assert.equal(state.options[0].value,state.detected);assert.equal(state.selected,'zh-TW');
      const names=state.options.slice(1).map(e=>e.name);assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b,'en')));
    });
    await check('Portugal menu persists in real extension storage and restores LTR after Hebrew', async () => {
      await panel.selectOption('#ui-lang-select', 'he');
      await panel.waitForFunction(() => document.documentElement.dir === 'rtl');
      await panel.selectOption('#ui-lang-select', 'pt-PT');
      await panel.waitForFunction(async () => (await chrome.storage.local.get('ottsub_ui_lang')).ottsub_ui_lang === 'pt-pt');
      await panel.reload();
      await panel.waitForFunction(() => document.documentElement.lang === 'pt-PT' && document.documentElement.dir === 'ltr');
      assert.equal(await panel.locator('#ui-lang-select').inputValue(), 'pt-PT');
      assert.equal(await panel.locator('#ui-lang-select').getAttribute('aria-label'), 'Idioma da interface');
      assert.equal(await panel.locator('[data-i18n="primary_lang_label"]').textContent(), 'Idioma das legendas principais');
      assert.equal(await panel.locator('#primary-track-kind option[value="cc"]').getAttribute('title'), 'CC (descrições de sons)');
      assert.equal(await panel.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await panel.screenshot({path:path.join(artifacts,'portuguese-extension-panel.png'),fullPage:true});
    });
    await check('Russian language persists in the actual extension and restores LTR after Hebrew', async () => {
      await panel.selectOption('#ui-lang-select', 'he');
      await panel.waitForFunction(() => document.documentElement.dir === 'rtl');
      await panel.selectOption('#ui-lang-select', 'ru');
      await panel.waitForFunction(async () => (await chrome.storage.local.get('ottsub_ui_lang')).ottsub_ui_lang === 'ru');
      await panel.reload();
      await panel.waitForFunction(() => document.documentElement.lang === 'ru' && document.documentElement.dir === 'ltr');
      assert.equal(await panel.locator('#ui-lang-select').inputValue(), 'ru');
      assert.equal(await panel.locator('#ui-lang-select').getAttribute('aria-label'), 'Язык интерфейса');
      assert.equal(await panel.locator('[data-i18n="primary_lang_label"]').textContent(), 'Основной язык');
      assert.equal(await panel.locator('#primary-track-kind option[value="cc"]').getAttribute('title'), 'CC (описания звуков)');
      assert.equal(await panel.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await panel.screenshot({path:path.join(artifacts,'russian-extension-panel.png'),fullPage:true});
    });
    await check('Thai language persists in the actual extension and restores LTR after Hebrew', async () => {
      await panel.selectOption('#ui-lang-select', 'he');
      await panel.waitForFunction(() => document.documentElement.dir === 'rtl');
      await panel.selectOption('#ui-lang-select', 'th');
      await panel.waitForFunction(async () => (await chrome.storage.local.get('ottsub_ui_lang')).ottsub_ui_lang === 'th');
      await panel.reload();
      await panel.waitForFunction(() => document.documentElement.lang === 'th' && document.documentElement.dir === 'ltr');
      assert.equal(await panel.locator('#ui-lang-select').inputValue(), 'th');
      assert.equal(await panel.locator('#ui-lang-select').getAttribute('aria-label'), 'ภาษาเมนู');
      assert.equal(await panel.locator('[data-i18n="primary_lang_label"]').textContent(), 'ภาษาหลัก');
      assert.equal(await panel.locator('#primary-track-kind option[value="cc"]').getAttribute('title'), 'CC (คำอธิบายเสียง)');
      assert.equal(await panel.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await panel.screenshot({path:path.join(artifacts,'thai-extension-panel.png'),fullPage:true});
    });
    await check('accordion keyboard navigation and Enter activation', async () => {
      const first = panel.locator('#sub-settings-toggle-btn');
      if (await first.getAttribute('aria-expanded') === 'false') await first.click();
      await first.focus();
      for (const [key,id] of [['ArrowDown','lang-adjust'],['ArrowUp','sub-settings'],['End','learning'],['Home','sub-settings']]) {
        await panel.keyboard.press(key);
        assert.equal(await panel.evaluate(() => document.activeElement.id), `${id}-toggle-btn`);
      }
      await panel.keyboard.press('Enter');assert.equal(await first.getAttribute('aria-expanded'), 'false');
      await panel.keyboard.press('Enter');assert.equal(await first.getAttribute('aria-expanded'), 'true');
    });
    await check('status help is a named nonmodal dialog with keyboard focus and return in supported locales', async () => {
      const trigger = panel.locator('#status-badge'), help = panel.locator('#status-popover');
      for (const lang of supportedUILocales()) {
        await panel.selectOption('#ui-lang-select', lang);
        await trigger.focus(); await panel.keyboard.press('Enter');
        assert.equal(await help.getAttribute('role'), 'dialog');
        assert.equal(await help.getAttribute('aria-labelledby'), 'popover-title');
        assert.equal(await help.getAttribute('aria-describedby'), 'popover-body');
        assert.equal(await help.getAttribute('aria-hidden'), 'false');
        assert.equal(await panel.evaluate(() => document.activeElement.id), 'popover-close');
        assert.equal(await trigger.getAttribute('aria-controls'), 'status-popover');
        await panel.keyboard.press('Escape');
        assert.equal(await help.getAttribute('aria-hidden'), 'true');
        assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
        assert.equal(await panel.evaluate(() => document.activeElement.id), 'status-badge');
      }
      await trigger.click(); await panel.locator('#row-primary-status').click();
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      assert.equal(await panel.locator('#row-primary-status').getAttribute('aria-expanded'), 'true');
      await panel.locator('#popover-close').click();
      assert.equal(await panel.evaluate(() => document.activeElement.id), 'row-primary-status');
      await trigger.click(); await panel.locator('.logo-title').click();
      assert.equal(await help.getAttribute('aria-hidden'), 'true');
      assert.notEqual(await panel.evaluate(() => document.activeElement.id), 'popover-close');
    });
    console.log(JSON.stringify({ passed: true, total: cases.length, cases }, null, 2));
  } finally { await context.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
