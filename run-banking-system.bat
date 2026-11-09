@echo off
setlocal
cd /d "%~dp0"

echo ===================================================================
echo   Banking Management System - Launch Script
echo ===================================================================

REM 1. Configure Java 21 environment
set "JAVA_HOME=%~dp0.jdk\jdk-21.0.5+11"
set "PATH=%JAVA_HOME%\bin;%PATH%"

REM 2. Ensure MySQL (XAMPP) is running on port 8081
echo Checking MySQL database...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo MySQL is already running.
) else (
    echo Starting MySQL from C:\xampp\mysql...
    start "" /b "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
    timeout /t 3 /nobreak >nul
)

REM 3. Run Spring Boot application
echo Starting Banking Management System...
echo Access Portal: http://localhost:8080
echo.
cd Banking-sysytem
call .\mvnw.cmd spring-boot:run

pause

