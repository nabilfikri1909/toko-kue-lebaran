# PowerShell script untuk memaketkan Next.js Standalone
$targetDir = ".\deploy-package"
$zipPath = ".\deploy-standalone.zip"

Write-Host "[*] Memaketkan Next.js Standalone untuk VPS..." -ForegroundColor Cyan

if (Test-Path $targetDir) {
    Remove-Item -Recurse -Force $targetDir
}
New-Item -ItemType Directory -Path $targetDir | Out-Null

# 1. Copy standalone runtime
Copy-Item -Recurse -Force ".\.next\standalone\*" $targetDir

# 2. Copy static files (Wajib untuk Next.js Standalone)
New-Item -ItemType Directory -Path "$targetDir\.next\static" -Force | Out-Null
Copy-Item -Recurse -Force ".\.next\static\*" "$targetDir\.next\static\"

# 3. Copy public assets (gambar, favicon, logo)
New-Item -ItemType Directory -Path "$targetDir\public" -Force | Out-Null
Copy-Item -Recurse -Force ".\public\*" "$targetDir\public\"

# 4. Copy environment config
if (Test-Path ".\.env.local") {
    Copy-Item -Force ".\.env.local" "$targetDir\.env.local"
}

# 5. Buat ZIP arsip untuk upload instan
if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}
Compress-Archive -Path "$targetDir\*" -DestinationPath $zipPath -Force

Remove-Item -Recurse -Force $targetDir

$zipSize = (Get-Item $zipPath).Length / 1MB
Write-Host ("[+] Paket siap! Ukuran file: {0:N2} MB -> {1}" -f $zipSize, $zipPath) -ForegroundColor Green
