/**
 * OTTSub - content.js (Main Orchestrator)
 * ISOLATED-world orchestration of episode ownership, settings and rendering.
 * Coordinates manifest interception, track fetching, hardware key capture, and dual frame rendering.
 * Strictly verifies movieId against current watch URL to prevent cross-episode subtitle contamination.
 */
(() => {
  'use strict';

  if (window.__OTT_SUB_CONTENT_LOADED__) return;
  window.__OTT_SUB_CONTENT_LOADED__ = true;
  const loadedManifest = chrome.runtime.getManifest?.();
  const loadedBuild = loadedManifest?.version_name || loadedManifest?.version || null;

  let currentVideo = null, renderLoopId = null, isVideoCallbackSupported = false, activeMovieId = null;
  let boundVideoAbortController = null;
  let episodeGeneration = 0, renderGeneration = 0, renderVideo = null;
  let primaryRequest = null, secondaryRequest = null;
  const trackRecovery = new window.OTTSubTrackRecovery();

  const secondarySyncEngine = new window.OTTSubSyncEngineClass();
  const dualPlacement = new window.OTTSubDualPlacement();

  let isDualMode = true, secondaryLang = 'ko', availableLangs = [];
  let primaryLang = 'auto', pendingPrimaryLanguage = false;
  let primaryTrackKind = 'auto', secondaryTrackKind = 'auto';
  let primaryResolvedLang = null;
  let uiLang = (window.OTTSubI18n ? window.OTTSubI18n.detectBrowserLanguage() : 'en');
  let isPositionLocked = false, lineSpacing = 4, lineHeight = 1.20;
  let primaryLineSpacing = 4, secondaryLineSpacing = 4, primaryOffsetY = 0, secondaryOffsetY = 0;
  let primaryScale = 1.0, primaryColor = '#ffffff';
  let secondaryScale = 0.78, secondaryColor = '#ffe082';
  let isPrimaryBgBoxEnabled = false, isSecondaryBgBoxEnabled = false, isBgBoxEnabled = false, customPosX = 0, customPosY = 0;

  const VALID_BLUR_TARGETS = Object.freeze(['none', 'secondary', 'primary', 'both']);
  const VALID_BLUR_MODES = Object.freeze(['blur_4', 'blur_8', 'blur_14']);
  let blurTarget = 'none', blurMode = 'blur_8', hoverPause = true;
  let wasPlayingBeforeHover = false, isHoverPaused = false, hoverPauseDebounceTimer = null;

  const playbackGate = new window.OTTSubPlaybackGate();
  const playbackClock = new window.OTTSubPlaybackClock();
  const nativeReference = new window.OTTSubNativeReference(window.OTTSubTrackFetcher.fetchAndParseTrack,
    window.OTTSubNetflixPlaybackAdapter.cueText);
  const clockCueCache = new WeakMap();
  let recoveryBundle = null, nativeTextAvailable = false;
  let nativeLanguage = null;
  let allowNativeDuringRecovery = false;
  let displayBlocked = true, displayGeneration = 0, pageSuspended = false, episodeOwnerMismatch = false;
  let pendingManifest = null, pendingPrimary = null, pendingSecondary = null, pendingLanguage = false;
  const playbackAdapter = new window.OTTSubNetflixPlaybackAdapter(onPlaybackSample);

  function invalidatePlaybackClock(seek = false) {
    if (seek) playbackClock.beginSeek(performance.now());
    else playbackClock.reset();
    playbackAdapter.invalidateClock();
    playbackGate.invalidateClock();
    window.OTTSubSyncEngine.resetCursor();
    secondarySyncEngine.resetCursor();
    if (!canDisplay()) blockDisplay();
  }

  function clockTracks() {
    const tracks = [];
    const add = (key, cues) => {
      if (!cues?.length) return;
      if (!clockCueCache.has(cues)) clockCueCache.set(cues, cues.map(cue => ({ ...cue,
        plainText: window.OTTSubNetflixPlaybackAdapter.cueText(cue.text) })));
      tracks.push({ key, cues: clockCueCache.get(cues) });
    };
    add('primary', window.OTTSubSyncEngine.cues);
    add('secondary', secondarySyncEngine.cues);
    if (!tracks.length) {
      if (pendingPrimary && isCurrentRequest(pendingPrimary.request, pendingPrimary.mid)) add('pending-primary', pendingPrimary.cues);
      if (pendingSecondary && isCurrentRequest(pendingSecondary.request, pendingSecondary.mid)) add('pending-secondary', pendingSecondary.cues);
      if (!tracks.length && recoveryBundle?.generation === episodeGeneration) {
        add('bundle-primary', recoveryBundle.primary);
        add('bundle-secondary', recoveryBundle.secondary);
      }
    }
    return tracks;
  }

  async function prepareRecoveryBundle(now) {
    // Only fetch untrusted, bounded candidates after stable ad absence, when no
    // pre-ad cue set exists. Nothing enters a renderer before clock validation.
    if (!playbackGate.requiresClock || !playbackGate.stableAbsence(now) || !pendingManifest) return;
    const payload = pendingManifest;
    const key = JSON.stringify([payload.movieId, payload.urls, payload.tracksByLang, payload.availableTracks, primaryLang, secondaryLang, primaryTrackKind, secondaryTrackKind]);
    if (recoveryBundle && recoveryBundle.key !== key) {
      recoveryBundle.controller.abort(); recoveryBundle = null; playbackClock.reset();
    }
    if (clockTracks().length) return;
    if (recoveryBundle?.key === key) return;
    recoveryBundle?.controller.abort();
    const bundle = { key, payload, primaryLang, primaryTrackKind, secondaryTrackKind, primaryResolvedLang: resolvePrimaryLanguage(payload, primaryCandidateUrls(payload)), lang: secondaryLang, generation: episodeGeneration, controller: new AbortController(), primary: [], secondary: [], ready: false };
    recoveryBundle = bundle;
    const urls = value => Array.isArray(value) ? value.slice(0, 4) : [];
    const [primary, secondary] = await Promise.all([
      window.OTTSubTrackFetcher.fetchAndParseTrack(urls(primaryCandidateUrls(payload)), bundle.controller.signal),
      window.OTTSubTrackFetcher.fetchAndParseTrack(urls(window.OTTSubTrackLanguages.urls(payload, secondaryLang, secondaryTrackKind)), bundle.controller.signal)
    ]);
    if (recoveryBundle !== bundle || bundle.controller.signal.aborted || bundle.generation !== episodeGeneration || String(payload.movieId) !== getCurrentMovieId()) return;
    bundle.primary = primary; bundle.secondary = secondary; bundle.ready = true;
  }

  function commitRecovery(selected) {
    const needsSessionBundle = selected.verification === 'session-progress'
      && !window.OTTSubSyncEngine.cues.length && !secondarySyncEngine.cues.length
      && !(pendingPrimary?.cues.length && isCurrentRequest(pendingPrimary.request, pendingPrimary.mid))
      && !(pendingSecondary?.cues.length && isCurrentRequest(pendingSecondary.request, pendingSecondary.mid));
    if (needsSessionBundle || selected.track?.startsWith('bundle-') || selected.track?.startsWith('native:')
      && recoveryBundle && nativeReference.payload === recoveryBundle.payload) {
      const bundle = recoveryBundle;
      if (!bundle || bundle.generation !== episodeGeneration || String(bundle.payload.movieId) !== activeMovieId) return false;
      if (!bundle.ready || (!bundle.primary.length && !bundle.secondary.length)) return false;
      // Both languages must belong to this episode's staged manifest. The OFF
      // route proves session time separately; it cannot skip download readiness.
      if (bundle.primary.length && bundle.primaryLang === primaryLang && bundle.primaryTrackKind === primaryTrackKind) {
        window.OTTSubSyncEngine.setCues(activeMovieId, bundle.primary);
        primaryResolvedLang = bundle.primaryResolvedLang;
      }
      if (bundle.secondary.length && bundle.lang === secondaryLang && bundle.secondaryTrackKind === secondaryTrackKind) secondarySyncEngine.setCues(activeMovieId, bundle.secondary);
      manifestCache.set(activeMovieId, bundle.payload);
      availableLangs = Array.isArray(bundle.payload.availableTracks) ? bundle.payload.availableTracks : [];
    }
    // A verified pre-ad track does not validate an arbitrary manifest seen in ads.
    pendingManifest = null;
    recoveryBundle?.controller.abort(); recoveryBundle = null;
    window.OTTSubSyncEngine.resetCursor(); secondarySyncEngine.resetCursor();
    dualPlacement.reset();
    return true;
  }

  function canDisplay() {
    return !pageSuspended && !document.hidden && !episodeOwnerMismatch && currentVideo === playbackGate.video
      && !playbackGate.status(performance.now()).displaySuppressed;
  }

  function setHoverPauseEnabled(enabled) {
    hoverPause = !!enabled;
    window.OTTSubRenderer?.setHoverPause(hoverPause);
    if (hoverPause) return;
    if (hoverPauseDebounceTimer) clearTimeout(hoverPauseDebounceTimer);
    hoverPauseDebounceTimer = null;
    const video = currentVideo;
    const shouldResume = isHoverPaused && wasPlayingBeforeHover && video && !displayBlocked && canDisplay();
    isHoverPaused = wasPlayingBeforeHover = false;
    // Release only our own pause on the current displayable video.
    if (shouldResume) {
      try { const promise = video.play(); if (promise?.catch) promise.catch(() => {}); }
      catch (_) {}
    }
  }

  function blockDisplay() {
    // clear() emits an unmount hover callback. Revoke pause ownership first.
    displayGeneration++;
    displayBlocked = true;
    if (hoverPauseDebounceTimer) clearTimeout(hoverPauseDebounceTimer);
    hoverPauseDebounceTimer = null;
    isHoverPaused = wasPlayingBeforeHover = false;
    stopRenderLoop();
    window.OTTSubRenderer?.clear();
    document.body?.classList.remove('ottsub-active');
    updateRecoveryNativeVisibility();
    dualPlacement.reset();
  }

  function updateRecoveryNativeVisibility() {
    const status = playbackGate.status(performance.now());
    const primary = primaryResolvedLang || (primaryLang !== 'auto' ? primaryLang : null);
    const native = nativeLanguage;
    const matches = window.OTTSubTrackLanguages.compatible;
    const different = native && primary && !matches(primary, native) && (!isDualMode || !matches(secondaryLang, native));
    const hold = !pageSuspended && !document.hidden && activeMovieId && currentVideo
      && currentVideo === playbackGate.video && status.suppressionReason === 'clock-unverified'
      && ['RECOVERING', 'RECOVERY_DELAYED'].includes(status.playbackState) && different && !allowNativeDuringRecovery
      && window.OTTSubSyncEngine.hasCues();
    if (hold) document.body?.classList.add('ottsub-recovery-native-hidden');
    else document.body?.classList.remove('ottsub-recovery-native-hidden');
  }

  function protectTrackData() {
    return episodeOwnerMismatch || playbackGate.requiresClock || playbackGate.pauseAd || document.hidden;
  }

  function flushPendingTracks() {
    if (protectTrackData()) return;
    const primary = pendingPrimary, secondary = pendingSecondary, manifest = pendingManifest;
    pendingPrimary = pendingSecondary = pendingManifest = null;
    if (primary && primaryRequest === primary.request && isCurrentRequest(primary.request, primary.mid)) {
      window.OTTSubSyncEngine.setCues(primary.mid, primary.cues);
      primaryResolvedLang = primary.request.resolvedLanguage;
    }
    if (secondary && secondaryRequest === secondary.request && isCurrentRequest(secondary.request, secondary.mid)
      && secondary.request.lang === secondaryLang.toLowerCase()) secondarySyncEngine.setCues(secondary.mid, secondary.cues);
    if (manifest) handleManifestPayload(manifest);
    if (pendingLanguage) { pendingLanguage = false; loadSecondaryTrack(secondaryLang); }
    if (pendingPrimaryLanguage) { pendingPrimaryLanguage = false; loadSelectedPrimaryTrack(); }
  }

  function onPlaybackSample(sample, now) {
    if (synchronizeEpisode()) { runSelfHealingWatchdog(); return; }
    if (!activeMovieId || document.hidden) return;
    episodeOwnerMismatch = sample.episodeMismatch === true;
    if (episodeOwnerMismatch) {
      invalidatePlaybackClock(); blockDisplay(); return;
    }
    if (sample.video !== playbackGate.video && playbackGate.observed) invalidatePlaybackClock();
    playbackGate.observe(sample, now);
    nativeLanguage = sample.nativeTrack?.status === 'selected' ? sample.nativeTrack.language : null;
    nativeTextAvailable = !!sample.nativeText?.trim();
    if (sample.adSignal !== 'absent' || sample.pauseAd) {
      playbackClock.suspendForAd(sample, now);
      // Continue collecting the current session during ads. Clearing the adapter
      // here would discard the progress needed to observe the end of a session ad.
      if (sample.adSignal === 'present') { recoveryBundle?.controller.abort(); recoveryBundle = null; }
    } else {
      prepareRecoveryBundle(now);
      const reference = nativeReference.update(sample.nativeTrack,
        manifestCache.get(activeMovieId) || recoveryBundle?.payload, activeMovieId, episodeGeneration);
      sample.nativeVerification = nativeReference.status;
      playbackClock.setTracks(reference === null ? clockTracks() : reference, sample, now);
      const wasVerified = playbackGate.clockVerified;
      const selected = playbackClock.observe({ ...sample, allowCalibration: playbackGate.requiresClock }, now);
      if (wasVerified && !selected) playbackGate.invalidateClock();
      if (playbackGate.requiresClock && selected && playbackGate.stableAbsence(now, selected.verification) && commitRecovery(selected)) {
        playbackGate.confirmClock(selected.source, now, selected.verification);
      } else if (wasVerified && selected && playbackGate.clockSource !== selected.source && playbackGate.stableAbsence(now)) {
        // A separately verified clock handoff keeps rendering active; report
        // the new source without reloading tracks or entering recovery again.
        playbackGate.confirmClock(selected.source, now);
      }
    }
    const wasBlocked = displayBlocked;
    const showRecoveryNotice = playbackGate.status(now).playbackState === 'RECOVERY_DELAYED'
      && !allowNativeDuringRecovery;
    window.OTTSubHUD?.setRecoveryNotice?.(showRecoveryNotice ? window.OTTSubI18n.t('recovery_hud', {}, uiLang) : null,
      window.OTTSubI18n.t('show_native', {}, uiLang), () => {
        allowNativeDuringRecovery = true;
        updateRecoveryNativeVisibility();
        window.OTTSubHUD?.setRecoveryNotice?.(null);
      }, uiLang);
    if (sample.video !== currentVideo) {
      // Block before destroying the old renderer, including its hover callback.
      blockDisplay();
      if (sample.video) attachVideo(sample.video);
      else detachVideo();
    }
    if (!canDisplay()) {
      if (!displayBlocked || document.body?.classList.contains('ottsub-active')) blockDisplay();
      updateRecoveryNativeVisibility();
      return;
    }
    document.body?.classList.remove('ottsub-recovery-native-hidden');
    displayBlocked = false;
    flushPendingTracks();
    if (wasBlocked || renderLoopId === null) {
      triggerManualRender();
      if (currentVideo && !currentVideo.paused) startRenderLoop();
    }
  }

  function showLocalizedHUD(key, params = {}, fallback = '') {
    if (window.OTTSubI18n && typeof window.OTTSubI18n.t === 'function') {
      window.OTTSubHUD.show(window.OTTSubI18n.t(key, params, uiLang), 1500, uiLang);
    } else {
      window.OTTSubHUD.show(fallback);
    }
  }

  function showSyncHUD(offset, secondary = false) {
    const key = secondary ? 'hud_sync_prefix_secondary' : 'hud_sync_prefix_primary';
    const prefix = window.OTTSubI18n?.t(key, {}, uiLang) || (secondary ? '보조언어 싱크' : '주언어 싱크');
    window.OTTSubHUD.show(`${prefix}: ${(offset / 1000).toFixed(1)}s`, 1500, uiLang);
  }

  const manifestCache = new window.OTTSubStorageGuard.LRUCache(5);

  function isExtensionContextValid() { return !!(chrome?.runtime && chrome.runtime.id); }
  function secureJsonParse(str, fallback = null) {
    return window.OTTSubStorageGuard.secureJsonParse(str, fallback);
  }
  function validateStorageSchema(data) { return window.OTTSubStorageGuard.validateStorageSchema(data); }
  function flushStorageSave() {
    window.OTTSubStorageGuard.flushStorageSave();
  }
  function queueStorageSave(key, value) {
    window.OTTSubStorageGuard.queueStorageSave(key, value);
  }

  function getDeepActiveElement(root = document) {
    let active = root.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active;
  }

  function isEditableElement(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') return true;
    if (el.closest?.('[data-uia*="search"]') || el.closest?.('.searchBox')) return true;
    return false;
  }

  function getCurrentMovieId() {
    const m = window.location.pathname.match(/\/watch\/(\d+)/);
    return m ? m[1] : null;
  }

  function resetEpisodeLifecycle() {
    episodeOwnerMismatch = false;
    trackRecovery.clear();
    allowNativeDuringRecovery = false;
    window.OTTSubHUD?.setRecoveryNotice?.(null);
    nativeLanguage = null;
    primaryResolvedLang = null;
    episodeGeneration++;
    playbackAdapter.stop();
    playbackGate.reset(null);
    playbackClock.reset();
    playbackClock.setTracks([]);
    nativeReference.reset();
    recoveryBundle?.controller.abort(); recoveryBundle = null;
    blockDisplay();
    pendingManifest = pendingPrimary = pendingSecondary = null;
    pendingLanguage = false;
    pendingPrimaryLanguage = false;
    primaryRequest?.controller.abort();
    secondaryRequest?.controller.abort();
    primaryRequest = secondaryRequest = null;
    detachVideo();
    window.OTTSubSyncEngine.clear();
    secondarySyncEngine.clear();
    availableLangs = [];
    dualPlacement.reset();
  }

  function detachVideo() {
    stopRenderLoop();
    boundVideoAbortController?.abort();
    boundVideoAbortController = null;
    currentVideo = null;
    isHoverPaused = false;
    wasPlayingBeforeHover = false;
    if (hoverPauseDebounceTimer) { clearTimeout(hoverPauseDebounceTimer); hoverPauseDebounceTimer = null; }
    window.OTTSubRenderer?.destroy();
    window.OTTSubHUD?.destroy();
  }

  function synchronizeEpisode() {
    if (pageSuspended) return false;
    const mid = getCurrentMovieId();
    if (mid === activeMovieId) return false;
    resetEpisodeLifecycle();
    activeMovieId = mid;
    playbackGate.reset(mid);
    playbackAdapter.setOwner(mid, episodeGeneration);
    if (mid) {
      playbackGate.observe({ ...window.OTTSubNetflixPlaybackAdapter.read(), hidden: document.hidden }, performance.now());
      const cached = manifestCache.get(mid) || readAndFreeManifestDataset(mid);
      if (cached) handleManifestPayload(cached);
      else window.dispatchEvent(new CustomEvent('ottsub_request_manifest', { detail: { movieId: mid } }));
    }
    return true;
  }

  function runSelfHealingWatchdog() {
    if (pageSuspended) return;
    synchronizeEpisode();
    if (!activeMovieId || document.hidden) { playbackAdapter.stop(); return; }
    discoverMissingTrackUrls(performance.now());
    recoverRejectedTrack(primaryRequest);
    recoverRejectedTrack(secondaryRequest);
    if (playbackAdapter.running) playbackAdapter.sampleNow();
    else playbackAdapter.start();
    if (currentVideo && canDisplay() && window.OTTSubRenderer &&
      (!window.OTTSubRenderer.container || !window.OTTSubRenderer.container.isConnected)) {
      window.OTTSubRenderer.ensureMounted(currentVideo);
      triggerManualRender();
    }
  }

  function triggerManualRender() {
    if (synchronizeEpisode()) { runSelfHealingWatchdog(); return; }
    if (!currentVideo || !window.OTTSubRenderer) return;
    renderFrameAtTime(currentVideo.currentTime);
  }

  function renderFrameAtTime(mediaTime) {
    if (synchronizeEpisode()) { runSelfHealingWatchdog(); return; }
    if (!currentVideo || !window.OTTSubRenderer) return;
    if (!canDisplay()) { if (!displayBlocked) blockDisplay(); return; }
    if (playbackGate.clockVerified) {
      const baseTime = playbackClock.baseTime(mediaTime, performance.now());
      if (!Number.isFinite(baseTime)) { invalidatePlaybackClock(); return; }
      mediaTime = baseTime;
    }
    if (!window.OTTSubSyncEngine.getCueCount() && !secondarySyncEngine.getCueCount()) {
      window.OTTSubRenderer.clear();
      document.body?.classList.remove('ottsub-active');
      return;
    }

    const activePri = window.OTTSubSyncEngine
      ? (window.OTTSubSyncEngine.getActiveCuesFast ? window.OTTSubSyncEngine.getActiveCuesFast(mediaTime) : window.OTTSubSyncEngine.getActiveCues(mediaTime))
      : { top: [], bottom: [] };

    const activeSec = secondarySyncEngine.getActiveCuesFast
      ? secondarySyncEngine.getActiveCuesFast(mediaTime)
      : secondarySyncEngine.getActiveCues(mediaTime);

    const placed = dualPlacement.resolve(activePri, activeSec, {
      mediaTime, isDualMode,
      primaryOffset: window.OTTSubSyncEngine.offsetMs,
      secondaryOffset: secondarySyncEngine.offsetMs
    });

    window.OTTSubRenderer.renderDual(
      placed.primary,
      placed.secondary,
      {
        isDualMode,
        offsetMs: (window.OTTSubSyncEngine ? window.OTTSubSyncEngine.offsetMs : 0)
      }
    );
  }

  function startRenderLoop() {
    stopRenderLoop();
    const video = currentVideo;
    if (!video || video.paused || video.ended || video.playbackRate === 0 || !canDisplay()) return;
    const generation = renderGeneration;
    renderVideo = video;
    isVideoCallbackSupported = typeof video.requestVideoFrameCallback === 'function';
    const schedule = callback => isVideoCallbackSupported
      ? video.requestVideoFrameCallback(callback) : requestAnimationFrame(callback);
    const onFrame = (now, metadata) => {
      if (generation !== renderGeneration || video !== currentVideo) return;
      renderLoopId = null;
      if (video.paused || video.ended || video.playbackRate === 0 || document.hidden) return;
      renderFrameAtTime(metadata?.mediaTime ?? video.currentTime);
      if (generation === renderGeneration && video === currentVideo) renderLoopId = schedule(onFrame);
    };
    renderLoopId = schedule(onFrame);
  }

  function stopRenderLoop() {
    renderGeneration++;
    if (renderLoopId !== null) {
      if (isVideoCallbackSupported && renderVideo && typeof renderVideo.cancelVideoFrameCallback === 'function') {
        renderVideo.cancelVideoFrameCallback(renderLoopId);
      } else {
        cancelAnimationFrame(renderLoopId);
      }
      renderLoopId = null;
    }
    renderVideo = null;
  }

  function attachVideo(video) {
    if (!video) return;
    detachVideo();
    currentVideo = video;
    boundVideoAbortController = new AbortController();
    const { signal } = boundVideoAbortController;

    if (window.OTTSubRenderer) {
      window.OTTSubRenderer.ensureMounted(video);
      window.OTTSubRenderer.onSubtitleHoverChange = (isHovered, lineType) => {
        if (!hoverPause || !currentVideo || displayBlocked || !canDisplay()) return;
        const generation = displayGeneration;
        if (hoverPauseDebounceTimer) { clearTimeout(hoverPauseDebounceTimer); hoverPauseDebounceTimer = null; }
        hoverPauseDebounceTimer = setTimeout(() => {
          hoverPauseDebounceTimer = null;
          if (!hoverPause || generation !== displayGeneration || displayBlocked || !canDisplay() || currentVideo !== video) return;
          if (isHovered) {
            if (!currentVideo.paused && !isHoverPaused) {
              wasPlayingBeforeHover = true;
              isHoverPaused = true;
              try { currentVideo.pause(); } catch (_) {}
            }
          } else {
            if (isHoverPaused && wasPlayingBeforeHover) {
              isHoverPaused = false;
              wasPlayingBeforeHover = false;
              try {
                const playPromise = currentVideo.play();
                if (playPromise && typeof playPromise.then === 'function') playPromise.catch(() => {});
              } catch (_) {}
            } else {
              isHoverPaused = false;
              wasPlayingBeforeHover = false;
            }
          }
        }, 80);
      };
    }

    const videoEvents = {
      play: () => { isHoverPaused = false; startRenderLoop(); },
      playing: () => startRenderLoop(),
      pause: () => { stopRenderLoop(); triggerManualRender(); },
      seeking: () => { isHoverPaused = false; invalidatePlaybackClock(true); dualPlacement.reset(); },
      seeked: () => { dualPlacement.reset(); triggerManualRender(); },
      timeupdate: () => { if (renderLoopId === null) triggerManualRender(); },
      // Buffering is not a timeline change. Recheck real readiness, session
      // freshness and ad signals without erasing the already verified exit.
      // The clock still revokes on missing frames, stale/frozen APIs or jumps.
      waiting: () => { stopRenderLoop(); playbackAdapter.sampleNow(); },
      // A network stall can occur while buffered frames continue playing.
      stalled: () => { playbackAdapter.sampleNow(); },
      emptied: () => invalidatePlaybackClock(),
      ended: () => { stopRenderLoop(); if (window.OTTSubRenderer) window.OTTSubRenderer.clear(); },
      enterpictureinpicture: () => { showLocalizedHUD('hud_pip_active', {}, 'PiP 모드 활성화'); },
      leavepictureinpicture: () => { dualPlacement.reset(); triggerManualRender(); }
    };

    for (const [ev, handler] of Object.entries(videoEvents)) {
      video.addEventListener(ev, handler, { signal, passive: true });
    }

    if (!video.paused && video.playbackRate > 0) startRenderLoop();
    else triggerManualRender();
  }

  function onGlobalVideoTransition(event) {
    if (event && ['loadedmetadata', 'ratechange'].includes(event.type)) invalidatePlaybackClock();
    runSelfHealingWatchdog();
    const v = currentVideo;
    if (v && (v.playbackRate === 0 || v.paused)) stopRenderLoop();
    else if (v) startRenderLoop();
  }

  document.addEventListener('ratechange', onGlobalVideoTransition, true);
  document.addEventListener('play', onGlobalVideoTransition, true);
  document.addEventListener('playing', onGlobalVideoTransition, true);
  document.addEventListener('loadedmetadata', onGlobalVideoTransition, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      invalidatePlaybackClock();
      playbackAdapter.stop();
      playbackGate.observe({ video: currentVideo, hidden: true }, performance.now());
      blockDisplay();
    }
    else {
      runSelfHealingWatchdog();
      dualPlacement.reset();
      if (currentVideo && !currentVideo.paused && currentVideo.playbackRate > 0) startRenderLoop();
    }
  });

  window.addEventListener('pagehide', flushStorageSave);
  window.addEventListener('beforeunload', flushStorageSave);

  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.altKey && event.shiftKey) return;
    const isInputNode = (el) => isEditableElement(el);
    if (isInputNode(getDeepActiveElement())) return;

    const code = event.code;
    if (event.repeat && (code === 'KeyD' || code === 'KeyL' || code === 'KeyR' || code === 'Backslash')) return;
    if (event.repeat && code === 'KeyB') return;

    if (window.OTTSubKeyboardRouter && typeof window.OTTSubKeyboardRouter.handleKeyDown === 'function') {
      window.OTTSubKeyboardRouter.handleKeyDown(event);
    }
  }, true);

  if (window.OTTSubKeyboardRouter && typeof window.OTTSubKeyboardRouter.registerActionHandler === 'function') {
    window.OTTSubKeyboardRouter.registerActionHandler((action, delta) => {
      if (action === 'adjust_primary_sync') {
        const offset = window.OTTSubSyncEngine ? window.OTTSubSyncEngine.adjustOffset(delta) : 0;
        queueStorageSave('ottsub_offset', offset);
        showSyncHUD(offset);
      } else if (action === 'adjust_secondary_sync') {
        const offset = secondarySyncEngine.adjustOffset(delta);
        queueStorageSave('ottsub_secondary_offset', offset);
        showSyncHUD(offset, true);
      } else if (action === 'reset_primary_sync') {
        const offset = window.OTTSubSyncEngine ? window.OTTSubSyncEngine.resetOffset() : 0;
        queueStorageSave('ottsub_offset', offset);
        showSyncHUD(offset);
      } else if (action === 'reset_secondary_sync') {
        const offset = secondarySyncEngine.resetOffset();
        queueStorageSave('ottsub_secondary_offset', offset);
        showSyncHUD(offset, true);
      } else if (action === 'toggle_dual') {
        isDualMode = !isDualMode;
        queueStorageSave('ottsub_dual_mode', isDualMode);
        showLocalizedHUD(isDualMode ? 'hud_dual_on' : 'hud_dual_off', {}, isDualMode ? '이중 자막 ON' : '이중 자막 OFF');
      } else if (action === 'toggle_blur') {
        blurTarget = (blurTarget === 'none' ? 'secondary' : 'none');
        queueStorageSave('ottsub_blur_target', blurTarget);
        if (window.OTTSubRenderer) window.OTTSubRenderer.setBlurTarget(blurTarget);
        showLocalizedHUD(blurTarget !== 'none' ? 'hud_blur_on' : 'hud_blur_off', { mode: window.OTTSubI18n?.t(`blur_mode_${blurMode}`, {}, uiLang) || blurMode }, blurTarget !== 'none' ? '가림 활성화' : '가림 해제');
      } else if (action === 'toggle_lock_pos') {
        isPositionLocked = !isPositionLocked;
        queueStorageSave('ottsub_lock_pos', isPositionLocked);
        if (window.OTTSubRenderer) window.OTTSubRenderer.setLockPosition(isPositionLocked);
        showLocalizedHUD(isPositionLocked ? 'hud_lock_pos_on' : 'hud_lock_pos_off', {}, isPositionLocked ? '위치 잠금' : '위치 잠금 해제');
      } else if (action === 'reset_pos') {
        if (window.OTTSubRenderer) window.OTTSubRenderer.resetCustomPosition(true);
        queueStorageSave('ottsub_custom_pos_x', 0);
        queueStorageSave('ottsub_custom_pos_y', 0);
        showLocalizedHUD('hud_pos_reset', {}, '자막 위치 기본값 초기화');
      }
      triggerManualRender();
    });
  }

  function automaticPrimaryTrack(manifest) {
    const policy = window.OTTSubTrackLanguages;
    const tracks = Array.isArray(manifest?.availableTracks) ? manifest.availableTracks : [];
    return policy.pick(tracks, 'en', undefined, primaryTrackKind)
      || tracks.find(track => policy.code(track?.bcp47 || track?.language)
        && (primaryTrackKind === 'auto' || policy.trackKind(track) === primaryTrackKind));
  }

  function setTrackKind(side, kind) {
    if (!window.OTTSubTrackLanguages.validKind(kind)) return;
    if (side === 'primary') {
      if (primaryTrackKind === kind) return;
      primaryTrackKind = kind;
      primaryRequest?.controller.abort(); primaryRequest = null; pendingPrimary = null;
      primaryResolvedLang = null;
      window.OTTSubSyncEngine.clear();
    } else {
      if (secondaryTrackKind === kind) return;
      secondaryTrackKind = kind;
      secondaryRequest?.controller.abort(); secondaryRequest = null; pendingSecondary = null;
      secondarySyncEngine.clear();
    }
    recoveryBundle?.controller.abort(); recoveryBundle = null;
    if (side === 'primary') loadSelectedPrimaryTrack();
    else loadSecondaryTrack(secondaryLang);
    triggerManualRender();
  }

  function primaryCandidateUrls(manifest) {
    if (primaryLang === 'auto' && primaryTrackKind === 'auto') return Array.isArray(manifest?.urls) ? manifest.urls : [];
    const language = primaryLang === 'auto' ? automaticPrimaryTrack(manifest)?.bcp47 : primaryLang;
    return window.OTTSubTrackLanguages.urls(manifest, language, primaryTrackKind);
  }

  function resolvePrimaryLanguage(manifest, urls) {
    if (!urls.length) return null;
    const tracks = Array.isArray(manifest?.availableTracks) ? manifest.availableTracks : [];
    const languages = new Set();
    for (const url of urls) {
      const matches = tracks.filter(track => {
        const code = String(track?.bcp47 || track?.language || '').toLowerCase();
        const grouped = manifest.tracksByLang?.[code];
        return /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(code)
          && (Array.isArray(track.urls) && track.urls.includes(url) || Array.isArray(grouped) && grouped.includes(url));
      });
      if (!matches.length) return null;
      for (const track of matches) languages.add(String(track.bcp47 || track.language).toLowerCase());
    }
    if (languages.size === 1) return [...languages][0];
    const bases = new Set([...languages].map(code => code.split('-')[0]));
    return bases.size === 1 ? [...bases][0] : null;
  }

  function setPrimaryLanguage(lang) {
    if (lang === primaryLang) return;
    primaryLang = lang;
    primaryResolvedLang = null;
    primaryRequest?.controller.abort(); primaryRequest = null; pendingPrimary = null;
    recoveryBundle?.controller.abort(); recoveryBundle = null;
    window.OTTSubSyncEngine.clear();
    loadSelectedPrimaryTrack();
    triggerManualRender();
  }

  function loadSelectedPrimaryTrack(mid = activeMovieId, manifest = null) {
    if (!mid || mid !== activeMovieId || mid !== getCurrentMovieId()) return;
    if (protectTrackData()) { pendingPrimaryLanguage = true; return; }
    manifest = manifest || manifestCache.get(mid);
    if (manifest) {
      const urls = primaryCandidateUrls(manifest);
      loadPrimaryTrack(urls, mid, resolvePrimaryLanguage(manifest, urls), primaryLang === 'auto' ? automaticPrimaryTrack(manifest)?.bcp47 : primaryLang);
    }
  }

  async function loadPrimaryTrack(candidateUrls, mid, resolvedLanguage, requestedLanguage = primaryLang) {
    if (mid !== activeMovieId || mid !== getCurrentMovieId()) return;
    const recoveryKey = trackRecovery.key(episodeGeneration, 'primary', primaryLang, primaryTrackKind);
    const freshUrls = trackRecovery.freshUrls(recoveryKey, candidateUrls);
    if (candidateUrls.length && !freshUrls.length) return;
    candidateUrls = freshUrls;
    const key = JSON.stringify([mid, primaryLang, primaryTrackKind, candidateUrls, resolvedLanguage]);
    if (primaryRequest?.key === key) return;
    dualPlacement.reset();
    primaryRequest?.controller.abort();
    const request = { key, lang: primaryLang === 'auto' && primaryTrackKind !== 'auto' ? requestedLanguage : primaryLang, kind: primaryTrackKind, resolvedLanguage, recoveryKey, recoveryLanguage: requestedLanguage, generation: episodeGeneration, controller: new AbortController() };
    primaryRequest = request;
    if (!candidateUrls.length) {
      request.needsUrls = true;
      if (request.lang && request.lang !== 'auto') requestMissingTrackUrls(request, mid);
      return;
    }
    const result = await window.OTTSubTrackFetcher.fetchTrackResult(candidateUrls, request.controller.signal);
    const cues = result.cues;
    if (primaryRequest !== request || !isCurrentRequest(request, mid)) return;
    if (cues.length) {
      if (protectTrackData()) pendingPrimary = { mid, cues, request };
      else {
        window.OTTSubSyncEngine.setCues(mid, cues);
        primaryResolvedLang = request.resolvedLanguage;
      }
    }
    else if (result.status === 'addresses-rejected') {
      request.rejectedUrls = result.rejectedUrls;
      request.refreshNeeded = true;
      recoverRejectedTrack(request);
    } else primaryRequest = null; // A later manifest can retry other failed downloads.
    triggerManualRender();
  }

  function isCurrentRequest(request, mid) {
    return !request.controller.signal.aborted && request.generation === episodeGeneration
      && mid === activeMovieId && mid === getCurrentMovieId();
  }

  function requestMissingTrackUrls(request, mid) {
    // Read-only player metadata can become available after the first manifest.
    // Bound discovery to three later reads; do not retry network downloads.
    request.discoveryRemaining = 3;
    request.discoveryAt = performance.now() + 1500;
    window.dispatchEvent(new CustomEvent('ottsub_request_load_track', {
      detail: { lang: request.lang, kind: request.kind, movieId: mid }
    }));
  }

  function recoverRejectedTrack(request) {
    if (!request?.refreshNeeded || protectTrackData() || !isCurrentRequest(request, activeMovieId)
      || request !== primaryRequest && request !== secondaryRequest) return;
    const language = window.OTTSubTrackLanguages.code(request.recoveryLanguage);
    if (!language) { request.refreshNeeded = false; return; }
    request.refreshNeeded = false;
    // Register before dispatch: MAIN-world metadata can synchronously re-enter.
    if (!trackRecovery.refresh(request.recoveryKey, request.rejectedUrls, () => {
      window.dispatchEvent(new CustomEvent('ottsub_request_load_track', {
        detail: { movieId: activeMovieId, lang: language, kind: request.kind }
      }));
    })) {
      trackRecovery.reject(request.recoveryKey, request.rejectedUrls);
      request.refreshNeeded = trackRecovery.pending(request.recoveryKey, request.rejectedUrls);
    }
  }

  function discoverMissingTrackUrls(now) {
    if (protectTrackData()) return;
    for (const request of [primaryRequest, secondaryRequest]) {
      if (!request?.needsUrls || request.lang === 'auto' || !request.discoveryRemaining
        || now < request.discoveryAt || !isCurrentRequest(request, activeMovieId)) continue;
      request.discoveryRemaining--;
      request.discoveryAt = now + (4 - request.discoveryRemaining) * 1500;
      window.dispatchEvent(new CustomEvent('ottsub_request_load_track', {
        detail: { lang: request.lang, kind: request.kind, movieId: activeMovieId }
      }));
    }
  }

  async function loadSecondaryTrack(targetLang, forcedMid = null, forcedManifest = null) {
    const mid = forcedMid || getCurrentMovieId() || activeMovieId;
    if (!mid || mid !== activeMovieId || mid !== getCurrentMovieId()) return;
    if (protectTrackData()) { pendingLanguage = true; return; }
    const manifest = forcedManifest || manifestCache.get(mid);
    if (!manifest) return;

    const tLang = (targetLang || secondaryLang || 'ko').toLowerCase();
    const recoveryKey = trackRecovery.key(episodeGeneration, 'secondary', tLang, secondaryTrackKind);
    const providedUrls = window.OTTSubTrackLanguages.urls(manifest, tLang, secondaryTrackKind);
    const candidateUrls = trackRecovery.freshUrls(recoveryKey, providedUrls);
    if (providedUrls.length && !candidateUrls.length) return;
    const key = JSON.stringify([mid, tLang, secondaryTrackKind, candidateUrls]);
    if (secondaryRequest?.key === key) return;
    dualPlacement.reset();
    secondaryRequest?.controller.abort();
    if (secondaryRequest?.lang !== tLang || secondaryRequest?.kind !== secondaryTrackKind) secondarySyncEngine.clear();
    const request = { key, lang: tLang, kind: secondaryTrackKind, recoveryKey, recoveryLanguage: tLang, generation: episodeGeneration, controller: new AbortController() };
    secondaryRequest = request;

    if (candidateUrls.length === 0) {
      request.needsUrls = true;
      secondarySyncEngine.clear();
      requestMissingTrackUrls(request, mid);
      triggerManualRender();
      return;
    }

    const result = await window.OTTSubTrackFetcher.fetchTrackResult(candidateUrls, request.controller.signal);
    const cues = result.cues;
    if (secondaryRequest !== request || !isCurrentRequest(request, mid)) return;
    if (cues.length) {
      if (protectTrackData()) pendingSecondary = { mid, cues, request };
      else secondarySyncEngine.setCues(mid, cues);
    }
    else if (result.status === 'addresses-rejected') {
      request.rejectedUrls = result.rejectedUrls;
      request.refreshNeeded = true;
      recoverRejectedTrack(request);
    } else secondaryRequest = null;
    triggerManualRender();
  }

  function readAndFreeManifestDataset(mid) {
    const dataKey = 'ottsubManifest_' + mid;
    const raw = document.documentElement?.dataset?.[dataKey];
    if (raw) {
      delete document.documentElement.dataset[dataKey];
      return secureJsonParse(raw);
    }
    return null;
  }

  function handleManifestPayload(payload) {
    if (pageSuspended) return;
    if (!payload || payload.source !== 'ottsub_injected' || !/^\d+$/.test(String(payload.movieId))) return;
    const mid = String(payload.movieId);
    synchronizeEpisode();
    if (mid === activeMovieId && protectTrackData()) {
      // One bounded candidate; batch B will verify it before activation after ads.
      pendingManifest = payload;
      return;
    }
    manifestCache.set(mid, payload);
    // Prefetching another episode is useful for the cache, never for activation.
    if (mid !== activeMovieId || mid !== getCurrentMovieId()) return;
    availableLangs = Array.isArray(payload.availableTracks) ? payload.availableTracks : [];
    loadSelectedPrimaryTrack(mid, payload);
    loadSecondaryTrack(secondaryLang, mid, payload);
  }

  window.addEventListener('ottsub_manifest_data', (ev) => {
    if (ev && ev.detail) handleManifestPayload(ev.detail);
  });
  window.addEventListener('ottsub_nav_change', runSelfHealingWatchdog);
  window.addEventListener('popstate', runSelfHealingWatchdog);
  window.addEventListener('pagehide', () => { pageSuspended = true; resetEpisodeLifecycle(); activeMovieId = null; });
  window.addEventListener('pageshow', () => { pageSuspended = false; runSelfHealingWatchdog(); });

  try {
    const mid = getCurrentMovieId() || activeMovieId;
    const initPayload = (mid ? readAndFreeManifestDataset(mid) : null) || (document.documentElement?.dataset?.ottsubManifest ? secureJsonParse(document.documentElement.dataset.ottsubManifest) : null);
    if (initPayload) handleManifestPayload(initPayload);
  } catch (_) {}

  function applyStyleProp(action, rawVal, persist = true) {
    const save = (key, value) => { if (persist) queueStorageSave(key, value); };
    const ext = (v, k) => (typeof v === 'object' && v !== null ? (v[k] ?? v.value) : v);
    const R = window.OTTSubRenderer;
    if (action === 'set_primary_line_spacing') { const n = parseInt(ext(rawVal, 'step'), 10); if (!isNaN(n) && n >= 0 && n <= 6) { primaryLineSpacing = n; save('ottsub_primary_line_spacing', n); R?.setPrimaryLineSpacing(n); R?.invalidateStyleCache(); } }
    else if (action === 'set_secondary_line_spacing') { const n = parseInt(ext(rawVal, 'step'), 10); if (!isNaN(n) && n >= 0 && n <= 6) { secondaryLineSpacing = n; save('ottsub_secondary_line_spacing', n); R?.setSecondaryLineSpacing(n); R?.invalidateStyleCache(); } }
    else if (action === 'set_primary_offset_y') { const n = parseInt(ext(rawVal, 'offset'), 10); if (!isNaN(n) && n >= -100 && n <= 100) { primaryOffsetY = n; save('ottsub_primary_offset_y', n); R?.setPrimaryOffsetY(n); R?.invalidateStyleCache(); } }
    else if (action === 'set_secondary_offset_y') { const n = parseInt(ext(rawVal, 'offset'), 10); if (!isNaN(n) && n >= -100 && n <= 100) { secondaryOffsetY = n; save('ottsub_secondary_offset_y', n); R?.setSecondaryOffsetY(n); R?.invalidateStyleCache(); } }
    else if (action === 'set_primary_scale') { const n = parseFloat(ext(rawVal, 'scale')); if (!isNaN(n) && n >= 0.5 && n <= 1.5) { primaryScale = n; save('ottsub_primary_scale', n); R?.setPrimaryScale(n); R?.invalidateStyleCache(); } }
    else if (action === 'set_secondary_scale') { const n = parseFloat(ext(rawVal, 'scale')); if (!isNaN(n) && n >= 0.5 && n <= 1.5) { secondaryScale = n; save('ottsub_secondary_scale', n); R?.setSecondaryScale(n); R?.invalidateStyleCache(); } }
    else if (action === 'set_primary_color') { const c = ext(rawVal, 'color'); if (typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c)) { primaryColor = c; save('ottsub_primary_color', c); R?.setPrimaryColor(c); R?.invalidateStyleCache(); } }
    else if (action === 'set_secondary_color') { const c = ext(rawVal, 'color'); if (typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c)) { secondaryColor = c; save('ottsub_secondary_color', c); R?.setSecondaryColor(c); R?.invalidateStyleCache(); } }
    else if (action === 'set_primary_bg_box' || action === 'set_secondary_bg_box' || action === 'set_bg_box') {
      const b = ext(rawVal, 'enabled');
      if (typeof b !== 'boolean') return;
      if (action === 'set_bg_box') {
        isBgBoxEnabled = isPrimaryBgBoxEnabled = isSecondaryBgBoxEnabled = b;
        R?.setBgBoxEnabled(b);
      } else {
        isBgBoxEnabled = false;
        if (action === 'set_primary_bg_box') { isPrimaryBgBoxEnabled = b; R?.setPrimaryBgBoxEnabled(b); }
        else { isSecondaryBgBoxEnabled = b; R?.setSecondaryBgBoxEnabled(b); }
      }
      // Persist canonical per-language values only. Writing the legacy common
      // flag separately can echo back and turn off the untouched language;
      // a reload must not resurrect old per-language values either.
      save('ottsub_primary_bg_box', isPrimaryBgBoxEnabled);
      save('ottsub_secondary_bg_box', isSecondaryBgBoxEnabled);
      R?.invalidateStyleCache();
    }
  }

  function applyCustomPosition(x, y, persist = false) {
    const values = validateStorageSchema({ ottsub_custom_pos_x: x, ottsub_custom_pos_y: y });
    if (!Number.isFinite(values.ottsub_custom_pos_x) || !Number.isFinite(values.ottsub_custom_pos_y)) return;
    customPosX = Math.round(values.ottsub_custom_pos_x * 100) / 100;
    customPosY = Math.round(values.ottsub_custom_pos_y * 100) / 100;
    window.OTTSubRenderer?.setCustomPosition(customPosX, customPosY);
    if (persist) { queueStorageSave('ottsub_custom_pos_x', customPosX); queueStorageSave('ottsub_custom_pos_y', customPosY); }
  }
  if (window.OTTSubRenderer) window.OTTSubRenderer.onPositionChangeCallback = (x, y) => applyCustomPosition(x, y, true);

  if (isExtensionContextValid()) {
    const visualKeys = [
      'ottsub_primary_lang', 'ottsub_primary_track_kind', 'ottsub_secondary_track_kind',
      'ottsub_offset', 'ottsub_secondary_offset', 'ottsub_dual_mode', 'ottsub_secondary_lang', 'ottsub_ui_lang',
      'ottsub_primary_line_spacing', 'ottsub_secondary_line_spacing', 'ottsub_primary_offset_y', 'ottsub_secondary_offset_y',
      'ottsub_primary_scale', 'ottsub_primary_color', 'ottsub_secondary_scale', 'ottsub_secondary_color',
      'ottsub_primary_bg_box', 'ottsub_secondary_bg_box', 'ottsub_bg_box_enabled',
      'ottsub_blur_target', 'ottsub_blur_mode', 'ottsub_hover_pause', 'ottsub_custom_pos_x', 'ottsub_custom_pos_y',
      'ottsub_lock_pos', 'ottsub_lock_position'
    ];
    window.OTTSubStorageGuard.readSettings(visualKeys, (res) => {
      const s = validateStorageSchema(res);
      if (s.ottsub_primary_track_kind) setTrackKind('primary', s.ottsub_primary_track_kind);
      if (s.ottsub_secondary_track_kind) setTrackKind('secondary', s.ottsub_secondary_track_kind);
      if (s.ottsub_primary_lang) setPrimaryLanguage(s.ottsub_primary_lang);
      if (s.ottsub_offset !== undefined && window.OTTSubSyncEngine) window.OTTSubSyncEngine.setOffset(s.ottsub_offset);
      if (s.ottsub_secondary_offset !== undefined) secondarySyncEngine.setOffset(s.ottsub_secondary_offset);
      if (s.ottsub_dual_mode !== undefined) isDualMode = !!s.ottsub_dual_mode;
      if (s.ottsub_secondary_lang && s.ottsub_secondary_lang !== secondaryLang) {
        secondaryLang = s.ottsub_secondary_lang;
        loadSecondaryTrack(secondaryLang);
      }
      if (s.ottsub_ui_lang) uiLang = s.ottsub_ui_lang;
      if (VALID_BLUR_TARGETS.includes(res.ottsub_blur_target)) blurTarget = res.ottsub_blur_target;
      if (VALID_BLUR_MODES.includes(res.ottsub_blur_mode)) blurMode = res.ottsub_blur_mode;
      if (s.ottsub_hover_pause !== undefined) hoverPause = !!s.ottsub_hover_pause;
      if (s.ottsub_lock_pos !== undefined || s.ottsub_lock_position !== undefined) {
        isPositionLocked = !!(s.ottsub_lock_pos ?? s.ottsub_lock_position);
        if (window.OTTSubRenderer) window.OTTSubRenderer.setLockPosition(isPositionLocked);
      }
      const bgBoxVal = (s.ottsub_primary_bg_box !== undefined || s.ottsub_secondary_bg_box !== undefined) ? undefined : s.ottsub_bg_box_enabled;
      [['set_primary_line_spacing', s.ottsub_primary_line_spacing], ['set_secondary_line_spacing', s.ottsub_secondary_line_spacing], ['set_primary_offset_y', s.ottsub_primary_offset_y], ['set_secondary_offset_y', s.ottsub_secondary_offset_y], ['set_primary_scale', s.ottsub_primary_scale], ['set_secondary_scale', s.ottsub_secondary_scale], ['set_primary_color', s.ottsub_primary_color], ['set_secondary_color', s.ottsub_secondary_color], ['set_primary_bg_box', s.ottsub_primary_bg_box], ['set_secondary_bg_box', s.ottsub_secondary_bg_box], ['set_bg_box', bgBoxVal]].forEach(([act, v]) => { if (v !== undefined) applyStyleProp(act, v, false); });
      if (window.OTTSubRenderer) {
        window.OTTSubRenderer.setBlurTarget(blurTarget);
        window.OTTSubRenderer.setBlurMode(blurMode);
        window.OTTSubRenderer.setHoverPause(hoverPause);
        const rawX = s.ottsub_custom_pos_x, rawY = s.ottsub_custom_pos_y;
        if (Number.isFinite(rawX) && Number.isFinite(rawY)) {
          applyCustomPosition(rawX, rawY);
        }
      }
      triggerManualRender();
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' && area !== 'sync') return;
      const validated = window.OTTSubStorageGuard.selectStorageChanges(changes, area);
      changes = Object.fromEntries(Object.entries(validated).map(([key, newValue]) => [key, { newValue }]));
      let needRender = false;
      if (changes.ottsub_custom_pos_x || changes.ottsub_custom_pos_y) {
        applyCustomPosition(changes.ottsub_custom_pos_x?.newValue ?? customPosX, changes.ottsub_custom_pos_y?.newValue ?? customPosY);
        needRender = true;
      }
      if (changes.ottsub_primary_track_kind) setTrackKind('primary', changes.ottsub_primary_track_kind.newValue);
      if (changes.ottsub_secondary_track_kind) setTrackKind('secondary', changes.ottsub_secondary_track_kind.newValue);
      if (changes.ottsub_primary_lang) setPrimaryLanguage(changes.ottsub_primary_lang.newValue);
      if (changes.ottsub_offset && window.OTTSubSyncEngine) { window.OTTSubSyncEngine.setOffset(changes.ottsub_offset.newValue); needRender = true; }
      if (changes.ottsub_secondary_offset) { secondarySyncEngine.setOffset(changes.ottsub_secondary_offset.newValue); needRender = true; }
      if (changes.ottsub_dual_mode) { isDualMode = !!changes.ottsub_dual_mode.newValue; needRender = true; }
      if (changes.ottsub_secondary_lang) { secondaryLang = changes.ottsub_secondary_lang.newValue; loadSecondaryTrack(secondaryLang); }
      if (changes.ottsub_ui_lang) uiLang = changes.ottsub_ui_lang.newValue;
      if (changes.ottsub_blur_target && window.OTTSubRenderer && VALID_BLUR_TARGETS.includes(changes.ottsub_blur_target.newValue)) {
        blurTarget = changes.ottsub_blur_target.newValue; window.OTTSubRenderer.setBlurTarget(blurTarget); needRender = true;
      }
      if (changes.ottsub_blur_mode && window.OTTSubRenderer && VALID_BLUR_MODES.includes(changes.ottsub_blur_mode.newValue)) {
        blurMode = changes.ottsub_blur_mode.newValue; window.OTTSubRenderer.setBlurMode(blurMode); needRender = true;
      }
      if (changes.ottsub_hover_pause !== undefined) setHoverPauseEnabled(changes.ottsub_hover_pause.newValue);
      if ((changes.ottsub_lock_pos || changes.ottsub_lock_position) && window.OTTSubRenderer) {
        isPositionLocked = !!((changes.ottsub_lock_pos || changes.ottsub_lock_position).newValue);
        window.OTTSubRenderer.setLockPosition(isPositionLocked);
      }
      const sMap = {
        ottsub_primary_line_spacing: 'set_primary_line_spacing', ottsub_secondary_line_spacing: 'set_secondary_line_spacing',
        ottsub_primary_offset_y: 'set_primary_offset_y', ottsub_secondary_offset_y: 'set_secondary_offset_y',
        ottsub_primary_scale: 'set_primary_scale', ottsub_secondary_scale: 'set_secondary_scale',
        ottsub_primary_color: 'set_primary_color', ottsub_secondary_color: 'set_secondary_color',
        ottsub_primary_bg_box: 'set_primary_bg_box', ottsub_secondary_bg_box: 'set_secondary_bg_box',
        ottsub_bg_box_enabled: 'set_bg_box'
      };
      for (const [k, a] of Object.entries(sMap)) {
        if (k === 'ottsub_bg_box_enabled' && (changes.ottsub_primary_bg_box || changes.ottsub_secondary_bg_box)) continue;
        if (changes[k] && changes[k].newValue !== undefined) { applyStyleProp(a, changes[k].newValue, false); needRender = true; }
      }
      if (needRender) triggerManualRender();
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (sender.id !== chrome.runtime.id) return false;
      if (!request || typeof request.action !== 'string') return false;

      switch (request.action) {
        case 'getStatus':
          sendResponse({
            build: loadedBuild,
            primaryNeedsSelection: !!primaryRequest?.needsUrls && !window.OTTSubSyncEngine.hasCues(),
            secondaryNeedsSelection: isDualMode && !!secondaryRequest?.needsUrls && !secondarySyncEngine.hasCues(),
            ...playbackGate.status(performance.now()),
            ...(episodeOwnerMismatch ? { displaySuppressed: true, suppressionReason: 'episode-owner-mismatch' } : {}),
            nativeTextAvailable,
            nativeVerification: nativeReference.status,
            nativeFallbackHidden: !!document.body?.classList.contains('ottsub-recovery-native-hidden'),
            ready: !!currentVideo, movieId: activeMovieId, dualModeSupported: true, availableTracks: manifestCache.has(activeMovieId) ? availableLangs : null,
            hasCues: window.OTTSubSyncEngine ? window.OTTSubSyncEngine.hasCues() : false,
            cueCount: window.OTTSubSyncEngine ? window.OTTSubSyncEngine.getCueCount() : 0,
            hasSecondaryCues: secondarySyncEngine.hasCues(), secondaryCueCount: secondarySyncEngine.getCueCount(),
            isDualMode, isPositionLocked, primaryLang, primaryResolvedLang, secondaryLang, primaryTrackKind, secondaryTrackKind, blurTarget, blurMode, hoverPause,
            offset: window.OTTSubSyncEngine ? window.OTTSubSyncEngine.offsetMs : 0, secondaryOffset: secondarySyncEngine.offsetMs,
            primaryLineSpacing, secondaryLineSpacing, primaryOffsetY, secondaryOffsetY,
            primaryScale, secondaryScale, primaryColor, secondaryColor,
            primaryBgBox: isPrimaryBgBoxEnabled, secondaryBgBox: isSecondaryBgBoxEnabled
          });
          return true;
        case 'show_native_during_recovery':
          allowNativeDuringRecovery = true;
          updateRecoveryNativeVisibility();
          break;
        case 'adjust_offset': if (window.OTTSubSyncEngine) window.OTTSubSyncEngine.adjustOffset(request.value?.deltaMs ?? request.value); break;
        case 'set_offset': if (window.OTTSubSyncEngine) window.OTTSubSyncEngine.setOffset(request.value?.offsetMs ?? request.value); break;
        case 'reset_offset': if (window.OTTSubSyncEngine) window.OTTSubSyncEngine.resetOffset(); break;
        case 'adjust_secondary_offset': secondarySyncEngine.adjustOffset(request.value?.deltaMs ?? request.value); break;
        case 'set_secondary_offset': secondarySyncEngine.setOffset(request.value?.offsetMs ?? request.value); break;
        case 'reset_secondary_offset': secondarySyncEngine.resetOffset(); break;
        case 'set_primary_track_kind':
        case 'set_secondary_track_kind': {
          const side = request.action === 'set_primary_track_kind' ? 'primary' : 'secondary';
          const kind = request.value?.kind ?? request.kind ?? request.value;
          if (window.OTTSubTrackLanguages.validKind(kind)) {
            setTrackKind(side, kind); queueStorageSave(`ottsub_${side}_track_kind`, kind);
          }
          break;
        }
        case 'set_primary_lang': {
          const lang = request.value?.lang ?? request.lang ?? request.value;
          const valid = window.OTTSubStorageGuard.validateStorageSchema({ ottsub_primary_lang: lang }).ottsub_primary_lang;
          if (valid) { setPrimaryLanguage(valid); queueStorageSave('ottsub_primary_lang', valid); }
          break;
        }
        case 'set_secondary_lang': {
          const lang = request.value?.lang ?? request.lang ?? request.value;
          const valid = window.OTTSubStorageGuard.validateStorageSchema({ ottsub_secondary_lang: lang }).ottsub_secondary_lang;
          if (valid) { secondaryLang = valid; queueStorageSave('ottsub_secondary_lang', valid); loadSecondaryTrack(valid); }
          break;
        }
        case 'set_dual_mode': case 'toggle_dual_mode': {
          const d = (request.action === 'toggle_dual_mode') ? !isDualMode : (typeof request.value === 'object' && request.value !== null ? request.value.enabled : (request.enabled !== undefined ? request.enabled : request.value));
          isDualMode = !!d; queueStorageSave('ottsub_dual_mode', isDualMode); break;
        }
        case 'set_lock_pos': { const l = (typeof request.value === 'object' && request.value !== null) ? (request.value.lock ?? request.value.isLocked) : (request.value !== undefined ? request.value : request.lock); isPositionLocked = !!l; queueStorageSave('ottsub_lock_pos', isPositionLocked); if (window.OTTSubRenderer) window.OTTSubRenderer.setLockPosition(isPositionLocked); break; }
        case 'toggle_lock_pos': isPositionLocked = !isPositionLocked; queueStorageSave('ottsub_lock_pos', isPositionLocked); if (window.OTTSubRenderer) window.OTTSubRenderer.setLockPosition(isPositionLocked); showLocalizedHUD(isPositionLocked ? 'hud_lock_pos_on' : 'hud_lock_pos_off', {}, isPositionLocked ? '위치 잠금' : '위치 잠금 해제'); break;
        case 'set_primary_line_spacing': case 'set_secondary_line_spacing': case 'set_primary_offset_y': case 'set_secondary_offset_y':
        case 'set_primary_scale': case 'set_secondary_scale': case 'set_primary_color': case 'set_secondary_color':
        case 'set_primary_bg_box': case 'set_secondary_bg_box': case 'set_bg_box':
          applyStyleProp(request.action, request.value); break;
        case 'reset_language_settings':
          applyStyleProp('set_primary_scale', 1.0); applyStyleProp('set_secondary_scale', 0.78); break;
        case 'reset_custom_position': if (window.OTTSubRenderer) window.OTTSubRenderer.resetCustomPosition(true); break;
        case 'set_custom_position': applyCustomPosition(request.x, request.y, true); break;
      }
      triggerManualRender();
      return false;
    });
  }

  runSelfHealingWatchdog();
  setInterval(runSelfHealingWatchdog, 1500);
})();
