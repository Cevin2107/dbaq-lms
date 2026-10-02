const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// =========================================================================
// 1. ICON / LOGO (512x512) - MINIMALIST LUXURY "ĐBAQ - LMS"
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

    <!-- Top Radiant Light Aura -->
    <radialGradient id="topGlow" cx="45%" cy="25%" r="75%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="45%" stop-color="#38bdf8" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Specular Highlight Arc -->
    <linearGradient id="glassSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <!-- Metallic Platinum / Ice Gradient for Emblem -->
    <linearGradient id="platGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#f0f9ff"/>
      <stop offset="100%" stop-color="#bae6fd"/>
    </linearGradient>

    <!-- Facet Shadow Gradient -->
    <linearGradient id="facetDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>

    <!-- Golden Spark Accent -->
    <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>

    <!-- Soft Depth Shadow -->
    <filter id="iconDepth" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#020617" flood-opacity="0.5"/>
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

  <!-- Minimalist High-End Geometric Emblem (The Crown of Knowledge / Prism AQ) -->
  <g filter="url(#iconDepth)">
    <!-- Central Modern Apex (Stylized Diamond Mortarboard & Rising Peak) -->
    <!-- Center Peak -->
    <polygon points="256,92 376,174 256,238 136,174" fill="url(#platGrad)" />
    <!-- Left Facet -->
    <polygon points="136,174 256,238 256,320 136,256" fill="url(#facetDark)" opacity="0.9" />
    <!-- Right Facet -->
    <polygon points="376,174 256,238 256,320 376,256" fill="#38bdf8" opacity="0.95" />
    <!-- Central Vertical Accent Blade -->
    <line x1="256" y1="92" x2="256" y2="320" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />

    <!-- Modern Ribbon Wings uniting the base (Representing Open Book & Infinite Progress) -->
    <path d="M 120 310 C 170 330 220 335 256 335 C 292 335 342 330 392 310 C 372 355 320 375 256 375 C 192 375 140 355 120 310 Z" fill="url(#platGrad)"/>

    <!-- Subtle Golden Star Sparkle at Top Peak -->
    <circle cx="256" cy="92" r="7" fill="url(#goldAccent)"/>

    <!-- CLEAN, MODERN BRAND TEXT: ĐBAQ - LMS -->
    <!-- Pill Background for Text -->
    <rect x="106" y="415" width="300" height="52" rx="26" fill="rgba(2, 6, 23, 0.45)" stroke="rgba(255, 255, 255, 0.25)" stroke-width="1.5"/>
    <text x="256" y="451" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="25" font-weight="800" letter-spacing="4" fill="#ffffff">ĐBAQ - LMS</text>
  </g>
</svg>`;

// =========================================================================
// 2. HORIZONTAL SOCIAL / ZALO PREVIEW (1200x630) - CLEAN, ELEGANT, LUXURY
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

    <!-- Top Left Accent Glow -->
    <radialGradient id="cornerAura" cx="15%" cy="15%" r="40%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- App Icon Gradient -->
    <linearGradient id="miniIconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="35%" stop-color="#0284c7"/>
      <stop offset="75%" stop-color="#0066cc"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <!-- Metallic Text Gradient for ĐBAQ -->
    <linearGradient id="titleMetal" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#f0f9ff"/>
      <stop offset="100%" stop-color="#bae6fd"/>
    </linearGradient>

    <!-- Facet Gradients for mini emblem -->
    <linearGradient id="miniPlat" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#bae6fd"/>
    </linearGradient>
    <linearGradient id="miniFacet" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>

    <!-- Soft Depth Shadow -->
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000000" flood-opacity="0.65"/>
    </filter>
    <filter id="iconGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="20" flood-color="#0284c7" flood-opacity="0.55"/>
    </filter>
  </defs>

  <!-- 1. Background -->
  <rect width="1200" height="630" fill="url(#ogBgGrad)"/>
  <rect width="1200" height="630" fill="url(#centerAura)"/>
  <rect width="1200" height="630" fill="url(#cornerAura)"/>

  <!-- 2. Subtle Outer Apple Glass Border -->
  <rect x="20" y="20" width="1160" height="590" rx="36" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
  <rect x="24" y="24" width="1152" height="582" rx="32" fill="none" stroke="rgba(56,189,248,0.1)" stroke-width="1"/>

  <!-- 3. CENTERED LUXURY BRAND COMPOSITION -->
  <g transform="translate(600, 75)" text-anchor="middle">
    
    <!-- A. Centered Brand App Icon (124x124) -->
    <g transform="translate(-62, 0)" filter="url(#iconGlow)">
      <!-- Squircle Base -->
      <rect width="124" height="124" rx="32" fill="url(#miniIconBg)"/>
      <rect width="124" height="124" rx="32" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2"/>

      <!-- Top Sheen -->
      <path d="M 0 32 C 0 14 14 0 32 0 L 92 0 C 110 0 124 14 124 32 C 124 48 95 55 62 55 C 29 55 0 48 0 32 Z" fill="#ffffff" opacity="0.35"/>

      <!-- Mini Prism Emblem -->
      <g transform="translate(62, 24)" filter="url(#cardShadow)">
        <polygon points="0,0 28,19 0,34 -28,19" fill="url(#miniPlat)" />
        <polygon points="-28,19 0,34 0,54 -28,39" fill="url(#miniFacet)" opacity="0.9" />
        <polygon points="28,19 0,34 0,54 28,39" fill="#38bdf8" opacity="0.95" />
        <line x1="0" y1="0" x2="0" y2="54" stroke="#ffffff" stroke-width="1.5" />
        <!-- Ribbon Base -->
        <path d="M -30 52 C -18 57 0 58 0 58 C 0 58 18 57 30 52 C 25 63 12 68 0 68 C -12 68 -25 63 -30 52 Z" fill="url(#miniPlat)"/>
        <!-- Star spark -->
        <circle cx="0" cy="0" r="2.5" fill="#f59e0b"/>
      </g>

      <!-- Mini Monogram inside icon -->
      <text x="62" y="109" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="11" font-weight="900" letter-spacing="2" fill="#ffffff">ĐBAQ</text>
    </g>

    <!-- B. Main Monogram Title: ĐBAQ - LMS -->
    <text x="0" y="215" font-family="'Segoe UI', Arial, sans-serif" font-size="64" font-weight="900" letter-spacing="4" fill="url(#titleMetal)" filter="url(#cardShadow)">
      ĐBAQ - LMS
    </text>

    <!-- C. Full Educator Name -->
    <text x="0" y="275" font-family="'Segoe UI', Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="0.5" fill="#ffffff">
      Gia sư Đào Bá Anh Quân
    </text>

    <!-- D. Subtitle Tagline -->
    <text x="0" y="322" font-family="'Segoe UI', Arial, sans-serif" font-size="20" font-weight="400" fill="#94a3b8">
      Hệ thống Học tập &amp; Luyện thi Trực tuyến
    </text>

    <!-- E. Minimalist Feature Pills (Centered row) -->
    <g transform="translate(0, 360)">
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
    <g transform="translate(0, 440)">
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
