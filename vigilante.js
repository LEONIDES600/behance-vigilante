#!/usr/bin/env node
/*
 * Vigilante de ofertas de Behance — versión GitHub Actions (Leo Visual)
 * Corre en la nube cada ~10 minutos: detecta ofertas nuevas y las envía a
 * Telegram con una propuesta personalizada, aunque el PC esté apagado.
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

async function tryFetch(url, label) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' }, signal: AbortSignal.timeout(30000) });
    if (res.ok) {
      const html = await res.text();
      if (html.includes('/joblist/') || html.length > 5000) return { ok: true, via: label, html };
    }
    return { ok: false, via: `${label} HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, via: `${label} ${e.message}` };
  }
}

// Intenta directo y, si Behance bloquea la IP del runner, pasa por proxies de lectura
async function fetchPage(url) {
  const attempts = [
    [url, 'directo'],
    [`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, 'allorigins'],
    [`https://r.jina.ai/${url}`, 'jina'],
  ];
  const fails = [];
  for (const [u, label] of attempts) {
    const r = await tryFetch(u, label);
    if (r.ok) return { html: r.html, via: r.via, fails };
    fails.push(r.via);
  }
  return { html: '', via: 'ninguno', fails };
}

function extractJobs(html) {
  const jobs = new Map();
  const re = /\/joblist\/(freelance|fulltime|contract)\/(\d+)\/([A-Za-z0-9-]+)/g;
  let m;
  while ((m = re.exec(html))) {
    const [, type, id, slug] = m;
    jobs.set(id, { id, type: type.toUpperCase(), title: slug.replace(/-/g, ' '), url: `https://www.behance.net/joblist/${type}/${id}/${slug}` });
  }
  return jobs;
}

function unescapeJson(str) {
  try { return JSON.parse(`"${str}"`); } catch { return str; }
}

async function enrichJob(job) {
  try {
    const { html } = await fetchPage(job.url);
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

async function sendTelegram(text) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: text.slice(0, 4000), disable_web_page_preview: true }),
  });
  if (!res.ok) console.log(`  Telegram respondió ${res.status}: ${await res.text()}`);
  return res.ok;
}

async function main() {
  let seen = null;
  try { seen = new Set(JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))); } catch { /* primera ejecución */ }
  const firstRun = !seen;
  if (firstRun) seen = new Set();

  const all = new Map();
  for (const term of SEARCHES) {
    const url = 'https://www.behance.net/joblist' + (term ? `?search=${encodeURIComponent(term)}` : '');
    const { html, via, fails } = await fetchPage(url);
    const jobs = extractJobs(html);
    console.log(`${term || '(portada)'}: ${jobs.size} ofertas (vía ${via})${fails.length ? ' · fallos: ' + fails.join(' | ') : ''}`);
    for (const [id, job] of jobs) all.set(id, job);
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (all.size === 0) {
    console.log('Sin datos esta vez (Behance y proxies inaccesibles) — se reintenta en el próximo ciclo.');
    process.exit(0);
  }

  const newJobs = [...all.values()].filter((j) => !seen.has(j.id));

  if (firstRun) {
    console.log(`Primera ejecución: ${all.size} ofertas registradas como línea base (sin avisos).`);
  } else {
    console.log(`${newJobs.length} oferta(s) nueva(s) de ${all.size} vigiladas.`);
    for (const j of newJobs) {
      const job = await enrichJob(j);
      if (!passesFilters(job.title, job.description)) {
        console.log(`  Descartada por filtros: ${job.title}`);
        continue;
      }
      const proposal = buildProposal(job.title, job.description);
      const msg = `🔔 Nueva oferta en Behance (${job.type})\n${job.title}${job.budget ? '\n💰 ' + job.budget : ''}\n${job.url}\n\n--- Propuesta sugerida ---\n${proposal}`;
      const ok = await sendTelegram(msg);
      console.log(`  ${ok ? 'Enviada a Telegram' : 'ERROR Telegram'}: ${job.title}`);
    }
  }

  const ids = [...seen, ...newJobs.map((j) => j.id)].slice(-MAX_SEEN);
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(ids));
}

main().catch((e) => { console.error(e); process.exit(1); });
