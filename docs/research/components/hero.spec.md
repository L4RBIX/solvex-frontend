# Hero Section Specification

## Overview
- **Target file:** `src/components/HeroSection.tsx`
- **Interaction model:** Static with CSS star animation overlay
- **Screenshot:** top viewport of page

## DOM Structure
```
section.content-asst-hero  (position:relative, z-index:100, text-align:center)
  └─ div.star-animation.star-animation-loaded  (height: 591px, absolute overlay)
  └─ div.content-asst-hero-lights  (height: 1331px, light glow effects)
  └─ div.content-asst-hero-container  (height: 1365px, main content)
       └─ h1 "New Era of SEO Research"
       └─ p (subtitle)
       └─ a.btn "Unlimited trial for 14 days"
       └─ div (hero app screenshot preview)
            └─ img (hero-video-desktop-preview.png)
```

Also below hero: logo bar with company logos

## Computed Styles (exact from getComputedStyle)

### section.content-asst-hero
- fontSize: 16px
- fontFamily: "Inter V", system-ui, sans-serif
- color: rgb(255, 255, 255)
- padding: 0px 0px 64px
- paddingBottom: 64px
- height: 1429px
- display: block
- position: relative
- zIndex: 100
- textAlign: center

### h1 "New Era of SEO Research"
- fontSize: 72px
- fontWeight: 700
- fontFamily: "Rebond Grotesque", system-ui, sans-serif
- lineHeight: 80px
- letterSpacing: -1.44px
- color: GRADIENT text (transparent bg-clip) — appears white but rendered as gradient
- textAlign: center
- marginBottom: ~24px
- The h1 text has a CSS gradient fill (webkit-background-clip: text; background: linear-gradient to bottom, white → slightly off-white)

### p (subtitle)
- fontSize: 18px (approx)
- fontWeight: 400
- fontFamily: "Inter V"
- lineHeight: 28px
- color: rgb(200, 196, 224) (slightly muted white/lavender)
- textAlign: center
- maxWidth: ~640px
- margin: 0 auto

### CTA Button "Unlimited trial for 14 days"
- fontFamily: "Inter V"
- fontSize: 15px
- fontWeight: 500
- lineHeight: 24px
- color: rgb(255, 255, 255)
- background: rgba(255,255,255,0.08) or similar dark translucent
- border: 1px solid rgba(255,255,255,0.15)
- borderRadius: 999px (pill)
- padding: 10px 24px
- display: inline-block
- marginTop: ~32px

## Text Content (verbatim)
- **H1:** "New Era of SEO Research"
- **Subtitle:** "Let our AI do the heavy lifting. Make your competitor research, find hidden keyword opportunities and get clear & actionable insights"
- **CTA:** "Unlimited trial for 14 days"

## Hero Background
- Body background: rgb(10, 1, 24) — very dark navy/purple (hex: #0a0118)
- `.hero-background` div with absolute positioning
  - `.hero-background-top`: dark/subtle radial gradient at top center (very faint light)
  - `.hero-background-bottom`: bright purple/violet glow at bottom — this is `hero-background-bottom.png`
- Star particles: small white dots scattered across viewport (CSS-animated)
- Thin perspective grid lines extending from center (subtle, white at very low opacity)

## Hero App Screenshot
- Image: `/images/research/hero-video-desktop-preview.png`
- Large app screenshot (~1400×775) of the Wope keyword research interface
- Positioned below the CTA button, partially visible at bottom of viewport
- Has a subtle border-radius and possibly a glowing border
- marginTop: ~48px

## Logo Bar (below hero screenshot)
Companies displayed in a horizontal row:
- QNB (bank logo)
- BMW (circular logo)
- Delivery Hero (text logo)
- Media Markt (with spiral icon)
- Bayer (circle logo)
- Amazon (text logo with arrow)
All logos: white/light colored, opacity ~0.6-0.7

### Logo bar styles
- display: flex
- justifyContent: space-between or space-around
- alignItems: center
- gap: ~48px
- padding: 32px 0
- borderTop: 1px solid rgba(255,255,255,0.08)
- marginTop: ~32px

## Assets
- Background bottom: `/images/hero/hero-background-bottom.png`
- App screenshot: `/images/research/hero-video-desktop-preview.png`
- Company logos: Use text-based SVG placeholders or download from wope.com/images/logos/

## Responsive Behavior
- **Desktop (1440px):** Full centered layout, h1 at 72px, screenshot full width
- **Mobile (390px):** h1 reduces to ~40px, screenshot scales down, logos wrap or scroll

## Star Animation
- Implement as CSS-animated scattered dots using `@keyframes twinkle` with random delays
- 20-30 small white circles (2-3px), absolute positioned across the hero
- Use `animation: twinkle 3s infinite alternate` with randomized delays
- opacity oscillates 0.2 → 1.0
