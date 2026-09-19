// =====================================================================
//  render.js — captura la animación fotograma a fotograma con Playwright
//
//  Abre index.html a 1080x1920 en Chromium sin ventana, fija el tiempo con
//  window.seek(ms) y guarda un PNG por fotograma en frames/.
//
//  Uso (PowerShell, dentro de esta carpeta):
//    node render.js                     -> tema por defecto, 18 s a 60 fps
//    node render.js --tema=ignicion     -> elige tema
//    node render.js --fps=30            -> previsualización rápida
//    node render.js --desde=8 --hasta=12  -> solo ese tramo (para revisar)
//
//  Requiere: npm i playwright   (y la descarga de Chromium que hace solo)
// =====================================================================

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ---------- argumentos ----------
const arg = (nombre, porDefecto) => {
  const hit = process.argv.find(a => a.startsWith(`--${nombre}=`));
  return hit ? hit.split('=').slice(1).join('=') : porDefecto;
};
const TEMA = arg('tema', '');                    // '' = el de CONFIG.tema
const FPS = Number(arg('fps', 60));
const DUR = Number(arg('duracion', 18));
const DESDE = Number(arg('desde', 0));
const HASTA = Number(arg('hasta', DUR));
const SALIDA = path.resolve(arg('salida', 'frames'));
const PUERTO = Number(arg('puerto', 8765));

// ---------- servidor estático mínimo (sin dependencias) ----------
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.json': 'application/json',
};
function servir(raiz, puerto) {
  const server = http.createServer((req, res) => {
    const limpio = decodeURIComponent(req.url.split('?')[0]);
    const archivo = path.join(raiz, limpio === '/' ? 'index.html' : limpio);
    if (!archivo.startsWith(raiz)) { res.writeHead(403).end(); return; }
    fs.readFile(archivo, (err, datos) => {
      if (err) { res.writeHead(404).end('no encontrado'); return; }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream' });
      res.end(datos);
    });
  });
  return new Promise(ok => server.listen(puerto, '127.0.0.1', () => ok(server)));
}

// ---------- render ----------
(async () => {
  const total = Math.round((HASTA - DESDE) * FPS);
  fs.mkdirSync(SALIDA, { recursive: true });
  // Limpia PNG antiguos para que ffmpeg no mezcle dos renders
  for (const f of fs.readdirSync(SALIDA)) if (f.endsWith('.png')) fs.unlinkSync(path.join(SALIDA, f));

  const server = await servir(__dirname, PUERTO);
  const url = `http://127.0.0.1:${PUERTO}/index.html${TEMA ? `?tema=${TEMA}` : ''}`;
  console.log(`Render: ${total} fotogramas a ${FPS} fps  (${DESDE}s -> ${HASTA}s)`);
  console.log(`Página: ${url}`);

  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('[error de página]', e.message));

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });

  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const ms = (DESDE + i / FPS) * 1000;
    await page.evaluate(x => window.seek(x), ms);
    await page.screenshot({ path: path.join(SALIDA, `f${String(i).padStart(5, '0')}.png`) });
    if (i % 60 === 0 || i === total - 1) {
      const seg = (Date.now() - t0) / 1000;
      const queda = i ? (seg / i) * (total - i) : 0;
      console.log(`  ${i + 1}/${total}  ${seg.toFixed(0)}s transcurridos, ~${queda.toFixed(0)}s restantes`);
    }
  }

  await browser.close();
  server.close();
  console.log(`Listo: ${total} PNG en ${SALIDA}`);
  console.log('Siguiente paso: .\\export.ps1');
})().catch(e => { console.error(e); process.exit(1); });
