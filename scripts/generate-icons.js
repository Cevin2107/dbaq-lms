const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient: Deep Action Blue to Royal Midnight Indigo -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0071e3"/>
      <stop offset="30%" stop-color="#0066cc"/>
      <stop offset="70%" stop-color="#1e40af"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <!-- Ambient Glow inside icon -->
    <radialGradient id="innerGlow" cx="35%" cy="25%" r="75%">
      <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.5"/>
      <stop offset="50%" stop-color="#0066cc" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Glass Specular Highlight Ribbon -->
    <linearGradient id="glassHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <!-- Core Emblem Gradient (Metallic Silver to Bright Cyan Blue) -->
    <linearGradient id="emblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#f0f9ff"/>
      <stop offset="75%" stop-color="#bae6fd"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>

    <!-- Gold Accent Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>

    <!-- Subtle Drop Shadow Filter for internal 3D depth -->
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#051532" flood-opacity="0.5"/>
    </filter>
    <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#f59e0b" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- iOS Apple Squircle Base -->
  <rect width="512" height="512" rx="115" fill="url(#bgGrad)"/>
  <rect width="512" height="512" rx="115" fill="url(#innerGlow)"/>

  <!-- Top Glass Reflection Arc -->
  <path d="M 0 115 C 0 51.5 51.5 0 115 0 L 397 0 C 460.5 0 512 51.5 512 115 C 512 180 390 215 256 215 C 122 215 0 180 0 115 Z" fill="url(#glassHighlight)"/>

  <!-- Border Specular Apple Rim -->
  <rect x="2" y="2" width="508" height="508" rx="113" fill="none" stroke="rgba(255,255,255,0.38)" stroke-width="3"/>
  <rect x="5" y="5" width="502" height="502" rx="110" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>

  <!-- Main Emblem Group: Tutor Academic Cap + Modern Geometric 'AQ' Symbolism -->
  <g filter="url(#dropShadow)">
    <!-- Academic Mortarboard Rhombus Top -->
    <polygon points="256,110 398,172 256,234 114,172" fill="url(#emblemGrad)" />
    
    <!-- Cap Rim/Underside depth -->
    <polygon points="114,172 256,234 256,246 114,184" fill="#93c5fd" opacity="0.75" />
    <polygon points="398,172 256,234 256,246 398,184" fill="#60a5fa" opacity="0.85" />

    <!-- Cap Skullcap -->
    <path d="M 172 205 Q 256 268 340 205 L 340 236 C 340 285 172 285 172 236 Z" fill="url(#emblemGrad)" opacity="0.95"/>

    <!-- Academic Tassel with Golden Star Badge -->
    <path d="M 256 172 Q 380 185 392 258 L 386 258 Q 374 190 256 176 Z" fill="url(#goldGrad)"/>
    <circle cx="392" cy="268" r="9" fill="url(#goldGrad)" filter="url(#goldGlow)"/>

    <!-- Open Book / Stylized Dynamic Wings (Representing Letter A and Q) -->
    <!-- Left Wing (The Letter 'A' Stylized sweep) -->
    <path d="M 140 376 C 140 326 210 292 244 290 L 244 322 C 220 324 176 344 176 376 C 176 394 212 404 244 406 L 244 436 C 180 432 140 408 140 376 Z" fill="url(#emblemGrad)"/>
    
    <!-- Right Wing (The Letter 'Q' Stylized sweep with forward momentum) -->
    <path d="M 372 376 C 372 326 302 292 268 290 L 268 322 C 292 324 336 344 336 376 C 336 394 300 404 268 406 L 268 436 C 332 432 372 408 372 376 Z" fill="url(#emblemGrad)"/>

    <!-- Central Knowledge Spire / Pen Nib uniting A and Q -->
    <polygon points="256,275 272,370 256,410 240,370" fill="#ffffff" />
    <circle cx="256" cy="345" r="4.5" fill="#0066cc"/>

    <!-- Modern Typography: DBAQ LMS Monogram Badge -->
    <text x="256" y="468" text-anchor="middle" font-family="'SF Pro Display', -apple-system, 'Inter', sans-serif" font-size="32" font-weight="800" letter-spacing="5" fill="#ffffff" opacity="0.95">DBAQ • LMS</text>
  </g>
</svg>
`;

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  const appDir = path.join(__dirname, '..', 'src', 'app');

  // Save SVG
  const svgPath = path.join(publicDir, 'icon.svg');
  fs.writeFileSync(svgPath, svg, 'utf8');
  console.log('Saved:', svgPath);

  // Render 512x512 PNG
  const pngBuffer = await sharp(Buffer.from(svg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  // Targets to write as per .agents/UPDATE_ICON_GUIDE.md:
  // 1. src/app/icon.png
  // 2. public/icon.png
  // 3. public/og-image.png
  // 4. public/app-icon.png (for backwards compatibility)
  const targets = [
    path.join(appDir, 'icon.png'),
    path.join(publicDir, 'icon.png'),
    path.join(publicDir, 'og-image.png'),
    path.join(publicDir, 'app-icon.png'),
  ];

  for (const t of targets) {
    fs.writeFileSync(t, pngBuffer);
    console.log('Wrote image target:', t);
  }

  console.log('All icons successfully updated!');
}

main().catch(console.error);
