# start-servers.ps1
# Launches the EduClip backend (FastAPI :8001) and frontend (Next.js :3000)
# in separate PowerShell windows. Run from the repo root:  .\start-servers.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$educlip = Join-Path $root "EduClip"

# Ensure the frontend proxy config exists (maps /api/v1/* -> :8001)
$envLocal = Join-Path $educlip ".env.local"
if (-not (Test-Path $envLocal)) {
    Copy-Item (Join-Path $educlip ".env.local.example") $envLocal
    Write-Host "Created EduClip/.env.local from example" -ForegroundColor Yellow
}

Write-Host "Starting backend  -> http://localhost:8001" -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$root'; `$env:DATABASE_URL='sqlite:///./educlip_dev.db'; python -m uvicorn api.main:app --port 8001 --host 127.0.0.1"
)

Write-Host "Starting frontend -> http://localhost:3000" -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$educlip'; if (-not (Test-Path node_modules)) { npm install }; npm run dev"
)

Write-Host ""
Write-Host "Both servers are launching in separate windows." -ForegroundColor Green
Write-Host "Open http://localhost:3000  (backend API docs: http://localhost:8001/docs)"
Write-Host "Note: set GEMINI_API_KEY in api/.env for real AI output (mock mode otherwise)."
