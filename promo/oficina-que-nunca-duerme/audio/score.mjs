// Diseño sonoro procedural (sin voz en off), sincronizado con el guion. Genera audio/score.wav (48 kHz, estéreo).
import { writeFileSync } from 'fs';

const SR = 48000, DUR = 62, N = SR * DUR;
const FLOOR_T = Array.from({ length: 8 }, (_, i) => 25.2 + i * 1.15);

// Dos buses: el principal (se corta de golpe a los 57,6 s) y la coda final
const bus = () => ({ L: new Float32Array(N), R: new Float32Array(N), S: new Float32Array(N) });
const main = bus(), coda = bus();

let seed = 12345;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const noise = () => rnd() * 2 - 1;
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

function add(t0, dur, fn, { pan = 0, gain = 1, rev = 0.25 } = {}) {
  const b = t0 >= 57.85 ? coda : main;
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4), gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n; i++) {
    const k = s0 + i;
    if (k < 0 || k >= N) continue;
    const v = fn(i / SR, i);
    b.L[k] += v * gl; b.R[k] += v * gr; b.S[k] += v * gain * rev;
  }
}

// Filtro de estado variable (paso banda / bajo)
function svf() {
  let low = 0, band = 0;
  return (x, fc, q = 0.5) => {
    const f = 2 * Math.sin((Math.PI * Math.min(fc, SR / 6)) / SR);
    low += f * band;
    const high = x - low - q * band;
    band += f * high;
    return { low, band, high };
  };
}

// ---------- Instrumentos ----------
function boom(t, { f0 = 60, f1 = 28, dur = 3, gain = 1, rev = 0.3, drive = 1.8 } = {}) {
  let ph = 0;
  add(t, dur, (x) => {
    const f = f1 + (f0 - f1) * Math.exp(-x * 6);
    ph += (TAU * f) / SR;
    const env = (1 - Math.exp(-x * 300)) * Math.exp(-x * (3.2 / dur));
    return Math.tanh(drive * Math.sin(ph)) * env * 0.8 + noise() * Math.exp(-x * 90) * 0.25;
  }, { gain, rev });
}
function metal(t, { base = 300, dur = 2.5, gain = 0.4, pan = 0, rev = 0.45 } = {}) {
  const ratios = [1, 2.76, 5.4, 8.93, 13.34, 17.8];
  const hp = svf();
  add(t, dur, (x) => {
    let v = 0;
    ratios.forEach((r, i) => (v += Math.sin(TAU * base * r * x + i) * Math.exp((-x * (1.2 + i * 0.9) * 2.5) / dur) / (1 + i * 0.7)));
    const n = hp(noise(), 4000, 0.4).high * Math.exp(-x * 45) * 0.5;
    return v * 0.35 + n;
  }, { gain, pan, rev });
}
function tick(t, { gain = 0.25, pan = 0, f = 2200 } = {}) {
  const hp = svf();
  add(t, 0.08, (x) => hp(noise(), 5000, 0.3).high * Math.exp(-x * 260) + Math.sin(TAU * f * x) * Math.exp(-x * 140) * 0.3, { gain, pan, rev: 0.15 });
}
function pulse(t, { gain = 0.35, pan = 0 } = {}) {
  add(t, 0.25, (x) => Math.sin(TAU * 68 * x) * Math.exp(-x * 16) * (1 - Math.exp(-x * 400)), { gain, pan, rev: 0.1 });
  tick(t, { gain: gain * 0.5, pan, f: 1400 });
}
function whoosh(t, dur, { f0 = 300, f1 = 3000, gain = 0.4, p0 = -0.8, p1 = 0.8 } = {}) {
  const bp = svf();
  for (const side of [0, 1]) {
    add(t, dur, (x) => {
      const u = x / dur;
      const env = Math.pow(Math.sin(Math.PI * u), 2);
      return bp(noise(), f0 + (f1 - f0) * u * u, 0.35).band * env;
    }, { gain: gain * 0.7, pan: side ? p1 : p0, rev: 0.3 });
  }
}
function riser(t, dur, { gain = 0.5, f0 = 200, f1 = 7000 } = {}) {
  const bp = svf();
  let ph = 0;
  add(t, dur, (x) => {
    const u = x / dur;
    const fc = f0 * Math.pow(f1 / f0, u);
    ph += (TAU * (70 + 500 * u * u)) / SR;
    return (bp(noise(), fc, 0.25).band * 0.55 + Math.sin(ph) * 0.3 * u) * u * u;
  }, { gain, rev: 0.35 });
}
// Sierra limitada en banda (aditiva) para drones
function saw(ph, harm = 10) {
  let v = 0;
  for (let h = 1; h <= harm; h++) v += Math.sin(ph * h) / h;
  return v * 0.55;
}
function drone(t, dur, freqs, { gain = 0.3, harm = 9, att = 1.5, rel = 1.5, lfo = 0.15, grow = 0 } = {}) {
  freqs.forEach((f, j) => {
    add(t, dur, (x) => {
      const env = clamp(x / att) * clamp((dur - x) / rel) * (1 + grow * (x / dur));
      const a = 1 + 0.25 * Math.sin(TAU * lfo * x + j);
      return (saw(TAU * f * x, harm) + saw(TAU * f * 1.004 * x + 1.3, harm)) * 0.5 * env * a / freqs.length;
    }, { gain, pan: (j / Math.max(1, freqs.length - 1) - 0.5) * 0.6, rev: 0.4 });
  });
}
function pad(t, dur, freqs, { gain = 0.25, att = 2.5, rel = 2.5 } = {}) {
  freqs.forEach((f, j) => {
    add(t, dur, (x) => {
      const env = clamp(x / att) * clamp((dur - x) / rel);
      return (Math.sin(TAU * f * x) + 0.5 * Math.sin(TAU * f * 1.003 * x + j) + 0.18 * Math.sin(TAU * f * 2 * x)) * env / freqs.length;
    }, { gain, pan: (j % 2 ? 0.35 : -0.35), rev: 0.6 });
  });
}
function bell(t, f, { gain = 0.25, pan = 0, dur = 3 } = {}) {
  add(t, dur, (x) => (Math.sin(TAU * f * x) + 0.4 * Math.sin(TAU * f * 2.01 * x) + 0.15 * Math.sin(TAU * f * 3.02 * x)) * Math.exp(-x * 1.6) * (1 - Math.exp(-x * 600)), { gain, pan, rev: 0.6 });
}
function rumble(t, dur, { gain = 0.8 } = {}) {
  const lp = svf();
  add(t, dur, (x) => {
    const u = x / dur;
    const env = clamp(u * 4) * (1 - u * 0.7);
    return (lp(noise(), 140, 0.7).low * 2.2 + Math.sin(TAU * 31 * x) * 0.5) * env;
  }, { gain, rev: 0.2 });
}
function servo(t, dur, { gain = 0.3 } = {}) {
  const lp = svf();
  let ph = 0;
  add(t, dur, (x) => {
    const u = x / dur;
    ph += (TAU * (120 + 110 * Math.sin(Math.PI * u))) / SR;
    const env = Math.sin(Math.PI * u);
    return lp(saw(ph, 6) + noise() * 0.08, 900, 0.6).low * env;
  }, { gain, rev: 0.2 });
}
function impact(t, g = 1) {
  boom(t, { f0: 90, f1: 30, dur: 3.2, gain: 0.95 * g });
  metal(t, { base: 140, dur: 2.8, gain: 0.55 * g });
  const hp = svf();
  add(t, 0.4, (x) => hp(noise(), 2500, 0.5).high * Math.exp(-x * 18), { gain: 0.5 * g, rev: 0.5 });
}

// ---------- Partitura ----------
// 01 · El impacto
boom(0.4, { f0: 46, f1: 24, dur: 4.2, gain: 1.0, drive: 2.2 });
metal(0.4, { base: 55, dur: 3.5, gain: 0.25, rev: 0.6 });
riser(0.85, 0.8, { gain: 0.22, f0: 1500, f1: 9000 });
metal(1.6, { base: 900, dur: 1.4, gain: 0.18 });
// estalla la palabra
metal(2.6, { base: 180, dur: 3, gain: 0.6 });
boom(2.6, { f0: 80, f1: 40, dur: 2.2, gain: 0.55 });
whoosh(2.55, 1.1, { f0: 400, f1: 5000, gain: 0.5 });
// tormenta que acelera
riser(2.7, 4.3, { gain: 0.42, f0: 150, f1: 5000 });
drone(2.8, 4.2, [55, 58.27], { gain: 0.28, harm: 12, att: 1.5, rel: 0.05, grow: 1 });
[3.6, 4.3, 4.9, 5.4, 5.8, 6.15, 6.45, 6.7].forEach((t, i) => whoosh(t, 0.45, { f0: 500, f1: 2600, gain: 0.32, p0: i % 2 ? 0.9 : -0.9, p1: i % 2 ? -0.9 : 0.9 }));
for (let t = 3.0, d = 0.5; t < 7.0; t += d, d = Math.max(0.1, d * 0.9)) pulse(t, { gain: 0.3, pan: Math.sin(t * 3) * 0.4 });
boom(5.0, { f0: 70, f1: 38, dur: 1.6, gain: 0.45 });
boom(5.95, { f0: 70, f1: 36, dur: 1.6, gain: 0.5 });
impact(7.0, 1.15);

// 02 · El portal
drone(8.0, 6.8, [55, 82.41], { gain: 0.2, harm: 6, att: 1.2, rel: 0.4, lfo: 0.1 });
tick(9.5, { gain: 0.3 }); tick(9.58, { gain: 0.22 });
servo(10.05, 1.1, { gain: 0.28 });
tick(11.15, { gain: 0.35, f: 900 }); metal(11.15, { base: 640, dur: 1.2, gain: 0.12 });
add(10.4, 1.1, (x) => Math.sin(TAU * (1200 + 1200 * (x / 1.1)) * x) * Math.sin(Math.PI * x / 1.1) * 0.15, { gain: 0.3, rev: 0.5 });
riser(11.2, 3.4, { gain: 0.55, f0: 120, f1: 8000 });
pad(11.4, 3.3, [220, 329.63, 440], { gain: 0.18, att: 2.6, rel: 0.2 });
whoosh(14.0, 1.0, { f0: 200, f1: 6000, gain: 0.6 });
boom(14.95, { f0: 75, f1: 34, dur: 2.0, gain: 0.7 });

// 03 · Tú solo contra ocho
drone(15.0, 6.97, [61.74, 87.31], { gain: 0.3, harm: 12, att: 1.0, rel: 0.02, grow: 1.4, lfo: 0.4 });
for (let t = 15.2, d = 0.9; t < 21.9; t += d, d = Math.max(0.32, d * 0.93)) { boom(t, { f0: 62, f1: 44, dur: 0.35, gain: 0.5, rev: 0.1 }); boom(t + 0.16, { f0: 55, f1: 40, dur: 0.3, gain: 0.32, rev: 0.1 }); }
for (let g = 8; g < 480; g += 7) { const t = 16.1 + 0.56 * Math.log2(g / 8); tick(t, { gain: 0.12, pan: Math.sin(g) * 0.9, f: 1800 + (g % 5) * 300 }); }
[16.3, 17.2, 18.3].forEach(t => metal(t, { base: 520, dur: 1.0, gain: 0.18, pan: 0.2 }));
const grind = svf();
add(16.0, 5.95, (x) => grind(noise(), 900 + 300 * Math.sin(x * 7), 0.15).band * clamp(x / 5) * 0.6, { gain: 0.25, rev: 0.3 });
whoosh(19.4, 2.55, { f0: 150, f1: 4000, gain: 0.55, p0: 0.3, p1: -0.3 });

// 04 · El nacimiento de la oficina
rumble(22.0, 3.6, { gain: 0.9 });
boom(22.2, { f0: 40, f1: 22, dur: 4.5, gain: 1.0, drive: 2.4 });
for (let t = FLOOR_T[0]; t < 37.3; t += 1.15 / 4) pulse(t, { gain: 0.16 + 0.1 * clamp((t - 25) / 12), pan: 0 });
const scale = [220, 246.94, 277.18, 293.66, 329.63, 369.99, 415.3, 440];
FLOOR_T.forEach((t, i) => { boom(t, { f0: 72, f1: 36, dur: 1.4, gain: 0.62 }); metal(t, { base: scale[i], dur: 1.6, gain: 0.3, pan: (i % 2 ? 0.3 : -0.3) }); });
pad(25.0, 12.4, [110, 164.81, 220], { gain: 0.2, att: 6, rel: 0.2 });
bell(33.9, 880, { gain: 0.3 }); bell(33.9, 1318.5, { gain: 0.2 }); impact(33.9, 0.75);
pad(33.9, 3.5, [440, 554.37, 659.25, 880], { gain: 0.16, att: 0.6, rel: 0.3 });
for (let i = 0; i < 8; i++) add(34.5 + i * 0.12, 0.5, (x) => Math.sin(TAU * (1400 + i * 120 + 1200 * x) * x) * Math.exp(-x * 7), { gain: 0.12, pan: (i % 2 ? 0.5 : -0.5), rev: 0.5 });
riser(35.0, 2.3, { gain: 0.5, f0: 300, f1: 7000 });
impact(37.3, 1.0);

// 05 · Las 07:00
pad(38.0, 17.2, [220, 277.18, 329.63, 440, 554.37], { gain: 0.24, att: 3, rel: 2.5 });
whoosh(38.2, 1.6, { f0: 300, f1: 1800, gain: 0.25 });
bell(39.8, 659.25, { gain: 0.22, pan: -0.2 });
bell(42.8, 554.37, { gain: 0.18, pan: 0.2 });
[43.35, 43.8, 44.25].forEach(t => tick(t, { gain: 0.14, f: 2600 }));
tick(46.05, { gain: 0.28, f: 1600 });
bell(45.2, 739.99, { gain: 0.18 });

// 06 · El control sigue siendo tuyo
metal(48.3, { base: 1800, dur: 0.9, gain: 0.14, pan: 0.3 });
[48.6, 50.4, 52.0, 53.6].forEach(t => boom(t, { f0: 60, f1: 40, dur: 1.2, gain: 0.32 }));
metal(50.05, { base: 2100, dur: 0.6, gain: 0.1, pan: 0.3 }); metal(50.2, { base: 2400, dur: 0.6, gain: 0.08, pan: 0.35 });
bell(50.6, 1108.7, { gain: 0.16 });

// 07 · La revelación: crescendo y corte seco
drone(52.0, 5.6, [55, 82.41, 110], { gain: 0.3, harm: 10, att: 2.5, rel: 0.01, grow: 1.6 });
for (let t = 52.0, d = 0.5; t < 57.6; t += d, d = Math.max(0.125, d * 0.94)) pulse(t, { gain: 0.3 });
riser(53.6, 4.0, { gain: 0.6, f0: 150, f1: 9000 });
pad(55.0, 2.6, [220, 277.18, 329.63, 440, 659.25, 880], { gain: 0.3, att: 1.2, rel: 0.01 });
[55.0, 55.5, 56.0, 56.5, 56.9, 57.25].forEach(t => boom(t, { f0: 80, f1: 40, dur: 0.6, gain: 0.55, rev: 0.15 }));

// Coda (tras el silencio)
add(57.9, 2.0, (x) => Math.sin(TAU * 55 * x) * Math.exp(-x * 1.5) * (1 - Math.exp(-x * 80)), { gain: 0.3, rev: 0.5 });
add(58.9, 2.0, (x) => Math.sin(TAU * 41.2 * x) * Math.exp(-x * 1.5) * (1 - Math.exp(-x * 80)), { gain: 0.3, rev: 0.5 });
boom(60.3, { f0: 55, f1: 32, dur: 1.6, gain: 0.45 });
bell(60.3, 440, { gain: 0.22 });
tick(61.72, { gain: 0.2, f: 800 });

// ---------- Reverb (Schroeder) ----------
function reverb(b) {
  const combs = [1687, 1601, 2053, 2251].map(d => ({ d, buf: new Float32Array(d), i: 0, lp: 0 }));
  const aps = [347, 113, 37].map(d => ({ d, buf: new Float32Array(d), i: 0 }));
  const outL = new Float32Array(N), outR = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    const x = b.S[n] * 0.25;
    let y = 0;
    for (const c of combs) {
      const v = c.buf[c.i];
      c.lp = v * 0.7 + c.lp * 0.3;
      c.buf[c.i] = x + c.lp * 0.86;
      c.i = (c.i + 1) % c.d;
      y += v;
    }
    for (const a of aps) {
      const v = a.buf[a.i];
      const w = y + v * 0.6;
      a.buf[a.i] = w;
      a.i = (a.i + 1) % a.d;
      y = v - w * 0.6;
    }
    outL[n] = y;
    outR[n - 23 >= 0 ? n - 23 : 0] += y * 0.98;
  }
  return [outL, outR];
}
const [mRL, mRR] = reverb(main);
const [cRL, cRR] = reverb(coda);

// Silencios estratégicos (rampas de 4 ms)
const SIL = [[0, 0.38], [7.62, 7.98], [21.98, 22.03], [37.48, 38.0], [57.6, 62]];
const ramp = 0.004;
const gate = t => {
  let g = 1;
  for (const [a, b] of SIL) {
    if (t > a - ramp && t < b + ramp) g = Math.min(g, t < a ? (a - t) / ramp : t > b ? (t - b) / ramp : 0);
  }
  return clamp(g);
};

const out = new Int16Array(N * 2);
let peak = 0;
const L = new Float32Array(N), R = new Float32Array(N);
for (let n = 0; n < N; n++) {
  const g = gate(n / SR);
  L[n] = Math.tanh((main.L[n] + mRL[n] * 0.9) * g * 0.9 + (coda.L[n] + cRL[n] * 0.9) * 0.9);
  R[n] = Math.tanh((main.R[n] + mRR[n] * 0.9) * g * 0.9 + (coda.R[n] + cRR[n] * 0.9) * 0.9);
  peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n]));
}
const norm = 0.89 / peak;
for (let n = 0; n < N; n++) { out[n * 2] = L[n] * norm * 32767; out[n * 2 + 1] = R[n] * norm * 32767; }

const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + out.byteLength, 4); hdr.write('WAVE', 8);
hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22);
hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34);
hdr.write('data', 36); hdr.writeUInt32LE(out.byteLength, 40);
writeFileSync(new URL('./score.wav', import.meta.url), Buffer.concat([hdr, Buffer.from(out.buffer)]));
console.log('score.wav listo · pico normalizado a -1 dBFS');
