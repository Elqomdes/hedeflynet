# GitHub Push Script - Fixed Version
$ErrorActionPreference = "Stop"

# Get the actual workspace directory
$workspacePath = $PSScriptRoot
if (-not $workspacePath) {
    # If not running from script directory, try to find it
    $workspacePath = Split-Path -Parent $MyInvocation.MyCommand.Path
}

# Try to find project directory by looking for package.json
if (-not (Test-Path (Join-Path $workspacePath "package.json"))) {
    # Try common locations
    $possiblePaths = @(
        "$env:USERPROFILE\Desktop\WEB SİTELERİ\hedefly 3.3",
        "$env:USERPROFILE\Desktop\WEB SITELERI\hedefly 3.3",
        "$env:USERPROFILE\Desktop"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path (Join-Path $path "package.json")) {
            $workspacePath = $path
            break
        }
    }
}

# Use current directory if package.json exists here
if (Test-Path "package.json") {
    $workspacePath = Get-Location
}

Write-Host "Project directory: $workspacePath" -ForegroundColor Green
Set-Location $workspacePath

# Verify we're in the right place
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the project directory." -ForegroundColor Red
    exit 1
}

# Check if .git exists
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
}

# Check and set remote
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "Adding GitHub remote..." -ForegroundColor Yellow
    git remote add origin https://github.com/Elqomdes/hedeflynet.git
} elseif ($remote -ne "https://github.com/Elqomdes/hedeflynet.git") {
    Write-Host "Updating remote URL..." -ForegroundColor Yellow
    git remote set-url origin https://github.com/Elqomdes/hedeflynet.git
}

Write-Host "Remote: $(git remote get-url origin)" -ForegroundColor Cyan

# Check git status
Write-Host "`nChecking git status..." -ForegroundColor Yellow
git status --short

# Add all changes
Write-Host "`nAdding all changes..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$status = git status --short
if ($status) {
    Write-Host "`nCommitting changes..." -ForegroundColor Yellow
    $commitMessage = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git commit -m $commitMessage
    Write-Host "Changes committed!" -ForegroundColor Green
} else {
    Write-Host "No changes to commit." -ForegroundColor Yellow
}

# Ensure we're on main branch
git branch -M main 2>$null

# Push to GitHub
Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
try {
    git push -u origin main 2>&1 | Tee-Object -Variable pushOutput
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nSuccessfully pushed to GitHub!" -ForegroundColor Green
    } else {
        Write-Host "`nPush failed. Output:" -ForegroundColor Red
        Write-Host $pushOutput -ForegroundColor Red
        
        # Check if it's an authentication issue
        if ($pushOutput -match "permission denied" -or $pushOutput -match "authentication" -or $pushOutput -match "403") {
            Write-Host "`nAuthentication issue detected. Please:" -ForegroundColor Yellow
            Write-Host "1. Use a Personal Access Token (PAT) instead of password" -ForegroundColor White
            Write-Host "2. Or set up SSH keys for GitHub" -ForegroundColor White
            Write-Host "3. Update remote URL: git remote set-url origin https://YOUR_TOKEN@github.com/Elqomdes/hedeflynet.git" -ForegroundColor White
        }
        exit 1
    }
} catch {
    Write-Host "`nError: $_" -ForegroundColor Red
    exit 1
}

