# StudyBuddy CAPS - MSI Installer Builder
# This script creates a professional MSI installer for Windows

param(
    [string]$OutputPath = "StudyBuddy-CAPS-Setup.msi",
    [string]$SourcePath = "dist\win-unpacked"
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "StudyBuddy CAPS - MSI Installer Builder" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if source directory exists
if (-not (Test-Path $SourcePath)) {
    Write-Host "ERROR: Source directory not found: $SourcePath" -ForegroundColor Red
    Write-Host "Please run: node build-windows-simple.js" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Source directory found: $SourcePath" -ForegroundColor Green

# Check for WiX Toolset
$wixPath = Get-Command "candle.exe" -ErrorAction SilentlyContinue
if (-not $wixPath) {
    Write-Host ""
    Write-Host "WiX Toolset not found. Installing via Chocolatey..." -ForegroundColor Yellow
    
    # Check if Chocolatey is installed
    $chocoPath = Get-Command "choco" -ErrorAction SilentlyContinue
    if (-not $chocoPath) {
        Write-Host ""
        Write-Host "Installing Chocolatey package manager..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    }
    
    Write-Host "Installing WiX Toolset..." -ForegroundColor Yellow
    choco install wixtoolset -y
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Check again
    $wixPath = Get-Command "candle.exe" -ErrorAction SilentlyContinue
    if (-not $wixPath) {
        Write-Host ""
        Write-Host "WiX installation failed. Using alternative MSI creation method..." -ForegroundColor Yellow
        
        # Alternative: Create MSI using Windows Installer COM
        Write-Host "Creating MSI using Windows Installer COM objects..." -ForegroundColor Cyan
        
        try {
            # Create Windows Installer object
            $installer = New-Object -ComObject WindowsInstaller.Installer
            $database = $installer.GetType().InvokeMember("CreateDatabase", "InvokeMethod", $null, $installer, @($OutputPath, 0))
            
            # Create basic MSI structure
            $view = $database.GetType().InvokeMember("OpenView", "InvokeMethod", $null, $database, @("CREATE TABLE Property (Property CHAR(72) NOT NULL, Value LONGCHAR NOT NULL PRIMARY KEY Property)"))
            $view.GetType().InvokeMember("Execute", "InvokeMethod", $null, $view, $null)
            
            # Add product properties
            $properties = @{
                "ProductName" = "StudyBuddy CAPS"
                "ProductVersion" = "1.0.0"
                "Manufacturer" = "StudyBuddy Education"
                "ProductCode" = "{" + [System.Guid]::NewGuid().ToString().ToUpper() + "}"
                "UpgradeCode" = "{12345678-1234-1234-1234-123456789012}"
                "ARPPRODUCTICON" = "StudyBuddy.exe"
                "ARPHELPLINK" = "https://studybuddy.education"
                "ARPURLINFOABOUT" = "https://studybuddy.education"
            }
            
            foreach ($prop in $properties.GetEnumerator()) {
                $view = $database.GetType().InvokeMember("OpenView", "InvokeMethod", $null, $database, @("INSERT INTO Property (Property, Value) VALUES ('$($prop.Key)', '$($prop.Value)')"))
                $view.GetType().InvokeMember("Execute", "InvokeMethod", $null, $view, $null)
            }
            
            # Commit changes
            $database.GetType().InvokeMember("Commit", "InvokeMethod", $null, $database, $null)
            
            Write-Host "✓ Basic MSI structure created" -ForegroundColor Green
            Write-Host ""
            Write-Host "Note: This is a basic MSI. For full functionality, WiX Toolset is recommended." -ForegroundColor Yellow
            
        } catch {
            Write-Host "Failed to create MSI using COM objects: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
            Write-Host "Alternative: Creating Advanced Installer project..." -ForegroundColor Cyan
            
            # Create Advanced Installer project file
            $aiProject = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<DOCUMENT Type="Advanced Installer" CreateVersion="19.0" version="19.0" Modules="simple" RootPath="." Language="en" Id="{12345678-1234-1234-1234-123456789012}">
  <COMPONENT cid="caphyon.advinst.msicomp.ProjectOptionsComponent">
    <ROW Name="HiddenItems" Value="AppXProductDetailsComponent;AppXDependenciesComponent;AppXAppDetailsComponent;AppXVisualAssetsComponent;AppXCapabilitiesComponent;AppXAppDeclarationsComponent;AppXUriRulesComponent"/>
  </COMPONENT>
  <COMPONENT cid="caphyon.advinst.msicomp.MsiPropsComponent">
    <ROW Property="ProductName" Value="StudyBuddy CAPS"/>
    <ROW Property="ProductVersion" Value="1.0.0"/>
    <ROW Property="Manufacturer" Value="StudyBuddy Education"/>
    <ROW Property="ProductCode" Value="{12345678-1234-1234-1234-123456789012}"/>
    <ROW Property="ARPPRODUCTICON" Value="StudyBuddy.exe"/>
    <ROW Property="SecureCustomProperties" Value="OLDPRODUCTS;AI_NEWERPRODUCTFOUND"/>
  </COMPONENT>
  <COMPONENT cid="caphyon.advinst.msicomp.MsiDirsComponent">
    <ROW Directory="APPDIR" Directory_Parent="TARGETDIR" DefaultDir="APPDIR:." IsPseudoRoot="1"/>
    <ROW Directory="DesktopFolder" Directory_Parent="TARGETDIR" DefaultDir="DESKTO~1|DesktopFolder" IsPseudoRoot="1"/>
    <ROW Directory="ProgramMenuFolder" Directory_Parent="TARGETDIR" DefaultDir="PROGRA~1|ProgramMenuFolder" IsPseudoRoot="1"/>
    <ROW Directory="SHORTCUTDIR" Directory_Parent="ProgramMenuFolder" DefaultDir="SHORTC~1|StudyBuddy CAPS"/>
    <ROW Directory="TARGETDIR" DefaultDir="SourceDir"/>
  </COMPONENT>
</DOCUMENT>
"@
            
            $aiProject | Out-File -FilePath "StudyBuddy-CAPS.aip" -Encoding UTF8
            Write-Host "✓ Advanced Installer project created: StudyBuddy-CAPS.aip" -ForegroundColor Green
            Write-Host ""
            Write-Host "To build MSI:" -ForegroundColor Cyan
            Write-Host "1. Install Advanced Installer (free version available)" -ForegroundColor White
            Write-Host "2. Open StudyBuddy-CAPS.aip" -ForegroundColor White
            Write-Host "3. Add files from $SourcePath" -ForegroundColor White
            Write-Host "4. Build the MSI" -ForegroundColor White
        }
        
        return
    }
}

Write-Host "✓ WiX Toolset found" -ForegroundColor Green

# Create license RTF file for WiX
$licenseRtf = @"
{\rtf1\ansi\deff0 {\fonttbl {\f0 Times New Roman;}}
\f0\fs24
MIT License

Copyright (c) 2024 StudyBuddy Education

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
}
"@

$licenseRtf | Out-File -FilePath "License.rtf" -Encoding ASCII
Write-Host "✓ License file created" -ForegroundColor Green

# Build MSI using WiX
Write-Host ""
Write-Host "Building MSI installer..." -ForegroundColor Cyan

try {
    # Compile WiX source
    Write-Host "Compiling WiX source..." -ForegroundColor Yellow
    & candle.exe StudyBuddy.wxs -out StudyBuddy.wixobj
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ WiX compilation successful" -ForegroundColor Green
        
        # Link to create MSI
        Write-Host "Linking MSI..." -ForegroundColor Yellow
        & light.exe StudyBuddy.wixobj -out $OutputPath -ext WixUIExtension
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "✓ SUCCESS! MSI installer created" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "MSI File: $OutputPath" -ForegroundColor Cyan
            Write-Host "Size: $((Get-Item $OutputPath).Length / 1MB) MB" -ForegroundColor White
            Write-Host ""
            Write-Host "Features:" -ForegroundColor Yellow
            Write-Host "- Professional MSI installer" -ForegroundColor White
            Write-Host "- Windows Installer integration" -ForegroundColor White
            Write-Host "- Add/Remove Programs support" -ForegroundColor White
            Write-Host "- Start Menu and Desktop shortcuts" -ForegroundColor White
            Write-Host "- Enhanced local data storage" -ForegroundColor White
            Write-Host "- Enterprise deployment ready" -ForegroundColor White
            Write-Host "- Group Policy compatible" -ForegroundColor White
            Write-Host ""
            Write-Host "The MSI installer is ready for distribution!" -ForegroundColor Green
        } else {
            Write-Host "✗ MSI linking failed" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ WiX compilation failed" -ForegroundColor Red
    }
} catch {
    Write-Host "Error building MSI: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
