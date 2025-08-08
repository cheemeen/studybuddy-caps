@echo off
echo ========================================
echo StudyBuddy CAPS - Windows Installer Builder
echo ========================================
echo.

REM Check if NSIS is installed
where makensis >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: NSIS is not installed or not in PATH
    echo.
    echo Please download and install NSIS from:
    echo https://nsis.sourceforge.io/Download
    echo.
    echo After installation, add NSIS to your PATH or run this script from the NSIS directory.
    pause
    exit /b 1
)

echo ✓ NSIS found in PATH
echo.

REM Check if the build directory exists
if not exist "dist\win-unpacked" (
    echo ERROR: Windows build directory not found
    echo Please run: node build-windows-simple.js
    echo.
    pause
    exit /b 1
)

echo ✓ Windows build directory found
echo.

REM Build the installer
echo Building Windows installer...
makensis StudyBuddy-Installer.nsi

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✓ SUCCESS! Windows installer created
    echo ========================================
    echo.
    echo Installer file: StudyBuddy-CAPS-Setup.exe
    echo.
    echo Features:
    echo - Professional Windows installer
    echo - Automatic uninstaller creation
    echo - Start Menu and Desktop shortcuts
    echo - Add/Remove Programs integration
    echo - Enhanced local data storage
    echo - User data saved to %%APPDATA%%\StudyBuddy\
    echo.
    echo The installer is ready for distribution!
) else (
    echo.
    echo ========================================
    echo ✗ ERROR: Failed to build installer
    echo ========================================
    echo.
    echo Please check the NSIS script for errors.
)

echo.
pause
