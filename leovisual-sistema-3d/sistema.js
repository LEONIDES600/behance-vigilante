// =====================================================================
//  LeoVisual.nl — Sistema de producción de vídeo (animación 3D, 18 s, bucle)
//  Todo el texto, tiempos, colores y cámara viven en CONFIG. El resto del
//  archivo es la escena; no hace falta tocarlo para cambiar etiquetas o frases.
//  La animación es determinista: todo depende del tiempo `t` (segundos).
// =====================================================================

export const CONFIG = {
  duracion: 18,          // segundos por bucle
  fps: 60,

  marca: {
    nombre: 'LeoVisual',            // blanco, peso 700
    tld: '.nl',                     // gris, peso 500
    subtitulo: 'Así producimos cada pieza',
  },

  colores: {
    fondo: '#05070c',
    ambar: '#f2b13a',       // cables/nodos activos
    hielo: '#8fc4ff',       // cables hacia canales de publicación
    cobre: '#e8a978',       // núcleo Claude
    cableBase: '#3a4557',   // cable inactivo
    cableHecho: '#5a6478',  // cable con ambos extremos terminados
    bordeOff: '#2a3344',    // borde de nodo apagado
    bordeHecho: '#b7c0cc',  // borde de nodo terminado (gris claro, sin brillo)
    placa: '#0f141d',
    icono: '#dfe6f0',
    rejilla: '#182033',
  },

  // Nodos: id, texto de la etiqueta, icono, posición [x, y, z], momento en que se
  // enciende (`enciende`) y en que pasa a "hecho" (`hecho`, null = sigue activo).
  // `canal: true` usa el color hielo; `barra: true` muestra la barra de progreso.
  nodos: [
    { id: 'brief',    texto: 'Brief',             icono: 'brief',    pos: [ 0.0,  9.0,  0.0], enciende: 0.4,  hecho: 3.0 },

    { id: 'marca',    texto: 'Marca del cliente', icono: 'marca',    pos: [-2.9,  6.9,  0.3], enciende: 3.0,  hecho: 5.6 },
    { id: 'estilo',   texto: 'Estilo visual',     icono: 'estilo',   pos: [-3.4,  4.8, -0.3], enciende: 3.35, hecho: 5.6 },
    { id: 'producto', texto: 'Producto',          icono: 'producto', pos: [-2.9,  2.7,  0.3], enciende: 3.7,  hecho: 5.6 },
    { id: 'refs',     texto: 'Referencias',       icono: 'refs',     pos: [ 2.9,  6.9,  0.3], enciende: 4.05, hecho: 5.6 },
    { id: 'portfolio',texto: 'Portfolio',         icono: 'portfolio',pos: [ 3.4,  4.8, -0.3], enciende: 4.4,  hecho: 5.6 },
    { id: 'musica',   texto: 'Música y ritmo',    icono: 'musica',   pos: [ 2.9,  2.7,  0.3], enciende: 4.75, hecho: 5.6 },

    { id: 'claude',   texto: 'Claude', sub: 'dirige la producción', nucleo: true,
                                                                     pos: [ 0.0,  4.8,  0.0], enciende: 2.6,  hecho: null },

    { id: 'guion',    texto: 'Guion',             icono: 'guion',    pos: [ 0.0,  1.4,  0.0], enciende: 5.6,  hecho: 8.0 },

    { id: 'plano1',   texto: 'Plano 1',           icono: 'plano',    pos: [-2.7, -1.0,  0.2], enciende: 8.0,  hecho: 9.8 },
    { id: 'plano2',   texto: 'Plano 2',           icono: 'plano',    pos: [ 0.0, -1.0, -0.2], enciende: 8.3,  hecho: 9.8 },
    { id: 'plano3',   texto: 'Plano 3',           icono: 'plano',    pos: [ 2.7, -1.0,  0.2], enciende: 8.6,  hecho: 9.8 },

    { id: 'gen1',     texto: 'Generación',        icono: 'gen', barra: true, pos: [-2.7, -3.4,  0.2], enciende: 9.2,  hecho: 11.6 },
    { id: 'gen2',     texto: 'Generación',        icono: 'gen', barra: true, pos: [ 0.0, -3.4, -0.2], enciende: 9.5,  hecho: 11.6 },
    { id: 'gen3',     texto: 'Generación',        icono: 'gen', barra: true, pos: [ 2.7, -3.4,  0.2], enciende: 9.8,  hecho: 11.6 },

    { id: 'montaje',  texto: 'Montaje y color',   icono: 'montaje',  pos: [ 0.0, -5.8,  0.0], enciende: 11.6, hecho: 14.0 },

    { id: 'tiktok',   texto: 'TikTok',            icono: 'tiktok',  canal: true, pos: [-2.7, -8.2,  0.2], enciende: 14.0, hecho: 16.2 },
    { id: 'reels',    texto: 'Reels',             icono: 'reels',   canal: true, pos: [ 0.0, -8.2, -0.2], enciende: 14.3, hecho: 16.2 },
    { id: 'youtube',  texto: 'YouTube',           icono: 'youtube', canal: true, pos: [ 2.7, -8.2,  0.2], enciende: 14.6, hecho: 16.2 },

    { id: 'informe',  texto: 'Informe al cliente',icono: 'informe',  pos: [ 0.0, -10.6, 0.0], enciende: 16.2, hecho: null },
  ],

  // Cables [origen, destino, color opcional ('ambar' | 'hielo')]
  cables: [
    ['brief', 'claude'],
    ['marca', 'claude'], ['estilo', 'claude'], ['producto', 'claude'],
    ['refs', 'claude'], ['portfolio', 'claude'], ['musica', 'claude'],
    ['claude', 'guion'],
    ['guion', 'plano1'], ['guion', 'plano2'], ['guion', 'plano3'],
    ['plano1', 'gen1'], ['plano2', 'gen2'], ['plano3', 'gen3'],
    ['gen1', 'montaje'], ['gen2', 'montaje'], ['gen3', 'montaje'],
    ['montaje', 'tiktok', 'hielo'], ['montaje', 'reels', 'hielo'], ['montaje', 'youtube', 'hielo'],
    ['tiktok', 'informe', 'hielo'], ['reels', 'informe', 'hielo'], ['youtube', 'informe', 'hielo'],
  ],

  // Frases de la capa fija (abajo), con fundido de entrada/salida
  frases: [
    { desde: 0.4,  hasta: 2.6,  texto: 'Entra el brief' },
    { desde: 3.0,  hasta: 5.4,  texto: 'Claude lee marca, producto y estilo' },
    { desde: 5.6,  hasta: 8.0,  texto: 'Escribe el guion plano a plano' },
    { desde: 9.2,  hasta: 11.5, texto: 'Genera cada plano' },
    { desde: 11.6, hasta: 13.8, texto: 'Monta, corrige color y añade música' },
    { desde: 14.0, hasta: 16.0, texto: 'Publica en cada canal' },
    { desde: 16.2, hasta: 17.8, texto: 'Una semana. Precio cerrado.', destacada: true },
  ],

  // Cámara: claves [t, posición, punto al que mira]. Se interpola con spline suave.
  camara: {
    fov: 45,
    suavizado: 0.7,   // 0 = lineal, 1 = ease-in-out completo en cada tramo
    claves: [
      { t: 0.0,  pos: [ 0.0, 10.2, 15.0], mira: [ 0.0,  8.6, 0] },
      { t: 2.6,  pos: [ 0.5,  9.4,  8.5], mira: [ 0.0,  8.9, 0] },
      { t: 3.2,  pos: [-9.5,  7.0, 15.0], mira: [ 0.0,  5.0, 0] },
      { t: 4.3,  pos: [-1.0,  6.4, 18.0], mira: [ 0.0,  4.9, 0] },
      { t: 5.4,  pos: [ 9.0,  6.2, 15.0], mira: [ 0.0,  4.8, 0] },
      { t: 6.2,  pos: [ 3.0,  2.6,  9.5], mira: [ 0.0,  1.5, 0] },
      { t: 8.0,  pos: [-1.6,  1.4,  9.0], mira: [ 0.0,  0.9, 0] },
      { t: 9.4,  pos: [-2.6, -1.2, 17.0], mira: [ 0.0, -1.7, 0] },
      { t: 11.4, pos: [ 2.6, -2.9, 17.0], mira: [ 0.0, -2.8, 0] },
      { t: 12.0, pos: [ 1.6, -5.2,  9.0], mira: [ 0.0, -5.8, 0] },
      { t: 13.8, pos: [-1.6, -5.9, 10.0], mira: [ 0.0, -6.0, 0] },
      { t: 14.2, pos: [-2.4, -7.8, 17.0], mira: [ 0.0, -8.3, 0] },
      { t: 16.0, pos: [ 2.4, -8.7, 17.0], mira: [ 0.0, -8.7, 0] },
      { t: 16.4, pos: [ 0.6,-10.0, 10.5], mira: [ 0.0,-10.3, 0] },
      { t: 17.4, pos: [ 0.0, -1.1, 45.0], mira: [ 0.0, -1.1, 0] },
      { t: 18.0, pos: [ 0.0, -1.1, 46.5], mira: [ 0.0, -1.1, 0] },
    ],
  },

  // Post-proceso
  post: {
    bloom:  { fuerza: 0.42, radio: 0.45, umbral: 0.72 },
    bokeh:  { activo: true, apertura: 0.00012, desenfoqueMax: 0.0055 },
    grano: 0.045,     // 0 = sin grano
    vineta: 0.38,     // 0 = sin viñeta
    exposicion: 1.05,
  },

  bucle: { fundido: 0.35 },   // fundido a negro al inicio/fin para que el bucle sea limpio
  etiquetas: { distanciaRef: 12.0, escalaMin: 0.7 }, // las etiquetas se encogen suavemente al alejar la cámara
};

// =====================================================================
//  A partir de aquí: escena. No es necesario editar para cambiar textos.
// =====================================================================

import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const W = 1080, H = 1920;
const DUR = CONFIG.duracion;
const C = CONFIG.colores;
const col = (hex) => new THREE.Color(hex);

// ---------- utilidades ----------
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
const smoother = (u) => u * u * u * (u * (u * 6 - 15) + 10);
const lerp = (a, b, u) => a + (b - a) * u;

// ---------- DOM ----------
const stage = document.getElementById('stage');
const canvas = document.getElementById('gl');
const hud = {
  brand: document.getElementById('brand'),
  tagline: document.getElementById('tagline'),
  caption: document.getElementById('caption'),
};
hud.brand.innerHTML = `${CONFIG.marca.nombre}<span class="tld">${CONFIG.marca.tld}</span>`;
hud.tagline.textContent = CONFIG.marca.subtitulo;

const fade = document.createElement('div');
fade.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;background:${C.fondo};pointer-events:none;opacity:0`;
document.getElementById('hud').appendChild(fade);

function fitStage() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  stage.style.transform = `translate(-50%, -50%) scale(${s})`;
}
window.addEventListener('resize', fitStage);
fitStage();

// ---------- renderer / escena / cámara ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = CONFIG.post.exposicion;

const scene = new THREE.Scene();
scene.background = col(C.fondo);
scene.fog = new THREE.Fog(col(C.fondo), 16, 60);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(CONFIG.camara.fov, W / H, 0.1, 200);

const labelRenderer = new CSS2DRenderer({ element: document.getElementById('labels') });
labelRenderer.setSize(W, H);

// ---------- luces ----------
scene.add(new THREE.AmbientLight(0x9fb3d1, 0.25));
const key = new THREE.DirectionalLight(0xdfe8ff, 1.6); key.position.set(-6, 12, 10); scene.add(key);
const rim = new THREE.DirectionalLight(0x7aa0ff, 0.8); rim.position.set(8, -6, -6); scene.add(rim);
const coreLight = new THREE.PointLight(col(C.cobre), 0, 14, 1.6); scene.add(coreLight);

// ---------- texturas procedurales ----------
function radialTexture(size = 128, inner = 1, outer = 0) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, `rgba(255,255,255,${inner})`);
  grd.addColorStop(0.35, `rgba(255,255,255,${inner * 0.55})`);
  grd.addColorStop(1, `rgba(255,255,255,${outer})`);
  g.fillStyle = grd; g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
const glowTex = radialTexture(128);
const softTex = radialTexture(256, 0.9, 0);

// Iconos dibujados a mano en canvas (texto/imágenes reales, nada generado)
function iconTexture(type) {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.lineWidth = 16; g.lineCap = 'round'; g.lineJoin = 'round';
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); g.stroke(); };
  const line = (x1, y1, x2, y2) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  const circle = (x, y, r, fill = false) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); fill ? g.fill() : g.stroke(); };
  const tri = (x, y, s) => { g.beginPath(); g.moveTo(x - s * 0.45, y - s * 0.55); g.lineTo(x + s * 0.6, y); g.lineTo(x - s * 0.45, y + s * 0.55); g.closePath(); g.fill(); };
  switch (type) {
    case 'brief': rr(64, 40, 128, 176, 18); line(96, 96, 160, 96); line(96, 132, 160, 132); line(96, 168, 136, 168); break;
    case 'marca': circle(128, 128, 76); circle(128, 128, 18, true); break;
    case 'estilo': circle(88, 88, 40); rr(136, 48, 80, 80, 12); tri(128, 184, 60); break;
    case 'producto':
      g.beginPath(); g.moveTo(128, 40); g.lineTo(204, 84); g.lineTo(204, 172); g.lineTo(128, 216); g.lineTo(52, 172); g.lineTo(52, 84); g.closePath(); g.stroke();
      line(128, 128, 204, 84); line(128, 128, 52, 84); line(128, 128, 128, 216); break;
    case 'refs': rr(48, 64, 120, 120, 14); rr(88, 72, 120, 120, 14); break;
    case 'portfolio': rr(48, 48, 68, 68, 12); rr(140, 48, 68, 68, 12); rr(48, 140, 68, 68, 12); rr(140, 140, 68, 68, 12); break;
    case 'musica': [60, 100, 150, 110, 70].forEach((h, i) => line(56 + i * 36, 128 - h / 2, 56 + i * 36, 128 + h / 2)); break;
    case 'guion': line(56, 64, 200, 64); line(56, 108, 176, 108); line(56, 152, 200, 152); line(56, 196, 128, 196); break;
    case 'plano': rr(44, 84, 168, 128, 14); line(44, 84, 212, 84); line(60, 44, 92, 84); line(120, 44, 152, 84); line(180, 44, 212, 84); tri(132, 148, 50); break;
    case 'gen':
      g.beginPath(); g.moveTo(112, 40); g.quadraticCurveTo(112, 112, 40, 112); g.quadraticCurveTo(112, 112, 112, 184); g.quadraticCurveTo(112, 112, 184, 112); g.quadraticCurveTo(112, 112, 112, 40); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(192, 148); g.quadraticCurveTo(192, 184, 156, 184); g.quadraticCurveTo(192, 184, 192, 220); g.quadraticCurveTo(192, 184, 228, 184); g.quadraticCurveTo(192, 184, 192, 148); g.closePath(); g.fill(); break;
    case 'montaje': [72, 128, 184].forEach((y, i) => { line(48, y, 208, y); circle([150, 90, 170][i], y, 16, true); }); break;
    case 'tiktok': line(148, 56, 148, 172); circle(112, 176, 36); g.beginPath(); g.moveTo(148, 56); g.quadraticCurveTo(160, 108, 208, 108); g.stroke(); break;
    case 'reels': rr(48, 48, 160, 160, 26); line(48, 96, 208, 96); line(96, 48, 120, 96); line(150, 48, 174, 96); tri(128, 156, 48); break;
    case 'youtube': rr(36, 72, 184, 112, 30); tri(124, 128, 52); break;
    case 'informe': rr(64, 40, 128, 176, 18); g.beginPath(); g.moveTo(92, 136); g.lineTo(120, 164); g.lineTo(168, 104); g.stroke(); break;
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
}

// ---------- geometría de placa ----------
function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}
const PLATE = 1.5, PLATE_DEPTH = 0.14;
const plateGeo = new THREE.ExtrudeGeometry(roundedRectShape(PLATE, PLATE, 0.16), { depth: PLATE_DEPTH, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3, curveSegments: 10 });
plateGeo.center();
const borderShape = roundedRectShape(PLATE + 0.05, PLATE + 0.05, 0.19);
borderShape.holes.push(new THREE.Path().setFromPoints(roundedRectShape(PLATE - 0.06, PLATE - 0.06, 0.14).getPoints(10)));
const borderGeo = new THREE.ShapeGeometry(borderShape, 10);
const iconGeo = new THREE.PlaneGeometry(0.62, 0.62);
const barBgGeo = new THREE.PlaneGeometry(1.0, 0.075);
const barFillGeo = new THREE.PlaneGeometry(1.0, 0.075); barFillGeo.translate(0.5, 0, 0);

// ---------- nodos ----------
const nodes = new Map();
const nodeGroup = new THREE.Group(); scene.add(nodeGroup);

function makeLabel(n) {
  const el = document.createElement('div'); el.className = 'label' + (n.nucleo ? ' core' : '');
  const inner = document.createElement('div'); inner.className = 'inner';
  inner.textContent = n.texto;
  if (n.sub) { const s = document.createElement('span'); s.className = 'sub'; s.textContent = n.sub; inner.appendChild(s); }
  el.appendChild(inner);
  return { el, inner };
}

for (const n of CONFIG.nodos) {
  const g = new THREE.Group();
  g.position.set(...n.pos);
  const node = { cfg: n, group: g, base: new THREE.Vector3(...n.pos), accent: col(n.nucleo ? C.cobre : n.canal ? C.hielo : C.ambar) };

  if (n.nucleo) {
    const size = 2.0;
    const mat = new THREE.MeshPhysicalMaterial({ color: 0x0d0b0a, metalness: 0.9, roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.15, emissive: col(C.cobre), emissiveIntensity: 0.03, envMapIntensity: 0.45, transparent: true, opacity: 0.8, fog: false });
    const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(cube.geometry), new THREE.LineBasicMaterial({ color: col(C.cobre).multiplyScalar(1.6), transparent: true, opacity: 0.35, fog: false, toneMapped: false }));
    edges.scale.setScalar(1.012); edges.renderOrder = 2; cube.renderOrder = 1;
    cube.add(edges);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(size * 0.5, size * 0.5, size * 0.5), new THREE.MeshBasicMaterial({ color: col(C.cobre).multiplyScalar(1.5), transparent: true, opacity: 0, fog: false, toneMapped: false }));
    cube.add(inner);
    g.add(cube);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: col(C.cobre), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    halo.scale.setScalar(9); g.add(halo);
    // anillos de partículas
    const rings = [];
    [[2.05, 0.35, 420, 0.7, 0.06], [2.6, 0.12, 180, -0.45, 0.045]].forEach(([r, spread, count, speed, size], i) => {
      const pos = new Float32Array(count * 3);
      for (let k = 0; k < count; k++) {
        const a = Math.random() * Math.PI * 2, rr = r + (Math.random() - 0.5) * spread;
        pos[k * 3] = Math.cos(a) * rr; pos[k * 3 + 1] = (Math.random() - 0.5) * spread * 0.6; pos[k * 3 + 2] = Math.sin(a) * rr;
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: col(C.cobre).multiplyScalar(1.4), size, toneMapped: false, map: glowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      const holder = new THREE.Group(); holder.add(pts); holder.rotation.x = 0.42 + i * 0.5; holder.rotation.z = i ? -0.4 : 0.2;
      g.add(holder); rings.push({ holder, pts, speed });
    });
    Object.assign(node, { cube, mat, edges, inner, halo, rings, half: size / 2 });
    const { el, inner: lab } = makeLabel(n);
    const lo = new CSS2DObject(el); lo.position.set(0, -(size / 2 + 0.95), 0); g.add(lo);
    Object.assign(node, { labelEl: el, labelInner: lab, labelObj: lo });
  } else {
    const mat = new THREE.MeshPhysicalMaterial({ color: col(C.placa), metalness: 0.75, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25, emissive: node.accent, emissiveIntensity: 0, envMapIntensity: 0.9, fog: false });
    const plate = new THREE.Mesh(plateGeo, mat); g.add(plate);
    const border = new THREE.Mesh(borderGeo, new THREE.MeshBasicMaterial({ color: col(C.bordeOff), fog: false, toneMapped: false }));
    border.position.z = PLATE_DEPTH / 2 + 0.031; plate.add(border);
    const icon = new THREE.Mesh(iconGeo, new THREE.MeshBasicMaterial({ map: iconTexture(n.icono), transparent: true, color: col(C.icono), opacity: 0.45, fog: false, depthWrite: false }));
    icon.position.set(0, n.barra ? 0.12 : 0, PLATE_DEPTH / 2 + 0.034); plate.add(icon);
    Object.assign(node, { plate, mat, border, icon, half: PLATE / 2 });
    if (n.barra) {
      const bg = new THREE.Mesh(barBgGeo, new THREE.MeshBasicMaterial({ color: 0x1c2331, fog: false }));
      bg.position.set(0, -0.44, PLATE_DEPTH / 2 + 0.034); plate.add(bg);
      const fill = new THREE.Mesh(barFillGeo, new THREE.MeshBasicMaterial({ color: node.accent.clone().multiplyScalar(1.6), fog: false, toneMapped: false }));
      fill.position.set(-0.5, -0.44, PLATE_DEPTH / 2 + 0.036); fill.scale.x = 0.001; plate.add(fill);
      node.bar = fill;
    }
    const { el, inner: lab } = makeLabel(n);
    const lo = new CSS2DObject(el); lo.position.set(0, -(PLATE / 2 + 0.36), 0); g.add(lo);
    Object.assign(node, { labelEl: el, labelInner: lab, labelObj: lo });
  }
  nodeGroup.add(g);
  nodes.set(n.id, node);
}

// ---------- cables ----------
const cables = [];
const cableGroup = new THREE.Group(); scene.add(cableGroup);
const PULSES = 2, TRAIL = 9, TRAIL_STEP = 0.022, PULSE_SPEED = 1 / 0.85; // recorridos por segundo

function cableCurve(a, b) {
  const pa = a.base.clone(), pb = b.base.clone();
  const d = pb.clone().sub(pa);
  const horizontal = Math.abs(d.x) > Math.abs(d.y);
  const start = pa.clone(), end = pb.clone();
  if (horizontal) { start.x += Math.sign(d.x) * a.half; end.x -= Math.sign(d.x) * (b.half * 0.9); }
  else { start.y += Math.sign(d.y) * a.half; end.y -= Math.sign(d.y) * (b.half * 0.9); }
  const len = start.distanceTo(end);
  const c1 = start.clone(), c2 = end.clone();
  if (horizontal) { c1.x += Math.sign(d.x) * len * 0.3; c2.x -= Math.sign(d.x) * len * 0.3; }
  else { c1.y += Math.sign(d.y) * len * 0.3; c2.y -= Math.sign(d.y) * len * 0.3; }
  c1.z += 0.25; c2.z += 0.25;
  return new THREE.CubicBezierCurve3(start, c1, c2, end);
}

for (const [fromId, toId, tone] of CONFIG.cables) {
  const a = nodes.get(fromId), b = nodes.get(toId);
  const curve = cableCurve(a, b);
  const glowColor = col(tone === 'hielo' ? C.hielo : C.ambar);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.028, 8, false), new THREE.MeshBasicMaterial({ color: col(C.cableBase), fog: false, toneMapped: false }));
  cableGroup.add(tube);
  const sprites = [];
  for (let k = 0; k < PULSES; k++) {
    const set = [];
    for (let j = 0; j <= TRAIL; j++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: glowColor.clone().multiplyScalar(j === 0 ? 2.2 : 1.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
      const f = 1 - j / (TRAIL + 1);
      s.scale.setScalar(j === 0 ? 0.26 : 0.2 * f + 0.03); s.visible = false;
      cableGroup.add(s); set.push(s);
    }
    sprites.push(set);
  }
  cables.push({ a, b, curve, tube, sprites, glowColor, tStart: Math.max(a.cfg.enciende, b.cfg.enciende), tEnd: b.cfg.hecho ?? Infinity });
}

// ---------- fondo: rejilla, polvo ----------
const floor = new THREE.GridHelper(140, 70, col(C.rejilla), col(C.rejilla));
floor.position.y = -14.5; floor.material.transparent = true; floor.material.opacity = 0.75; scene.add(floor);
const wall = new THREE.GridHelper(140, 70, col(C.rejilla), col(C.rejilla));
wall.rotation.x = Math.PI / 2; wall.position.z = -12; wall.material.transparent = true; wall.material.opacity = 0.32; scene.add(wall);

const DUST = 700;
const dustBase = new Float32Array(DUST * 3), dustPos = new Float32Array(DUST * 3), dustSeed = new Float32Array(DUST);
for (let i = 0; i < DUST; i++) {
  dustBase[i * 3] = (Math.random() - 0.5) * 30; dustBase[i * 3 + 1] = (Math.random() - 0.5) * 34; dustBase[i * 3 + 2] = -9 + Math.random() * 18; dustSeed[i] = Math.random() * 100;
}
const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x9fb0c8, size: 0.07, map: glowTex, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
scene.add(dust);

// ---------- cámara: splines ----------
const camKeys = CONFIG.camara.claves;
const posCurve = new THREE.CatmullRomCurve3(camKeys.map(k => new THREE.Vector3(...k.pos)), false, 'centripetal');
const tgtCurve = new THREE.CatmullRomCurve3(camKeys.map(k => new THREE.Vector3(...k.mira)), false, 'centripetal');
function cameraAt(t) {
  const n = camKeys.length;
  let i = 0; while (i < n - 2 && t >= camKeys[i + 1].t) i++;
  const k0 = camKeys[i], k1 = camKeys[i + 1];
  let f = clamp((t - k0.t) / (k1.t - k0.t), 0, 1);
  f = lerp(f, smoother(f), CONFIG.camara.suavizado);
  const u = (i + f) / (n - 1);
  camera.position.copy(posCurve.getPoint(u));
  camera.lookAt(tgtCurve.getPoint(u));
}

// ---------- post-proceso ----------
const composer = new EffectComposer(renderer);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 10, aperture: CONFIG.post.bokeh.apertura, maxblur: CONFIG.post.bokeh.desenfoqueMax });
bokeh.enabled = CONFIG.post.bokeh.activo; composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), CONFIG.post.bloom.fuerza, CONFIG.post.bloom.radio, CONFIG.post.bloom.umbral);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const filmPass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, grain: { value: CONFIG.post.grano }, vignette: { value: CONFIG.post.vineta } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, grain, vignette; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float n = hash(vUv * vec2(1080.0, 1920.0) + vec2(fract(time * 7.31) * 173.0, fract(time * 3.17) * 91.0)) - 0.5;
      c.rgb += n * grain;
      vec2 d = vUv - 0.5; d.x *= 0.5625;
      float v = smoothstep(0.78, 0.22, length(d) * 1.35);
      c.rgb *= mix(1.0 - vignette, 1.0, v);
      gl_FragColor = c;
    }`,
});
composer.addPass(filmPass);

// ---------- actualización por tiempo ----------
const nodesByOn = [...nodes.values()].sort((a, b) => a.cfg.enciende - b.cfg.enciende);
const tmpV = new THREE.Vector3();
const cOff = col(C.bordeOff), cDone = col(C.bordeHecho), cBase = col(C.cableBase), cCableDone = col(C.cableHecho), cIcon = col(C.icono);
const tmpC = new THREE.Color(), tmpC2 = new THREE.Color();

function nodeState(cfg, t) {
  const on = smooth(cfg.enciende, cfg.enciende + 0.35, t);
  const done = cfg.hecho == null ? 0 : smooth(cfg.hecho, cfg.hecho + 0.45, t);
  return { on, act: on * (1 - done), done };
}

function update(t) {
  cameraAt(t);

  // nodos
  let idx = 0;
  for (const node of nodes.values()) {
    const cfg = node.cfg, st = nodeState(cfg, t);
    const bob = Math.sin(t * 1.1 + idx * 1.7) * 0.035;
    node.group.position.set(node.base.x, node.base.y + bob, node.base.z);
    const pop = 1 + 0.08 * Math.sin(Math.PI * clamp((t - cfg.enciende) / 0.5, 0, 1));
    node.labelEl.classList.toggle('active', st.act > 0.5);
    node.labelEl.classList.toggle('done', st.done > 0.5);

    if (cfg.nucleo) {
      const glow = st.on;
      node.cube.rotation.y = t * 0.32; node.cube.rotation.x = 0.35 + Math.sin(t * 0.45) * 0.12;
      node.cube.scale.setScalar(pop);
      node.mat.emissiveIntensity = lerp(0.03, 0.14, glow);
      node.edges.material.opacity = lerp(0.3, 1.0, glow);
      node.inner.material.opacity = glow * 0.8; node.inner.rotation.y = -t * 0.5; node.inner.rotation.x = t * 0.3;
      node.halo.material.opacity = glow * 0.22;
      node.rings.forEach(r => { r.holder.rotation.y = t * r.speed; r.pts.material.opacity = glow * 0.95; });
      coreLight.position.copy(node.group.position); coreLight.intensity = glow * 2.2;
    } else {
      node.plate.scale.setScalar(pop);
      // borde: off → activo (brilla) → hecho (gris claro, sin brillo)
      tmpC.copy(cOff).lerp(tmpC2.copy(node.accent).multiplyScalar(1.7), st.act);
      tmpC.lerp(cDone, st.done);
      node.border.material.color.copy(tmpC);
      node.mat.emissiveIntensity = st.act * 0.11;
      node.icon.material.opacity = lerp(0.45, 1, Math.max(st.act, st.done * 0.7));
      node.icon.material.color.copy(cIcon).lerp(node.accent, st.act * 0.6).lerp(cDone, st.done * 0.7);
      if (node.bar) {
        const p = cfg.hecho == null ? 0 : smooth(cfg.enciende + 0.1, cfg.hecho - 0.25, t);
        node.bar.scale.x = Math.max(0.001, p);
        node.bar.material.color.copy(node.accent).multiplyScalar(lerp(1.0, 1.8, st.act)).lerp(cDone, st.done);
      }
    }
    idx++;
  }

  // cables y pulsos
  for (const cb of cables) {
    const sa = nodeState(cb.a.cfg, t), sb = nodeState(cb.b.cfg, t);
    const carrying = (sa.act > 0.5 || sa.done > 0.5) && sb.act > 0.5;
    const doneAmt = Number.isFinite(cb.tEnd) ? smooth(cb.tEnd, cb.tEnd + 0.45, t) : 0;
    const glow = smooth(cb.tStart, cb.tStart + 0.3, t) * (1 - doneAmt);
    tmpC.copy(cBase).lerp(tmpC2.copy(cb.glowColor).multiplyScalar(1.35), glow).lerp(cCableDone, doneAmt);
    cb.tube.material.color.copy(tmpC);

    for (let k = 0; k < PULSES; k++) {
      const uHead = (t - cb.tStart) * PULSE_SPEED - k / PULSES;
      const set = cb.sprites[k];
      for (let j = 0; j <= TRAIL; j++) {
        const s = set[j];
        const u = uHead - j * TRAIL_STEP;
        if (!carrying || u < 0) { s.visible = false; continue; }
        const uu = u % 1;
        // el pulso nace suave en el origen y se apaga al llegar
        const fadeEnds = smooth(0, 0.06, uu) * (1 - smooth(0.94, 1, uu));
        cb.curve.getPointAt(uu, tmpV); s.position.copy(tmpV);
        s.material.opacity = (j === 0 ? 1 : 0.55 * (1 - j / (TRAIL + 1))) * fadeEnds;
        s.visible = true;
      }
    }
  }

  // polvo flotando (determinista)
  for (let i = 0; i < DUST; i++) {
    const s = dustSeed[i];
    dustPos[i * 3] = dustBase[i * 3] + Math.sin(t * 0.21 + s) * 0.5;
    dustPos[i * 3 + 1] = dustBase[i * 3 + 1] + t * 0.08 + Math.cos(t * 0.17 + s * 1.3) * 0.35;
    dustPos[i * 3 + 2] = dustBase[i * 3 + 2] + Math.sin(t * 0.13 + s * 0.7) * 0.4;
  }
  dustGeo.attributes.position.needsUpdate = true;

  // foco del bokeh: nodo activo más reciente, con transición suave desde el anterior
  if (bokeh.enabled) {
    let cur = nodesByOn[0], prev = nodesByOn[0];
    for (const n of nodesByOn) { if (n.cfg.enciende <= t) { prev = cur; cur = n; } }
    const blend = smooth(cur.cfg.enciende, cur.cfg.enciende + 0.6, t);
    const dPrev = camera.position.distanceTo(prev.group.position), dCur = camera.position.distanceTo(cur.group.position);
    bokeh.uniforms.focus.value = lerp(dPrev, dCur, blend);
  }

  filmPass.uniforms.time.value = t;

  // capa fija: frase de fase
  let caption = null, op = 0;
  for (const f of CONFIG.frases) {
    const o = smooth(f.desde, f.desde + 0.35, t) * (1 - smooth(f.hasta, f.hasta + 0.3, t));
    if (o > op) { op = o; caption = f; }
  }
  hud.caption.textContent = caption ? caption.texto : '';
  hud.caption.classList.toggle('strong', !!(caption && caption.destacada));
  hud.caption.style.opacity = op.toFixed(3);
  hud.caption.style.transform = `translateY(${((1 - op) * 14).toFixed(1)}px)`;

  // fundido de bucle
  const fd = CONFIG.bucle.fundido;
  fade.style.opacity = fd > 0 ? Math.max(1 - smooth(0, fd, t), smooth(DUR - fd, DUR, t)).toFixed(3) : 0;
}

function scaleLabels() {
  const { distanciaRef, escalaMin } = CONFIG.etiquetas;
  for (const node of nodes.values()) {
    node.labelObj.getWorldPosition(tmpV);
    const s = clamp(Math.pow(distanciaRef / camera.position.distanceTo(tmpV), 0.75), escalaMin, 1.1);
    node.labelInner.style.transform = `scale(${s.toFixed(3)})`;
  }
}

function render(t) {
  update(t);
  composer.render();
  labelRenderer.render(scene, camera);
  scaleLabels();
}

// ---------- reproducción / búsqueda ----------
let playing = true, t0 = performance.now();
function loop() {
  if (!playing) return;
  const t = ((performance.now() - t0) / 1000) % DUR;
  render(t);
  requestAnimationFrame(loop);
}

// Fija el tiempo (ms) y renderiza un único fotograma. Usado por render.js.
window.seek = (ms) => { playing = false; render(((ms / 1000) % DUR + DUR) % DUR); return true; };
window.play = () => { if (!playing) { playing = true; t0 = performance.now(); loop(); } };
window.LEOVISUAL = { CONFIG, seek: window.seek, play: window.play, _dbg: { composer, bokeh, bloom, filmPass, scene, camera, renderer, nodes, cables } };

window.__ready = false;
document.fonts.ready.then(() => {
  render(0);
  window.__ready = true;
  loop();
});
