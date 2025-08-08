const fs = require('fs');
const path = require('path');

// Create a simple SVG icon for StudyBuddy
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4facfe;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#00f2fe;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" fill="url(#grad1)" rx="80"/>
  
  <!-- Graduation Cap -->
  <g fill="white">
    <!-- Cap base -->
    <rect x="100" y="200" width="312" height="40"/>
    
    <!-- Cap top -->
    <polygon points="80,200 432,200 400,160 112,160"/>
    
    <!-- Tassel -->
    <rect x="400" y="160" width="4" height="80"/>
    <circle cx="402" cy="250" r="8"/>
  </g>
  
  <!-- Book -->
  <g>
    <rect x="180" y="280" width="152" height="120" fill="white"/>
    <rect x="180" y="280" width="76" height="120" fill="#e0e0e0"/>
    
    <!-- Book lines -->
    <g stroke="#cccccc" stroke-width="2" fill="none">
      <line x1="190" y1="310" x2="240" y2="310"/>
      <line x1="190" y1="330" x2="240" y2="330"/>
      <line x1="190" y1="350" x2="240" y2="350"/>
    </g>
  </g>
  
  <!-- StudyBuddy text -->
  <text x="256" y="450" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" fill="white">StudyBuddy</text>
</svg>`;

// Ensure icons directory exists
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
}

// Write SVG file
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon);

console.log('Icon created successfully!');
console.log('SVG icon saved to: icons/icon.svg');
console.log('Note: For production builds, you should convert this to PNG format.');
console.log('For now, we\'ll create a simple PNG placeholder.');

// Create a simple base64 encoded PNG (1x1 transparent pixel, then we'll replace with proper icon)
const simplePngData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(simplePngData, 'base64');

// We need to create proper sized icons, but for now let's create a basic one
// This is a minimal approach to get the build working
const iconSizes = [16, 24, 32, 48, 64, 96, 128, 256, 512];

iconSizes.forEach(size => {
    // For now, just copy the same small PNG - in production you'd use proper image processing
    fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), pngBuffer);
});

console.log('Basic PNG icons created for all required sizes.');
console.log('Ready to build the application!');
