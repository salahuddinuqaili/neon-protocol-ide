@echo off
setlocal
echo Checking for Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is NOT installed! 
    echo Please download and install Node.js from https://nodejs.org/ 
    pause
    exit /b
)

echo Node.js found. Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo An error occurred during npm install. 
    pause
    exit /b
)

echo Dependencies installed. Starting Neon Protocol IDE on port 3001...
echo Once the server is running, you can also run "npm run electron-dev" in another window.
call npm run dev
pause
