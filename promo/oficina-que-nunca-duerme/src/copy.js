// Textos en pantalla. Editar aquí para cambiar el guion sin tocar la animación.
// claim: true → afirmación sobre el producto que hay que confirmar antes de publicar.
export const CUES = [
  // 01 · El impacto
  { in: 5.0, out: 6.85, html: 'VENDER EN AMAZON.', cls: 'title', y: 'a' },
  { in: 5.95, out: 6.85, html: 'NO ES UN TRABAJO.', cls: 'title', y: 'b' },
  { in: 7.0, out: 7.62, html: 'SON <span class="num">OCHO.</span>', cls: 'impact', y: 'c', fx: 'slam' },
  // 03 · Tú solo
  { in: 16.0, out: 21.95, html: '<span class="num">01 —</span> TÚ SOLO.', cls: 'title', y: 'a' },
  // 04 · La oficina
  { in: 25.0, out: 28.3, html: '<span class="num">02 —</span> LA OFICINA.', cls: 'title', y: 'a' },
  { in: 28.5, out: 31.2, html: 'UN AGENTE POR DEPARTAMENTO.', cls: 'line', y: 'a', claim: true },
  { in: 31.4, out: 33.8, html: 'SUS REGLAS. SUS CÁLCULOS.', cls: 'line', y: 'a', claim: true },
  { in: 34.8, out: 37.45, html: 'UN DIRECTOR. <span class="num">TODO CONECTADO.</span>', cls: 'line', y: 'a', claim: true },
  // 05 · Lunes 07:00
  { in: 39.8, out: 42.5, html: '<span class="num">03 —</span> LUNES. 07:00.', cls: 'title', y: 'a' },
  { in: 42.8, out: 45.0, html: 'TUS ANUNCIOS, REVISADOS.', cls: 'line', y: 'a', claim: true },
  { in: 45.2, out: 47.6, html: 'TRES ASUNTOS. <span class="num">TÚ DECIDES.</span>', cls: 'line', y: 'a' },
  // 06 · Es tuya
  { in: 48.6, out: 54.9, html: '<span class="num">04 —</span> ES TUYA.', cls: 'title', y: 's1' },
  { in: 50.4, out: 54.9, html: 'EN TU ORDENADOR.', cls: 'line', y: 's2', claim: true },
  { in: 52.0, out: 54.9, html: 'SIN ACCESO A TU SELLER CENTRAL.', cls: 'line', y: 's3', claim: true },
  { in: 53.6, out: 54.9, html: 'CON GUÍAS PARA EMPEZAR.', cls: 'line', y: 's4', claim: true },
  // 07 · La revelación
  { in: 57.9, out: 60.15, html: 'NO NECESITAS OCHO VIDAS.', cls: 'line', y: 'e1' },
  { in: 58.9, out: 60.15, html: 'NECESITAS UNA OFICINA QUE <span class="num">TRABAJE CONTIGO.</span>', cls: 'line', y: 'e2' },
];

// Palabras rápidas bajo «01 — TÚ SOLO.»: primera vuelta pausada, segunda más rápida
export const RAPID = ['PPC.', 'BENEFICIO.', 'IMÁGENES.', 'FICHAS.', 'INVENTARIO.', 'CUENTA.', 'IVA.'];
export const RAPID_T = [...RAPID.map((_, i) => 17.2 + i * 0.42), ...RAPID.map((_, i) => 20.15 + i * 0.25)];

// Panel PPC de la tienda ficticia (escena 5). Datos ilustrativos.
export const PPC_ITEMS = [
  { title: 'Búsquedas con gasto y sin ventas', detail: 'Campaña automática · 14 términos en 30 días', prop: 'Propuesta: añadir como negativas' },
  { title: 'Puja por encima de tu objetivo', detail: '«termo acero 1 l» · coste por venta alto', prop: 'Propuesta: bajar la puja un 10 %' },
  { title: 'Presupuesto agotado a las 15:00', detail: 'Campaña de marca con ventas estables', prop: 'Propuesta: valorar subir el presupuesto' },
];

export const GUIDE_STEPS = ['Instalar la oficina en tu ordenador', 'Abrir la guía de configuración', 'Configurar tus 8 departamentos', 'Primera revisión'];
