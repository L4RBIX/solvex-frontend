# Footer Specification

## Overview
- **Target file:** `src/components/Footer.tsx`
- **Interaction model:** Static
- **Screenshot:** scroll position ~4651px (bottom of page)

## DOM Structure
```
div.footer
  └─ div.footer-main (flex row)
       └─ div.footer-brand (left col)
            └─ [Wope logo SVG]
            └─ p "Experience the next generation of SEO analytics."
            └─ a "Unlimited trial for 14 days" (pill button)
       └─ div.footer-links (middle cols, flex row)
            └─ div.footer-col "Platform"
                 Pricing, Partnership, Affiliate, Download, Contact Us
            └─ div.footer-col "Legals"
                 Terms of Services, Privacy Policy
            └─ div.footer-col "Wope for"
                 Agencies, Startups
       └─ div.footer-contact (right col, card)
            "Get in touch"
            Address: 651 N Broad St, Suite 201, Middletown, Delaware 19709, United States
            [location pin icon]
  └─ hr (divider)
  └─ div.footer-bottom (flex row, space-between)
       └─ span "©2026 Wope. All rights reserved."
       └─ div.social-links (flex row)
            Instagram, YouTube, LinkedIn, Twitter/X icons

## Computed Styles

### div.footer
- background: rgb(10, 1, 24) or slightly lighter variant
- padding: 64px 0 32px
- color: rgb(255, 255, 255)

### div.footer-main
- display: flex
- flexDirection: row
- justifyContent: space-between
- alignItems: flex-start
- gap: 48px
- maxWidth: 1248px
- margin: 0 auto
- padding: 0 40px

### Wope logo in footer
- Same SVG as header logo
- marginBottom: 16px

### p tagline
- fontSize: 16px
- color: rgba(255,255,255,0.6)
- lineHeight: 24px
- maxWidth: 220px
- marginBottom: 24px

### "Unlimited trial for 14 days" button
- display: inline-block
- padding: 8px 20px
- borderRadius: 999px
- border: 1px solid rgba(255,255,255,0.2)
- color: rgb(255,255,255)
- fontSize: 14px
- fontWeight: 500
- background: transparent (ghost button)
- cursor: pointer

### Footer column heading
- fontSize: 14px
- fontWeight: 600
- color: rgba(255,255,255,0.5)
- textTransform: uppercase
- letterSpacing: 0.5px
- marginBottom: 16px

### Footer link
- fontSize: 14px
- color: rgba(255,255,255,0.7)
- lineHeight: 32px
- display: block
- textDecoration: none
- hover: color → rgb(255,255,255)

### "Get in touch" card
- background: rgba(255,255,255,0.04)
- border: 1px solid rgba(255,255,255,0.08)
- borderRadius: 16px
- padding: 24px
- minWidth: 240px

### "Get in touch" heading
- fontSize: 16px
- fontWeight: 700
- color: rgb(255,255,255)
- marginBottom: 12px

### Address text
- fontSize: 14px
- color: rgba(255,255,255,0.6)
- lineHeight: 24px

### hr divider
- border: none
- borderTop: 1px solid rgba(255,255,255,0.08)
- margin: 48px 0 24px

### Footer bottom
- display: flex
- justifyContent: space-between
- alignItems: center
- maxWidth: 1248px
- margin: 0 auto
- padding: 0 40px

### Copyright text
- fontSize: 13px
- color: rgba(255,255,255,0.4)

### Social icons
- display: flex
- gap: 16px
- Each icon: 20×20, color: rgba(255,255,255,0.6)
- hover: rgba(255,255,255,1)

## Content (verbatim)
- **Tagline:** "Experience the next generation\nof SEO analytics."
- **Button:** "Unlimited trial for 14 days"
- **Platform links:** Pricing, Partnership, Affiliate, Download, Contact Us
- **Legals links:** Terms of Services, Privacy Policy
- **Wope for links:** Agencies, Startups
- **Address:** 651 N Broad St, Suite 201, Middletown, Delaware 19709, United States
- **Copyright:** "©2026 Wope. All rights reserved."
- **Social:** Instagram, YouTube, LinkedIn, Twitter

## Assets
- Wope logo SVG (same as header)
- Social icons: Instagram, YouTube, LinkedIn, Twitter (from Lucide or inline SVG)
- Location pin icon in "Get in touch" card (from /images/footer/grid.svg or inline)

## Responsive Behavior
- **Desktop:** 4-column horizontal layout
- **Mobile:** stacked vertically, brand section → links → contact
- **Breakpoint:** ~768px
