# StudyBuddy CAPS - Cross-Platform Deployment Guide

## 🚀 Overview

StudyBuddy CAPS can be deployed as:
- **Progressive Web App (PWA)** - Works on all mobile devices and modern browsers
- **Windows Application** - Native Windows desktop app (.exe installer)
- **macOS Application** - Native macOS app (.dmg installer)
- **Linux Application** - AppImage, .deb, and .rpm packages

## 📱 Progressive Web App (PWA) Deployment

### Features
- ✅ Installable on mobile devices (iOS/Android)
- ✅ Offline functionality with service worker
- ✅ Native-like experience
- ✅ Push notifications support
- ✅ App shortcuts and icons

### Deployment Steps
1. **Host the files** on any web server (Netlify, Vercel, GitHub Pages, etc.)
2. **HTTPS required** - PWAs require secure connections
3. **Users can install** by visiting the website and clicking "Install App"

### Testing PWA Locally
```bash
# Start local server
python -m http.server 8080

# Visit http://localhost:8080
# Open browser DevTools > Application > Manifest to verify PWA setup
```

## 🖥️ Desktop Applications (Electron)

### Prerequisites
```bash
# Install Node.js dependencies
npm install

# Install Electron dependencies
npm install electron electron-builder --save-dev
```

### Development Mode
```bash
# Run in development mode
npm run electron-dev
```

### Building Applications

#### Windows Applications
```bash
# Build Windows installer (.exe)
npm run build-win

# Output: dist/StudyBuddy CAPS Setup 1.0.0.exe
# Output: dist/StudyBuddy CAPS 1.0.0.exe (portable)
```

#### macOS Applications
```bash
# Build macOS app (.dmg)
npm run build-mac

# Output: dist/StudyBuddy CAPS-1.0.0.dmg
# Output: dist/StudyBuddy CAPS-1.0.0-mac.zip
```

#### Linux Applications
```bash
# Build Linux packages
npm run build-linux

# Output: dist/StudyBuddy CAPS-1.0.0.AppImage
# Output: dist/studybuddy-caps_1.0.0_amd64.deb
# Output: dist/studybuddy-caps-1.0.0.x86_64.rpm
```

#### All Platforms
```bash
# Build for all platforms
npm run build-all
```

## 📁 File Structure

```
StudyBuddy/
├── index.html              # Main web app
├── app.js                   # Application logic
├── styles.css               # Main styles
├── pwa-styles.css           # PWA-specific styles
├── manifest.json            # PWA manifest
├── sw.js                    # Service worker
├── electron-main.js         # Electron main process
├── electron-preload.js      # Electron preload script
├── package.json             # Dependencies and build config
├── icons/                   # App icons (various sizes)
└── dist/                    # Built applications
```

## 🎯 Distribution Options

### 1. Web Deployment
- **Netlify**: Drag & drop deployment
- **Vercel**: GitHub integration
- **GitHub Pages**: Free hosting
- **Firebase Hosting**: Google's platform

### 2. Desktop Distribution
- **Windows**: Microsoft Store, direct download
- **macOS**: Mac App Store, direct download
- **Linux**: Snap Store, Flathub, direct download

### 3. Mobile Distribution
- **PWA**: Install directly from website
- **App Stores**: Convert PWA to native app using tools like PWABuilder

## 🔧 Customization

### Icons
Place icon files in the `icons/` directory:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### App Configuration
Edit `manifest.json` for PWA settings:
- App name and description
- Theme colors
- Display mode
- Shortcuts

Edit `package.json` for Electron settings:
- App ID and product name
- Build targets
- Icon paths

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Run web version locally
python -m http.server 8080

# Run Electron version
npm run electron

# Build Windows app
npm run build-win

# Build all platforms
npm run build-all
```

## 📱 Mobile Installation

### iOS
1. Open Safari and visit the StudyBuddy website
2. Tap the Share button
3. Select "Add to Home Screen"
4. App will install like a native app

### Android
1. Open Chrome and visit the StudyBuddy website
2. Tap the menu button (three dots)
3. Select "Add to Home screen" or "Install app"
4. App will install like a native app

## 🔒 Security Notes

- PWA requires HTTPS in production
- Electron apps are code-signed for security
- Service worker caches resources for offline use
- No sensitive data is stored locally without encryption

## 🎓 CAPS Curriculum Features

All deployment methods include:
- ✅ South African CAPS curriculum alignment
- ✅ Grade-specific content (Grades 3-12)
- ✅ AI-powered study assistance
- ✅ Offline functionality
- ✅ Cross-platform compatibility

## 📞 Support

For deployment issues or questions:
- Email: support@studybuddy.co.za
- Documentation: https://studybuddy.co.za/docs
- Issues: GitHub repository issues section
