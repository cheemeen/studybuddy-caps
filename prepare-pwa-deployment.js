const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('StudyBuddy CAPS - PWA Deployment Prep');
console.log('========================================');
console.log('');

// Create deployment directory
const deployDir = 'studybuddy-pwa-deploy';
if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });

console.log('✓ Created deployment directory:', deployDir);

// Files to deploy for PWA
const filesToDeploy = [
    'index.html',
    'app.js',
    'styles.css',
    'pwa-styles.css',
    'manifest.json',
    'sw.js'
];

// Copy main files
console.log('');
console.log('Copying PWA files...');
filesToDeploy.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(deployDir, file));
        console.log(`✓ Copied ${file}`);
    } else {
        console.log(`⚠ Warning: ${file} not found`);
    }
});

// Copy icons directory
const iconsDir = 'icons';
const deployIconsDir = path.join(deployDir, 'icons');
if (fs.existsSync(iconsDir)) {
    fs.mkdirSync(deployIconsDir, { recursive: true });
    const iconFiles = fs.readdirSync(iconsDir);
    iconFiles.forEach(file => {
        fs.copyFileSync(path.join(iconsDir, file), path.join(deployIconsDir, file));
    });
    console.log(`✓ Copied icons directory (${iconFiles.length} files)`);
} else {
    console.log('⚠ Warning: icons directory not found');
}

// Create a simple README for deployment
const deployReadme = `# StudyBuddy CAPS - PWA Deployment

## Quick Deploy Instructions

### Option 1: Netlify (Recommended)
1. Go to https://netlify.com
2. Sign up for free account
3. Drag and drop this entire folder to Netlify
4. Get instant URL like: https://studybuddy-caps.netlify.app

### Option 2: Vercel
1. Go to https://vercel.com
2. Sign up for free account
3. Import this project
4. Deploy instantly

### Option 3: GitHub Pages
1. Create GitHub repository
2. Upload these files
3. Enable Pages in settings
4. Access at: https://yourusername.github.io/repo-name

## Files Included
- index.html (Main app)
- app.js (Application logic with auth fix)
- styles.css (Main styles)
- pwa-styles.css (PWA styles)
- manifest.json (PWA configuration)
- sw.js (Service worker for offline support)
- icons/ (All required PWA icons)

## PWA Features
✅ Works on all devices (mobile, tablet, desktop)
✅ Can be installed like a native app
✅ Works offline after first visit
✅ Enhanced local data storage
✅ User authentication with fixed login
✅ Cross-platform compatibility

## After Deployment
1. Visit your URL on any device
2. Look for "Add to Home Screen" or install prompt
3. Install as PWA for native app experience
4. Share URL with users

Your StudyBuddy CAPS PWA is ready for the world! 🚀
`;

fs.writeFileSync(path.join(deployDir, 'README.md'), deployReadme);
console.log('✓ Created deployment README');

// Create a simple deployment verification script
const verifyScript = `<!DOCTYPE html>
<html>
<head>
    <title>StudyBuddy CAPS - Deployment Verification</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .check { color: green; } .error { color: red; }
        .test-item { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>StudyBuddy CAPS - PWA Deployment Verification</h1>
    <div id="tests"></div>
    
    <script>
        const tests = [
            { name: 'HTTPS Check', test: () => location.protocol === 'https:' },
            { name: 'Service Worker Support', test: () => 'serviceWorker' in navigator },
            { name: 'Manifest File', test: async () => {
                try { 
                    const response = await fetch('/manifest.json');
                    return response.ok;
                } catch { return false; }
            }},
            { name: 'PWA Install Prompt', test: () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone },
            { name: 'Local Storage', test: () => typeof(Storage) !== "undefined" },
            { name: 'App Files', test: async () => {
                try {
                    const response = await fetch('/app.js');
                    return response.ok;
                } catch { return false; }
            }}
        ];
        
        async function runTests() {
            const testsDiv = document.getElementById('tests');
            
            for (const test of tests) {
                const div = document.createElement('div');
                div.className = 'test-item';
                
                try {
                    const result = await test.test();
                    div.innerHTML = \`<span class="\${result ? 'check' : 'error'}">\${result ? '✓' : '✗'}</span> \${test.name}\`;
                } catch (error) {
                    div.innerHTML = \`<span class="error">✗</span> \${test.name} (Error: \${error.message})\`;
                }
                
                testsDiv.appendChild(div);
            }
            
            // Add link to main app
            const linkDiv = document.createElement('div');
            linkDiv.innerHTML = '<br><a href="/index.html" style="background: #4facfe; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Launch StudyBuddy CAPS →</a>';
            testsDiv.appendChild(linkDiv);
        }
        
        runTests();
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(deployDir, 'verify.html'), verifyScript);
console.log('✓ Created deployment verification page');

// Check deployment package size
const getDirectorySize = (dirPath) => {
    let totalSize = 0;
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
            totalSize += getDirectorySize(filePath);
        } else {
            totalSize += stats.size;
        }
    });
    
    return totalSize;
};

const deploySize = getDirectorySize(deployDir);
const deploySizeMB = (deploySize / (1024 * 1024)).toFixed(2);

console.log('');
console.log('========================================');
console.log('✓ PWA Deployment Package Ready!');
console.log('========================================');
console.log('');
console.log(`📁 Deployment folder: ${deployDir}/`);
console.log(`📊 Package size: ${deploySizeMB} MB`);
console.log('');
console.log('🚀 Ready to deploy to:');
console.log('  • Netlify (recommended): https://netlify.com');
console.log('  • Vercel: https://vercel.com');
console.log('  • GitHub Pages: https://pages.github.com');
console.log('  • Firebase Hosting: https://firebase.google.com/products/hosting');
console.log('');
console.log('📋 Deployment steps:');
console.log('1. Choose a hosting platform above');
console.log('2. Sign up for free account');
console.log('3. Upload/drag the studybuddy-pwa-deploy folder');
console.log('4. Get your public URL');
console.log('5. Test PWA features at yoururl.com/verify.html');
console.log('');
console.log('🎯 PWA Features included:');
console.log('  ✅ Cross-platform compatibility');
console.log('  ✅ Installable as native app');
console.log('  ✅ Offline functionality');
console.log('  ✅ Enhanced local data storage');
console.log('  ✅ Fixed authentication (login after signout)');
console.log('  ✅ Responsive design for all devices');
console.log('');
console.log('Your StudyBuddy CAPS PWA is ready for the world! 🌍');
console.log('');
console.log('Next: Deploy the studybuddy-pwa-deploy folder to your chosen platform.');
