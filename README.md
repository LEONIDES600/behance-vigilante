# Vigilante de ofertas de Behance — Leo Visual (nube)

Revisa el [Job Board de Behance](https://www.behance.net/joblist) cada ~10 minutos
desde GitHub Actions y envía cada oferta nueva a Telegram con una propuesta
personalizada lista para copiar y pegar. Funciona aunque el PC esté apagado.

## Cómo funciona
- `vigilante.js` — busca ofertas (portada + 5 búsquedas), compara con las ya
  vistas y envía las nuevas a Telegram. Si Behance bloquea la IP del runner,
  pasa automáticamente por proxies de lectura (allorigins → jina).
- `.github/workflows/vigilante.yml` — lo ejecuta cada ~10 min. El estado
  (ofertas ya vistas) se conserva entre ejecuciones con actions/cache.
- Secretos del repositorio: `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`.

## Operación
- **Ver ejecuciones:** pestaña *Actions* del repositorio.
- **Lanzar a mano:** *Actions → Vigilante Behance → Run workflow*.
- **Pausarlo:** *Actions → Vigilante Behance → ⋯ → Disable workflow*.
- **Cambiar filtros/búsquedas:** edita las constantes al inicio de `vigilante.js`.
- **Reiniciar la memoria de ofertas vistas:** borra los caches en
  *Actions → Caches* (la siguiente ejecución registra línea base sin avisar).

## Notas
- GitHub no garantiza la puntualidad de los crons: el intervalo real suele ser
  de 10-20 minutos.
- Si el repositorio pasa 60 días sin actividad, GitHub pausa los crons; el
  trabajo `keepalive` hace un commit vacío semanal para evitarlo.
- El repositorio es público (los minutos de Actions son gratis e ilimitados en
  repos públicos); los secretos de Telegram NO son visibles.
