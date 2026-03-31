@echo off
setlocal

echo ==========================================
echo   NEON PROTOCOL IDE - Launcher
echo ==========================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is NOT installed!
    echo Downloading Node.js installer...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi' -OutFile 'node-v20.11.1-x64.msi'"
    if %errorlevel% neq 0 (
        echo Failed to download. Please install Node.js from https://nodejs.org/
        pause
        exit /b
    )
    echo Starting Node.js installer...
    msiexec /i node-v20.11.1-x64.msi /passive /norestart
    set "PATH=%PATH%;C:\Program Files\nodejs\"
    echo Node.js installed. You may need to restart this script.
)

:: Find the real node.exe path
for /f "delims=" %%i in ('where node') do set NODE_PATH=%%i
for %%i in ("%NODE_PATH%") do set NODE_DIR=%%~dpi

:: Use node.exe directly to run npm (bypasses PowerShell execution policy)
set NPM_CLI=%NODE_DIR%node_modules\npm\bin\npm-cli.js

echo Installing dependencies...
"%NODE_PATH%" "%NPM_CLI%" install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo.
    echo npm install failed. Retrying...
    "%NODE_PATH%" "%NPM_CLI%" install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo Installation failed. Please check your Node.js installation.
        pause
        exit /b
    )
)

echo.
echo ==========================================
echo   Starting Neon Protocol IDE on port 3001
echo   Open http://localhost:3001 in Chrome
echo ==========================================
echo.
"%NODE_PATH%" "%NPM_CLI%" run dev
pause
