# Vigilante de ofertas — Leo Visual (nube)

Revisa varias plataformas de ofertas cada ~10 minutos desde GitHub Actions y
envía cada oferta nueva a Telegram con una propuesta personalizada lista para
copiar y pegar. Funciona aunque el PC esté apagado.

Plataformas vigiladas:
- **Behance** — [Job Board](https://www.behance.net/joblist) (portada + 5 búsquedas).
- **We Work Remotely** — feed RSS de la categoría de diseño remoto.
- **Remote OK** — API JSON pública (se filtran por las mismas palabras clave).

## Cómo funciona
- `vigilante.js` — cada fuente aporta sus ofertas; el resto del flujo (filtros,
  propuesta, Telegram y memoria de vistas) es común. Compara con las ya vistas y
  envía las nuevas a Telegram. Si una IP del runner está bloqueada, pasa
  automáticamente por un proxy de lectura (allorigins, y jina para Behance).
- **Línea base por fuente:** cuando se añade una plataforma nueva, su primera
  pasada registra las ofertas actuales como vistas *sin avisar*; solo notifica
  las que aparezcan a partir de ese momento (así no llega una avalancha inicial).
- `.github/workflows/vigilante.yml` — lo ejecuta cada ~10 min. El estado
  (ofertas ya vistas) se conserva entre ejecuciones con actions/cache.
- Secretos del repositorio: `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`.

## Operación
- **Ver ejecuciones:** pestaña *Actions* del repositorio.
- **Lanzar a mano:** *Actions → Vigilante Behance → Run workflow*.
- **Pausarlo:** *Actions → Vigilante Behance → ⋯ → Disable workflow*.
- **Cambiar filtros/búsquedas:** edita las constantes al inicio de `vigilante.js`.
- **Añadir/quitar plataformas:** edita el array `SOURCES` en `vigilante.js`.
- **Reiniciar la memoria de ofertas vistas:** borra los caches en
  *Actions → Caches* (la siguiente ejecución registra línea base sin avisar).

## Notas
- GitHub no garantiza la puntualidad de los crons: el intervalo real suele ser
  de 10-20 minutos.
- Si el repositorio pasa 60 días sin actividad, GitHub pausa los crons; el
  trabajo `keepalive` hace un commit vacío semanal para evitarlo.
- El repositorio es público (los minutos de Actions son gratis e ilimitados en
  repos públicos); los secretos de Telegram NO son visibles.
