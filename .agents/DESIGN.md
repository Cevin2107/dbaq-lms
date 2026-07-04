# Modern Soft Apple + Fresh Color Design System

## Overview

This project has evolved from a strict, monochromatic Apple-like catalog into a warmer, more vibrant educational platform. We retain Apple's meticulous typography and clean structural rhythm but inject **soft curves, breathable spacing, floating elevation, and fresh pastel gradients** to make the system feel welcoming, dynamic, and engaging for students.

**Key Characteristics:**
- **Soft Geometry**: Extremely generous border radii (`rounded-[2rem]` or `32px`) on all major containers (Hero, Search Cards, Assignment Grids). Sharp corners are entirely eliminated.
- **Floating Elevation**: Instead of edge-to-edge tiles, we use floating containers with subtle drop shadows (`shadow-[0_4px_20px_rgba(0,0,0,0.03)]`) that lift further on hover (`hover:-translate-y-1 hover:shadow-xl`).
- **Fresh Gradients**: We explicitly allow soft, airy gradients (e.g., `bg-gradient-to-br from-white via-[#f0f9ff] to-[#e0f2fe]`) to draw attention to primary sections like the Hero, breaking the strict monochrome rule.
- **Muted Pastel Badges**: Utility chips and subject tags use soft pastel backgrounds (`bg-blue-50`, `bg-emerald-50`) paired with slightly darker text (`text-blue-600`), providing clear visual scanning without being garish.
- **Dynamic Interactivity**: Action buttons and interactive elements use vibrant brand colors (Action Blue `#0066cc`) with subtle shadows. Hover states and iOS-style segmented controls are heavily utilized.
- **Perfect Alignment**: A strict `max-w-[1440px] px-4 sm:px-6 md:px-8` constraint is applied universally across the Navbar, Hero, and Main Content Grids, ensuring perfect left-right alignment.

## Colors

### Brand & Accent
- **Action Blue** (`#0066cc` / `#0071e3`): The core interactive color for primary CTAs ("Làm bài", "Đăng ký lịch học"). Often paired with a subtle shadow (`shadow-blue-500/20`) to make buttons pop.
- **Destructive/Alert** (`#ef4444` / `text-red-600`): Used for "Đăng xuất" and "Gấp" (Urgent) badges. Always applied with soft backgrounds (`bg-red-50`).

### Surface & Canvas
- **Pure White / Dark Void** (`bg-[#ffffff]` / `bg-[#000000]` or `#1d1d1f`): The primary backgrounds for cards.
- **Parchment Base** (`bg-[#f5f5f7]`): Used as the body background on light mode to allow white cards to pop.
- **Glassmorphism**: Extensively used in the floating Navbar (`bg-white/80 backdrop-blur-md`) and mobile Hero overlays.

### Pastel Subject Tags
To provide visual distinction without overwhelming the user, subjects are color-coded using extreme pastels:
- **Toán**: `bg-blue-50 text-blue-600`
- **Lý**: `bg-indigo-50 text-indigo-600`
- **Hóa**: `bg-emerald-50 text-emerald-600`
- **Văn**: `bg-rose-50 text-rose-600`
- **Anh**: `bg-amber-50 text-amber-600`
- **Sinh**: `bg-teal-50 text-teal-600`

### Text
- **Near-Black Ink** (`#1d1d1f`): The voice of all headlines and primary body text. 
- **Muted Text** (`#1d1d1f/60` / `text-slate-500`): Used for secondary info, due dates, and subtitles.

## Typography

- **Font Family**: We rely on standard `system-ui`, but we enforce Apple's tight tracking rules.
- **Tracking (Letter Spacing)**: Headlines use negative tracking (`tracking-[-0.02em]` or `-0.12px` for small nav text) to look dense and modern.
- **Line Height**: Tighter for headlines (`leading-[1.07]` to `leading-[1.3]`), standard for body.

## Layout & Components

### The Global Container
Every major horizontal section (Navbar, Hero, Assignment List) must be wrapped in:
`w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8`
This ensures the entire layout forms a perfect, unified vertical column.

### Navigation Bar
- **Floating Pill**: `rounded-full`, fixed at the top with a gap (`top-4 left-4 right-4`), using `backdrop-blur-md`.
- **Buttons**: Action buttons in the nav use pastel backgrounds (`bg-sky-50 text-sky-600`) instead of being purely flat links.

### The Hero Section
- **Floating Tile**: `rounded-[2rem]` or `3rem`, sitting inside the global container.
- **Gradient Background**: A signature light blue and white gradient `bg-gradient-to-br from-[#ffffff] via-[#f0f9ff] to-[#e0f2fe]`.
- **Shadow**: A vibrant, color-tinted shadow `shadow-[0_8px_30px_rgba(0,102,204,0.08)]`.

### Search & Filters
- **Segmented Controls**: Instead of distinct buttons or generic dropdowns, status filters use an iOS-style segmented control wrapper (`bg-slate-100 p-1 rounded-full`) where the active tab becomes a white pill with a shadow.

### Assignment Cards
- **Generous Curves**: `rounded-[2rem]` (32px) to match the Hero tile exactly.
- **Breathable Grid**: Grid spacing uses `gap-6` to `gap-8`.
- **Interactivity**: `transition-all hover:-translate-y-1 hover:shadow-xl group`. The title turns blue on hover (`group-hover:text-[#0066cc]`).

## Do's and Don'ts

### Do
- **Do use `rounded-[2rem]`** for all major structural blocks. Consistency in curve radius is paramount.
- **Do align everything** to the `max-w-[1440px] px-4 sm:px-6 md:px-8` grid.
- **Do use pastel backgrounds** (`bg-blue-50`) with darker text (`text-blue-600`) for utility chips.
- **Do apply `whitespace-nowrap`** on critical mobile titles to prevent awkward orphan words.

### Don't
- **Don't use harsh, fully saturated backgrounds** for cards or tags (avoid `bg-blue-500` for tags).
- **Don't use edge-to-edge full-bleed tiles**. Everything must float within the container to maintain the "card" aesthetic.
- **Don't use generic `container` classes** without verifying they match the `1440px` max-width.
