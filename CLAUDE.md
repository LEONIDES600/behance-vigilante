# CLAUDE.md

Guía para asistentes de IA que trabajen en este repositorio. Lee esto antes de
hacer cambios.

## Qué es este proyecto

**Vigilante de ofertas** para Leo Visual. Un único script de Node.js que corre en
GitHub Actions de forma continua (en bucle, con auto-encadenado): revisa cada
~3 minutos varias plataformas de ofertas —el
[Job Board de Behance](https://www.behance.net/joblist), el RSS de diseño de
[We Work Remotely](https://weworkremotely.com/) y la API de
[Remote OK](https://remoteok.com/)—, detecta ofertas nuevas, las filtra por
relevancia (diseño/branding/social/motion/vídeo publicitario) y envía cada una a
Telegram con una propuesta personalizada lista para copiar y pegar. Funciona en
la nube, aunque el PC del usuario esté apagado.

No es una aplicación con servidor ni dependencias npm: es un script de un solo
archivo ejecutado por un cron de Actions.

## Estructura

```
vigilante.js                      Toda la lógica (fuentes, filtros, propuesta, Telegram, estado)
.github/workflows/vigilante.yml   Cron horario + bucle de ~5,5 h + keepalive semanal
README.md                         Documentación de operación (en español)
estado/seen.json                  Estado en runtime: IDs de ofertas ya vistas (NO en git;
                                  lo crea el script y lo persiste actions/cache)
```

No hay `package.json`, `node_modules`, build, tests ni linter. El script usa solo
módulos nativos de Node (`fs`, `path`) y el `fetch` global (requiere Node 18+; el
workflow fija Node 20).

## Cómo funciona `vigilante.js` (flujo de `main()`)

1. `loadState()` carga `estado/seen.json`. Si no existe, es la **primera
   ejecución** (`firstRun`): se registra una línea base sin enviar ningún aviso.
2. Recorre el array `SOURCES`. Cada fuente es autónoma: su `fetch()` devuelve
   `{ jobs, via, fails }` y un fallo suyo no tumba a las demás (se captura y se
   sigue con la siguiente).
3. Todas las ofertas se juntan en un `Map` por `id` (con prefijo de fuente, ver
   abajo).
4. Las ofertas cuyo ID no está en `seen` son nuevas **si su fuente ya está
   inicializada** (línea base por fuente, ver abajo). Para cada una:
   - Se marca como vista *antes* de filtrarla (si no, cada pasada volvería a
     analizarla y a abrir su página en Behance).
   - Si trae `enrich: true` (solo Behance), `enrichBehance` abre la página de la
     oferta y extrae `title`, `description`, `budget` del JSON embebido.
   - `passesFilters` descarta si contiene una palabra de `EXCLUDE` o si no
     contiene ninguna de `INCLUDE` (coincidencia por **palabra completa**).
   - `buildProposal` arma el mensaje de propuesta; `sendTelegram` lo envía con la
     etiqueta de la plataforma (`🔔 Nueva oferta en Remote OK (REMOTE)`).
5. `saveState()` guarda los IDs vistos (recortados a `MAX_SEEN = 3000`) y las
   fuentes ya inicializadas.

### Arquitectura de fuentes (`SOURCES`)

Añadir una plataforma = añadir una entrada a `SOURCES` con una función `fetch()`
que devuelva `{ jobs, via, fails }`. Cada oferta debe traer, como mínimo:
`id`, `sourceKey`, `source`, `type`, `title`, `url` (y opcionalmente
`description`, `budget`, `enrich`). El resto del flujo —filtros, propuesta,
Telegram, memoria de vistas— es común y no hay que tocarlo.

Fuentes actuales:

| Clave | Plataforma | Origen | Notas |
|---|---|---|---|
| `behance` | Behance | HTML del joblist (regex sobre `/joblist/{tipo}/{id}/{slug}`) | Recorre `SEARCHES`; enriquece cada oferta abriendo su página (`enrich: true`) |
| `wwr` | We Work Remotely | RSS de `remote-design-jobs` | Título original `"Empresa: Puesto"` → `"Empresa — Puesto"` |
| `remoteok` | Remote OK | API JSON pública | El primer elemento del array es un aviso legal: se ignora (no tiene `position`) |

**IDs con prefijo:** `behance:<id>`, `wwr:<slug>`, `rok:<id>`. Así dos plataformas
nunca colisionan. Si añades una fuente, usa un prefijo propio.

**Estado v2 y compatibilidad:** `seen.json` es
`{ v: 2, seen: [ids], initialized: [claves de fuente] }`. Si se encuentra el
formato antiguo (un array pelado), se interpreta como IDs de Behance y se
normalizan a `behance:<id>`, marcando `behance` como ya inicializada. No rompas
esta compatibilidad sin migrar el cache.

**Línea base por fuente:** una fuente que no esté en `initialized` registra sus
ofertas actuales como vistas **sin avisar**. Así, añadir una plataforma no
provoca una avalancha de decenas de mensajes en Telegram.

### Resiliencia de red (importante)

Behance suele bloquear la IP de los runners de Actions. `fetchVia(url, attempts)`
prueba los intentos en orden hasta que uno valide: para Behance, **directo →
allorigins → jina**; para WWR y Remote OK, **directo → allorigins**. Cada intento
lleva su propio `validate(body)` (que haya `/joblist/`, `<item>` o que el JSON
empiece por `[`) para no dar por buena una página de error. Si **todas** las
fuentes fallan, el ciclo no envía nada y se reintenta en la próxima pasada (sale
con código 0 para no marcar el run como fallido). Si tocas el fetching, mantén
esta cadena de respaldo.

## Configuración (todo al inicio de `vigilante.js`)

- `SOURCES` — plataformas vigiladas (añadir/quitar aquí).
- `SEARCHES` — términos de búsqueda de Behance (`''` = portada del joblist).
- `INCLUDE` / `EXCLUDE` — palabras clave para el filtro de relevancia, comunes a
  todas las fuentes. `EXCLUDE` incluye los términos de contenido adulto, que se
  filtran siempre.
- `GATE_TITLES` — títulos que en realidad son el muro de aviso de Behance
  ("Adult content", "Content warning"…) y no la oferta real. Si `enrichBehance`
  detecta uno, marca `job.gated` y conserva el título derivado del slug en vez
  de sustituirlo por el del muro.
- `hasKeyword` — la comparación es **por palabra completa** (`\bpalabra\b`), para
  que `ai` no salte dentro de "email"/"available" ni `content` dentro de
  "Adult content". No lo cambies por `includes()`.
- `TOPIC_LINES` — frases que se inyectan en la propuesta según el tema detectado
  (YouTube, social, logo/brand, motion, publicidad/UGC/Amazon, AI). Máximo 2.
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

- **Bucle largo**: cada ejecución revisa todas las fuentes en bucle durante ~5,5 h
  (cada 3 min), con `timeout-minutes: 345`. Así una sola ejecución cubre casi todo
  el día.
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
  están en inglés a propósito, porque las ofertas son internacionales.)
- Un solo archivo, sin dependencias externas: mantén el script autocontenido y sin
  añadir paquetes npm salvo necesidad real.
- Sin secretos en el código. Sin romper la cadena de proxies. Salir con código 0
  cuando no hay datos (no marcar fallo por bloqueos de red).
- Una fuente que falle no debe tumbar a las demás: su error se captura y se sigue.
- Estilo: Node moderno (`async/await`, `const`, template strings), funciones
  pequeñas y de un propósito.

## Flujo de desarrollo

No hay build ni tests. Para validar cambios:

```bash
# Ejecución local (necesita Node 18+ y los secretos en el entorno)
TELEGRAM_BOT_TOKEN=xxx TELEGRAM_CHAT_ID=yyy node vigilante.js
```

- Comprobación de sintaxis rápida: `node --check vigilante.js`.
- La primera ejecución local crea `estado/seen.json` como línea base y no envía
  nada. Bórralo para volver a probar desde cero. Si añades una fuente, basta con
  quitar su clave de `initialized` en `seen.json` para volver a "estrenarla".
- Para probar sin enviar a Telegram, puedes comentar la llamada a `sendTelegram`
  o revisar la lógica con logs.
- En la nube: *Actions → Vigilante Behance → Run workflow* para lanzar a mano y
  ver los logs.

## Git

- Rama de trabajo activa: `claude/job-offers-additional-platforms-r3wtjt`.
  Desarrolla y haz push ahí; no empujes a `main` sin permiso explícito.
- **No** crees pull requests salvo que el usuario lo pida.
- No commitees `estado/seen.json` (es estado de runtime; se gestiona vía cache).
- Mensajes de commit en español, claros y descriptivos.
