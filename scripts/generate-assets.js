const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. MODERN LUXURY LOGO (512x512) - Bright, elegant, minimalist
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Brighter, vibrant Apple Liquid Glass Gradient -->
    <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="25%" stop-color="#0084ff"/>
      <stop offset="60%" stop-color="#0066cc"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>

    <!-- Vibrant Inner Ambient Glow -->
    <radialGradient id="logoInnerGlow" cx="40%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="40%" stop-color="#60a5fa" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Glass Specular Highlight Arc -->
    <linearGradient id="logoGlassArc" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <!-- Monogram Metallic Gradient (Pure White to Ice Blue) -->
    <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#f0f9ff"/>
      <stop offset="100%" stop-color="#bae6fd"/>
    </linearGradient>

    <!-- Gold Accent Star -->
    <linearGradient id="goldStar" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>

    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Apple Squircle Base -->
  <rect width="512" height="512" rx="115" fill="url(#logoBgGrad)"/>
  <rect width="512" height="512" rx="115" fill="url(#logoInnerGlow)"/>

  <!-- Top Liquid Glass Arc -->
  <path d="M 0 115 C 0 51.5 51.5 0 115 0 L 397 0 C 460.5 0 512 51.5 512 115 C 512 175 390 210 256 210 C 122 210 0 175 0 115 Z" fill="url(#logoGlassArc)"/>

  <!-- Specular Apple Rim -->
  <rect x="2.5" y="2.5" width="507" height="507" rx="112.5" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="3"/>
  <rect x="6.5" y="6.5" width="499" height="499" rx="108.5" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>

  <!-- Clean, Elegant, Geometric Monogram: Diamond Mortarboard + Modern 'ĐBAQ' Crest -->
  <g filter="url(#softShadow)">
    <!-- Academic Diamond Cap -->
    <polygon points="256,95 405,162 256,228 107,162" fill="url(#metalGrad)" />
    
    <!-- Cap 3D Under-facets -->
    <polygon points="107,162 256,228 256,242 107,176" fill="#93c5fd" opacity="0.85" />
    <polygon points="405,162 256,228 256,242 405,176" fill="#60a5fa" opacity="0.95" />

    <!-- Cap Base Arc -->
    <path d="M 166 198 Q 256 264 346 198 L 346 232 C 346 284 166 284 166 232 Z" fill="url(#metalGrad)" opacity="0.95"/>

    <!-- Gold Tassel Ribbon & Star -->
    <path d="M 256 162 Q 384 176 398 250 L 392 250 Q 378 180 256 166 Z" fill="url(#goldStar)"/>
    <circle cx="398" cy="260" r="10" fill="url(#goldStar)" />

    <!-- Monogram Center: Minimalist Stylized 'A' & 'Q' Wings forming open book of knowledge -->
    <path d="M 136 366 C 136 312 210 278 246 276 L 246 310 C 220 312 174 332 174 366 C 174 386 212 396 246 398 L 246 430 C 178 426 136 400 136 366 Z" fill="url(#metalGrad)"/>
    <path d="M 376 366 C 376 312 302 278 266 276 L 266 310 C 292 312 338 332 338 366 C 338 386 300 396 266 398 L 266 430 C 334 426 376 400 376 366 Z" fill="url(#metalGrad)"/>

    <!-- Central Diamond Knowledge Spark -->
    <polygon points="256,260 274,360 256,400 238,360" fill="#ffffff" />
    <circle cx="256" cy="336" r="5" fill="#0066cc"/>

    <!-- Prominent, Sharp Monogram Label: ĐBAQ -->
    <text x="256" y="472" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif" font-size="44" font-weight="900" letter-spacing="8" fill="#ffffff">ĐBAQ</text>
  </g>
</svg>`;

// 2. HORIZONTAL SOCIAL / ZALO PREVIEW CARD (1200x630)
const ogPreviewSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Background Gradient: Deep Oceanic to Vibrant Apple Action Blue -->
    <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1226"/>
      <stop offset="40%" stop-color="#081b3a"/>
      <stop offset="80%" stop-color="#0b295c"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>

    <!-- Vibrant Ambient Glow Orbs -->
    <radialGradient id="glowTopLeft" cx="15%" cy="20%" r="55%">
      <stop offset="0%" stop-color="#0084ff" stop-opacity="0.45"/>
      <stop offset="60%" stop-color="#0066cc" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="glowBottomRight" cx="85%" cy="80%" r="55%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="#4f46e5" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Metal Text Gradient for ĐBAQ -->
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#e0f2fe"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>

    <!-- Golden Star Gradient -->
    <linearGradient id="ogGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>

    <filter id="ogShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.65"/>
    </filter>

    <filter id="badgeGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="#0084ff" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Main Canvas Background -->
  <rect width="1200" height="630" fill="url(#ogBg)"/>
  <rect width="1200" height="630" fill="url(#glowTopLeft)"/>
  <rect width="1200" height="630" fill="url(#glowBottomRight)"/>

  <!-- Subtle Decorative Grid Lines -->
  <g stroke="rgba(255,255,255,0.03)" stroke-width="1">
    <line x1="0" y1="105" x2="1200" y2="105" />
    <line x1="0" y1="210" x2="1200" y2="210" />
    <line x1="0" y1="315" x2="1200" y2="315" />
    <line x1="0" y1="420" x2="1200" y2="420" />
    <line x1="0" y1="525" x2="1200" y2="525" />
    <line x1="200" y1="0" x2="200" y2="630" />
    <line x1="400" y1="0" x2="400" y2="630" />
    <line x1="600" y1="0" x2="600" y2="630" />
    <line x1="800" y1="0" x2="800" y2="630" />
    <line x1="1000" y1="0" x2="1000" y2="630" />
  </g>

  <!-- Outer Glass Specular Border -->
  <rect x="12" y="12" width="1176" height="606" rx="32" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
  <rect x="16" y="16" width="1168" height="598" rx="28" fill="none" stroke="rgba(0,132,255,0.15)" stroke-width="1"/>

  <!-- LEFT SECTION: BRANDING & PROMINENT 'ĐBAQ' MONOGRAM -->
  <g transform="translate(80, 85)">
    <!-- Small Top Eyebrow Pill -->
    <g>
      <rect width="320" height="38" rx="19" fill="rgba(0, 102, 204, 0.25)" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1.5"/>
      <circle cx="22" cy="19" r="6" fill="#38bdf8" />
      <text x="38" y="24" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif" font-size="14" font-weight="700" letter-spacing="1.5" fill="#38bdf8">NỀN TẢNG HỌC TẬP TRỰC TUYẾN</text>
    </g>

    <!-- HUGE, ULTRA-SHARP 'ĐBAQ' MONOGRAM BADGE -->
    <g transform="translate(0, 58)" filter="url(#ogShadow)">
      <!-- Backdrop Glow Pill for ĐBAQ -->
      <text x="0" y="120" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif" font-size="130" font-weight="900" letter-spacing="6" fill="url(#textGrad)">ĐBAQ</text>
      <!-- Sub-label inside/next to ĐBAQ -->
      <rect x="470" y="35" width="110" height="34" rx="17" fill="url(#ogGold)"/>
      <text x="525" y="57" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" font-size="14" font-weight="800" fill="#0f172a">PRO LMS</text>
    </g>

    <!-- Main Full Teacher Name: GIA SƯ ĐÀO BÁ ANH QUÂN -->
    <text x="2" y="248" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif" font-size="38" font-weight="800" letter-spacing="-0.5" fill="#ffffff">
      Gia sư Đào Bá Anh Quân
    </text>

    <!-- Subtitle / Mission -->
    <text x="2" y="288" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif" font-size="18" font-weight="500" fill="#94a3b8">
      Hệ thống bài tập Toán - Tự Nhiên &amp; Đăng ký lịch học thông minh
    </text>

    <!-- Feature Tags Row -->
    <g transform="translate(0, 332)">
      <!-- Tag 1 -->
      <g>
        <rect width="185" height="42" rx="21" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        <text x="92" y="26" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" font-size="14" font-weight="600" fill="#e2e8f0">✓ Chuẩn KaTeX LaTeX</text>
      </g>
      <!-- Tag 2 -->
      <g transform="translate(197, 0)">
        <rect width="175" height="42" rx="21" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        <text x="87" y="26" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" font-size="14" font-weight="600" fill="#e2e8f0">✓ Chấm điểm tự động</text>
      </g>
      <!-- Tag 3 -->
      <g transform="translate(384, 0)">
        <rect width="190" height="42" rx="21" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        <text x="95" y="26" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" font-size="14" font-weight="600" fill="#e2e8f0">✓ Phân ca học linh hoạt</text>
      </g>
    </g>

    <!-- Website Domain Badge -->
    <g transform="translate(2, 412)">
      <text x="0" y="22" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', monospace" font-size="17" font-weight="700" letter-spacing="1" fill="#38bdf8">
        dbaq-lms.vercel.app
      </text>
    </g>
  </g>

  <!-- RIGHT SECTION: 3D FLOATING LIQUID GLASS PREVIEW CARD -->
  <g transform="translate(730, 95)" filter="url(#ogShadow)">
    <!-- Liquid Glass Card Base -->
    <rect width="390" height="440" rx="36" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
    <rect x="2" y="2" width="386" height="150" rx="34" fill="url(#logoGlassArc)" opacity="0.3"/>

    <!-- Inner Floating App Icon (Squircle) -->
    <g transform="translate(40, 42)">
      <rect width="84" height="84" rx="22" fill="url(#logoBgGrad)" filter="url(#badgeGlow)"/>
      <rect width="84" height="84" rx="22" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
      
      <!-- Mini Mortarboard inside icon -->
      <polygon points="42,20 68,32 42,44 16,32" fill="#ffffff" />
      <polygon points="16,32 42,44 42,48 16,36" fill="#93c5fd" />
      <polygon points="68,32 42,44 42,48 68,36" fill="#60a5fa" />
      <!-- Star -->
      <circle cx="66" cy="48" r="3.5" fill="#f59e0b" />
      <!-- Mini ĐBAQ text -->
      <text x="42" y="72" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="900" fill="#ffffff" letter-spacing="1.5">ĐBAQ</text>
    </g>

    <!-- Card Top Text -->
    <g transform="translate(142, 54)">
      <text x="0" y="22" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="800" fill="#ffffff">ĐBAQ LMS Portal</text>
      <text x="0" y="44" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="600" fill="#38bdf8">Trực tuyến 24/7 • Realtime</text>
      <text x="0" y="62" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="500" fill="#94a3b8">Bản Pro Liquid Glass</text>
    </g>

    <!-- Simulated Interactive Assignment Card inside Preview -->
    <g transform="translate(30, 160)">
      <rect width="330" height="135" rx="20" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      
      <!-- Subject badge -->
      <rect x="18" y="16" width="75" height="24" rx="12" fill="#0066cc"/>
      <text x="55" y="32" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="700" fill="#ffffff">TOÁN 12</text>
      
      <!-- Math formula preview -->
      <text x="18" y="66" font-family="-apple-system, BlinkMacSystemFont, serif" font-size="15" font-weight="600" fill="#e2e8f0">
        f(x) = x³ - 3x² + 2  ➔  f'(x) = 0
      </text>
      <text x="18" y="90" font-family="-apple-system, BlinkMacSystemFont, serif" font-size="13" fill="#94a3b8">
        Tìm cực đại, cực tiểu &amp; tích phân I
      </text>

      <!-- Grade Score Pill -->
      <rect x="235" y="16" width="78" height="26" rx="13" fill="rgba(16, 185, 129, 0.2)" stroke="rgba(16, 185, 129, 0.5)" stroke-width="1"/>
      <text x="274" y="33" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="800" fill="#10b981">10 / 10</text>
    </g>

    <!-- Progress bar & Student session preview -->
    <g transform="translate(30, 315)">
      <rect width="330" height="95" rx="20" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <text x="18" y="32" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="700" fill="#ffffff">Tiến độ hoàn thành bài tập</text>
      <text x="280" y="32" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="800" fill="#38bdf8">100%</text>

      <!-- Gradient bar -->
      <rect x="18" y="46" width="294" height="8" rx="4" fill="rgba(255,255,255,0.1)"/>
      <rect x="18" y="46" width="294" height="8" rx="4" fill="url(#logoBgGrad)"/>

      <text x="18" y="78" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="500" fill="#94a3b8">Học sinh: Đã nộp đúng hạn • Nhận xét 1:1</text>
    </g>
  </g>
</svg>`;

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');

  // 1. Write SVG files for source reference
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), logoSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'og-image.svg'), ogPreviewSvg, 'utf8');
  console.log('Saved SVG source files in public/');

  // 2. Render 512x512 PNG for Web & PWA (Square)
  const logoBuffer = await sharp(Buffer.from(logoSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'icon.png'), logoBuffer);
  fs.writeFileSync(path.join(publicDir, 'app-icon.png'), logoBuffer);
  console.log('Successfully generated public/icon.png and public/app-icon.png (512x512)');

  // 3. Render 1200x630 Horizontal PNG for Zalo / Facebook / OpenGraph Preview
  const ogBuffer = await sharp(Buffer.from(ogPreviewSvg))
    .resize(1200, 630)
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'og-image.png'), ogBuffer);
  console.log('Successfully generated public/og-image.png (1200x630 Horizontal Rectangular)');
}

main().catch(console.error);
