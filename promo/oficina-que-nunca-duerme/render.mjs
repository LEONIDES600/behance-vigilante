// Render fotograma a fotograma con Chromium headless (WebGL por SwiftShader) y montaje con ffmpeg.
// Uso:
//   node render.mjs --ar 916            → vídeo completo vertical (frames/916 + oficina-916.mp4)
//   node render.mjs --ar 169            → versión horizontal
//   node render.mjs --ar 916 --stills 0.5,3,6.5   → fotogramas sueltos para revisar (stills/)
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { extname, join, resolve } from 'path';
import { spawn } from 'child_process';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const AR = args.ar || '916';
const FPS = 30, DUR = 62;
const WORKERS = Number(args.workers || 4);
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ROOT = resolve('.');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  try {
    const p = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    const body = await readFile(p);
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, r));
const URL = `http://127.0.0.1:${server.address().port}/index.html?ar=${AR}`;

async function open() {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const [w, h] = AR === '916' ? [1080, 1920] : [1920, 1080];
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', e => console.error('ERROR página:', e.message));
  page.on('console', m => m.type() === 'error' && console.error('consola:', m.text()));
  await page.goto(URL);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 180000 });
  return { browser, page };
}

async function shot(page, t, file) {
  await page.evaluate(([t, f]) => window.renderAt(t, f), [t, Math.round(t * FPS)]);
  await page.screenshot({ path: file, type: 'jpeg', quality: 94, clip: { x: 0, y: 0, ...(AR === '916' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 }) } });
}

if (args.stills) {
  await mkdir('stills', { recursive: true });
  const { browser, page } = await open();
  for (const s of args.stills.split(',').map(Number)) {
    const f = `stills/${AR}-${s.toFixed(2)}.jpg`;
    await shot(page, s, f);
    console.log('ok', f);
  }
  await browser.close();
  server.close();
  process.exit(0);
}

const dir = `frames/${AR}`;
await mkdir(dir, { recursive: true });
const total = FPS * DUR;
const t0 = Date.now();
let done = 0;
async function worker(k) {
  const { browser, page } = await open();
  for (let f = k; f < total; f += WORKERS) {
    const file = `${dir}/${String(f).padStart(5, '0')}.jpg`;
    const [ra, rb] = (args.range || '-1,-1').split(',').map(Number);
    const inRange = f / FPS >= ra && f / FPS <= rb;
    if (!existsSync(file) || args.force || inRange) await shot(page, f / FPS + 0.0001, file);
    done++;
    if (done % 60 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${done}/${total} fotogramas · ${(done / el).toFixed(2)} fps · faltan ~${Math.round((total - done) / (done / el) / 60)} min`);
    }
  }
  await browser.close();
}
await Promise.all(Array.from({ length: WORKERS }, (_, k) => worker(k)));
server.close();

const out = `oficina-${AR}.mp4`;
const ff = ['-y', '-framerate', String(FPS), '-i', `${dir}/%05d.jpg`];
if (existsSync('audio/score.wav')) ff.push('-i', 'audio/score.wav');
ff.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '24', '-maxrate', '12M', '-bufsize', '24M', '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
if (existsSync('audio/score.wav')) ff.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
ff.push(out);
await new Promise((r, j) => spawn('ffmpeg', ff, { stdio: 'inherit' }).on('close', c => (c ? j(new Error('ffmpeg ' + c)) : r())));
console.log('Listo:', out);
