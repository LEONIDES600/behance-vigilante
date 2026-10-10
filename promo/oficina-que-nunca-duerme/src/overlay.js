// Capa de postproducción: tipografía, paneles de interfaz y cierre de marca, en función de t.
import { clamp, prog, ease, noise1, FLOOR_T, DEPT_NAMES } from './util.js';
import { CUES, RAPID, RAPID_T, PPC_ITEMS, GUIDE_STEPS } from './copy.js';

const $ = s => document.querySelector(s);
const el = (tag, cls, html = '') => { const e = document.createElement(tag); if (cls) e.className = cls; e.innerHTML = html; return e; };

export function buildOverlay(root) {
  const cues = CUES.map(c => {
    const e = el('div', `cue ${c.cls} y-${c.y}`, `<span class="in">${c.html}</span>`);
    root.append(e);
    return { ...c, e };
  });

  const rapid = el('div', 'cue rapid y-r');
  root.append(rapid);

  const dept = el('div', 'cue dept y-d', '<span class="idx mono"></span><span class="name"></span>');
  root.append(dept);

  const flash = el('div', 'flash');
  root.prepend(flash);

  // Panel PPC
  const ppc = el('div', 'ui ppc', `
    <div class="ui-top mono"><span class="live"></span>Departamento PPC · Revisión nocturna<span class="ui-time">07:00</span></div>
    <div class="ui-tag mono">Tienda demo · Datos ilustrativos</div>
    <div class="ui-h">3 asuntos para revisar</div>
    ${PPC_ITEMS.map((it, i) => `
      <div class="item" data-i="${i}">
        <div class="n mono">${i + 1}</div>
        <div class="body"><b>${it.title}</b><span>${it.detail}</span><em>${it.prop}</em></div>
        <div class="acts"><span class="btn ok">Aprobar</span><span class="btn">Revisar</span></div>
      </div>`).join('')}
    <div class="ui-foot mono">Las propuestas esperan tu decisión</div>`);
  root.append(ppc);
  const items = [...ppc.querySelectorAll('.item')];
  const cursor = el('div', 'cursor', '<svg viewBox="0 0 24 24" width="44" height="44"><path d="M4 2l15 9-6.5 1.6L16 20l-3 1.4-3.4-7.3L4 18z" fill="#f4efe6" stroke="#0d0b09" stroke-width="1.2"/></svg>');
  root.append(cursor);

  // Guía de instalación
  const guide = el('div', 'ui guide', `
    <div class="ui-top mono"><span class="live"></span>Instalación local · Tu ordenador</div>
    <div class="ui-h">Guía de inicio</div>
    <ol>${GUIDE_STEPS.map(s => `<li><i></i><span>${s}</span></li>`).join('')}</ol>
    <div class="bar"><b></b></div>`);
  root.append(guide);
  const steps = [...guide.querySelectorAll('li')];

  // Cierre de marca
  const end = el('div', 'end', `
    <div class="brand">LeoVisual<span class="nl">.nl</span></div>
    <div class="cta c1">¿QUIERES VERLA POR DENTRO?</div>
    <div class="cta c2 mono">ESCRÍBEME POR PRIVADO</div>
    <div class="spark"></div>`);
  root.append(end);

  let geo = null;
  const measure = () => {
    const r = root.getBoundingClientRect();
    const b = items[0].querySelector('.btn.ok').getBoundingClientRect();
    geo = { x: b.left - r.left + b.width * 0.45, y: b.top - r.top + b.height * 0.55, w: r.width, h: r.height };
  };

  const show = (e, o, y = 0, blur = 0, extra = '') => {
    e.style.opacity = o;
    e.style.transform = `translateY(${y}px) ${extra}`;
    e.style.filter = blur > 0.05 ? `blur(${blur}px)` : 'none';
  };

  const update = t => {
    if (!geo) measure();
    for (const c of cues) {
      if (t < c.in - 0.01 || t > c.out + 0.01) { c.e.style.opacity = 0; continue; }
      if (c.fx === 'slam') {
        const k = ease.expoOut(prog(t, c.in, c.in + 0.16));
        const amp = 14 * Math.exp(-(t - c.in) * 9);
        const sx = noise1(t * 60) * amp, sy = noise1(t * 60 + 9) * amp;
        c.e.style.opacity = t < c.out ? 1 : 0;
        c.e.style.transform = `translate(${sx}px, ${sy}px) scale(${1 + 1.9 * (1 - k)})`;
        c.e.style.filter = 'none';
        continue;
      }
      const pin = ease.out(prog(t, c.in, c.in + 0.55));
      const pout = prog(t, c.out - 0.28, c.out);
      show(c.e, pin * (1 - pout), (1 - pin) * 34 - pout * 12, (1 - pin) * 10);
      c.e.querySelector('.in').style.letterSpacing = `${(0.14 * (1 - pin) - 0.01).toFixed(3)}em`;
    }

    // Flash del impacto «SON OCHO»
    flash.style.opacity = t >= 7.0 ? 0.55 * Math.exp(-(t - 7.0) * 16) : 0;

    // Palabras rápidas
    let ri = -1;
    for (let i = 0; i < RAPID_T.length; i++) if (t >= RAPID_T[i]) ri = i;
    if (ri >= 0 && t < 21.9) {
      const dur = ri < RAPID.length ? 0.42 : 0.25;
      const local = (t - RAPID_T[ri]) / dur;
      rapid.textContent = RAPID[ri % RAPID.length];
      rapid.style.opacity = local < 0.85 ? 1 : 0.35;
      rapid.style.transform = `scale(${1 + 0.06 * (1 - clamp(local * 3))})`;
      rapid.style.filter = 'none';
    } else rapid.style.opacity = 0;

    // Rótulo del departamento que se enciende
    let di = -1;
    for (let i = 0; i < 8; i++) if (t >= FLOOR_T[i]) di = i;
    if (di >= 0 && t < FLOOR_T[7] + 1.4) {
      const local = t - FLOOR_T[di];
      dept.querySelector('.idx').textContent = `DEPARTAMENTO ${di + 1}/8`;
      dept.querySelector('.name').textContent = DEPT_NAMES[di];
      const pin = ease.expoOut(clamp(local / 0.3));
      const out = di === 7 ? prog(t, FLOOR_T[7] + 1.1, FLOOR_T[7] + 1.4) : 0;
      show(dept, pin * (1 - out), (1 - pin) * 16);
    } else dept.style.opacity = 0;

    // Panel PPC
    const pIn = ease.out(prog(t, 42.75, 43.25)), pOut = prog(t, 47.25, 47.6);
    show(ppc, pIn * (1 - pOut), (1 - pIn) * 30, 0, 'translateX(-50%)');
    items.forEach((it, i) => {
      const a = ease.out(prog(t, 43.35 + i * 0.45, 43.75 + i * 0.45));
      it.style.opacity = a;
      it.style.transform = `translateY(${(1 - a) * 18}px)`;
    });
    const approved = t >= 46.1;
    items[0].classList.toggle('done', approved);
    items[0].querySelector('.btn.ok').textContent = approved ? '✓ Aprobado por ti' : 'Aprobar';
    // Cursor: entra, recorre y decide
    const cIn = prog(t, 44.9, 45.15) * (1 - pOut);
    const m = ease.inOut(prog(t, 44.95, 45.9));
    const cx = geo.w * 0.82 + (geo.x - geo.w * 0.82) * m;
    const cy = geo.h * 0.68 + (geo.y - geo.h * 0.68) * m + Math.sin(m * Math.PI) * -40;
    const press = t > 46.0 && t < 46.12 ? 0.86 : 1;
    cursor.style.opacity = cIn;
    cursor.style.transform = `translate(${cx}px, ${cy}px) scale(${press})`;

    // Guía
    const gIn = ease.out(prog(t, 52.5, 52.95)), gOut = prog(t, 54.65, 54.95);
    show(guide, gIn * (1 - gOut), (1 - gIn) * 30, 0, 'translateX(-50%)');
    steps.forEach((s, i) => {
      s.classList.toggle('done', t >= 53.0 + i * 0.45 && i < 2);
      s.classList.toggle('act', i === 2 && t >= 53.9);
    });
    guide.querySelector('.bar b').style.width = `${(prog(t, 52.9, 54.6) * 62).toFixed(1)}%`;

    // Cierre
    const bIn = ease.out(prog(t, 60.3, 60.85));
    end.style.opacity = t >= 60.25 ? 1 : 0;
    show(end.querySelector('.brand'), bIn, (1 - bIn) * 24, (1 - bIn) * 8);
    const c1 = ease.out(prog(t, 60.65, 61.1)), c2 = ease.out(prog(t, 60.95, 61.4));
    show(end.querySelector('.c1'), c1, (1 - c1) * 16);
    show(end.querySelector('.c2'), c2, (1 - c2) * 16);
    const spark = end.querySelector('.spark');
    const sOn = prog(t, 60.3, 60.5) * (1 - prog(t, 61.72, 61.8));
    spark.style.opacity = sOn;
    spark.style.transform = `translateX(-50%) scale(${1 + 0.25 * Math.sin(t * 7)})`;
  };
  return { update };
}
