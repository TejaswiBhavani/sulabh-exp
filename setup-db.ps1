# PostgreSQL Setup Script for Authentication System
Write-Host "Setting up PostgreSQL for Sulabh Authentication System" -ForegroundColor Cyan

# Check if PostgreSQL is installed
$psqlCommand = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlCommand) {
    Write-Host "PostgreSQL not found. Please install PostgreSQL first." -ForegroundColor Red
    exit 1
}

Write-Host "PostgreSQL found at: $($psqlCommand.Source)" -ForegroundColor Green

# Get PostgreSQL password
$postgresPassword = Read-Host "Enter password for PostgreSQL 'postgres' superuser" -AsSecureString
$postgresPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($postgresPassword))

# Set password for psql
$env:PGPASSWORD = $postgresPasswordPlain

try {
    Write-Host "Creating database..." -ForegroundColor Yellow
    
    # Create database
    psql -U postgres -h localhost -c "CREATE DATABASE sulabh_db;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database 'sulabh_db' created successfully" -ForegroundColor Green
    } else {
        Write-Host "Database 'sulabh_db' may already exist" -ForegroundColor Yellow
    }
    
    # Create user
    Write-Host "Creating user..." -ForegroundColor Yellow
    psql -U postgres -h localhost -c "CREATE USER sulabh_user WITH PASSWORD 'sulabh_password';" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "User 'sulabh_user' created successfully" -ForegroundColor Green
    } else {
        Write-Host "User 'sulabh_user' may already exist" -ForegroundColor Yellow
    }
    
    # Grant privileges
    Write-Host "Granting permissions..." -ForegroundColor Yellow
    psql -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE sulabh_db TO sulabh_user;" 2>$null
    psql -U postgres -h localhost -d sulabh_db -c "GRANT ALL ON SCHEMA public TO sulabh_user;" 2>$null
    psql -U postgres -h localhost -d sulabh_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sulabh_user;" 2>$null
    psql -U postgres -h localhost -d sulabh_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sulabh_user;" 2>$null
    
    Write-Host "Permissions granted successfully" -ForegroundColor Green
    
    # Test connection
    Write-Host "Testing database connection..." -ForegroundColor Yellow
    $env:PGPASSWORD = "sulabh_password"
    $testResult = psql -U sulabh_user -h localhost -d sulabh_db -c "SELECT 'Connection successful!' as test_result;" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database connection test passed!" -ForegroundColor Green
    } else {
        Write-Host "Database connection test failed!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error setting up database: $($_.Exception.Message)" -ForegroundColor Red
}

# Cleanup
Remove-Variable postgresPasswordPlain -ErrorAction SilentlyContinue
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "Authentication System Database Setup Complete!" -ForegroundColor Cyan
Write-Host "Database Name: sulabh_db" -ForegroundColor White
Write-Host "Database User: sulabh_user" -ForegroundColor White
Write-Host "Database Password: sulabh_password" -ForegroundColor White
Write-Host "Host: localhost" -ForegroundColor White
Write-Host "Port: 5432" -ForegroundColor White

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start backend: ./mvnw spring-boot:run" -ForegroundColor White
Write-Host "2. Start frontend: npm run dev" -ForegroundColor White
Write-Host "3. Visit: http://localhost:5174" -ForegroundColor White

Write-Host ""
Write-Host "Test Login Credentials:" -ForegroundColor Yellow
Write-Host "Admin: admin@sulabh.com / admin123" -ForegroundColor White
Write-Host "User: user@sulabh.com / user123" -ForegroundColor White

Write-Host ""
Write-Host "Your authentication system is ready!" -ForegroundColor Green