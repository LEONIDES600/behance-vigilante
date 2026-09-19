# =====================================================================
#  export.ps1 — monta los PNG de frames/ en MP4 con ffmpeg (Windows)
#
#  Uso (PowerShell, dentro de esta carpeta):
#    .\export.ps1                       # 60 fps + preview a 30 fps
#    .\export.ps1 -Nombre leovisual-ignicion
#    .\export.ps1 -Fps 30 -SinPreview
#
#  Requiere ffmpeg en el PATH:  winget install Gyan.FFmpeg
#  Si PowerShell bloquea el script:
#    powershell -ExecutionPolicy Bypass -File .\export.ps1
# =====================================================================

param(
  [string]$Nombre  = "leovisual-sistema",   # nombre del MP4 final (sin extensión)
  [string]$Frames  = "frames",              # carpeta con los PNG
  [int]   $Fps     = 60,                    # fps del vídeo final
  [int]   $Crf     = 18,                    # calidad H.264 (menor = mejor)
  [int]   $FpsPreview = 30,                 # fps de la versión de revisión
  [switch]$SinPreview                       # no generar preview.mp4
)

$ErrorActionPreference = "Stop"

# --- comprobaciones ---
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  Write-Host "No encuentro ffmpeg en el PATH." -ForegroundColor Red
  Write-Host "Instálalo con:  winget install Gyan.FFmpeg    (y reabre PowerShell)"
  exit 1
}
if (-not (Test-Path $Frames)) {
  Write-Host "No existe la carpeta '$Frames'. Ejecuta antes:  node render.js" -ForegroundColor Red
  exit 1
}
$n = (Get-ChildItem -Path $Frames -Filter *.png).Count
if ($n -eq 0) {
  Write-Host "No hay PNG en '$Frames'. Ejecuta antes:  node render.js" -ForegroundColor Red
  exit 1
}
Write-Host "$n fotogramas encontrados en '$Frames'." -ForegroundColor Cyan

$patron = Join-Path $Frames "f%05d.png"

# --- vídeo final: H.264, yuv420p, CRF 18 ---
$salida = "$Nombre.mp4"
Write-Host "Montando $salida  ($Fps fps, CRF $Crf)..." -ForegroundColor Cyan
ffmpeg -y -hide_banner -loglevel warning `
  -framerate $Fps -i $patron `
  -c:v libx264 -preset slow -crf $Crf -pix_fmt yuv420p `
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 `
  -movflags +faststart `
  $salida
if ($LASTEXITCODE -ne 0) { Write-Host "ffmpeg falló." -ForegroundColor Red; exit 1 }

# --- preview ligero para revisar rápido ---
if (-not $SinPreview) {
  Write-Host "Montando preview.mp4  ($FpsPreview fps)..." -ForegroundColor Cyan
  ffmpeg -y -hide_banner -loglevel warning `
    -framerate $Fps -i $patron `
    -vf "fps=$FpsPreview" `
    -c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p `
    -movflags +faststart `
    "preview.mp4"
}

Write-Host ""
Write-Host "Hecho:" -ForegroundColor Green
Get-ChildItem -Path . -Filter *.mp4 |
  Select-Object Name, @{N='MB';E={[math]::Round($_.Length/1MB,1)}}, LastWriteTime |
  Format-Table -AutoSize
