const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// =========================================================================
// 1. MASTER ICON (512x512) - BRIGHTER, LUMINOUS ACADEMIC CAP + PEN NIB + ĐBAQ - LMS
// =========================================================================
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Ultra-Bright, Luminous Liquid Blue Gradient -->
    <linearGradient id="iconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00d2ff"/>
      <stop offset="25%" stop-color="#0084ff"/>
      <stop offset="65%" stop-color="#0066cc"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>

    <!-- Radiant Top Ambient Glow -->
    <radialGradient id="topGlow" cx="45%" cy="25%" r="75%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.65"/>
      <stop offset="40%" stop-color="#38bdf8" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Glass Specular Highlight Arc -->
    <linearGradient id="glassSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.65"/>
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <!-- Metallic Emblem Platinum Gradient -->
    <linearGradient id="emblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#f0f9ff"/>
      <stop offset="75%" stop-color="#bae6fd"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>

    <!-- Golden Star & Tassel Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>

    <!-- Soft Depth Shadow -->
    <filter id="iconDepth" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#051532" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- iOS Apple Squircle Base -->
  <rect width="512" height="512" rx="115" fill="url(#iconBg)"/>
  <rect width="512" height="512" rx="115" fill="url(#topGlow)"/>

  <!-- Top Glass Reflection Arc -->
  <path d="M 0 115 C 0 51.5 51.5 0 115 0 L 397 0 C 460.5 0 512 51.5 512 115 C 512 175 390 205 256 205 C 122 205 0 175 0 115 Z" fill="url(#glassSheen)"/>

  <!-- Outer Specular Glass Rim -->
  <rect x="2.5" y="2.5" width="507" height="507" rx="112.5" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="3"/>
  <rect x="6.5" y="6.5" width="499" height="499" rx="108.5" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>

  <!-- MAIN EMBLEM: Academic Mortarboard + Stylized Pen Nib & Knowledge Wings -->
  <g filter="url(#iconDepth)">
    <!-- Academic Mortarboard Rhombus Top -->
    <polygon points="256,92 396,152 256,212 116,152" fill="url(#emblemGrad)" />
    
    <!-- Cap Rim/Underside depth -->
    <polygon points="116,152 256,212 256,224 116,164" fill="#93c5fd" opacity="0.8" />
    <polygon points="396,152 256,212 256,224 396,164" fill="#60a5fa" opacity="0.9" />

    <!-- Cap Skullcap -->
    <path d="M 172 184 Q 256 244 340 184 L 340 214 C 340 260 172 260 172 214 Z" fill="url(#emblemGrad)" opacity="0.95"/>

    <!-- Academic Tassel with Golden Star Badge -->
    <path d="M 256 152 Q 380 165 392 234 L 386 234 Q 374 170 256 156 Z" fill="url(#goldGrad)"/>
    <circle cx="392" cy="244" r="8.5" fill="url(#goldGrad)"/>

    <!-- Open Book / Stylized Dynamic Wings (Representing A & Q) -->
    <!-- Left Wing -->
    <path d="M 142 352 C 142 306 208 274 242 272 L 242 302 C 218 304 176 322 176 352 C 176 370 210 380 242 382 L 242 410 C 180 406 142 382 142 352 Z" fill="url(#emblemGrad)"/>
    <!-- Right Wing -->
    <path d="M 370 352 C 370 306 304 274 270 272 L 270 302 C 294 304 336 322 336 352 C 336 370 302 380 270 382 L 270 410 C 332 406 370 382 370 352 Z" fill="url(#emblemGrad)"/>

    <!-- Central Knowledge Pen Nib Spire -->
    <polygon points="256,256 272,346 256,386 240,346" fill="#ffffff" />
    <circle cx="256" cy="324" r="4.5" fill="#0066cc"/>

    <!-- BEAUTIFUL LIQUID GLASS BOX: ĐBAQ - LMS -->
    <rect x="106" y="420" width="300" height="52" rx="26" fill="rgba(2, 6, 23, 0.4)" stroke="rgba(255, 255, 255, 0.35)" stroke-width="1.8"/>
    <text x="256" y="456" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="25" font-weight="800" letter-spacing="4" fill="#ffffff">ĐBAQ - LMS</text>
  </g>
</svg>`;

// =========================================================================
// 2. HORIZONTAL ZALO / SOCIAL PREVIEW CARD (1200x630) - BRIGHTER, CLEAN & PURE
// Layout (top to bottom):
// 1. Logo
// 2. Box ĐBAQ - LMS
// 3. Gia sư Đào Bá Anh Quân
// 4. Hệ thống Học tập & Luyện thi trực tuyến
// 5. Box đường dẫn link tới web (dbaq-lms.vercel.app)
// =========================================================================
const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Brighter, Elegant Oceanic to Royal Blue Gradient -->
    <linearGradient id="ogBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f2b5c"/>
      <stop offset="40%" stop-color="#09357a"/>
      <stop offset="75%" stop-color="#03449e"/>
      <stop offset="100%" stop-color="#071e4a"/>
    </linearGradient>

    <!-- Ultra Radiant Center Aura Glow (Brightening the whole scene) -->
    <radialGradient id="centerAura" cx="50%" cy="42%" r="65%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6"/>
      <stop offset="35%" stop-color="#0084ff" stop-opacity="0.4"/>
      <stop offset="70%" stop-color="#0052cc" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="topGlowSoft" cx="50%" cy="10%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>

    <!-- Mini Icon Background (Bright & Vibrant) -->
    <linearGradient id="miniIconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00d2ff"/>
      <stop offset="30%" stop-color="#0084ff"/>
      <stop offset="70%" stop-color="#0066cc"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>

    <!-- Pure Metallic Platinum for Title -->
    <linearGradient id="titleMetal" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#f0f9ff"/>
      <stop offset="100%" stop-color="#bae6fd"/>
    </linearGradient>

    <linearGradient id="emblemMini" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#bae6fd"/>
    </linearGradient>

    <linearGradient id="goldStar" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>

    <!-- Soft Depth Shadow -->
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="20" flood-color="#020617" flood-opacity="0.45"/>
    </filter>
    <filter id="iconGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="24" flood-color="#38bdf8" flood-opacity="0.65"/>
    </filter>
  </defs>

  <!-- 1. Background -->
  <rect width="1200" height="630" fill="url(#ogBgGrad)"/>
  <rect width="1200" height="630" fill="url(#centerAura)"/>
  <rect width="1200" height="630" fill="url(#topGlowSoft)"/>

  <!-- 2. Outer Liquid Glass Rim -->
  <rect x="20" y="20" width="1160" height="590" rx="36" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>
  <rect x="24" y="24" width="1152" height="582" rx="32" fill="none" stroke="rgba(56,189,248,0.2)" stroke-width="1"/>

  <!-- 3. CENTERED PURE STACK (TOP TO BOTTOM) -->
  <g transform="translate(600, 52)" text-anchor="middle">
    
    <!-- LEVEL 1: LOGO (130x130) - Mortarboard + Pen Nib with Bright Ambient Glow -->
    <g transform="translate(-65, 0)" filter="url(#iconGlow)">
      <!-- Squircle Base -->
      <rect width="130" height="130" rx="34" fill="url(#miniIconBg)"/>
      <rect width="130" height="130" rx="34" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="2.5"/>

      <!-- Top Sheen -->
      <path d="M 0 34 C 0 15 15 0 34 0 L 96 0 C 115 0 130 15 130 34 C 130 52 100 58 65 58 C 30 58 0 52 0 34 Z" fill="#ffffff" opacity="0.45"/>

      <!-- Mini Mortarboard + Pen inside icon -->
      <g transform="translate(65, 23)">
        <!-- Cap Top -->
        <polygon points="0,0 36,16 0,32 -36,16" fill="url(#emblemMini)" />
        <polygon points="-36,16 0,32 0,35 -36,19" fill="#93c5fd" />
        <polygon points="36,16 0,32 0,35 36,19" fill="#60a5fa" />
        <!-- Tassel Star -->
        <circle cx="35" cy="24" r="2.8" fill="#f59e0b" />
        <!-- Wings & Pen Spire -->
        <path d="M -28 54 C -14 45 0 45 0 45 C 0 45 14 45 28 54 C 22 62 11 67 0 67 C -11 67 -22 62 -28 54 Z" fill="url(#emblemMini)" opacity="0.95"/>
        <polygon points="0,37 3.5,58 0,65 -3.5,58" fill="#ffffff" />
      </g>

      <!-- Mini Monogram label inside icon -->
      <text x="65" y="114" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="12" font-weight="900" letter-spacing="2" fill="#ffffff">ĐBAQ</text>
    </g>

    <!-- LEVEL 2: BOX CHỨA ĐBAQ - LMS (Ngay dưới Logo) -->
    <g transform="translate(0, 182)">
      <!-- Liquid Glass Pill Box -->
      <rect x="-185" y="0" width="370" height="66" rx="33" fill="rgba(255, 255, 255, 0.14)" stroke="rgba(255, 255, 255, 0.4)" stroke-width="2" filter="url(#cardShadow)"/>
      <rect x="-182" y="3" width="364" height="28" rx="14" fill="#ffffff" opacity="0.12"/>
      <text x="0" y="47" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="38" font-weight="900" letter-spacing="5" fill="url(#titleMetal)">
        ĐBAQ - LMS
      </text>
    </g>

    <!-- LEVEL 3: GIA SƯ ĐÀO BÁ ANH QUÂN -->
    <text x="0" y="318" font-family="'Segoe UI', Arial, sans-serif" font-size="40" font-weight="800" letter-spacing="0.5" fill="#ffffff" filter="url(#cardShadow)">
      Gia sư Đào Bá Anh Quân
    </text>

    <!-- LEVEL 4: HỆ THỐNG HỌC TẬP & LUYỆN THI TRỰC TUYẾN -->
    <text x="0" y="372" font-family="'Segoe UI', Arial, sans-serif" font-size="22" font-weight="500" letter-spacing="0.5" fill="#dbeafe">
      Hệ thống Học tập &amp; Luyện thi trực tuyến
    </text>

    <!-- LEVEL 5: BOX ĐƯỜNG DẪN LINK TỚI WEB (dbaq-lms.vercel.app) -->
    <g transform="translate(0, 432)">
      <!-- Luminous Domain Capsule Box -->
      <rect x="-165" y="0" width="330" height="48" rx="24" fill="rgba(2, 132, 199, 0.3)" stroke="rgba(56, 189, 248, 0.6)" stroke-width="1.8" filter="url(#cardShadow)"/>
      <text x="0" y="31" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="1.5" fill="#e0f2fe">
        dbaq-lms.vercel.app
      </text>
    </g>
  </g>
</svg>`;

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');

  // Save SVG source files
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), logoSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'og-image.svg'), previewSvg, 'utf8');
  console.log('Saved SVG source files to public/');

  // 1. Render Square 512x512 PNG for Logo
  const logoBuffer = await sharp(Buffer.from(logoSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'icon.png'), logoBuffer);
  fs.writeFileSync(path.join(publicDir, 'app-icon.png'), logoBuffer);
  console.log('Generated public/icon.png and public/app-icon.png (512x512)');

  // 2. Render Horizontal 1200x630 PNG for Zalo/Social Preview
  const previewBuffer = await sharp(Buffer.from(previewSvg))
    .resize(1200, 630)
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'og-image.png'), previewBuffer);
  console.log('Generated public/og-image.png (1200x630 horizontal)');

  // 3. Render 48x48 Favicon ICO directly to src/app/favicon.ico (avoiding public/ conflict)
  const png48 = await sharp(logoBuffer).resize(48, 48).png().toBuffer();
  const icoHeader = Buffer.alloc(22);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // 1 Image
  icoHeader.writeUInt8(48, 6);   // Width
  icoHeader.writeUInt8(48, 7);   // Height
  icoHeader.writeUInt8(0, 8);    // Palette
  icoHeader.writeUInt8(0, 9);    // Reserved
  icoHeader.writeUInt16LE(1, 10); // Color planes
  icoHeader.writeUInt16LE(32, 12); // Bits per pixel
  icoHeader.writeUInt32LE(png48.length, 14); // Image size
  icoHeader.writeUInt32LE(22, 18); // Image offset

  const icoBuffer = Buffer.concat([icoHeader, png48]);
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'app', 'favicon.ico'), icoBuffer);
  console.log('Generated src/app/favicon.ico (valid 48x48 ICO)');
}

main().catch(console.error);
