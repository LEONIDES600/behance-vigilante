# Vigilante de ofertas de Behance — Leo Visual (nube)

Revisa el [Job Board de Behance](https://www.behance.net/joblist) cada ~3 minutos
desde GitHub Actions y envía cada oferta nueva a Telegram con una propuesta
personalizada lista para copiar y pegar. Funciona aunque el PC esté apagado.

## Cómo funciona
- `vigilante.js` — busca ofertas (portada + 5 búsquedas), compara con las ya
  vistas y envía las nuevas a Telegram. Si Behance bloquea la IP del runner,
  pasa automáticamente por proxies de lectura (allorigins → jina).
- `.github/workflows/vigilante.yml` — cada ejecución vigila en bucle ~5,5 h
  (revisa cada 3 min) y al terminar **se relanza a sí misma**, así la vigilancia
  es continua sin depender del cron de GitHub. Un cron cada 6 h queda como red de
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
- **Reiniciar la memoria de ofertas vistas:** borra los caches en
  *Actions → Caches* (la siguiente ejecución registra línea base sin avisar).

## Notas
- GitHub no garantiza la puntualidad de los crons: el intervalo real suele ser
  de 10-20 minutos.
- Si el repositorio pasa 60 días sin actividad, GitHub pausa los crons; el
  trabajo `keepalive` hace un commit vacío semanal para evitarlo.
- El repositorio es público (los minutos de Actions son gratis e ilimitados en
  repos públicos); los secretos de Telegram NO son visibles.

## HyperFrames (vídeo desde HTML)

Instalado aparte del vigilante, para producir vídeo (intros, clips promocionales,
motion graphics) escribiendo HTML y renderizando MP4.
[HyperFrames](https://github.com/heygen-com/hyperframes) es de HeyGen y es
open source.

Qué se instaló:
- Las 9 *skills core* en `.claude/skills/` (el router `/hyperframes`, las
  `hyperframes-*` y `media-use`), con `skills-lock.json` en la raíz. Cualquier
  agente de código (Claude Code, Cursor, Codex…) las carga solo.
- El CLI como dependencia de desarrollo: `hyperframes` en `package.json`.
- Una composición de prueba en `demo/hyperframes/`.

Requisitos: Node 22+, FFmpeg y el Chrome headless que instala el propio CLI.

Puesta en marcha en un PC nuevo (necesita Node 22+ y FFmpeg instalados):

```bash
npm run setup           # instala el CLI, descarga el Chrome headless y pasa `doctor`
npm run promo:preview   # abre el promo de Leo Visual en Studio (localhost)
npm run promo:check     # lint + runtime + layout + motion + contraste del promo
npm run promo:render    # renderiza videos/leo-visual-promo/renders/video.mp4
npm run hf:login        # (opcional) API key de HeyGen para voz y música
```

Bucle manual dentro de cualquier proyecto de vídeo (p. ej. `demo/hyperframes/`):

```bash
npx hyperframes check                         # lint + runtime + layout + contraste
npx hyperframes preview                       # previsualizar en el navegador
npx hyperframes render                        # renderizar a renders/*.mp4
```

Proyectos de vídeo: `demo/hyperframes/` (prueba mínima) y `videos/leo-visual-promo/`
(promo de 20 s hecho con la workflow `/product-launch-video`: `BRIEF.md` → `STORYBOARD.md`
→ `frame.md` → `compositions/frames/*.html`).

Prueba realizada: `demo/hyperframes/index.html` → `check` sin hallazgos y render
de 7 s a 1920x1080 / 30 fps en ~30 s. Los MP4 van a `demo/hyperframes/renders/`,
que está en `.gitignore`.

GSAP se sirve desde `demo/hyperframes/vendor/gsap.min.js` en vez del CDN: el
navegador de render no siempre tiene salida a jsDelivr y así el render funciona
sin red. Se copia de `node_modules/gsap/dist/gsap.min.js`.

Para pedir un vídeo a un agente, basta con: *«Usando `/hyperframes`, hazme una
intro de 10 s con…»*.
