# CLAUDE.md

Guía para asistentes de IA que trabajen en este repositorio. Lee esto antes de
hacer cambios.

## Qué es este proyecto

**Vigilante de ofertas de Behance** para Leo Visual. Un único script de Node.js
que corre en GitHub Actions de forma continua (en bucle, con auto-encadenado):
revisa cada ~3 minutos el
[Job Board de Behance](https://www.behance.net/joblist), detecta ofertas nuevas,
las filtra por relevancia (diseño/branding/social/motion/AI) y envía cada una a
Telegram con una propuesta personalizada lista para copiar y pegar. Funciona en
la nube, aunque el PC del usuario esté apagado.

No es una aplicación con servidor ni dependencias npm: es un script de un solo
archivo ejecutado por un cron de Actions.

## Estructura

```
vigilante.js                      Toda la lógica (scraping, filtros, propuesta, Telegram, estado)
.github/workflows/vigilante.yml   Cron de Actions (cada ~10 min) + keepalive semanal
vuelos.js                         Vigilante de vuelos baratos AMS→BCN de finde (Amadeus + Telegram)
.github/workflows/vuelos.yml      Cron de Actions cada 6 h para vuelos.js
README.md                         Documentación de operación (en español)
estado/seen.json                  Estado en runtime: IDs de ofertas ya vistas (NO en git;
                                  lo crea el script y lo persiste actions/cache)
estado/vuelos.json                Estado en runtime: findes ya avisados (NO en git; vía cache)
```

> Nota: además del vigilante de Behance, el repo incluye un **vigilante de vuelos
> baratos** (`vuelos.js`) que revisa los próximos 8 fines de semana (viernes ida →
> domingo vuelta) AMS→BCN vía la API gratuita de Amadeus y avisa por Telegram
> cuando un billete de ida y vuelta baja del objetivo (150 €). Config al inicio del
> archivo. Secretos: `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET` (+ los de Telegram).

No hay `package.json`, `node_modules`, build, tests ni linter. El script usa solo
módulos nativos de Node (`fs`, `path`) y el `fetch` global (requiere Node 18+; el
workflow fija Node 20).

## Cómo funciona `vigilante.js` (flujo de `main()`)

1. Carga `estado/seen.json` en un `Set`. Si no existe, es la **primera ejecución**
   (`firstRun`): se registra una línea base sin enviar ningún aviso.
2. Recorre `SEARCHES` (portada + 5 términos) y descarga cada página del joblist
   vía `fetchPage`.
3. `extractJobs` saca los IDs/slugs de las ofertas del HTML con una regex sobre
   las URLs `/joblist/{type}/{id}/{slug}`.
4. Las ofertas cuyo ID no está en `seen` son nuevas. Para cada una:
   - `enrichJob` abre la página de la oferta y extrae `title`, `description`,
     `budget` desde el JSON embebido en el HTML.
   - `passesFilters` descarta si contiene una palabra de `EXCLUDE` o si no
     contiene ninguna de `INCLUDE`.
   - `buildProposal` arma el mensaje de propuesta; `sendTelegram` lo envía.
5. Guarda los IDs vistos (recortados a `MAX_SEEN = 3000`) en `estado/seen.json`.

### Resiliencia de red (importante)

Behance suele bloquear la IP de los runners de Actions. `fetchPage` intenta en
orden: **directo → allorigins → jina** (proxies de lectura). Si todos fallan, el
ciclo no envía nada y se reintenta en la próxima ejecución (sale con código 0
para no marcar el run como fallido). Si tocas el fetching, mantén esta cadena de
respaldo.

## Configuración (todo al inicio de `vigilante.js`)

- `SEARCHES` — términos de búsqueda (`''` = portada del joblist).
- `INCLUDE` / `EXCLUDE` — palabras clave para el filtro de relevancia.
- `TOPIC_LINES` — frases que se inyectan en la propuesta según el tema detectado
  (YouTube, social, logo/brand, motion, AI). Se incluyen máximo 2.
- `buildProposal` — plantilla de la propuesta (datos personales y enlaces de Leo
  Visual). Cámbiala aquí si cambian portfolio, redes o el texto.
- `MAX_SEEN` — cuántos IDs recordar.

Ajustar filtros, búsquedas o el texto de la propuesta = editar estas constantes;
no hace falta tocar la lógica.

## Secretos y entorno

- `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` se leen de `process.env` y se inyectan
  desde los **Secretos del repositorio** en el workflow. Nunca los pongas en el
  código ni en commits.
- `DISPATCH_PAT` (secreto del repo): token personal usado **solo en el workflow**
  para que la vigilancia se auto-encadene (ver abajo). Si no existe, el workflow
  sigue funcionando pero depende del cron de respaldo. Permiso necesario: Actions
  read/write sobre este repo (fine-grained) o scopes `repo`+`workflow` (clásico).
- El estado (`estado/`) se persiste entre runs con `actions/cache` (no con commits).

## Workflow de Actions (`vigilante.yml`)

La vigilancia es **continua**. Mecanismo principal = cron horario + bucle largo;
el auto-encadenado es una mejora opcional:

- **Bucle largo**: cada ejecución revisa Behance en bucle durante ~5,5 h (cada
  3 min), con `timeout-minutes: 345`. Así una sola ejecución cubre casi todo el día.
- `schedule: '7 * * * *'` (cada hora) = **mecanismo principal** que arranca la
  vigilancia. Con el bucle de 5,5 h + `concurrency` (una pendiente), el relevo entre
  ciclos es continuo, sin huecos. + `workflow_dispatch` (lanzar a mano).
  - Nota histórica: el `*/10` original no se disparaba en repo recién creado; tras
    actividad de commits el planificador empezó a disparar el cron con normalidad.
- **Auto-encadenado (opcional)**: si existe el secreto `DISPATCH_PAT`, el paso final
  (tras guardar el estado) relanza el workflow vía API, quedando 100% independiente
  del cron. Se usa un PAT porque el `GITHUB_TOKEN` por defecto **no** puede disparar
  workflows. Si el secreto falta, el paso no hace nada y manda el cron horario.
- `concurrency: vigilante` con `cancel-in-progress: false`: nunca hay dos runs a la
  vez; un run encadenado/cron queda pendiente hasta que termina el actual.
- Restaura/guarda el cache `seen-*` (carpeta `estado`) antes y después del bucle.
  El reencadenado va **después** de guardar, para que el siguiente run parta de los
  IDs ya vistos y no duplique avisos.
- Job `keepalive`: commit vacío semanal para que GitHub no pause el cron de respaldo
  por inactividad (se pausa tras 60 días sin actividad en el repo).
- `permissions: contents: write` (necesario para el push del keepalive).
- Minutos de Actions: el repo es **público**, así que correr ~24/7 es gratis.

## Convenciones

- **Idioma: español.** Comentarios, logs de consola, README, mensajes de commit y
  texto de operación van en español. (Las propuestas a clientes en `buildProposal`
  están en inglés a propósito, porque las ofertas de Behance son internacionales.)
- Un solo archivo, sin dependencias externas: mantén el script autocontenido y sin
  añadir paquetes npm salvo necesidad real.
- Sin secretos en el código. Sin romper la cadena de proxies. Salir con código 0
  cuando no hay datos (no marcar fallo por bloqueos de red).
- Estilo: Node moderno (`async/await`, `const`, template strings), funciones
  pequeñas y de un propósito.

## Flujo de desarrollo

No hay build ni tests. Para validar cambios:

```bash
# Ejecución local (necesita Node 18+ y los secretos en el entorno)
TELEGRAM_BOT_TOKEN=xxx TELEGRAM_CHAT_ID=yyy node vigilante.js
```

- La primera ejecución local crea `estado/seen.json` como línea base y no envía
  nada. Bórralo para volver a probar desde cero.
- Para probar sin enviar a Telegram, puedes comentar la llamada a `sendTelegram`
  o revisar la lógica con logs.
- En la nube: *Actions → Vigilante Behance → Run workflow* para lanzar a mano y
  ver los logs.

## Git

- Rama de trabajo activa: `claude/claude-md-docs-zqffz6`. Desarrolla y haz push
  ahí; no empujes a `main` sin permiso explícito.
- **No** crees pull requests salvo que el usuario lo pida.
- No commitees `estado/seen.json` (es estado de runtime; se gestiona vía cache).
- Mensajes de commit en español, claros y descriptivos.
