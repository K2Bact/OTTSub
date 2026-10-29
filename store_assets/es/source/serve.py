"""Local-only capture fixture: current product UI, synthetic settings, no Netflix connection."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse
ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        route = urlparse(self.path).path
        if route == '/panel.html':
            html = (ROOT/'popup/popup.html').read_text(encoding='utf-8').replace('<head>', '<head><base href="/popup/"><script src="/fixture.js"></script>')
            data, kind = html.encode('utf-8'), 'text/html; charset=utf-8'
        elif route in ['/', '/index.html', '/fixture.js']:
            p = HERE / ('index.html' if route == '/' else route[1:])
            data, kind = p.read_bytes(), ('application/javascript' if p.suffix == '.js' else 'text/html; charset=utf-8')
        elif route.startswith(('/popup/', '/src/', '/icons/')):
            p = (ROOT / route.lstrip('/')).resolve()
            if not p.is_relative_to(ROOT) or not p.is_file():
                self.send_error(404); return
            data, kind = p.read_bytes(), self.guess_type(str(p))
        else:
            self.send_error(404); return
        self.send_response(200); self.send_header('Content-Type', kind)
        self.send_header('Content-Length', str(len(data))); self.send_header('Cache-Control', 'no-store')
        self.end_headers(); self.wfile.write(data)
if __name__ == '__main__':
    print('Spanish asset preview: http://127.0.0.1:49177/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 49177), Handler).serve_forever()
