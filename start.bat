@echo off
echo Setting up environment...
set "JAVA_HOME=C:\Program Files\Java\jdk-21"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Checking Java version...
java -version

echo Starting Spring Boot application...
call mvnw.cmd clean spring-boot:run
