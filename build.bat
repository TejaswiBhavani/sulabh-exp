@echo off
echo 🚀 Building and running Sulabh Banking Application...

:: Set environment variables
set JAVA_HOME=C:\Program Files\Java\jdk-21
set PATH=%JAVA_HOME%\bin;%PATH%
set VITE_API_URL=http://localhost:8081

:: Build frontend
echo 📦 Building frontend...
cd temp-sulabh-frontend
call npm install
if errorlevel 1 goto error
call npm run build
if errorlevel 1 goto error
cd ..

:: Copy frontend build to Spring Boot static directory
echo 📂 Copying frontend build...
xcopy /E /I /Y "temp-sulabh-frontend\dist\*" "src\main\resources\static\"
if errorlevel 1 goto error

:: Build and run Spring Boot
echo 🏗️ Building Spring Boot application...
call mvnw.cmd clean package -DskipTests
if errorlevel 1 goto error

echo ✅ Build completed successfully!
echo 🌐 Starting application...
echo Access your application at: http://localhost:8081
java -jar target\sulabh-backend-0.0.1-SNAPSHOT.jar
goto end

:error
echo ❌ Build failed!
pause
exit /b 1

:end
pause
