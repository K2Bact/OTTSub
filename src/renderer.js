/**
 * OTTSub - renderer.js
 * Native-matching subtitle overlay renderer attached directly to video container.
 * Implements dynamic native style sniffing, dirty checking, layout containment,
 * drag-and-drop position overrides, and language learning obscuration.
 */
(() => {
  'use strict';

  class SubtitleRenderer {
    constructor() {
      this.container = this.topBox = this.bottomBox = this.videoElem = null;
      this.lastTopText = this.lastBottomText = '';
      this.lastNativeStyle = { fontSize: null, fontFamily: null, color: null, textShadow: null };
      this.isPositionLocked = false;
      this.lineSpacing = this.primaryLineSpacing = this.secondaryLineSpacing = 4;
      this.lineHeight = this.primaryLineHeight = this.secondaryLineHeight = 1.20;
      this.primaryOffsetY = this.secondaryOffsetY = 0;
      this.primaryScale = 1.0; this.secondaryScale = 0.78;
      this.primaryColor = '#ffffff'; this.secondaryColor = '#ffe082';
      this.primaryBgBoxEnabled = this.secondaryBgBoxEnabled = this.bgBoxEnabled = false;
      this.customPosX = this.customPosY = this.dragStartX = this.dragStartY = this.initialCustomX = this.initialCustomY = 0;
      this.isDragging = false; this._dragRafId = this._windowBlurHandler = null; this._dragCooldownUntil = 0;
      this.blurTarget = 'none'; this.blurMode = 'blur_8'; this.hoverPause = true;
      this.onSubtitleHoverChange = null; this.lastStyleSyncTime = 0; this.STYLE_SYNC_INTERVAL_MS = 1500;
    }
    setPrimaryLineSpacing(s) {
      const n = parseInt(s, 10);
      if (!isNaN(n) && n >= 0 && n <= 6) {
        this.primaryLineSpacing = this.lineSpacing = n;
        const lh = +(0.80 + n * 0.10).toFixed(2);
        this.primaryLineHeight = this.lineHeight = lh;
        this.container?.style.setProperty('--ottsub-primary-line-height', String(lh));
        this.container?.style.setProperty('--ottsub-line-height', String(lh));
      }
    }
    setSecondaryLineSpacing(s) {
      const n = parseInt(s, 10);
      if (!isNaN(n) && n >= 0 && n <= 6) {
        this.secondaryLineSpacing = n;
        const lh = +(0.80 + n * 0.10).toFixed(2);
        this.secondaryLineHeight = lh;
        this.container?.style.setProperty('--ottsub-secondary-line-height', String(lh));
      }
    }
    setPrimaryOffsetY(p) {
      const n = parseInt(p, 10);
      if (!isNaN(n) && n >= -100 && n <= 100) { this.primaryOffsetY = n; this.container?.style.setProperty('--ottsub-primary-offset-y', `${n}px`); }
    }
    setSecondaryOffsetY(p) {
      const n = parseInt(p, 10);
      if (!isNaN(n) && n >= -100 && n <= 100) { this.secondaryOffsetY = n; this.container?.style.setProperty('--ottsub-secondary-offset-y', `${n}px`); }
    }
    setPrimaryScale(s) {
      const n = parseFloat(s);
      if (!isNaN(n) && n >= 0.5 && n <= 1.5) { this.primaryScale = n; this.container?.style.setProperty('--ottsub-primary-scale', String(n)); }
    }
    setPrimaryColor(c) {
      if (typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c)) {
        this.primaryColor = c;
        this.container?.style.setProperty('--ottsub-primary-color', c);
        this.container?.style.setProperty('--ottsub-color', c);
      }
    }
    setSecondaryScale(s) {
      const n = parseFloat(s);
      if (!isNaN(n) && n >= 0.5 && n <= 1.5) { this.secondaryScale = n; this.container?.style.setProperty('--ottsub-secondary-scale', String(n)); }
    }
    setSecondaryColor(c) {
      if (typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c)) { this.secondaryColor = c; this.container?.style.setProperty('--ottsub-secondary-color', c); }
    }
    setPrimaryBgBoxEnabled(e) { this.primaryBgBoxEnabled = !!e; this.bgBoxEnabled = false; this.container?.classList.remove('has-bg-box'); this.container?.classList.toggle('has-primary-bg-box', this.primaryBgBoxEnabled); }
    setSecondaryBgBoxEnabled(e) { this.secondaryBgBoxEnabled = !!e; this.bgBoxEnabled = false; this.container?.classList.remove('has-bg-box'); this.container?.classList.toggle('has-secondary-bg-box', this.secondaryBgBoxEnabled); }
    setBgBoxEnabled(e) { this.setPrimaryBgBoxEnabled(e); this.setSecondaryBgBoxEnabled(e); this.bgBoxEnabled = !!e; this.container?.classList.toggle('has-bg-box', this.bgBoxEnabled); }
    invalidateStyleCache() { this.lastTopText = this.lastBottomText = null; }
    setLineSpacing(s) { this.setPrimaryLineSpacing(s); this.setSecondaryLineSpacing(s); }
    setLineHeight(l) { if (typeof l === 'number' && l >= 0.7 && l <= 2) { this.lineHeight = l; this.container?.style.setProperty('--ottsub-line-height', String(l)); } }
    setLockPosition(isLocked) {
      this.isPositionLocked = !!isLocked;
      if (this.isPositionLocked && this.isDragging) {
        this.cancelDrag();
      }
      if (this.container) {
        this.container.classList.toggle('lock-position', this.isPositionLocked);
        if (this.isPositionLocked) this.container.classList.remove('controls-visible');
      }
    }
    setCustomPosition(xPercent, yPercent) {
      const x = parseFloat(xPercent), y = parseFloat(yPercent);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        this.customPosX = Math.max(-45, Math.min(45, Math.round(x * 100) / 100));
        this.customPosY = Math.max(-45, Math.min(45, Math.round(y * 100) / 100));
        this.bottomBox?.style.setProperty('--ottsub-custom-x', `${this.customPosX}%`);
        this.bottomBox?.style.setProperty('--ottsub-custom-y', `${this.customPosY}%`);
        this.topBox?.style.setProperty('--ottsub-custom-x', `${this.customPosX}%`);
        this.topBox?.style.setProperty('--ottsub-custom-y', `${this.customPosY}%`);
        this.container?.classList.toggle('has-custom-position', (this.customPosX !== 0 || this.customPosY !== 0));
      }
    }
    setBlurTarget(t) { if (['none', 'secondary', 'primary', 'both'].includes(t)) { this.blurTarget = t; this.lastTopText = this.lastBottomText = null; } }
    setBlurMode(m) {
      if (['blur_4', 'blur_8', 'blur_14'].includes(m)) {
        this.blurMode = m;
        const pxMap = { blur_4: '4px', blur_8: '8px', blur_14: '14px' };
        this.container?.style.setProperty('--ottsub-blur-px', pxMap[m] || '8px');
        this.lastTopText = this.lastBottomText = null;
      }
    }
    setHoverPause(e) { this.hoverPause = !!e; }
    resetCustomPosition(notify = true) {
      this.customPosX = this.customPosY = 0;
      this.bottomBox?.style.setProperty('--ottsub-custom-x', '0%');
      this.bottomBox?.style.setProperty('--ottsub-custom-y', '0%');
      this.topBox?.style.setProperty('--ottsub-custom-x', '0%');
      this.topBox?.style.setProperty('--ottsub-custom-y', '0%');
      this.container?.classList.remove('has-custom-position');
      if (notify && window.OTTSubHUD) {
        const msg = (window.OTTSubI18n ? window.OTTSubI18n.t('hud_pos_reset') : '자막 위치 기본값 초기화');
        window.OTTSubHUD.show(msg);
      }
      if (typeof this.onPositionChangeCallback === 'function') {
        try { this.onPositionChangeCallback(0, 0); } catch (_) {}
      }
    }
    setupDraggableBox(box) {
      if (!box || typeof box.addEventListener !== 'function' || box._ottsubDragAttached) return;
      box._ottsubDragAttached = true;
      const onPointerDown = (e) => {
        if (this.isDragging) return;
        if (this.isPositionLocked || this.container?.classList.contains('native-controls-hit')) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        try { box.setPointerCapture(e.pointerId); } catch (_) {}
        this._dragPointer = { box, id: e.pointerId };
        this._dragGeneration = (this._dragGeneration || 0) + 1;
        this.isDragging = true;
        box.classList.add('is-dragging');
        this.container?.classList.add('is-dragging');
        if (typeof this.onSubtitleHoverChange === 'function') {
          this.onSubtitleHoverChange(false, 'drag_start');
        }
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.initialCustomX = this.customPosX;
        this.initialCustomY = this.customPosY;
        try {
          const rect = (this.videoElem && typeof this.videoElem.getBoundingClientRect === 'function')
            ? this.videoElem.getBoundingClientRect()
            : (this.container?.getBoundingClientRect() || { width: window.innerWidth, height: window.innerHeight });
          this._cachedVideoRect = { width: Math.max(1, rect.width || window.innerWidth || 1920), height: Math.max(1, rect.height || window.innerHeight || 1080) };
        } catch (_) {
          this._cachedVideoRect = { width: window.innerWidth || 1920, height: window.innerHeight || 1080 };
        }
      };
      const onPointerMove = (e) => {
        if (!this.isDragging || !Number.isFinite(e.clientX) || !Number.isFinite(e.clientY)) return;
        if (e.pointerId !== this._dragPointer?.id) return;
        e.stopPropagation();
        if (this._dragRafId) cancelAnimationFrame(this._dragRafId);
        const clientX = e.clientX, clientY = e.clientY;
        const generation = this._dragGeneration, frameToken = this._dragFrameToken = (this._dragFrameToken || 0) + 1;
        this._dragRafId = requestAnimationFrame(() => {
          if (!this.isDragging || generation !== this._dragGeneration || frameToken !== this._dragFrameToken) return;
          this._dragRafId = null;
          const rect = this.videoElem?.getBoundingClientRect?.();
          if (rect && this._cachedVideoRect && (Math.abs(rect.width - this._cachedVideoRect.width) > 0.5
            || Math.abs(rect.height - this._cachedVideoRect.height) > 0.5)) { this.cancelDrag(); return; }
          const w = this._cachedVideoRect?.width || window.innerWidth || 1920;
          const h = this._cachedVideoRect?.height || window.innerHeight || 1080;
          const deltaX = ((clientX - this.dragStartX) / w) * 100;
          const deltaY = ((clientY - this.dragStartY) / h) * 100;
          if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return;
          this.customPosX = Math.max(-45, Math.min(45, Math.round((this.initialCustomX + deltaX) * 100) / 100));
          this.customPosY = Math.max(-45, Math.min(45, Math.round((this.initialCustomY + deltaY) * 100) / 100));
          this.bottomBox?.style.setProperty('--ottsub-custom-x', `${this.customPosX}%`);
          this.bottomBox?.style.setProperty('--ottsub-custom-y', `${this.customPosY}%`);
          this.topBox?.style.setProperty('--ottsub-custom-x', `${this.customPosX}%`);
          this.topBox?.style.setProperty('--ottsub-custom-y', `${this.customPosY}%`);
          this.container?.classList.add('has-custom-position');
        });
      };
      const onPointerUp = (e) => {
        if (!this.isDragging) return;
        if (e && e.pointerId !== this._dragPointer?.id) return;
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        if (this._dragRafId) { cancelAnimationFrame(this._dragRafId); this._dragRafId = null; }
        this.isDragging = false;
        this._dragGeneration++;
        this._dragPointer = null;
        box.classList.remove('is-dragging');
        this.container?.classList.remove('is-dragging');
        this._dragCooldownUntil = Date.now() + 250;
        if (typeof this.onSubtitleHoverChange === 'function') {
          this.onSubtitleHoverChange(false, 'drag_end');
        }
        try { if (e && e.pointerId != null) box.releasePointerCapture(e.pointerId); } catch (_) {}
        if (typeof this.onPositionChangeCallback === 'function') {
          try { this.onPositionChangeCallback(this.customPosX, this.customPosY); } catch (_) {}
        }
      };
      const onDblClick = (e) => {
        if (this.isPositionLocked) return;
        e.preventDefault(); e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        this.resetCustomPosition(true);
      };
      box.addEventListener('pointerdown', onPointerDown, { capture: true });
      box.addEventListener('pointermove', onPointerMove, { capture: true });
      box.addEventListener('pointerup', onPointerUp, { capture: true });
      box.addEventListener('pointercancel', onPointerUp, { capture: true });
      box.addEventListener('lostpointercapture', onPointerUp, { capture: true });
      this._ensureWindowBlurListener();
      box.addEventListener('dblclick', onDblClick, { capture: true });
    }
    _ensureWindowBlurListener() {
      if (this._windowBlurHandler || typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
      this._windowBlurHandler = () => {
        this.cancelDrag();
      };
      window.addEventListener('blur', this._windowBlurHandler, { capture: true });
    }
    cancelDrag() {
      if (!this.isDragging) return;
      this._dragGeneration++;
      if (this._dragRafId) { cancelAnimationFrame(this._dragRafId); this._dragRafId = null; }
      this.isDragging = false;
      this._cachedVideoRect = null;
      const pointer = this._dragPointer; this._dragPointer = null;
      try { pointer?.box.releasePointerCapture(pointer.id); } catch (_) {}
      this.bottomBox?.classList.remove('is-dragging');
      this.topBox?.classList.remove('is-dragging');
      this.container?.classList.remove('is-dragging');
      this._dragCooldownUntil = Date.now() + 250;
      this.onSubtitleHoverChange?.(false, 'drag_end');
      this.onPositionChangeCallback?.(this.customPosX, this.customPosY);
    }
    findRobustVideoContainer(video) {
      if (!video) return null;
      try {
        const fsElem = document.fullscreenElement || document.webkitFullscreenElement;
        if (fsElem && typeof fsElem.contains === 'function' && fsElem.contains(video)) return fsElem;
      } catch (_) {}
      if (typeof video.closest === 'function') {
        try {
          const uia = video.closest('[data-uia="player"]') || video.closest('[data-uia*="video-player"]') || video.closest('[data-uia*="player"]') || video.closest('[data-uia*="video-canvas"]');
          if (uia && typeof uia.contains === 'function' && uia.contains(video)) return uia;
        } catch (_) {}
      }
      const vWidth = (typeof video.getBoundingClientRect === 'function') ? video.getBoundingClientRect().width : (video.clientWidth || 0);
      const vHeight = (typeof video.getBoundingClientRect === 'function') ? video.getBoundingClientRect().height : (video.clientHeight || 0);
      let curr = video.parentElement, bestCandidate = video.parentElement, depth = 0;
      while (curr && curr !== document.body && curr !== document.documentElement && depth < 6) {
        depth++;
        try {
          const style = (window.getComputedStyle && typeof window.getComputedStyle === 'function') ? window.getComputedStyle(curr) : (curr.style || {});
          const rect = (typeof curr.getBoundingClientRect === 'function') ? curr.getBoundingClientRect() : { width: curr.clientWidth || 0, height: curr.clientHeight || 0 };
          if (style.display === 'none' || style.visibility === 'hidden') { curr = curr.parentElement; continue; }
          if (style.overflow === 'hidden' && (rect.width < vWidth * 0.8 || rect.height < vHeight * 0.8)) { curr = curr.parentElement; continue; }
          if (vWidth > 0 && vHeight > 0 && rect.width >= vWidth * 0.9 && rect.height >= vHeight * 0.9) {
            bestCandidate = curr;
            if (style.position && ['relative', 'absolute', 'fixed'].includes(style.position)) break;
          }
        } catch (_) {}
        curr = curr.parentElement;
      }
      if (bestCandidate) return bestCandidate;
      if (typeof video.closest === 'function') {
        try {
          const legacy = video.closest('.watch-video--player-view') || video.closest('.nf-player-container');
          if (legacy) return legacy;
        } catch (_) {}
      }
      return video.parentElement;
    }
    ensureMounted(video) {
      if (!video) return false;
      this.videoElem = video;
      const targetContainer = this.findRobustVideoContainer(video);
      if (!targetContainer) return false;
      try {
        const cs = (window.getComputedStyle && typeof window.getComputedStyle === 'function') ? window.getComputedStyle(targetContainer) : (targetContainer.style || {});
        if (cs.position === 'static') targetContainer.style.position = 'relative';
      } catch (_) {}
      this._initFullscreenWatchdog();
      this._initDpiWatchdog();
      if (!this._controlsHit && window.OTTSubControlsHitDetector) this._controlsHit = new window.OTTSubControlsHitDetector(this);
      const needsRemount = !this.container || !this.container.isConnected || (this.container.parentElement !== targetContainer);
      if (needsRemount) {
        try {
          const existing = document.querySelectorAll('#ottsub-container');
          for (let i = 0; i < existing.length; i++) {
            if (existing[i] !== this.container || existing[i].parentElement !== targetContainer) {
              try { existing[i].remove(); } catch (_) {}
            }
          }
        } catch (_) {}
        if (this.container?.parentElement) {
          try { this.container.parentElement.removeChild(this.container); } catch (_) {
            try { this.container.remove(); } catch (_) {}
          }
        }
        this.container = document.createElement('div');
        this.container.id = 'ottsub-container';
        this.container.className = 'ottsub-container' + (this.isPositionLocked ? ' lock-position' : '');
        this.topBox = document.createElement('div');
        this.topBox.className = 'ottsub-box ottsub-top';
        this.bottomBox = document.createElement('div');
        this.bottomBox.className = 'ottsub-box ottsub-bottom';
        this.container.appendChild(this.topBox);
        this.container.appendChild(this.bottomBox);
        targetContainer.appendChild(this.container);
        this.lastTopText = this.lastBottomText = null;
        this.syncNativeStyles(video, true);
        const props = [
          ['--ottsub-primary-line-height', this.primaryLineHeight],
          ['--ottsub-line-height', this.primaryLineHeight],
          ['--ottsub-secondary-line-height', this.secondaryLineHeight],
          ['--ottsub-primary-offset-y', this.primaryOffsetY !== undefined ? `${this.primaryOffsetY}px` : null],
          ['--ottsub-secondary-offset-y', this.secondaryOffsetY !== undefined ? `${this.secondaryOffsetY}px` : null],
          ['--ottsub-primary-scale', this.primaryScale],
          ['--ottsub-primary-color', this.primaryColor],
          ['--ottsub-color', this.primaryColor],
          ['--ottsub-secondary-scale', this.secondaryScale],
          ['--ottsub-secondary-color', this.secondaryColor]
        ];
        props.forEach(([k, v]) => { if (v != null) this.container.style.setProperty(k, String(v)); });
        if (this.primaryBgBoxEnabled) this.container.classList.add('has-primary-bg-box');
        if (this.secondaryBgBoxEnabled) this.container.classList.add('has-secondary-bg-box');
        if (this.bgBoxEnabled) this.container.classList.add('has-bg-box');
        const pxMap = { blur_4: '4px', blur_8: '8px', blur_14: '14px' };
        this.container.style.setProperty('--ottsub-blur-px', pxMap[this.blurMode] || '8px');
        this.setupDraggableBox(this.topBox);
        this.setupDraggableBox(this.bottomBox);
        if (this.customPosX !== 0 || this.customPosY !== 0) {
          this.setCustomPosition(this.customPosX, this.customPosY);
        }
      }
      if (typeof ResizeObserver !== 'undefined') {
        if (this._resizeObserver && this._observedVideo !== video) {
          try { this._resizeObserver.disconnect(); } catch (_) {}
          this._resizeObserver = null;
        }
        if (!this._resizeObserver) {
          this._observedVideo = video;
          this._resizeObserver = new ResizeObserver(() => {
            this.cancelDrag();
            if (this.videoElem?.isConnected) this.syncNativeStyles(this.videoElem, true);
          });
          try { this._resizeObserver.observe(video); } catch (_) {}
        }
      }
      return true;
    }
    _initDpiWatchdog() {
      if (this._dpiWatchdogInitialized || typeof window === 'undefined' || !window.matchMedia) return;
      this._dpiWatchdogInitialized = true;
      const generation = this._dpiGeneration = (this._dpiGeneration || 0) + 1;
      const listenDpi = () => {
        if (!this._dpiWatchdogInitialized || generation !== this._dpiGeneration) return;
        this._clearDpiListener();
        try {
          const mql = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
          this._dpiMql = mql;
          const onChange = () => {
            if (!this._dpiWatchdogInitialized || generation !== this._dpiGeneration
              || this._dpiMql !== mql || this._dpiChangeHandler !== onChange) return;
            this._clearDpiListener();
            if (this.videoElem?.isConnected) this.syncNativeStyles(this.videoElem, true);
            listenDpi();
          };
          this._dpiChangeHandler = onChange;
          mql?.addEventListener?.('change', onChange, { once: true });
        } catch (_) {}
      };
      listenDpi();
    }
    _clearDpiListener() {
      try { this._dpiMql?.removeEventListener?.('change', this._dpiChangeHandler); } catch (_) {}
      this._dpiMql = this._dpiChangeHandler = null;
    }
    _initFullscreenWatchdog() {
      if (this._fullscreenWatchdogInitialized) return;
      this._fullscreenWatchdogInitialized = true;
      const generation = this._fullscreenGeneration = (this._fullscreenGeneration || 0) + 1;
      this._onFullscreenChange = () => {
        this.cancelDrag();
        const sync = () => {
          if (!this._fullscreenWatchdogInitialized || generation !== this._fullscreenGeneration) return;
          if (this.videoElem?.isConnected) {
            this.ensureMounted(this.videoElem);
            this.syncNativeStyles(this.videoElem, true);
          }
        };
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(sync));
        else sync();
      };
      ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => {
        try { document.addEventListener(ev, this._onFullscreenChange, { passive: true }); }
        catch (_) { document.addEventListener(ev, this._onFullscreenChange); }
      });
    }
    syncNativeStyles(video, force = false) {
      if (!this.container) return;
      const now = performance.now();
      if (!force && (now - this.lastStyleSyncTime < this.STYLE_SYNC_INTERVAL_MS)) return;
      this.lastStyleSyncTime = now;
      this._controlsHit?.refresh();
      let matchedFontSize = null, matchedFontFamily = null, matchedColor = null, matchedTextShadow = null;
      const timedtextRoot = document.querySelector('.player-timedtext') || document.querySelector('[data-uia="player-timedtext"]') || document.querySelector('div[class*="timedtext"]');
      if (timedtextRoot) {
        const spans = timedtextRoot.querySelectorAll('.player-timedtext-text-container span, span');
        for (const span of spans) {
          if (span.childElementCount > 0) continue;
          const comp = window.getComputedStyle(span);
          const fs = parseFloat(comp.fontSize);
          if (fs && fs >= 16 && fs <= 60) {
            matchedFontSize = comp.fontSize;
            if (comp.fontFamily) matchedFontFamily = comp.fontFamily;
            if (comp.color && comp.color !== 'transparent' && comp.color !== 'rgba(0, 0, 0, 0)') matchedColor = comp.color;
            if (comp.textShadow && comp.textShadow !== 'none') matchedTextShadow = comp.textShadow;
            break;
          }
        }
      }
      if (matchedFontSize) this.lastNativeStyle.fontSize = matchedFontSize;
      if (matchedFontFamily) this.lastNativeStyle.fontFamily = matchedFontFamily;
      if (matchedColor) this.lastNativeStyle.color = matchedColor;
      if (matchedTextShadow) this.lastNativeStyle.textShadow = matchedTextShadow;
      let effectiveHeight = (video && video.clientHeight > 0) ? video.clientHeight : window.innerHeight;
      if (video && video.videoWidth > 0 && video.videoHeight > 0 && video.clientWidth > 0 && video.clientHeight > 0) {
        const containerAspect = video.clientWidth / video.clientHeight;
        const videoAspect = video.videoWidth / video.videoHeight;
        if (videoAspect > containerAspect) {
          effectiveHeight = Math.round(video.clientWidth / videoAspect);
        } else {
          effectiveHeight = video.clientHeight;
        }
      }
      const calcFallbackPx = Math.max(18, Math.min(Math.round(effectiveHeight * 0.031), 38)) + 'px';
      this.container.style.setProperty('--ottsub-font-size', this.lastNativeStyle.fontSize || calcFallbackPx);
      this.container.style.setProperty('--ottsub-font-family', this.lastNativeStyle.fontFamily || 'Netflix Sans, "Helvetica Neue", Segoe UI, Roboto, Ubuntu, sans-serif');
      this.container.style.setProperty('--ottsub-text-shadow', this.lastNativeStyle.textShadow || 'rgb(0, 0, 0) 0px 0px 7px, rgb(0, 0, 0) 0px 0px 4px');
      this.container.style.setProperty('--ottsub-color', this.lastNativeStyle.color || '#ffffff');
      try {
        const ctrl = document.querySelector('[data-uia="timeline"]') || document.querySelector('[data-uia="timeline-bar"]') || document.querySelector('[data-uia*="control"]') || document.querySelector('.watch-video--bottom-controls-container');
        let isControlsVisible = false;
        if (ctrl) {
          if (typeof ctrl.checkVisibility === 'function') {
            try { isControlsVisible = ctrl.checkVisibility({ opacityProperty: true, visibilityProperty: true, checkOpacity: true }); }
            catch (_) { isControlsVisible = ctrl.checkVisibility?.() || false; }
          } else {
            const rect = ctrl.getBoundingClientRect?.() || null;
            if (ctrl.offsetParent !== null || ctrl.clientHeight > 0 || (rect && rect.height > 0 && rect.width > 0)) isControlsVisible = true;
          }
        }
        this.container.classList.toggle('lock-position', this.isPositionLocked);
        if (this.isPositionLocked) this.container.classList.remove('controls-visible');
        else this.container.classList.toggle('controls-visible', !!isControlsVisible);
      } catch (_) {}
    }
    _decodeEntities(str) {
      if (!str || typeof str !== 'string') return '';
      return str
        .replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, dec) => {
          const code = parseInt(dec, 10);
          return code > 0 && code < 65536 ? String.fromCharCode(code) : '';
        });
    }
    _createLineElement(text, className, isObscured = false, lineType = 'primary') {
      let finalClassName = className ? `ottsub-line ${className}` : 'ottsub-line';
      if (isObscured) finalClassName += (this.blurMode === 'hide') ? ' is-obscured-hide' : ' is-obscured-blur';
      const lineWrapper = document.createElement('span');
      lineWrapper.className = finalClassName;
      lineWrapper.setAttribute('dir', 'auto');
      if (typeof lineWrapper.addEventListener === 'function') {
        lineWrapper.addEventListener('mouseenter', () => {
          if (this.container?.classList.contains('native-controls-hit') || this.isDragging || (this._dragCooldownUntil && Date.now() < this._dragCooldownUntil)) return;
          if (typeof this.onSubtitleHoverChange === 'function') this.onSubtitleHoverChange(true, lineType);
        });
        lineWrapper.addEventListener('mouseleave', () => {
          if (!this.isDragging && typeof this.onSubtitleHoverChange === 'function') this.onSubtitleHoverChange(false, lineType);
        });
      }
      const raw = text || '';
      if (!raw) return lineWrapper;
      const decodedText = raw; // Parse markup before decoding literal text entities.
      const tagPattern = /(<ruby\b[^>]*>[\s\S]*?<\/ruby>|<br\s*\/?>)/gi;
      const parts = decodedText.split(tagPattern);
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        if (/^<ruby\b[^>]*>[\s\S]*?<\/ruby>$/i.test(part)) {
          const rubyElem = document.createElement('ruby');
          const inner = part.replace(/^<ruby\b[^>]*>/i, '').replace(/<\/ruby>$/i, '');
          const rtMatch = inner.match(/<rt\b[^>]*>([\s\S]*?)<\/rt>/i);
          if (rtMatch) {
            const baseText = inner.replace(/<rt\b[^>]*>[\s\S]*?<\/rt>/gi, '').replace(/<[^>]+>/g, '');
            if (baseText) rubyElem.appendChild(document.createTextNode(this._decodeEntities(baseText)));
            const rtElem = document.createElement('rt');
            rtElem.textContent = this._decodeEntities(rtMatch[1]);
            rubyElem.appendChild(rtElem);
          } else { rubyElem.textContent = this._decodeEntities(inner.replace(/<[^>]+>/g, '')); }
          lineWrapper.appendChild(rubyElem);
        } else if (/^<br\s*\/?>$/i.test(part)) {
          lineWrapper.appendChild(document.createElement('br'));
        } else {
          this._appendEmphasis(lineWrapper, part);
        }
      }
      return lineWrapper;
    }
    _appendEmphasis(parent, text) {
      const stack = [{node: parent, tag: null}];
      for (const token of text.split(/(<[^>]*>)/g)) {
        const match = token.match(/^<(\/?)(i|em|b|strong|u)\b[^>]*>$/i);
        if (match) {
          const tag = ({em:'i',strong:'b'})[match[2].toLowerCase()] || match[2].toLowerCase();
          if (match[1]) {
            for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === tag) {
              const reopen = stack.slice(i + 1).map(entry => entry.tag);
              stack.length = i;
              for (const name of reopen) {
                const node = document.createElement(name); stack.at(-1).node.appendChild(node); stack.push({node,tag:name});
              }
              break;
            }
          } else if (stack.length < 32) {
            const node = document.createElement(tag); stack.at(-1).node.appendChild(node); stack.push({node,tag});
          }
        } else if (token && !/^<[^>]*>$/.test(token)) stack.at(-1).node.appendChild(document.createTextNode(this._decodeEntities(token)));
      }
    }
    _renderDualCuesIntoBox(box, primaryCues, secondaryCues, isDualMode = true) {
      const hasPrimary = Array.isArray(primaryCues) && primaryCues.length > 0;
      const hasSecondary = Array.isArray(secondaryCues) && secondaryCues.length > 0;
      let wrapper = box.querySelector('.ottsub-slots-wrapper');
      let slotPrimary = box.querySelector('.ottsub-slot-primary');
      let slotSecondary = box.querySelector('.ottsub-slot-secondary');
      if (!wrapper || !slotPrimary || !slotSecondary) {
        box.textContent = '';
        wrapper = document.createElement('div'); wrapper.className = 'ottsub-slots-wrapper';
        slotPrimary = document.createElement('div'); slotPrimary.className = 'ottsub-slot-primary';
        slotSecondary = document.createElement('div'); slotSecondary.className = 'ottsub-slot-secondary';
        wrapper.appendChild(slotPrimary); wrapper.appendChild(slotSecondary);
        box.appendChild(wrapper);
      }
      if (!hasPrimary && !hasSecondary) {
        slotPrimary.textContent = slotSecondary.textContent = '';
        slotPrimary.classList.add('is-empty');
        slotSecondary.classList.add('is-empty');
        box.classList.add('all-empty');
        box.classList.remove('is-dual');
        return;
      }
      box.classList.remove('all-empty');
      box.classList.toggle('is-dual', isDualMode);
      box.classList.toggle('is-multiline', ((primaryCues?.length || 0) + (secondaryCues?.length || 0)) >= 3);
      const renderSlot = (slot, cues, cls, type, isObs) => {
        slot.textContent = '';
        if (cues && cues.length > 0) {
          slot.classList.remove('is-empty');
          slot.appendChild(this._createLineElement(cues.map(c => c.text).filter(Boolean).join('\n'), cls, isObs, type));
        } else {
          slot.classList.add('is-empty');
          if (isDualMode) {
            const p = document.createElement('span');
            p.className = cls; p.style.visibility = 'hidden'; p.textContent = '\u00A0';
            slot.appendChild(p);
          }
        }
      };
      const isNone = (this.blurTarget === 'none' || !this.blurTarget);
      renderSlot(slotPrimary, primaryCues, 'ottsub-line-primary', 'primary', !isNone && (this.blurTarget === 'primary' || this.blurTarget === 'both'));
      renderSlot(slotSecondary, secondaryCues, 'ottsub-line-secondary', 'secondary', !isNone && (this.blurTarget === 'secondary' || this.blurTarget === 'both'));
    }
    renderDual(primaryCues, secondaryCues, options = {}) {
      const offsetMs = typeof options.offsetMs === 'number' ? options.offsetMs : 0;
      const isDualMode = !!options.isDualMode;
      const pTop = primaryCues?.top || [], pBottom = primaryCues?.bottom || [];
      const sTop = secondaryCues?.top || [], sBottom = secondaryCues?.bottom || [];
      const hasAnyCues = (pTop.length > 0 || pBottom.length > 0 || sTop.length > 0 || sBottom.length > 0);
      const hasCustomPos = (this.customPosX !== 0 || this.customPosY !== 0);
      if (!isDualMode && offsetMs === 0 && !this.isPositionLocked && !hasCustomPos && !hasAnyCues) {
        document.body?.classList.remove('ottsub-active');
        this.clear();
        this.syncNativeStyles(this.videoElem);
        return;
      }
      if (!this.container) return;
      document.body?.classList.add('ottsub-active');
      this.syncNativeStyles(this.videoElem);
      const blurKey = `:${this.blurTarget}:${this.blurMode}`;
      const modeKey = isDualMode ? `:dual${blurKey}` : `:single${blurKey}`;
      const topKey = pTop.map(c => c.id + ':' + c.text).join('|') + '###' + sTop.map(c => c.id + ':' + c.text).join('|') + modeKey;
      const bottomKey = pBottom.map(c => c.id + ':' + c.text).join('|') + '###' + sBottom.map(c => c.id + ':' + c.text).join('|') + modeKey;

      if (topKey !== this.lastTopText) {
        this.lastTopText = topKey;
        this.topBox.style.display = (pTop.length === 0 && sTop.length === 0) ? 'none' : 'flex';
        this._renderDualCuesIntoBox(this.topBox, pTop, sTop, isDualMode);
      }

      if (bottomKey !== this.lastBottomText) {
        this.lastBottomText = bottomKey;
        this.bottomBox.style.display = (pBottom.length === 0 && sBottom.length === 0) ? 'none' : 'flex';
        this._renderDualCuesIntoBox(this.bottomBox, pBottom, sBottom, isDualMode);
      }
    }

    render(activeCues, offsetMs) {
      this.renderDual(activeCues, { top: [], bottom: [] }, { offsetMs, isDualMode: false });
    }

    clear() {
      if (this.topBox) { this.topBox.textContent = ''; this.topBox.style.display = 'none'; }
      if (this.bottomBox) { this.bottomBox.textContent = ''; this.bottomBox.style.display = 'none'; }
      this.lastTopText = this.lastBottomText = '';
      if (typeof this.onSubtitleHoverChange === 'function') this.onSubtitleHoverChange(false, 'unmount');
    }

    destroy() {
      this.cancelDrag();
      this._controlsHit?.destroy();
      this._controlsHit = null;
      document.body?.classList.remove('ottsub-active');
      if (this._onFullscreenChange) {
        ['fullscreenchange', 'webkitfullscreenchange'].forEach(e => { try { document.removeEventListener(e, this._onFullscreenChange); } catch (_) {} });
        this._onFullscreenChange = null;
        this._fullscreenWatchdogInitialized = false;
        this._fullscreenGeneration = (this._fullscreenGeneration || 0) + 1;
      }
      this._dpiWatchdogInitialized = false;
      this._dpiGeneration = (this._dpiGeneration || 0) + 1;
      this._clearDpiListener();
      if (this._resizeObserver) { try { this._resizeObserver.disconnect(); } catch (_) {} this._resizeObserver = null; this._observedVideo = null; }
      if (this._windowBlurHandler && typeof window !== 'undefined') { try { window.removeEventListener('blur', this._windowBlurHandler, { capture: true }); } catch (_) {} this._windowBlurHandler = null; }
      if (this._dragRafId) { cancelAnimationFrame(this._dragRafId); this._dragRafId = null; }
      this.isDragging = false;
      if (this.container?.parentElement) this.container.remove();
      this.container = this.topBox = this.bottomBox = null;
    }
  }

  window.OTTSubRendererClass = SubtitleRenderer;
  window.OTTSubRenderer = new SubtitleRenderer();
})();
