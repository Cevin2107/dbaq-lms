const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// =========================================================================
// 1. MASTER ICON (512x512) - ACADEMIC CAP + PEN NIB + ĐBAQ - LMS BOX
// =========================================================================
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Vibrant, Glowing Liquid Cyan-Blue Gradient -->
    <linearGradient id="iconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="30%" stop-color="#0284c7"/>
      <stop offset="70%" stop-color="#0066cc"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <!-- Top Radiant Ambient Glow -->
    <radialGradient id="topGlow" cx="45%" cy="25%" r="75%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="45%" stop-color="#38bdf8" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Glass Specular Highlight Arc -->
    <linearGradient id="glassSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0.15"/>
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
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#020617" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- iOS Apple Squircle Base -->
  <rect width="512" height="512" rx="115" fill="url(#iconBg)"/>
  <rect width="512" height="512" rx="115" fill="url(#topGlow)"/>

  <!-- Top Glass Reflection Arc -->
  <path d="M 0 115 C 0 51.5 51.5 0 115 0 L 397 0 C 460.5 0 512 51.5 512 115 C 512 175 390 205 256 205 C 122 205 0 175 0 115 Z" fill="url(#glassSheen)"/>

  <!-- Outer Specular Glass Rim -->
  <rect x="2.5" y="2.5" width="507" height="507" rx="112.5" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="3"/>
  <rect x="6.5" y="6.5" width="499" height="499" rx="108.5" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>

  <!-- MAIN EMBLEM: Academic Mortarboard + Stylized Pen Nib & Knowledge Wings -->
  <g filter="url(#iconDepth)">
    <!-- Academic Mortarboard Rhombus Top -->
    <polygon points="256,92 396,152 256,212 116,152" fill="url(#emblemGrad)" />
    
    <!-- Cap Rim/Underside depth -->
    <polygon points="116,152 256,212 256,224 116,164" fill="#93c5fd" opacity="0.75" />
    <polygon points="396,152 256,212 256,224 396,164" fill="#60a5fa" opacity="0.85" />

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
    <rect x="106" y="420" width="300" height="52" rx="26" fill="rgba(2, 6, 23, 0.45)" stroke="rgba(255, 255, 255, 0.25)" stroke-width="1.5"/>
    <text x="256" y="456" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="25" font-weight="800" letter-spacing="4" fill="#ffffff">ĐBAQ - LMS</text>
  </g>
</svg>`;

// =========================================================================
// 2. HORIZONTAL ZALO / SOCIAL PREVIEW CARD (1200x630)
// =========================================================================
const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Deep Midnight Luxury Background -->
    <linearGradient id="ogBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1329"/>
      <stop offset="45%" stop-color="#071838"/>
      <stop offset="85%" stop-color="#030b1c"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>

    <!-- Central Majestic Blue Aura Glow -->
    <radialGradient id="centerAura" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.45"/>
      <stop offset="35%" stop-color="#0066cc" stop-opacity="0.25"/>
      <stop offset="70%" stop-color="#1e1b4b" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Mini Icon Background -->
    <linearGradient id="miniIconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="30%" stop-color="#0284c7"/>
      <stop offset="70%" stop-color="#0066cc"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <!-- Metallic Text Gradient for ĐBAQ -->
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
      <feDropShadow dx="0" dy="16" stdDeviation="22" flood-color="#000000" flood-opacity="0.65"/>
    </filter>
    <filter id="iconGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="18" flood-color="#0284c7" flood-opacity="0.55"/>
    </filter>
  </defs>

  <!-- 1. Background -->
  <rect width="1200" height="630" fill="url(#ogBgGrad)"/>
  <rect width="1200" height="630" fill="url(#centerAura)"/>

  <!-- 2. Subtle Outer Apple Glass Border -->
  <rect x="20" y="20" width="1160" height="590" rx="36" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
  <rect x="24" y="24" width="1152" height="582" rx="32" fill="none" stroke="rgba(56,189,248,0.1)" stroke-width="1"/>

  <!-- 3. CENTERED LUXURY BRAND COMPOSITION -->
  <g transform="translate(600, 75)" text-anchor="middle">
    
    <!-- A. Centered Brand App Icon with Mortarboard + Pen (124x124) -->
    <g transform="translate(-62, 0)" filter="url(#iconGlow)">
      <!-- Squircle Base -->
      <rect width="124" height="124" rx="32" fill="url(#miniIconBg)"/>
      <rect width="124" height="124" rx="32" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2"/>

      <!-- Top Sheen -->
      <path d="M 0 32 C 0 14 14 0 32 0 L 92 0 C 110 0 124 14 124 32 C 124 48 95 55 62 55 C 29 55 0 48 0 32 Z" fill="#ffffff" opacity="0.35"/>

      <!-- Mini Mortarboard + Pen inside icon -->
      <g transform="translate(62, 22)">
        <!-- Cap Top -->
        <polygon points="0,0 34,15 0,30 -34,15" fill="url(#emblemMini)" />
        <polygon points="-34,15 0,30 0,33 -34,18" fill="#93c5fd" />
        <polygon points="34,15 0,30 0,33 34,18" fill="#60a5fa" />
        <!-- Tassel Star -->
        <circle cx="33" cy="22" r="2.5" fill="#f59e0b" />
        <!-- Wings & Pen Spire -->
        <path d="M -26 50 C -12 42 0 42 0 42 C 0 42 12 42 26 50 C 20 58 10 62 0 62 C -10 62 -20 58 -26 50 Z" fill="url(#emblemMini)" opacity="0.9"/>
        <polygon points="0,34 3,54 0,60 -3,54" fill="#ffffff" />
      </g>

      <!-- Mini Monogram inside icon -->
      <text x="62" y="108" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="11" font-weight="900" letter-spacing="1.5" fill="#ffffff">ĐBAQ</text>
    </g>

    <!-- B. Main Monogram Title: ĐBAQ - LMS (In Beautiful Glass Box) -->
    <g transform="translate(0, 195)">
      <!-- Pill Box -->
      <rect x="-190" y="-48" width="380" height="74" rx="37" fill="rgba(2, 6, 23, 0.55)" stroke="rgba(255, 255, 255, 0.28)" stroke-width="2" filter="url(#cardShadow)"/>
      <text x="0" y="3" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="44" font-weight="900" letter-spacing="5" fill="url(#titleMetal)">
        ĐBAQ - LMS
      </text>
    </g>

    <!-- C. Full Educator Name -->
    <text x="0" y="292" font-family="'Segoe UI', Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="0.5" fill="#ffffff">
      Gia sư Đào Bá Anh Quân
    </text>

    <!-- D. Subtitle Tagline -->
    <text x="0" y="338" font-family="'Segoe UI', Arial, sans-serif" font-size="20" font-weight="400" fill="#94a3b8">
      Hệ thống Học tập &amp; Luyện thi Trực tuyến
    </text>

    <!-- E. Minimalist Feature Pills (Centered row) -->
    <g transform="translate(0, 375)">
      <!-- Pill 1 -->
      <g transform="translate(-250, 0)">
        <rect x="0" y="0" width="150" height="38" rx="19" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        <text x="75" y="24" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="13" font-weight="600" fill="#cbd5e1">Toán &amp; Tự Nhiên</text>
      </g>
      <!-- Pill 2 -->
      <g transform="translate(-85, 0)">
        <rect x="0" y="0" width="170" height="38" rx="19" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        <text x="85" y="24" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="13" font-weight="600" fill="#cbd5e1">Chấm điểm tự động</text>
      </g>
      <!-- Pill 3 -->
      <g transform="translate(100, 0)">
        <rect x="0" y="0" width="150" height="38" rx="19" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        <text x="75" y="24" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="13" font-weight="600" fill="#cbd5e1">Đăng ký ca học</text>
      </g>
    </g>

    <!-- F. Minimalist URL Badge at bottom -->
    <g transform="translate(0, 445)">
      <rect x="-140" y="0" width="280" height="36" rx="18" fill="rgba(2, 132, 199, 0.15)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1.2"/>
      <text x="0" y="23" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="1" fill="#38bdf8">
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
}

main().catch(console.error);
