#!/usr/bin/env node
/*
 * Vigilante de ofertas — versión GitHub Actions (Leo Visual) · v3 (31/10/2026)
 * Corre en la nube en bucle (una pasada cada ~1 min): detecta ofertas nuevas en
 * Behance (y, con menos frecuencia, en We Work Remotely y Remote OK), puntúa si
 * encajan con los servicios de Leo, avisa por Telegram y deja las que encajan en
 * la cola que revisa la tarea de Claude «Respuesta a ofertas del bot Behance».
 *
 * Secretos del repositorio: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (y opcionales:
 * DISPATCH_PAT, CLAUDE_ROUTINE_TOKEN). GITHUB_TOKEN lo inyecta el workflow.
 * Estado: estado/seen.json (persistido entre ejecuciones con actions/cache)
 * Modo diagnóstico: DIAGNOSTICO=1 node vigilante.js (prueba cada proxy y publica
 * el resultado en la rama «cola», archivo diagnostico.json; no avisa ni guarda estado).
 */
const fs = require('fs');
const path = require('path');

const VERSION = 'v3 · 31/10/2026';

// ───────────────────────────── Configuración ─────────────────────────────
// Behance: dos listas ordenadas por «lo más reciente» (sort=recent). Una oferta
// nueva sale arriba del todo, así que basta con mirar la primera página de cada
// una en cada pasada. Antes se miraba la primera página de 10 búsquedas en orden
// «recomendado», y una oferta nueva podía tardar o no aparecer nunca.
const BEHANCE_LISTAS = [
  'https://www.behance.net/joblist?jobType=freelance&sort=recent',
  'https://www.behance.net/joblist?jobType=fulltime&jobType=contract&sort=recent',
];
const BEHANCE_PAGINA2_CADA = 10;   // cada N pasadas se mira también la página 2 (por si llega una ráfaga)
// Respaldo: si las listas ordenadas no devuelven nada, se usan las búsquedas antiguas.
const SEARCHES = ['', 'branding', 'logo', 'social media', 'motion graphics', 'graphic design', 'video', 'advertising', 'ugc', 'amazon'];
const OTRAS_FUENTES_CADA = 5;      // We Work Remotely y Remote OK: cada 5 pasadas (cambian poco)

const INCLUDE = ['brand', 'logo', 'graphic', 'design', 'social', 'motion', 'video', 'content', 'instagram', 'tiktok', 'youtube', 'identity', 'visual', 'creative', 'ai', 'marketing', 'advertising', 'advertisement', 'commercial', 'commercials', 'ads', 'ugc', 'amazon', 'promo', 'promotional', 'ecommerce', 'e-commerce', 'reel', 'reels', 'product', 'web', 'website', 'landing', 'animation', 'editor', '3d', 'automation', 'agent', 'agents', 'diseño', 'vídeo', 'video', 'contenido', 'publicidad', 'anuncio', 'anuncios', 'marca', 'redes'];
const EXCLUDE = ['software engineer', 'backend', 'frontend developer', 'fullstack', 'drafter', 'accountant', 'adult content', 'adult', 'nsfw', 'onlyfans', 'porn', 'escort', 'webcam', 'sexual', 'contenido para adultos'];
// Títulos que en realidad son el muro de aviso de Behance, no la oferta real.
const GATE_TITLES = /^(adult content|content warning|mature content|sensitive content|contenido para adultos)$/i;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';
const STATE_FILE = path.join(__dirname, 'estado', 'seen.json');
const MAX_SEEN = 3000;
// Si NINGUNA fuente devuelve datos durante este tiempo, avisa por Telegram (una vez).
const BLIND_ALERT_MS = 30 * 60 * 1000; // 30 min (antes 1 h: con pasadas de 1 min se nota antes)
// Pausa progresiva de una fuente caída, para que no ralentice a las que funcionan.
const BACKOFF_TRAS = 3;                 // fallos seguidos antes de empezar a pausarla
const BACKOFF_BASE_MS = 2 * 60 * 1000;  // primera pausa: 2 min (se dobla cada fallo)
const BACKOFF_MAX_MS = 30 * 60 * 1000;  // tope: 30 min
// Revisión automática con Claude. Vía principal: la cola (rama «cola», ofertas.json),
// que la tarea «Respuesta a ofertas del bot Behance» lee cada hora. Vía opcional al
// instante: si existe CLAUDE_ROUTINE_TOKEN, se lanza la tarea por cada oferta.
const ROUTINE_SOURCES = ['behance'];    // de qué fuentes se encarga Claude
const ROUTINE_MAX_POR_HORA = 20;        // la API admite 30 por hora y tarea; dejamos margen
const ROUTINE_DESC_MAX = 6000;
const COLA_RAMA = 'cola';
const COLA_ARCHIVO = 'ofertas.json';
const ESTADO_ARCHIVO = 'estado.json';   // salud del vigilante (lo mira la tarea de Claude)
const ESTADO_CADA_MS = 30 * 60 * 1000;
const COLA_MAX = 100;
const COLA_DESC_MAX = 1500;
const NIVELES_A_COLA = ['alto', 'medio']; // las de encaje bajo o nulo no gastan revisión

// ───────────────────── Encaje con los servicios de Leo ─────────────────────
// Lo que Leo hace de verdad (LeoVisual.nl): vídeo y anuncios con IA, contenido de
// producto y Amazon (listings, A+), webs (también 3D de scroll), motion, diseño
// para redes y anuncios estáticos, y sistemas de agentes de IA / automatización.
const ENCAJE_ALTO = [
  /\bai[- ]?(generated )?video|v[ií]deo(s)? (con|de) ia|generative video|text[- ]to[- ]video|ai film|filmmak|cinematic|cine con ia/i,
  /video ad|ad creative|ads? creative|commercial|spot publicitario|anuncio|publicidad en v[ií]deo|\bugc\b|creatives? for (meta|tiktok|facebook)/i,
  /motion (graphic|design)|motion designer|after effects|animated (ad|video)|animaci[oó]n/i,
  /video edit|editor de v[ií]deo|edici[oó]n de v[ií]deo|short[- ]form|\breels?\b|tiktok video|youtube shorts|shorts editor/i,
  /amazon|\ba\+ ?content|a plus content|listing (images|design)|product (images|photos|video|render|visuals)|cgi|3d product|ecommerce visuals/i,
  /\bkling\b|\brunway\b|midjourney|\bveo\b|\bsora\b|higgsfield|seedance|stable diffusion|ai artist|ai image|ai visual|generative ai|ia generativa|nano banana/i,
  /landing page|web ?design|website|p[aá]gina web|webflow|framer|three\.?js|3d (web|website)|scroll/i,
  /ai automation|automatizaci[oó]n|ai agents?|agentes? de ia|\bn8n\b|make\.com|zapier|chatbot|whatsapp bot|telegram bot/i,
];
const ENCAJE_MEDIO = [
  /graphic design|dise[ñn]o gr[aá]fico|social media|redes sociales|static ad|banner|thumbnail|miniatura|youtube|presentation|pitch deck|infograph|content creator|creador de contenido/i,
  /branding|brand identity|identidad visual|\blogo\b|packaging|photo ?edit|retouch|retoque|\b3d\b|visual design|storytelling|creative designer|dise[ñn]ador(a)? creativ/i,
  /\bai\b|\bia\b|artificial intelligence|inteligencia artificial/i,
];
const NO_ENCAJA = [
  { re: /jewel(le)?ry|joyer[ií]a|tattoo|tatuaje/i, motivo: 'joyería o tatuaje' },
  { re: /architect|arquitect|interior design|interiorismo|furniture|mobiliario|autocad|draftsman|drafter|drafting|site plan|floor plan|\bcad\b/i, motivo: 'arquitectura, interiores o CAD' },
  { re: /fashion design|dise[ñn]o de moda|garment|pattern mak|embroider|bordado|textile design/i, motivo: 'moda o textil' },
  { re: /voice ?over|voice actor|locutor|singer|cantante|translator|traductor|accountant|contable|sales rep|cold call/i, motivo: 'voz, traducción, ventas o contabilidad' },
  { re: /backend|full ?stack|devops|game developer|unity developer|unreal developer|ios developer|android developer|software engineer/i, motivo: 'programación' },
  { re: /on[- ]?site|in[- ]person|presencial|must be (based|located) in|relocat/i, motivo: 'presencial o exige vivir en otro sitio' },
  { re: /adult|nsfw|onlyfans|porn|escort|sexual|contenido para adultos/i, motivo: 'contenido para adultos' },
];
const SENIOR = /\b(head of|director|principal|vp\b|chief)|\b(8|9|10|12|15)\+? (years|años)/i;

function encaje(job) {
  const texto = `${job.title} ${job.description || ''} ${(job.categorias || []).join(' ')}`;
  const no = NO_ENCAJA.find((n) => n.re.test(texto));
  const altos = ENCAJE_ALTO.filter((re) => re.test(texto)).length;
  const medios = ENCAJE_MEDIO.filter((re) => re.test(texto)).length;
  const motivos = [];
  let nivel = altos ? 'alto' : medios ? 'medio' : 'bajo';
  // «Presencial» solo descarta si lo dice el título o si la oferta no es remota:
  // en la descripción puede salir en frases como «no on-site work needed».
  const esPresencial = no && no.motivo.startsWith('presencial');
  if (no && (!esPresencial || no.re.test(job.title) || !job.remoto)) {
    return { nivel: 'no', motivos: [no.motivo] };
  }
  if (job.remoto === false) { nivel = 'no'; motivos.push(`presencial${job.ubicacion ? ' en ' + job.ubicacion : ''}`); }
  if (nivel !== 'no' && SENIOR.test(texto) && nivel === 'alto') { nivel = 'medio'; motivos.push('perfil senior'); }
  if (job.presupuestoMaxUSD != null && job.presupuestoMaxUSD > 0 && job.presupuestoMaxUSD <= 100 && job.tipoBase === 'FREELANCE') {
    nivel = 'no'; motivos.push('presupuesto de 100 USD o menos');
  }
  if (job.moneda === 'INR') { nivel = 'no'; motivos.push('pago en rupias'); }
  return { nivel, motivos, altos, medios };
}

function idioma(texto) {
  const es = (texto.match(/\b(de|para|con|que|buscamos|necesito|necesitamos|dise[ñn]o|v[ií]deo|empresa|marca|nuestro|nuestra|proyecto)\b/gi) || []).length;
  const en = (texto.match(/\b(the|and|for|with|we|our|looking|need|design|project|brand|you)\b/gi) || []).length;
  return es > en ? 'es' : 'en';
}

// ───────────────────── Propuesta sugerida (honesta) ─────────────────────
// Solo hechos reales del portfolio de Leo. Nunca «exactamente lo que hago» ni
// años, premios o clientes inventados. La tarea de Claude escribe su propia carta;
// esta es la de respaldo para que Leo la copie si quiere.
const LINEAS_TEMA = [
  { re: /video|v[ií]deo|ugc|commercial|anuncio|\bads?\b|film|cinematic|reels?|short/i,
    en: 'I produce short AI-assisted video ads end to end (concept, generation, editing and sound), like the cinematic spec ads ORBE and SILENCIO in my portfolio.',
    es: 'Produzco anuncios en vídeo con IA de principio a fin (idea, generación, montaje y sonido), como los anuncios ORBE y SILENCIO de mi portfolio.' },
  { re: /amazon|a\+|listing|product|producto|ecommerce|e-commerce/i,
    en: 'I create Amazon listing images, A+ content and product videos, and I have done this for a home-goods brand that sells across Europe.',
    es: 'Hago imágenes de listing, contenido A+ y vídeos de producto para Amazon; lo he hecho para una marca de hogar que vende en toda Europa.' },
  { re: /web|landing|website|p[aá]gina|3d|scroll|framer|webflow/i,
    en: 'I build fast, animated websites and landing pages, including 3D scroll experiences (LUMEN, FORJA and MORVAIN in my portfolio).',
    es: 'Hago webs y landings rápidas y animadas, también experiencias 3D con scroll (LUMEN, FORJA y MORVAIN en mi portfolio).' },
  { re: /motion|animat|animaci/i,
    en: 'Motion graphics and short-form editing are part of my daily work.',
    es: 'El motion graphics y la edición de vídeo corto son parte de mi trabajo diario.' },
  { re: /automation|automatiz|agent|n8n|make\.com|zapier|chatbot|bot\b/i,
    en: 'I also design and set up AI agent systems and automations (WhatsApp/Telegram agents, daily reports, n8n/Make).',
    es: 'También diseño y monto sistemas de agentes de IA y automatizaciones (agentes de WhatsApp/Telegram, informes diarios, n8n/Make).' },
  { re: /graphic|gr[aá]fico|social|redes|static|banner|instagram|tiktok/i,
    en: 'I design static ads and social media creatives, combining classic design with AI image tools.',
    es: 'Diseño anuncios estáticos y piezas para redes, combinando diseño clásico con herramientas de imagen con IA.' },
];

function buildProposal(job, lang) {
  const texto = `${job.title} ${job.description || ''}`;
  const lineas = LINEAS_TEMA.filter((t) => t.re.test(texto)).slice(0, 2).map((t) => t[lang]);
  // Saluda por el nombre de pila solo si el contacto es una persona (no la empresa).
  const esPersona = job.contacto && job.contacto.trim() && job.contacto.trim() !== String(job.empresa || '').trim();
  const pila = esPersona ? job.contacto.trim().split(/\s+/)[0] : '';
  const saludo = pila ? pila.charAt(0).toUpperCase() + pila.slice(1) : '';
  if (lang === 'es') {
    return [
      `¡Hola${saludo ? ' ' + saludo : ''}! Soy Leo, de LeoVisual.nl, un estudio creativo con IA en Ámsterdam.`,
      `He leído tu oferta «${job.title}».`,
      ...lineas,
      'Portfolio: behance.net/leostudiocreative · leovisual.nl',
      'Si te encaja, te enseño 2–3 trabajos parecidos o hago una pequeña prueba. ¿Qué plazos tienes?',
      'Leo Gómez · LeoVisual.nl',
    ].join('\n');
  }
  return [
    `Hi${saludo ? ' ' + saludo : ''}! I'm Leo from LeoVisual.nl, a small AI-driven creative studio in Amsterdam.`,
    `I read your post "${job.title}".`,
    ...lineas,
    'Portfolio: behance.net/leostudiocreative · leovisual.nl',
    'If it helps, I can share 2–3 similar pieces or do a short paid test. What is your timeline?',
    'Leo Gómez · LeoVisual.nl',
  ].join('\n');
}

// Coincidencia por palabra completa: evita falsos positivos como 'ai' dentro de
// "email"/"available" o 'content' dentro de "Adult content".
function hasKeyword(text, keywords) {
  return keywords.some((k) => new RegExp(`(^|[^\\p{L}\\p{N}])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}\\p{N}])`, 'iu').test(text));
}

function passesFilters(title, description) {
  const text = `${title} ${description || ''}`;
  if (hasKeyword(text, EXCLUDE)) return false;
  return hasKeyword(text, INCLUDE);
}

// ───────────────────────────── Red y proxies ─────────────────────────────
async function tryFetch(url, label, opts = {}) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', ...(opts.headers || {}) }, signal: AbortSignal.timeout(opts.timeout || 25000) });
    if (res.ok) {
      const body = await res.text();
      if (opts.validate ? opts.validate(body) : body.length > 100) return { ok: true, via: label, body, ms: Date.now() - t0 };
      return { ok: false, via: `${label} no válido (${body.length} B)`, ms: Date.now() - t0 };
    }
    return { ok: false, via: `${label} HTTP ${res.status}`, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, via: `${label} ${e.name === 'TimeoutError' ? 'tiempo agotado' : e.message}`, ms: Date.now() - t0 };
  }
}

// Prueba los intentos en orden hasta que uno valide. Si se le pasa `pref`, el que
// funcionó la última vez va primero (aprende qué proxy está vivo y no pierde tiempo).
async function fetchVia(url, attempts, pref) {
  const fails = [];
  const ordered = pref ? [...attempts].sort((a, b) => (b[1] === pref) - (a[1] === pref)) : attempts;
  for (const [u, label, opts] of ordered) {
    const r = await tryFetch(u, label, opts);
    if (r.ok) return { body: r.body, via: r.via, fails };
    fails.push(r.via);
  }
  return { body: '', via: 'ninguno', fails };
}

// ───────────────────────────── Fuente: Behance ─────────────────────────────
// Validación estricta: una página de error puede devolver HTTP 200 y bastante
// tamaño, así que exigimos que de verdad parezca Behance con ofertas.
function behanceValidate(html) {
  return html.includes('beconfig-store_state') || /\/joblist\/(freelance|fulltime|contract)\/\d+/.test(html);
}

// Behance bloquea la IP de los runners (403), así que todo depende de los proxies
// de lectura. Se prueban varios porque caen con frecuencia (sept-2026: jina 403 y
// allorigins 5xx a la vez → días ciego). Si quitas proxies, deja siempre más de uno.
function behanceIntentos(url) {
  const enc = encodeURIComponent(url);
  const v = { validate: behanceValidate };
  return [
    [`https://api.codetabs.com/v1/proxy/?quest=${enc}`, 'codetabs', v],
    [`https://corsproxy.io/?url=${enc}`, 'corsproxy', v],
    [`https://api.allorigins.win/raw?url=${enc}`, 'allorigins', v],
    [`https://r.jina.ai/${url}`, 'jina', { ...v, headers: { 'X-Return-Format': 'html' } }],
    [url, 'directo', v],
  ];
}

let ESTADO_RED = null; // referencia al estado para recordar el proxy preferido
async function fetchBehancePage(url) {
  const pref = ESTADO_RED && ESTADO_RED.proxyBehance;
  const r = await fetchVia(url, behanceIntentos(url), pref);
  if (ESTADO_RED && r.body) ESTADO_RED.proxyBehance = r.via;
  return r;
}

// Estado JSON que Behance incrusta en cada página (script#beconfig-store_state).
function behanceEstado(html) {
  const m = html.match(/<script[^>]*id="beconfig-store_state"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

const centimos = (v) => (v == null ? null : Math.round(Number(v) / 100));
function formatoDinero(min, max, moneda, periodo) {
  if (min == null && max == null) return '';
  const f = (n) => Number(n).toLocaleString('es-ES');
  const rango = min != null && max != null && min !== max ? `${f(min)}–${f(max)}` : f(max != null ? max : min);
  const per = { HOURLY: '/h', MONTHLY: '/mes', ANNUAL: '/año', WEEKLY: '/semana', DAILY: '/día' }[periodo] || '';
  return `${rango} ${moneda || 'USD'}${per}`;
}

function nodoAOferta(n) {
  const tipoBase = String(n.jobType || '').toUpperCase();
  const ruta = tipoBase === 'FREELANCE' ? 'freelance' : tipoBase === 'CONTRACT' ? 'contract' : 'fulltime';
  const min = centimos(n.budgetMin);
  const max = centimos(n.budgetMax);
  const ubic = (n.location && (n.location.displayName || n.location)) || (n.locations || []).map((l) => l.displayName || l.city || l.country).filter(Boolean).join(', ');
  return {
    id: `behance:${n.id}`,
    sourceKey: 'behance',
    source: 'Behance',
    type: tipoBase || 'BEHANCE',
    tipoBase,
    title: n.title || `Oferta ${n.id}`,
    url: n.url || `https://www.behance.net/joblist/${ruta}/${n.id}/`,
    budget: formatoDinero(min, max, n.salaryCurrency, n.salaryTimeframe),
    presupuestoMaxUSD: n.salaryCurrency === 'USD' ? max : null,
    moneda: n.salaryCurrency || '',
    remoto: n.isRemote === true || n.remoteStatus === 'REMOTE' ? true : (n.isRemote === false && n.remoteStatus && n.remoteStatus !== 'REMOTE' ? false : null),
    ubicacion: typeof ubic === 'string' ? ubic : '',
    empresa: n.companyName || (n.company && n.company.name) || '',
    contacto: (n.hiringContact && n.hiringContact.displayName) || '',
    enrich: true,
  };
}

// Extrae las ofertas: primero del estado JSON (más datos); si no está, de los enlaces.
function extractBehanceJobs(html) {
  const jobs = new Map();
  const st = behanceEstado(html);
  const nodes = st && st.combinedJobListings && st.combinedJobListings.combinedJobListings && st.combinedJobListings.combinedJobListings.nodes;
  if (Array.isArray(nodes) && nodes.length) {
    for (const n of nodes) if (n && n.id) jobs.set(String(n.id), nodoAOferta(n));
    return jobs;
  }
  const re = /\/joblist\/(freelance|fulltime|contract)\/(\d+)\/([A-Za-z0-9()%-]+)/g;
  let m;
  while ((m = re.exec(html))) {
    const [, type, id, slug] = m;
    if (jobs.has(id)) continue;
    jobs.set(id, {
      id: `behance:${id}`, sourceKey: 'behance', source: 'Behance', type: type.toUpperCase(), tipoBase: type.toUpperCase(),
      title: decodeURIComponent(slug).replace(/-/g, ' '), url: `https://www.behance.net/joblist/${type}/${id}/${slug}`, enrich: true,
    });
  }
  return jobs;
}

const htmlATexto = (s) => String(s || '')
  .replace(/<\/(p|li|h\d|div)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

// Abre la ficha de la oferta (anónima) y completa descripción, solicitantes,
// ubicación, fecha de cierre… desde el estado JSON. Si no hay estado, usa el método
// antiguo por expresiones regulares.
async function enrichBehance(job) {
  try {
    const { body: html } = await fetchBehancePage(job.url);
    if (!html) return job;
    const st = behanceEstado(html);
    const jd = st && st.jobDetails;
    const full = jd && jd.job;
    const free = jd && jd.freelanceBriefPublicInfo;
    if (full || free) {
      const d = full || free;
      if (d.title && !GATE_TITLES.test(d.title)) job.title = d.title; else if (d.title) job.gated = true;
      const partes = [d.description, free && free.deliverables, free && free.candidateInfo, free && free.designStyle, free && free.additionalDetails]
        .filter((x) => x && x !== '####').map(htmlATexto);
      job.description = partes.join('\n').trim();
      const sol = full ? (full.publicApplicantCount ?? full.applicationsCount) : free.applicantCount;
      if (sol != null) job.solicitantes = sol;
      const cierre = full ? full.expiresOn : free.expirationDate;
      if (cierre) job.cierraEnDias = Math.max(0, Math.round((cierre * 1000 - Date.now()) / 86400000));
      if (full && full.postedOn) job.publicadaHaceH = Math.max(0, Math.round((Date.now() - full.postedOn * 1000) / 3600000));
      if (full && full.locationDisplay && !job.ubicacion) job.ubicacion = full.locationDisplay;
      if (full && full.remoteStatus) job.remoto = full.remoteStatus === 'REMOTE' ? true : (full.remoteStatus === 'ONSITE' ? false : job.remoto);
      if (full && full.company && full.company.name && !job.empresa) job.empresa = full.company.name;
      if (free && free.company && !job.empresa) job.empresa = String(free.company).trim();
      const contacto = (full && full.creator && full.creator.displayName) || (free && free.hiringContact && free.hiringContact.displayName);
      if (contacto && !job.contacto) job.contacto = contacto;
      if (full && full.allowedApplyPlace) job.dondeSolicitar = full.allowedApplyPlace === 'BEHANCE' ? 'Behance' : 'web externa';
      const cats = [...((full && full.creativeFields) || []), ...((free && free.categories) || [])].map((c) => c && c.name).filter(Boolean);
      if (cats.length) job.categorias = cats;
      if (!job.budget && free && (free.budgetMin != null || free.budgetMax != null)) {
        job.budget = formatoDinero(centimos(free.budgetMin), centimos(free.budgetMax), free.currency);
        if (free.currency === 'USD') job.presupuestoMaxUSD = centimos(free.budgetMax);
      }
      if (!job.budget && full && (full.salaryMin != null || full.salaryMax != null)) {
        job.budget = formatoDinero(full.salaryMin, full.salaryMax, full.salaryCurrency, full.salaryTimeframe);
      }
      return job;
    }
    // Método antiguo (por si Behance cambia el estado): primeros campos del JSON embebido.
    const t = html.match(/"title":"((?:[^"\\]|\\.){5,200}?)"/);
    if (t) {
      const title = unescapeJson(t[1]).trim();
      if (GATE_TITLES.test(title)) job.gated = true; else if (!job.title || /^Oferta \d+$/.test(job.title)) job.title = title;
    }
    const d = html.match(/"description":"((?:[^"\\]|\\.){60,})?"/);
    if (d && d[1] && !job.gated) job.description = htmlATexto(unescapeJson(d[1]));
  } catch (e) { /* seguimos con lo que tengamos */ }
  return job;
}

function unescapeJson(str) {
  try { return JSON.parse(`"${str}"`); } catch { return str; }
}

async function sourceBehance(state) {
  const all = new Map();
  let lastVia = 'ninguno';
  const allFails = [];
  const urls = [...BEHANCE_LISTAS];
  // Página 2 cada N pasadas, y siempre en la pasada de estreno de la v3 (para que
  // su línea base la incluya y no lleguen de golpe ofertas antiguas).
  if ((state.pasada || 0) % BEHANCE_PAGINA2_CADA === 0 || !state.migradoV3) urls.push(...BEHANCE_LISTAS.map((u) => `${u}&page=2`));
  for (const url of urls) {
    const { body: html, via, fails } = await fetchBehancePage(url);
    lastVia = via;
    if (fails.length) allFails.push(...fails);
    for (const [, job] of extractBehanceJobs(html)) all.set(job.id, job);
  }
  // Respaldo: si las listas ordenadas no dan nada, búsquedas antiguas (orden «recomendado»).
  if (!all.size) {
    for (const term of SEARCHES) {
      const url = 'https://www.behance.net/joblist' + (term ? `?search=${encodeURIComponent(term)}` : '');
      const { body: html, via, fails } = await fetchBehancePage(url);
      lastVia = `${via} (búsquedas de respaldo)`;
      if (fails.length) allFails.push(...fails);
      for (const [, job] of extractBehanceJobs(html)) all.set(job.id, job);
      if (all.size) break; // con una que funcione basta para esta pasada
    }
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
    [`https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`, 'codetabs', { validate }],
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
    const region = rssTag(item, 'region');
    const description = rssTag(item, 'description').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    jobs.push({
      id: `wwr:${slug}`, sourceKey: 'wwr', source: 'We Work Remotely', type: (category || 'REMOTE').toUpperCase(),
      title: title || slug.replace(/-/g, ' '), url: link, description, ubicacion: region, remoto: true,
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
      budget = `${Number(it.salary_min).toLocaleString('es-ES')}–${Number(it.salary_max).toLocaleString('es-ES')} USD/año`;
    }
    jobs.push({
      id: `rok:${it.id}`, sourceKey: 'remoteok', source: 'Remote OK', type: 'REMOTE',
      title: it.company ? `${it.company} — ${it.position}` : it.position,
      url: it.url || `https://remoteok.com/remote-jobs/${it.id}`,
      description: `${(it.tags || []).join(' ')} ${description}`.trim(), budget, ubicacion: it.location || '', remoto: true,
    });
  }
  return { jobs, via, fails };
}

const SOURCES = [
  { key: 'behance', name: 'Behance', fetch: sourceBehance, cada: 1 },
  { key: 'wwr', name: 'We Work Remotely', fetch: sourceWeWorkRemotely, cada: OTRAS_FUENTES_CADA },
  { key: 'remoteok', name: 'Remote OK', fetch: sourceRemoteOK, cada: OTRAS_FUENTES_CADA },
];

// ─────────────────────────────── Telegram ───────────────────────────────
async function sendTelegram(text, { silencioso = false, html = false } = {}) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: text.slice(0, 4000),
        disable_web_page_preview: true,
        disable_notification: silencioso,
        ...(html ? { parse_mode: 'HTML' } : {}),
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.log(`  Telegram respondió ${res.status}: ${(await res.text()).slice(0, 300)}`);
      // Si el HTML no le gusta a Telegram, se reintenta una vez en texto plano.
      if (html && res.status === 400) return sendTelegram(text.replace(/<\/?(b|i|code)>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'), { silencioso });
    }
    return res.ok;
  } catch (e) {
    console.log(`  Telegram: ${e.message}`);
    return false;
  }
}

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const ETIQUETA = {
  alto: '🔥 ENCAJA',
  medio: '✅ PUEDE ENCAJAR',
  bajo: '⚪ POCO ENCAJE',
  no: '⛔ NO ENCAJA',
};

function mensajeTelegram(job, enc, lineaRevision) {
  const datos = [
    job.budget && `💰 ${esc(job.budget)}`,
    job.remoto === true ? '🌍 Remoto' : job.remoto === false ? `📍 Presencial${job.ubicacion ? ' · ' + esc(job.ubicacion) : ''}` : (job.ubicacion ? `📍 ${esc(job.ubicacion)}` : ''),
    job.solicitantes != null && `👥 ${job.solicitantes} solicitantes`,
    job.cierraEnDias != null && `⏳ cierra en ${job.cierraEnDias} d`,
  ].filter(Boolean).join(' · ');
  const quien = [job.empresa, job.contacto].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map(esc).join(' · ');
  const motivos = enc.motivos && enc.motivos.length ? ` (${esc(enc.motivos.join(', '))})` : '';
  const cabecera = `${ETIQUETA[enc.nivel]}${motivos} · ${esc(job.source)} ${esc(job.type)}`;
  const partes = [cabecera, `<b>${esc(job.title)}</b>`];
  if (datos) partes.push(datos);
  if (quien) partes.push(`🏢 ${quien}`);
  if (job.dondeSolicitar === 'web externa') partes.push('↗️ Se solicita en la web de la empresa');
  partes.push(esc(job.url));
  if (lineaRevision) partes.push(lineaRevision);
  if (enc.nivel === 'alto' || enc.nivel === 'medio') {
    const lang = idioma(`${job.title} ${job.description || ''}`);
    partes.push('', '— Propuesta para copiar —', esc(buildProposal(job, lang)));
  }
  return partes.join('\n');
}

// ───────────── Cola de ofertas y estado en la rama «cola» (API de contenidos) ─────────────
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

// Lee un JSON de la rama «cola», lo transforma y lo guarda (reintenta una vez si choca).
async function actualizarArchivoCola(archivo, transformar, mensaje) {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPOSITORY) return 'sin-config';
  try {
    if (!(await asegurarRamaCola())) return 'error-rama';
    for (let intento = 1; intento <= 2; intento++) {
      const actual = await ghApi(`/contents/${archivo}?ref=${COLA_RAMA}`);
      let previo = null;
      let sha;
      if (actual.status === 200) {
        sha = actual.json.sha;
        try { previo = JSON.parse(Buffer.from(actual.json.content, 'base64').toString('utf8')); } catch { previo = null; }
      } else if (actual.status !== 404) {
        console.log(`  ${archivo}: no se pudo leer (${actual.status}).`);
        return `error-${actual.status}`;
      }
      const nuevo = transformar(previo);
      if (nuevo === null) return 'sin-cambios';
      const put = await ghApi(`/contents/${archivo}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: mensaje,
          content: Buffer.from(JSON.stringify(nuevo, null, 2), 'utf8').toString('base64'),
          branch: COLA_RAMA,
          ...(sha ? { sha } : {}),
        }),
      });
      if (put.status === 200 || put.status === 201) return 'ok';
      if (put.status !== 409 && put.status !== 422) {
        console.log(`  ${archivo}: error al guardar (${put.status}): ${put.text.slice(0, 200)}`);
        return `error-${put.status}`;
      }
    }
    return 'error-conflicto';
  } catch (e) {
    console.log(`  ${archivo}: ${e.message}`);
    return 'error-red';
  }
}

function ofertaParaCola(job, enc) {
  return {
    id: String(job.id).split(':').pop(),
    tipo: job.type,
    titulo: job.title,
    presupuesto: job.budget || '',
    enlace: job.url,
    encaje: enc ? enc.nivel : '',
    remoto: job.remoto,
    ubicacion: job.ubicacion || '',
    empresa: job.empresa || '',
    contacto: job.contacto || '',
    solicitantes: job.solicitantes ?? null,
    cierraEnDias: job.cierraEnDias ?? null,
    dondeSolicitar: job.dondeSolicitar || '',
    descripcion: (job.description || '').slice(0, COLA_DESC_MAX),
    vista: new Date().toISOString(),
  };
}

// Añade las ofertas a ofertas.json (las nuevas arriba). Un fallo aquí no tumba
// el vigilante: se registra en el log y Telegram sigue funcionando igual.
async function publicarCola(items) {
  if (!items.length) return 'vacia';
  let n = 0;
  const r = await actualizarArchivoCola(COLA_ARCHIVO, (previo) => {
    const previas = (previo && previo.ofertas) || [];
    const nuevas = items.map(({ job, enc }) => ofertaParaCola(job, enc)).filter((o) => !previas.some((p) => p.id === o.id));
    n = nuevas.length;
    if (!n) return null;
    return { actualizado: new Date().toISOString(), ofertas: [...nuevas, ...previas].slice(0, COLA_MAX) };
  }, `cola: ${items.length} oferta(s) nueva(s) de Behance`);
  return r === 'ok' ? `publicada-${n}` : r === 'sin-cambios' ? 'ya-estaban' : r;
}

// Salud del vigilante para la tarea de Claude (y para diagnosticar sin logs).
async function publicarEstado(state, extra = {}) {
  const hoy = new Date().toISOString().slice(0, 10);
  const r = await actualizarArchivoCola(ESTADO_ARCHIVO, () => ({
    version: VERSION,
    actualizado: new Date().toISOString(),
    ultimaPasadaConDatos: state.ultimaPasadaConDatos ? new Date(state.ultimaPasadaConDatos).toISOString() : null,
    ciegoDesde: state.blindSince ? new Date(state.blindSince).toISOString() : null,
    proxyBehance: state.proxyBehance || null,
    pasadas: state.pasada || 0,
    hoy: { fecha: hoy, ...(state.stats && state.stats.fecha === hoy ? state.stats : {}) },
    fuentes: Object.fromEntries(SOURCES.map((s) => [s.key, { fallosSeguidos: state.sourceFails[s.key] || 0, pausadaHasta: state.sourceSkip[s.key] ? new Date(state.sourceSkip[s.key]).toISOString() : null }])),
    ...extra,
  }), 'estado: salud del vigilante');
  if (r === 'ok') state.estadoPublicado = Date.now();
  return r;
}

// ───────────── Lanzamiento al instante de la tarea de Claude (opcional) ─────────────
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
      headers: { Authorization: `Bearer ${token}`, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: routineText(job) }),
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) { state.routineFires.push(Date.now()); return 'lanzada'; }
    console.log(`  Tarea de revisión respondió ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return `error-${res.status}`;
  } catch (e) {
    console.log(`  Tarea de revisión: ${e.message}`);
    return 'error-red';
  }
}

// ───────────────────────────────── Estado ─────────────────────────────────
// Estado: { v:2, seen:[ids], initialized:[fuentes], blindSince, blindNotified, … }.
// Compatibilidad: si seen.json es un array antiguo, son ids de Behance ya vistos.
function estadoVacio() {
  return { seen: new Set(), initialized: new Set(), blindSince: 0, blindNotified: false, sourceFails: {}, sourceSkip: {}, routineFires: [], pasada: 0, proxyBehance: null, ultimaPasadaConDatos: 0, estadoPublicado: 0, stats: null, migradoV3: false };
}
function loadState() {
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (Array.isArray(raw)) {
      const seen = raw.map((id) => (String(id).includes(':') ? id : `behance:${id}`));
      return { ...estadoVacio(), seen: new Set(seen), initialized: new Set(['behance']) };
    }
    return {
      ...estadoVacio(),
      seen: new Set(raw.seen || []),
      initialized: new Set(raw.initialized || []),
      blindSince: raw.blindSince || 0,
      blindNotified: !!raw.blindNotified,
      sourceFails: raw.sourceFails || {},
      sourceSkip: raw.sourceSkip || {},
      routineFires: raw.routineFires || [],
      pasada: raw.pasada || 0,
      proxyBehance: raw.proxyBehance || null,
      ultimaPasadaConDatos: raw.ultimaPasadaConDatos || 0,
      estadoPublicado: raw.estadoPublicado || 0,
      stats: raw.stats || null,
      migradoV3: !!raw.migradoV3,
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
    pasada: state.pasada || 0,
    proxyBehance: state.proxyBehance || null,
    ultimaPasadaConDatos: state.ultimaPasadaConDatos || 0,
    estadoPublicado: state.estadoPublicado || 0,
    stats: state.stats || null,
    migradoV3: !!state.migradoV3,
  }));
}

function contar(state, clave) {
  const hoy = new Date().toISOString().slice(0, 10);
  if (!state.stats || state.stats.fecha !== hoy) state.stats = { fecha: hoy, nuevas: 0, alto: 0, medio: 0, bajo: 0, no: 0, enCola: 0 };
  state.stats[clave] = (state.stats[clave] || 0) + 1;
}

// ─────────────────────────────── Diagnóstico ───────────────────────────────
async function diagnostico() {
  const resultados = [];
  const urls = [...BEHANCE_LISTAS, 'https://www.behance.net/joblist/freelance/561599/x'];
  for (const url of urls) {
    for (const [u, label, opts] of behanceIntentos(url)) {
      const r = await tryFetch(u, label, opts);
      let ofertas = 0;
      let conEstado = false;
      let ejemplo = '';
      if (r.ok) {
        conEstado = !!behanceEstado(r.body);
        const jobs = [...extractBehanceJobs(r.body).values()];
        ofertas = jobs.length;
        ejemplo = jobs.slice(0, 3).map((j) => `${j.id} ${j.title}`).join(' | ');
        if (/\/freelance\/561599\//.test(url)) {
          const st = behanceEstado(r.body);
          ejemplo = st && st.jobDetails ? JSON.stringify(st.jobDetails.freelanceBriefPublicInfo || st.jobDetails.job || {}).slice(0, 300) : r.body.slice(0, 200);
        }
      }
      resultados.push({ url, proxy: label, ok: r.ok, via: r.via, ms: r.ms, conEstado, ofertas, ejemplo });
      console.log(`${label.padEnd(10)} ${r.ok ? 'OK ' : 'MAL'} ${String(r.ms).padStart(5)} ms · estado ${conEstado ? 'sí' : 'no'} · ${ofertas} ofertas · ${url.slice(24, 90)} · ${r.ok ? ejemplo.slice(0, 120) : r.via}`);
    }
  }
  const pub = await actualizarArchivoCola('diagnostico.json', () => ({ version: VERSION, fecha: new Date().toISOString(), resultados }), 'diagnóstico de proxies');
  console.log(`Diagnóstico publicado en la rama cola: ${pub}`);
}

// ───────────────────────────────── Principal ─────────────────────────────────
async function main() {
  if (process.env.DIAGNOSTICO === '1') return diagnostico();
  let state = loadState();
  const firstRun = state === null;
  if (firstRun) state = estadoVacio();
  ESTADO_RED = state;
  state.pasada = (state.pasada || 0) + 1;

  const all = new Map();
  const ahora = Date.now();

  // La pausa sirve para que una fuente caída no frene a las demás. Si acabaran
  // TODAS en pausa, el vigilante se quedaría inactivo a propósito y retrasaría su
  // propia recuperación, así que en ese caso se levantan las pausas y se reintenta.
  if (SOURCES.every((s) => (state.sourceSkip[s.key] || 0) > ahora)) {
    console.log('Todas las fuentes estaban en pausa: se levantan las pausas para reintentar.');
    for (const s of SOURCES) state.sourceSkip[s.key] = 0;
  }

  let consultadas = 0;
  for (const src of SOURCES) {
    // Las fuentes lentas se consultan cada N pasadas (siempre en la primera de un ciclo).
    if (src.cada > 1 && state.pasada % src.cada !== 1 && !firstRun) continue;
    if ((state.sourceSkip[src.key] || 0) > ahora) {
      const min = Math.round((state.sourceSkip[src.key] - ahora) / 60000);
      console.log(`${src.name}: en pausa ${min} min (lleva ${state.sourceFails[src.key]} fallos seguidos).`);
      continue;
    }
    consultadas++;
    let result;
    try {
      result = await src.fetch(state);
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

  // Vigilante ciego: ninguna fuente consultada devolvió nada. Si dura más de
  // BLIND_ALERT_MS, avisa UNA vez por Telegram; al recuperarse, avisa de la vuelta.
  if (all.size === 0) {
    if (consultadas > 0) {
      if (!state.blindSince) state.blindSince = ahora;
      const minutos = Math.round((ahora - state.blindSince) / 60000);
      console.log(`Sin datos esta vez (todas las fuentes inaccesibles) — lleva ${minutos} min sin leer nada.`);
      if (ahora - state.blindSince >= BLIND_ALERT_MS && !state.blindNotified) {
        const ok = await sendTelegram(
          `⚠️ El vigilante lleva ${minutos} min sin poder leer NINGUNA plataforma.\n\n` +
          'Suele ser que Behance bloquea al runner y los proxies de lectura están caídos. ' +
          'Mientras tanto NO te llegan ofertas, aunque las haya. Sigue reintentando solo.\n\n' +
          'Revisa los logs en Actions → Vigilante Behance.'
        );
        state.blindNotified = true;
        console.log(`  Aviso de ceguera ${ok ? 'enviado' : 'NO enviado (error Telegram)'}.`);
        await publicarEstado(state);
      }
    }
    if (Date.now() - (state.estadoPublicado || 0) > ESTADO_CADA_MS) await publicarEstado(state);
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
  state.ultimaPasadaConDatos = Date.now();

  // Línea base por fuente: una fuente no inicializada (o la primera ejecución global)
  // registra sus ofertas actuales como vistas SIN avisar.
  const presentSources = new Set([...all.values()].map((j) => j.sourceKey));
  // Estreno de la v3: las listas «más recientes» traen ofertas que las búsquedas
  // antiguas nunca vieron. Se registran como vistas SIN avisar, una sola vez.
  const estrenoV3 = !state.migradoV3 && presentSources.has('behance');
  const newJobs = [];
  let baselined = 0;
  for (const job of all.values()) {
    if (state.seen.has(job.id)) continue;
    const sourceReady = !firstRun && state.initialized.has(job.sourceKey) && !(estrenoV3 && job.sourceKey === 'behance');
    if (sourceReady) newJobs.push(job);
    else { state.seen.add(job.id); baselined++; }
  }
  for (const k of presentSources) state.initialized.add(k);
  if (estrenoV3) state.migradoV3 = true;
  if (baselined) console.log(`Línea base registrada para ${baselined} oferta(s) de fuentes nuevas${estrenoV3 ? ' (estreno de la v3)' : ''} (sin avisos).`);

  console.log(`${newJobs.length} oferta(s) nueva(s) de ${all.size} vigiladas (pasada ${state.pasada}, proxy ${state.proxyBehance || '—'}).`);
  const paraCola = [];
  for (const job of newJobs) {
    // Se marca como vista aunque luego la descarten los filtros: si no, cada
    // pasada volvería a analizarla (y a abrir su página en Behance).
    state.seen.add(job.id);
    contar(state, 'nuevas');
    if (job.enrich) await enrichBehance(job);
    if (job.gated || !passesFilters(job.title, job.description)) {
      console.log(`  Descartada por filtros [${job.source}]: ${job.title}`);
      continue;
    }
    const enc = encaje(job);
    contar(state, enc.nivel);
    const aClaude = ROUTINE_SOURCES.includes(job.sourceKey) && NIVELES_A_COLA.includes(enc.nivel);
    const revision = aClaude ? await fireRoutine(job, state) : 'no-aplica';
    if (aClaude) { paraCola.push({ job, enc }); contar(state, 'enCola'); }
    const lineaRevision = {
      lanzada: '🤖 Revisión automática en marcha: si encaja, la contesto y te aviso.',
      'limite-hora': '⏸ Revisión automática en pausa (más de 20 en 1 h): revísala tú.',
    }[revision] || (revision.startsWith('error') ? `⚠️ No se pudo lanzar la revisión automática (${revision}).` : '')
      || (aClaude ? '🤖 En cola: la reviso en la próxima hora y, si encaja, la contesto.' : '');
    // Las que no encajan llegan en silencio (sin sonido) para no molestar.
    const silencioso = enc.nivel === 'bajo' || enc.nivel === 'no';
    const ok = await sendTelegram(mensajeTelegram(job, enc, lineaRevision), { silencioso, html: true });
    console.log(`  ${ok ? 'Enviada a Telegram' : 'ERROR Telegram'} [${job.source}] [${enc.nivel}] (revisión: ${revision}): ${job.title}`);
  }
  if (paraCola.length) console.log(`Cola de revisión: ${await publicarCola(paraCola)}.`);
  if (Date.now() - (state.estadoPublicado || 0) > ESTADO_CADA_MS) console.log(`Estado publicado: ${await publicarEstado(state)}.`);

  saveState(state);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { main, encaje, idioma, buildProposal, extractBehanceJobs, behanceEstado, nodoAOferta, enrichBehance, mensajeTelegram, publicarCola, publicarEstado, routineText, fireRoutine, passesFilters, formatoDinero };
