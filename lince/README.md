# LINCE NEXUS — Creative Intelligence Engine

Bot de investigación continua de LeoVisual.nl. Corre en GitHub Actions cada
2 horas, 24/7, aunque el PC esté apagado. Busca tecnologías, repositorios,
modelos y papers para fashion cinematic 3D, vídeo generativo, webs inmersivas,
reconstrucción 3D y pipelines; los puntúa sobre 100, los guarda en una base de
conocimiento y te avisa por Telegram de lo que merece la pena.

## Qué hace en cada ciclo

1. **Cola priorizada**: elige 8 búsquedas de las 36 de `COLA` (áreas A–E). Primero
   las que nunca se han hecho; luego las que más hallazgos buenos dan y las más
   antiguas. No repite una búsqueda antes de 3 días.
2. **Fuentes con API oficial y pública**: GitHub (repos activos en los últimos
   120 días), arXiv (papers de cs.CV/cs.GR/cs.MM de los últimos 60 días) y
   Hugging Face (modelos actualizados en los últimos 180 días). Sin scraping,
   sin saltarse bloqueos.
3. **Puntuación /100** con la rúbrica del prompt (calidad 25, utilidad 20,
   viabilidad 15, licencia 15, coste 10, mantenimiento 10, originalidad 5) y
   **bloqueos**: sin licencia, licencia no comercial o repo archivado ⇒
   "Bloqueado para producción" aunque puntúe alto.
4. **Evaluación con Claude (opcional)**: si existe el secreto `ANTHROPIC_API_KEY`,
   los hallazgos ≥55 sin bloqueos (máx. 4 por ciclo) los evalúa Claude: madurez
   (disponible / experimental / prototipo / anunciado / especulativo), aplicación
   en LeoVisual, qué sustituiría, riesgos, hardware y siguiente acción.
5. **Memoria**: `conocimiento/kb.json` (fuente de verdad) y
   `conocimiento/CATALOGO.md` (legible). Se guardan con commit en el repo: cada
   cambio queda en el historial de git.
6. **Avisos**: Telegram para hallazgos ≥70 sin bloqueos (máx. 5 por ciclo). La
   primera ejecución solo crea la línea base y manda un mensaje de activación.
7. **Informe de Innovación semanal** en `informes/AAAA-MM-DD.md` con las 10
   secciones del prompt, más un resumen por Telegram.

## Límites honestos (por diseño)

- **No instala ni ejecuta código de terceros.** Solo lee metadatos públicos. Las
  pruebas (estados C, D, E) las haces tú en un entorno aislado; LINCE solo asigna
  A (referencia), B (candidato a prueba) o F (descartado).
- **Sin `ANTHROPIC_API_KEY` la puntuación es heurística**: sirve para ordenar la
  cola, no para decidir. No ve imágenes ni vídeos: las referencias visuales las
  revisas tú desde las demos enlazadas.
- No sigue redes sociales, Behance, Vimeo ni portfolios de estudios (sin API
  oficial adecuada). Se puede ampliar con RSS de publicaciones si te interesa.

## Puesta en marcha

1. Fusiona esta rama en `main` (los crons de GitHub solo corren desde la rama por
   defecto).
2. Reutiliza los secretos que ya tienes: `TELEGRAM_BOT_TOKEN` y
   `TELEGRAM_CHAT_ID`. Opcional: `LINCE_TELEGRAM_CHAT_ID` para recibir LINCE en
   otro chat/grupo distinto del de ofertas.
3. Opcional — evaluación con IA: *Settings → Secrets and variables → Actions →
   New repository secret* → `ANTHROPIC_API_KEY` (clave de console.anthropic.com).
4. Prueba manual: *Actions → LINCE NEXUS → Run workflow*. Marca "Generar el
   Informe de Innovación ahora" si quieres el informe al momento (tiene sentido a
   partir del segundo ciclo).

### Coste de la IA (estimación, no medida)

Por defecto usa `claude-opus-5-5` (4 $/M tokens de entrada, 20 $/M de salida)
con esfuerzo bajo. Supuesto: ~1.500 tokens de entrada y ~800 de salida por
evaluación ⇒ ~0,02 $ cada una. Con 4 por ciclo y 12 ciclos/día el **techo** es
~1 $/día (~30 $/mes); en la práctica menos, porque muchos ciclos no tienen 4
hallazgos nuevos ≥55. Para abaratarlo, en *Settings → Secrets and variables →
Actions → Variables*:

- `LINCE_MODEL` = `claude-haiku-5-5` (≈40 veces más barato, juicio menos fino).
- `LINCE_MAX_IA` = número de evaluaciones por ciclo (`0` desactiva la IA).

Comprueba el gasto real en console.anthropic.com tras la primera semana.

## Cómo registrar tus pruebas

Edita `conocimiento/kb.json`, busca el registro (por ejemplo `gh:owner/repo`) y
cambia `estado` a `C`, `D` o `E`, añadiendo un campo `resultados` con lo que
viste. LINCE conserva esos campos en los ciclos siguientes.

## Ajustes (al inicio de `lince-nexus.js`)

- `COLA` — búsquedas por área (`g` GitHub, `a` arXiv, `h` Hugging Face).
- `AREAS` — áreas y peso comercial para LeoVisual.
- `MIN_AVISO`, `MAX_AVISOS_CICLO`, `BUSQUEDAS_POR_CICLO`, `DIAS_REPETIR`.

## Arquitectura de agentes (área F)

El prompt pide agentes especializados; para no crear complejidad sin ROI, hoy
son **módulos de un solo script**, cada uno con misión, entrada y salida:

| Agente | Módulo | Entrada → salida |
|---|---|---|
| Planificador | `eligeBusquedas` | cola + rendimiento histórico → búsquedas del ciclo |
| Investigador GitHub / papers / modelos | `buscaGitHub`, `buscaArxiv`, `buscaHF` | consulta → metadatos |
| Analista de licencias y seguridad | `evaluaLicencia` + bloqueos | licencia/estado → bloqueos |
| Evaluador | `puntuar` (+ `evaluaConIA`) | metadatos → puntuación /100 y madurez |
| Documentalista | `fusiona`, `generaCatalogo`, `generaInforme` | hallazgos → kb.json, catálogo, informe |

Siguiente agente a añadir **solo si se demuestra útil**: un "director creativo"
que convierta los candidatos B del informe en propuestas de experimento
concretas para clientes de LeoVisual.

## Sobre "scroll argentino cuántico"

Se trata como denominación creativa, no como tecnología establecida. La búsqueda
`B-scroll-argentino` investiga lo que podría representar técnicamente: scroll
suave + transiciones WebGL/shaders + estados que "colapsan" entre escenas al
desplazarse (GSAP ScrollTrigger + Three.js/R3F, con WebGPU donde sea viable).
