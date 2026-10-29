import importlib.util
import json
from pathlib import Path
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('package_store', ROOT / 'scripts/package-store.py')
package = importlib.util.module_from_spec(spec)
spec.loader.exec_module(package)


class PackageBoundary(unittest.TestCase):
    def test_generated_zip_if_present(self):
        version = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))['version']
        archive = ROOT / 'dist' / f'ottsub-store-{version}.zip'
        if not archive.exists():
            self.skipTest('No generated store candidate yet')
        with zipfile.ZipFile(archive) as z:
            self.assertIsNone(z.testzip())
            current = package.entries_for(ROOT)
            if set(z.namelist()) != set(current) or any(z.read(name) != data for name, data in current.items()):
                self.skipTest('Existing ZIP is from an older source revision; no new ZIP was requested')
            package.validate({name: z.read(name) for name in z.namelist()})

    def test_actual_package_is_clean(self):
        entries = package.entries_for(ROOT)
        self.assertFalse(any(p.startswith(('tools/', 'docs/', 'tests/', 'scripts/', 'artifacts/')) for p in entries))
        self.assertNotIn('version_name', json.loads(entries['manifest.json']))
        self.assertEqual(json.loads(entries['manifest.json'])['side_panel']['default_path'], 'popup/popup.html')
        self.assertIn('src/side-panel.js', entries)
        self.assertEqual(entries['_locales/ms/messages.json'], (ROOT / '_locales/ms/messages.json').read_bytes())
        self.assertEqual(entries['_locales/bn/messages.json'], (ROOT / '_locales/bn/messages.json').read_bytes())
        self.assertEqual(entries['_locales/tr/messages.json'], (ROOT / '_locales/tr/messages.json').read_bytes())
        self.assertEqual(entries['_locales/fi/messages.json'], (ROOT / '_locales/fi/messages.json').read_bytes())
        self.assertEqual(entries['_locales/th/messages.json'], (ROOT / '_locales/th/messages.json').read_bytes())
        self.assertEqual(entries['_locales/ru/messages.json'], (ROOT / '_locales/ru/messages.json').read_bytes())
        self.assertEqual(entries['_locales/pt_PT/messages.json'], (ROOT / '_locales/pt_PT/messages.json').read_bytes())
        self.assertEqual(entries['_locales/zh_TW/messages.json'], (ROOT / '_locales/zh_TW/messages.json').read_bytes())
        self.assertEqual(entries['popup/modules/settings-binding.js'], (ROOT / 'popup/modules/settings-binding.js').read_bytes())
        for removed in ['src/interaction/drag-controller.js', 'src/interaction/hover-pause.js', 'src/video/video-observer.js']:
            self.assertNotIn(removed, entries)
        self.assertEqual(json.loads(entries['manifest.json'])['host_permissions'], ['https://*.netflix.com/*'])
        scripts = [script for group in json.loads(entries['manifest.json'])['content_scripts'] for script in group['js']]
        self.assertFalse(any('local-diagnostics' in script for script in scripts))

    def test_extra_host_permissions_block_packaging(self):
        m = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
        m['host_permissions'].append('https://*.nflxvideo.net/*')
        with self.assertRaises(ValueError):
            package.entries_for(ROOT, m)

    def test_unexpected_diagnostic_reference_blocks_packaging(self):
        m = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
        m['content_scripts'][1]['js'].append('tools/ad-observer/collector.js')
        with self.assertRaises(ValueError):
            package.entries_for(ROOT, m)

    def test_copied_diagnostic_code_blocks_packaging(self):
        entries = package.entries_for(ROOT)
        entries['src/accidental.js'] = (ROOT / package.LOCAL_SCRIPT).read_bytes()
        with self.assertRaises(ValueError):
            package.validate(entries)

    def test_diagnostic_file_and_extra_permissions_block_packaging(self):
        entries = package.entries_for(ROOT)
        entries[package.LOCAL_SCRIPT] = b''
        with self.assertRaises(ValueError):
            package.validate(entries)
        m = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
        m['permissions'].append('downloads')
        with self.assertRaises(ValueError):
            package.entries_for(ROOT, m)


if __name__ == '__main__':
    unittest.main()
