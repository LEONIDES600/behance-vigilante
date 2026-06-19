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

## Vigilante de vuelos baratos (AMS → BCN, findes)

Además de Behance, el repo vigila **vuelos baratos de Ámsterdam a Barcelona**
para escapadas de fin de semana (viernes ida → domingo vuelta) y avisa por
Telegram cuando encuentra un billete de ida y vuelta por debajo del objetivo.

- `vuelos.js` — revisa los **próximos 8 fines de semana** y, para cada uno, busca
  el vuelo directo de ida y vuelta más barato. Si baja de **150 €** (por persona)
  envía un aviso a Telegram con horarios, aerolínea, precio y un enlace de
  Skyscanner. No repite el aviso de un mismo finde salvo que el precio baje ≥ 10 €.
- `.github/workflows/vuelos.yml` — cron **cada 6 h** (los precios no cambian al
  minuto y la cuota gratis de Amadeus es limitada). El estado (findes ya avisados)
  se conserva con actions/cache.
- Ajustes (origen, destino, precio objetivo, nº de findes, directo sí/no): edita
  las constantes al inicio de `vuelos.js`.

### Secretos de Amadeus (precios de vuelo)
Los precios vienen de la API gratuita Self-Service de Amadeus. Configúrala una vez:
1. Crea una cuenta en <https://developers.amadeus.com> (gratis).
2. *My Self-Service Workspace* → *Create new app*. Copia la **API Key** y el
   **API Secret**.
3. Importante: pulsa **Move to Production** en la app para obtener precios reales
   (el entorno de pruebas devuelve datos limitados y poco realistas). Las claves
   de producción aparecen en la misma app.
4. Repo → *Settings* → *Secrets and variables* → *Actions* → *New repository
   secret*. Crea dos: `AMADEUS_CLIENT_ID` (la API Key) y `AMADEUS_CLIENT_SECRET`
   (el API Secret).

Reutiliza los mismos `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` del vigilante de
Behance. Sin las claves de Amadeus, el workflow corre pero no consulta nada
(sale con código 0).

## Notas
- GitHub no garantiza la puntualidad de los crons: el intervalo real suele ser
  de 10-20 minutos.
- Si el repositorio pasa 60 días sin actividad, GitHub pausa los crons; el
  trabajo `keepalive` hace un commit vacío semanal para evitarlo.
- El repositorio es público (los minutos de Actions son gratis e ilimitados en
  repos públicos); los secretos de Telegram NO son visibles.
