# Research Cards Section Specification

## Overview
- **Target file:** `src/components/ResearchCardsSection.tsx`
- **Interaction model:** Static display cards
- **Screenshot:** scroll position ~1200-2800px

## DOM Structure
```
div.research-cards  (padding top ~80px)
  └─ div.section-header
       └─ h2.section-header-title "Meet New-Gen\nResearch Experience"
  └─ div.magical-borders  (height: 1164px)
       └─ div.research-cards-content.magical-borders-content  (2-column grid)
            └─ div.research-detailed  (left column, height:544px)
                 Title + description + icon collage mockup
            └─ div.research-explore  (right column, height:544px)
                 Title + description + table mockup
       └─ div.research-track  (full-width bottom, height ~620px)
            Large keyword research table mockup
```

## Computed Styles

### h2.section-header-title "Meet New-Gen Research Experience"
- fontSize: 56px
- fontWeight: 700
- fontFamily: "Rebond Grotesque", system-ui
- lineHeight: 64px
- color: rgb(255, 255, 255)
- textAlign: center
- marginBottom: ~48px

### div.magical-borders container
- background: rgba(255,255,255,0.03) or similar
- border: 1px solid rgba(255,255,255,0.08)
- borderRadius: 24px
- position: relative
- overflow: hidden
- The "magical borders" effect: animated gradient border/glow effect
  - CSS: @keyframes rotating gradient along borders
  - Creates colorful (purple/blue) animated glow on card edges

### research-cards-content grid
- display: grid
- gridTemplateColumns: 1fr 1fr (two equal columns)
- gap: 1px (thin border line between)
- borderBottom: 1px solid rgba(255,255,255,0.08) (separator between rows)

### Card: "Detailed Backlink Profile Analysis" (left)
- padding: 40px
- height: 544px
- Title: "Detailed Backlink-\nProfile Analysis"
  - fontSize: 24px, fontWeight: 700, color: #fff
  - fontFamily: "Rebond Grotesque"
- Description: "Uncover backlink sources, anchor texts, and authority scores to optimize your strategy and boost SEO."
  - fontSize: 14px, color: rgb(155, 150, 176), lineHeight: 24px
- Image area: icon collage mockup (floating icon cards arrangement)
  - `/images/research/card-detailed-desktop.svg` (main background SVG ~352×256)
  - `/images/research/card-detailed-light1.png` (glow overlay 1)
  - `/images/research/card-detailed-light2.png` (glow overlay 2)
  - `/images/research/card-detailed-icon1.png` (64×64 floating icon)
  - `/images/research/card-detailed-icon2.png` (64×64 floating icon)
  - `/images/research/card-detailed-icon3.png` (64×64 floating icon)

### Card: "Explore Shared SEO Keywords" (right)
- padding: 40px
- height: 544px
- Title: "Explore Shared SEO Keywords"
  - fontSize: 24px, fontWeight: 700, color: #fff
- Description: "Rapidly pinpoint overlapping keywords between two websites for competitive SEO analysis and strategic keyword planning."
  - fontSize: 14px, color: rgb(155, 150, 176), lineHeight: 24px
- Image area: table/data mockup showing comparison
  - `/images/research/card-explore-light1.png` (glow 1)
  - `/images/research/card-explore-light2.png` (glow 2)
  - `/images/research/card-explore-table2.svg` (table SVG mockup)

### Card: Research Track Table (bottom, full-width)
- height: ~620px
- Full-width dark panel
- Shows a keyword research table: wope.com results (12,345 Result)
- Table columns: Keyword | Volume | Trend | Search Intent | K.D. | Position | Visual Rank | Change | URL
- Sample data rows:
  - wope | 132.8K | Navigational | 50 | 1 | 1 | +2 | wope.com/
  - seo do | 29.4K | Informational | 17 | 4 | 5 | 0 | wope.com/
  - do seo | 26.7K | Navigational | 100 | 7 | 9 | +4 | wope.com/
  - free content generator | 21.3K | Informational | 69 | 12 | 13 | +in | wope.com/
  - daily rank tracking | 17.5K | Informational | 31 | 14 | 16 | -12 | wiki.wope.com/
  - localized keyword research | 13.9K | Navigational | 57 | 17 | 17 | +in | wiki.wope.com/
  - amazon rank tracker | 11.1K | Informational | 44 | 26 | 29 | +8 | wope.com/
- Header shows: "wope.com (US, en)" with Filter, Sort controls
- Footer shows: "1–101 of 2,345 | PAGE 1 of 23" with navigation arrows

## Magical Borders Effect
- Create with CSS: rotating conic-gradient border
- Border glow: rgba purple/violet gradient animated around card edges
- Implementation: pseudo-element with conic-gradient + animation

```css
.magical-borders {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
}
.magical-borders::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 24px;
  background: conic-gradient(from var(--angle), transparent 20%, rgba(139, 92, 246, 0.6), transparent 80%);
  animation: rotate 4s linear infinite;
  z-index: 0;
}
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes rotate {
  to { --angle: 360deg; }
}
```

## Text Content (verbatim)
- Section header: "Meet New-Gen\nResearch Experience"
- Card 1 title: "Detailed Backlink-\nProfile Analysis"
- Card 1 desc: "Uncover backlink sources, anchor texts, and authority scores to optimize your strategy and boost SEO."
- Card 2 title: "Explore Shared SEO Keywords"
- Card 2 desc: "Rapidly pinpoint overlapping keywords between two websites for competitive SEO analysis and strategic keyword planning."

## Assets
- `/images/research/card-detailed-desktop.svg`
- `/images/research/card-detailed-light1.png`, `light2.png`
- `/images/research/card-detailed-icon1.png`, `icon2.png`, `icon3.png`
- `/images/research/card-explore-light1.png`, `light2.png`
- `/images/research/card-explore-table2.svg`

## Responsive Behavior
- **Desktop (1440px):** 2-column top row + full-width bottom
- **Mobile (390px):** Single column stacked cards
- **Breakpoint:** ~768px
