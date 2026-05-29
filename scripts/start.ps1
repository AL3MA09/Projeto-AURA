# AURA — Script de inicialização rápida (Windows PowerShell)
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   AURA — Inicializando..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 1. Verificar Docker
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Error "Docker não encontrado. Instale em: https://docker.com/desktop"
    exit 1
}

# 2. Configurar .env se não existir
$envFile = "backend\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "Criando arquivo .env a partir do exemplo..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" $envFile
    Write-Host "ATENÇÃO: Edite backend\.env com suas chaves de API antes de continuar!" -ForegroundColor Red
    Write-Host "  - OPENAI_API_KEY"
    Write-Host "  - ELEVENLABS_API_KEY (opcional, melhora a voz)"
    Write-Host "  - ANTHROPIC_API_KEY (opcional, fallback de IA)"
    $continue = Read-Host "Continuar mesmo sem configurar as chaves? (s/n)"
    if ($continue -ne "s") { exit 0 }
}

# 3. Subir os serviços
Write-Host "`nIniciando serviços Docker..." -ForegroundColor Green
docker compose up -d --build

Write-Host "`nAguardando serviços ficarem prontos..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 4. Verificar saúde
$backendHealth = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -ErrorAction SilentlyContinue
if ($backendHealth.StatusCode -eq 200) {
    Write-Host "✅ Backend: online" -ForegroundColor Green
} else {
    Write-Host "⚠ Backend: não respondeu ainda" -ForegroundColor Yellow
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "   AURA está pronta!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Interface Web:  http://localhost:3000" -ForegroundColor White
Write-Host "🖥  Modo Quiosque:  http://localhost:3000/kiosk" -ForegroundColor White
Write-Host "⚙  API Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "📚 Documentação:  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Para parar: docker compose down" -ForegroundColor Gray
