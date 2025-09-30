@echo off
set JAVA_HOME=C:\Program Files\Java\jdk-21
set PATH=%JAVA_HOME%\bin;%PATH%

:: Database Configuration
set POSTGRES_USER=postgres
set POSTGRES_PASSWORD=root123
set DATABASE_URL=jdbc:postgresql://localhost:5432/sulabh

:: JWT Configuration
set JWT_SECRET=5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437

:: Application Configuration
set SERVER_PORT=8080
set SPRING_PROFILES_ACTIVE=prod

:: Run the application
"%JAVA_HOME%\bin\java" -jar "%~dp0target\sulabh-backend-0.0.1-SNAPSHOT.jar"
