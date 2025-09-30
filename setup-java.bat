@echo off
echo Step 1: Setting JAVA_HOME...
set "JAVA_HOME=C:\Program Files\Java\jdk-21"
echo JAVA_HOME is now: %JAVA_HOME%
pause

echo Step 2: Adding Java to PATH...
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo Added Java to PATH
pause

echo Step 3: Verifying Java version...
java -version
pause

echo Step 4: Verifying Java compiler version...
javac -version
pause

echo All steps completed. You can now run your Spring Boot application with:
echo .\mvnw.cmd spring-boot:run
pause
