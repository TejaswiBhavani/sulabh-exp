# Build and run script for fullstack application
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Sulabh Banking Application build process..."

# Set Java environment
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Build frontend
Write-Host "📦 Building frontend..."
Push-Location temp-sulabh-frontend
try {
    # Install dependencies and build
    npm install
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed"
    }
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

# Build Spring Boot application
Write-Host "🏗️ Building Spring Boot application..."
.\mvnw.cmd clean package -DskipTests

Write-Host "✅ Build completed!"

# Run the application with tunnel
Write-Host "🌐 Starting application with public tunnel..."

# Kill any existing Java processes
Get-Process -Name "java" -ErrorAction SilentlyContinue | Stop-Process -Force

# Start the Spring Boot application in background
$appJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    $env:JAVA_HOME = $args[1]
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
    java -jar target\sulabh-backend-0.0.1-SNAPSHOT.jar
} -ArgumentList (Get-Location), $env:JAVA_HOME

# Wait for application to start
Write-Host "⏳ Waiting for application to start..."
Start-Sleep -Seconds 10

# Check if application is running
$portCheck = netstat -ano | findstr ":8081"
if ($portCheck) {
    Write-Host "✅ Application started successfully on port 8081"
    
    # Start localtunnel
    Write-Host "🌍 Creating public tunnel..."
    Write-Host "📋 Tunnel Password: 49.204.110.211"
    
    # Start tunnel in background
    $tunnelJob = Start-Job -ScriptBlock {
        npx localtunnel --port 8081
    }
    
    # Wait for tunnel to establish
    Start-Sleep -Seconds 5
    
    Write-Host "🎉 Fullstack application is now running!"
    Write-Host "📱 Local access: http://localhost:8081"
    Write-Host "🌐 Public access: Check terminal for tunnel URL"
    Write-Host "🔑 Use password: 49.204.110.211 when prompted"
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the application and tunnel"
    
    # Keep both jobs running
    try {
        while ($true) {
            if ($appJob.State -eq "Completed" -or $appJob.State -eq "Failed") {
                Write-Host "❌ Application stopped unexpectedly"
                break
            }
            if ($tunnelJob.State -eq "Completed" -or $tunnelJob.State -eq "Failed") {
                Write-Host "❌ Tunnel stopped unexpectedly"
                break
            }
            Start-Sleep -Seconds 5
        }
    } finally {
        # Cleanup
        Stop-Job $appJob -ErrorAction SilentlyContinue
        Stop-Job $tunnelJob -ErrorAction SilentlyContinue
        Remove-Job $appJob -ErrorAction SilentlyContinue
        Remove-Job $tunnelJob -ErrorAction SilentlyContinue
        Get-Process -Name "java" -ErrorAction SilentlyContinue | Stop-Process -Force
    }
} else {
    Write-Host "❌ Application failed to start on port 8081"
    Stop-Job $appJob -ErrorAction SilentlyContinue
    Remove-Job $appJob -ErrorAction SilentlyContinue
    exit 1
}