/**
 * OTTSub - hud.js
 * Minimal dark HUD notification overlay positioned in top-right screen.
 */
(() => {
  'use strict';

  class HUDNotification {
    constructor() {
      this.hudElem = null;
      this.timer = null;
      this._pendingRafId = null;
      this._lastMessageId = 0;
    }

    _ensureElement() {
      const targetParent = document.fullscreenElement || document.webkitFullscreenElement || document.body || document.documentElement;
      if (!targetParent) return this.hudElem;

      if (!this.hudElem || !this.hudElem.isConnected) {
        if (!this.hudElem) {
          this.hudElem = document.createElement('div');
          this.hudElem.id = 'ottsub-hud';
          this.hudElem.className = 'ottsub-hud ottsub-hud-hidden';
          this.hudElem.setAttribute('role', 'status');
          this.hudElem.setAttribute('aria-live', 'polite');
          this.hudElem.setAttribute('aria-atomic', 'true');
        }
        targetParent.appendChild(this.hudElem);
      } else if (this.hudElem.parentElement !== targetParent) {
        // Safe DOM reparenting: moves node without destroying DOM state or CSS transitions
        targetParent.appendChild(this.hudElem);
      }
      return this.hudElem;
    }

    /**
     * Re-parent HUD when switching fullscreen modes
     */
    reparent() {
      if (this.hudElem) {
        this._ensureElement();
      }
      const parent = document.fullscreenElement || document.webkitFullscreenElement || document.body;
      if (this.recoveryElem && parent && this.recoveryElem.parentElement !== parent) parent.appendChild(this.recoveryElem);
    }

    setRecoveryNotice(message, buttonLabel, onShowNative, lang = 'en') {
      if (!message) { this.recoveryElem?.remove(); this.recoveryElem = null; this.recoveryAction = null; return; }
      this.recoveryAction = onShowNative;
      if (this.recoveryElem) {
        this.recoveryElem.lang = lang;
        this.recoveryElem.dir = ['ar', 'he'].includes(lang.split('-')[0]) ? 'rtl' : 'ltr';
        const text = this.recoveryElem.querySelector('span'), button = this.recoveryElem.querySelector('button');
        if (text.textContent !== message) text.textContent = message;
        if (button.textContent !== buttonLabel) button.textContent = buttonLabel;
        this.reparent(); return;
      }
      const box = document.createElement('div');
      box.lang = lang;
      box.dir = ['ar', 'he'].includes(lang.split('-')[0]) ? 'rtl' : 'ltr';
      box.className = 'ottsub-recovery-notice'; box.setAttribute('role', 'status');
      const text = document.createElement('span'); text.textContent = message;
      const button = document.createElement('button'); button.type = 'button'; button.textContent = buttonLabel;
      for (const name of ['pointerdown', 'pointerup', 'mousedown', 'mouseup']) button.addEventListener(name, e => e.stopPropagation());
      button.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); });
      button.addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); });
      button.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); this.recoveryAction?.(); });
      box.append(text, button); this.recoveryElem = box; this.reparent();
    }

    /**
     * Destroy HUD overlay and cancel pending timer
     */
    destroy() {
      this.setRecoveryNotice(null);
      if (this.timer !== null) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      if (this._pendingRafId !== null) {
        cancelAnimationFrame(this._pendingRafId);
        this._pendingRafId = null;
      }
      if (this.hudElem && this.hudElem.parentElement) {
        try { this.hudElem.remove(); } catch (_) {}
      }
      this.hudElem = null;
    }

    _setMessage(elem, message) {
      if (elem.dir !== 'rtl') { elem.textContent = message; return; }
      // A block's RTL direction does not isolate a leading sign from its value.
      // Keep computed time/size tokens LTR without interpreting any message HTML.
      elem.textContent = '';
      let start = 0;
      for (const match of message.matchAll(/[+\-\u2212\u00b1]?\d+(?:\.\d+)?(?:s|px|%)(?![A-Za-z])/g)) {
        elem.appendChild(document.createTextNode(message.slice(start, match.index)));
        const token = document.createElement('bdi');
        token.dir = 'ltr'; token.textContent = match[0];
        elem.appendChild(token);
        start = match.index + match[0].length;
      }
      elem.appendChild(document.createTextNode(message.slice(start)));
    }

    /**
     * Show HUD message with auto fade-out after durationMs
     */
    show(message, durationMs = 1500, lang = 'en') {
      const safeMessage = (message !== null && message !== undefined) ? String(message).trim() : '';
      if (!safeMessage) return;

      const elem = this._ensureElement();
      if (!elem) return;
      elem.lang = lang;
      elem.dir = ['ar', 'he'].includes(lang.split('-')[0]) ? 'rtl' : 'ltr';

      const safeDuration = (typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs > 0)
        ? durationMs
        : 1500;

      // Clear any pending fade-out timer cleanly
      if (this.timer !== null) {
        clearTimeout(this.timer);
        this.timer = null;
      }

      // Cancel any in-flight rAF callback to prevent stale text overwrites
      if (this._pendingRafId !== null) {
        cancelAnimationFrame(this._pendingRafId);
        this._pendingRafId = null;
      }

      const currentMsgId = ++this._lastMessageId;

      // If repeating identical message, clear across a tick so screen readers register the new announcement
      if (elem.textContent === safeMessage) {
        elem.textContent = '';
        if (typeof requestAnimationFrame === 'function') {
          this._pendingRafId = requestAnimationFrame(() => {
            this._pendingRafId = null;
            if (this.hudElem === elem && this._lastMessageId === currentMsgId) {
              this._setMessage(elem, safeMessage);
            }
          });
        } else {
          this._setMessage(elem, safeMessage);
        }
      } else {
        this._setMessage(elem, safeMessage);
      }

      elem.classList.remove('ottsub-hud-hidden');
      elem.classList.add('ottsub-hud-visible');

      this.timer = setTimeout(() => {
        if (this.hudElem) {
          this.hudElem.classList.remove('ottsub-hud-visible');
          this.hudElem.classList.add('ottsub-hud-hidden');
        }
        this.timer = null;
      }, safeDuration);
    }
  }

  window.OTTSubHUDClass = HUDNotification;
  window.OTTSubHUD = new HUDNotification();
})();
