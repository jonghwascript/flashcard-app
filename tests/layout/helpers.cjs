const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const crypto = require('node:crypto');
const { chromium, firefox } = require('@playwright/test');
const { renderHtml } = require('./render-html.cjs');
const project = path.resolve(__dirname, '../..');

function hashes(folder) {
  const base = path.join(project, folder);
  return Object.fromEntries(fs.existsSync(base) ? fs.readdirSync(base, { recursive: true })
    .filter(file => fs.statSync(path.join(base, file)).isFile())
    .sort().map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(base, file))).digest('hex')]) : []);
}

async function preview(label) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `layout-${label}-`));
  fs.mkdirSync(path.join(root, 'css'));
  fs.writeFileSync(path.join(root, 'index.html'), await renderHtml());
  for (const dir of ['js', 'images', 'fonts']) fs.cpSync(path.join(project, 'src', dir), path.join(root, dir), { recursive: true });
  fs.copyFileSync(path.join(project, 'src/data.json'), path.join(root, 'data.json'));
  fs.writeFileSync(path.join(root, 'css/style.css'), require('sass').compile(path.join(project, 'src/scss/style.scss')).css);
  const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.png': 'image/png' };
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + (new URL(req.url, 'http://localhost').pathname === '/' ? '/index.html' : decodeURIComponent(new URL(req.url, 'http://localhost').pathname)));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { root, url: `http://127.0.0.1:${server.address().port}/`, close: () => new Promise(resolve => server.close(resolve)) };
}

async function launch() {
  if (process.env.LAYOUT_BROWSER === 'firefox') return firefox.launch({ headless: true, ...(process.env.FIREFOX_PATH ? { executablePath: process.env.FIREFOX_PATH } : {}) });
  return chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
}

module.exports = { preview, launch, hashes, project };
