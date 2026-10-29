// OTTSUB_LOCAL_DIAGNOSTICS — never include this file in a store package.
(() => {
  'use strict';
  const manifest = chrome.runtime?.getManifest?.();
  if (!manifest?.version_name?.includes('-local-') || window.__ottsubLocalDiagnostics) return;
  const rows = [], MAX = 12000;
  let dropped = 0, recording = true, gate, clock, adapter, previousText = '', previousAt = null, lastGateAt = -Infinity;
  const number = n => Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null;
  const language = value => typeof value === 'string' && /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(value) ? value.toLowerCase() : null;
  const normalize = text => String(text || '').normalize('NFC').replace(/\s+/g, ' ').trim();
  function add(type, data) {
    if (!recording) return;
    if (rows.length >= MAX) { rows.splice(0, 1000); dropped += 1000; }
    rows.push({ at: number(performance.now()), type, ...data });
  }
  function wrap(proto, name, before, after) {
    const original = proto[name];
    proto[name] = function(...args) {
      // A diagnostic failure must not change product execution or return values.
      let info;
      try { info = before?.call(this, ...args); } catch (_) {}
      const result = original.apply(this, args);
      try { after?.call(this, result, info, ...args); } catch (_) {}
      return result;
    };
  }
  wrap(window.OTTSubPlaybackGate.prototype, 'observe', null, function(result, _, sample, now) {
    gate = this;
    if (now - lastGateAt < 500 && rows.at(-1)?.state === result.playbackState) return;
    lastGateAt = now;
    add('gate', { state: result.playbackState, reason: result.suppressionReason,
      ad: sample.adSignal, domAd: sample.domAdSignal || sample.adSignal,
      sessionAd: sample.sessionAdSignal || 'unknown', sessionAdReason: sample.sessionAdReason || 'unavailable',
      sessionAdRequired: !!sample.sessionAdRequired,
      pauseAd: !!sample.pauseAd, video: !!sample.video, media: number(sample.mediaTime),
      nativeLength: String(sample.nativeText || '').length, hidden: !!sample.hidden, requiresClock: this.requiresClock });
  });
  wrap(window.OTTSubPlaybackClock.prototype, 'observe', function(sample, now) {
    clock = this;
    const text = normalize(sample.nativeText), transition = text !== previousText;
    const gap = previousAt === null ? null : now - previousAt;
    previousText = text; previousAt = now;
    const matches = this.index.get(text) || [];
    const candidates = this.candidates(sample, now);
    return { transition, gap: number(gap), nativeLength: text.length, matchCount: matches.length,
      matchTrack: matches.length === 1 ? matches[0].track : null,
      cueBegin: matches.length === 1 ? number(matches[0].begin) : null,
      reason: sample.seeking ? 'seeking' : sample.readyState < 2 ? 'not-ready' : sample.paused ? 'paused'
        : gap === null ? 'first-sample' : !transition ? 'unchanged-text' : !text ? 'empty-text'
        : gap > 250 ? 'onset-gap-over-250ms' : !matches.length ? 'no-text-match'
        : matches.length !== 1 ? 'ambiguous-text' : 'candidate-timing-check',
      media: number(sample.mediaTime), playerRaw: number(sample.player?.raw), rate: number(sample.rate),
      nativeVerification: sample.nativeVerification || 'unavailable', nativeTrack: sample.nativeTrack || null,
      candidates: candidates.map(c => ({ source: c.source, unit: c.unit || 1, time: number(c.time),
        delta: matches.length === 1 ? number(c.time - matches[0].begin) : null })),
      tracks: this.tracks.map(t => ({ key: t.key, cues: t.cues.length })) };
  }, function(result, info) {
    add('clock', { ...info, selected: result ? { source: result.source, unit: result.unit || 1, track: result.track, offset: number(result.offset) } : null,
      calibrationOnsets: this.calibration?.values.size || 0,
      clockVerification: result?.verification || null,
      adMemory: { ready: this.sessionProof?.ready === true, retained: !!this.adProof,
        restored: result?.verification === 'ad-memory-onset' },
      evidence: [...this.evidence.values()].map(e => ({ track: e.track, onsets: e.begins.size })) });
  });
  wrap(window.OTTSubPlaybackClock.prototype, 'reset', null, function() {
    previousText = ''; previousAt = null; add('clock-reset', {});
  });
  wrap(window.OTTSubNetflixPlaybackAdapter.prototype, 'receiveBridge', function() {
    return { bridge: this.bridge, observation: this.sessionObservation };
  }, function(_, previous, event) {
    adapter = this;
    let data;
    try { if (typeof event.detail === 'string' && event.detail.length <= 16000) data = JSON.parse(event.detail); } catch (_) {}
    const accepted = !!this.bridge && this.bridge !== previous?.bridge;
    const observation = this.sessionObservation !== previous?.observation ? this.sessionObservation : null;
    add('bridge', { status: ['ok', 'unavailable'].includes(data?.status) ? data.status : 'invalid',
      sessions: Array.isArray(data?.sessions) ? data.sessions.length : null,
      videos: Array.isArray(data?.videos) ? data.videos.length : null, accepted,
      pending: !!this.pending, raw: accepted ? number(this.bridge.raw) : null, pairedVideo: accepted ? number(this.bridge.videoTime) : null,
      movieId: /^\d{1,20}$/.test(this.owner?.movieId || '') ? this.owner.movieId : null,
      observation: observation ? { status: observation.status, session: observation.session,
        pairedVideo: number(observation.videoTime), playback: observation.playback,
        open: observation.open, track: observation.track } : null });
  });
  const settingValue = (key, value) => key === 'ottsub_primary_lang' && value === 'auto' ? 'auto' : language(value);
  window.addEventListener('ottsub_track_acquisition',event => {
    const data=event.detail;
    if (/^\d{1,20}$/.test(data?.movieId || '') && language(data?.language)
      && ['metadata-ready','preparing','ready','no-urls','failed'].includes(data?.status)) {
      add('native-acquisition',{movieId:data.movieId,language:language(data.language),status:data.status});
    }
  });
  let selectedSecondary = null;
  chrome.storage.local.get(['ottsub_primary_lang', 'ottsub_secondary_lang', 'ottsub_ui_lang'], settings => {
    selectedSecondary = language(settings.ottsub_secondary_lang);
    add('settings-initial', { primary: settingValue('ottsub_primary_lang', settings.ottsub_primary_lang),
      secondary: language(settings.ottsub_secondary_lang), ui: language(settings.ottsub_ui_lang) });
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    for (const key of ['ottsub_primary_lang', 'ottsub_secondary_lang', 'ottsub_ui_lang']) {
      if (key === 'ottsub_secondary_lang' && changes[key]) selectedSecondary = language(changes[key].newValue);
      if (changes[key]) add('setting', { area, key, value: settingValue(key, changes[key].newValue) });
    }
  });
  const snapshot = () => ({ format: 'ottsub-local-diagnostics-v1', build: manifest.version_name,
    savedAt: new Date().toISOString(), movieId: location.pathname.match(/^\/watch\/(\d+)/)?.[1] || null,
    dropped, state: gate?.state || null, clockSelected: clock?.selected?.source || null,
    bridgeAvailable: !!adapter?.bridge, rows: rows.slice() });
  // Local-only acquisition evidence: no dialogue, labels, raw IDs or URLs.
  let lastTrackSignature = '';
  window.addEventListener('ottsub_manifest_data', event => {
    try {
      const data = typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail;
      if (data?.source !== 'ottsub_injected' || !/^\d{1,20}$/.test(String(data.movieId))) return;
      const entries = Array.isArray(data.availableTracks) ? data.availableTracks.slice(0, 100) : [];
      const row = { movieId: String(data.movieId), current: String(data.movieId) === location.pathname.match(/^\/watch\/(\d+)/)?.[1],
        tracks: entries.map(t => ({ language: language(t?.bcp47 || t?.language), hasUrls: t?.hasUrls === true,
          urlCount: Array.isArray(t?.urls) ? Math.min(t.urls.length, 100) : 0, cc: t?.isCC === true })),
        groups: Object.entries(data.tracksByLang || {}).filter(([key]) => language(key)).slice(0, 100)
          .map(([key, value]) => ({ language: language(key), urlCount: Array.isArray(value) ? Math.min(value.length, 100) : 0 })) };
      const signature = JSON.stringify(row);
      if (signature !== lastTrackSignature) { lastTrackSignature = signature; add('manifest-tracks', row); }
    } catch (_) {}
  });
  const fetchTrack = window.OTTSubTrackFetcher.fetchAndParseTrack;
  window.OTTSubTrackFetcher.fetchAndParseTrack = async function(urls, signal) {
    const candidates = Array.isArray(urls) ? Math.min(urls.length, 100) : 0;
    const started = performance.now();
    try {
      const cues = await fetchTrack.apply(this, arguments);
      add('track-fetch', { candidates, cues: cues.length, aborted: !!signal?.aborted, elapsed: number(performance.now() - started) });
      return cues;
    } catch (error) {
      add('track-fetch', { candidates, cues: 0, aborted: !!signal?.aborted, failed: true });
      throw error;
    }
  };
  // ISOLATED-world access for offline tests only; no page-world export/event endpoint.
  window.__ottsubLocalDiagnostics = { snapshot };
  let acquisitionView, acquisitionCopy;
  window.addEventListener('ottsub_local_acquisition_data', event => {
    try {
      if (!acquisitionView || typeof event.detail !== 'string' || event.detail.length > 60000) return;
      const data = JSON.parse(event.detail);
      const mid = location.pathname.match(/^\/watch\/(\d+)/)?.[1];
      if (data?.source !== 'ottsub_local_acquisition' || data.movieId !== mid) return;
      const family = selectedSecondary?.split('-')[0];
      const trackLines = entries => (Array.isArray(entries) ? entries : [])
        .filter(t => !family || language(t?.language)?.split('-')[0] === family).slice(0, 20)
        .map(t => `${language(t.language)}: 준비=${t.hydrated === true ? '완료' : t.hydrated === false ? '미완료' : '?'} 주소=${Number.isFinite(t.urls) ? t.urls : '?'} 형식=${(t.formats || []).slice(0, 8).join(',')}`)
        .join('\n') || '(이 언어 정보 없음)';
      const requestLines = (data.requests || []).slice(-8).map(r => {
        const before = (r.before?.settings || []).filter(s => typeof s.partial === 'boolean').map(s => s.partial);
        const after = (r.after?.settings || []).filter(s => typeof s.partial === 'boolean').map(s => s.partial);
        return `partial 요청: ${before.join(',') || '?'} → ${after.join(',') || '?'} (회차 ${r.after?.movieId || '?'})`;
      }).join('\n') || '(직렬화 요청을 관찰하지 못함)';
      const methods = (data.player?.methods || []).filter(n => typeof n === 'string' && /manifest|hydr|text|track/i.test(n)).slice(0, 30).join(',') || '(확인된 메서드 없음)';
      const nativeSteps=rows.filter(r=>r.type==='native-acquisition'&&r.movieId===mid).slice(-6).map(r=>`${r.language}: ${r.status}`).join('\n') || '(내부 준비 경로 실행 기록 없음)';
      acquisitionView.textContent = `빌드: ${manifest.version_name}\n회차: ${mid} / 보조: ${selectedSecondary || '?'}\n\n${requestLines}\n\nNetflix 원본 manifest: partial=${data.raw?.partial ?? '?'}\n${trackLines(data.raw?.tracks)}\n\n플레이어 목록 (일치 player ${data.player?.matchingPlayers ?? '?'})\ngetTimedTextTrackList: ${data.player?.legacyStatus || '?'}\n${trackLines(data.player?.tracks)}\n\ngetTextTrackList: ${data.player?.modern?.status || '?'}\n${trackLines(data.player?.modern?.tracks)}\n\nOTTSub 병합 목록\n${trackLines(data.merged)}\n\nNetflix 자막 준비\n${nativeSteps}\n\n플레이어 공개 메서드: ${methods}`;
      if (acquisitionCopy) acquisitionCopy.disabled = acquisitionView.hidden;
    } catch (_) {}
  });
  function mount() {
    if (!document.body || document.getElementById('ottsub-local-diagnostics')) return;
    const host = document.createElement('div'); host.id = 'ottsub-local-diagnostics';
    host.style.cssText = 'position:fixed;top:8px;left:8px;z-index:2147483647';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<style>:host{font:12px sans-serif}div{background:#171717;color:white;padding:8px;border:1px solid #888;border-radius:6px}button{margin:4px;padding:5px;cursor:pointer}small{display:block}pre{user-select:text;white-space:pre-wrap;overflow-wrap:anywhere;overflow:auto;max-height:45vh;max-width:min(650px,85vw);font:12px/1.5 monospace}textarea{user-select:text;width:min(650px,80vw);height:90px}</style><div><b>OTTSub 로컬 진단</b><small></small><button id="save">JSON 저장</button><button id="pause">기록 중단</button><button id="mark">문제 표시</button><button id="inspect">주소 조사</button><button id="copy" disabled>조사 내용 복사</button><span role="status"></span><pre id="acquisition" hidden></pre><textarea id="copy-text" aria-label="조사 내용 수동 복사" readonly hidden></textarea></div>';
    acquisitionView = shadow.getElementById('acquisition');
    acquisitionCopy = shadow.getElementById('copy');
    const copyText = shadow.getElementById('copy-text');
    acquisitionCopy.onclick = async () => {
      if (acquisitionCopy.disabled || acquisitionView.hidden) return;
      const text = acquisitionView.textContent;
      try {
        await navigator.clipboard.writeText(text);
        copyText.hidden = true;
        shadow.querySelector('[role="status"]').textContent = '복사됨';
      } catch (_) {
        copyText.value = text; copyText.hidden = false; copyText.focus(); copyText.select();
        shadow.querySelector('[role="status"]').textContent = '선택된 글을 Ctrl+C로 복사해줘';
      }
    };
    shadow.getElementById('inspect').onclick = () => {
      acquisitionView.hidden = !acquisitionView.hidden;
      acquisitionCopy.disabled = true; copyText.hidden = true;
      if (!acquisitionView.hidden) {
        acquisitionView.textContent = '주소 확보 경로 확인 중…';
        window.dispatchEvent(new CustomEvent('ottsub_local_acquisition_request'));
      }
    };
    shadow.querySelector('small').textContent = manifest.version_name;
    shadow.getElementById('pause').onclick = () => {
      recording = !recording;
      shadow.getElementById('pause').textContent = recording ? '기록 중단' : '기록 재개';
    };
    shadow.getElementById('mark').onclick = () => { add('user-marker', {}); shadow.querySelector('[role="status"]').textContent = '표시됨'; };
    shadow.getElementById('save').onclick = () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url;
      a.download = `ottsub-local-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      shadow.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
      shadow.querySelector('[role="status"]').textContent = '저장 요청됨';
    };
    document.body.append(host);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})();
