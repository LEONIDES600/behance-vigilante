// Utilidades deterministas: todo depende del tiempo t, nunca de relojes reales.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, a, b) => clamp((t - a) / (b - a));

export const ease = {
  in: x => x * x * x,
  out: x => 1 - Math.pow(1 - x, 3),
  inOut: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  expoOut: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  expoIn: x => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
  sine: x => -(Math.cos(Math.PI * x) - 1) / 2,
};

// Generador pseudoaleatorio con semilla (mismo resultado en cada render)
export function rng(seed = 1) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const hash = n => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
// Ruido 1D suave en [-1, 1]
export function noise1(x) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i), hash(i + 1), u) * 2 - 1;
}

// Parpadeo de encendido tipo tubo fluorescente: 0 → 1 con dos fallos
export function flicker(dt) {
  if (dt <= 0) return 0;
  if (dt < 0.05) return 0.9;
  if (dt < 0.09) return 0.15;
  if (dt < 0.16) return 1.0;
  if (dt < 0.2) return 0.35;
  return 1;
}

export const AMBER = 0xffa63d;
export const GOLD = 0xffc46b;
export const DEPTS = ['PPC', 'BENEFICIO', 'IMÁGENES', 'FICHAS', 'INVENTARIO', 'CUENTA', 'IVA', 'CONTROL'];
export const DEPT_NAMES = ['PPC', 'Beneficio', 'Imágenes', 'Fichas', 'Inventario', 'Cuenta', 'IVA', 'Control y coordinación'];
// Momento en que se enciende cada planta (sincronizado con los 8 impactos)
export const FLOOR_T = DEPTS.map((_, i) => 25.2 + i * 1.15);
