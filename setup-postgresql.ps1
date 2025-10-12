# PowerShell script to set up PostgreSQL for SULABH application
param(
    [string]$PostgreSQLPath = "C:\Program Files\PostgreSQL\15\bin",
    [string]$SuperUserPassword = ""
)

Write-Host "🐘 SULABH PostgreSQL Setup Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check if PostgreSQL is installed
$psqlPath = Join-Path $PostgreSQLPath "psql.exe"
if (-not (Test-Path $psqlPath)) {
    Write-Host "❌ PostgreSQL not found at: $PostgreSQLPath" -ForegroundColor Red
    Write-Host "Please install PostgreSQL or specify the correct path with -PostgreSQLPath parameter" -ForegroundColor Yellow
    Write-Host "Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Found PostgreSQL at: $PostgreSQLPath" -ForegroundColor Green

# Prompt for superuser password if not provided
if ([string]::IsNullOrEmpty($SuperUserPassword)) {
    $securePassword = Read-Host "Enter PostgreSQL superuser (postgres) password" -AsSecureString
    $SuperUserPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))
}

# Set environment variable for password
$env:PGPASSWORD = $SuperUserPassword

try {
    Write-Host "🔧 Creating database and user..." -ForegroundColor Yellow
    
    # Create the SQL commands
    $sqlCommands = @"
-- Create database
CREATE DATABASE sulabh_db;

-- Create user
CREATE USER sulabh_user WITH PASSWORD 'sulabh_password';

-- Grant all privileges on database to user
GRANT ALL PRIVILEGES ON DATABASE sulabh_db TO sulabh_user;

-- Connect to the database
\c sulabh_db;

-- Grant privileges on schema
GRANT ALL ON SCHEMA public TO sulabh_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sulabh_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sulabh_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sulabh_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO sulabh_user;
"@

    # Save SQL commands to temporary file
    $tempSqlFile = [System.IO.Path]::GetTempFileName() + ".sql"
    $sqlCommands | Out-File -FilePath $tempSqlFile -Encoding UTF8

    # Execute SQL commands
    $arguments = @("-U", "postgres", "-h", "localhost", "-f", $tempSqlFile)
    $process = Start-Process -FilePath $psqlPath -ArgumentList $arguments -Wait -PassThru -NoNewWindow

    if ($process.ExitCode -eq 0) {
        Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
        Write-Host "" -ForegroundColor White
        Write-Host "📊 Database Details:" -ForegroundColor Cyan
        Write-Host "  Database: sulabh_db" -ForegroundColor White
        Write-Host "  Username: sulabh_user" -ForegroundColor White
        Write-Host "  Password: sulabh_password" -ForegroundColor White
        Write-Host "  Host: localhost" -ForegroundColor White
        Write-Host "  Port: 5432" -ForegroundColor White
        Write-Host "" -ForegroundColor White
        Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
        Write-Host "  1. Start the Spring Boot application: ./mvnw spring-boot:run" -ForegroundColor White
        Write-Host "  2. Start the frontend: npm run dev" -ForegroundColor White
        Write-Host "  3. Open http://localhost:5174 in your browser" -ForegroundColor White
        Write-Host "" -ForegroundColor White
        Write-Host "👤 Default Users Created:" -ForegroundColor Cyan
        Write-Host "  Admin: admin@sulabh.com / admin123 (username: admin)" -ForegroundColor White
        Write-Host "  Demo:  user@sulabh.com / user123 (username: demo_user)" -ForegroundColor White
    } else {
        Write-Host "❌ Database setup failed!" -ForegroundColor Red
        Write-Host "Please check your PostgreSQL installation and credentials." -ForegroundColor Yellow
    }

    # Clean up temporary file
    Remove-Item -Path $tempSqlFile -Force -ErrorAction SilentlyContinue

} catch {
    Write-Host "❌ Error during setup: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Clear password from environment
    $env:PGPASSWORD = $null
}

Write-Host "" -ForegroundColor White
Write-Host "📝 For manual setup instructions, see: database/POSTGRESQL_SETUP.md" -ForegroundColor Cyan