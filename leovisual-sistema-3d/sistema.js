// =====================================================================
//  LeoVisual.nl — Sistema de producción de vídeo (animación 3D, 18 s, bucle)
//  Todo el texto, tiempos, colores, efectos y cámara viven en CONFIG.
//  Hay varios TEMAS (CONFIG.temas); se elige con CONFIG.tema o con ?tema=nombre
//  en la URL. La animación es determinista: todo depende del tiempo `t`.
// =====================================================================

export const CONFIG = {
  duracion: 18,          // segundos por bucle
  fps: 60,
  tema: 'ignicion',      // 'ignicion' | 'hiperespacio' | 'forja' | 'sereno'

  marca: {
    nombre: 'LeoVisual',            // blanco, peso 700
    tld: '.nl',                     // gris, peso 500
    subtitulo: 'Así producimos cada pieza',
  },

  // Paleta base (cada tema puede sobreescribir cualquier color)
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
    polvo: '#9fb0c8',
    flash: '#ffffff',
  },

  // Nodos: id, texto, icono, posición [x, y, z], `enciende` y `hecho` (null = sigue activo).
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

  // Cámara base: claves [t, posición, punto al que mira]. Spline suave entre claves.
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

  // Efectos (valores base; cada tema los ajusta)
  efectos: {
    cometa: false,            // el brief entra como un cometa que impacta en el nodo
    explosiones: null,        // { cantidad, velocidad, gravedad, vida, tamano } al encender cada nodo
    ondas: false,             // onda de choque al encender cada nodo
    rayos: false,             // cables activos con arcos eléctricos
    escaner: false,           // línea de escáner holográfico al encender cada nodo
    tesseract: false,         // carcasa geométrica girando alrededor del núcleo
    lanzamiento: false,       // columnas de luz desde los canales al publicar
    warp: [],                 // ventanas [desde, hasta] de salto de hiperespacio
    impactos: [],             // { t, fuerza }: sacudida de cámara + flash
    sacudida: 1.0,            // multiplicador de la sacudida
    flash: 0.0,               // intensidad del flash en los impactos (0 = sin flash)
    aberracion: 0.0,          // aberración cromática (0–0.02)
    anamorfico: { fuerza: 0, tinte: [0.4, 0.7, 1.0] }, // destello horizontal tipo lente anamórfica
    polvo: { tamano: 0.07, ascenso: 0.08, cantidad: 700 },
    golpeTexto: 0.0,          // "golpe" de escala al entrar cada frase (0–0.3)
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
  etiquetas: { distanciaRef: 12.0, escalaMin: 0.7 },

  // ------------------------------------------------------------------
  //  TEMAS: cada uno sobreescribe colores, efectos, post y cámara
  // ------------------------------------------------------------------
  temas: {
    // El original: elegante y contenido
    sereno: {},

    // Fuego, impactos y explosiones. El brief llega como un cometa.
    ignicion: {
      colores: { ambar: '#ffa030', hielo: '#7ad4ff', cobre: '#ff7a3d', fondo: '#07050a', cableBase: '#3d3540', cableHecho: '#6a5e66', rejilla: '#2a1b22', polvo: '#ffb070', flash: '#ffc070' },
      efectos: {
        cometa: true,
        explosiones: { cantidad: 170, velocidad: 3.4, gravedad: 1.4, vida: 0.95, tamano: 0.16 },
        ondas: true, rayos: true, tesseract: true, lanzamiento: true,
        impactos: [{ t: 0.4, fuerza: 0.55 }, { t: 2.6, fuerza: 0.8 }, { t: 5.6, fuerza: 0.3 }, { t: 8.0, fuerza: 0.3 }, { t: 11.6, fuerza: 0.4 }, { t: 14.0, fuerza: 0.4 }, { t: 16.2, fuerza: 0.7 }],
        sacudida: 1.0, flash: 0.6, aberracion: 0.006,
        anamorfico: { fuerza: 0.55, tinte: [1.0, 0.6, 0.3] },
        polvo: { tamano: 0.09, ascenso: 0.45, cantidad: 900 },
        golpeTexto: 0.18,
      },
      post: { bloom: { fuerza: 0.62, radio: 0.5, umbral: 0.66 }, grano: 0.06, vineta: 0.45, exposicion: 1.1 },
      bucle: { fundido: 0.2 },
      camara: { claves: [
        { t: 0.0,  pos: [ 3.0, 12.5, 12.0], mira: [ 0.0,  9.2, 0] },
        { t: 0.45, pos: [ 0.8,  9.6,  7.8], mira: [ 0.0,  9.0, 0] },
        { t: 2.4,  pos: [-0.9,  9.2,  7.2], mira: [ 0.0,  8.8, 0] },
        { t: 2.9,  pos: [-7.0,  6.5, 12.0], mira: [ 0.0,  4.8, 0] },
        { t: 4.2,  pos: [-1.0,  5.6, 17.0], mira: [ 0.0,  4.9, 0] },
        { t: 5.3,  pos: [ 8.5,  6.6, 13.0], mira: [ 0.0,  4.8, 0] },
        { t: 5.9,  pos: [ 2.6,  2.4,  8.4], mira: [ 0.0,  1.4, 0] },
        { t: 7.9,  pos: [-1.6,  1.2,  8.4], mira: [ 0.0,  1.0, 0] },
        { t: 8.5,  pos: [-3.2, -1.0, 15.5], mira: [ 0.0, -1.5, 0] },
        { t: 9.6,  pos: [-1.0, -1.8, 16.5], mira: [ 0.0, -2.0, 0] },
        { t: 11.4, pos: [ 2.8, -3.0, 16.0], mira: [ 0.0, -2.8, 0] },
        { t: 11.9, pos: [ 1.3, -5.4,  8.4], mira: [ 0.0, -5.8, 0] },
        { t: 13.8, pos: [-1.6, -6.0,  9.6], mira: [ 0.0, -6.0, 0] },
        { t: 14.2, pos: [-2.6, -7.9, 16.0], mira: [ 0.0, -8.3, 0] },
        { t: 15.9, pos: [ 2.6, -8.7, 16.0], mira: [ 0.0, -8.7, 0] },
        { t: 16.3, pos: [ 0.5,-10.1,  9.2], mira: [ 0.0,-10.5, 0] },
        { t: 17.3, pos: [ 0.0, -1.1, 45.0], mira: [ 0.0, -1.1, 0] },
        { t: 18.0, pos: [ 0.0, -1.1, 47.5], mira: [ 0.0, -1.1, 0] },
      ] },
    },

    // Ciencia ficción: saltos de hiperespacio entre fases, hologramas, tesseract
    hiperespacio: {
      colores: { ambar: '#35e6ff', hielo: '#ff4fd8', cobre: '#b78cff', fondo: '#03040c', cableBase: '#2b3552', cableHecho: '#4a5a80', bordeOff: '#24304a', bordeHecho: '#9fb8d8', rejilla: '#122040', placa: '#0a0f1c', polvo: '#8fd8ff', flash: '#bfe6ff' },
      efectos: {
        explosiones: { cantidad: 110, velocidad: 2.2, gravedad: 0.0, vida: 1.1, tamano: 0.11 },
        ondas: true, escaner: true, tesseract: true, lanzamiento: true,
        warp: [[2.55, 3.15], [5.4, 6.0], [8.0, 8.6], [11.5, 12.1], [13.9, 14.5], [16.1, 17.3]],
        impactos: [{ t: 2.6, fuerza: 0.35 }, { t: 5.6, fuerza: 0.2 }, { t: 8.0, fuerza: 0.2 }, { t: 11.6, fuerza: 0.25 }, { t: 14.0, fuerza: 0.25 }, { t: 16.2, fuerza: 0.4 }],
        sacudida: 0.7, flash: 0.5, aberracion: 0.014,
        anamorfico: { fuerza: 0.9, tinte: [0.35, 0.75, 1.0] },
        polvo: { tamano: 0.06, ascenso: 0.1, cantidad: 900 },
        golpeTexto: 0.12,
      },
      post: { bloom: { fuerza: 0.8, radio: 0.55, umbral: 0.6 }, grano: 0.035, vineta: 0.4, exposicion: 1.0 },
      camara: { claves: [
        { t: 0.0,  pos: [ 0.0, 11.5, 20.0], mira: [ 0.0,  8.8, 0] },
        { t: 2.5,  pos: [ 0.4,  9.3,  8.0], mira: [ 0.0,  8.9, 0] },
        { t: 3.2,  pos: [-8.5,  8.0, 13.0], mira: [ 0.0,  4.8, 0] },
        { t: 4.3,  pos: [ 0.0,  4.0, 17.5], mira: [ 0.0,  4.9, 0] },
        { t: 5.4,  pos: [ 8.5,  7.5, 13.0], mira: [ 0.0,  4.8, 0] },
        { t: 6.1,  pos: [ 2.8,  2.2,  9.0], mira: [ 0.0,  1.4, 0] },
        { t: 7.9,  pos: [-2.0,  1.0,  8.8], mira: [ 0.0,  1.0, 0] },
        { t: 8.6,  pos: [-3.5, -0.8, 16.0], mira: [ 0.0, -1.6, 0] },
        { t: 11.4, pos: [ 3.0, -3.2, 16.0], mira: [ 0.0, -2.8, 0] },
        { t: 12.1, pos: [ 1.4, -5.2,  8.6], mira: [ 0.0, -5.8, 0] },
        { t: 13.8, pos: [-1.6, -6.2,  9.8], mira: [ 0.0, -6.0, 0] },
        { t: 14.5, pos: [-2.6, -7.9, 16.0], mira: [ 0.0, -8.3, 0] },
        { t: 16.0, pos: [ 2.6, -8.7, 16.0], mira: [ 0.0, -8.7, 0] },
        { t: 16.3, pos: [ 0.5,-10.1,  9.2], mira: [ 0.0,-10.5, 0] },
        { t: 17.3, pos: [ 0.0, -1.1, 45.0], mira: [ 0.0, -1.1, 0] },
        { t: 18.0, pos: [ 0.0, -1.1, 47.5], mira: [ 0.0, -1.1, 0] },
      ] },
    },

    // Cine negro industrial: chispas, acero caliente, destellos anamórficos, grano
    forja: {
      colores: { ambar: '#ffd27a', hielo: '#a9ccff', cobre: '#ff8a3a', fondo: '#050505', cableBase: '#3a3a3f', cableHecho: '#5c5c62', bordeOff: '#2c2c31', bordeHecho: '#c8c8cc', rejilla: '#1a1a1e', placa: '#0b0c10', polvo: '#ffcf9a', flash: '#fff1d6' },
      efectos: {
        explosiones: { cantidad: 260, velocidad: 4.8, gravedad: 7.0, vida: 1.15, tamano: 0.075 },
        ondas: false, rayos: false, tesseract: false, lanzamiento: true,
        impactos: [{ t: 0.4, fuerza: 0.45 }, { t: 2.6, fuerza: 0.9 }, { t: 5.6, fuerza: 0.35 }, { t: 8.0, fuerza: 0.35 }, { t: 9.2, fuerza: 0.25 }, { t: 11.6, fuerza: 0.5 }, { t: 14.0, fuerza: 0.45 }, { t: 16.2, fuerza: 0.8 }],
        sacudida: 1.3, flash: 0.45, aberracion: 0.004,
        anamorfico: { fuerza: 1.3, tinte: [0.3, 0.55, 1.0] },
        polvo: { tamano: 0.06, ascenso: 0.3, cantidad: 600 },
        golpeTexto: 0.25,
      },
      post: { bloom: { fuerza: 0.5, radio: 0.4, umbral: 0.7 }, grano: 0.1, vineta: 0.58, exposicion: 1.15 },
      camara: { claves: [
        { t: 0.0,  pos: [ 0.0,  9.0, 13.5], mira: [ 0.0,  9.0, 0] },
        { t: 0.4,  pos: [ 0.0,  9.0,  7.0], mira: [ 0.0,  9.0, 0] },
        { t: 2.5,  pos: [ 1.2,  9.3,  6.4], mira: [ 0.0,  8.9, 0] },
        { t: 2.7,  pos: [ 0.0,  5.4, 10.0], mira: [ 0.0,  4.8, 0] },
        { t: 4.3,  pos: [-4.0,  3.5, 16.0], mira: [ 0.0,  4.9, 0] },
        { t: 5.4,  pos: [ 6.0,  8.0, 14.0], mira: [ 0.0,  4.8, 0] },
        { t: 5.7,  pos: [ 0.0,  1.4,  7.5], mira: [ 0.0,  1.4, 0] },
        { t: 7.9,  pos: [-1.8,  1.0,  8.6], mira: [ 0.0,  1.0, 0] },
        { t: 8.1,  pos: [-3.5, -0.5, 15.0], mira: [ 0.0, -1.5, 0] },
        { t: 11.4, pos: [ 3.0, -3.4, 16.0], mira: [ 0.0, -2.8, 0] },
        { t: 11.7, pos: [ 0.0, -5.8,  7.5], mira: [ 0.0, -5.8, 0] },
        { t: 13.8, pos: [-1.8, -6.2,  9.6], mira: [ 0.0, -6.0, 0] },
        { t: 14.1, pos: [-2.8, -7.9, 16.0], mira: [ 0.0, -8.3, 0] },
        { t: 16.0, pos: [ 2.8, -8.7, 16.0], mira: [ 0.0, -8.7, 0] },
        { t: 16.25,pos: [ 0.0,-10.6,  7.8], mira: [ 0.0,-10.6, 0] },
        { t: 17.3, pos: [ 0.0, -1.1, 45.0], mira: [ 0.0, -1.1, 0] },
        { t: 18.0, pos: [ 0.0, -1.1, 47.5], mira: [ 0.0, -1.1, 0] },
      ] },
    },
  },
};

// Aplicar tema (CONFIG.tema o ?tema=nombre en la URL)
(function aplicarTema() {
  const nombre = new URLSearchParams(location.search).get('tema') || CONFIG.tema;
  const T = CONFIG.temas[nombre];
  if (!T) { console.warn('Tema desconocido:', nombre); return; }
  CONFIG.tema = nombre;
  const merge = (dst, src) => { for (const k in src) { if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && dst[k] && typeof dst[k] === 'object' && !Array.isArray(dst[k])) merge(dst[k], src[k]); else dst[k] = src[k]; } };
  merge(CONFIG, T);
})();

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
const FX = CONFIG.efectos;
const col = (hex) => new THREE.Color(hex);

// ---------- utilidades ----------
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
const smoother = (u) => u * u * u * (u * (u * 6 - 15) + 10);
const lerp = (a, b, u) => a + (b - a) * u;
// PRNG con semilla: las partículas son iguales en cada carga (render reproducible)
let seed = 1337;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let r = Math.imul(seed ^ seed >>> 15, 1 | seed); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; };
const noise1 = (x) => Math.sin(x * 1.7) * 0.5 + Math.sin(x * 4.3 + 1.3) * 0.3 + Math.sin(x * 9.1 + 2.1) * 0.2;

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

const hudEl = document.getElementById('hud');
const overlay = (color) => { const d = document.createElement('div'); d.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;background:${color};pointer-events:none;opacity:0`; hudEl.appendChild(d); return d; };
const flashEl = overlay(C.flash);
const fade = overlay(C.fondo);

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
scene.add(camera);

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

// Iconos dibujados a mano en canvas (trazos reales, nada generado)
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

// ---------- geometrías compartidas ----------
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
const ringGeo = new THREE.RingGeometry(0.93, 1.0, 72);
const ringGeoThin = new THREE.RingGeometry(0.975, 1.0, 96);
const scanGeo = new THREE.PlaneGeometry(PLATE - 0.1, 0.06);
const columnGeo = new THREE.PlaneGeometry(0.5, 9); columnGeo.translate(0, 4.5, 0);

// Explosión de partículas (shader: la posición se calcula a partir de la edad)
function makeBurst(color, p) {
  const n = p.cantidad, dir = new Float32Array(n * 3), spd = new Float32Array(n), sd = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const th = rnd() * Math.PI * 2, ph = Math.acos(rnd() * 2 - 1);
    dir[i * 3] = Math.sin(ph) * Math.cos(th); dir[i * 3 + 1] = Math.sin(ph) * Math.sin(th); dir[i * 3 + 2] = Math.cos(ph) * 0.6;
    spd[i] = p.velocidad * (0.35 + rnd() * 0.65); sd[i] = rnd();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(spd, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uAge: { value: -1 }, uColor: { value: color.clone().multiplyScalar(1.9) }, uLife: { value: p.vida }, uGrav: { value: p.gravedad }, uSize: { value: p.tamano }, uMap: { value: glowTex } },
    vertexShader: `attribute vec3 aDir; attribute float aSpeed, aSeed; uniform float uAge, uLife, uGrav, uSize; varying float vA;
      void main(){ float life = uLife * (0.6 + 0.4 * aSeed); float a = clamp(uAge / life, 0.0, 1.0);
        vA = (uAge < 0.0 || uAge > life) ? 0.0 : (1.0 - a) * (1.0 - a);
        float e = 1.0 - pow(1.0 - a, 2.4); vec3 p = aDir * aSpeed * e; p.y -= uGrav * a * a;
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = uSize * (0.5 + 0.5 * (1.0 - a)) * (2318.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform sampler2D uMap; varying float vA; void main(){ float m = texture2D(uMap, gl_PointCoord).a; gl_FragColor = vec4(uColor, m * vA); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.visible = false; return pts;
}

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
const addMesh = (parent, geo, matOpts, z, extra = {}) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false, side: THREE.DoubleSide, ...matOpts })); m.position.z = z; Object.assign(m, extra); parent.add(m); return m; };

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
    const rings = [];
    [[2.05, 0.35, 420, 0.7, 0.06], [2.6, 0.12, 180, -0.45, 0.045]].forEach(([r, spread, count, speed, psize], i) => {
      const pos = new Float32Array(count * 3);
      for (let k = 0; k < count; k++) {
        const a = rnd() * Math.PI * 2, rr = r + (rnd() - 0.5) * spread;
        pos[k * 3] = Math.cos(a) * rr; pos[k * 3 + 1] = (rnd() - 0.5) * spread * 0.6; pos[k * 3 + 2] = Math.sin(a) * rr;
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: col(C.cobre).multiplyScalar(1.4), size: psize, toneMapped: false, map: glowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      const holder = new THREE.Group(); holder.add(pts); holder.rotation.x = 0.42 + i * 0.5; holder.rotation.z = i ? -0.4 : 0.2;
      g.add(holder); rings.push({ holder, pts, speed });
    });
    // Tesseract: carcasas geométricas girando alrededor del núcleo
    const shells = [];
    if (FX.tesseract) {
      [[new THREE.OctahedronGeometry(2.1), 0.5], [new THREE.BoxGeometry(2.7, 2.7, 2.7), -0.3]].forEach(([geo, speed]) => {
        const sh = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: col(C.cobre).multiplyScalar(1.3), transparent: true, opacity: 0, fog: false, toneMapped: false }));
        g.add(sh); shells.push({ mesh: sh, speed });
      });
    }
    Object.assign(node, { cube, mat, edges, inner, halo, rings, shells, half: size / 2 });
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
    if (FX.escaner) node.scan = addMesh(plate, scanGeo, { color: node.accent.clone().multiplyScalar(2.2) }, PLATE_DEPTH / 2 + 0.05);
    if (FX.lanzamiento && n.canal) node.column = addMesh(g, columnGeo, { color: node.accent.clone().multiplyScalar(1.6), map: softTex }, -0.3);
    const { el, inner: lab } = makeLabel(n);
    const lo = new CSS2DObject(el); lo.position.set(0, -(PLATE / 2 + 0.36), 0); g.add(lo);
    Object.assign(node, { labelEl: el, labelInner: lab, labelObj: lo });
  }
  // efectos comunes de encendido
  if (FX.explosiones) { node.burst = makeBurst(node.accent, n.nucleo ? { ...FX.explosiones, cantidad: FX.explosiones.cantidad * 2, velocidad: FX.explosiones.velocidad * 1.6 } : FX.explosiones); g.add(node.burst); }
  if (FX.ondas) {
    node.ring = addMesh(g, n.nucleo ? ringGeoThin : ringGeo, { color: node.accent.clone().multiplyScalar(1.8) }, 0.2);
    if (n.nucleo) { node.ring2 = addMesh(g, ringGeoThin, { color: node.accent.clone().multiplyScalar(1.8) }, 0); node.ring2.rotation.x = Math.PI / 2; }
  }
  nodeGroup.add(g);
  nodes.set(n.id, node);
}

// ---------- cables ----------
const cables = [];
const cableGroup = new THREE.Group(); scene.add(cableGroup);
const PULSES = 2, TRAIL = 9, TRAIL_STEP = 0.022, PULSE_SPEED = 1 / 0.85; // recorridos por segundo
const BOLT_N = 48;

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
  // arcos eléctricos (dos líneas dentadas superpuestas al cable)
  const bolts = [];
  if (FX.rayos) {
    for (let k = 0; k < 2; k++) {
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(BOLT_N * 3), 3));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: glowColor.clone().multiplyScalar(2.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
      line.frustumCulled = false; line.visible = false; cableGroup.add(line); bolts.push({ line, seed: rnd() * 100 });
    }
  }
  // base ortonormal aproximada para desplazar los arcos alrededor del cable
  const tan = curve.getTangentAt(0.5), n1 = new THREE.Vector3(0, 0, 1).cross(tan).normalize(), n2 = tan.clone().cross(n1).normalize();
  cables.push({ a, b, curve, tube, sprites, bolts, n1, n2, glowColor, tStart: Math.max(a.cfg.enciende, b.cfg.enciende), tEnd: b.cfg.hecho ?? Infinity });
}

// ---------- fondo: rejilla, polvo, cometa, warp ----------
const floor = new THREE.GridHelper(140, 70, col(C.rejilla), col(C.rejilla));
floor.position.y = -14.5; floor.material.transparent = true; floor.material.opacity = 0.75; scene.add(floor);
const wall = new THREE.GridHelper(140, 70, col(C.rejilla), col(C.rejilla));
wall.rotation.x = Math.PI / 2; wall.position.z = -12; wall.material.transparent = true; wall.material.opacity = 0.32; scene.add(wall);

const DUST = FX.polvo.cantidad;
const dustBase = new Float32Array(DUST * 3), dustPos = new Float32Array(DUST * 3), dustSeed = new Float32Array(DUST);
for (let i = 0; i < DUST; i++) {
  dustBase[i * 3] = (rnd() - 0.5) * 30; dustBase[i * 3 + 1] = (rnd() - 0.5) * 34; dustBase[i * 3 + 2] = -9 + rnd() * 18; dustSeed[i] = rnd() * 100;
}
const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: col(C.polvo), size: FX.polvo.tamano, map: glowTex, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
scene.add(dust);

// Cometa: cabeza + estela que entra desde fuera de plano e impacta en el brief
let comet = null;
if (FX.cometa) {
  const brief = nodes.get('brief');
  const path = new THREE.CubicBezierCurve3(new THREE.Vector3(9, 17, 10), new THREE.Vector3(5, 13, 6), new THREE.Vector3(1.5, 10.5, 2), brief.base.clone().add(new THREE.Vector3(0, 0, 0.4)));
  const parts = [];
  for (let j = 0; j < 14; j++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col(C.ambar).multiplyScalar(j === 0 ? 3 : 2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
    s.scale.setScalar(j === 0 ? 0.9 : 0.6 * (1 - j / 14) + 0.08); s.visible = false; scene.add(s); parts.push(s);
  }
  comet = { path, parts, desde: 0.0, hasta: brief.cfg.enciende };
}

// Warp: estelas de luz fijas a la cámara que avanzan hacia ella durante los saltos
let warp = null;
if (FX.warp.length) {
  const n = 320, pos = new Float32Array(n * 6), meta = [];
  for (let i = 0; i < n; i++) { const r = 1.5 + rnd() * 9, a = rnd() * Math.PI * 2; meta.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * 1.6, z0: rnd() * 40, len: 1.5 + rnd() * 4 }); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: col(C.ambar).multiplyScalar(1.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  lines.frustumCulled = false; lines.visible = false; camera.add(lines);
  warp = { lines, pos, meta };
}

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
// intensidad del salto de hiperespacio en t (0–1)
function warpAmount(t) {
  let e = 0;
  for (const [a, b] of FX.warp) e = Math.max(e, smooth(a, a + 0.18, t) * (1 - smooth(b - 0.2, b, t)));
  return e;
}
// sacudida + flash por impactos
function impactAmount(t) {
  let shake = 0, flash = 0;
  for (const im of FX.impactos) {
    const age = t - im.t;
    if (age >= 0 && age < 0.9) { shake = Math.max(shake, im.fuerza * Math.pow(1 - age / 0.9, 2)); flash = Math.max(flash, im.fuerza * (1 - smooth(0, 0.16, age))); }
  }
  return { shake, flash };
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
  uniforms: {
    tDiffuse: { value: null }, time: { value: 0 }, grain: { value: CONFIG.post.grano }, vignette: { value: CONFIG.post.vineta },
    aberration: { value: FX.aberracion }, anam: { value: FX.anamorfico.fuerza }, anamTint: { value: new THREE.Vector3(...FX.anamorfico.tinte) }, warpAmt: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, grain, vignette, aberration, anam, warpAmt; uniform vec3 anamTint; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5;
      float ca = (aberration + warpAmt * 0.012) * length(d);
      vec3 c;
      c.r = texture2D(tDiffuse, vUv + d * ca).r;
      c.g = texture2D(tDiffuse, vUv).g;
      c.b = texture2D(tDiffuse, vUv - d * ca).b;
      // destello anamórfico: suma horizontal de las zonas brillantes
      if (anam > 0.0) {
        vec3 s = vec3(0.0);
        for (int i = -10; i <= 10; i++) { float w = 1.0 - abs(float(i)) / 11.0; vec3 t = texture2D(tDiffuse, vUv + vec2(float(i) * 0.011, 0.0)).rgb; s += max(t - 0.72, 0.0) * w; }
        c += s * anamTint * anam * 0.28;
      }
      // desenfoque radial durante el warp
      if (warpAmt > 0.0) { vec3 r = vec3(0.0); for (int i = 1; i <= 6; i++) r += texture2D(tDiffuse, vUv - d * float(i) * 0.012 * warpAmt).rgb; c = mix(c, r / 6.0, 0.55 * warpAmt); }
      float n = hash(vUv * vec2(1080.0, 1920.0) + vec2(fract(time * 7.31) * 173.0, fract(time * 3.17) * 91.0)) - 0.5;
      c += n * grain;
      vec2 dv = d; dv.x *= 0.5625;
      float v = smoothstep(0.78, 0.22, length(dv) * 1.35);
      c *= mix(1.0 - vignette, 1.0, v);
      gl_FragColor = vec4(c, 1.0);
    }`,
});
composer.addPass(filmPass);

// ---------- actualización por tiempo ----------
const nodesByOn = [...nodes.values()].sort((a, b) => a.cfg.enciende - b.cfg.enciende);
const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3();
const cOff = col(C.bordeOff), cDone = col(C.bordeHecho), cBase = col(C.cableBase), cCableDone = col(C.cableHecho), cIcon = col(C.icono);
const tmpC = new THREE.Color(), tmpC2 = new THREE.Color();

function nodeState(cfg, t) {
  const on = smooth(cfg.enciende, cfg.enciende + 0.35, t);
  const done = cfg.hecho == null ? 0 : smooth(cfg.hecho, cfg.hecho + 0.45, t);
  return { on, act: on * (1 - done), done };
}

function update(t) {
  cameraAt(t);
  const wa = warpAmount(t);
  const { shake, flash } = impactAmount(t);
  if (shake > 0) {
    const k = shake * FX.sacudida;
    camera.position.x += noise1(t * 47.0) * 0.18 * k; camera.position.y += noise1(t * 41.0 + 9.0) * 0.18 * k;
    camera.rotation.z += noise1(t * 37.0 + 3.0) * 0.012 * k;
  }
  camera.fov = CONFIG.camara.fov + wa * 14; camera.updateProjectionMatrix();

  // nodos
  let idx = 0;
  for (const node of nodes.values()) {
    const cfg = node.cfg, st = nodeState(cfg, t);
    const bob = Math.sin(t * 1.1 + idx * 1.7) * 0.035;
    node.group.position.set(node.base.x, node.base.y + bob, node.base.z);
    const age = t - cfg.enciende;
    const pop = 1 + 0.1 * Math.sin(Math.PI * clamp(age / 0.5, 0, 1));
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
      node.shells.forEach(s => { s.mesh.rotation.y = t * s.speed; s.mesh.rotation.x = t * s.speed * 0.6 + 0.5; s.mesh.material.opacity = glow * 0.55; });
      coreLight.position.copy(node.group.position); coreLight.intensity = glow * 2.2 + (age >= 0 && age < 0.5 ? (1 - age / 0.5) * 3.5 : 0);
    } else {
      node.plate.scale.setScalar(pop);
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
      if (node.scan) { const a = clamp(age / 0.6, 0, 1); node.scan.position.y = 0.7 - 1.4 * a; node.scan.material.opacity = age >= 0 && a < 1 ? (1 - a) * 0.9 : 0; }
      if (node.column) { const a = clamp(age / 1.4, 0, 1); node.column.scale.y = 0.2 + 0.8 * smoother(a); node.column.material.opacity = age >= 0 ? (1 - a) * 0.7 * (0.75 + 0.25 * Math.sin(t * 40)) : 0; }
    }
    // explosión / onda al encender
    if (node.burst) { const life = FX.explosiones.vida; node.burst.visible = age >= 0 && age < life; node.burst.material.uniforms.uAge.value = age; }
    if (node.ring) {
      const a = clamp(age / (cfg.nucleo ? 1.1 : 0.7), 0, 1), vis = age >= 0 && a < 1;
      const s = (cfg.nucleo ? 1.2 : 0.7) + (cfg.nucleo ? 12 : 3.2) * (1 - Math.pow(1 - a, 2.5));
      for (const r of [node.ring, node.ring2]) { if (!r) continue; r.visible = vis; r.scale.setScalar(s); r.material.opacity = vis ? (1 - a) * 0.85 : 0; }
    }
    idx++;
  }

  // cables, pulsos y arcos
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
        const fadeEnds = smooth(0, 0.06, uu) * (1 - smooth(0.94, 1, uu));
        cb.curve.getPointAt(uu, tmpV); s.position.copy(tmpV);
        s.material.opacity = (j === 0 ? 1 : 0.55 * (1 - j / (TRAIL + 1))) * fadeEnds;
        s.visible = true;
      }
    }
    for (const bolt of cb.bolts) {
      bolt.line.visible = carrying;
      if (!carrying) continue;
      const arr = bolt.line.geometry.attributes.position.array;
      const frame = Math.floor(t * 24); // los arcos cambian de forma 24 veces por segundo
      for (let i = 0; i < BOLT_N; i++) {
        const u = i / (BOLT_N - 1), env = Math.sin(u * Math.PI);
        cb.curve.getPointAt(u, tmpV);
        const h1 = (hashf(i * 3.1 + frame * 7.7 + bolt.seed) - 0.5) * 0.28 * env, h2 = (hashf(i * 5.3 + frame * 2.9 + bolt.seed * 3) - 0.5) * 0.28 * env;
        tmpV.addScaledVector(cb.n1, h1).addScaledVector(cb.n2, h2);
        arr[i * 3] = tmpV.x; arr[i * 3 + 1] = tmpV.y; arr[i * 3 + 2] = tmpV.z;
      }
      bolt.line.geometry.attributes.position.needsUpdate = true;
      bolt.line.material.opacity = glow * (0.45 + 0.4 * hashf(frame + bolt.seed));
    }
  }

  // polvo / ascuas
  for (let i = 0; i < DUST; i++) {
    const s = dustSeed[i];
    dustPos[i * 3] = dustBase[i * 3] + Math.sin(t * 0.21 + s) * 0.5;
    dustPos[i * 3 + 1] = ((dustBase[i * 3 + 1] + t * FX.polvo.ascenso + Math.cos(t * 0.17 + s * 1.3) * 0.35 + 17) % 34 + 34) % 34 - 17;
    dustPos[i * 3 + 2] = dustBase[i * 3 + 2] + Math.sin(t * 0.13 + s * 0.7) * 0.4;
  }
  dustGeo.attributes.position.needsUpdate = true;

  // cometa
  if (comet) {
    const u0 = (t - comet.desde) / (comet.hasta - comet.desde);
    comet.parts.forEach((s, j) => {
      const u = u0 - j * 0.035;
      const vis = u >= 0 && u <= 1;
      s.visible = vis; if (!vis) return;
      comet.path.getPointAt(Math.pow(u, 1.6), tmpV); s.position.copy(tmpV);
      s.material.opacity = (j === 0 ? 1 : 0.7 * (1 - j / 14)) * smooth(0, 0.08, u);
    });
  }

  // warp
  if (warp) {
    warp.lines.visible = wa > 0.001;
    if (wa > 0.001) {
      const arr = warp.pos; let z = 0;
      for (const m of warp.meta) {
        const zz = -2 - ((m.z0 + t * 26) % 40);
        arr[z++] = m.x; arr[z++] = m.y; arr[z++] = zz; arr[z++] = m.x; arr[z++] = m.y; arr[z++] = zz - m.len * (0.5 + wa);
      }
      warp.lines.geometry.attributes.position.needsUpdate = true;
      warp.lines.material.opacity = wa * 0.8;
    }
  }

  // foco del bokeh: nodo activo más reciente, con transición suave desde el anterior
  if (bokeh.enabled) {
    let cur = nodesByOn[0], prev = nodesByOn[0];
    for (const n of nodesByOn) { if (n.cfg.enciende <= t) { prev = cur; cur = n; } }
    const blend = smooth(cur.cfg.enciende, cur.cfg.enciende + 0.6, t);
    const dPrev = camera.position.distanceTo(prev.group.position), dCur = camera.position.distanceTo(cur.group.position);
    bokeh.uniforms.focus.value = lerp(dPrev, dCur, blend);
  }

  filmPass.uniforms.time.value = t;
  filmPass.uniforms.warpAmt.value = wa;

  // capa fija: frase de fase (con golpe de escala opcional)
  let caption = null, op = 0, fresh = 0;
  for (const f of CONFIG.frases) {
    const o = smooth(f.desde, f.desde + 0.35, t) * (1 - smooth(f.hasta, f.hasta + 0.3, t));
    if (o > op) { op = o; caption = f; fresh = 1 - smooth(f.desde, f.desde + 0.45, t); }
  }
  hud.caption.textContent = caption ? caption.texto : '';
  hud.caption.classList.toggle('strong', !!(caption && caption.destacada));
  hud.caption.style.opacity = op.toFixed(3);
  hud.caption.style.transform = `translateY(${((1 - op) * 14).toFixed(1)}px) scale(${(1 + FX.golpeTexto * fresh).toFixed(3)})`;

  // flash de impacto y fundido de bucle
  flashEl.style.opacity = (flash * FX.flash).toFixed(3);
  const fd = CONFIG.bucle.fundido;
  fade.style.opacity = fd > 0 ? Math.max(1 - smooth(0, fd, t), smooth(DUR - fd, DUR, t)).toFixed(3) : 0;
}
const hashf = (x) => { const s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); };

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
