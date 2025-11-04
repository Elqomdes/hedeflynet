# Git Push Fix Script
# This script fixes the git repository issue and pushes to GitHub

$ErrorActionPreference = "Stop"

# Find the project directory by looking for package.json
$projectPath = $null
$searchPaths = @(
    "C:\Users\Emre\Desktop",
    $PWD.Path
)

foreach ($searchPath in $searchPaths) {
    $packageJson = Get-ChildItem -Path $searchPath -Recurse -Filter "package.json" -ErrorAction SilentlyContinue | 
        Where-Object { $_.DirectoryName -like '*hedefly*' } | 
        Select-Object -First 1
    
    if ($packageJson) {
        $projectPath = $packageJson.DirectoryName
        break
    }
}

if (-not $projectPath) {
    Write-Host "Project directory not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Project directory: $projectPath" -ForegroundColor Green

# Change to project directory
Set-Location $projectPath

# Check if .git exists in project directory
$projectGitPath = Join-Path $projectPath ".git"
if (-not (Test-Path $projectGitPath)) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    git remote add origin https://github.com/Elqomdes/hedeflynet.git
} else {
    Write-Host "Git repository found" -ForegroundColor Green
    # Ensure remote is set
    $remote = git remote get-url origin 2>$null
    if (-not $remote) {
        git remote add origin https://github.com/Elqomdes/hedeflynet.git
    }
}

# Set git directory explicitly to avoid conflicts
$env:GIT_DIR = $projectGitPath
$env:GIT_WORK_TREE = $projectPath

# Check current status
Write-Host "`nChecking git status..." -ForegroundColor Yellow
git status

# Add all files
Write-Host "`nAdding all files..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$status = git status --short
if ($status) {
    Write-Host "`nCommitting changes..." -ForegroundColor Yellow
    git commit -m "Initial commit: Hedefly project files"
    Write-Host "Changes committed successfully!" -ForegroundColor Green
} else {
    Write-Host "No changes to commit." -ForegroundColor Yellow
}

# Check current branch
$currentBranch = git branch --show-current
if (-not $currentBranch) {
    git branch -M main
    $currentBranch = "main"
}

Write-Host "`nCurrent branch: $currentBranch" -ForegroundColor Cyan

# Push to GitHub
Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
try {
    git push -u origin $currentBranch --force
    Write-Host "`nSuccessfully pushed to GitHub!" -ForegroundColor Green
} catch {
    Write-Host "`nPush failed: $_" -ForegroundColor Red
    Write-Host "You may need to authenticate with GitHub." -ForegroundColor Yellow
    exit 1
}

