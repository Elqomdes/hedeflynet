# GitHub Push Script
$ErrorActionPreference = "Stop"

# Find project directory by looking for package.json
$projectDir = $null
$searchPaths = @(
    ".",
    $PWD,
    "C:\Users\Emre\Desktop",
    $env:USERPROFILE + "\Desktop"
)

foreach ($basePath in $searchPaths) {
    if (Test-Path $basePath) {
        $files = Get-ChildItem -Path $basePath -Filter "package.json" -Recurse -Depth 3 -ErrorAction SilentlyContinue | Where-Object { $_.DirectoryName -like "*hedefly*" }
        if ($files) {
            $projectDir = $files[0].DirectoryName
            break
        }
    }
}

if (-not $projectDir) {
    # Try direct path with encoding fix
    $possiblePaths = @(
        [System.IO.Path]::Combine($env:USERPROFILE, "Desktop", "WEB SİTELERİ", "hedefly 3.3")
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $projectDir = $path
            break
        }
    }
}

if (-not $projectDir -or -not (Test-Path $projectDir)) {
    Write-Host "Error: Could not find project directory" -ForegroundColor Red
    Write-Host "Please run this script from the project directory or specify the path manually" -ForegroundColor Yellow
    exit 1
}

Write-Host "Project directory: $projectDir" -ForegroundColor Green
Set-Location $projectDir

# Initialize git if needed
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
}

# Check remote
$remote = git remote get-url origin -ErrorAction SilentlyContinue
if (-not $remote) {
    Write-Host "Adding GitHub remote..." -ForegroundColor Yellow
    git remote add origin https://github.com/Elqomdes/hedeflynet.git
} elseif ($remote -ne "https://github.com/Elqomdes/hedeflynet.git") {
    Write-Host "Updating remote URL..." -ForegroundColor Yellow
    git remote set-url origin https://github.com/Elqomdes/hedeflynet.git
}

Write-Host "Remote configured: $(git remote get-url origin)" -ForegroundColor Green

# Add all files
Write-Host "Adding files to git..." -ForegroundColor Yellow
git add .

# Check status
$status = git status --short
if ($status) {
    Write-Host "Files to commit:" -ForegroundColor Cyan
    git status --short | Select-Object -First 10
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git commit -m "Update project files"
    Write-Host "Changes committed!" -ForegroundColor Green
} else {
    Write-Host "No changes to commit." -ForegroundColor Yellow
}

# Set branch to main
git branch -M main 2>$null

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
try {
    git push -u origin main
    Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
} catch {
    Write-Host "Push failed: $_" -ForegroundColor Red
    Write-Host "You may need to authenticate. Try:" -ForegroundColor Yellow
    Write-Host "  git push -u origin main" -ForegroundColor White
}




