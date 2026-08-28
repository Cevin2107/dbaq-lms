# Liquid Glass Web & App Design System

> **Purpose:** A reusable design specification for AI coding/design agents to create web apps, mobile apps, dashboards, landing pages, components, buttons, navigation, modals, transitions, and interactions inspired by Apple's modern **Liquid Glass** design language.
>
> **Reference:** Apple introduced Liquid Glass as a dynamic material and unified design language across its platforms. This document adapts its principles for the web rather than attempting to reproduce Apple's proprietary UI exactly.

---

## 1. Design Direction

Build interfaces that feel:

- Premium
- Minimal
- Calm
- Spatial
- Lightweight
- Translucent
- Fluid
- Responsive
- Content-first
- Physically believable
- Elegant rather than flashy

The visual language should be **Apple-inspired Liquid Glass**, not generic "glassmorphism".

### Core concept

Think of the UI as having two major layers:

1. **Content layer** — the actual application content.
2. **Functional glass layer** — navigation and controls floating above the content.

Do **not** cover the entire application in glass. Glass should create hierarchy and separation.

---

# 2. Core Visual Principles

## 2.1 Translucency

Glass surfaces should allow the environment behind them to remain visible.

Use:

- `backdrop-filter: blur(...)`
- semi-transparent backgrounds
- subtle saturation
- subtle brightness adjustment
- soft shadows
- layered highlights

Avoid:

- completely opaque cards everywhere
- excessive blur
- strong white borders
- heavy gradients
- fake "frosted glass" on every element

Example:

```css
background: rgba(255, 255, 255, 0.10);
backdrop-filter: blur(24px) saturate(140%);
-webkit-backdrop-filter: blur(24px) saturate(140%);
border: 1px solid rgba(255, 255, 255, 0.16);
```

For dark mode, use a darker translucent surface instead of simply inverting the light theme.

---

# 3. Liquid Glass Material

A glass component should feel like a **material**, not a flat transparent rectangle.

Use several subtle layers:

### Layer 1 — Base material

A translucent surface.

### Layer 2 — Blur

Blur the content behind the surface.

### Layer 3 — Depth

Use extremely soft shadows to lift the object from the background.

### Layer 4 — Specular highlight

Add a very subtle highlight along the upper edge or light-facing area.

### Layer 5 — Lensing / refraction illusion

Where technically practical, create a subtle optical distortion or highlight near curved edges.

On the web, do not overdo actual distortion. A convincing combination of blur, gradients, highlights and shadows is preferable to a visually noisy effect.

### Layer 6 — Ambient tint

Allow nearby colors to subtly influence the glass.

For example:

- blue content → slightly cool glass
- purple content → slightly purple ambient reflection
- green content → slightly green reflection

The tint must remain subtle.

---

# 4. Lensing

**Lensing is one of the defining ideas of Apple's Liquid Glass.**

The edge of a glass element should subtly communicate:

- refraction
- curvature
- thickness
- depth
- interaction with the background

Use:

- subtle edge highlights
- soft radial gradients
- slight brightness changes
- restrained distortion where supported

Do not create obvious "bubble" effects.

The user should feel:

> "This surface is physically present."

rather than:

> "This is a CSS glass effect."

---

# 5. Shapes

Prefer:

- rounded rectangles
- capsules
- pills
- floating circles
- concentric rounded geometry

Use generous corner radii.

Recommended ranges:

```text
Small controls:       10–14px
Medium controls:      14–18px
Cards:                20–28px
Large floating panels: 24–32px
Pills / capsules:     999px
Floating buttons:     50% / circle
```

Do not randomly mix many different radii.

Use a coherent radius system.

---

# 6. Concentricity

Rounded shapes should feel geometrically related.

For example:

```text
Outer container
    ↓
Inner glass surface
    ↓
Button
    ↓
Icon
```

Their curvature should feel intentional.

Avoid situations where a 32px card contains a 4px button corner radius unless there is a clear functional reason.

---

# 7. Navigation

Navigation should usually occupy the **functional glass layer**.

Examples:

- top navigation
- floating tab bar
- sidebar
- toolbar
- action controls
- search controls
- floating action buttons

The content should remain visually dominant.

### Navigation behavior

When scrolling:

- content can move underneath
- navigation remains stable
- subtle scroll-edge blur/fade may appear
- contrast should automatically increase when content passes underneath

Avoid hard borders whenever a soft spatial separation can communicate hierarchy.

---

# 8. Buttons

Buttons should feel tactile and alive.

## Primary button

Use:

- glass material
- stronger tint
- high contrast label
- rounded shape
- subtle shadow

Example concept:

```text
Normal
    ↓
transparent glass + subtle tint

Hover
    ↓
slightly brighter + stronger highlight

Press
    ↓
slight scale down + compression

Release
    ↓
smooth spring back
```

### Recommended interaction

```text
hover:  scale(1.01–1.02)
press:  scale(0.96–0.98)
release: spring back
```

Never make buttons dramatically bounce.

---

# 9. Button States

Every interactive component should have:

### Default

Quiet, translucent, low visual noise.

### Hover

- slightly brighter
- subtle lift
- stronger specular highlight
- optional ambient glow

### Focus

- clear accessible focus ring
- subtle glass highlight

### Pressed

- slight compression
- subtle brightness change
- short spring animation

### Disabled

- reduced opacity
- reduced contrast
- no strong glow

### Loading

Prefer morphing the existing control into a loading state rather than replacing it abruptly.

---

# 10. Glass Morphing

One of the most important behaviors:

**Glass should morph rather than simply disappear and reappear.**

Examples:

```text
Button
   ↓
Expanded menu
   ↓
Popover
```

The transition should feel like the same physical material changing shape.

Avoid:

```text
button disappears
↓
menu fades in
```

Prefer:

```text
button expands
↓
shape morphs
↓
content appears
```

Use shared geometry where possible.

---

# 11. Animation Philosophy

Animation is part of the material.

Do not use animation purely for decoration.

Every animation should communicate:

- cause
- continuity
- hierarchy
- spatial relationship
- feedback

### General motion

Prefer:

- smooth easing
- spring-like motion
- short transitions
- slight overshoot
- natural deceleration

Avoid:

- linear movement for UI transitions
- excessive bounce
- slow cinematic transitions
- constant floating animations
- unnecessary particle effects

---

# 12. Recommended Timing

Use approximately:

```text
Micro interaction:       120–180ms
Button state:            140–220ms
Popover:                 220–320ms
Modal:                   280–420ms
Page transition:         300–500ms
Large layout morph:      400–650ms
```

These are guidelines, not rigid rules.

Prefer spring-based animation where the framework supports it.

---

# 13. Easing

Preferred:

```css
cubic-bezier(0.22, 1, 0.36, 1)
```

For subtle UI transitions:

```css
cubic-bezier(0.25, 0.8, 0.25, 1)
```

For spring-like interactions, use the animation library's spring physics rather than manually simulating a spring with excessive keyframes.

---

# 14. Page Transitions

Page changes should feel continuous.

Preferred:

```text
Current content
     ↓
subtle movement / fade
     +
new content
     ↓
settles into position
```

Avoid abrupt:

```text
display: none
↓
display: block
```

when a transition can preserve spatial continuity.

For route transitions:

- use subtle opacity
- small translation
- shared element transitions
- preserve navigation position
- avoid excessive zoom

---

# 15. Modals and Sheets

Avoid generic centered rectangles whenever possible.

Prefer the relationship:

```text
Trigger
  ↓
element expands from trigger
  ↓
popover / sheet
```

For mobile:

- bottom sheets may emerge from the lower edge
- rounded upper corners
- glass material
- soft background dimming

For desktop:

- contextual popovers should remain spatially connected to the triggering element

---

# 16. Cards

Cards should not all look like identical glass boxes.

Use glass cards mainly when they provide:

- hierarchy
- grouping
- floating content
- contextual controls

For ordinary content, prefer:

```text
clean background
+
typography
+
spacing
```

instead of putting everything inside glass.

---

# 17. Backgrounds

Backgrounds should provide depth for the glass.

Good backgrounds:

- subtle gradients
- large blurred color fields
- photographs
- illustrations
- soft atmospheric shapes
- application content

Example:

```css
background:
  radial-gradient(circle at 20% 20%, rgba(...), transparent 35%),
  radial-gradient(circle at 80% 70%, rgba(...), transparent 35%),
  var(--background);
```

Keep background decoration subtle.

The background should support the UI rather than compete with it.

---

# 18. Shadows

Use soft, layered shadows.

Avoid:

```css
box-shadow: 0 20px 60px black;
```

when it produces an obvious floating sticker.

Prefer multiple subtle layers:

```css
box-shadow:
  0 1px 2px rgba(0,0,0,.08),
  0 8px 24px rgba(0,0,0,.10),
  0 24px 60px rgba(0,0,0,.08);
```

Adapt shadow intensity to light/dark mode.

---

# 19. Borders

Borders should be subtle.

Prefer:

```css
border: 1px solid rgba(255,255,255,.12);
```

or a contextual border.

Do not create strong white outlines around every glass component.

---

# 20. Typography

Typography should be:

- clean
- highly readable
- hierarchical
- restrained
- spacious

Prefer system fonts:

```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "SF Pro Display",
  "SF Pro Text",
  "Inter",
  system-ui,
  sans-serif;
```

For web projects, do not require Apple-only fonts unless licensing/availability is appropriate.

Use:

- strong hierarchy
- generous line-height
- medium/bold headings
- restrained letter spacing
- comfortable body text

Avoid excessive uppercase text.

---

# 21. Icons

Use simple, recognizable icons.

Preferred style:

- thin to medium stroke
- rounded geometry
- consistent optical weight
- minimal detail

If an icon library is used, use one coherent icon set throughout the application.

Do not mix unrelated icon styles.

---

# 22. Color

Color should be functional rather than decorative.

Use a neutral foundation:

```text
Background
Surface
Glass
Elevated Glass
Primary Text
Secondary Text
Border
Accent
Success
Warning
Error
```

Accent colors should be used selectively for:

- primary actions
- selected states
- important status
- active navigation
- meaningful emphasis

Do not tint every glass component.

---

# 23. Light Mode

Light mode should feel:

- bright
- airy
- translucent
- soft

Glass should usually be light and slightly transparent.

Content behind the glass should remain visible without reducing readability.

---

# 24. Dark Mode

Dark mode should NOT simply be:

```text
light theme → invert colors
```

Instead:

- use dark translucent surfaces
- preserve subtle highlights
- use softer shadows
- increase edge definition where necessary
- allow colorful content to influence glass subtly

The UI should feel luminous rather than black.

---

# 25. Adaptive Glass

The appearance of glass should respond to its environment.

When content behind the glass becomes visually complex:

```text
increase contrast
increase background separation
slightly increase surface opacity
```

When the background is simple:

```text
reduce opacity
allow more content through
```

The objective is always:

> maximum visual transparency without sacrificing readability.

---

# 26. Interaction Feedback

Interactive glass should feel responsive.

When the user interacts:

```text
touch / click
    ↓
glass flexes
    ↓
internal highlight appears
    ↓
component slightly scales
    ↓
returns smoothly
```

For nearby glass components, subtle shared light effects can reinforce the idea that they belong to the same material system.

---

# 27. Hover Effects

Desktop hover:

- slight brightness increase
- subtle elevation
- soft highlight
- tiny scale increase

Example:

```css
transition:
  transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
  background 180ms ease,
  box-shadow 180ms ease;
```

Avoid large glow effects.

---

# 28. Touch / Mobile

Mobile interactions should feel direct.

Use:

- larger touch targets
- responsive glass controls
- subtle press compression
- bottom sheets
- floating navigation
- edge-to-edge content

Do not rely on hover effects on touch devices.

---

# 29. Responsive Design

The design must work across:

```text
Mobile
Tablet
Laptop
Desktop
Large desktop
```

Do not simply scale the desktop layout down.

Instead, allow the hierarchy to adapt.

Example:

```text
Desktop:
Sidebar + content

Tablet:
Compact floating navigation

Mobile:
Bottom navigation / contextual controls
```

---

# 30. Scroll Behavior

Content can extend beneath floating controls.

Use subtle scroll-edge separation.

Example:

```text
content
████████████████
      ↓
soft blur / fade
      ↓
floating glass toolbar
```

Avoid permanent heavy separators.

The separation should become stronger only when content actually approaches the floating UI.

---

# 31. Forms and Inputs

Inputs should feel like part of the glass material.

Use:

- translucent surface
- subtle inner highlight
- clear focus state
- rounded corners
- strong readable text

Focus:

```text
slightly brighter glass
+
accent-colored focus ring
+
subtle glow
```

Do not remove accessibility indicators merely for aesthetics.

---

# 32. Dropdowns

Dropdowns should feel connected to their trigger.

Preferred:

```text
Trigger
   ↓
expands / morphs
   ↓
menu
```

Menu:

- glass surface
- soft shadow
- rounded corners
- clear selected state

Items should animate subtly when appearing.

---

# 33. Tabs

Tabs should be lightweight.

Avoid heavy rectangular tab backgrounds.

Preferred:

```text
Overview   Calendar   Settings
             ↑
       subtle glass pill
```

The selected indicator may be a small glass capsule or tinted glass surface.

---

# 34. Toggles

Toggles should have:

- clear on/off state
- glass track
- tactile thumb
- spring movement

The thumb may slightly stretch or compress during interaction.

---

# 35. Sliders

Slider interaction should feel physical.

When dragging:

- thumb slightly enlarges
- thumb can stretch subtly
- track responds smoothly
- release has a small spring-back

Avoid exaggerated animation.

---

# 36. Loading States

Prefer fluid transformations.

Examples:

```text
Button → spinner → success
```

or:

```text
Skeleton → content
```

Avoid flashing entire screens.

Skeletons should use subtle animated gradients only when useful.

---

# 37. Toasts / Notifications

Notifications should feel like floating glass objects.

Use:

- compact size
- rounded corners
- subtle blur
- strong text contrast
- contextual icon
- short entrance animation

Preferred entrance:

```text
slight scale + opacity + translation
```

not a dramatic bounce.

---

# 38. Accessibility

Liquid Glass aesthetics must never reduce usability.

Always support:

```text
prefers-reduced-motion
prefers-contrast
dark mode
keyboard navigation
focus visibility
screen readers
sufficient text contrast
```

When reduced motion is enabled:

- remove large morphing
- remove unnecessary parallax
- minimize scale animations
- use simple fades where appropriate

When transparency must be reduced:

- increase surface opacity
- reduce blur dependency
- preserve clear hierarchy

---

# 39. Performance

Glass effects can be expensive.

Use `backdrop-filter` selectively.

Do NOT apply heavy blur to:

- every card
- every list item
- every table row
- every text container

Prefer glass for the functional layer:

```text
Navigation
Toolbar
Floating controls
Dialogs
Contextual menus
Important interactive surfaces
```

For large lists, avoid hundreds of individually blurred elements.

---

# 40. Component Architecture

When implementing in React / Next.js / Vue / Svelte/etc., create reusable primitives.

Recommended:

```text
GlassSurface
GlassButton
GlassIconButton
GlassInput
GlassCard
GlassPopover
GlassModal
GlassSheet
GlassTabs
GlassNavbar
GlassSidebar
GlassToolbar
GlassToast
GlassSwitch
GlassSlider
```

Each component should share the same design tokens.

---

# 41. Design Tokens

Create centralized variables.

Example:

```css
:root {
  --glass-blur: 24px;
  --glass-saturation: 140%;

  --glass-radius-sm: 12px;
  --glass-radius-md: 18px;
  --glass-radius-lg: 26px;
  --glass-radius-pill: 999px;

  --motion-fast: 160ms;
  --motion-normal: 280ms;
  --motion-slow: 420ms;

  --ease-liquid: cubic-bezier(0.22, 1, 0.36, 1);
}
```

Do not scatter magic numbers throughout the application.

---

# 42. What NOT To Do

Avoid generic "Dribbble glassmorphism".

Do NOT:

- make every surface transparent
- use huge white borders
- use excessive blur
- use neon glows everywhere
- use strong drop shadows
- put gradients everywhere
- make every element float
- use excessive rounded corners
- use unnecessary animations
- sacrifice readability
- create glass inside glass inside glass
- use glass in the content layer without a reason
- make the interface look like a futuristic dashboard

The goal is **quiet sophistication**.

---

# 43. Apple-Inspired, Not Apple-Copied

The visual direction may explicitly reference:

- Apple's Liquid Glass
- Apple's Human Interface Guidelines
- iOS 26
- iPadOS 26
- macOS Tahoe
- visionOS

However, do not blindly copy Apple's exact layouts, icons, proprietary assets, or application screens.

Use Apple's principles as inspiration:

```text
Hierarchy
Harmony
Consistency
Adaptivity
Clarity
Spatial relationships
Fluid motion
Material behavior
```

---

# 44. AI Implementation Instructions

When generating UI code, the AI MUST:

1. Read this document before designing.
2. Treat Liquid Glass as a **design system**, not a CSS effect.
3. Prioritize content over decoration.
4. Use glass primarily for navigation and functional controls.
5. Use translucency, blur, depth, lensing-inspired highlights and adaptive tint.
6. Make interactions feel fluid and physical.
7. Use consistent geometry and corner radii.
8. Use reusable design tokens.
9. Make the UI responsive.
10. Support light and dark mode.
11. Support reduced motion.
12. Maintain accessibility.
13. Optimize backdrop-filter usage.
14. Avoid excessive glass.
15. Avoid generic glassmorphism aesthetics.
16. Prefer subtlety over visual intensity.

---

# 45. Visual Quality Checklist

Before considering a screen complete, check:

### Material

- Does the glass feel translucent?
- Does it have depth?
- Does the background influence the material?
- Is the blur subtle?

### Hierarchy

- Is content more important than controls?
- Are controls clearly separated from content?
- Is glass used only where it provides value?

### Motion

- Do interactions feel responsive?
- Do components morph naturally?
- Are transitions short and smooth?
- Does reduced-motion work?

### Geometry

- Are corner radii consistent?
- Do nested shapes feel concentric?
- Are touch targets large enough?

### Typography

- Is text readable?
- Is hierarchy obvious?
- Is contrast sufficient?

### Overall

The final result should feel:

> **Calm + Premium + Fluid + Spatial + Minimal + Responsive**

not:

> **Transparent + Blurry + Glowy + Overdesigned**

---

# 46. Short AI Prompt

If the full document is unavailable, use this condensed instruction:

> Design the interface using Apple's modern Liquid Glass design language. Use translucent adaptive materials, backdrop blur, subtle lensing/refraction-inspired edge highlights, specular highlights, soft depth, rounded floating controls, adaptive tint, and fluid spring-like interactions. Treat glass as a functional navigation/control layer above the content rather than covering everything with glass. Prioritize hierarchy, harmony, consistency, readability, accessibility and performance. Components should morph between states instead of simply fading. Buttons should subtly flex, brighten and compress on interaction. Navigation should float above edge-to-edge content with contextual scroll-edge separation. Support light/dark mode, reduced motion and responsive layouts. The result should feel calm, premium, spatial, minimal and unmistakably inspired by Apple's Liquid Glass — not generic glassmorphism.

---

## Official Apple References

- Apple — **Meet Liquid Glass**
- Apple Human Interface Guidelines
- Apple — **Liquid Glass documentation**
- Apple — **WWDC Design Guide**

Use these references to understand the underlying principles rather than copying Apple's proprietary UI directly.
