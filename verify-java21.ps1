# Java 21 Upgrade Verification Script
Write-Host "=== Java 21 Upgrade Verification ===" -ForegroundColor Green

# Set JAVA_HOME to Java 21
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
Write-Host "JAVA_HOME set to: $env:JAVA_HOME" -ForegroundColor Yellow

# Verify Java version
Write-Host "`nJava Version:" -ForegroundColor Yellow
java -version

# Verify Maven Wrapper works with Java 21
Write-Host "`nTesting Maven Wrapper with Java 21:" -ForegroundColor Yellow
.\mvnw --version

# Check if project compiles with Java 21
Write-Host "`nCompiling project with Java 21:" -ForegroundColor Yellow
.\mvnw clean compile -q

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SUCCESS: Java 21 upgrade completed successfully!" -ForegroundColor Green
    Write-Host "Your project is now using Java 21 (Latest LTS version)" -ForegroundColor Green
} else {
    Write-Host "`n❌ ERROR: Compilation failed. Please check the output above." -ForegroundColor Red
}