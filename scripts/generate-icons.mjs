// Script to generate PWA icons from an SVG string using sharp (already installed)
// Run with: node scripts/generate-icons.mjs

import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

// Shield emoji SVG as the icon
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Background -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#ec4899"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#bg)"/>
  
  <!-- Shield -->
  <path d="M256 80 L380 130 L380 270 C380 340 320 390 256 420 C192 390 132 340 132 270 L132 130 Z" 
        fill="white" opacity="0.95"/>
  
  <!-- Star inside shield -->
  <text x="256" y="300" font-size="160" text-anchor="middle" dominant-baseline="middle">🌟</text>
  
  <!-- Arabic text at bottom -->
  <text x="256" y="460" 
        font-family="Arial, sans-serif" 
        font-size="48" 
        font-weight="bold"
        fill="white" 
        text-anchor="middle"
        opacity="0.9">أمان</text>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  await sharp(Buffer.from(svgIcon))
    .resize(size, size)
    .png()
    .toFile(join(outDir, `icon-${size}x${size}.png`));
  console.log(`✓ Generated icon-${size}x${size}.png`);
}

// Also generate apple-touch-icon
await sharp(Buffer.from(svgIcon))
  .resize(180, 180)
  .png()
  .toFile(join(outDir, "apple-touch-icon.png"));
console.log("✓ Generated apple-touch-icon.png");

// Generate favicon
await sharp(Buffer.from(svgIcon))
  .resize(32, 32)
  .png()
  .toFile(join(__dirname, "../public/favicon.png"));
console.log("✓ Generated favicon.png");

console.log("\n🎉 All icons generated in public/icons/");
