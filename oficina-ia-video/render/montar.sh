#!/usr/bin/env bash
# Monta el MP4 final a partir de los fotogramas y del audio.
# Uso: bash montar.sh [frames_dir] [salida.mp4]
# Requiere ffmpeg. Lee los tiempos de inicio de cada bloque de ../tiempos.json.
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
FRAMES="${1:-$AQUI/frames}"
OUT="${2:-$AQUI/../oficina-ia-animatico-9x16.mp4}"
AUDIO="$AQUI/../audio"
FPS=$(node -e 'console.log(require("'"$AQUI"'/../tiempos.json").fps)')

# 1) Colchón musical (placeholder) si no existe
[ -f "$AQUI/musica.wav" ] || node "$AQUI/musica.js" "$AQUI/musica.wav" 90

# 2) Pista de voz: cada bloque desplazado a su inicio (adelay) y mezclado
FILTRO=""; ENTRADAS=(); MIX=""; i=0
for b in b1 b2 b3 b4 b5 b6; do
  if [ -f "$AUDIO/$b.mp3" ]; then
    ms=$(node -e 'console.log(Math.round(require("'"$AQUI"'/../tiempos.json").bloques["'"$b"'"].inicio*1000))')
    ENTRADAS+=(-i "$AUDIO/$b.mp3")
    FILTRO="$FILTRO[$i:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${ms}|${ms}[v$i];"
    MIX="$MIX[v$i]"; i=$((i+1))
  fi
done

if [ "$i" -gt 0 ]; then
  ENTRADAS+=(-i "$AQUI/musica.wav")
  FILTRO="$FILTRO[$i:a]volume=0.55[mus];${MIX}amix=inputs=$i:normalize=0[voz];[voz]loudnorm=I=-16:TP=-1.5:LRA=11[vozn];[vozn][mus]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]"
  ffmpeg -y -framerate "$FPS" -i "$FRAMES/%05d.jpg" "${ENTRADAS[@]}" \
    -filter_complex "$FILTRO" -map 0:v -map "[a]" \
    -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 160k -shortest -t 90 "$OUT"
else
  echo "Sin locuciones en $AUDIO: monto solo con música."
  ffmpeg -y -framerate "$FPS" -i "$FRAMES/%05d.jpg" -i "$AQUI/musica.wav" \
    -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 160k -shortest -t 90 "$OUT"
fi
echo "MP4: $OUT"
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height -of default=nw=1 "$OUT"
