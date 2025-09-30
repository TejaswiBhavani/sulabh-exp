@echo off
echo 🏦 Starting Sulabh Banking Application...

REM Set Java environment
set "JAVA_HOME=C:\Program Files\Java\jdk-21"
set "PATH=%JAVA_HOME%\bin;%PATH%"

REM Check if application jar exists
if not exist "target\sulabh-backend-0.0.1-SNAPSHOT.jar" (
    echo ⚠️ Application not built yet. Building now...
    call build.bat
)

REM Start the application
echo 🚀 Starting application on port 8080...
echo 🌐 Access your banking application at: http://localhost:8080
echo.

java -Dspring.profiles.active=prod ^
     -Dserver.port=8080 ^
     -jar target\sulabh-backend-0.0.1-SNAPSHOT.jar

pause
