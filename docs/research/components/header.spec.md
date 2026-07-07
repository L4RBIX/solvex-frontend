# Header/Nav Specification

## Overview
- **Target file:** `src/components/Header.tsx`
- **Interaction model:** Sticky on scroll (becomes fixed/translucent after scrolling), Resources has dropdown
- **Screenshot:** `docs/design-references/` (top of page)

## DOM Structure
```
header.header  (fixed top, full width, z-2000)
  └─ [logo area]
       img (wope logo SVG)
  └─ nav
       a "Resources" + chevron ▾ (dropdown)
         dropdown: Wope for Agencies, Wope for Startups, Partnership, Affiliate
       a "Pricing"
       a "Download"
       a "Contact Us"
  └─ [auth area]
       a "Log in"
       a.glowing-box-button "Sign up"
```

## Computed Styles

### header.header
- fontFamily: "Inter V", system-ui, sans-serif
- fontSize: 16px
- fontWeight: 400
- lineHeight: 18.4px
- color: rgb(255, 255, 255)
- background: transparent (rgba 0,0,0,0)
- padding: 22px 0px
- margin: 0px auto (max-width 1248px with 111px side margins at 1470px)
- width: 1248px (max-width)
- height: 78px
- display: flex
- flexDirection: row
- justifyContent: space-between
- alignItems: center
- position: fixed (sticky at top — starts relative, becomes fixed on scroll)
- zIndex: 2000
- transition: all

### Logo
- Wope logo: SVG with circular icon + "wope" wordmark
- White colored

### Nav links (a tags)
- color: rgb(255, 255, 255)
- fontSize: 16px
- fontWeight: 400 (or 500)
- opacity on hover: ~0.7
- gap between links: ~32px

### "Log in" link
- color: rgb(255, 255, 255)
- fontWeight: 700
- No border, just text

### "Sign up" button (.glowing-box-button)
- fontSize: 14px
- fontWeight: 500
- lineHeight: 24px
- letterSpacing: -0.14px
- color: rgb(255, 255, 255) (white text, NOT black)
- background: radial-gradient(107.5% 107.5% at 50% 215%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 100%)
- padding: 4px 16px
- borderRadius: 999px (pill)
- border: 1px solid rgba(255, 255, 255, 0.1)
- position: relative
- zIndex: 1
- transition: all

## States & Behaviors

### Scroll behavior
- **Trigger:** scroll past ~80px
- **State A (top):** background: transparent, no shadow
- **State B (scrolled):** background: rgba(10,1,24,0.85) or similar dark semi-transparent, may add blur/backdrop-filter
- **Transition:** transition: all 0.3s ease

### Resources dropdown
- **Trigger:** hover or click on "Resources" 
- **Content:**
  - "Wope for Agencies — Grow your startup with wope." → /for-agencies
  - "Wope for Startups — Seamless Agency Solutions." → /for-startups
  - "Partnership — Grow together with Wope!" → /partnership
  - "Affiliate — Start, share and earn with Wope." → /affiliate

## Nav Links (verbatim)
- Resources (with dropdown chevron)
- Pricing → /pricing
- Download → /download
- Contact Us → /contact-us
- Log in → /login
- Sign up → /signup

## Assets
- Wope logo: inline SVG (see icons.tsx WopeLogoIcon)

## Responsive Behavior
- **Desktop (1248px+):** Full horizontal nav shown
- **Mobile:** `.header-nav-mobile` hamburger menu (hide desktop nav, show hamburger)
- **Breakpoint:** ~768px
