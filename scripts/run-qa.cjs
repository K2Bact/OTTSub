#!/usr/bin/env node
// Local CPU/browser QA. No model/API calls, no scratch scripts, no Netflix requests.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));
if ([...args].some(arg => !['--quick', '--no-browser', '--help'].includes(arg))) {
  console.error('Usage: node scripts/run-qa.cjs [--quick | --no-browser]'); process.exit(2);
}
if (args.has('--help')) {
  console.log('Default: syntax + runtime + legacy tests + offline Chromium.\n--quick: syntax + runtime only.\n--no-browser: all except Chromium.\nFull logs and summaries: artifacts/qa/. Any failure exits 1.');
  process.exit(0);
}
const quick = args.has('--quick'), skipBrowser = quick || args.has('--no-browser');
const stamp = new Date().toISOString().replace(/[:.]/g, '-') + '-' + process.pid;
const out = path.join(root, 'artifacts', 'qa', stamp);
fs.mkdirSync(out, { recursive: true });
const started = Date.now(), results = [];
// Python imports may refresh bytecode during QA; generated caches are not inputs.
const collectFiles = dir => fs.readdirSync(dir, { withFileTypes: true })
  .filter(entry => entry.name !== '__pycache__' && !entry.name.endsWith('.pyc')).flatMap(entry => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? collectFiles(full) : entry.isFile() ? [full] : [];
});
const sources = ['src', 'popup', 'tools/ad-observer', 'tools/local-diagnostics', 'tools/dev-research', 'scripts'].flatMap(dir => collectFiles(path.join(root, dir))).filter(file => /\.(?:c?js)$/.test(file)).sort();
// Legacy compliance suites read STORE_GUIDE directly, so its edits must invalidate QA inputs.
const tracked = [...['src', 'popup', '_locales', 'icons', 'tests', 'scripts', 'tools/ad-observer', 'tools/local-diagnostics', 'tools/dev-research'].flatMap(dir => collectFiles(path.join(root, dir))), path.join(root, 'manifest.json'), path.join(root, 'store_assets/STORE_GUIDE.md')];
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const initialHashes = Object.fromEntries(tracked.map(file => [path.relative(root, file).replaceAll('\\', '/'), hash(file)]));
const env = { ...process.env, NO_COLOR: '1', OTTSUB_QA_ARTIFACT_DIR: out, CHROME_LOG_FILE: path.join(out, 'chromium-debug.log') };
delete env.OTTSub_TEST_SOURCE; // Always test the working source, never a historical comparison tree.
const jobs = sources.map(file => ({ name: 'syntax:' + path.relative(root, file).replaceAll('\\', '/'), group: 'syntax', args: ['--check', file], timeout: 15000 }));
for (const name of ['test_settings_revisions_runtime.cjs', 'test_seek_recovery_runtime.cjs', 'test_native_on_progress_runtime.cjs', 'test_native_off_recovery_runtime.cjs', 'test_episode_lifecycle_runtime.cjs', 'test_subtitle_timing_runtime.cjs', 'test_playback_gate_runtime.cjs', 'test_playback_clock_runtime.cjs', 'test_clock_handoff_runtime.cjs', 'test_ad_clock_memory_runtime.cjs', 'test_recovery_witness_runtime.cjs', 'test_session_observation_runtime.cjs', 'test_native_reference_runtime.cjs']) {
  jobs.push({ name, group: 'runtime', args: ['--test', '--test-reporter=tap', '--test-timeout=5000', path.join(root, 'tests', name)], timeout: 20000 });
}
for (const name of ['test_parser_quality_runtime.cjs','test_copy_quality_runtime.cjs','test_full_review_runtime.cjs','test_boundary_review_runtime.cjs']) jobs.push({name,group:'runtime',args:['--test',path.join(root,'tests',name)],timeout:20000});
jobs.push({name:'test_transition_review_runtime.cjs',group:'runtime',args:['--test','--test-reporter=tap',path.join(root,'tests/test_transition_review_runtime.cjs')],timeout:20000});
jobs.push({ name: 'test_store_package.py', group: 'runtime', command: process.env.OTTSUB_PYTHON || 'python',
  args: ['-B', path.join(root, 'tests', 'test_store_package.py')], timeout: 20000 });
if (!quick) {
  for (const name of fs.readdirSync(path.join(root, 'tests')).filter(name => name.endsWith('.js')).sort()) {
    jobs.push({ name, group: 'legacy', args: [path.join(root, 'tests', name)], timeout: 20000 });
  }
}
jobs.push({ name: 'test_native_change_runtime.cjs', group: 'runtime', args: ['--test', path.join(root, 'tests/test_native_change_runtime.cjs')], timeout: 20000 });
jobs.push({ name: 'test_language_policy_runtime.cjs', group: 'runtime', args: ['--test', path.join(root, 'tests/test_language_policy_runtime.cjs')], timeout: 20000 });
jobs.push({ name: 'test_l10n_review_runtime.cjs', group: 'runtime', args: ['--test', path.join(root, 'tests/test_l10n_review_runtime.cjs')], timeout: 20000 });
jobs.push({ name: 'test_platform_shortcuts_runtime.cjs', group: 'runtime', args: ['--test', path.join(root, 'tests/test_platform_shortcuts_runtime.cjs')], timeout: 20000 });
jobs.push({ name: 'test_performance_fixes_runtime.cjs', group: 'runtime', args: ['--test', path.join(root, 'tests/test_performance_fixes_runtime.cjs')], timeout: 20000 });
jobs.push({ name: 'test_review38_runtime.cjs', group: 'runtime', args: ['--test', path.join(root, 'tests/test_review38_runtime.cjs')], timeout: 20000 });
jobs.push({ name: 'test_review40_runtime.cjs', group: 'runtime', args: ['--test', path.join(root, 'tests/test_review40_runtime.cjs')], timeout: 20000 });
jobs.push({ name: 'test_track_kind_runtime.cjs', group: 'runtime', args: ['--test', path.join(root, 'tests/test_track_kind_runtime.cjs')], timeout: 20000 });
jobs.push({ name: 'test_track_discovery_runtime.cjs', group: 'runtime', args: ['--test', path.join(root, 'tests/test_track_discovery_runtime.cjs')], timeout: 20000 });
jobs.push({ name: 'test_acquisition_probe_runtime.cjs', group: 'runtime', args: ['--test', path.join(root, 'tests/test_acquisition_probe_runtime.cjs')], timeout: 20000 });
jobs.push({ name: 'test_native_acquisition_runtime.cjs', group: 'runtime', args: ['--test', path.join(root, 'tests/test_native_acquisition_runtime.cjs')], timeout: 20000 });
jobs.push({ name: 'test_qa_panel_guard_runtime.cjs', group: 'runtime', args: ['--test', '--test-reporter=tap', path.join(root, 'tests/test_qa_panel_guard_runtime.cjs')], timeout: 20000 });
const browserJobs = skipBrowser ? [] : ['test_french_ui_browser.cjs', 'test_status_churn_browser.cjs', 'test_finnish_development_browser.cjs', 'test_boundary_review_browser.cjs', 'test_full_review_browser.cjs', 'test_parser_quality_browser.cjs', 'test_accessibility_quality_browser.cjs', 'test_compound_failures_browser.cjs', 'test_lifecycle_quality_browser.cjs', 'test_state_help_quality_browser.cjs', 'test_popup_settings_browser.cjs', 'test_cdn_permissions_browser.cjs', 'test_review40_browser.cjs', 'test_language_names_browser.cjs', 'test_review38_browser.cjs', 'test_performance_fixes_browser.cjs', 'test_platform_shortcuts_browser.cjs', 'test_l10n_layout_browser.cjs', 'test_hindi_track_kind_browser.cjs', 'test_acquisition_inspector_browser.cjs', 'test_controls_languages_browser.cjs', 'test_review_fixes_browser.cjs', 'test_episode_browser.cjs', 'test_subtitle_layout_browser.cjs', 'test_ad_observer_browser.cjs', 'test_ad_gate_browser.cjs', 'test_ad_recovery_browser.cjs', 'test_hover_media_browser.cjs', 'test_side_panel_browser.cjs', 'test_settings_sync_browser.cjs'].map(name => ({
  // The 15-locale layout matrix now exercises 135 connected/recovering/disconnected states.
  name, group: 'browser', args: [path.join(root, 'tests', name)], timeout: name === 'test_l10n_layout_browser.cjs' ? 75000 : 45000
}));

function summarizeOutput(output, group, suiteName) {
  const clean = output.replace(/\x1b\[[0-9;]*m/g, '');
  if (group === 'browser') {
    const invalid = message => ({ checks: null, passed: false, reportValid: false, reportPassed: false,
      failures: [message] });
    const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    const count = value => Number.isSafeInteger(value) && value >= 0;
    try {
      const data = JSON.parse(clean.trim());
      if (!object(data)) return invalid('Browser report must be a JSON object');
      if (data.errors !== undefined && (!Array.isArray(data.errors) || data.errors.some(e => typeof e !== 'string'))) {
        return invalid('Browser errors must be an array of strings');
      }
      const errors = data.errors || [];
      if (data.failed !== undefined && !count(data.failed)) return invalid('Invalid failed count');
      // This assertion-based suite has never reported a check count. Keep that
      // contract scoped to its name; do not invent a count or accept it elsewhere.
      if (!Object.hasOwn(data, 'total') && !Object.hasOwn(data, 'cases')) {
        if (suiteName !== 'test_episode_browser.cjs' || typeof data.passed !== 'boolean'
          || typeof data.browserVersion !== 'string' || !data.browserVersion.trim()
          || !Array.isArray(data.errors) || !object(data.result)
          || ['initial', 'afterNavigation', 'exited'].some(key => !object(data.result[key]) || !Object.keys(data.result[key]).length)
          || data.plannedTotal !== undefined) return invalid('Missing counted report or recognized episode evidence');
        const failures = [...errors];
        if (!data.passed) failures.push('Episode report says passed=false');
        if (data.failed > 0) failures.push(`Episode report has ${data.failed} failures`);
        return { checks: null, passed: data.passed, browser: data.browserVersion,
          reportValid: true, reportPassed: data.passed && failures.length === 0,
          reportSchema: 'episode', failures: failures.slice(0, 10) };
      }
      if (!count(data.total) || data.total === 0 || !Array.isArray(data.cases) || data.cases.length !== data.total) {
        return invalid('Browser total must be a positive safe integer matching cases.length');
      }
      if (data.cases.some(c => !object(c) || typeof c.name !== 'string' || !c.name.trim() || typeof c.passed !== 'boolean')) {
        return invalid('Each browser case needs a name and boolean passed');
      }
      if (typeof data.passed !== 'boolean' && !count(data.passed)) return invalid('Missing or invalid browser success marker');
      const successful = data.cases.filter(c => c.passed).length;
      if (typeof data.passed === 'number' && data.passed !== successful) return invalid('Browser passed count contradicts cases');
      if (data.failed !== undefined && data.failed !== data.total - successful) return invalid('Browser failed count contradicts cases');
      if (data.plannedTotal !== undefined && (!count(data.plannedTotal) || data.plannedTotal !== data.total)) {
        return invalid('Browser execution count does not match plannedTotal');
      }
      const failures = [...errors, ...data.cases.filter(c => !c.passed).map(c => c.name)];
      if (data.passed === false) failures.push('Browser report says passed=false');
      return { checks: data.total, passed: data.passed, browser: data.browserVersion || data.browser,
        reportValid: true, reportPassed: (data.passed === true || data.passed === data.total) && failures.length === 0,
        reportSchema: 'cases', failures: failures.slice(0, 10) };
    } catch (error) {
      return invalid(`Invalid browser JSON/report: ${error.message}`);
    }
  }
  const count = label => { const m = clean.match(new RegExp('^# ' + label + ' (\\d+)', 'm')); return m ? Number(m[1]) : null; };
  return { checks: count('tests'), passed: count('pass'), failed: count('fail'),
    failures: clean.split(/\r?\n/).filter(line => /\[FAIL\]|^not ok\b|AssertionError|(?:^|\s)Error:|spawn EPERM|testTimeoutFailure/.test(line)).slice(0, 10).map(line => line.trim().slice(0, 350)) };
}
function run(job) {
  return new Promise(resolve => {
    const begin = Date.now();
    const logName = job.name.replace(/[^a-zA-Z0-9_.-]/g, '_') + '.log';
    const log = fs.createWriteStream(path.join(out, logName));
    let captured = '', timedOut = false, launchError = null;
    const child = spawn(job.command || process.execPath, job.args, { cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const record = chunk => {
      log.write(chunk);
      captured += chunk.toString('utf8');
      if (captured.length > 1024 * 1024) captured = captured.slice(-1024 * 1024);
    };
    child.stdout.on('data', record); child.stderr.on('data', record);
    child.on('error', error => { launchError = error.message; record(Buffer.from(error.message)); });
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === 'win32' && child.pid) {
        // Only the timed-out test's own process tree; never all Chrome/Node processes.
        const killer = spawn(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'taskkill.exe'), ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
        killer.on('error', () => child.kill());
      } else child.kill('SIGKILL');
    }, job.timeout);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      log.end(() => {
        const summary = summarizeOutput(captured, job.group, job.name);
        const reportFailed = job.group === 'browser' ? !summary.reportValid || !summary.reportPassed : summary.failed > 0;
        const result = { name: job.name, group: job.group,
          status: timedOut ? 'TIMEOUT' : launchError ? 'ERROR' : code !== 0 || reportFailed ? 'FAIL' : 'PASS',
          exitCode: code, signal, durationMs: Date.now() - begin, log: logName, ...summary };
        results.push(result);
        if (result.status !== 'PASS') console.log(`${result.status} ${job.name}`);
        resolve(result);
      });
    });
  });
}
async function main() {
  let cursor = 0;
  // Two Node jobs at a time; browser suites run one at a time to limit RAM.
  await Promise.all(Array.from({ length: 2 }, async () => {
    while (cursor < jobs.length) await run(jobs[cursor++]);
  }));
  for (const job of browserJobs) await run(job);
  const changed = Object.entries(initialHashes).filter(([relative, digest]) => {
    const file = path.join(root, relative); return !fs.existsSync(file) || hash(file) !== digest;
  }).map(([relative]) => relative);
  for (const base of [root, path.join(root, 'tools/ad-observer')]) {
    const manifestIssues = [];
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(base, 'manifest.json'), 'utf8'));
      for (const group of manifest.content_scripts || []) for (const file of [...(group.js || []), ...(group.css || [])]) {
        if (!fs.existsSync(path.join(base, file))) manifestIssues.push(`Missing manifest resource: ${file}`);
      }
    } catch (error) { manifestIssues.push(error.message); }
    results.push({ name: base === root ? 'manifest-resources' : 'observer-manifest-resources', group: 'syntax', status: manifestIssues.length ? 'FAIL' : 'PASS', failures: manifestIssues });
    }
  const failed = results.filter(r => r.status !== 'PASS');
  const groups = Object.fromEntries(['syntax', 'runtime', 'legacy', 'browser'].map(group => {
    const entries = results.filter(r => r.group === group);
    return [group, { passed: entries.filter(r => r.status === 'PASS').length, total: entries.length }];
  }));
  const report = { run: stamp, mode: quick ? 'quick' : skipBrowser ? 'no-browser' : 'full', durationMs: Date.now() - started,
    passed: failed.length === 0 && changed.length === 0, sourceChangedDuringRun: changed, groups,
    skipped: [...(quick ? ['legacy'] : []), ...(skipBrowser ? ['browser'] : [])],
    coverageLimit: 'Synthetic/offline tests only. The full browser run includes unpacked OTTSub MAIN/ISOLATED integration and popup tests with mocked Netflix inputs. Live Netflix/ads and manual UX QA remain unverified. Consult skipped groups and per-suite results for actual coverage.',
    sourceHashes: initialHashes, results };
  const rows = ['# Local QA result', '', `Run: ${stamp}`, `Mode: ${report.mode}; duration: ${(report.durationMs / 1000).toFixed(1)}s`, '',
    '| Group | Passed / total suites |', '|---|---|', ...Object.entries(groups).map(([name, g]) => `| ${name} | ${g.passed} / ${g.total} |`), '',
    `Skipped: ${report.skipped.join(', ') || 'none'}`, `Sources changed during run: ${changed.join(', ') || 'none'}`, '', '## Failures', ''];
  if (!failed.length) rows.push('None.');
  for (const item of failed) {
    rows.push(`- **${item.status}: ${item.name}**${item.log ? ` ([log](${item.log}))` : ''}`);
    for (const failure of item.failures) rows.push(`  - ${failure.replaceAll('|', '\\|')}`);
  }
  rows.push('', '## Coverage boundary', '', report.coverageLimit, '', 'Full per-test results and source hashes: [summary.json](summary.json).', '');
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(out, 'summary.md'), rows.join('\n'));
  const latest = path.join(root, 'artifacts', 'qa');
  fs.writeFileSync(path.join(latest, 'latest.json'), JSON.stringify({ run: stamp, summary: `${stamp}/summary.json`, passed: report.passed, groups }, null, 2));
  fs.writeFileSync(path.join(latest, 'latest.md'), `# Latest local QA\n\n[Result and failures](${stamp}/summary.md)\n\nMode: ${report.mode}; failed suites: ${failed.length}; source changes during run: ${changed.length}.\n`);
  console.log(`QA ${report.passed ? 'PASS' : 'FAIL'}: ${results.length - failed.length}/${results.length} suites; ${(report.durationMs / 1000).toFixed(1)}s`);
  console.log(`Summary: ${path.join(out, 'summary.md')}`);
  process.exitCode = report.passed ? 0 : 1;
}
main().catch(error => { console.error(error); process.exitCode = 2; });
