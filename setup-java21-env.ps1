# Set Java 21 Environment for Sulabh Backend
# This script sets up the environment to use Java 21 for the project

Write-Host "=== Setting up Java 21 Environment ===" -ForegroundColor Green

# Set JAVA_HOME for current session
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
Write-Host "✅ JAVA_HOME set to: $env:JAVA_HOME" -ForegroundColor Yellow

# Add Java to PATH for current session
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
Write-Host "✅ Java added to PATH" -ForegroundColor Yellow

# Verify Java version
Write-Host "`n🔍 Current Java Version:" -ForegroundColor Cyan
java -version

Write-Host "`n🔍 Maven Wrapper Version:" -ForegroundColor Cyan
.\mvnw --version

Write-Host "`n✅ Environment setup complete!" -ForegroundColor Green
Write-Host "You can now use the following commands:" -ForegroundColor White
Write-Host "  • .\mvnw clean compile   (to compile)" -ForegroundColor Gray
Write-Host "  • .\mvnw clean package   (to build JAR)" -ForegroundColor Gray
Write-Host "  • .\mvnw spring-boot:run (to run application)" -ForegroundColor Gray
Write-Host "  • .\start.ps1           (to start with environment)" -ForegroundColor Gray