#!/usr/bin/env node
/*
 * Vigilante de ofertas — versión GitHub Actions (Leo Visual)
 * Corre en la nube en bucle (una pasada cada ~3 min): detecta ofertas nuevas en
 * varias plataformas (Behance, We Work Remotely, Remote OK) y las envía a
 * Telegram con una propuesta personalizada, aunque el PC esté apagado.
 *
 * Secretos del repositorio: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 * Estado: estado/seen.json (persistido entre ejecuciones con actions/cache)
 */
const fs = require('fs');
const path = require('path');

const SEARCHES = ['', 'branding', 'logo', 'social media', 'motion graphics', 'graphic design', 'video', 'advertising', 'ugc', 'amazon'];
const INCLUDE = ['brand', 'logo', 'graphic', 'design', 'social', 'motion', 'video', 'content', 'instagram', 'tiktok', 'youtube', 'identity', 'visual', 'creative', 'ai', 'marketing', 'advertising', 'advertisement', 'commercial', 'commercials', 'ads', 'ugc', 'amazon', 'promo', 'promotional', 'ecommerce', 'e-commerce', 'reel', 'reels', 'product'];
const EXCLUDE = ['software engineer', 'backend', 'frontend developer', 'fullstack', 'drafter', 'copywriter', 'accountant', 'adult content', 'adult', 'nsfw', 'onlyfans', 'porn', 'escort', 'webcam', 'sexual'];
// Títulos que en realidad son el muro de aviso de Behance, no la oferta real.
const GATE_TITLES = /^(adult content|content warning|mature content|sensitive content)$/i;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';
const STATE_FILE = path.join(__dirname, 'estado', 'seen.json');
const MAX_SEEN = 3000;
// Si NINGUNA fuente devuelve datos durante este tiempo, avisa por Telegram (una vez).
const BLIND_ALERT_MS = 60 * 60 * 1000; // 1 hora
// Pausa progresiva de una fuente caída, para que no ralentice a las que funcionan.
const BACKOFF_TRAS = 3;                 // fallos seguidos antes de empezar a pausarla
const BACKOFF_BASE_MS = 5 * 60 * 1000;  // primera pausa: 5 min (se dobla cada fallo)
const BACKOFF_MAX_MS = 60 * 60 * 1000;  // tope: 1 hora
// Revisión automática (desde 31/10/2026): cada oferta nueva de Behance que pasa
// los filtros lanza la tarea de Claude «Respuesta a ofertas del bot Behance»,
// que la abre en el navegador del ordenador de Leo, decide si encaja y la contesta.
// Entorno: CLAUDE_ROUTINE_TOKEN (secreto del repo: token API de la tarea) y
// CLAUDE_ROUTINE_ID (trig_…, fijado en el workflow; sin el token no sirve de nada).
// Si falta alguno, no se lanza nada y el bot sigue como antes (solo Telegram).
const ROUTINE_SOURCES = ['behance'];    // de qué fuentes se lanza la revisión
const ROUTINE_MAX_POR_HORA = 20;        // la API admite 30 por hora y tarea; dejamos margen
const ROUTINE_DESC_MAX = 6000;          // caracteres de descripción que se mandan
// Cola de ofertas (desde 31/10/2026, vía principal): cada oferta nueva de Behance
// que pasa los filtros se añade a ofertas.json en la rama «cola» del repositorio
// (con el GITHUB_TOKEN del workflow, sin claves extra). La tarea de Claude lee
// ese archivo cada hora desde raw.githubusercontent.com y contesta las que encajan.
const COLA_RAMA = 'cola';
const COLA_ARCHIVO = 'ofertas.json';
const COLA_MAX = 100;                   // ofertas que se guardan (las más recientes)
const COLA_DESC_MAX = 1500;

const TOPIC_LINES = [
  { match: /youtube|channel/i, line: 'I produce channel branding and video content for YouTube on a regular basis, so I know exactly what works for thumbnails, banners and channel identity.' },
  { match: /instagram|tiktok|social media|social-media|reels/i, line: 'I create social media content daily for Instagram, TikTok and LinkedIn, combining design, motion and AI tools to keep feeds consistent and fast-moving.' },
  { match: /logo|brand|identity|naming/i, line: 'Branding and visual identity are the core of my studio: logo systems, brand guidelines and full identity rollouts.' },
  { match: /motion|animation|animated|video edit|video-edit|after effects/i, line: 'Motion graphics and video are part of my daily toolkit, from short-form social clips to full animated brand pieces.' },
  { match: /advertis|commercial|\bads?\b|ugc|amazon|ecommerce|e-commerce|product video|promo/i, line: 'I produce advertising and product videos for brands, social media and e-commerce (including Amazon listings and UGC-style ads), handling concept, editing and motion end to end.' },
  { match: /\bai\b|artificial intelligence|midjourney|generative/i, line: 'I work with AI image and video generation in production every day, which lets me deliver more concepts, faster, without losing craft.' },
];

function buildProposal(title, description) {
  const text = `${title} ${description || ''}`;
  const tailored = TOPIC_LINES.filter((t) => t.match.test(text)).map((t) => t.line).slice(0, 2).join(' ');
  return `Hi! I'm Leo Gomez Silva, multidisciplinary designer and founder of Leo Visual.

I just saw your post "${title}" and it's exactly the kind of project I specialize in.
${tailored ? '\n' + tailored + '\n' : ''}
My approach combines brand strategy, creativity and AI-powered tools to produce high-quality visual content efficiently — branding & visual identity, graphic and digital design, social media content (Instagram, TikTok, LinkedIn, YouTube) and motion graphics.

You can see my work here:
- Portfolio: https://leovisual.nl/
- Behance: https://www.behance.net/leostudiocreative
- Instagram: @leovisual.nl

I'm available to start right away and can share relevant examples plus a first concept direction within 24 hours. When would be a good time to talk about the details?

Best regards,
Leo Gomez Silva
Leo Visual — https://leovisual.nl/`;
}

// Coincidencia por palabra completa: evita falsos positivos como 'ai' dentro de
// "email"/"available" o 'content' dentro de "Adult content".
function hasKeyword(text, keywords) {
  return keywords.some((k) => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text));
}

function passesFilters(title, description) {
  const text = `${title} ${description || ''}`;
  if (hasKeyword(text, EXCLUDE)) return false;
  return hasKeyword(text, INCLUDE);
}

async function tryFetch(url, label, opts = {}) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', ...(opts.headers || {}) }, signal: AbortSignal.timeout(30000) });
    if (res.ok) {
      const body = await res.text();
      if (opts.validate ? opts.validate(body) : body.length > 100) return { ok: true, via: label, body };
    }
    return { ok: false, via: `${label} HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, via: `${label} ${e.message}` };
  }
}

// Intenta directo y, si la IP del runner está bloqueada, pasa por un proxy de lectura
async function fetchVia(url, attempts) {
  const fails = [];
  for (const [u, label, opts] of attempts) {
    const r = await tryFetch(u, label, opts);
    if (r.ok) return { body: r.body, via: r.via, fails };
    fails.push(r.via);
  }
  return { body: '', via: 'ninguno', fails };
}

// ───────────────────────── Fuente: Behance ─────────────────────────
// Validación estricta: una página de error de Cloudflare puede devolver HTTP 200
// y bastante tamaño, así que exigimos que de verdad parezca el joblist.
function behanceValidate(html) {
  return html.includes('/joblist/') || (html.length > 20000 && /behance/i.test(html));
}

// Behance bloquea la IP de los runners (403), así que todo depende de los proxies
// de lectura. Se prueban varios en orden porque caen con frecuencia: en sept-2026
// jina empezó a devolver 403 y allorigins 5xx a la vez, y el vigilante se quedó
// ciego. Si añades o quitas proxies, deja siempre más de uno.
async function fetchBehancePage(url) {
  const enc = encodeURIComponent(url);
  return fetchVia(url, [
    [url, 'directo', { validate: behanceValidate }],
    [`https://api.codetabs.com/v1/proxy/?quest=${enc}`, 'codetabs', { validate: behanceValidate }],
    [`https://api.allorigins.win/raw?url=${enc}`, 'allorigins', { validate: behanceValidate }],
    [`https://r.jina.ai/${url}`, 'jina', { validate: behanceValidate }],
  ]);
}

function extractBehanceJobs(html) {
  const jobs = new Map();
  const re = /\/joblist\/(freelance|fulltime|contract)\/(\d+)\/([A-Za-z0-9-]+)/g;
  let m;
  while ((m = re.exec(html))) {
    const [, type, id, slug] = m;
    jobs.set(id, {
      id: `behance:${id}`,
      sourceKey: 'behance',
      source: 'Behance',
      type: type.toUpperCase(),
      title: slug.replace(/-/g, ' '),
      url: `https://www.behance.net/joblist/${type}/${id}/${slug}`,
      enrich: true,
    });
  }
  return jobs;
}

function unescapeJson(str) {
  try { return JSON.parse(`"${str}"`); } catch { return str; }
}

async function enrichBehance(job) {
  try {
    const { body: html } = await fetchBehancePage(job.url);
    if (!html) return job;
    const t = html.match(/"title":"((?:[^"\\]|\\.){5,200}?)"/);
    if (t) {
      const title = unescapeJson(t[1]).trim();
      // Behance a veces sirve un muro de aviso ("Adult content") en lugar de la
      // oferta. Si lo detectamos, conservamos el título derivado del slug.
      if (GATE_TITLES.test(title)) job.gated = true;
      else job.title = title;
    }
    const d = html.match(/"description":"((?:[^"\\]|\\.){60,})?"/);
    if (d && d[1] && !job.gated) job.description = unescapeJson(d[1]);
    const b = html.match(/"budgetMin":(\d+),"budgetMax":(\d+)/);
    const c = html.match(/"salaryCurrency":"([A-Z]+)"/);
    if (b) job.budget = `${Math.round(b[1] / 100).toLocaleString('en-US')}–${Math.round(b[2] / 100).toLocaleString('en-US')} ${c ? c[1] : 'USD'}`;
  } catch (e) { /* seguimos con lo que tengamos */ }
  return job;
}

async function sourceBehance() {
  const all = new Map();
  let lastVia = 'ninguno';
  const allFails = [];
  for (const term of SEARCHES) {
    const url = 'https://www.behance.net/joblist' + (term ? `?search=${encodeURIComponent(term)}` : '');
    const { body: html, via, fails } = await fetchBehancePage(url);
    lastVia = via;
    if (fails.length) allFails.push(...fails);
    for (const [, job] of extractBehanceJobs(html)) all.set(job.id, job);
    await new Promise((r) => setTimeout(r, 1000));
  }
  return { jobs: [...all.values()], via: lastVia, fails: allFails };
}

// ──────────────────── Fuente: We Work Remotely (RSS) ────────────────────
function stripCdata(s) { return (s || '').replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim(); }
function decodeEntities(s) {
  return (s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ');
}
function rssTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? decodeEntities(stripCdata(m[1])) : '';
}

async function sourceWeWorkRemotely() {
  const url = 'https://weworkremotely.com/categories/remote-design-jobs.rss';
  const validate = (b) => b.includes('<item>') || b.includes('<item ');
  const { body, via, fails } = await fetchVia(url, [
    [url, 'directo', { validate }],
    [`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, 'allorigins', { validate }],
  ]);
  const jobs = [];
  const items = body.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const item of items) {
    const link = rssTag(item, 'link') || rssTag(item, 'guid');
    if (!link) continue;
    const slug = (link.split('/').filter(Boolean).pop() || link).slice(0, 120);
    const rawTitle = rssTag(item, 'title');                 // formato: "Empresa: Puesto"
    const title = rawTitle.replace(/\s*:\s*/, ' — ');
    const category = rssTag(item, 'category');
    const description = rssTag(item, 'description').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    jobs.push({
      id: `wwr:${slug}`,
      sourceKey: 'wwr',
      source: 'We Work Remotely',
      type: (category || 'REMOTE').toUpperCase(),
      title: title || slug.replace(/-/g, ' '),
      url: link,
      description,
    });
  }
  return { jobs, via, fails };
}

// ─────────────────────── Fuente: Remote OK (API JSON) ───────────────────────
async function sourceRemoteOK() {
  const url = 'https://remoteok.com/api';
  const validate = (b) => b.trim().startsWith('[');
  const { body, via, fails } = await fetchVia(url, [
    [url, 'directo', { validate }],
    [`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, 'allorigins', { validate }],
  ]);
  const jobs = [];
  let data = [];
  try { data = JSON.parse(body); } catch { return { jobs, via: `${via} (json inválido)`, fails }; }
  for (const it of data) {
    if (!it || !it.id || !it.position) continue;            // el primer elemento es un aviso legal
    const description = String(it.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    let budget = '';
    if (it.salary_min && it.salary_max) {
      budget = `${Number(it.salary_min).toLocaleString('en-US')}–${Number(it.salary_max).toLocaleString('en-US')} USD`;
    }
    jobs.push({
      id: `rok:${it.id}`,
      sourceKey: 'remoteok',
      source: 'Remote OK',
      type: 'REMOTE',
      title: it.company ? `${it.company} — ${it.position}` : it.position,
      url: it.url || `https://remoteok.com/remote-jobs/${it.id}`,
      description: `${(it.tags || []).join(' ')} ${description}`.trim(),
      budget,
    });
  }
  return { jobs, via, fails };
}

const SOURCES = [
  { key: 'behance', name: 'Behance', fetch: sourceBehance },
  { key: 'wwr', name: 'We Work Remotely', fetch: sourceWeWorkRemotely },
  { key: 'remoteok', name: 'Remote OK', fetch: sourceRemoteOK },
];

async function sendTelegram(text) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: text.slice(0, 4000), disable_web_page_preview: true }),
  });
  if (!res.ok) console.log(`  Telegram respondió ${res.status}: ${await res.text()}`);
  return res.ok;
}

// ───────────── Cola de ofertas en la rama «cola» (API de contenidos) ─────────────
async function ghApi(pathname, opts = {}) {
  const res = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}${pathname}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'behance-vigilante',
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    },
    signal: AbortSignal.timeout(30000),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* respuesta no JSON */ }
  return { status: res.status, json, text };
}

// Crea la rama «cola» a partir de main si todavía no existe.
async function asegurarRamaCola() {
  const r = await ghApi(`/git/ref/heads/${COLA_RAMA}`);
  if (r.status === 200) return true;
  const main = await ghApi('/git/ref/heads/main');
  if (main.status !== 200) { console.log(`  Cola: no se pudo leer main (${main.status}).`); return false; }
  const c = await ghApi('/git/refs', { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${COLA_RAMA}`, sha: main.json.object.sha }) });
  if (c.status !== 201 && c.status !== 422) { console.log(`  Cola: no se pudo crear la rama (${c.status}).`); return false; }
  return true;
}

function ofertaParaCola(job) {
  return {
    id: String(job.id).split(':').pop(),
    tipo: job.type,
    titulo: job.title,
    presupuesto: job.budget || '',
    enlace: job.url,
    descripcion: (job.description || '').slice(0, COLA_DESC_MAX),
    vista: new Date().toISOString(),
  };
}

// Añade las ofertas a ofertas.json (las nuevas arriba). Un fallo aquí no tumba
// el vigilante: se registra en el log y Telegram sigue funcionando igual.
async function publicarCola(jobs) {
  if (!jobs.length) return 'vacia';
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPOSITORY) return 'sin-config';
  try {
    if (!(await asegurarRamaCola())) return 'error-rama';
    for (let intento = 1; intento <= 2; intento++) {
      const actual = await ghApi(`/contents/${COLA_ARCHIVO}?ref=${COLA_RAMA}`);
      let previas = [];
      let sha;
      if (actual.status === 200) {
        sha = actual.json.sha;
        try { previas = JSON.parse(Buffer.from(actual.json.content, 'base64').toString('utf8')).ofertas || []; } catch { previas = []; }
      } else if (actual.status !== 404) {
        console.log(`  Cola: no se pudo leer ${COLA_ARCHIVO} (${actual.status}).`);
        return `error-${actual.status}`;
      }
      const nuevas = jobs.map(ofertaParaCola).filter((o) => !previas.some((p) => p.id === o.id));
      if (!nuevas.length) return 'ya-estaban';
      const ofertas = [...nuevas, ...previas].slice(0, COLA_MAX);
      const contenido = JSON.stringify({ actualizado: new Date().toISOString(), ofertas }, null, 2);
      const put = await ghApi(`/contents/${COLA_ARCHIVO}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: `cola: ${nuevas.length} oferta(s) nueva(s) de Behance`,
          content: Buffer.from(contenido, 'utf8').toString('base64'),
          branch: COLA_RAMA,
          ...(sha ? { sha } : {}),
        }),
      });
      if (put.status === 200 || put.status === 201) return `publicada-${nuevas.length}`;
      if (put.status !== 409 && put.status !== 422) {
        console.log(`  Cola: error al guardar (${put.status}): ${put.text.slice(0, 200)}`);
        return `error-${put.status}`;
      }
      // 409/422: alguien cambió el archivo entre medias; se reintenta una vez.
    }
    return 'error-conflicto';
  } catch (e) {
    console.log(`  Cola: ${e.message}`);
    return 'error-red';
  }
}

// Texto que recibe la tarea de Claude. El formato «OFERTA DEL BOT» es el que
// espera su prompt: no lo cambies sin cambiar también la tarea.
function routineText(job) {
  const desc = (job.description || '').slice(0, ROUTINE_DESC_MAX);
  return [
    'OFERTA DEL BOT (behance-vigilante)',
    `ID: ${String(job.id).split(':').pop()}`,
    `Fuente: ${job.source}`,
    `Tipo: ${job.type}`,
    `Título: ${job.title}`,
    `Presupuesto: ${job.budget || 'no indicado'}`,
    `Enlace: ${job.url}`,
    'Descripción:',
    desc || '(el bot no pudo leer la descripción: ábrela en el enlace)',
  ].join('\n');
}

// Lanza la tarea de revisión. Devuelve una etiqueta corta para el log/Telegram.
// Sin reintentos: cada llamada correcta crea una sesión nueva (no hay clave de
// idempotencia), así que reintentar a ciegas duplicaría revisiones.
async function fireRoutine(job, state) {
  const token = process.env.CLAUDE_ROUTINE_TOKEN;
  const id = process.env.CLAUDE_ROUTINE_ID;
  if (!token || !id) return 'sin-config';
  if (!ROUTINE_SOURCES.includes(job.sourceKey) || job.gated) return 'no-aplica';
  const haceUnaHora = Date.now() - 60 * 60 * 1000;
  state.routineFires = (state.routineFires || []).filter((t) => t > haceUnaHora);
  if (state.routineFires.length >= ROUTINE_MAX_POR_HORA) return 'limite-hora';
  try {
    const res = await fetch(`https://api.anthropic.com/v1/claude_code/routines/${id}/fire`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: routineText(job) }),
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) {
      state.routineFires.push(Date.now());
      return 'lanzada';
    }
    console.log(`  Tarea de revisión respondió ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return `error-${res.status}`;
  } catch (e) {
    console.log(`  Tarea de revisión: ${e.message}`);
    return 'error-red';
  }
}

// Estado: formato nuevo { v:2, seen:[ids], initialized:[fuentes], blindSince, blindNotified }.
// Compatibilidad: si seen.json es un array antiguo, son ids de Behance ya vistos.
function loadState() {
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (Array.isArray(raw)) {
      // Formato antiguo: ids de Behance sin prefijo → los normalizamos a behance:<id>
      const seen = raw.map((id) => (String(id).includes(':') ? id : `behance:${id}`));
      return { seen: new Set(seen), initialized: new Set(['behance']), blindSince: 0, blindNotified: false, sourceFails: {}, sourceSkip: {}, routineFires: [] };
    }
    return {
      seen: new Set(raw.seen || []),
      initialized: new Set(raw.initialized || []),
      blindSince: raw.blindSince || 0,
      blindNotified: !!raw.blindNotified,
      sourceFails: raw.sourceFails || {},
      sourceSkip: raw.sourceSkip || {},
      routineFires: raw.routineFires || [],
    };
  } catch {
    return null; // primera ejecución
  }
}

function saveState(state) {
  const seen = [...state.seen].slice(-MAX_SEEN);
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify({
    v: 2,
    seen,
    initialized: [...state.initialized],
    blindSince: state.blindSince || 0,
    blindNotified: !!state.blindNotified,
    sourceFails: state.sourceFails || {},
    sourceSkip: state.sourceSkip || {},
    routineFires: state.routineFires || [],
  }));
}

async function main() {
  let state = loadState();
  const firstRun = state === null;
  if (firstRun) state = { seen: new Set(), initialized: new Set(), blindSince: 0, blindNotified: false, sourceFails: {}, sourceSkip: {}, routineFires: [] };

  const all = new Map();
  const ahora = Date.now();

  // La pausa sirve para que una fuente caída no frene a las demás. Si acabaran
  // TODAS en pausa, el vigilante se quedaría inactivo a propósito y retrasaría su
  // propia recuperación, así que en ese caso se levantan las pausas y se reintenta.
  if (SOURCES.every((s) => (state.sourceSkip[s.key] || 0) > ahora)) {
    console.log('Todas las fuentes estaban en pausa: se levantan las pausas para reintentar.');
    for (const s of SOURCES) state.sourceSkip[s.key] = 0;
  }

  for (const src of SOURCES) {
    // Pausa progresiva: una fuente caída (p. ej. Behance bloqueado) tarda minutos
    // en agotar todos sus proxies y retrasa a las que sí funcionan. Tras varios
    // fallos seguidos se la deja descansar, doblando la espera hasta 1 h.
    if ((state.sourceSkip[src.key] || 0) > ahora) {
      const min = Math.round((state.sourceSkip[src.key] - ahora) / 60000);
      console.log(`${src.name}: en pausa ${min} min (lleva ${state.sourceFails[src.key]} fallos seguidos).`);
      continue;
    }
    let result;
    try {
      result = await src.fetch();
    } catch (e) {
      console.log(`${src.name}: error — ${e.message}`);
      result = { jobs: [], via: 'excepción', fails: [] };
    }
    const { jobs, via, fails } = result;
    console.log(`${src.name}: ${jobs.length} ofertas (vía ${via})${fails && fails.length ? ' · fallos: ' + fails.join(' | ') : ''}`);
    if (jobs.length) {
      state.sourceFails[src.key] = 0;
      state.sourceSkip[src.key] = 0;
    } else {
      const n = (state.sourceFails[src.key] || 0) + 1;
      state.sourceFails[src.key] = n;
      if (n >= BACKOFF_TRAS) {
        const espera = Math.min(BACKOFF_BASE_MS * 2 ** (n - BACKOFF_TRAS), BACKOFF_MAX_MS);
        state.sourceSkip[src.key] = Date.now() + espera;
        console.log(`  ${src.name} en pausa ${Math.round(espera / 60000)} min tras ${n} fallos seguidos.`);
      }
    }
    for (const job of jobs) all.set(job.id, job);
  }

  // Vigilante ciego: ninguna fuente devolvió nada. Antes se salía en silencio, y
  // si los proxies caían podías pasar DÍAS sin avisos creyendo que no había ofertas
  // (pasó en sept-2026). Ahora, si la ceguera dura más de BLIND_ALERT_MS, avisa una
  // sola vez por Telegram; al recuperarse avisa de la vuelta y reinicia el contador.
  if (all.size === 0) {
    const ahora = Date.now();
    if (!state.blindSince) state.blindSince = ahora;
    const minutos = Math.round((ahora - state.blindSince) / 60000);
    console.log(`Sin datos esta vez (todas las fuentes inaccesibles) — lleva ${minutos} min sin leer nada.`);
    if (ahora - state.blindSince >= BLIND_ALERT_MS && !state.blindNotified) {
      const ok = await sendTelegram(
        `⚠️ El vigilante lleva ${minutos} min sin poder leer NINGUNA plataforma.\n\n` +
        'Suele ser que Behance bloquea al runner y los proxies de lectura están caídos. ' +
        'Mientras tanto NO te llegan ofertas, aunque las haya.\n\n' +
        'Revisa los logs en Actions → Vigilante Behance.'
      );
      state.blindNotified = true;
      console.log(`  Aviso de ceguera ${ok ? 'enviado' : 'NO enviado (error Telegram)'}.`);
    }
    saveState(state);
    process.exit(0);
  }

  // Se recuperó la visión: avisa solo si antes se notificó la caída.
  if (state.blindNotified) {
    const minutos = Math.round((Date.now() - state.blindSince) / 60000);
    await sendTelegram(`✅ El vigilante vuelve a leer las plataformas (estuvo ${minutos} min sin datos). Se reanudan los avisos.`);
    console.log(`Recuperado tras ${minutos} min sin datos.`);
  }
  state.blindSince = 0;
  state.blindNotified = false;

  // Línea base por fuente: una fuente no inicializada (o la primera ejecución global)
  // registra sus ofertas actuales como vistas SIN avisar.
  const presentSources = new Set([...all.values()].map((j) => j.sourceKey));
  const newJobs = [];
  let baselined = 0;
  for (const job of all.values()) {
    if (state.seen.has(job.id)) continue;
    const sourceReady = !firstRun && state.initialized.has(job.sourceKey);
    if (sourceReady) {
      newJobs.push(job);
    } else {
      state.seen.add(job.id);
      baselined++;
    }
  }
  for (const k of presentSources) state.initialized.add(k);

  if (baselined) {
    console.log(`Línea base registrada para ${baselined} oferta(s) de fuentes nuevas (sin avisos).`);
  }

  console.log(`${newJobs.length} oferta(s) nueva(s) de ${all.size} vigiladas.`);
  const paraCola = [];
  for (const job of newJobs) {
    // Se marca como vista aunque luego la descarten los filtros: si no, cada
    // pasada volvería a analizarla (y a abrir su página en Behance).
    state.seen.add(job.id);
    if (job.enrich) await enrichBehance(job);
    if (!passesFilters(job.title, job.description)) {
      console.log(`  Descartada por filtros [${job.source}]: ${job.title}`);
      continue;
    }
    const revision = await fireRoutine(job, state);
    const enCola = ROUTINE_SOURCES.includes(job.sourceKey) && !job.gated;
    if (enCola) paraCola.push(job);
    const lineaRevision = {
      lanzada: '\n🤖 Revisión automática en marcha: si encaja, la contesto y te aviso.',
      'limite-hora': '\n⏸ Revisión automática en pausa (más de 20 ofertas en 1 h): revísala tú.',
    }[revision] || (revision.startsWith('error') ? `\n⚠️ No se pudo lanzar la revisión automática (${revision}).` : '')
      || (enCola ? '\n🤖 En cola: la reviso en la próxima hora y, si encaja, la contesto.' : '');
    const proposal = buildProposal(job.title, job.description);
    const msg = `🔔 Nueva oferta en ${job.source} (${job.type})\n${job.title}${job.budget ? '\n💰 ' + job.budget : ''}\n${job.url}${lineaRevision}\n\n--- Propuesta sugerida ---\n${proposal}`;
    const ok = await sendTelegram(msg);
    console.log(`  ${ok ? 'Enviada a Telegram' : 'ERROR Telegram'} [${job.source}] (revisión: ${revision}): ${job.title}`);
  }
  if (paraCola.length) console.log(`Cola de revisión: ${await publicarCola(paraCola)}.`);

  saveState(state);
}

main().catch((e) => { console.error(e); process.exit(1); });
