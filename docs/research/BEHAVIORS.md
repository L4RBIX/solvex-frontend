# Wope.com Behavior Bible

## Scroll Behavior
- No smooth scroll library detected
- Standard browser scroll
- Header may become sticky on scroll (z-index 2000, starts as position:relative)

## Animations
- Star/particle animation in hero (CSS `.star-animation` element, 591px tall overlay)
- Star animation in FAQ section
- Fade-in animations via `.animate-*` classes (animate-duration: 1s CSS variable)

## Header
- Starts transparent (background: rgba(0,0,0,0))
- position: relative in default state, z-index: 2000
- Likely becomes sticky/fixed on scroll (need to verify via scroll test)
- transition: all — some property transitions on scroll

## Research Cards
- Static content (no scroll-driven switching)
- `.magical-borders` class creates glowing animated border effects (likely CSS @keyframes or gradient animation)
- Cards are in a 2-column grid layout top, then full-width bottom

## FAQ
- Click-driven accordion (`.accordion` elements with `.accordion-header` and `.accordion-content`)
- Plus (+) icon rotates to X on open
- Click expands/collapses answer

## CTA
- Static section with a background image
- Input field + button (no special interaction beyond standard form)

## Hover States
- Nav links: likely opacity/color change
- Buttons: gradient/brightness shift
- Cards: likely border glow intensifies

## Responsive
- Desktop: 1470px viewport used for extraction
- Header max-width: 1248px with margin: 0 auto (111px each side at 1470px)
- Mobile nav: `.header-nav-mobile` element exists (hamburger menu)
- At mobile: content stacks vertically
