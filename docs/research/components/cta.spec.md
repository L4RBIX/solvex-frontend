# CTA Section Specification

## Overview
- **Target file:** `src/components/CTASection.tsx`
- **Interaction model:** Static with functional input
- **Screenshot:** scroll position ~4009px

## DOM Structure
```
div.cta  (background-image: cta-background.png)
  └─ img (Wope app icon — purple rounded square with chart icon)
  └─ h2 "Outrank Everyone. Starting Now."
  └─ p "Wope analyzes millions of data points to deliver predictive insights."
  └─ div.cta-form
       └─ input[placeholder="Enter your domain"]
       └─ button "Try Demo"
  └─ div.cta-footer
       └─ span "No credit card required"
       └─ span "✦"
       └─ span "14-days free trial"
```

## Computed Styles

### div.cta container
- position: relative
- backgroundImage: url('/images/cta/cta-background.png')
- backgroundSize: cover
- backgroundPosition: center
- borderRadius: 24px
- margin: 0 80px (or similar horizontal margin)
- padding: ~80px 40px
- textAlign: center
- height: ~642px
- display: flex
- flexDirection: column
- alignItems: center
- justifyContent: center
- overflow: hidden

The background image shows:
- Dark navy base
- Bright purple/violet glow at top (like a light source)
- Perspective grid lines (like a retrowave/cyberpunk grid)
- The grid extends from the glow toward bottom

### App icon image
- width: ~80px, height: ~80px
- borderRadius: 18px (rounded square)
- marginBottom: 24px
- The icon is a purple rounded square with a white circular chart/analytics icon

### h2 "Outrank Everyone. Starting Now."
- fontSize: 56px
- fontWeight: 700
- fontFamily: "Rebond Grotesque"
- lineHeight: 64px
- color: rgb(255, 255, 255)
- textAlign: center
- marginBottom: 16px
- letterSpacing: -0.5px

### p subtitle
- fontSize: 18px
- color: rgba(255,255,255,0.6)
- textAlign: center
- marginBottom: 32px
- lineHeight: 28px

### Input + Button form
- display: flex
- alignItems: center
- gap: 4px
- background: rgba(255,255,255,0.08)
- borderRadius: 999px
- border: 1px solid rgba(255,255,255,0.15)
- padding: 4px 4px 4px 20px

#### Input
- fontSize: 15px
- color: rgb(255,255,255)
- background: transparent
- border: none
- outline: none
- placeholder color: rgba(255,255,255,0.4)
- width: ~200px

#### "Try Demo" button
- fontSize: 14px
- fontWeight: 600
- color: rgb(255, 255, 255)
- background: rgb(139, 92, 246) (purple accent)
- borderRadius: 999px
- padding: 10px 20px
- border: none
- cursor: pointer

### Footer text
- fontSize: 13px
- color: rgba(255,255,255,0.5)
- marginTop: 16px
- display: flex
- alignItems: center
- gap: 8px
- The "✦" sparkle separator between "No credit card required" and "14-days free trial"

## Text Content (verbatim)
- **H2:** "Outrank Everyone. Starting Now."
- **Subtitle:** "Wope analyzes millions of data points to deliver predictive insights."
- **Input placeholder:** "Enter your domain"
- **Button:** "Try Demo"
- **Footer:** "No credit card required ✦ 14-days free trial"

## Assets
- Background: `/images/cta/cta-background.png`
- App icon: download from wope.com (purple Wope app icon image)

## Responsive Behavior
- **Desktop:** max-width ~1248px, centered with side margins
- **Mobile:** full width, h2 reduces to ~32px, form stacks vertically
