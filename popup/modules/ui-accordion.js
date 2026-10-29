/**
 * OTTSub - popup/modules/ui-accordion.js
 * Accordion panels collapse/expand logic, ARIA attributes, inert defense, and WAI-ARIA APG keyboard navigation.
 */

import { queuePopupStorageSave } from './storage.js';

export function setSubSettingsCollapsed(collapsed, save = true, hidePopoverFn = null) {
  const subSettingsCard = document.getElementById('subtitle-settings-card');
  const subSettingsToggleBtn = document.getElementById('sub-settings-toggle-btn');
  const subSettingsContent = document.getElementById('sub-settings-content');
  if (!subSettingsCard) return;
  if (typeof hidePopoverFn === 'function') hidePopoverFn();
  subSettingsCard.classList.toggle('collapsed', !!collapsed);
  if (subSettingsToggleBtn) {
    subSettingsToggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }
  if (subSettingsContent) {
    if (collapsed) subSettingsContent.setAttribute('inert', '');
    else subSettingsContent.removeAttribute('inert');
  }
  if (save) {
    queuePopupStorageSave('ottsub_sub_settings_collapsed', !!collapsed);
  }
}

export function setLangAdjustCollapsed(collapsed, save = true, hidePopoverFn = null) {
  const langAdjustCard = document.getElementById('lang-adjust-card');
  const langAdjustToggleBtn = document.getElementById('lang-adjust-toggle-btn');
  const langAdjustContent = document.getElementById('lang-adjust-content');
  if (!langAdjustCard) return;
  if (typeof hidePopoverFn === 'function') hidePopoverFn();
  langAdjustCard.classList.toggle('collapsed', !!collapsed);
  if (langAdjustToggleBtn) {
    langAdjustToggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }
  if (langAdjustContent) {
    if (collapsed) langAdjustContent.setAttribute('inert', '');
    else langAdjustContent.removeAttribute('inert');
  }
  if (save) {
    queuePopupStorageSave('ottsub_lang_adjust_collapsed', !!collapsed);
  }
}

export function setShortcutsCollapsed(collapsed, save = true, hidePopoverFn = null) {
  const shortcutsCard = document.getElementById('shortcuts-card');
  const shortcutsToggleBtn = document.getElementById('shortcuts-toggle-btn');
  const shortcutList = document.getElementById('shortcut-list');
  if (!shortcutsCard) return;
  if (typeof hidePopoverFn === 'function') hidePopoverFn();
  shortcutsCard.classList.toggle('collapsed', !!collapsed);
  if (shortcutsToggleBtn) {
    shortcutsToggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }
  if (shortcutList) {
    shortcutList.style.display = collapsed ? 'none' : 'flex';
    if (collapsed) shortcutList.setAttribute('inert', '');
    else shortcutList.removeAttribute('inert');
  }
  if (save) {
    queuePopupStorageSave('ottsub_shortcuts_collapsed', !!collapsed);
  }
}

export function setLearningCollapsed(collapsed, save = true, hidePopoverFn = null) {
  const learningCard = document.getElementById('learning-card');
  const learningToggleBtn = document.getElementById('learning-toggle-btn');
  const learningBody = document.getElementById('learning-body');
  if (!learningCard) return;
  if (typeof hidePopoverFn === 'function') hidePopoverFn();
  learningCard.classList.toggle('collapsed', !!collapsed);
  if (learningToggleBtn) {
    learningToggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }
  if (learningBody) {
    learningBody.style.display = collapsed ? 'none' : 'flex';
    if (collapsed) learningBody.setAttribute('inert', '');
    else learningBody.removeAttribute('inert');
  }
  if (save) {
    queuePopupStorageSave('ottsub_learning_collapsed', !!collapsed);
  }
}

// WAI-ARIA APG Accordion Header Keyboard Navigation (ArrowDown, ArrowUp, Home, End)
export function setupAccordionKeyboardNav(buttons) {
  const accordionButtons = (buttons || []).filter(Boolean);
  accordionButtons.forEach((btn, index) => {
    btn.addEventListener('keydown', e => {
      let targetIndex = -1;
      if (e.key === 'ArrowDown') {
        targetIndex = (index + 1) % accordionButtons.length;
      } else if (e.key === 'ArrowUp') {
        targetIndex = (index - 1 + accordionButtons.length) % accordionButtons.length;
      } else if (e.key === 'Home') {
        targetIndex = 0;
      } else if (e.key === 'End') {
        targetIndex = accordionButtons.length - 1;
      }
      if (targetIndex !== -1) {
        e.preventDefault();
        accordionButtons[targetIndex].focus();
      }
    });
  });
}

// Popup-wide Tab Focus Navigation Loop & Inert Bypass Defense
export function setupFocusNavigationLoop(popupContainer) {
  if (!popupContainer) return;
  popupContainer.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = Array.from(popupContainer.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.closest('[inert]') && !el.closest('.collapsed > .collapsible-content') && el.offsetParent !== null && window.getComputedStyle(el).visibility !== 'hidden');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first || !popupContainer.contains(document.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

export function setupAccordionAccessibility() {
  const subSettingsToggleBtn = document.getElementById('sub-settings-toggle-btn');
  const langAdjustToggleBtn = document.getElementById('lang-adjust-toggle-btn');
  const shortcutsToggleBtn = document.getElementById('shortcuts-toggle-btn');
  const learningToggleBtn = document.getElementById('learning-toggle-btn');
  setupAccordionKeyboardNav([subSettingsToggleBtn, langAdjustToggleBtn, shortcutsToggleBtn, learningToggleBtn]);
  const popupContainer = document.querySelector('.popup-container') || document.body;
  setupFocusNavigationLoop(popupContainer);
}

