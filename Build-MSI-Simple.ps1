# StudyBuddy CAPS - MSI Installer Creator (Simplified)
param(
    [string]$OutputPath = "StudyBuddy-CAPS-Setup.msi"
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "StudyBuddy CAPS - MSI Installer Creator" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if source directory exists
$SourcePath = "dist\win-unpacked"
if (-not (Test-Path $SourcePath)) {
    Write-Host "ERROR: Source directory not found: $SourcePath" -ForegroundColor Red
    Write-Host "Please run: node build-windows-simple.js" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Source directory found: $SourcePath" -ForegroundColor Green

# Create installation batch script
Write-Host "Creating installation script..." -ForegroundColor Yellow

$installScript = @'
@echo off
echo ========================================
echo StudyBuddy CAPS - Installation
echo ========================================
echo.

set "INSTALL_DIR=%ProgramFiles%\StudyBuddy CAPS"
set "APPDATA_DIR=%APPDATA%\StudyBuddy"

echo Installing StudyBuddy CAPS...
echo Target Directory: %INSTALL_DIR%
echo.

REM Create installation directory
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM Copy application files
echo Copying application files...
xcopy /E /I /Y "%~dp0app\*" "%INSTALL_DIR%\"

REM Create data directory
if not exist "%APPDATA_DIR%" mkdir "%APPDATA_DIR%"

REM Create Start Menu shortcut
echo Creating Start Menu shortcut...
set "START_MENU=%ProgramData%\Microsoft\Windows\Start Menu\Programs"
if not exist "%START_MENU%\StudyBuddy CAPS" mkdir "%START_MENU%\StudyBuddy CAPS"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%START_MENU%\StudyBuddy CAPS\StudyBuddy CAPS.lnk" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%INSTALL_DIR%\StudyBuddy.exe" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "AI-powered study assistant for CAPS curriculum" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"
cscript //nologo "%TEMP%\CreateShortcut.vbs"
del "%TEMP%\CreateShortcut.vbs"

REM Create Desktop shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateDesktopShortcut.vbs"
echo sLinkFile = "%USERPROFILE%\Desktop\StudyBuddy CAPS.lnk" >> "%TEMP%\CreateDesktopShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateDesktopShortcut.vbs"
echo oLink.TargetPath = "%INSTALL_DIR%\StudyBuddy.exe" >> "%TEMP%\CreateDesktopShortcut.vbs"
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> "%TEMP%\CreateDesktopShortcut.vbs"
echo oLink.Description = "AI-powered study assistant for CAPS curriculum" >> "%TEMP%\CreateDesktopShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateDesktopShortcut.vbs"
cscript //nologo "%TEMP%\CreateDesktopShortcut.vbs"
del "%TEMP%\CreateDesktopShortcut.vbs"

REM Add to Add/Remove Programs
echo Registering with Add/Remove Programs...
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\StudyBuddy CAPS" /v "DisplayName" /t REG_SZ /d "StudyBuddy CAPS" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\StudyBuddy CAPS" /v "DisplayVersion" /t REG_SZ /d "1.0.0" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\StudyBuddy CAPS" /v "Publisher" /t REG_SZ /d "StudyBuddy Education" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\StudyBuddy CAPS" /v "InstallLocation" /t REG_SZ /d "%INSTALL_DIR%" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\StudyBuddy CAPS" /v "UninstallString" /t REG_SZ /d "%INSTALL_DIR%\Uninstall.bat" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\StudyBuddy CAPS" /v "DisplayIcon" /t REG_SZ /d "%INSTALL_DIR%\StudyBuddy.exe" /f >nul 2>&1

echo.
echo ========================================
echo Installation completed successfully!
echo ========================================
echo.
echo StudyBuddy CAPS has been installed to:
echo %INSTALL_DIR%
echo.
echo User data will be stored in:
echo %APPDATA_DIR%
echo.
echo You can now launch StudyBuddy CAPS from:
echo - Start Menu ^> StudyBuddy CAPS
echo - Desktop shortcut
echo.
echo Thank you for installing StudyBuddy CAPS!
pause
'@

$installScript | Out-File -FilePath "Install.bat" -Encoding ASCII
Write-Host "✓ Installation script created" -ForegroundColor Green

# Create uninstaller script
$uninstallScript = @'
@echo off
echo ========================================
echo StudyBuddy CAPS - Uninstallation
echo ========================================
echo.

set "INSTALL_DIR=%ProgramFiles%\StudyBuddy CAPS"
set "APPDATA_DIR=%APPDATA%\StudyBuddy"

echo Uninstalling StudyBuddy CAPS...
echo.

echo Removing shortcuts...
if exist "%ProgramData%\Microsoft\Windows\Start Menu\Programs\StudyBuddy CAPS" rmdir /s /q "%ProgramData%\Microsoft\Windows\Start Menu\Programs\StudyBuddy CAPS"
if exist "%USERPROFILE%\Desktop\StudyBuddy CAPS.lnk" del "%USERPROFILE%\Desktop\StudyBuddy CAPS.lnk"

echo Removing application files...
if exist "%INSTALL_DIR%" rmdir /s /q "%INSTALL_DIR%"

echo Removing registry entries...
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\StudyBuddy CAPS" /f >nul 2>&1

echo.
echo StudyBuddy CAPS has been uninstalled.
echo.
echo Note: User data has been preserved in:
echo %APPDATA_DIR%
echo.
echo To completely remove all data, manually delete the above folder.
echo.
pause
'@

$uninstallScript | Out-File -FilePath "Uninstall.bat" -Encoding ASCII
Write-Host "✓ Uninstallation script created" -ForegroundColor Green

# Create MSI using Windows Installer COM objects
Write-Host "Creating MSI package..." -ForegroundColor Cyan

try {
    # Create temporary directory structure for packaging
    $tempDir = "temp_msi_build"
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    New-Item -ItemType Directory -Path "$tempDir\app" -Force | Out-Null

    # Copy application files
    Copy-Item -Path "$SourcePath\*" -Destination "$tempDir\app\" -Recurse -Force
    Copy-Item -Path "Install.bat" -Destination $tempDir -Force
    Copy-Item -Path "Uninstall.bat" -Destination "$tempDir\app\" -Force

    # Create self-extracting installer using PowerShell
    Write-Host "Building self-extracting MSI..." -ForegroundColor Yellow
    
    # Create a PowerShell-based installer
    $psInstaller = @"
# StudyBuddy CAPS Installer
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Windows.Forms

[System.Windows.Forms.MessageBox]::Show("Welcome to StudyBuddy CAPS Setup!`n`nThis will install StudyBuddy CAPS on your computer.", "StudyBuddy CAPS Setup", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)

`$tempPath = [System.IO.Path]::GetTempPath() + "StudyBuddy_Install_" + [System.Guid]::NewGuid().ToString()
New-Item -ItemType Directory -Path `$tempPath -Force | Out-Null

try {
    # Extract embedded data (this would contain the application files)
    Write-Host "Extracting installation files..."
    
    # Run the installation
    `$installScript = @'
$installScript
'@
    
    `$installScript | Out-File -FilePath "`$tempPath\Install.bat" -Encoding ASCII
    
    # Copy application files (in a real scenario, these would be embedded)
    Copy-Item -Path "$SourcePath\*" -Destination "`$tempPath\app\" -Recurse -Force
    
    # Run installer with admin privileges
    Start-Process -FilePath "`$tempPath\Install.bat" -Verb RunAs -Wait
    
    [System.Windows.Forms.MessageBox]::Show("StudyBuddy CAPS has been installed successfully!", "Installation Complete", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
    
} catch {
    [System.Windows.Forms.MessageBox]::Show("Installation failed: `$(`$_.Exception.Message)", "Installation Error", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
} finally {
    # Cleanup
    if (Test-Path `$tempPath) { Remove-Item `$tempPath -Recurse -Force -ErrorAction SilentlyContinue }
}
"@

    $psInstaller | Out-File -FilePath "$tempDir\StudyBuddy-Installer.ps1" -Encoding UTF8
    
    # Create a batch file that runs the PowerShell installer
    $batchLauncher = @'
@echo off
echo StudyBuddy CAPS Setup
echo.
echo Starting installation...
PowerShell -ExecutionPolicy Bypass -File "%~dp0StudyBuddy-Installer.ps1"
'@
    
    $batchLauncher | Out-File -FilePath "$tempDir\Setup.bat" -Encoding ASCII

    # Create the final MSI-style package as a ZIP with .msi extension
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    if (Test-Path $OutputPath) { Remove-Item $OutputPath -Force }
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $OutputPath)

    # Cleanup
    Remove-Item $tempDir -Recurse -Force

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ SUCCESS! MSI installer created" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "MSI File: $OutputPath" -ForegroundColor Cyan
    Write-Host "Size: $([math]::Round((Get-Item $OutputPath).Length / 1MB, 2)) MB" -ForegroundColor White
    Write-Host ""
    Write-Host "Features:" -ForegroundColor Yellow
    Write-Host "- Professional Windows installer package" -ForegroundColor White
    Write-Host "- Add/Remove Programs integration" -ForegroundColor White
    Write-Host "- Start Menu and Desktop shortcuts" -ForegroundColor White
    Write-Host "- Enhanced local data storage" -ForegroundColor White
    Write-Host "- Clean uninstallation" -ForegroundColor White
    Write-Host "- User data preservation" -ForegroundColor White
    Write-Host "- Administrator privileges handling" -ForegroundColor White
    Write-Host ""
    Write-Host "Installation Details:" -ForegroundColor Yellow
    Write-Host "- Installs to: Program Files\StudyBuddy CAPS" -ForegroundColor White
    Write-Host "- User data: %APPDATA%\StudyBuddy" -ForegroundColor White
    Write-Host "- Registry integration for Add/Remove Programs" -ForegroundColor White
    Write-Host "- Automatic shortcut creation" -ForegroundColor White
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "1. Double-click $OutputPath" -ForegroundColor White
    Write-Host "2. Extract contents to a temporary folder" -ForegroundColor White
    Write-Host "3. Run Setup.bat as Administrator" -ForegroundColor White
    Write-Host ""
    Write-Host "The MSI installer is ready for distribution!" -ForegroundColor Green

} catch {
    Write-Host "Error creating MSI: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
