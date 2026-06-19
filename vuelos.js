#!/usr/bin/env node
/*
 * Vigilante de vuelos baratos AMS → BCN (fines de semana) — Leo
 * Corre en la nube desde GitHub Actions: revisa los próximos fines de semana
 * (viernes ida → domingo vuelta) y avisa por Telegram cuando encuentra un
 * billete de ida y vuelta por debajo del precio objetivo.
 *
 * Datos: API Self-Service de Amadeus (gratis). Requiere los secretos del repo
 *   AMADEUS_CLIENT_ID y AMADEUS_CLIENT_SECRET.
 * Avisos: Telegram (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID).
 * Estado: estado/vuelos.json (persistido entre ejecuciones con actions/cache).
 */
const fs = require('fs');
const path = require('path');

// ─── Configuración (cámbiala aquí) ───────────────────────────────────────────
const ORIGIN = 'AMS';          // Ámsterdam Schiphol
const DEST = 'BCN';            // Barcelona El Prat
const MAX_PRICE = 150;         // Precio objetivo: ida y vuelta por persona (EUR)
const CURRENCY = 'EUR';
const WEEKS_AHEAD = 8;         // Cuántos fines de semana hacia adelante vigilar
const ADULTS = 1;              // Pasajeros
const NONSTOP = true;          // Solo vuelos directos (lo normal para un finde)
// Solo se vuelve a avisar de un finde ya avisado si el precio baja al menos esto:
const DROP_NOTIFY = 10;        // EUR
const MAX_OFFERS = 5;          // Ofertas que pide a Amadeus por finde (coge la más barata)

// Host de Amadeus. Producción ('api.amadeus.com') = precios reales. El entorno de
// pruebas ('test.api.amadeus.com') devuelve datos limitados y poco realistas.
const AMADEUS_HOST = process.env.AMADEUS_HOSTNAME || 'api.amadeus.com';
const STATE_FILE = path.join(__dirname, 'estado', 'vuelos.json');

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// ─── Utilidades de fecha ─────────────────────────────────────────────────────
// Trabajamos en UTC a mediodía para que el formateo a YYYY-MM-DD no se desplace.
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

// Devuelve los próximos `n` fines de semana como {viernes, domingo} (objetos Date).
function proximosFinesDeSemana(n) {
  const hoy = new Date();
  const base = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate(), 12));
  const dow = base.getUTCDay();               // 0 dom … 5 vie … 6 sáb
  const haciaViernes = (5 - dow + 7) % 7;      // días hasta el próximo viernes (0 si hoy es viernes)
  const primerViernes = new Date(base);
  primerViernes.setUTCDate(base.getUTCDate() + haciaViernes);
  const fines = [];
  for (let i = 0; i < n; i++) {
    const viernes = new Date(primerViernes);
    viernes.setUTCDate(primerViernes.getUTCDate() + i * 7);
    const domingo = new Date(viernes);
    domingo.setUTCDate(viernes.getUTCDate() + 2);
    fines.push({ viernes, domingo });
  }
  return fines;
}

function fechaBonita(d) {
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}

function hora(iso) {
  // "2026-06-26T18:30:00" → "18:30"
  const m = String(iso).match(/T(\d{2}:\d{2})/);
  return m ? m[1] : '';
}

// ─── Amadeus ─────────────────────────────────────────────────────────────────
async function obtenerToken() {
  const id = process.env.AMADEUS_CLIENT_ID;
  const secret = process.env.AMADEUS_CLIENT_SECRET;
  if (!id || !secret) {
    console.log('Faltan AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET — no se puede consultar.');
    return null;
  }
  try {
    const res = await fetch(`https://${AMADEUS_HOST}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${encodeURIComponent(id)}&client_secret=${encodeURIComponent(secret)}`,
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) {
      console.log(`No se obtuvo token de Amadeus (HTTP ${res.status}): ${data.error_description || JSON.stringify(data)}`);
      return null;
    }
    return data.access_token;
  } catch (e) {
    console.log(`Error pidiendo token a Amadeus: ${e.message}`);
    return null;
  }
}

// Busca la oferta de ida y vuelta más barata para un finde concreto.
async function buscarMasBarato(token, salida, vuelta) {
  const params = new URLSearchParams({
    originLocationCode: ORIGIN,
    destinationLocationCode: DEST,
    departureDate: isoDate(salida),
    returnDate: isoDate(vuelta),
    adults: String(ADULTS),
    currencyCode: CURRENCY,
    max: String(MAX_OFFERS),
  });
  if (NONSTOP) params.set('nonStop', 'true');
  const url = `https://${AMADEUS_HOST}/v2/shopping/flight-offers?${params}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();
    if (!res.ok) {
      const det = data.errors ? data.errors.map((e) => e.detail || e.title).join('; ') : JSON.stringify(data);
      console.log(`  Amadeus HTTP ${res.status}: ${det}`);
      return null;
    }
    if (!data.data || data.data.length === 0) return null;
    const carriers = (data.dictionaries && data.dictionaries.carriers) || {};
    let mejor = null;
    for (const oferta of data.data) {
      const precio = parseFloat(oferta.price.grandTotal || oferta.price.total);
      if (!mejor || precio < mejor.precio) mejor = { precio, oferta, carriers };
    }
    return mejor;
  } catch (e) {
    console.log(`  Error consultando vuelos: ${e.message}`);
    return null;
  }
}

function detallesOferta(mejor) {
  const { oferta, carriers, precio } = mejor;
  const ida = oferta.itineraries[0].segments;
  const regreso = oferta.itineraries[1].segments;
  const code = oferta.validatingAirlineCodes && oferta.validatingAirlineCodes[0]
    ? oferta.validatingAirlineCodes[0]
    : ida[0].carrierCode;
  const aerolinea = carriers[code]
    ? carriers[code].replace(/\b\w/g, (c) => c.toUpperCase())
    : code;
  return {
    precio: Math.round(precio),
    moneda: oferta.price.currency || CURRENCY,
    aerolinea,
    idaSale: hora(ida[0].departure.at),
    idaLlega: hora(ida[ida.length - 1].arrival.at),
    vueltaSale: hora(regreso[0].departure.at),
    vueltaLlega: hora(regreso[regreso.length - 1].arrival.at),
  };
}

// ─── Telegram ────────────────────────────────────────────────────────────────
async function sendTelegram(text) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: text.slice(0, 4000), disable_web_page_preview: true }),
  });
  if (!res.ok) console.log(`  Telegram respondió ${res.status}: ${await res.text()}`);
  return res.ok;
}

function enlaceSkyscanner(salida, vuelta) {
  // Formato de fecha de Skyscanner: AAMMDD
  const yy = (d) => String(d.getUTCFullYear()).slice(2) + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0');
  return `https://www.skyscanner.es/transporte/vuelos/${ORIGIN.toLowerCase()}/${DEST.toLowerCase()}/${yy(salida)}/${yy(vuelta)}/`;
}

function construirMensaje(salida, vuelta, d, enlace) {
  return `✈️ Vuelo barato ${ORIGIN} → ${DEST}
📅 ${fechaBonita(salida)} → ${fechaBonita(vuelta)} (2 noches)
💶 ${d.precio} ${d.moneda} ida y vuelta · ${d.aerolinea}
🛫 Ida: ${d.idaSale} → ${d.idaLlega}
🛬 Vuelta: ${d.vueltaSale} → ${d.vueltaLlega}
🔗 ${enlace}`;
}

// ─── Programa principal ──────────────────────────────────────────────────────
async function main() {
  let estado = {};
  try { estado = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { /* primera ejecución */ }

  const token = await obtenerToken();
  if (!token) process.exit(0);   // sin token no hay nada que hacer; reintenta el próximo ciclo

  const fines = proximosFinesDeSemana(WEEKS_AHEAD);
  const vigentes = new Set(fines.map((f) => isoDate(f.viernes)));
  let avisos = 0;

  for (const { viernes, domingo } of fines) {
    const clave = isoDate(viernes);
    const mejor = await buscarMasBarato(token, viernes, domingo);
    if (!mejor) {
      console.log(`${clave}: sin ofertas directas.`);
      await new Promise((r) => setTimeout(r, 400));
      continue;
    }
    const d = detallesOferta(mejor);
    console.log(`${clave}: más barato ${d.precio} ${d.moneda} (${d.aerolinea})`);

    const previo = estado[clave];
    const esNuevoMinimo = !previo || d.precio <= previo.precio - DROP_NOTIFY;
    if (d.precio <= MAX_PRICE && esNuevoMinimo) {
      const enlace = enlaceSkyscanner(viernes, domingo);
      const ok = await sendTelegram(construirMensaje(viernes, domingo, d, enlace));
      console.log(`  ${ok ? 'Aviso enviado a Telegram' : 'ERROR Telegram'} (${d.precio} ${d.moneda})`);
      if (ok) { estado[clave] = { precio: d.precio, ts: Date.now() }; avisos++; }
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  // Limpia findes que ya pasaron para que el estado no crezca sin fin.
  for (const k of Object.keys(estado)) if (!vigentes.has(k)) delete estado[k];

  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(estado));
  console.log(`Hecho. ${avisos} aviso(s) en esta pasada.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
