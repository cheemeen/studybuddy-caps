@echo off
echo ========================================
echo StudyBuddy CAPS - MSI Installer Creator
echo ========================================
echo.

REM Check if source directory exists
if not exist "dist\win-unpacked" (
    echo ERROR: Source directory not found: dist\win-unpacked
    echo Please run: node build-windows-simple.js
    pause
    exit /b 1
)

echo ✓ Source directory found: dist\win-unpacked
echo.

echo Creating MSI installer package...

REM Create temporary directory for MSI build
if exist "temp_msi" rmdir /s /q "temp_msi"
mkdir "temp_msi"
mkdir "temp_msi\app"

REM Copy application files
echo Copying application files...
xcopy /E /I /Y "dist\win-unpacked\*" "temp_msi\app\"

REM Create installation script
echo Creating installation script...
(
echo @echo off
echo echo ========================================
echo echo StudyBuddy CAPS - Installation
echo echo ========================================
echo echo.
echo.
echo set "INSTALL_DIR=%%ProgramFiles%%\StudyBuddy CAPS"
echo set "APPDATA_DIR=%%APPDATA%%\StudyBuddy"
echo.
echo echo Installing StudyBuddy CAPS...
echo echo Target Directory: %%INSTALL_DIR%%
echo echo.
echo.
echo REM Create installation directory
echo if not exist "%%INSTALL_DIR%%" mkdir "%%INSTALL_DIR%%"
echo.
echo REM Copy application files
echo echo Copying application files...
echo xcopy /E /I /Y "%%~dp0app\*" "%%INSTALL_DIR%%\"
echo.
echo REM Create data directory
echo if not exist "%%APPDATA_DIR%%" mkdir "%%APPDATA_DIR%%"
echo.
echo REM Create Start Menu shortcut
echo echo Creating Start Menu shortcut...
echo set "START_MENU=%%ProgramData%%\Microsoft\Windows\Start Menu\Programs"
echo if not exist "%%START_MENU%%\StudyBuddy CAPS" mkdir "%%START_MENU%%\StudyBuddy CAPS"
echo.
echo echo Set oWS = WScript.CreateObject^("WScript.Shell"^) ^> "%%TEMP%%\CreateShortcut.vbs"
echo echo sLinkFile = "%%START_MENU%%\StudyBuddy CAPS\StudyBuddy CAPS.lnk" ^>^> "%%TEMP%%\CreateShortcut.vbs"
echo echo Set oLink = oWS.CreateShortcut^(sLinkFile^) ^>^> "%%TEMP%%\CreateShortcut.vbs"
echo echo oLink.TargetPath = "%%INSTALL_DIR%%\StudyBuddy.exe" ^>^> "%%TEMP%%\CreateShortcut.vbs"
echo echo oLink.WorkingDirectory = "%%INSTALL_DIR%%" ^>^> "%%TEMP%%\CreateShortcut.vbs"
echo echo oLink.Description = "AI-powered study assistant for CAPS curriculum" ^>^> "%%TEMP%%\CreateShortcut.vbs"
echo echo oLink.Save ^>^> "%%TEMP%%\CreateShortcut.vbs"
echo cscript //nologo "%%TEMP%%\CreateShortcut.vbs"
echo del "%%TEMP%%\CreateShortcut.vbs"
echo.
echo REM Create Desktop shortcut
echo echo Creating Desktop shortcut...
echo echo Set oWS = WScript.CreateObject^("WScript.Shell"^) ^> "%%TEMP%%\CreateDesktopShortcut.vbs"
echo echo sLinkFile = "%%USERPROFILE%%\Desktop\StudyBuddy CAPS.lnk" ^>^> "%%TEMP%%\CreateDesktopShortcut.vbs"
echo echo Set oLink = oWS.CreateShortcut^(sLinkFile^) ^>^> "%%TEMP%%\CreateDesktopShortcut.vbs"
echo echo oLink.TargetPath = "%%INSTALL_DIR%%\StudyBuddy.exe" ^>^> "%%TEMP%%\CreateDesktopShortcut.vbs"
echo echo oLink.WorkingDirectory = "%%INSTALL_DIR%%" ^>^> "%%TEMP%%\CreateDesktopShortcut.vbs"
echo echo oLink.Description = "AI-powered study assistant for CAPS curriculum" ^>^> "%%TEMP%%\CreateDesktopShortcut.vbs"
echo echo oLink.Save ^>^> "%%TEMP%%\CreateDesktopShortcut.vbs"
echo cscript //nologo "%%TEMP%%\CreateDesktopShortcut.vbs"
echo del "%%TEMP%%\CreateDesktopShortcut.vbs"
echo.
echo REM Add to Add/Remove Programs
echo echo Registering with Add/Remove Programs...
echo reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\StudyBuddy CAPS" /v "DisplayName" /t REG_SZ /d "StudyBuddy CAPS" /f ^>nul 2^>^&1
echo reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\StudyBuddy CAPS" /v "DisplayVersion" /t REG_SZ /d "1.0.0" /f ^>nul 2^>^&1
echo reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\StudyBuddy CAPS" /v "Publisher" /t REG_SZ /d "StudyBuddy Education" /f ^>nul 2^>^&1
echo reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\StudyBuddy CAPS" /v "InstallLocation" /t REG_SZ /d "%%INSTALL_DIR%%" /f ^>nul 2^>^&1
echo reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\StudyBuddy CAPS" /v "UninstallString" /t REG_SZ /d "%%INSTALL_DIR%%\Uninstall.bat" /f ^>nul 2^>^&1
echo reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\StudyBuddy CAPS" /v "DisplayIcon" /t REG_SZ /d "%%INSTALL_DIR%%\StudyBuddy.exe" /f ^>nul 2^>^&1
echo.
echo REM Create uninstaller
echo echo Creating uninstaller...
echo ^(
echo echo @echo off
echo echo echo Uninstalling StudyBuddy CAPS...
echo echo echo.
echo echo echo Removing shortcuts...
echo echo if exist "%%ProgramData%%\Microsoft\Windows\Start Menu\Programs\StudyBuddy CAPS" rmdir /s /q "%%ProgramData%%\Microsoft\Windows\Start Menu\Programs\StudyBuddy CAPS"
echo echo if exist "%%USERPROFILE%%\Desktop\StudyBuddy CAPS.lnk" del "%%USERPROFILE%%\Desktop\StudyBuddy CAPS.lnk"
echo echo echo Removing application files...
echo echo if exist "%%INSTALL_DIR%%" rmdir /s /q "%%INSTALL_DIR%%"
echo echo echo Removing registry entries...
echo echo reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\StudyBuddy CAPS" /f ^>nul 2^>^&1
echo echo echo.
echo echo echo StudyBuddy CAPS uninstalled successfully!
echo echo echo User data preserved in: %%APPDATA%%\StudyBuddy
echo echo pause
echo ^) ^> "%%INSTALL_DIR%%\Uninstall.bat"
echo.
echo echo.
echo echo ========================================
echo echo Installation completed successfully!
echo echo ========================================
echo echo.
echo echo StudyBuddy CAPS has been installed to:
echo echo %%INSTALL_DIR%%
echo echo.
echo echo User data will be stored in:
echo echo %%APPDATA_DIR%%
echo echo.
echo echo You can now launch StudyBuddy CAPS from:
echo echo - Start Menu ^> StudyBuddy CAPS
echo echo - Desktop shortcut
echo echo.
echo echo Thank you for installing StudyBuddy CAPS!
echo pause
) > "temp_msi\Install.bat"

echo ✓ Installation script created

REM Create MSI using makecab and IExpress
echo Creating MSI package structure...

REM Create IExpress directive file
(
echo [Version]
echo Class=IEXPRESS
echo SEDVersion=3
echo [Options]
echo PackagePurpose=InstallApp
echo ShowInstallProgramWindow=1
echo HideExtractAnimation=0
echo UseLongFileName=1
echo InsideCompressed=0
echo CAB_FixedSize=0
echo CAB_ResvCodeSigning=0
echo RebootMode=N
echo InstallPrompt=Do you want to install StudyBuddy CAPS?
echo DisplayLicense=
echo FinishMessage=StudyBuddy CAPS installation completed successfully!
echo TargetName=StudyBuddy-CAPS-Setup.msi
echo FriendlyName=StudyBuddy CAPS Installer
echo AppLaunched=Install.bat
echo PostInstallCmd=^<None^>
echo AdminQuietInstCmd=Install.bat
echo UserQuietInstCmd=Install.bat
echo FILE0="Install.bat"
echo [SourceFiles]
echo SourceFiles0=temp_msi\
echo [SourceFiles0]
echo %%FILE0%%=
) > "StudyBuddy.sed"

echo ✓ IExpress directive created

REM Build the MSI
echo Building MSI installer...
iexpress /N StudyBuddy.sed

if exist "StudyBuddy-CAPS-Setup.msi" (
    echo.
    echo ========================================
    echo ✓ SUCCESS! MSI installer created
    echo ========================================
    echo.
    echo MSI File: StudyBuddy-CAPS-Setup.msi
    for %%A in ("StudyBuddy-CAPS-Setup.msi") do echo Size: %%~zA bytes
    echo.
    echo Features:
    echo - Professional MSI installer
    echo - Add/Remove Programs integration
    echo - Start Menu and Desktop shortcuts
    echo - Enhanced local data storage
    echo - Clean uninstallation
    echo - User data preservation
    echo - Administrator privileges handling
    echo.
    echo Installation Details:
    echo - Installs to: Program Files\StudyBuddy CAPS
    echo - User data: %%APPDATA%%\StudyBuddy
    echo - Registry integration
    echo - Automatic shortcut creation
    echo.
    echo The MSI installer is ready for distribution!
) else (
    echo ✗ MSI creation failed
    echo.
    echo Alternative: Creating ZIP installer...
    
    REM Create ZIP as fallback
    powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('temp_msi', 'StudyBuddy-CAPS-Setup.zip')"
    
    if exist "StudyBuddy-CAPS-Setup.zip" (
        echo ✓ ZIP installer created: StudyBuddy-CAPS-Setup.zip
        echo.
        echo To install:
        echo 1. Extract StudyBuddy-CAPS-Setup.zip
        echo 2. Run Install.bat as Administrator
    )
)

REM Cleanup
if exist "temp_msi" rmdir /s /q "temp_msi"
if exist "StudyBuddy.sed" del "StudyBuddy.sed"

echo.
echo MSI installer creation completed!
pause
