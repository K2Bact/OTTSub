#!/usr/bin/env node
// Offline reduction only: no ad classifier and no guessed clock correction.
const fs = require('node:fs');
function summarize(data) {
  if (data?.schema !== 'ottsub-ad-observation-v1' || !Array.isArray(data.rows)) throw new Error('Unsupported observation file');
  if (data.rows.length > 12000) throw new Error('Observation exceeds row limit');
  const samples = data.rows.filter(r => r.type === 'sample');
  const marks = data.rows.filter(r => r.type === 'mark');
  const gaps = [];
  for (let i = 1; i < samples.length; i++) if (samples[i].t - samples[i - 1].t > 1500) gaps.push({ from: samples[i - 1].t, to: samples[i].t });
  const checkpoints = marks.map(mark => {
    const before = [...samples].reverse().find(r => r.t <= mark.t);
    const after = samples.find(r => r.t > mark.t);
    return { label: mark.label, t: mark.t, before: before || null, after: after || null };
  });
  return { schema: data.schema, observerVersion: data.observerVersion, startedAt: data.startedAt, endedReason: data.endedReason,
    samples: samples.length, durationMs: data.stoppedAtMs ?? data.rows.at(-1)?.t ?? 0, overflow: !!data.overflow,
    movieIds: [...new Set(samples.map(r => r.movieId))],
    playerStatuses: [...new Set(samples.map(r => r.players?.status))],
    hasAdStartMark: marks.some(m => m.label === 'ad-start'), hasContentReturnMark: marks.some(m => m.label === 'content-return'),
    gaps, checkpoints,
    domChanges: data.rows.filter(r => r.type === 'dom-candidates'),
    playerMethods: data.rows.filter(r => r.type === 'player-methods'),
    videoChanges: data.rows.filter(r => ['video-attached', 'video-detached'].includes(r.type)),
    observationErrors: data.rows.filter(r => r.type === 'sample-error').length,
    warning: 'Observed data only. User marks are approximate. Player clock units, ad signals and content clock still require analysis.' };
}
if (require.main === module) {
  try {
    const [file, out] = process.argv.slice(2);
    if (!file || !out) throw new Error('Usage: node scripts/summarize-ad-observation.cjs <input.json> <summary.json>');
    if (fs.statSync(file).size > 30 * 1024 * 1024) throw new Error('Input exceeds 30 MB');
    const result = summarize(JSON.parse(fs.readFileSync(file, 'utf8')));
    fs.writeFileSync(out, JSON.stringify(result, null, 2), { flag: 'wx' });
    console.log(JSON.stringify({ output: out, samples: result.samples, adStart: result.hasAdStartMark, contentReturn: result.hasContentReturnMark, gaps: result.gaps.length, errors: result.observationErrors }));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { summarize };
