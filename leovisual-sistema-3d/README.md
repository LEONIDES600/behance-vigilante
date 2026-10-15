# LeoVisual.nl — Sistema de producción (vídeo 3D vertical)

Animación 3D en bucle, 1080x1920, 18 s: el grafo de nodos del sistema de producción de vídeo.

1. **Previsualizar:** `npx serve .` y abre la URL que muestre. Cambia de estilo con `?tema=ignicion` (`sereno`, `ignicion`, `hiperespacio`, `forja`).
2. **Cambiar textos:** todo está en el objeto `CONFIG` al principio de `sistema.js` (marca, nodos, cables, frases, tiempos, colores, cámara y efectos). No hace falta tocar nada más.
3. **Cambiar de estilo por defecto:** `CONFIG.tema` en `sistema.js`. Cada estilo se define en `CONFIG.temas` y solo sobreescribe lo que cambia.
4. **Exportar (Windows):** `npm i playwright` una vez, luego `node render.js --tema=ignicion` genera 1080 PNG en `frames/`.
5. **Montar el MP4:** `winget install Gyan.FFmpeg` una vez, luego `.\export.ps1` crea `leovisual-sistema.mp4` (H.264, yuv420p, CRF 18, 60 fps) y `preview.mp4` a 30 fps.
6. **Render parcial** para revisar un tramo: `node render.js --desde=8 --hasta=12 --fps=30`.

Sin conexión a internet: three.js y la fuente Manrope están incluidos en `vendor/` y `fonts/`.
Todo el texto es HTML o canvas real, nunca imagen generada. La animación es determinista: depende solo del tiempo `t`, así que dos renders dan exactamente el mismo resultado.
