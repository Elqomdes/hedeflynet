# GitHub Push Script for Hedefly Project
# This script will commit and push the parent filtering fixes

$ErrorActionPreference = "Stop"

# Change to project directory
$projectPath = "C:\Users\Emre\Desktop\WEB SİTELERİ\hedefly 3.3"
Set-Location $projectPath

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Green

# Initialize git if needed
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
}

# Add modified files
Write-Host "Adding modified files..." -ForegroundColor Yellow
git add src/app/api/teacher/parents/route.ts
git add "src/app/api/admin/teachers/[id]/parents/route.ts"

# Check if there are changes to commit
$status = git status --short
if ($status) {
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git commit -m "Fix: Veli filtreleme sorunu düzeltildi - Her öğretmen sadece kendi sınıflarındaki öğrencilerin velilerini görüyor"
    Write-Host "Changes committed successfully!" -ForegroundColor Green
} else {
    Write-Host "No changes to commit." -ForegroundColor Yellow
}

# Check for existing remote
$remotes = git remote -v
if ($remotes) {
    Write-Host "`nExisting remotes:" -ForegroundColor Cyan
    Write-Host $remotes
    
    Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
    git branch -M main 2>$null
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nSuccessfully pushed to GitHub!" -ForegroundColor Green
    } else {
        Write-Host "`nPush failed. Please check your GitHub credentials and remote URL." -ForegroundColor Red
        Write-Host "You may need to:" -ForegroundColor Yellow
        Write-Host "  1. Set up GitHub authentication (personal access token or SSH key)"
        Write-Host "  2. Verify remote URL: git remote -v"
        Write-Host "  3. Add remote if needed: git remote add origin <YOUR_GITHUB_REPO_URL>"
    }
} else {
    Write-Host "`nNo remote repository configured." -ForegroundColor Yellow
    Write-Host "To add a GitHub remote, run:" -ForegroundColor Cyan
    Write-Host "  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor White
    Write-Host "  git branch -M main" -ForegroundColor White
    Write-Host "  git push -u origin main" -ForegroundColor White
}

