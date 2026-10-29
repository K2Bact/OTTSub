/**
 * OTTSub - popup/modules/ui-popover.js
 * Status help explanations, popover layout positioning, aria announcements, and click/hover lifecycles.
 */

let currentPopoverTarget = null;

function getI18n() {
  return window.OTTSubI18n || { t: (k, p) => k };
}

export function paramsSanitize(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const clean = {};
  for (const k of Object.keys(obj)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    clean[k] = obj[k];
  }
  return clean;
}

export function getStatusExplanation(key, params = {}) {
  if (!key) return '';
  const i18n = getI18n();
  // The unavailable label is shared by both roles and includes missing CC/normal types.
  const descKey = key === 'language_unsupported' ? 'secondary_status_unsupported_desc'
    : key === 'track_download_pending' ? 'track_selection_needed' : `${key}_desc`;
  const translated = i18n.t(descKey, params);
  if (translated && translated !== descKey) {
    return ['sub_status_ready', 'secondary_status_ready'].includes(key)
      ? `${translated} ${i18n.t('cue_count_desc')}` : translated;
  }
  return i18n.t(key, params);
}

export function updatePopoverContent(targetEl) {
  const statusPopover = document.getElementById('status-popover');
  const popoverTitle = document.getElementById('popover-title');
  const popoverBody = document.getElementById('popover-body');
  const subStatus = document.getElementById('sub-status');
  const secondarySubStatus = document.getElementById('secondary-sub-status');
  if (!statusPopover || !targetEl) return;

  const key = targetEl.dataset.statusKey || '';
  let params = {};
  try {
    if (targetEl.dataset.statusParams) {
      params = paramsSanitize(JSON.parse(targetEl.dataset.statusParams));
    }
  } catch (_) {
    params = {};
  }
  const descText = getStatusExplanation(key, params);
  let titleText = targetEl.textContent || '';
  if (targetEl.id === 'row-primary-status' && subStatus) {
    titleText = subStatus.textContent || '';
  } else if (targetEl.id === 'row-secondary-status' && secondarySubStatus) {
    titleText = secondarySubStatus.textContent || '';
  }

  const i18n = getI18n();
  const cleanTitle = titleText.replace(/\.\.\.$/, '').trim();
  if (popoverTitle) {
    popoverTitle.textContent = cleanTitle ? `${i18n.t('status_help_title')} (${cleanTitle})` : i18n.t('status_help_title');
  }
  if (popoverBody) {
    popoverBody.textContent = descText;
  }
}

export function positionStatusPopover(targetEl) {
  const statusPopover = document.getElementById('status-popover');
  if (!statusPopover || !targetEl) return;
  const container = document.querySelector('.popup-container');
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  let top = (targetRect.bottom - containerRect.top) + 6;
  let left = (targetRect.left - containerRect.left);

  const popoverWidth = statusPopover.offsetWidth || 280;
  if (left + popoverWidth > containerRect.width - 12) {
    left = containerRect.width - popoverWidth - 12;
  }
  if (left < 12) {
    left = 12;
  }

  const popoverHeight = statusPopover.offsetHeight || 60;
  if (top + popoverHeight > containerRect.height - 10 && (targetRect.top - containerRect.top - popoverHeight - 6) > 10) {
    top = (targetRect.top - containerRect.top) - popoverHeight - 6;
  }

  statusPopover.style.top = `${Math.round(top)}px`;
  statusPopover.style.left = `${Math.round(left)}px`;
}

export function showStatusPopover(targetEl) {
  const statusPopover = document.getElementById('status-popover');
  if (!statusPopover || !targetEl) return;

  if (currentPopoverTarget && currentPopoverTarget !== targetEl) {
    currentPopoverTarget.setAttribute('aria-expanded', 'false');
  }
  currentPopoverTarget = targetEl;
  updatePopoverContent(targetEl);

  statusPopover.classList.add('visible', 'pinned');
  statusPopover.setAttribute('aria-hidden', 'false');
  targetEl.setAttribute('aria-expanded', 'true');
  targetEl.setAttribute('aria-controls', 'status-popover');

  positionStatusPopover(targetEl);
  document.getElementById('popover-close')?.focus?.({ preventScroll: true });
}

export function hideStatusPopover(restoreFocus = true) {
  const statusPopover = document.getElementById('status-popover');
  if (!statusPopover) return;
  const targetToFocus = currentPopoverTarget;
  if (restoreFocus && targetToFocus && typeof targetToFocus.focus === 'function') {
    try { targetToFocus.focus(); } catch (_) {}
  }
  // Outside clicks may leave focus on the close button if the target is not focusable.
  if (statusPopover.contains?.(document.activeElement)) document.activeElement?.blur?.();
  statusPopover.classList.remove('visible', 'pinned');
  statusPopover.setAttribute('aria-hidden', 'true');
  if (currentPopoverTarget) {
    currentPopoverTarget.setAttribute('aria-expanded', 'false');
  }
  currentPopoverTarget = null;
}

export function toggleStatusPopover(targetEl) {
  const statusPopover = document.getElementById('status-popover');
  const subStatus = document.getElementById('sub-status');
  const secondarySubStatus = document.getElementById('secondary-sub-status');
  if (!statusPopover || !targetEl) return;

  const isCurrentlyOpenForThis = statusPopover.classList.contains('visible') && 
    (currentPopoverTarget === targetEl || 
     (targetEl.id === 'row-primary-status' && currentPopoverTarget === subStatus) ||
     (targetEl.id === 'row-secondary-status' && currentPopoverTarget === secondarySubStatus) ||
     (targetEl === subStatus && currentPopoverTarget?.id === 'row-primary-status') ||
     (targetEl === secondarySubStatus && currentPopoverTarget?.id === 'row-secondary-status'));

  if (isCurrentlyOpenForThis) {
    hideStatusPopover();
  } else {
    showStatusPopover(targetEl);
  }
}

export function updateStatusHelpAttributes(badgeKey, subKey, subParams = {}, secKey, secParams = {}) {
  const statusBadge = document.getElementById('status-badge');
  const subStatus = document.getElementById('sub-status');
  const secondarySubStatus = document.getElementById('secondary-sub-status');
  const rowPrimaryStatus = document.getElementById('row-primary-status');
  const rowSecondaryStatus = document.getElementById('row-secondary-status');
  const statusPopover = document.getElementById('status-popover');

  if (statusBadge) {
    statusBadge.dataset.statusKey = badgeKey;
    statusBadge.dataset.statusParams = JSON.stringify(paramsSanitize(badgeKey ? {} : {}));
    const desc = getStatusExplanation(badgeKey);
    statusBadge.setAttribute('aria-label', `${statusBadge.textContent || ''}: ${desc}`);
  }
  if (subStatus) {
    subStatus.dataset.statusKey = subKey;
    const subParamsJson = JSON.stringify(paramsSanitize(subParams));
    subStatus.dataset.statusParams = subParamsJson;
    const desc = getStatusExplanation(subKey, subParams);
    subStatus.setAttribute('aria-label', `${subStatus.textContent || ''}: ${desc}`);
    if (rowPrimaryStatus) {
      rowPrimaryStatus.dataset.statusKey = subKey;
      rowPrimaryStatus.dataset.statusParams = subParamsJson;
      rowPrimaryStatus.setAttribute('aria-label', `${subStatus.textContent || ''}: ${desc}`);
    }
  }
  if (secondarySubStatus) {
    secondarySubStatus.dataset.statusKey = secKey;
    const secParamsJson = JSON.stringify(paramsSanitize(secParams));
    secondarySubStatus.dataset.statusParams = secParamsJson;
    const desc = getStatusExplanation(secKey, secParams);
    secondarySubStatus.setAttribute('aria-label', `${secondarySubStatus.textContent || ''}: ${desc}`);
    if (rowSecondaryStatus) {
      rowSecondaryStatus.dataset.statusKey = secKey;
      rowSecondaryStatus.dataset.statusParams = secParamsJson;
      rowSecondaryStatus.setAttribute('aria-label', `${secondarySubStatus.textContent || ''}: ${desc}`);
    }
  }
  if (currentPopoverTarget && statusPopover && statusPopover.classList.contains('visible')) {
    updatePopoverContent(currentPopoverTarget);
    positionStatusPopover(currentPopoverTarget);
  }
}
