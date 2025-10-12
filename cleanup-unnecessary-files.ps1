# Cleanup script for unnecessary files in SULABH project

Write-Host "Starting cleanup of unnecessary files..." -ForegroundColor Green

# Create backup list of files to be deleted
$filesToDelete = @()

# Empty folders
$emptyFolders = @(
    "temp-frontend-clone",
    "temp-sulabh-frontend",
    "frontend/temp-frontend"
)

# Duplicate/unnecessary files
$unnecessaryFiles = @(
    # Old/duplicate code files
    "src/contexts/AuthContext.old.tsx",
    "src/hooks/useRegister_new.ts",
    "readme",
    
    # Duplicate config files (keeping the ones in appropriate directories)
    "postcss.config.js",    # Keep the one in frontend/
    "vite.config.ts",       # Keep the one in frontend/
    "vitest.config.mts",    # Keep vitest.config.ts
    "tsconfig.json",        # Keep the one in frontend/
    "tailwind.config.js",   # Keep the one in frontend/
    
    # Ngrok files (can be downloaded again if needed)
    "ngrok.exe",
    "ngrok.zip",
    
    # Supabase files (using PostgreSQL backend instead)
    "src/lib/supabase.ts",
    
    # Log files
    "backend.stderr.log",
    "backend.stdout.log",
    "build.log",
    
    # Duplicate scripts (keeping the most comprehensive ones)
    "start.bat",            # Keep start.ps1
    "run.bat",              # Keep run-with-logs.bat
    "run-sulabh.bat",       # Keep run-with-logs.bat
    "build.bat",            # Keep build.sh and PowerShell versions
    "setup-java.bat"        # Keep PowerShell versions
)

# Supabase folder (if using PostgreSQL)
$supabaseFolder = "supabase"

Write-Host "Files and folders to be removed:" -ForegroundColor Yellow

# Check empty folders
foreach ($folder in $emptyFolders) {
    if (Test-Path $folder) {
        $isEmpty = (Get-ChildItem $folder -Force | Measure-Object).Count -eq 0
        if ($isEmpty) {
            Write-Host "  FOLDER: $folder (empty folder)" -ForegroundColor Red
            $filesToDelete += $folder
        }
    }
}

# Check unnecessary files
foreach ($file in $unnecessaryFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        $sizeText = if ($size -gt 1MB) { "{0:N1} MB" -f ($size / 1MB) } 
                   elseif ($size -gt 1KB) { "{0:N1} KB" -f ($size / 1KB) } 
                   else { "$size bytes" }
        Write-Host "  FILE: $file ($sizeText)" -ForegroundColor Red
        $filesToDelete += $file
    }
}

# Check Supabase folder
if (Test-Path $supabaseFolder) {
    $supabaseSize = (Get-ChildItem $supabaseFolder -Recurse | Measure-Object -Property Length -Sum).Sum
    $sizeText = if ($supabaseSize -gt 1MB) { "{0:N1} MB" -f ($supabaseSize / 1MB) } 
               elseif ($supabaseSize -gt 1KB) { "{0:N1} KB" -f ($supabaseSize / 1KB) } 
               else { "$supabaseSize bytes" }
    Write-Host "  FOLDER: $supabaseFolder/ ($sizeText, using PostgreSQL instead)" -ForegroundColor Red
    $filesToDelete += $supabaseFolder
}

if ($filesToDelete.Count -eq 0) {
    Write-Host "No unnecessary files found!" -ForegroundColor Green
    exit 0
}

# Calculate total size to be freed
$totalSize = 0
foreach ($item in $filesToDelete) {
    if (Test-Path $item) {
        if (Test-Path $item -PathType Container) {
            $totalSize += (Get-ChildItem $item -Recurse -File | Measure-Object -Property Length -Sum).Sum
        } else {
            $totalSize += (Get-Item $item).Length
        }
    }
}

$totalSizeText = if ($totalSize -gt 1MB) { "{0:N1} MB" -f ($totalSize / 1MB) } 
                elseif ($totalSize -gt 1KB) { "{0:N1} KB" -f ($totalSize / 1KB) } 
                else { "$totalSize bytes" }

Write-Host "`nTotal space to be freed: $totalSizeText" -ForegroundColor Cyan

# Ask for confirmation
$confirmation = Read-Host "`nDo you want to delete these files? (y/N)"

if ($confirmation -match '^[Yy]') {
    Write-Host "`nDeleting unnecessary files..." -ForegroundColor Green
    
    $deletedCount = 0
    foreach ($item in $filesToDelete) {
        if (Test-Path $item) {
            try {
                Remove-Item $item -Recurse -Force
                Write-Host "  DELETED: $item" -ForegroundColor Green
                $deletedCount++
            } catch {
                Write-Host "  FAILED: $item - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    Write-Host "`nCleanup completed! Deleted $deletedCount items, freed $totalSizeText" -ForegroundColor Green
    Write-Host "Your workspace is now cleaner and more organized!" -ForegroundColor Cyan
} else {
    Write-Host "`nCleanup cancelled." -ForegroundColor Yellow
    Write-Host "Run this script again when you are ready to clean up." -ForegroundColor Cyan
}

Write-Host "`nRecommendations for maintaining a clean workspace:" -ForegroundColor Blue
Write-Host "  - Add temporary files to .gitignore" -ForegroundColor Gray
Write-Host "  - Regularly clean up build artifacts" -ForegroundColor Gray
Write-Host "  - Remove unused dependencies from package.json" -ForegroundColor Gray
Write-Host "  - Keep only one version of configuration files" -ForegroundColor Gray