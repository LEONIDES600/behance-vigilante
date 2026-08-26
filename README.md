# Vigilante de ofertas — Leo Visual (nube)

Revisa varias plataformas de ofertas cada ~3 minutos desde GitHub Actions y envía
cada oferta nueva a Telegram con una propuesta personalizada lista para copiar y
pegar. Funciona aunque el PC esté apagado.

Plataformas vigiladas:
- **Behance** — [Job Board](https://www.behance.net/joblist) (portada + 9 búsquedas).
- **We Work Remotely** — feed RSS de la categoría de diseño remoto.
- **Remote OK** — API JSON pública.

## Cómo funciona
- `vigilante.js` — cada fuente del array `SOURCES` aporta sus ofertas; el resto
  del flujo (filtros, propuesta, Telegram y memoria de vistas) es común. Compara
  con las ya vistas y envía las nuevas a Telegram. Si una fuente bloquea la IP
  del runner, pasa automáticamente por un proxy de lectura (allorigins, y además
  jina para Behance).
- **Filtros de relevancia:** solo avisa de ofertas de diseño/branding/social/
  motion/vídeo publicitario, y descarta contenido para adultos. La coincidencia
  es por palabra completa, así que "ai" no salta dentro de "email".
- **Línea base por fuente:** cuando se añade una plataforma nueva, su primera
  pasada registra las ofertas actuales como vistas *sin avisar*; solo notifica
  las que aparezcan a partir de ese momento (así no llega una avalancha inicial).
- `.github/workflows/vigilante.yml` — cada ejecución vigila en bucle ~5,5 h
  (revisa cada 3 min) y al terminar **se relanza a sí misma**, así la vigilancia
  es continua sin depender del cron de GitHub. El cron horario queda como red de
  seguridad. El estado (ofertas ya vistas) se conserva con actions/cache.
- Secretos del repositorio: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` y
  `DISPATCH_PAT` (token personal para el auto-encadenado; ver más abajo).

## El secreto `DISPATCH_PAT` (auto-encadenado)
Para que el vigilante se relance solo sin depender del cron, necesita un token
personal con permiso para disparar el workflow:
1. GitHub → *Settings* (de tu cuenta) → *Developer settings* → *Personal access
   tokens* → *Fine-grained tokens* → *Generate new token*.
2. *Resource owner*: tu cuenta. *Repository access*: solo `behance-vigilante`.
3. *Permissions* → *Repository permissions* → **Actions: Read and write**.
4. Genera y copia el token.
5. Repo → *Settings* → *Secrets and variables* → *Actions* → *New repository
   secret*. Nombre: `DISPATCH_PAT`. Valor: el token. Guardar.

Sin este secreto el vigilante sigue funcionando, pero depende del cron de respaldo.

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
