# Sulabh Backend - Public Deployment Script
# This script starts your application and makes it publicly accessible

Write-Host "🚀 Starting Sulabh Backend with Public Access..." -ForegroundColor Green

# Set Java 21 environment
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
Write-Host "✅ Java 21 environment set" -ForegroundColor Yellow

# Start the Spring Boot application in background
Write-Host "🔄 Starting Spring Boot application..." -ForegroundColor Cyan
$appProcess = Start-Process -FilePath "C:\Program Files\Java\jdk-21\bin\java.exe" -ArgumentList "-jar", "target\sulabh-backend-0.0.1-SNAPSHOT.jar" -PassThru -WindowStyle Hidden

# Wait for application to start
Write-Host "⏳ Waiting for application to start (15 seconds)..." -ForegroundColor Yellow
Start-Sleep 15

# Check if application is running
$portCheck = netstat -ano | findstr :8081
if ($portCheck) {
    Write-Host "✅ Application is running on port 8081!" -ForegroundColor Green
    
    # Start ngrok to create public URL
    Write-Host "🌐 Creating public URL with ngrok..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "==================== PUBLIC ACCESS ====================" -ForegroundColor Magenta
    Write-Host "Your Sulabh Backend is now publicly accessible!" -ForegroundColor Green
    Write-Host "Starting ngrok tunnel..." -ForegroundColor Yellow
    Write-Host ""
    
    # Start ngrok (this will show the public URL)
    .\ngrok.exe http 8081
} else {
    Write-Host "❌ Application failed to start on port 8081" -ForegroundColor Red
    Write-Host "Please check the logs and try again" -ForegroundColor Yellow
}

# Cleanup when script ends
if ($appProcess -and !$appProcess.HasExited) {
    Write-Host "🛑 Stopping application..." -ForegroundColor Yellow
    Stop-Process -Id $appProcess.Id -Force
}