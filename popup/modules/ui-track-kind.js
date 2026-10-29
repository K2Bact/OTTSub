import { queuePopupStorageSave } from './storage.js';

const selected = { primary: 'auto', secondary: 'auto' };
const edited = new Set();
let lastStatus = null;

export function restoreTrackKind(side, kind, initial = false) {
  if (!Object.hasOwn(selected, side) || !['auto', 'normal', 'cc'].includes(kind)
    || initial && edited.has(side)) return;
  selected[side] = kind;
  populateTrackKinds(lastStatus);
}

export function populateTrackKinds(status = lastStatus) {
  lastStatus = status;
  const policy = window.OTTSubTrackLanguages, i18n = window.OTTSubI18n;
  for (const side of ['primary', 'secondary']) {
    const select = document.getElementById(`${side}-track-kind`);
    if (!select) continue;
    const lang = document.getElementById(`${side}-lang-select`)?.value;
    const tracks = status?.availableTracks;
    const usable = Array.isArray(tracks) ? tracks.filter(track => {
      const code = policy?.code(track?.bcp47 || track?.language);
      return code && (lang === 'auto' || policy.compatible(lang, code));
    }) : null;
    select.dataset.availability = !usable ? 'unknown'
      : selected[side] === 'auto' || usable.some(track => policy.trackKind(track) === selected[side]) ? 'available' : 'unsupported';
    const options = ['auto', 'normal', 'cc'].map(kind => {
      const disabled = kind !== 'auto' && (!usable || !usable.some(track => policy.trackKind(track) === kind));
      const fullLabel = i18n.t(`track_kind_${kind}`);
      const label = (kind === 'cc' ? 'CC' : fullLabel) + (kind === selected[side] && disabled
        ? ` — ${i18n.t(usable ? 'language_unsupported' : 'language_checking')}` : '');
      return {kind, label, fullLabel, disabled};
    });
    const signature = JSON.stringify(options);
    if (select.dataset.options !== signature) {
      select.replaceChildren(...options.map(({kind, label, fullLabel, disabled}) => Object.assign(new Option(label, kind), {disabled, title: fullLabel})));
      select.dataset.options = signature;
    }
    select.value = selected[side];
    select.title = options.find(option => option.kind === selected[side])?.fullLabel || '';
  }
}

export function setupTrackKindControls(sendCommand) {
  populateTrackKinds();
  for (const side of ['primary', 'secondary']) {
    const select = document.getElementById(`${side}-track-kind`);
    select?.addEventListener('change', () => {
      if (!['auto', 'normal', 'cc'].includes(select.value)) return;
      selected[side] = select.value; edited.add(side);
      queuePopupStorageSave(`ottsub_${side}_track_kind`, select.value);
      sendCommand(`set_${side}_track_kind`, {kind: select.value});
      populateTrackKinds();
    });
    document.getElementById(`${side}-lang-select`)?.addEventListener('change', () => populateTrackKinds());
  }
}
