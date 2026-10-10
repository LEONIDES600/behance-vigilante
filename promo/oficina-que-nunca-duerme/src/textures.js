// Texturas dibujadas en canvas 2D. Las animadas se redibujan en cada fotograma a partir de t.
import * as THREE from 'three';
import { rng, clamp, prog, ease, DEPTS } from './util.js';

const AMB = '#ffa63d';
const AMB_RGB = '255,166,61';
const PAPER = '#f4efe6';
const DISPLAY = '"Unbounded", sans-serif';
const MONO = '"JetBrains Mono", monospace';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function tex(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Palabra suelta (sprites de la tormenta)
export function word(text, color = PAPER) {
  const [c0, x0] = canvas(8, 8);
  x0.font = `900 140px ${DISPLAY}`;
  const w = Math.ceil(x0.measureText(text).width) + 40;
  const [c, x] = canvas(w, 190);
  x.font = `900 140px ${DISPLAY}`;
  x.fillStyle = color;
  x.textBaseline = 'middle';
  x.fillText(text, 20, 100);
  const t = tex(c);
  t.userData.aspect = w / 190;
  return t;
}

// Puntos que forman una palabra (para la chispa que se convierte en VENDER)
export function textPoints(text, scale, step = 3) {
  const [c, x] = canvas(1500, 320);
  x.font = `900 230px ${DISPLAY}`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillStyle = '#fff';
  x.fillText(text, 750, 165);
  const d = x.getImageData(0, 0, 1500, 320).data;
  const pts = [];
  for (let y = 0; y < 320; y += step)
    for (let i = 0; i < 1500; i += step)
      if (d[(y * 1500 + i) * 4 + 3] > 140) pts.push([(i - 750) * scale, (165 - y) * scale]);
  return pts;
}

export function dot() {
  const [c, x] = canvas(64, 64);
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return tex(c);
}

// Máscara del suelo mojado: blanco = seco/oscuro, negro = charco reflectante
export function wetMask(seed = 3) {
  const [c, x] = canvas(512, 512);
  const g = x.createRadialGradient(256, 256, 30, 256, 256, 256);
  g.addColorStop(0, '#2a2a2a');
  g.addColorStop(0.55, '#7a7a7a');
  g.addColorStop(1, '#ffffff');
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  const r = rng(seed);
  x.filter = 'blur(14px)';
  for (let i = 0; i < 90; i++) {
    const v = Math.floor(r() * 120 + 60);
    x.fillStyle = `rgba(${v},${v},${v},.35)`;
    x.beginPath();
    x.ellipse(r() * 512, r() * 512, 10 + r() * 50, 6 + r() * 30, r() * 3, 0, Math.PI * 2);
    x.fill();
  }
  x.filter = 'none';
  const t = new THREE.CanvasTexture(c);
  return t;
}

// Radial para manchas de luz en suelo y haces
export function glow(color = '255,166,61') {
  const [c, x] = canvas(256, 256);
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, `rgba(${color},1)`);
  g.addColorStop(0.4, `rgba(${color},.35)`);
  g.addColorStop(1, `rgba(${color},0)`);
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return tex(c);
}

// Haz de luz vertical (gradiente a lo largo)
export function shaft() {
  const [c, x] = canvas(128, 512);
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, 'rgba(255,214,150,.0)');
  g.addColorStop(0.15, 'rgba(255,214,150,.9)');
  g.addColorStop(1, 'rgba(255,214,150,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 512);
  const h = x.createLinearGradient(0, 0, 128, 0);
  h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)');
  x.globalCompositeOperation = 'destination-out';
  x.fillStyle = h; x.fillRect(0, 0, 128, 512);
  return tex(c);
}

// ---------- Portal: pasillo de marcos brutalistas con luz al fondo ----------
export function portal() {
  const [c, x] = canvas(1024, 680);
  const t = tex(c);
  t.userData.draw = (zoom, bright) => {
    const W = 1024, H = 680, cx = W / 2, cy = H / 2 + 20;
    x.fillStyle = '#050403'; x.fillRect(0, 0, W, H);
    // Luz del fondo
    const L = x.createRadialGradient(cx, cy, 0, cx, cy, 420);
    L.addColorStop(0, `rgba(255,248,235,${0.95 * bright})`);
    L.addColorStop(0.12, `rgba(255,196,107,${0.8 * bright})`);
    L.addColorStop(0.5, `rgba(255,140,40,${0.18 * bright})`);
    L.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = L; x.fillRect(0, 0, W, H);
    // Marcos: profundidad infinita, se acercan con zoom (de lejos a cerca)
    const N = 9;
    for (let k = N; k >= 0; k--) {
      const d = ((k - (zoom % 1)) + N) % N + 0.35;
      const s = 1 / (d * 0.55);
      const fw = 300 * s, fh = 470 * s, th = Math.max(4, 34 * s);
      if (fw > W * 3) continue;
      const a = clamp(1.4 - d / N);
      const lit = clamp(0.25 + bright * (1 - d / N));
      x.fillStyle = `rgba(${Math.round(30 + 110 * lit)},${Math.round(26 + 84 * lit)},${Math.round(22 + 48 * lit)},${a})`;
      x.beginPath();
      x.rect(cx - fw / 2, cy - fh / 2, fw, fh);
      x.rect(cx - fw / 2 + th, cy - fh / 2 + th, fw - th * 2, fh - th * 2);
      x.fill('evenodd');
      x.strokeStyle = `rgba(255,190,110,${0.7 * lit * a})`;
      x.lineWidth = Math.max(1, 2 * s);
      x.strokeRect(cx - fw / 2 + th, cy - fh / 2 + th, fw - th * 2, fh - th * 2);
    }
    t.needsUpdate = true;
  };
  t.userData.draw(0, 0);
  return t;
}

// ---------- Paneles de trabajo (escena 3) ----------
function glyph(x, k, w, h, r) {
  x.strokeStyle = AMB; x.fillStyle = AMB; x.lineWidth = 2;
  const ox = 18, oy = 46, gw = w - 36, gh = h - 64;
  switch (k) {
    case 0: for (let i = 0; i < 9; i++) { const bh = gh * (0.2 + r() * 0.8); x.fillRect(ox + i * gw / 9, oy + gh - bh, gw / 9 - 5, bh); } break;
    case 1: x.beginPath(); for (let i = 0; i <= 20; i++) { const px = ox + i * gw / 20, py = oy + gh * (0.8 - i / 30 - r() * 0.2); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); break;
    case 2: x.strokeRect(ox, oy, gw * 0.55, gh); x.beginPath(); x.moveTo(ox, oy + gh); x.lineTo(ox + gw * 0.2, oy + gh * 0.4); x.lineTo(ox + gw * 0.55, oy + gh); x.stroke(); for (let i = 0; i < 3; i++) x.strokeRect(ox + gw * 0.62, oy + i * gh / 3, gw * 0.38, gh / 3 - 6); break;
    case 3: for (let i = 0; i < 6; i++) { x.globalAlpha = i ? 0.55 : 1; x.fillRect(ox, oy + i * gh / 6, gw * (0.4 + r() * 0.6), 6); } x.globalAlpha = 1; break;
    case 4: for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) if (r() > 0.25) x.strokeRect(ox + j * gw / 7, oy + i * gh / 4, gw / 7 - 6, gh / 4 - 6); break;
    case 5: for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(ox + 8, oy + 8 + i * gh / 4, 6, 0, 7); x.globalAlpha = i === 2 ? 1 : 0.5; x.fill(); x.fillRect(ox + 24, oy + 5 + i * gh / 4, gw * 0.6, 5); } x.globalAlpha = 1; break;
    case 6: x.font = `16px ${MONO}`; for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) x.fillText(String(Math.floor(r() * 900 + 100)), ox + j * gw / 5, oy + 16 + i * gh / 4); break;
    case 7: x.beginPath(); x.arc(ox + gw / 2, oy + gh / 2, gh / 4, 0, 7); x.stroke(); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; x.beginPath(); x.moveTo(ox + gw / 2 + Math.cos(a) * gh / 4, oy + gh / 2 + Math.sin(a) * gh / 4); x.lineTo(ox + gw / 2 + Math.cos(a) * gh / 2, oy + gh / 2 + Math.sin(a) * gh / 2); x.stroke(); } break;
  }
}
export function panel(k) {
  const w = 320, h = 200;
  const [c, x] = canvas(w, h);
  const r = rng(11 + k * 7);
  x.fillStyle = 'rgba(14,11,8,.86)'; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(255,166,61,.9)'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, w - 3, h - 3);
  x.fillStyle = 'rgba(255,166,61,.18)'; x.fillRect(0, 0, w, 32);
  x.font = `600 17px ${MONO}`; x.fillStyle = PAPER; x.fillText(DEPTS[k], 14, 22);
  x.fillStyle = 'rgba(255,77,61,.95)'; x.beginPath(); x.arc(w - 18, 16, 6, 0, 7); x.fill();
  glyph(x, k, w, h, r);
  return tex(c);
}

// ---------- Ventanas de los 8 departamentos (escena 4), animadas ----------
export function deptWindow(k) {
  const W = 768, H = 200;
  const [c, x] = canvas(W, H);
  const t = tex(c);
  const r0 = rng(100 + k * 13);
  const seeds = Array.from({ length: 64 }, () => r0());
  t.userData.draw = (time, lit, sync) => {
    // Interior: losa de techo con tiras de luz y suelo en perspectiva
    const L = lit;
    x.globalAlpha = 1;
    x.fillStyle = '#040302'; x.fillRect(0, 0, W, H);
    if (L <= 0.001) {
      // Cristal apagado: oscuro, con reflejo frío y montantes
      const gl = x.createLinearGradient(0, 0, W, H);
      gl.addColorStop(0, '#12161b'); gl.addColorStop(0.42, '#2b323b'); gl.addColorStop(0.5, '#3a434e'); gl.addColorStop(0.58, '#1a1f25'); gl.addColorStop(1, '#0c0e11');
      x.fillStyle = gl; x.fillRect(0, 0, W, H);
      x.fillStyle = '#020203';
      for (let i = 1; i < 6; i++) x.fillRect(i * W / 6 - 3, 0, 6, H);
      t.needsUpdate = true; return;
    }
    const bg = x.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, `rgba(60,38,16,${L})`); bg.addColorStop(0.6, `rgba(24,15,8,${L})`); bg.addColorStop(1, `rgba(45,28,12,${L})`);
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 6; i++) { x.fillStyle = `rgba(255,226,180,${0.85 * L})`; x.fillRect(40 + i * 125, 10, 80, 5); }
    x.strokeStyle = `rgba(255,166,61,${0.12 * L})`; x.lineWidth = 1;
    for (let i = -8; i <= 8; i++) { x.beginPath(); x.moveTo(W / 2 + i * 22, 120); x.lineTo(W / 2 + i * 110, H); x.stroke(); }
    x.globalAlpha = L;
    x.strokeStyle = AMB; x.fillStyle = AMB; x.lineWidth = 2.5;
    const T = time, cx = W / 2, cy = 112;
    switch (k) {
      case 0: { // PPC: mapa de campañas con pulsos
        for (let i = 0; i < 26; i++) for (let j = 0; j < 5; j++) { x.globalAlpha = L * 0.35; x.fillRect(40 + i * 27, 50 + j * 26, 3, 3); }
        for (let p = 0; p < 6; p++) {
          const px = 70 + seeds[p] * 620, py = 60 + seeds[p + 10] * 100;
          const ph = ((T * 0.8 + seeds[p + 20]) % 1);
          x.globalAlpha = L * (1 - ph); x.beginPath(); x.arc(px, py, 6 + ph * 60, 0, 7); x.stroke();
          x.globalAlpha = L; x.beginPath(); x.arc(px, py, 5, 0, 7); x.fill();
          if (p) { const qx = 70 + seeds[p - 1] * 620, qy = 60 + seeds[p + 9] * 100; x.globalAlpha = L * 0.4; x.beginPath(); x.moveTo(qx, qy); x.lineTo(px, py); x.stroke(); }
        }
        break;
      }
      case 1: { // Beneficio: engranajes y balanza que se equilibra
        const gear = (gx, gy, R, n, a) => { x.beginPath(); for (let i = 0; i < n * 2; i++) { const ang = a + i * Math.PI / n, rr = i % 2 ? R : R * 1.18; x.lineTo(gx + Math.cos(ang) * rr, gy + Math.sin(ang) * rr); } x.closePath(); x.stroke(); x.beginPath(); x.arc(gx, gy, R * 0.3, 0, 7); x.stroke(); };
        gear(150, 105, 48, 12, T * 0.9); gear(232, 128, 30, 8, -T * 1.44 + 0.2); gear(205, 58, 22, 6, -T * 1.9);
        const ang = 0.35 * Math.exp(-T * 1.2) * Math.cos(T * 5);
        x.save(); x.translate(520, 70); x.rotate(ang);
        x.fillRect(-170, -2, 340, 4);
        x.beginPath(); x.moveTo(-150, 0); x.lineTo(-150, 50); x.moveTo(150, 0); x.lineTo(150, 50); x.stroke();
        x.fillRect(-190, 50, 80, 4); x.fillRect(110, 50, 80, 4);
        x.restore();
        x.beginPath(); x.moveTo(520, 70); x.lineTo(500, 170); x.lineTo(540, 170); x.closePath(); x.stroke();
        x.font = `20px ${MONO}`; x.fillStyle = PAPER;
        for (let i = 0; i < 5; i++) x.fillText(String((Math.floor(T * 7) + i * 3) % 10), 660 + i * 18, 170 - (i % 2) * 6);
        break;
      }
      case 2: { // Imágenes: composiciones que se construyen en el aire
        const slots = [[60, 40, 230, 140], [310, 40, 110, 64], [310, 116, 110, 64], [440, 40, 110, 64], [440, 116, 110, 64], [570, 40, 150, 140]];
        slots.forEach((s, i) => {
          const p = ease.out(clamp((T - i * 0.25) / 0.6));
          x.globalAlpha = L * p;
          x.strokeRect(s[0], s[1] + (1 - p) * 40, s[2], s[3]);
          const bx = s[0] + s[2] / 2, by = s[1] + s[3] / 2 + (1 - p) * 40, bs = s[3] / 140;
          x.fillStyle = PAPER; x.fillRect(bx - 14 * bs, by - 30 * bs, 28 * bs, 64 * bs);
          x.fillStyle = AMB; x.fillRect(bx - 9 * bs, by - 44 * bs, 18 * bs, 14 * bs);
        });
        const sw = ((T * 0.5) % 1.4) * W;
        const g = x.createLinearGradient(sw - 80, 0, sw + 80, 0);
        g.addColorStop(0, 'rgba(255,240,220,0)'); g.addColorStop(0.5, `rgba(255,240,220,${0.35 * L})`); g.addColorStop(1, 'rgba(255,240,220,0)');
        x.globalAlpha = 1; x.fillStyle = g; x.fillRect(0, 0, W, H);
        break;
      }
      case 3: { // Fichas: piezas que encajan
        for (let row = 0; row < 5; row++) {
          let px = 60;
          for (let b = 0; b < 4; b++) {
            const bw = 60 + seeds[row * 4 + b] * 90;
            const start = row * 0.35 + b * 0.12;
            const p = ease.expoOut(clamp((T - start) / 0.5));
            x.globalAlpha = L * (b ? 0.6 : 1);
            x.fillRect(px + (1 - p) * 500, 40 + row * 28, bw - 8, 16);
            if (p > 0.95 && p < 1) { x.globalAlpha = L; x.strokeRect(px - 3, 37 + row * 28, bw - 2, 22); }
            px += bw;
          }
        }
        break;
      }
      case 4: { // Inventario: flujos ordenados
        for (let lane = 0; lane < 4; lane++) {
          const y = 48 + lane * 34;
          x.globalAlpha = L * 0.3; x.fillRect(40, y + 22, 520, 2);
          x.globalAlpha = L;
          for (let b = 0; b < 7; b++) {
            const px = 40 + (((T * 0.25 + b / 7 + seeds[lane]) % 1) * 520);
            x.strokeRect(px, y, 20, 20);
          }
          const hgt = 20 + ((Math.floor(T * 2 + lane) % 6) * 10);
          x.fillRect(600 + lane * 34, 180 - hgt, 24, hgt);
        }
        break;
      }
      case 5: { // Cuenta: conexiones que revelan el estado
        const nodes = Array.from({ length: 9 }, (_, i) => [70 + (i % 5) * 150 + (i >= 5 ? 75 : 0), i < 5 ? 70 : 150]);
        x.globalAlpha = L * 0.45;
        for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(...nodes[i]); x.lineTo(...nodes[i + 1]); x.stroke(); }
        x.globalAlpha = L;
        nodes.forEach((n, i) => { x.beginPath(); x.arc(n[0], n[1], 8, 0, 7); i % 4 === 3 ? x.stroke() : x.fill(); });
        for (let i = 0; i < 8; i++) {
          const p = (T * 0.9 + i * 0.13) % 1, a = nodes[i], b = nodes[i + 1];
          x.fillStyle = PAPER; x.beginPath(); x.arc(a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, 4, 0, 7); x.fill();
        }
        break;
      }
      case 6: { // IVA: cuadrícula numérica impecable
        x.font = `18px ${MONO}`;
        const col = Math.floor(T * 3) % 8;
        for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) {
          x.globalAlpha = L * (i === col ? 1 : 0.45);
          x.fillStyle = i === col ? PAPER : AMB;
          x.fillText(String(Math.floor(seeds[(i * 4 + j) % 64] * 9000 + 1000)), 60 + i * 84, 62 + j * 32);
        }
        x.globalAlpha = L; x.strokeRect(52 + col * 84, 42, 76, 128);
        break;
      }
      case 7: { // Control: sala central que conecta
        x.beginPath(); x.arc(cx, cy, 30, 0, 7); x.stroke();
        x.fillStyle = PAPER; x.beginPath(); x.arc(cx, cy, 10 + Math.sin(T * 4) * 2, 0, 7); x.fill();
        for (let i = 0; i < 7; i++) {
          const a = -Math.PI / 2 + (i - 3) * 0.42 + Math.PI / 2 * 0, ex = cx + Math.cos(a + Math.PI / 2 * (i < 4 ? -1 : 1) * 0.6) * 300 * (i % 2 ? 0.8 : 1);
          const ey = cy + (i % 2 ? -45 : 40);
          x.globalAlpha = L * 0.5; x.beginPath(); x.moveTo(cx, cy); x.lineTo(ex, ey); x.stroke();
          x.globalAlpha = L; x.fillStyle = AMB; x.beginPath(); x.arc(ex, ey, 7, 0, 7); x.fill();
          const p = 1 - ((T * 0.7 + i / 7) % 1);
          x.fillStyle = PAPER; x.beginPath(); x.arc(cx + (ex - cx) * p, cy + (ey - cy) * p, 3.5, 0, 7); x.fill();
        }
        break;
      }
    }
    // Pulso de sincronía final
    if (sync > 0) { x.globalAlpha = sync * 0.6; x.fillStyle = '#fff2dc'; x.fillRect(0, 0, W, H); }
    x.globalAlpha = 1;
    x.font = `600 15px ${MONO}`; x.fillStyle = `rgba(244,239,230,${0.7 * L})`;
    x.fillText(DEPTS[k], 14, H - 12);
    t.needsUpdate = true;
  };
  t.userData.draw(0, 0, 0);
  return t;
}

// ---------- Cielo del amanecer ----------
export function sky() {
  const [c, x] = canvas(1024, 1024);
  const g = x.createLinearGradient(0, 0, 0, 1024);
  g.addColorStop(0, '#0e1626');
  g.addColorStop(0.42, '#3a3346');
  g.addColorStop(0.62, '#c8763d');
  g.addColorStop(0.72, '#ffcf8a');
  g.addColorStop(0.75, '#5a3a24');
  g.addColorStop(1, '#1a120c');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 1024);
  // Perfil de ciudad lejana
  const r = rng(77);
  x.fillStyle = '#2a1c14';
  let px = 0;
  while (px < 1024) { const w = 20 + r() * 60, h = 20 + r() * 90; x.fillRect(px, 768 - h, w, h + 6); px += w + r() * 10; }
  return tex(c);
}

// ---------- Pantalla del portátil en la habitación ----------
export function roomScreen() {
  const W = 1024, H = 660;
  const [c, x] = canvas(W, H);
  const t = tex(c);
  t.userData.draw = (mode, p) => {
    x.fillStyle = '#0d0b09'; x.fillRect(0, 0, W, H);
    if (mode === 'ppc') {
      x.fillStyle = 'rgba(255,166,61,.16)'; x.fillRect(0, 0, W, 64);
      x.fillStyle = AMB; x.font = `600 26px ${MONO}`; x.fillText('PPC · REVISIÓN NOCTURNA', 36, 42);
      x.fillStyle = PAPER; x.font = `700 44px ${DISPLAY}`; x.fillText('3 asuntos', 36, 140);
      for (let i = 0; i < 3; i++) {
        const y = 190 + i * 140;
        x.globalAlpha = clamp(p * 3 - i);
        x.strokeStyle = 'rgba(244,239,230,.2)'; x.lineWidth = 2; x.strokeRect(36, y, W - 72, 116);
        x.fillStyle = AMB; x.fillRect(36, y, 8, 116);
        x.fillStyle = PAPER; x.fillRect(80, y + 30, 420, 18);
        x.fillStyle = 'rgba(244,239,230,.45)'; x.fillRect(80, y + 66, 300, 12);
        x.fillStyle = AMB; x.fillRect(W - 250, y + 38, 170, 40);
      }
      x.globalAlpha = 1;
    } else if (mode === 'guide') {
      x.fillStyle = AMB; x.font = `600 26px ${MONO}`; x.fillText('INSTALACIÓN LOCAL', 36, 60);
      x.fillStyle = PAPER; x.font = `700 46px ${DISPLAY}`; x.fillText('Guía de inicio', 36, 140);
      for (let i = 0; i < 4; i++) {
        const y = 200 + i * 100, done = p * 4 > i;
        x.strokeStyle = done ? AMB : 'rgba(244,239,230,.35)'; x.lineWidth = 3;
        x.beginPath(); x.arc(66, y + 20, 18, 0, 7); x.stroke();
        if (done) { x.fillStyle = AMB; x.beginPath(); x.arc(66, y + 20, 10, 0, 7); x.fill(); }
        x.fillStyle = done ? PAPER : 'rgba(244,239,230,.5)'; x.fillRect(110, y + 12, 380 + (i % 2) * 90, 16);
      }
      x.fillStyle = 'rgba(244,239,230,.15)'; x.fillRect(36, 600, W - 72, 10);
      x.fillStyle = AMB; x.fillRect(36, 600, (W - 72) * p, 10);
    } else if (mode === 'tower') {
      x.fillStyle = '#050403'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#1b1610'; x.fillRect(W / 2 - 90, 80, 180, 520);
      for (let i = 0; i < 8; i++) {
        x.fillStyle = `rgba(255,166,61,${0.75 + 0.25 * Math.sin(p * 6 + i)})`;
        x.fillRect(W / 2 - 70, 560 - i * 58, 140, 26);
      }
      x.fillStyle = '#fff'; x.beginPath(); x.arc(W / 2, 64, 12, 0, 7); x.fill();
    }
    t.needsUpdate = true;
  };
  t.userData.draw('ppc', 0);
  return t;
}

// Hormigón brutalista: ruido y vetas de encofrado
export function concrete(seed = 9) {
  const [c, x] = canvas(512, 512);
  x.fillStyle = '#8a8580'; x.fillRect(0, 0, 512, 512);
  const r = rng(seed);
  const img = x.getImageData(0, 0, 512, 512), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 38; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(img, 0, 0);
  x.strokeStyle = 'rgba(40,36,32,.35)'; x.lineWidth = 2;
  for (let y = 0; y < 512; y += 128) { x.beginPath(); x.moveTo(0, y); x.lineTo(512, y); x.stroke(); }
  for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(30,28,25,.4)'; x.beginPath(); x.arc(r() * 512, r() * 512, 1 + r() * 3, 0, 7); x.fill(); }
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Teclado del portátil
export function keyboard() {
  const [c, x] = canvas(1024, 600);
  x.fillStyle = '#1c1c1f'; x.fillRect(0, 0, 1024, 600);
  x.fillStyle = '#0b0b0c';
  x.fillRect(90, 40, 844, 330);
  x.fillStyle = '#141416';
  const rows = [14, 14, 13, 12, 11];
  rows.forEach((n, j) => {
    const kw = 844 / 14.6;
    for (let i = 0; i < n; i++) x.fillRect(96 + i * kw + (14 - n) * kw / 2, 46 + j * 64, kw - 6, 58);
  });
  x.fillRect(96 + 4 * 58, 46 + 5 * 64 - 6, 6 * 58, 0);
  x.fillStyle = '#18181b'; x.fillRect(330, 400, 364, 170);
  return tex(c);
}

// Reflejo del edificio encendido en la cara de la llave (máscara circular con el agujero)
export function keyReflection() {
  const S = 256;
  const [c, x] = canvas(S, S);
  const g = x.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, '#000'); g.addColorStop(1, '#120a04');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  x.fillStyle = '#1d1712'; x.fillRect(S * 0.56, S * 0.12, S * 0.26, S * 0.8);
  for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(255,170,70,${0.9 - i * 0.04})`; x.fillRect(S * 0.585, S * (0.84 - i * 0.085), S * 0.21, S * 0.035); }
  x.fillStyle = '#fff'; x.beginPath(); x.arc(S * 0.69, S * 0.08, 5, 0, 7); x.fill();
  x.globalCompositeOperation = 'destination-in';
  const m = x.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S / 2);
  m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = m; x.fillRect(0, 0, S, S);
  x.globalCompositeOperation = 'destination-out';
  x.beginPath(); x.arc(S / 2 - (0.008 / 0.026) * S / 2, S / 2, (0.0105 / 0.026) * S / 2, 0, 7); x.fill();
  return tex(c);
}
