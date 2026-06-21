param(
  [string]$BackupRoot = ""
)

$ErrorActionPreference = "Stop"

$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($BackupRoot)) {
  $BackupRoot = Join-Path $AppDir "backups"
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$target = Join-Path $BackupRoot $timestamp
New-Item -ItemType Directory -Force -Path $target | Out-Null

$items = @(
  "index.html",
  "app.js",
  "styles.css",
  "server.js",
  "README.md",
  "ARCHITECTURE_RULES.md",
  "mobil-sunucu-baslat.bat",
  "guvenlik-duvari-izin-ver.bat"
)

foreach ($item in $items) {
  $source = Join-Path $AppDir $item
  if (Test-Path -LiteralPath $source) {
    Copy-Item -LiteralPath $source -Destination $target -Force
  }
}

$dataDir = Join-Path $AppDir "server-data"
if (Test-Path -LiteralPath $dataDir) {
  Copy-Item -LiteralPath $dataDir -Destination (Join-Path $target "server-data") -Recurse -Force
}

Get-ChildItem -LiteralPath $BackupRoot -Directory |
  Sort-Object LastWriteTime -Descending |
  Select-Object -Skip 30 |
  Remove-Item -Recurse -Force

Write-Host "Backup created: $target"
