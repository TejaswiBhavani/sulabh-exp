# Build and run script for fullstack application
$ErrorActionPreference = "Stop"

Write-Host "🚀 Building Sulabh Banking Application..."

# Set environment variables
$env:VITE_API_URL = "http://localhost:8081"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Build frontend
Write-Host "📦 Building frontend..."
Push-Location temp-sulabh-frontend
try {
    # Clean installation
    if (Test-Path node_modules) {
        Remove-Item -Recurse -Force node_modules
    }
    # Install dependencies and build
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm build failed" }
} finally {
    Pop-Location
}

# Copy frontend build to Spring Boot static directory
Write-Host "📂 Copying frontend build to Spring Boot..."
$staticDir = "src\main\resources\static"
if (-not (Test-Path $staticDir)) {
    New-Item -ItemType Directory -Path $staticDir -Force
}
Copy-Item "temp-sulabh-frontend\dist\*" $staticDir -Recurse -Force

# Build and run Spring Boot application
Write-Host "🏗️ Building and running Spring Boot application..."
.\mvnw.cmd clean package
if ($LASTEXITCODE -ne 0) { throw "Maven build failed" }

Write-Host "✅ Build completed successfully!"
Write-Host "🌐 Starting application..."
Write-Host "Access your application at: http://localhost:8081"

java -jar target\sulabh-backend-0.0.1-SNAPSHOT.jar
