@echo off
echo ============================================
echo  MixMate - Auto Setup Script
echo ============================================
echo.

:: Check if Node is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org
    echo Choose the LTS version.
    pause
    exit /b 1
)

echo [1/4] Node.js found:
node --version

echo.
echo [2/4] Cleaning old install...
if exist node_modules (
    rmdir /s /q node_modules
    echo Removed node_modules
)
if exist package-lock.json (
    del package-lock.json
    echo Removed package-lock.json
)

echo.
echo [3/4] Installing packages (this takes 2-4 minutes)...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo.
    echo ERROR: npm install failed. Check your internet connection and try again.
    pause
    exit /b 1
)

echo.
echo [4/4] Starting Expo...
echo.
echo ============================================
echo  SUCCESS! Expo is starting...
echo  Open Expo Go on your phone and scan the QR code
echo  Make sure your phone and PC are on the same WiFi
echo ============================================
echo.
call npx expo start

pause
