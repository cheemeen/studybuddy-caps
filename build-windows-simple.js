const fs = require('fs');
const path = require('path');

// Simple Windows build script that creates a basic Electron app structure
// This bypasses the complex build tools that were having issues

console.log('Creating simple Windows build for StudyBuddy...');

// Create the dist directory structure
const distDir = path.join(__dirname, 'dist');
const winDir = path.join(distDir, 'win-unpacked');

// Ensure directories exist
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

if (!fs.existsSync(winDir)) {
    fs.mkdirSync(winDir, { recursive: true });
}

// Copy essential files to the build directory
const filesToCopy = [
    'index.html',
    'app.js',
    'styles.css',
    'pwa-styles.css',
    'electron-main.js',
    'electron-preload.js',
    'electron-data-storage.js',
    'manifest.json',
    'sw.js',
    'package.json'
];

console.log('Copying application files...');

filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(winDir, file);
    
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✓ Copied ${file}`);
    } else {
        console.log(`⚠ Warning: ${file} not found`);
    }
});

// Copy icons directory if it exists
const iconsDir = path.join(__dirname, 'icons');
const destIconsDir = path.join(winDir, 'icons');

if (fs.existsSync(iconsDir)) {
    if (!fs.existsSync(destIconsDir)) {
        fs.mkdirSync(destIconsDir, { recursive: true });
    }
    
    const iconFiles = fs.readdirSync(iconsDir);
    iconFiles.forEach(file => {
        const srcPath = path.join(iconsDir, file);
        const destPath = path.join(destIconsDir, file);
        fs.copyFileSync(srcPath, destPath);
    });
    console.log('✓ Copied icons directory');
}

// Create a simple batch file to run the app
const batchContent = `@echo off
cd /d "%~dp0"
node electron-main.js
pause`;

fs.writeFileSync(path.join(winDir, 'StudyBuddy.bat'), batchContent);

// Create a simple executable launcher script
const launcherContent = `const { spawn } = require('child_process');
const path = require('path');

// Simple launcher for StudyBuddy
const electronPath = path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe');
const mainScript = path.join(__dirname, 'electron-main.js');

// Try to launch with Electron
try {
    const child = spawn(electronPath, [mainScript], {
        detached: true,
        stdio: 'ignore'
    });
    
    child.unref();
    console.log('StudyBuddy launched successfully!');
} catch (error) {
    console.error('Failed to launch StudyBuddy:', error.message);
    console.log('Please ensure Node.js and Electron are properly installed.');
}`;

fs.writeFileSync(path.join(winDir, 'launch.js'), launcherContent);

// Create package.json for the build
const buildPackageJson = {
    "name": "studybuddy-caps",
    "version": "1.0.0",
    "description": "AI-powered study assistant aligned with South African CAPS curriculum",
    "main": "electron-main.js",
    "scripts": {
        "start": "electron ."
    },
    "dependencies": {
        "electron": "^27.0.0"
    }
};

fs.writeFileSync(path.join(winDir, 'package.json'), JSON.stringify(buildPackageJson, null, 2));

console.log('✓ Windows build structure created successfully!');
console.log(`Build location: ${winDir}`);
console.log('');
console.log('Next steps:');
console.log('1. Install NSIS (Nullsoft Scriptable Install System)');
console.log('2. Run the NSIS compiler on StudyBuddy-Installer.nsi');
console.log('3. This will create StudyBuddy-CAPS-Setup.exe');
console.log('');
console.log('Note: The installer will create a proper Windows application');
console.log('that saves user data to %APPDATA%\\StudyBuddy\\');
