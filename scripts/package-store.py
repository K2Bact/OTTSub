"""Build an allowlisted store ZIP. Local diagnostics are forbidden in the output."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
LOCAL_SCRIPT = 'tools/local-diagnostics/collector.js'
LOCAL_SCRIPTS = {LOCAL_SCRIPT, 'tools/local-diagnostics/acquisition-main.js'}
FORBIDDEN = ('local-diagnostics', '__ottsubLocalDiagnostics', 'OTTSUB_LOCAL_DIAGNOSTICS', 'tools/ad-observer')
SUFFIXES = {'.js', '.css', '.html', '.json', '.png'}


def entries_for(root, manifest=None):
    root = Path(root).resolve()
    manifest = json.loads(json.dumps(manifest)) if manifest is not None else json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
    manifest.pop('version_name', None)
    for group in manifest.get('content_scripts', []):
        group['js'] = [p for p in group.get('js', []) if p not in LOCAL_SCRIPTS]
    entries = {'manifest.json': (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8')}
    entries['LICENSE'] = (root / 'LICENSE').read_bytes()
    for folder in ['src', 'popup', '_locales', 'icons']:
        for path in sorted((root / folder).rglob('*')):
            if path.is_symlink() or not path.resolve().is_relative_to(root):
                raise ValueError(f'External link forbidden: {path}')
            if path.is_file():
                if path.suffix not in SUFFIXES:
                    raise ValueError(f'Unexpected runtime asset: {path}')
                entries[path.relative_to(root).as_posix()] = path.read_bytes()
    validate(entries)
    return entries


def validate(entries):
    if not entries.get('LICENSE') or not entries['LICENSE'].decode('utf-8').strip():
        raise ValueError('Missing or empty copyright/usage notice')
    for name, data in entries.items():
        if name not in {'manifest.json', 'LICENSE'} and name.split('/')[0] not in {'src', 'popup', '_locales', 'icons'}:
            raise ValueError(f'Non-runtime file forbidden: {name}')
        if '..' in name.split('/') or '\\' in name or name.startswith('/'):
            raise ValueError(f'Invalid path: {name}')
        if any(token.lower() in name.lower() for token in FORBIDDEN):
            raise ValueError(f'Diagnostic asset forbidden: {name}')
        if not name.endswith('.png'):
            text = data.decode('utf-8')
            if any(token.lower() in text.lower() for token in FORBIDDEN):
                raise ValueError(f'Diagnostic reference/code forbidden: {name}')
    manifest = json.loads(entries['manifest.json'])
    if 'version_name' in manifest:
        raise ValueError('Local version label forbidden')
    if manifest.get('permissions') != ['storage', 'sidePanel'] or manifest.get('background') != {'service_worker': 'src/side-panel.js'}:
        raise ValueError('Unexpected permissions/background: review packaging policy first')
    if manifest.get('host_permissions') != ['https://*.netflix.com/*']:
        raise ValueError('Unexpected host permissions: the content downloader does not need CDN origin privileges')
    if manifest.get('side_panel') != {'default_path': 'popup/popup.html'} or 'default_popup' in manifest.get('action', {}):
        raise ValueError('Unexpected side panel/action configuration')
    references = [*manifest.get('icons', {}).values(), manifest['side_panel']['default_path'],
                  manifest['background']['service_worker'], *manifest['action'].get('default_icon', {}).values()]
    for group in manifest.get('content_scripts', []):
        references.extend(group.get('js', [])); references.extend(group.get('css', []))
    for name in references:
        if name not in entries:
            raise ValueError(f'Missing or excluded manifest reference: {name}')


def main():
    entries = entries_for(ROOT)
    version = json.loads(entries['manifest.json'])['version']
    out = ROOT / 'dist'
    out.mkdir(exist_ok=True)
    archive = out / f'ottsub-store-{version}.zip'
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, data in sorted(entries.items()):
            z.writestr(name, data)
    with zipfile.ZipFile(archive) as z:
        if z.testzip() is not None:
            raise ValueError('ZIP integrity failure')
        validate({name: z.read(name) for name in z.namelist()})
    report = {'archive': archive.name, 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
              'diagnosticsExcluded': True, 'files': {n: hashlib.sha256(d).hexdigest() for n, d in entries.items()},
              'releaseReady': False, 'note': 'Packaging validation only; live Netflix QA and deferred defects remain.'}
    (out / 'package-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(f'Package verified: {archive} ({len(entries)} files; no local diagnostics)')


if __name__ == '__main__':
    main()
