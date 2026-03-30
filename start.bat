@echo off
setlocal
echo Checking for Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is NOT installed! 
    echo Downloading Node.js (this may take a moment)...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi' -OutFile 'node-v20.11.1-x64.msi'"
    if %errorlevel% neq 0 (
        echo Failed to download Node.js automatically.
        echo Please download and install Node.js from https://nodejs.org/ 
        pause
        exit /b
    )
    echo Starting Node.js installer...
    msiexec /i node-v20.11.1-x64.msi /passive /norestart
    if %errorlevel% neq 0 (
        echo Failed to install Node.js automatically.
        echo Please follow the Node.js installation wizard.
        start node-v20.11.1-x64.msi
        pause
        exit /b
    )
    echo Node.js installed. Refreshing environment variables...
    set "PATH=%PATH%;C:\Program Files\nodejs\"
    echo Please restart this terminal or script if npm is still not found.
)

echo Node.js found. Installing dependencies...
echo (If you see a PowerShell security error, try running this script as Administrator.)
call npm.cmd install --legacy-peer-deps

if %errorlevel% neq 0 (
    echo An error occurred during npm install. 
    echo Trying fallback to bypass PowerShell script execution policy...
    call npm.cmd install --legacy-peer-deps --scripts-prepend-node-path=true
    if %errorlevel% neq 0 (
        echo Still failing. Please check your npm installation.
        pause
        exit /b
    )
)

echo Dependencies installed. Starting Neon Protocol IDE on port 3001...
echo Once the server is running, you can also run "npm run electron-dev" in another window.
call npm.cmd run dev
pause
