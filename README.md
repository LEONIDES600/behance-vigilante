# Vigilante de ofertas — Leo Visual (nube)

Revisa Behance cada ~1 minuto desde GitHub Actions (We Work Remotely y Remote OK,
cada ~5 min), puntúa si cada oferta nueva encaja con los servicios de Leo y la
envía a Telegram con una propuesta honesta lista para copiar. Funciona aunque el
PC esté apagado.

## Novedades de la v3 (31/10/2026)
- **Detección al momento con la «sonda de IDs»:** desde GitHub, Behance bloquea las
  listas (/joblist) y los proxies fallan a menudo, pero las fichas de oferta se
  leen directas. Los IDs son impares y crecientes, y un ID que no existe redirige.
  Cada pasada (cada 60 s) prueba los IDs justo por delante del último visto, un
  trozo de una ventana más lejana y unos pocos huecos por detrás. Una oferta
  nueva llega a Telegram en 1–2 minutos, sin depender de proxies.
- Las listas ordenadas por «lo más reciente» (`sort=recent`) siguen como
  respaldo por proxy cada 5 pasadas (con su propia pausa si fallan); sirven
  para resincronizar la sonda. Antes se miraba la primera página de 10 búsquedas
  en orden «recomendado», y una oferta nueva podía tardar horas o no salir.
- **Datos completos:** lee el estado JSON que Behance incrusta en la página
  (presupuesto, remoto/presencial, empresa, contacto) y en la ficha
  (descripción, solicitantes, días hasta el cierre, si se solicita fuera).
- **Encaje con tus servicios:** 🔥 ENCAJA · ✅ PUEDE ENCAJAR · ⚪ POCO ENCAJE ·
  ⛔ NO ENCAJA (joyería, arquitectura/CAD, moda, presencial, ≤100 USD…). Las de
  poco o ningún encaje llegan **en silencio** (sin sonido). Solo las 🔥 y ✅ van a
  la cola de Claude.
- **Propuesta honesta** en el idioma de la oferta (español o inglés), con trabajos
  reales del portfolio; ya no dice «exactamente lo que hago».
- **Proxy que aprende:** prueba primero el que funcionó la última vez; añadido
  corsproxy.io y jina en modo HTML.
- **Salud:** cada 30 min publica `estado.json` en la rama `cola` (última pasada
  con datos, proxy, contadores del día). Aviso de «vigilante ciego» a los 30 min.
- **Diagnóstico:** *Actions → Diagnóstico de proxies → Run workflow* prueba cada
  proxy desde un runner real y deja el resultado en `cola/diagnostico.json`.

Plataformas vigiladas:
- **Behance** — [Job Board](https://www.behance.net/joblist) (portada + 9 búsquedas).
- **We Work Remotely** — feed RSS de la categoría de diseño remoto.
- **Remote OK** — API JSON pública.

## Cómo funciona
- `vigilante.js` — cada fuente del array `SOURCES` aporta sus ofertas; el resto
  del flujo (filtros, propuesta, Telegram y memoria de vistas) es común. Compara
  con las ya vistas y envía las nuevas a Telegram. Si una fuente bloquea la IP
  del runner, pasa automáticamente por proxies de lectura de respaldo (para
  Behance: codetabs → allorigins → corsproxy → jina).
- **Aviso si se queda ciego:** si durante más de 1 hora *ninguna* plataforma
  responde, te manda un aviso a Telegram (una sola vez) y otro cuando se
  recupera. Así te enteras si el vigilante se rompe, en vez de pensar que
  simplemente no hay ofertas.
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
- Secretos del repositorio: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`,
  `DISPATCH_PAT` (token personal para el auto-encadenado; ver más abajo) y
  `CLAUDE_ROUTINE_TOKEN` (revisión automática; ver más abajo).
- **Revisión automática (desde el 31/10/2026):** cada oferta nueva de **Behance**
  que pasa los filtros se añade a `ofertas.json` en la rama **`cola`** (con el
  token propio del workflow, sin claves extra). La tarea de Claude «Respuesta a
  ofertas del bot Behance» lee esa cola **cada hora (08:23–23:23, hora de
  Ámsterdam)**, abre cada oferta en el navegador del ordenador de Leo, decide si
  encaja con sus servicios, solicita los empleos que encajan y, en los
  freelance, prepara la propuesta y pregunta el precio a Leo. El mensaje de
  Telegram lo indica («🤖 En cola»). Opcional: con el secreto
  `CLAUDE_ROUTINE_TOKEN`, además se lanza la tarea al instante (máximo 20 por hora).

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

## El secreto `CLAUDE_ROUTINE_TOKEN` (opcional: revisión al instante)
1. claude.ai/code/routines → abre «Respuesta a ofertas del bot Behance» →
   *Add another trigger* → **API** → *Generate token*. Cópialo (solo se ve una vez).
2. Repo → *Settings* → *Secrets and variables* → *Actions* → *New repository
   secret*. Nombre: `CLAUDE_ROUTINE_TOKEN`. Valor: el token. Guardar.
3. Si alguna vez generas un token nuevo, el anterior deja de valer: actualiza el secreto.

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
