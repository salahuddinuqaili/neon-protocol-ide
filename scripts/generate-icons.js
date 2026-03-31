/**
 * Generates app icons for Electron packaging.
 * Creates a 1024x1024 PNG, then derives .ico (Windows) and .icns (macOS).
 *
 * Usage: node scripts/generate-icons.js
 *
 * For .icns generation on Windows, we create a PNG set that electron-builder
 * will auto-convert. electron-builder can generate .icns from a 512x512+ PNG.
 */

const fs = require('fs');
const path = require('path');

// We'll create an SVG and convert it to PNG using a canvas-free approach.
// Since we can't rely on native canvas, we'll create the SVG and let
// electron-builder's icon conversion handle the rest from a high-res PNG.

const SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0B0C10"/>
      <stop offset="100%" style="stop-color:#181A20"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00FFD1"/>
      <stop offset="100%" style="stop-color:#00C9A7"/>
    </linearGradient>
    <filter id="neon">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="neon-strong">
      <feGaussianBlur stdDeviation="15" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" rx="180" fill="url(#bg)"/>
  <rect x="4" y="4" width="1016" height="1016" rx="176" fill="none" stroke="#00FFD1" stroke-width="3" opacity="0.3"/>

  <!-- Grid pattern -->
  <g opacity="0.06" stroke="#00FFD1" stroke-width="1">
    <line x1="256" y1="100" x2="256" y2="924"/>
    <line x1="512" y1="100" x2="512" y2="924"/>
    <line x1="768" y1="100" x2="768" y2="924"/>
    <line x1="100" y1="256" x2="924" y2="256"/>
    <line x1="100" y1="512" x2="924" y2="512"/>
    <line x1="100" y1="768" x2="924" y2="768"/>
  </g>

  <!-- Architecture symbol - connected nodes -->
  <g filter="url(#neon)">
    <!-- Edges (connections) -->
    <line x1="320" y1="340" x2="700" y2="340" stroke="#00FFD1" stroke-width="4" opacity="0.5"/>
    <line x1="320" y1="340" x2="320" y2="680" stroke="#00FFD1" stroke-width="4" opacity="0.5"/>
    <line x1="320" y1="680" x2="700" y2="680" stroke="#00FFD1" stroke-width="4" opacity="0.5"/>
    <line x1="700" y1="340" x2="700" y2="680" stroke="#00FFD1" stroke-width="4" opacity="0.5"/>
    <line x1="320" y1="340" x2="700" y2="680" stroke="#B026FF" stroke-width="3" opacity="0.3"/>
  </g>

  <!-- Nodes -->
  <g filter="url(#neon-strong)">
    <!-- Top-left node -->
    <rect x="268" y="288" width="104" height="104" rx="8" fill="#181A20" stroke="#00FFD1" stroke-width="4"/>
    <rect x="288" y="316" width="64" height="8" rx="2" fill="#00FFD1" opacity="0.8"/>
    <rect x="288" y="332" width="44" height="6" rx="2" fill="#00FFD1" opacity="0.3"/>
    <rect x="288" y="346" width="54" height="6" rx="2" fill="#00FFD1" opacity="0.3"/>

    <!-- Top-right node -->
    <rect x="648" y="288" width="104" height="104" rx="8" fill="#181A20" stroke="#00FFD1" stroke-width="4"/>
    <rect x="668" y="316" width="64" height="8" rx="2" fill="#B026FF" opacity="0.8"/>
    <rect x="668" y="332" width="44" height="6" rx="2" fill="#B026FF" opacity="0.3"/>
    <rect x="668" y="346" width="54" height="6" rx="2" fill="#B026FF" opacity="0.3"/>

    <!-- Bottom-left node -->
    <rect x="268" y="628" width="104" height="104" rx="8" fill="#181A20" stroke="#00FFD1" stroke-width="4"/>
    <rect x="288" y="656" width="64" height="8" rx="2" fill="#00FFD1" opacity="0.8"/>
    <rect x="288" y="672" width="44" height="6" rx="2" fill="#00FFD1" opacity="0.3"/>
    <rect x="288" y="686" width="54" height="6" rx="2" fill="#00FFD1" opacity="0.3"/>

    <!-- Bottom-right node (AI - purple accent) -->
    <rect x="648" y="628" width="104" height="104" rx="8" fill="#181A20" stroke="#B026FF" stroke-width="4"/>
    <rect x="668" y="656" width="64" height="8" rx="2" fill="#B026FF" opacity="0.8"/>
    <rect x="668" y="672" width="44" height="6" rx="2" fill="#B026FF" opacity="0.3"/>
    <rect x="668" y="686" width="54" height="6" rx="2" fill="#B026FF" opacity="0.3"/>
  </g>

  <!-- Center diamond / hub -->
  <g filter="url(#neon-strong)">
    <rect x="466" y="466" width="92" height="92" rx="12" fill="#181A20" stroke="#00FFD1" stroke-width="5" transform="rotate(0, 512, 512)"/>
    <text x="512" y="522" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#00FFD1">N</text>
  </g>

  <!-- Center connections to hub -->
  <g opacity="0.4">
    <line x1="372" y1="340" x2="466" y2="480" stroke="#00FFD1" stroke-width="2"/>
    <line x1="648" y1="340" x2="558" y2="480" stroke="#00FFD1" stroke-width="2"/>
    <line x1="372" y1="680" x2="466" y2="544" stroke="#00FFD1" stroke-width="2"/>
    <line x1="648" y1="680" x2="558" y2="544" stroke="#B026FF" stroke-width="2"/>
  </g>

  <!-- "NEON" text at bottom -->
  <text x="512" y="870" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" font-weight="bold" letter-spacing="16" fill="#00FFD1" filter="url(#neon)" opacity="0.9">NEON</text>
  <text x="512" y="916" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" letter-spacing="12" fill="#4E5666">PROTOCOL</text>
</svg>`;

const buildDir = path.join(__dirname, '..', 'build');

// Write SVG
fs.writeFileSync(path.join(buildDir, 'icon.svg'), SVG_ICON);
console.log('Created: build/icon.svg');

// For electron-builder, we need a PNG. We'll use a simple approach:
// Write the SVG and instruct the user to convert, OR use electron-builder's
// built-in icon generation from PNG.
//
// electron-builder can auto-generate .ico and .icns from a single icon.png
// if it's at least 512x512. Let's create a simple script that uses
// the `sharp` library if available, or falls back to instructions.

try {
  // Try to use sharp for PNG conversion
  const sharp = require('sharp');

  const svgBuffer = Buffer.from(SVG_ICON);

  Promise.all([
    // Main icon PNG (1024x1024) - electron-builder uses this for both platforms
    sharp(svgBuffer).resize(1024, 1024).png().toFile(path.join(buildDir, 'icon.png')),
    // 256x256 for Windows .ico fallback
    sharp(svgBuffer).resize(256, 256).png().toFile(path.join(buildDir, 'icon-256.png')),
    // 512x512 for macOS
    sharp(svgBuffer).resize(512, 512).png().toFile(path.join(buildDir, 'icon-512.png')),
  ]).then(() => {
    console.log('Created: build/icon.png (1024x1024)');
    console.log('Created: build/icon-256.png');
    console.log('Created: build/icon-512.png');
    console.log('\nelectron-builder will auto-generate .ico and .icns from icon.png');
  }).catch(err => {
    console.error('Sharp conversion failed:', err.message);
    printManualInstructions();
  });
} catch (e) {
  printManualInstructions();
}

function printManualInstructions() {
  console.log('\nSVG created at build/icon.svg');
  console.log('\nTo generate PNG icons, install sharp and re-run:');
  console.log('  npm install sharp --save-dev');
  console.log('  node scripts/generate-icons.js');
  console.log('\nAlternatively, convert build/icon.svg to build/icon.png (1024x1024)');
  console.log('manually using any image editor or online tool.');
  console.log('electron-builder will auto-generate .ico and .icns from icon.png');
}
