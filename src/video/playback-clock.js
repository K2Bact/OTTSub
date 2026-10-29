// Pure clock verification. User sync offsets are not inputs; text remains local.
(() => {
  'use strict';
  const normalize = text => String(text || '').normalize('NFC').replace(/\s+/g, ' ').trim();
  class PlaybackClock {
    constructor() { this.tracks = []; this.index = new Map(); this.reset(); }
    reset(keepSession = false) {
      this.referenceContinuity = null;
      this.seekProof = null;
      this.sessionProof = null; this.adProof = null;
      this.progressProof = null;
      this.progressRejected = false;
      this.recoveryWitnesses = new Map();
      this.selected = null; this.evidence = new Map(); this.previous = null;
      this.mismatches = 0; this.lastSample = null;
      this.calibration = null;
      this.calibrationAllowed = false;
      if (!keepSession) this.sessionAnchor = null;
    }
    beginSeek(now) {
      const selected = this.selected, previous = this.lastSample, proof = this.sessionProof;
      const retained = this.seekProof;
      const eligible = selected?.source === 'video' && proof?.ready && previous
        && selected.track === proof.track && now >= proof.at && now - proof.at < 500
        && now >= previous.at && now - previous.at < 500;
      const hint = eligible ? { video: proof.video, rate: proof.rate, track: proof.track,
        key: proof.key, session: proof.session, unit: proof.unit, bias: proof.bias,
        offset: selected.offset || 0, startedAt: now, points: [] } : retained;
      this.reset();
      // A hint is never display permission. New destination responses must agree.
      if (hint && now >= hint.startedAt && now - hint.startedAt < 5000) this.seekProof = { ...hint, points: [] };
    }
    restoreAfterSeek(sample, now) {
      const p = this.seekProof;
      if (!p) return null;
      if (now < p.startedAt || now - p.startedAt >= 5000 || sample.video !== p.video
        || sample.rate !== p.rate || sample.hidden || sample.pauseAd
        || sample.nativeVerification !== 'ready' || sample.nativeTrack?.status !== 'selected'
        || `native:${sample.nativeTrack.id}` !== p.track) { this.seekProof = null; return null; }
      if (sample.seeking || sample.paused || sample.readyState < 2 || sample.adSignal !== 'absent') return null;
      const a = this.sessionAnchor, o = sample.session;
      if (a && a.session !== p.session) { this.seekProof = null; return null; }
      if (!a || !o || o.at <= p.startedAt
        || now < o.at || now - o.at >= 500) return null;
      const c = this.candidates(sample, now).find(c => c.key === p.key);
      if (!c || Math.abs(c.time + p.bias - (sample.mediaTime - p.offset)) > 0.25) {
        p.points = []; return null;
      }
      if (!p.points.some(point => point.raw === a.raw)) p.points.push({ raw: a.raw, at: o.at, media: sample.mediaTime });
      while (p.points.length > 3) p.points.shift();
      const first = p.points[0], last = p.points.at(-1);
      if (p.points.length < 2 || last.at - first.at < 200 || last.raw <= first.raw || last.media <= first.media) return null;
      this.seekProof = null;
      return { key: 'video-calibrated', source: 'video', offset: p.offset, track: p.track,
        time: sample.mediaTime - p.offset, verification: 'seek-session-confirmed' };
    }
    referenceClockAgrees(sample, now, proof = this.referenceContinuity) {
      const o = sample?.session, last = this.lastSample;
      if (!proof || !last || !this.selected || !o || o.status !== 'ok'
        || sample.adSignal !== 'absent' || sample.hidden || sample.pauseAd || sample.seeking
        || sample.readyState < 2 || sample.video !== proof.video || sample.rate !== proof.rate
        || o.video !== proof.video || o.session !== proof.session || now < o.at || now - o.at >= 500
        || now < last.at || now - last.at >= 1000 || !Number.isFinite(o.videoTime)
        || o.playback?.adValue === 'true' || o.playback?.adValue === 'object' || o.open?.adState === 'start') return false;
      const raw = proof.key.includes(':playback:') ? o.playback?.raw : o.open?.raw;
      const offset = this.selected.offset || 0;
      return Number.isFinite(raw) && Math.abs(raw / proof.unit + proof.bias - (o.videoTime - offset)) <= 0.5;
    }
    setTracks(tracks, sample = null, now = 0) {
      if (tracks.length === this.tracks.length && tracks.every((t, i) => t.key === this.tracks[i].key && t.cues === this.tracks[i].cues)) return;
      if ([...tracks, ...this.tracks].some(t => t.key.startsWith('native:'))) {
        const proof = this.referenceContinuity || (this.sessionProof?.ready ? this.sessionProof : null);
        const keepVideo = this.selected?.source === 'video' && this.referenceClockAgrees(sample, now, proof);
        // A session-progress clock already checks ownership, freshness and drift
        // on every sample. A new text reference is not new playback ownership.
        const keepProgress = sample && this.selected?.verification === 'session-progress'
          && sample.adSignal === 'absent' && !sample.seeking && sample.readyState >= 2
          && !sample.hidden && !sample.pauseAd;
        if (!keepVideo && !keepProgress) this.reset();
        else {
          this.referenceContinuity = keepVideo ? { key: proof.key, unit: proof.unit, bias: proof.bias,
            video: proof.video, rate: proof.rate, session: proof.session } : null;
          this.seekProof = this.adProof = this.sessionProof = null;
          this.recoveryWitnesses.clear();
        }
      }
      this.tracks = tracks;
      this.index = new Map();
      for (const track of tracks) {
        const groups = new Map();
        for (const cue of track.cues.slice(0, 10000)) {
          if (!Number.isFinite(cue.begin) || !Number.isFinite(cue.end)) continue;
          const key = `${cue.begin}:${cue.end}`;
          if (!groups.has(key)) groups.set(key, { begin: cue.begin, end: cue.end, parts: [] });
          groups.get(key).parts.push(cue.plainText ?? cue.text);
        }
        for (const cue of groups.values()) {
          const text = normalize(cue.parts.join(' '));
          if (!text) continue;
          const matches = this.index.get(text) || [];
          matches.push({ track: track.key, begin: cue.begin });
          this.index.set(text, matches);
        }
      }
      // Track changes invalidate evidence, but a verified clock can monitor the new track.
      this.evidence.clear(); this.previous = null; this.mismatches = 0;
      this.calibration = null;
      this.calibrationAllowed = false;
    }
    rememberSession(sample, now) {
      // Only an exact native track and independently verified video clock can
      // teach a session relationship. Never learn from a session's own output.
      const selected = this.selected;
      if (selected?.source !== 'video' || sample.nativeVerification !== 'ready'
        || selected.track !== `native:${sample.nativeTrack?.id}` || sample.paused) {
        this.sessionProof = null; return;
      }
      const matches = this.candidates(sample, now).filter(c => c.source === 'session'
        && Math.abs(c.time - selected.time) <= 0.5);
      if (matches.length !== 1) { this.sessionProof = null; return; }
      const c = matches[0], a = this.sessionAnchor;
      let p = this.sessionProof;
      if (!p || p.key !== c.key || p.track !== selected.track || p.video !== sample.video) {
        p = this.sessionProof = { key: c.key, session: c.session, unit: c.unit,
          video: sample.video, track: selected.track, rate: sample.rate, values: new Map() };
      }
      // Sample once per raw update; repeated polls are not independent evidence.
      if (!p.values.has(a.raw)) p.values.set(a.raw, { at: now, bias: selected.time - c.time });
      while (p.values.size > 5) p.values.delete(p.values.keys().next().value);
      const values = [...p.values.values()], biases = values.map(v => v.bias).sort((x, y) => x - y);
      p.ready = values.length >= 2 && values.at(-1).at - values[0].at >= 500
        && biases.at(-1) - biases[0] <= 0.25;
      p.bias = biases[Math.floor(biases.length / 2)]; p.at = now; p.raw = a.raw;
    }
    validAdProof(p, sample, now) {
      const o = sample.session;
      if (!p || !o) return false;
      const raw = p.key.includes(':playback:') ? o.playback?.raw : o.open?.raw;
      const delta = (raw - p.startRaw) / p.unit;
      return Number.isFinite(raw) && delta >= -0.5 && delta <= 2 + (now - p.lastPositiveAt) / 1000 * p.rate
        && sample.video === p.video && sample.rate === p.rate && !sample.seeking
        && !sample.hidden && !sample.pauseAd && sample.readyState >= 2
        && now >= p.lastAt && now - p.lastAt < 1000 && now - p.startedAt < 180000
        && o?.status === 'ok' && o.video === p.video && o.session === p.session
        && now >= o.at && now - o.at < 1000
        && sample.nativeTrack?.status === 'selected' && `native:${sample.nativeTrack.id}` === p.track;
    }
    suspendForAd(sample, now) {
      const seek = sample.adSignal === 'unknown' && sample.domAdSignal === 'absent'
        && sample.sessionAdSignal !== 'present' ? this.seekProof : null;
      let p = this.adProof;
      if (p?.resumedAt !== undefined && sample.adSignal === 'present') p = null;
      if (!p && sample.adSignal === 'present' && this.sessionProof?.ready
        && this.lastSample && now - this.lastSample.at < 1000) {
        p = { ...this.sessionProof, startedAt: now, lastAt: this.sessionProof.at,
          startRaw: this.sessionProof.raw, lastPositiveAt: now };
      }
      if (!this.validAdProof(p, sample, now)) p = null;
      if (p) {
        // An ad may settle briefly at entry, but a clock that runs throughout
        // the ad cannot inherit content-time trust. No ad-duration subtraction.
        p.lastAt = now;
        if (sample.adSignal === 'present') p.lastPositiveAt = now;
      }
      this.reset();
      this.adProof = p;
      if (seek && now >= seek.startedAt && now - seek.startedAt < 5000) this.seekProof = seek;
    }
    restoreAfterAd(sample, now, match, candidates, tolerance) {
      const p = this.adProof;
      if (!p) return null;
      // A fresh unique onset is still required. Prior proof narrows the check;
      // it never grants display merely because an ad indicator disappeared.
      this.adProof = null;
      const c = candidates.find(c => c.key === p.key);
      if ((!sample.allowCalibration && this.selected?.verification !== 'session-progress') || sample.sessionAdReason !== 'session-progress'
        || sample.nativeVerification !== 'ready' || match.track !== p.track || !c
        || Math.abs(c.time + p.bias - match.begin) > tolerance) return null;
      const offset = sample.mediaTime - match.begin;
      if (!Number.isFinite(offset) || Math.abs(offset) > 21600) return null;
      return { key: 'video-calibrated', source: 'video', offset, track: match.track, time: match.begin,
        verification: 'ad-memory-onset' };
    }
    observeCalibration(sample, match, tolerance) {
      if (!this.calibrationAllowed || !Number.isFinite(sample.mediaTime)) return null;
      const delta = sample.mediaTime - match.begin;
      if (Math.abs(delta) > 21600) { this.calibration = null; return null; }
      let evidence = this.calibration;
      if (!evidence || evidence.track !== match.track || Math.abs(delta - evidence.anchor) > tolerance) {
        evidence = this.calibration = { track: match.track, anchor: delta, values: new Map() };
      }
      // Only three distinct, recent onsets are needed. Repeated dialogue is not
      // another vote, and long playback must not grow this map without a bound.
      evidence.values.set(match.begin, delta);
      while (evidence.values.size > 3) evidence.values.delete(evidence.values.keys().next().value);
      const begins = [...evidence.values.keys()];
      const offsets = [...evidence.values.values()].sort((a, b) => a - b);
      if (offsets.length < 3 || Math.max(...begins) - Math.min(...begins) < 1
        || offsets.at(-1) - offsets[0] > tolerance) return null;
      const offset = offsets[1];
      return { key: 'video-calibrated', source: 'video', offset, track: match.track, time: sample.mediaTime - offset };
    }
    observeRecoveryWitness(sample, now, match, candidates, onset, first, tolerance) {
      if ((!sample.allowCalibration && !this.calibrationAllowed) || sample.nativeVerification !== 'ready'
        || sample.hidden || sample.pauseAd
        || sample.nativeTrack?.status !== 'selected' || match.track !== `native:${sample.nativeTrack.id}`
        || sample.adSignal !== 'absent' || sample.sessionAdReason !== 'session-progress'
        || this.selected?.source === 'video' || (!onset && !first)) return null;
      const winners = [];
      for (const c of candidates.filter(c => c.source === 'session')) {
        const delta = c.time - match.begin, old = this.recoveryWitnesses.get(c.key);
        // Already-visible text can witness the session value near cue begin,
        // but cannot supply a video onset or select any clock by itself.
        if (Math.abs(delta) > tolerance * (onset ? 2 : 1)) {
          this.recoveryWitnesses.delete(c.key); continue;
        }
        if (old?.begin === match.begin) continue;
        const offset = onset ? sample.mediaTime - match.begin : null;
        this.recoveryWitnesses.set(c.key, { track: match.track, begin: match.begin, delta, offset,
          raw: this.sessionAnchor.raw, at: now });
        if (!onset || !old || old.track !== match.track || match.begin - old.begin < 1
          || now <= old.at || now - old.at > 30000 || this.sessionAnchor.raw <= old.raw) continue;
        if (old.offset === null) {
          if (Math.abs(delta) <= tolerance && Math.abs(delta - old.delta) <= tolerance) {
            winners.push({ ...c, track: match.track, verification: 'session-visible-witness' });
          }
        } else if (Number.isFinite(offset) && Math.abs(offset) <= 21600
          && Math.abs(offset - old.offset) <= tolerance && Math.abs(delta - old.delta) <= tolerance
          && Math.min(Math.abs(delta), Math.abs(old.delta)) <= tolerance
          && Math.max(Math.abs(delta), Math.abs(old.delta)) > tolerance) {
          // Two real onsets agree on video offset AND an owner-bound session
          // agrees on their progression, with at least one absolute time match.
          const calibratedOffset = (offset + old.offset) / 2;
          winners.push({ key: 'video-calibrated', source: 'video', offset: calibratedOffset,
            track: match.track, time: sample.mediaTime - calibratedOffset, verification: 'session-corroborated-onsets' });
        }
      }
      return winners.length && winners.every(c => Math.abs(c.time - winners[0].time) <= tolerance) ? winners[0] : null;
    }
    updateSession(sample, now) {
      const o = sample.session, p = o?.playback, open = o?.open?.status === 'ok' ? o.open : null;
      if (!o || o.status !== 'ok' || o.video !== sample.video || now < o.at || now - o.at >= 1000
        || p?.adValue === 'object' || p?.adValue === 'true' || open?.adState === 'start'
        || sample.seeking || sample.readyState < 2) { this.sessionAnchor = null; return; }
      const origin = Number.isFinite(p?.raw) ? 'playback' : Number.isFinite(open?.raw) ? 'open' : null;
      const raw = origin === 'playback' ? p.raw : open?.raw;
      if (!origin || raw < 0) { this.sessionAnchor = null; return; }
      let a = this.sessionAnchor;
      if (!a || a.session !== o.session || a.origin !== origin || a.video !== sample.video
        || a.raw !== raw || a.rate !== sample.rate || now < a.lastAt) {
        a = this.sessionAnchor = { session: o.session, origin, video: sample.video, raw,
          changedAt: o.at, elapsed: 0, lastAt: o.at, rate: sample.rate, paused: sample.paused };
      }
      if (!a.paused) a.elapsed += Math.max(0, now - a.lastAt) / 1000 * a.rate;
      a.lastAt = now; a.paused = sample.paused; a.freshAt = o.at;
      a.otherRaw = Number.isFinite(p?.raw) && Number.isFinite(open?.raw) ? open.raw : null;
    }
    candidates(sample, now) {
      const list = [];
      if (Number.isFinite(sample.mediaTime) && sample.mediaTime >= 0) list.push({ key: 'video', time: sample.mediaTime, source: 'video' });
      if (this.selected?.key === 'video-calibrated' && Number.isFinite(sample.mediaTime)) {
        list.push({ key: 'video-calibrated', source: 'video', offset: this.selected.offset, time: sample.mediaTime - this.selected.offset });
      }
      const p = sample.player;
      if (p && Number.isFinite(p.raw) && p.raw >= 0 && Number.isFinite(p.videoTime) && now >= p.at && now - p.at < 1000) {
        for (const unit of [1, 1000]) list.push({ key: `player:${p.session}:${unit}`, source: 'player', session: p.session, unit,
          time: p.raw / unit + (sample.mediaTime - p.videoTime), pair: p });
      }
      const a = this.sessionAnchor;
      if (a && a.video === sample.video && now >= a.lastAt && now - a.freshAt < 1000 && now - a.changedAt < 2000) {
        for (const unit of [1, 1000]) {
          // Disagreeing APIs are not two independent votes for the same clock.
          if (a.otherRaw !== null && Math.abs(a.raw - a.otherRaw) / unit > 0.5) continue;
          const time = a.raw / unit + a.elapsed + (a.paused ? 0 : (now - a.lastAt) / 1000 * a.rate);
          list.push({ key: `session:${a.session}:${a.origin}:${unit}`, source: 'session', session: a.session, unit, time,
            pair: { time, at: now, rate: a.rate, paused: a.paused, expires: Math.min(a.freshAt + 1000, a.changedAt + 2000) } });
        }
      }
      return list;
    }
    observe(sample, now) {
      const selected = this.observeClock(sample, now);
      this.rememberSession(sample, now);
      return selected;
    }
    observeSessionProgress(sample, now) {
      // Establish units and continuity even when no dialogue is available, from
      // distinct owner-bound content-session updates, never getCurrentTime or
      // an ad-duration estimate. This is session evidence, not dialogue proof.
      const o = sample.session, a = this.sessionAnchor;
      const revoke = () => { this.progressProof = null; this.selected = null; return null; };
      if (this.progressRejected || (!sample.allowCalibration && this.selected?.verification !== 'session-progress')
        || sample.adSignal !== 'absent' || sample.sessionAdReason !== 'session-progress'
        || sample.hidden || sample.pauseAd || sample.seeking || sample.readyState < 2
        || !a || !Number.isFinite(o?.videoTime) || !Number.isFinite(sample.mediaTime)
        || !Number.isFinite(sample.rate) || sample.rate <= 0) return revoke();
      const key = `session:${a.session}:${a.origin}`;
      let p = this.progressProof;
      if (!p || p.key !== key || p.video !== sample.video || p.rate !== sample.rate) {
        this.selected = null;
        p = this.progressProof = { key, video: sample.video, rate: sample.rate,
          points: [], raw: null, changedAt: now, paused: sample.paused };
      }
      if (p.paused && !sample.paused) p.changedAt = now;
      p.paused = sample.paused;
      if (p.raw !== a.raw) {
        if (p.raw !== null && a.raw < p.raw) return revoke();
        if (this.selected && Math.abs(o.videoTime - a.raw / this.selected.unit - this.selected.offset) > 0.75) return revoke();
        p.raw = a.raw; p.changedAt = now;
        if (!sample.paused && (!p.points.length || o.at - p.points.at(-1).at >= 200)) {
          p.points.push({ raw: a.raw, media: o.videoTime, at: o.at });
          while (p.points.length > 8) p.points.shift();
        }
      }
      // A paused player may legitimately hold a raw value indefinitely, but
      // fresh replies must still arrive. Playing with a frozen API expires.
      if (!sample.paused && now - p.changedAt >= 2000) return revoke();
      const first = p.points[0], last = p.points.at(-1);
      let selected = this.selected;
      if (!selected) {
        if (sample.paused || p.points.length < 3 || last.at - first.at < 1000) return null;
        const units = [1, 1000].filter(unit => {
          const offsets = p.points.map(point => point.media - point.raw / unit);
          return last.raw > first.raw && last.media - first.media >= 0.4
            && Math.max(...offsets) - Math.min(...offsets) <= 0.5;
        });
        if (units.length !== 1) return null;
        const unit = units[0], offsets = p.points.map(point => point.media - point.raw / unit).sort((x,y)=>x-y);
        selected = { key: `${key}:${unit}`, source: 'session', session: a.session, unit,
          track: 'session-only', verification: 'session-progress', offset: offsets[Math.floor(offsets.length / 2)] };
      }
      if (a.otherRaw !== null && Math.abs(a.raw - a.otherRaw) / selected.unit > 0.5) return revoke();
      // Keep a continuous media-relative anchor rather than jumping at every
      // stepped API update. New distinct values must continue to corroborate it.
      if (last && Math.abs(last.media - last.raw / selected.unit - selected.offset) > 0.75) return revoke();
      return this.selected = { ...selected, time: sample.mediaTime - selected.offset,
        validUntil: Math.min(a.freshAt + 1000, sample.paused ? Infinity : p.changedAt + 2000) };
    }
    observeClock(sample, now) {
      const previousSample = this.lastSample;
      const elapsed = previousSample ? (now - previousSample.at) / 1000 : 0;
      const jump = previousSample && (sample.video !== previousSample.video || sample.rate !== previousSample.rate
        || sample.mediaTime < previousSample.mediaTime - 0.05
        || sample.mediaTime - previousSample.mediaTime > Math.max(0, elapsed) * Math.max(1, sample.rate || 1) + 0.5);
      if (jump || sample.seeking || sample.readyState < 2 || (previousSample && elapsed > 1)) {
        const seek = sample.seeking ? this.seekProof : null;
        this.reset();
        if (seek && now >= seek.startedAt && now - seek.startedAt < 5000) this.seekProof = seek;
      }
      if (this.adProof) {
        if (!this.validAdProof(this.adProof, sample, now)) this.adProof = null;
        else {
          const p = this.adProof;
          p.resumedAt ??= now; p.lastAt = now;
          if (now - p.resumedAt >= 10000) this.adProof = null;
        }
      }
      this.lastSample = { ...sample, at: now };
      this.updateSession(sample, now);
      if (this.referenceContinuity && !this.referenceClockAgrees(sample, now)) this.reset(true);
      const seekRestored = this.restoreAfterSeek(sample, now);
      if (seekRestored) this.selected = seekRestored;
      if (sample.nativeVerification === 'off' && !this.referenceContinuity) return this.observeSessionProgress(sample, now);
      // Native ON may recover before its next spoken line, but only with the
      // exact selected reference ready. Keep dialogue verification available
      // for correction/handoff; session progress is not independent cue proof.
      const exactNative = sample.nativeVerification === 'ready' && sample.nativeTrack?.status === 'selected'
        && this.tracks.some(t => t.key === `native:${sample.nativeTrack.id}`);
      if ((exactNative && !this.selected) || this.selected?.verification === 'session-progress') {
        this.observeSessionProgress(sample, now);
      }
      const candidates = this.candidates(sample, now);
      for (const key of this.evidence.keys()) if (!candidates.some(c => c.key === key)) this.evidence.delete(key);
      for (const key of this.recoveryWitnesses.keys()) if (!candidates.some(c => c.key === key)) this.recoveryWitnesses.delete(key);
      if (this.selected && this.selected.verification !== 'session-progress') {
        const candidate = candidates.find(c => c.key === this.selected.key);
        if (!candidate) this.reset(true);
        else {
          const projected = this.baseTime(sample.mediaTime, now);
          if (!Number.isFinite(projected) || Math.abs(candidate.time - projected) > 0.5) this.reset(true);
          else this.selected = { ...this.selected, ...candidate };
        }
      }
      const text = normalize(sample.nativeText);
      const previous = this.previous;
      this.previous = { text, at: now };
      if (sample.seeking || sample.readyState < 2 || sample.paused || !text) return this.selected;
      const matches = this.index.get(text);
      if (!matches || matches.length !== 1) return this.selected;
      const match = matches[0], tolerance = 0.25 * Math.max(1, sample.rate || 1);
      const onset = !!previous && text !== previous.text && now > previous.at && now - previous.at <= 250;
      if (!onset) {
        if (!previous) this.observeRecoveryWitness(sample, now, match, candidates, false, true, tolerance);
        return this.selected;
      }
      const sessionProgress = this.selected?.verification === 'session-progress';
      if (sessionProgress && exactNative && match.track === `native:${sample.nativeTrack.id}`
        && Math.abs(this.selected.time - match.begin) > 0.75) {
        // A real unique onset disproves the provisional session relationship.
        // Do not reacquire the same bad proof in the next polling window.
        this.reset(true); this.progressRejected = true; return null;
      }
      const restored = (!this.selected || sessionProgress) && this.restoreAfterAd(sample, now, match, candidates, tolerance);
      if (restored) { this.selected = restored; return restored; }
      // Recovery permission may outlive the gate's first confirmation, but only
      // within this uninterrupted clock/track epoch. Every reset revokes it.
      if (sample.allowCalibration === true || sessionProgress) this.calibrationAllowed = true;
      const corroborated = this.observeRecoveryWitness(sample, now, match, candidates, true, false, tolerance);
      if (corroborated) {
        // A real onset used with an earlier visible-text witness still counts
        // toward the existing independent three-onset video handoff.
        if (corroborated.source === 'session') this.observeCalibration(sample, match, tolerance);
        this.selected = corroborated; this.mismatches = 0; return corroborated;
      }
      const calibrated = !this.selected || this.selected.source === 'session'
        ? this.observeCalibration(sample, match, tolerance) : null;
      if (this.selected) {
        // A stepped session API can jitter across the onset tolerance. Once
        // three native onsets independently verify video, use its continuous
        // timeline before that jitter forces another blank recovery interval.
        if (this.selected.source === 'session' && calibrated) {
          this.selected = calibrated; this.mismatches = 0;
          return this.selected;
        }
        this.mismatches = Math.abs(this.selected.time - match.begin) <= tolerance ? 0 : this.mismatches + 1;
        if (!this.mismatches && exactNative) this.selected.track = match.track;
        if (this.mismatches >= 2) {
          this.reset();
          if (sessionProgress) this.progressRejected = true;
        }
        return this.selected;
      }
      const winners = [];
      for (const candidate of candidates) {
        if (Math.abs(candidate.time - match.begin) > tolerance) { this.evidence.delete(candidate.key); continue; }
        const old = this.evidence.get(candidate.key);
        const evidence = old?.track === match.track ? old : { track: match.track, begins: new Set() };
        evidence.begins.add(match.begin);
        this.evidence.set(candidate.key, evidence);
        if (evidence.begins.size >= 2) winners.push({ ...candidate, track: match.track });
      }
      if (winners.length && winners.every(c => Math.abs(c.time - winners[0].time) <= tolerance)) {
        this.selected = winners.find(c => c.source === 'video') || winners[0];
      }
      // Never infer this offset from the ad duration or the user's sync value.
      if (!this.selected && calibrated) this.selected = calibrated;
      return this.selected;
    }
    baseTime(mediaTime, now) {
      if (!this.selected) return null;
      if (this.selected.verification === 'session-progress') return now < this.selected.validUntil
        ? mediaTime - this.selected.offset : null;
      if (this.selected.source === 'video') return mediaTime - (this.selected.offset || 0);
      const p = this.selected.pair;
      if (this.selected.source === 'session') return p && now >= p.at && now < p.expires
        ? p.time + (p.paused ? 0 : (now - p.at) / 1000 * p.rate) : null;
      return p && now >= p.at && now - p.at < 1000 ? p.raw / this.selected.unit + (mediaTime - p.videoTime) : null;
    }
  }
  window.OTTSubPlaybackClock = PlaybackClock;
})();
