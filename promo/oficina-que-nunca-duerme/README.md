# La oficina que nunca duerme — spot de 62 s

Pieza promocional para LeoVisual.nl sobre un sistema de ocho agentes por departamento
para vendedores de Amazon. Se genera **íntegramente con código**: 3D en tiempo real
(three.js), tipografía en postproducción y diseño sonoro procedural. Sin voz en off,
sin metraje de stock y sin vídeo generado por IA.

## Entregables

| Archivo | Formato | Uso |
|---|---|---|
| `oficina-916.mp4` | 1080×1920, 30 fps, H.264 + AAC | Reels, TikTok, Shorts |
| `oficina-169.mp4` | 1920×1080, 30 fps, H.264 + AAC | Web, presentaciones |

La resolución es 1080p a propósito: Instagram limita la reproducción a 1080p, así que
renderizar en 4K solo aumentaría el peso del archivo.

## Estructura del guion (tiempos reales del render)

| Escena | Tiempo | Qué ocurre |
|---|---|---|
| 01 El impacto | 0:00–0:08 | Pulso ámbar → la chispa forma «VENDER» → estalla en partículas → tormenta de palabras alrededor de la figura → «SON OCHO.» |
| 02 El portal | 0:08–0:15 | Portátil sobre suelo mojado, apertura mecánica en dos tiempos, borde de luz, la pantalla se convierte en pasillo de marcos, la cámara entra |
| 03 Tú solo | 0:15–0:22 | Paneles que se multiplican (cada toque genera más), luz agresiva, retroceso que revela un muro de paneles |
| 04 La oficina | 0:22–0:38 | El edificio emerge, la cámara sube por la fachada, 8 plantas se encienden con 8 impactos, aparece el director y conecta todo, pulso final y medio segundo de silencio |
| 05 Las 07:00 | 0:38–0:48 | Se entra por una ventana al amanecer, panel PPC de una tienda ficticia con 3 asuntos, el usuario aprueba uno |
| 06 Es tuya | 0:48–0:55 | Llave metálica que se levanta y refleja el edificio, guía de instalación local |
| 07 La revelación | 0:55–1:02 | La habitación se disuelve hasta un punto de luz, frases finales, cierre de marca, la luz se apaga |

## Afirmaciones que hay que confirmar antes de publicar

Están marcadas con `claim: true` en `src/copy.js`. Solo pueden salir si describen el
producto real:

- «UN AGENTE POR DEPARTAMENTO.» / «SUS REGLAS. SUS CÁLCULOS.» / «UN DIRECTOR. TODO CONECTADO.»
- «TUS ANUNCIOS, REVISADOS.»
- «EN TU ORDENADOR.» / «SIN ACCESO A TU SELLER CENTRAL.» / «CON GUÍAS PARA EMPEZAR.»

**Posible contradicción:** si el sistema no accede a Seller Central, ¿de dónde saca los
datos de anuncios que revisa a las 07:00? (¿informes exportados?). Si un vendedor lo
pregunta y no hay respuesta clara, se pierde credibilidad. Conviene resolverlo en el
copy o en el mensaje privado.

El panel PPC muestra la etiqueta «Tienda demo · Datos ilustrativos» y no contiene cifras
de resultados.

## Cómo editar y volver a renderizar

Requisitos: Node 18+, ffmpeg y un Chromium (en Windows sirve Chrome instalado).

```bash
npm install
node audio/score.mjs                       # regenera la banda sonora (audio/score.wav)
node render.mjs --ar 916 --stills 4.5,28   # fotogramas sueltos para revisar (stills/)
node render.mjs --ar 916                   # vídeo vertical completo
node render.mjs --ar 169                   # versión horizontal
```

En Windows, indica la ruta de Chrome:
`set CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe`

- Textos: `src/copy.js`
- Escenas 3D y cámara: `src/scenes.js`
- Animación de textos e interfaces: `src/overlay.js`
- Estilo tipográfico y posiciones: `index.html`
- Sonido: `audio/score.mjs` (los tiempos están en segundos, alineados con el guion)

El render es determinista: cada fotograma depende solo del tiempo, así que se puede
renderizar en paralelo y repetir con el mismo resultado.

## Límites honestos de esta versión

- Es CGI estilizado, no fotorrealismo. Para planos realistas (manos, rostro, materiales
  físicos) habría que generar clips con herramientas de vídeo IA (Veo, Kling, Runway) y
  montarlos sobre esta misma estructura. La tipografía, el sonido y el ritmo ya sirven.
- «Una mano la recoge» (escena 6) se resuelve con la llave elevándose sola; no hay mano.
- El sonido es sintetizado. Una mezcla con música licenciada (por ejemplo Artlist) y un
  diseñador de sonido elevaría la pieza.
- Zonas seguras 9:16: los textos evitan el 14 % superior y el 35 % inferior, según las
  guías publicadas para Reels. Conviene comprobarlo en un móvil antes de publicar.
