# Otomatik GitHub Push Script
# Kullanım: .\github-push-auto.ps1

$ErrorActionPreference = "Stop"

# Proje dizinini bul
$projectDir = $null

# Mevcut dizinde kontrol et
if (Test-Path "package.json") {
    $projectDir = Get-Location
} else {
    # Desktop'ta WEB SİTELERİ klasörünü ara
    $desktop = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop")
    if (Test-Path $desktop) {
        $webDir = Get-ChildItem -Path $desktop -Directory -ErrorAction SilentlyContinue | 
            Where-Object { $_.Name -match "WEB.*TELER" } | 
            Select-Object -First 1
        
        if ($webDir) {
            $hedeflyDir = Join-Path $webDir.FullName "hedefly 3.3"
            if (Test-Path (Join-Path $hedeflyDir "package.json")) {
                $projectDir = $hedeflyDir
            }
        }
    }
}

if (-not $projectDir -or -not (Test-Path (Join-Path $projectDir "package.json"))) {
    Write-Host "Hata: Proje dizini bulunamadı!" -ForegroundColor Red
    Write-Host "Lütfen scripti proje dizininde çalıştırın." -ForegroundColor Yellow
    exit 1
}

Write-Host "Proje dizini: $projectDir" -ForegroundColor Green
Set-Location $projectDir

# Git durumunu kontrol et
if (-not (Test-Path ".git")) {
    Write-Host "Git repository başlatılıyor..." -ForegroundColor Yellow
    git init
    git remote add origin https://github.com/Elqomdes/hedeflynet.git
}

# Remote'u kontrol et
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    git remote add origin https://github.com/Elqomdes/hedeflynet.git
}

Write-Host "`nGit durumu:" -ForegroundColor Cyan
git status --short

# Değişiklikleri ekle
Write-Host "`nDeğişiklikler ekleniyor..." -ForegroundColor Yellow
git add .

# Commit et
$status = git status --short
if ($status) {
    $commitMsg = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "Commit ediliyor: $commitMsg" -ForegroundColor Yellow
    git commit -m $commitMsg
} else {
    Write-Host "Commit edilecek değişiklik yok." -ForegroundColor Yellow
}

# Branch'i kontrol et
git branch -M main 2>$null

# Push yap
Write-Host "`nGitHub'a push ediliyor..." -ForegroundColor Yellow
$pushResult = git push -u origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Başarıyla GitHub'a push edildi!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Push başarısız!" -ForegroundColor Red
    Write-Host $pushResult -ForegroundColor Red
    
    if ($pushResult -match "permission denied" -or $pushResult -match "authentication" -or $pushResult -match "403") {
        Write-Host "`nKimlik doğrulama sorunu tespit edildi." -ForegroundColor Yellow
        Write-Host "Çözüm: GitHub Personal Access Token (PAT) kullanın." -ForegroundColor White
        Write-Host "Remote URL'i güncellemek için:" -ForegroundColor White
        Write-Host "  git remote set-url origin https://YOUR_TOKEN@github.com/Elqomdes/hedeflynet.git" -ForegroundColor Cyan
    }
    exit 1
}

