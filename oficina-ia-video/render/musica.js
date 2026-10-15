// Colchón musical de reserva (placeholder) generado por código: un pad ambiental
// discreto, sin melodía, para que el animático no suene vacío. Sustituir por una
// pista con licencia (Artlist) en la versión final.
//
// Uso: node musica.js salida.wav [segundos=90]
// Genera WAV 48 kHz, 16 bit, estéreo.

const fs = require('fs');
const out = process.argv[2] || 'musica.wav';
const DUR = Number(process.argv[3] || 90);
const SR = 48000;
const N = Math.floor(DUR * SR);

// Dos acordes que alternan cada 8 s: Dm9 (D F A C E) y Bbmaj7 (Bb D F A), muy graves.
const chords = [
  [73.42, 87.31, 110.0, 130.81, 164.81],
  [58.27, 73.42, 87.31, 110.0, 146.83],
];
const L = new Float32Array(N), R = new Float32Array(N);

// Pulso suave de "tic" en los cambios de bloque (marcadores de línea de tiempo), muy bajo.
const ticks = [0.4, 4.2, 15.0, 29.0, 56.0, 76.0];

for (let i = 0; i < N; i++) {
  const t = i / SR;
  const seg = Math.floor(t / 8) % 2;
  const nxt = (seg + 1) % 2;
  const x = (t % 8) / 8;
  const xf = x > 0.85 ? (x - 0.85) / 0.15 : 0; // crossfade al final de cada 8 s
  let s = 0;
  for (let c = 0; c < 2; c++) {
    const w = c === seg ? 1 - xf : xf;
    if (w <= 0) continue;
    const ch = chords[c];
    for (let k = 0; k < ch.length; k++) {
      const f = ch[k];
      const det = 1 + 0.0015 * Math.sin(2 * Math.PI * 0.07 * t + k);
      const lfo = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.05 * t + k * 1.3);
      s += w * lfo * (Math.sin(2 * Math.PI * f * det * t) + 0.35 * Math.sin(2 * Math.PI * 2 * f * t + 0.5)) / ch.length;
    }
  }
  // envolvente global: entra a los 3 s (tras el gancho), baja en los últimos 3 s
  const env = Math.min(1, Math.max(0, (t - 3.0) / 4)) * Math.min(1, Math.max(0, (DUR - t) / 3));
  // tics
  let tk = 0;
  for (const tt of ticks) {
    const d = t - tt;
    if (d >= 0 && d < 0.25) tk += Math.exp(-d * 28) * Math.sin(2 * Math.PI * 1760 * d) * 0.12;
  }
  const v = s * 0.22 * env + tk;
  L[i] = v * (1 + 0.08 * Math.sin(2 * Math.PI * 0.03 * t));
  R[i] = v * (1 - 0.08 * Math.sin(2 * Math.PI * 0.03 * t));
}

// filtro paso bajo de un polo para quitar aspereza
let pl = 0, pr = 0; const a = 0.08;
for (let i = 0; i < N; i++) { pl += a * (L[i] - pl); pr += a * (R[i] - pr); L[i] = pl; R[i] = pr; }

const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4);
  buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(R[i] * 32767))), 46 + i * 4);
}
fs.writeFileSync(out, buf);
console.log('Escrito', out, DUR + 's');
