# UI/UX Design
# Project: Makinyx (makinyx.com)
# Date: 2026-07-16

---

## Design Principles
- Confident
- Minimal
- Credible
- Evolving (built to grow into more pages, not a dead end)

**Role models (Mike's explicit direction, overriding the initial Bio-match default)**: Claude
desktop, ChatGPT desktop, Gemini desktop — not Bio. Bio is the gold-standard *reference
implementation* of the project's Design Discipline (proven serverless/Supabase patterns), but its
specific visual identity (colors, wordmark) is not what Makinyx should visually mirror. Makinyx
should read as premium AI-native tooling in the same register as those three products: restrained
chrome, generous whitespace, one quiet accent color, typography carrying almost all the visual
weight, zero decoration. This is the same Design Discipline bar Bio is held to — it just means
Makinyx gets its *own* distinct application of it rather than inheriting Bio's specific palette.

## Color & Typography
- Primary/accent color: #5B5BD6 (indigo-violet). Reasoning: Claude's accent is warm terracotta,
  ChatGPT's is near-monochrome with a muted teal/green, Gemini's is blue-leaning — an indigo-violet
  accent keeps Makinyx visually distinct from all three role models (and from Bio) while staying in
  the same "one quiet accent, used sparingly" family every one of them follows. Used in < 2% of
  pixels per Design Discipline (links, one CTA, focus rings only) — never a background fill.
- Secondary: none — semantic colors (success/error/warning) only, no second brand color.
- Background: dark mode `#0B0C0F` (near-black, warm-neutral), light mode `#FAFAFA` — flat color,
  no gradients, no glassmorphism, matching Claude/ChatGPT/Gemini's chrome exactly.
- Text: dark mode `#E7E7EA`, light mode `#16171B`
- Font (headings): Inter Variable
- Font (body): Inter Variable
- Font (mono, used sparingly for the tagline/wordmark treatment only): JetBrains Mono

Dark mode is the intentional default (matches the Claude/ChatGPT/Gemini/Linear/Vercel-dashboard
premium tier per the project's Design Discipline); light mode is a deliberate second pass, not an
auto-invert. Elevation: one level max, hairline borders only — no drop shadows on chrome, no
card-on-card stacking, consistent with how all three role-model apps handle surfaces.

**Design reference tool**: refero.design (curated real-product UI/UX screenshot library, browsable
by page type / UX pattern / UI element, with full-flow walkthroughs) is a legitimate, actively
maintained resource — comparable to Mobbin at a lower price point. Use it during Phase 1 build to
pull real hero-section, card-grid, and contact-form reference patterns rather than designing from
memory. Recommended browse targets: "Landing Page" + "Hero" + "Pricing/Contact" tags, and any
"portfolio/personal brand" flows.

## Key Screens

### Screen 1: Hub (Home) — v1, single page with anchor sections
**Purpose**: Establish Makinyx as the umbrella brand, funnel credibility to Bio, funnel product
interest to TaskPilot, capture consulting leads.
**Key elements**:
- Sticky nav: Makinyx wordmark (left) + anchor links (Vision / Ventures / Connect)
- Hero: wordmark, one-line vision statement, primary CTA → Bio
- Vision section: short paragraph on what Makinyx is and how it grows
- Ventures section: cards — Bio (professional portfolio), TaskPilot (SaaS product), a visibly
  "more ventures soon" placeholder card (BridgeUp excluded from v1 per PRD open question)
- Connect section: email / LinkedIn / GitHub links + short contact form (name, email, message)
- Footer: copyright, links to Bio's privacy policy (shared policy until Makinyx has its own data
  flows beyond the contact form)

**ASCII sketch**:
```
+-------------------------------------------+
|  Makinyx          Vision  Ventures  Connect|
+-------------------------------------------+
|                                             |
|              MAKINYX                       |
|     one-line vision statement              |
|            [ See the work -> ]             |
|                                             |
+-------------------------------------------+
|  Vision                                    |
|  short paragraph                           |
+-------------------------------------------+
|  Ventures                                  |
|  [ Bio card ]  [ TaskPilot card ]  [ + ]   |
+-------------------------------------------+
|  Connect                                   |
|  email / linkedin / github                 |
|  [ name ] [ email ] [ message ] [ Send ]   |
+-------------------------------------------+
|  Footer                                    |
+-------------------------------------------+
```

### Screen 2 (post-MVP): /work — dedicated ventures page
**Purpose**: Fuller case-study-style entries once the hub splits into multiple pages.
**Key elements**:
- Expanded venture cards with a short "why this exists" blurb per project
- Links out to each live app + its GitHub repo

### Screen 3 (post-MVP): /contact — dedicated consulting inquiry page
**Purpose**: A fuller intake form once consulting becomes a real offering, not just a lead-capture
box embedded in the hub.
**Key elements**:
- Longer form (project type, budget range, timeline)
- Calendly-style scheduling link (evaluate at that time — not decided now)

## Component Inventory
- [x] Button (primary / secondary)
- [x] Form inputs (contact form: name, email, message)
- [ ] Modal — not needed in v1
- [x] Toast / notification (form submit confirmation)
- [x] Loading state (form submit spinner)
- [ ] Empty state — N/A, all v1 content is static
- [x] Error state (form submit failure, inline message + retry)
- [x] Venture card (reusable component for Bio / TaskPilot / future ventures)

## Responsive Breakpoints
- Mobile first: yes
- Breakpoints: 480 / 768 / 1024 / 1440

## Accessibility Requirements
- [x] Keyboard navigable
- [x] ARIA labels on interactive elements
- [x] Color contrast ratio ≥ 4.5:1
- [x] Focus indicators visible
