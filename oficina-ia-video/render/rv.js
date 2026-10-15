// Render del animático a fotogramas con Playwright (Chromium headless, WebGL por SwiftShader).
//
// Uso:  node rv.js [--fps 30] [--from 0] [--to 90] [--out frames] [--libs /ruta/node_modules] [--jpg 90]
//
// - Abre index.html#render y por cada fotograma llama a window.__seek(t), que
//   coloca la línea de tiempo GSAP en t y renderiza la escena three.js de forma
//   determinista (sin reloj real).
// - Las CDN (jsDelivr) suelen estar bloqueadas en el sandbox: se interceptan y
//   se sirven desde node_modules locales (three@0.186.1, gsap@3.13.0).
// - Luego: ffmpeg -framerate 30 -i frames/%05d.jpg ... (ver montar.sh).

const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const FPS = Number(opt('fps', 30));
const FROM = Number(opt('from', 0));
const TO = Number(opt('to', 90));
const OUT = path.resolve(opt('out', path.join(__dirname, 'frames')));
const LIBS = path.resolve(opt('libs', path.join(__dirname, 'node_modules')));
const JPG = Number(opt('jpg', 90));
const HTML = path.resolve(__dirname, '..', 'index.html');

let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }

const MIME = { '.js': 'application/javascript', '.mjs': 'application/javascript', '.json': 'application/json', '.css': 'text/css' };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });

  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('[console]', m.text()); });

  // jsDelivr → node_modules local
  await page.route('**/cdn.jsdelivr.net/**', async (route) => {
    const u = new URL(route.request().url());
    // /npm/three@0.186.1/build/three.module.js → three/build/three.module.js
    const m = u.pathname.match(/^\/npm\/([^@/]+)@[^/]+\/(.*)$/);
    if (!m) return route.abort();
    const file = path.join(LIBS, m[1], m[2]);
    if (!fs.existsSync(file)) { console.error('[libs] no existe', file); return route.abort(); }
    await route.fulfill({ status: 200, contentType: MIME[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
  });

  await page.goto('file://' + HTML + '#render', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__listo === true, null, { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);

  const n0 = Math.round(FROM * FPS), n1 = Math.round(TO * FPS);
  const t0 = Date.now();
  for (let f = n0; f < n1; f++) {
    const t = f / FPS;
    await page.evaluate((t) => window.__seek(t), t);
    await page.screenshot({ path: path.join(OUT, String(f).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: JPG });
    if (f % (FPS * 5) === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`t=${t.toFixed(1)}s  ${f - n0 + 1}/${n1 - n0}  ${el.toFixed(0)}s`);
    }
  }
  await browser.close();
  console.log('Listo:', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
