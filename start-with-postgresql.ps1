# Complete PostgreSQL Authentication System Startup Script
# This script sets up and starts the complete authentication system with PostgreSQL

Write-Host "🚀 Starting Sulabh Authentication System with PostgreSQL" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# Set Java environment
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Function to check if service is running
function Test-ServiceRunning {
    param([string]$ServiceName)
    
    try {
        $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        return $service.Status -eq "Running"
    } catch {
        return $false
    }
}

# Function to check if port is in use
function Test-PortInUse {
    param([int]$Port)
    
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Check PostgreSQL service
Write-Host "🔍 Checking PostgreSQL service..." -ForegroundColor Yellow
$postgresqlRunning = Test-ServiceRunning "postgresql*"

if (-not $postgresqlRunning) {
    Write-Host "❌ PostgreSQL service is not running!" -ForegroundColor Red
    Write-Host "Please start PostgreSQL service or run setup-postgresql.ps1 first" -ForegroundColor Yellow
    Write-Host "To start PostgreSQL:" -ForegroundColor Cyan
    Write-Host "  - Windows Services: Start 'postgresql-x64-xx' service" -ForegroundColor White
    Write-Host "  - Command: net start postgresql-x64-xx" -ForegroundColor White
    exit 1
}

Write-Host "✅ PostgreSQL service is running" -ForegroundColor Green

# Check PostgreSQL connection
Write-Host "🔍 Testing database connection..." -ForegroundColor Yellow
try {
    # Test connection using basic connectivity check
    if (Test-PortInUse 5432) {
        Write-Host "✅ PostgreSQL is accessible on port 5432" -ForegroundColor Green
    } else {
        Write-Host "❌ Cannot connect to PostgreSQL on port 5432" -ForegroundColor Red
        Write-Host "Please ensure PostgreSQL is properly configured" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Database connection test failed" -ForegroundColor Red
    exit 1
}

# Kill any existing Java processes
Write-Host "🔧 Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "java" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Start the Spring Boot application in background
Write-Host "🏗️ Starting Spring Boot backend..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    $env:JAVA_HOME = $args[1]
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
    ./mvnw.cmd spring-boot:run
} -ArgumentList (Get-Location), $env:JAVA_HOME

# Wait for backend to start
Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
$timeout = 60 # seconds
$elapsed = 0
$backendReady = $false

while ($elapsed -lt $timeout -and -not $backendReady) {
    Start-Sleep -Seconds 2
    $elapsed += 2
    
    if (Test-PortInUse 8081) {
        $backendReady = $true
        Write-Host "✅ Backend is ready on port 8081" -ForegroundColor Green
    } else {
        Write-Host "⏳ Backend starting... ($elapsed/$timeout seconds)" -ForegroundColor Yellow
    }
}

if (-not $backendReady) {
    Write-Host "❌ Backend failed to start within $timeout seconds" -ForegroundColor Red
    Write-Host "Check the backend job output for errors" -ForegroundColor Yellow
    Receive-Job -Job $backendJob
    exit 1
}

# Start the frontend
Write-Host "🌐 Starting React frontend..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    npm run dev
} -ArgumentList (Get-Location)

# Wait for frontend to start
Write-Host "⏳ Waiting for frontend to start..." -ForegroundColor Yellow
$timeout = 30 # seconds
$elapsed = 0
$frontendReady = $false

while ($elapsed -lt $timeout -and -not $frontendReady) {
    Start-Sleep -Seconds 2
    $elapsed += 2
    
    # Check common Vite ports
    if ((Test-PortInUse 5173) -or (Test-PortInUse 5174)) {
        $frontendReady = $true
        $frontendPort = if (Test-PortInUse 5173) { 5173 } else { 5174 }
        Write-Host "✅ Frontend is ready on port $frontendPort" -ForegroundColor Green
    } else {
        Write-Host "⏳ Frontend starting... ($elapsed/$timeout seconds)" -ForegroundColor Yellow
    }
}

if (-not $frontendReady) {
    Write-Host "❌ Frontend failed to start within $timeout seconds" -ForegroundColor Red
    Write-Host "Check the frontend job output for errors" -ForegroundColor Yellow
    Receive-Job -Job $frontendJob
    exit 1
}

# Success message
Write-Host "" -ForegroundColor White
Write-Host "🎉 SULABH Application Started Successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:$frontendPort" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8081" -ForegroundColor White
Write-Host "  API Docs: http://localhost:8081/h2-console (if H2 enabled)" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "👤 Default Users:" -ForegroundColor Cyan
Write-Host "  Admin:    admin@sulabh.com / admin123 (username: admin)" -ForegroundColor White
Write-Host "  Demo User: user@sulabh.com / user123 (username: demo_user)" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "💾 Database:" -ForegroundColor Cyan
Write-Host "  Type:     PostgreSQL" -ForegroundColor White
Write-Host "  Database: sulabh_db" -ForegroundColor White
Write-Host "  Host:     localhost:5432" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "⚡ Features:" -ForegroundColor Cyan
Write-Host "  ✅ User Registration with username/email" -ForegroundColor White
Write-Host "  ✅ Login with username or email" -ForegroundColor White
Write-Host "  ✅ Password hashing with BCrypt" -ForegroundColor White
Write-Host "  ✅ JWT Authentication" -ForegroundColor White
Write-Host "  ✅ Session Management" -ForegroundColor White
Write-Host "  ✅ Persistent PostgreSQL Database" -ForegroundColor White
Write-Host "  ✅ Automatic Bank Account Creation" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "🛑 To stop the application:" -ForegroundColor Yellow
Write-Host "  Press Ctrl+C or close this window" -ForegroundColor White
Write-Host "" -ForegroundColor White

# Open browser
try {
    Start-Process "http://localhost:$frontendPort"
    Write-Host "🌐 Opening browser..." -ForegroundColor Cyan
} catch {
    Write-Host "📝 Please open http://localhost:$frontendPort in your browser" -ForegroundColor Cyan
}

# Keep script running and monitor jobs
Write-Host "📊 Monitoring application..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Check if jobs are still running
        if ($backendJob.State -ne "Running") {
            Write-Host "❌ Backend job stopped unexpectedly" -ForegroundColor Red
            Receive-Job -Job $backendJob
            break
        }
        
        if ($frontendJob.State -ne "Running") {
            Write-Host "❌ Frontend job stopped unexpectedly" -ForegroundColor Red
            Receive-Job -Job $frontendJob
            break
        }
    }
} catch {
    Write-Host "🛑 Stopping application..." -ForegroundColor Yellow
} finally {
    # Cleanup
    Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -ErrorAction SilentlyContinue
    
    # Kill Java processes
    Get-Process -Name "java" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "✅ Application stopped" -ForegroundColor Green
}