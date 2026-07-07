# FAQ Section Specification

## Overview
- **Target file:** `src/components/FAQSection.tsx`
- **Interaction model:** Click-driven accordion (plus/minus toggle)
- **Screenshot:** scroll position ~3049px

## DOM Structure
```
div.faq.container-md
  └─ div.star-animation  (background stars)
  └─ div.faq-header
       └─ span/div "FAQ" (pill badge)
       └─ h2 "Frequently asked questions"
       └─ p "Haven't found what you're looking for? Contact us."
  └─ div.faq-details
       └─ div.accordion (×5)
            └─ div.accordion-header "Question text ?"
            └─ div.accordion-content "Answer text..."
            └─ button/span.icon (+  or  ×)
```

## Computed Styles

### div.faq container
- padding: 80px 0
- textAlign: center (header)
- background: transparent (stars visible through)
- maxWidth: ~840px
- margin: 0 auto

### "FAQ" badge/pill
- display: inline-block
- padding: 4px 12px
- borderRadius: 999px
- border: 1px solid rgba(255,255,255,0.15)
- color: rgb(255, 255, 255)
- fontSize: 12px
- fontWeight: 500
- letterSpacing: 0.5px
- marginBottom: 16px
- background: rgba(255,255,255,0.06)

### h2 "Frequently asked questions"
- fontSize: 56px
- fontWeight: 700
- fontFamily: "Rebond Grotesque"
- lineHeight: 64px
- color: rgb(255, 255, 255)
- textAlign: center
- marginBottom: 16px

### p subtitle
- fontSize: 16px
- color: rgb(155, 150, 176)
- textAlign: center
- marginBottom: 64px
- "Contact us." link: color: rgb(139, 92, 246) (purple accent)

### Accordion item
- borderTop: 1px solid rgba(255, 255, 255, 0.1)
- padding: 20px 0
- textAlign: left

### Accordion header (question)
- fontSize: 18px
- fontWeight: 600
- color: rgb(255, 255, 255)
- display: flex
- justifyContent: space-between
- alignItems: center
- cursor: pointer

### Plus/minus icon
- width: 24px, height: 24px
- border: 1px solid rgba(255,255,255,0.2)
- borderRadius: 50%
- display: flex, alignItems: center, justifyContent: center
- color: white
- fontSize: 18px
- transition: transform 0.3s ease

### Accordion content (answer)
- fontSize: 15px
- lineHeight: 24px
- color: rgb(155, 150, 176)
- paddingTop: 12px
- maxHeight: 0 (collapsed) → auto (expanded)
- overflow: hidden
- transition: max-height 0.3s ease

## States & Behaviors

### Accordion click
- **Trigger:** Click on accordion-header
- **State A (closed):** accordion-content height: 0, icon shows +
- **State B (open):** accordion-content height: auto, icon shows × or rotates to −
- **Transition:** max-height transition 0.3s ease, icon rotation 0.2s

## FAQ Q&A Content (verbatim)

### Q1: What is Wope?
**A:** Wope is a new-generation SEO research platform designed to elevate your marketing strategy. It is powered by an advanced artificial intelligence assistant that helps you generate endless ideas for high-ranking content and deep competitive insights.

### Q2: Who is Wope for?
**A:** Wope is built for a range of users involved in digital marketing and search engine optimization. Its features are powerful enough for specialized SEO agencies and scalable for growing startups looking to establish a strong online presence.

### Q3: What can I do with the Backlink Profile Analysis feature?
**A:** Wope's Backlink Profile Analysis allows you to dive deep into any website's backlink profile. You can uncover the specific sources of their backlinks, see the exact anchor texts being used, and evaluate authority scores to understand the strength of their link-building strategy.

### Q4: How does the "Shared SEO Keywords" feature work?
**A:** This feature is designed for rapid competitive analysis. It allows you to enter two different domains and instantly see which SEO keywords they both rank for. This helps you identify keyword gaps, discover content opportunities, and refine your strategy.

### Q5: (Additional — likely about pricing or free trial)
Likely: "Is there a free trial?" or "How does the 14-day trial work?"

## Assets
- No images (star animation is CSS-based)

## Responsive Behavior
- **Desktop:** max-width ~840px centered
- **Mobile:** full width, padding reduced
