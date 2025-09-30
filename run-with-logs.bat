@echo on
echo Starting build and deployment...
echo ==============================

echo Building with Maven...
call .\mvnw clean package -DskipTests > build.log 2>&1

echo Checking if build was successful...
if exist "target\sulabh-backend-0.0.1-SNAPSHOT.jar" (
    echo Build successful! Starting application...
    java -jar target\sulabh-backend-0.0.1-SNAPSHOT.jar
) else (
    echo Build failed! Check build.log for details.
    type build.log
    pause
)
