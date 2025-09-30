# Set Java Home
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"

# Add Java to PATH
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Verify Java version
Write-Host "Checking Java version..."
java -version

# Start Spring Boot application
Write-Host "Starting Spring Boot application..."
.\mvnw.cmd spring-boot:run
