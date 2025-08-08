const fs = require('fs');
const path = require('path');

// Script to create a Linux .deb package structure for StudyBuddy
console.log('Creating Linux .deb package for StudyBuddy CAPS...');

const debDir = path.join(__dirname, 'StudyBuddy-deb');
const debianDir = path.join(debDir, 'DEBIAN');
const binDir = path.join(debDir, 'usr', 'local', 'bin', 'studybuddy');
const applicationsDir = path.join(debDir, 'usr', 'share', 'applications');
const iconsDir = path.join(debDir, 'usr', 'share', 'icons', 'hicolor', '48x48', 'apps');

// Create directory structure
[debianDir, binDir, applicationsDir, iconsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✓ Created directory: ${path.relative(__dirname, dir)}`);
    }
});

// Create control file
const controlContent = `Package: studybuddy-caps
Version: 1.0.0
Section: education
Priority: optional
Architecture: amd64
Depends: libnss3, libatk-bridge2.0-0, libdrm2, libxss1, libgconf-2-4, libxrandr2, libasound2, libpangocairo-1.0-0, libatk1.0-0, libcairo-gobject2, libgtk-3-0, libgdk-pixbuf2.0-0
Maintainer: StudyBuddy Team <support@studybuddy.education>
Description: AI-powered study assistant aligned with South African CAPS curriculum
 StudyBuddy CAPS is a comprehensive study application designed for students
 aged 8-18, featuring camera note capture, interactive flashcards, mock exams,
 and progress tracking with gamification elements.
 .
 Key features:
  * Camera note capture with OCR
  * Interactive flashcard system
  * Mock exam generator with scoring
  * Progress tracking and gamification
  * Enhanced local data storage
  * Cross-device synchronization
Homepage: https://studybuddy.education
`;

fs.writeFileSync(path.join(debianDir, 'control'), controlContent);
console.log('✓ Created DEBIAN/control file');

// Create postinst script (post-installation)
const postinstContent = `#!/bin/bash
# Post-installation script for StudyBuddy CAPS

# Create desktop entry
cat > /usr/share/applications/studybuddy-caps.desktop << EOF
[Desktop Entry]
Name=StudyBuddy CAPS
Comment=AI-powered study assistant
Exec=/usr/local/bin/studybuddy/StudyBuddy
Icon=studybuddy-caps
Terminal=false
Type=Application
Categories=Education;Office;
StartupNotify=true
EOF

# Update desktop database
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database /usr/share/applications
fi

# Create symlink for easy command-line access
ln -sf /usr/local/bin/studybuddy/StudyBuddy /usr/local/bin/studybuddy-caps

echo "StudyBuddy CAPS installed successfully!"
echo "Launch from Applications menu or run 'studybuddy-caps' in terminal"
`;

fs.writeFileSync(path.join(debianDir, 'postinst'), postinstContent);
fs.chmodSync(path.join(debianDir, 'postinst'), 0o755);
console.log('✓ Created DEBIAN/postinst script');

// Create prerm script (pre-removal)
const prermContent = `#!/bin/bash
# Pre-removal script for StudyBuddy CAPS

# Remove symlink
rm -f /usr/local/bin/studybuddy-caps

# Remove desktop entry
rm -f /usr/share/applications/studybuddy-caps.desktop

# Update desktop database
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database /usr/share/applications
fi

echo "StudyBuddy CAPS removed successfully!"
echo "Note: User data in ~/.config/StudyBuddy/ has been preserved"
`;

fs.writeFileSync(path.join(debianDir, 'prerm'), prermContent);
fs.chmodSync(path.join(debianDir, 'prerm'), 0o755);
console.log('✓ Created DEBIAN/prerm script');

// Create desktop entry
const desktopContent = `[Desktop Entry]
Name=StudyBuddy CAPS
Comment=AI-powered study assistant aligned with South African CAPS curriculum
Exec=/usr/local/bin/studybuddy/StudyBuddy
Icon=studybuddy-caps
Terminal=false
Type=Application
Categories=Education;Office;
StartupNotify=true
Keywords=study;education;flashcards;exams;notes;learning;caps;
`;

fs.writeFileSync(path.join(applicationsDir, 'studybuddy-caps.desktop'), desktopContent);
console.log('✓ Created desktop entry');

// Copy Linux build files
const linuxBuildDir = path.join(__dirname, 'dist', 'StudyBuddy-linux-x64');
if (fs.existsSync(linuxBuildDir)) {
    console.log('✓ Found Linux build directory');
    
    // Copy all files from Linux build
    const copyRecursive = (src, dest) => {
        const stats = fs.statSync(src);
        if (stats.isDirectory()) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }
            const files = fs.readdirSync(src);
            files.forEach(file => {
                copyRecursive(path.join(src, file), path.join(dest, file));
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    };
    
    copyRecursive(linuxBuildDir, binDir);
    console.log('✓ Copied Linux application files');
    
    // Make the main executable file executable
    const executablePath = path.join(binDir, 'StudyBuddy');
    if (fs.existsSync(executablePath)) {
        fs.chmodSync(executablePath, 0o755);
        console.log('✓ Set executable permissions');
    }
} else {
    console.log('⚠ Warning: Linux build directory not found');
    console.log('Please ensure dist/StudyBuddy-linux-x64/ exists');
}

// Copy icon if available
const iconPath = path.join(__dirname, 'icons', 'icon-48x48.png');
if (fs.existsSync(iconPath)) {
    fs.copyFileSync(iconPath, path.join(iconsDir, 'studybuddy-caps.png'));
    console.log('✓ Copied application icon');
}

console.log('');
console.log('========================================');
console.log('✓ Linux .deb package structure created!');
console.log('========================================');
console.log('');
console.log('Package directory:', path.relative(__dirname, debDir));
console.log('');
console.log('To build the .deb package:');
console.log('1. Install dpkg-deb (usually pre-installed on Linux)');
console.log('2. Run: dpkg-deb --build StudyBuddy-deb StudyBuddy-CAPS-1.0.0.deb');
console.log('');
console.log('Package features:');
console.log('- Professional .deb package');
console.log('- Desktop entry and menu integration');
console.log('- Command-line access via "studybuddy-caps"');
console.log('- Enhanced local data storage');
console.log('- User data saved to ~/.config/StudyBuddy/');
console.log('- Clean uninstallation (preserves user data)');
console.log('');
console.log('The package is ready for distribution on Debian/Ubuntu systems!');
