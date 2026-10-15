# Vídeo de venta · Oficina de agentes de IA (animático 9:16, 90 s)

Carpeta autocontenida con el guion, el animático por código (three.js r186 +
GSAP 3.13) y las herramientas para renderizarlo a MP4. No tiene nada que ver con
el vigilante; vive aquí porque es la rama de trabajo de esta sesión.

```
guion.md                  Guion completo por bloques: escena, texto en pantalla, voz, edición
guion-voz.json            Solo el texto de la locución (208 palabras)
tiempos.json              Línea de tiempo: inicio y duración de cada bloque (fuente de verdad)
index.html                Animático interactivo 9:16 (reproducir / arrastrar) y modo #render
audio/musica.mp3          Colchón musical placeholder generado por código (sustituir por Artlist)
audio/b1..b6.mp3          Locución sintética (TopView, voz "Enrique M. Nieto"); ver abajo
render/rv.js              Playwright: index.html#render → fotogramas JPG 1080×1920
render/musica.js          Generador del colchón musical (WAV)
render/montar.sh          ffmpeg: fotogramas + voz + música → MP4
```

## Ver el animático

Abrir `index.html` servido por http (no como `file://`, porque carga three.js y
GSAP desde jsDelivr y las fuentes desde Google Fonts):

```bash
cd oficina-ia-video && npx serve .
```

Toca «Reproducir». Barra inferior para arrastrar por la línea de tiempo. Si los
MP3 de voz no están, suena solo la música y se leen los subtítulos.

## Renderizar el MP4

Necesita Node 18+, Playwright con Chromium y ffmpeg.

```bash
cd oficina-ia-video/render
npm init -y && npm i three@0.186.1 gsap@3.13.0 playwright   # librerías locales para el render
node rv.js --fps 30 --out frames                            # ~2.700 fotogramas (lento: ~1 s/fotograma en CPU)
bash montar.sh frames ../oficina-ia-animatico-9x16.mp4
```

`rv.js` intercepta las peticiones a jsDelivr y las sirve desde `node_modules`,
así funciona también sin acceso a CDN. Cada fotograma se obtiene con
`window.__seek(t)`: todo lo visible es función del tiempo, no del reloj, por eso
el render es determinista.

## Locución

La voz de referencia se generó en TopView (ElevenLabs v3, voz española
masculina, 0,1 crédito por bloque) y quedó guardada en el tablero «My First
Board» de la cuenta de TopView de Leo. Desde el sandbox de Claude no se puede
descargar de CloudFront, así que para montar el MP4 con voz hay que bajar los
seis clips y guardarlos como `audio/b1.mp3` … `audio/b6.mp3`, o bien grabar la
voz real del presentador con el texto de `guion-voz.json` y recortarla en seis
clips. Los tiempos de entrada están en `tiempos.json`.

Duraciones de los clips sintéticos: b1 3,29 s · b2 9,51 s · b3 12,2 s ·
b4 25,26 s · b5 17,45 s · b6 7,37 s.

## Qué es recreación y qué no

La interfaz que aparece (avatares por departamento, colores de estado, lista de
tareas, subida de archivo, propuesta con botón de aprobar) es una **recreación**
del sistema real para el animático, marcada como tal en pantalla. En el vídeo
final se sustituye por captura de la oficina real. Los planos «PLANO A CÁMARA ·
GRABAR» son marcadores para el rodaje del presentador. No hay cifras de ahorro,
testimonios ni resultados inventados; los nueve departamentos y las «+100
reglas verificadas» son los del caso real descrito en el encargo.
