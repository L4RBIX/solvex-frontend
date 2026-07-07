# Wope.com Page Topology

## URL: https://wope.com/
## Total scroll height: ~5195px
## Framework: Qwik (JS), but we build in Next.js 16

## Page Layout
- Body background: rgb(10, 1, 24) — deep dark navy/purple
- Single scrolling page (no snap)
- No smooth scroll library detected
- Stars/particle background on multiple sections

## Sections (top to bottom)

| # | Name | Class | Top | Height | Interaction |
|---|------|-------|-----|--------|-------------|
| 1 | Header/Nav | `header.header` | 0 | 78px | Static (sticky on scroll?) |
| 2 | Hero | `.content-asst-hero` | 0 | 1429px | Static, star animation |
| 3 | Logo Bar | inside hero | ~900px | ~120px | Static (logos row) |
| 4 | Research Cards | `.research-cards` | 1429px | 1620px | Static cards |
| 5 | FAQ | `.faq.container-md` | 3049px | 961px | Click-driven accordion |
| 6 | CTA | `.cta` (lazy-background-image) | 4009px | 642px | Static with input |
| 7 | Footer | `.footer` | 4651px | 544px | Static |

## Z-index layers
- Header: z-index 2000 (floats above hero)
- Hero content: z-index 100
- Star animations: behind content

## Fixed/Sticky elements
- Header appears fixed/sticky over hero (z-index 2000)

## Notes
- The hero section has a `.hero-background` with a bottom gradient PNG
- Stars are CSS/JS animated particles
- Research cards use `.magical-borders` for glowing border effects
- The CTA has a background image with grid/perspective effect
