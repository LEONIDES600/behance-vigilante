#!/usr/bin/env node
/*
 * Vigilante de ofertas — versión GitHub Actions (Leo Visual)
 * Corre en la nube cada ~10 minutos: detecta ofertas nuevas en varias
 * plataformas (Behance, We Work Remotely, Remote OK) y las envía a Telegram
 * con una propuesta personalizada, aunque el PC esté apagado.
 *
 * Secretos del repositorio: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 * Estado: estado/seen.json (persistido entre ejecuciones con actions/cache)
 */
const fs = require('fs');
const path = require('path');

const SEARCHES = ['', 'branding', 'logo', 'social media', 'motion graphics', 'graphic design'];
const INCLUDE = ['brand', 'logo', 'graphic', 'design', 'social', 'motion', 'video', 'content', 'instagram', 'tiktok', 'youtube', 'identity', 'visual', 'creative', 'ai', 'marketing'];
const EXCLUDE = ['software engineer', 'backend', 'frontend developer', 'fullstack', 'drafter', 'copywriter', 'accountant'];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';
const STATE_FILE = path.join(__dirname, 'estado', 'seen.json');
const MAX_SEEN = 3000;

const TOPIC_LINES = [
  { match: /youtube|channel/i, line: 'I produce channel branding and video content for YouTube on a regular basis, so I know exactly what works for thumbnails, banners and channel identity.' },
  { match: /instagram|tiktok|social media|social-media|reels/i, line: 'I create social media content daily for Instagram, TikTok and LinkedIn, combining design, motion and AI tools to keep feeds consistent and fast-moving.' },
  { match: /logo|brand|identity|naming/i, line: 'Branding and visual identity are the core of my studio: logo systems, brand guidelines and full identity rollouts.' },
  { match: /motion|animation|animated|video edit|video-edit|after effects/i, line: 'Motion graphics and video are part of my daily toolkit, from short-form social clips to full animated brand pieces.' },
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

function passesFilters(title, description) {
  const text = `${title} ${description || ''}`.toLowerCase();
  if (EXCLUDE.some((k) => text.includes(k))) return false;
  return INCLUDE.some((k) => text.includes(k));
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
function behanceValidate(html) { return html.includes('/joblist/') || html.length > 5000; }

async function fetchBehancePage(url) {
  return fetchVia(url, [
    [url, 'directo', { validate: behanceValidate }],
    [`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, 'allorigins', { validate: behanceValidate }],
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
    if (t) job.title = unescapeJson(t[1]);
    const d = html.match(/"description":"((?:[^"\\]|\\.){60,})?"/);
    if (d && d[1]) job.description = unescapeJson(d[1]);
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

// Estado: formato nuevo { v:2, seen:[ids], initialized:[fuentes] }.
// Compatibilidad: si seen.json es un array antiguo, son ids de Behance ya vistos.
function loadState() {
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (Array.isArray(raw)) {
      // Formato antiguo: ids de Behance sin prefijo → los normalizamos a behance:<id>
      const seen = raw.map((id) => (String(id).includes(':') ? id : `behance:${id}`));
      return { seen: new Set(seen), initialized: new Set(['behance']) };
    }
    return { seen: new Set(raw.seen || []), initialized: new Set(raw.initialized || []) };
  } catch {
    return null; // primera ejecución
  }
}

function saveState(state) {
  const seen = [...state.seen].slice(-MAX_SEEN);
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify({ v: 2, seen, initialized: [...state.initialized] }));
}

async function main() {
  let state = loadState();
  const firstRun = state === null;
  if (firstRun) state = { seen: new Set(), initialized: new Set() };

  const all = new Map();
  for (const src of SOURCES) {
    let result;
    try {
      result = await src.fetch();
    } catch (e) {
      console.log(`${src.name}: error — ${e.message}`);
      continue;
    }
    const { jobs, via, fails } = result;
    console.log(`${src.name}: ${jobs.length} ofertas (vía ${via})${fails && fails.length ? ' · fallos: ' + fails.join(' | ') : ''}`);
    for (const job of jobs) all.set(job.id, job);
  }

  if (all.size === 0) {
    console.log('Sin datos esta vez (todas las fuentes inaccesibles) — se reintenta en el próximo ciclo.');
    process.exit(0);
  }

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
  for (const job of newJobs) {
    if (job.enrich) await enrichBehance(job);
    if (!passesFilters(job.title, job.description)) {
      console.log(`  Descartada por filtros [${job.source}]: ${job.title}`);
      continue;
    }
    const proposal = buildProposal(job.title, job.description);
    const msg = `🔔 Nueva oferta en ${job.source} (${job.type})\n${job.title}${job.budget ? '\n💰 ' + job.budget : ''}\n${job.url}\n\n--- Propuesta sugerida ---\n${proposal}`;
    const ok = await sendTelegram(msg);
    state.seen.add(job.id);
    console.log(`  ${ok ? 'Enviada a Telegram' : 'ERROR Telegram'} [${job.source}]: ${job.title}`);
  }

  saveState(state);
}

main().catch((e) => { console.error(e); process.exit(1); });
