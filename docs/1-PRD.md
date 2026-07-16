# PRD — Product Requirements Document
# Project: Makinyx (makinyx.com)
# Date: 2026-07-16
# Status: DRAFT

---

## Problem Statement
Mike's professional presence is fragmented across bio-two-eta.vercel.app, taskpilot-umber.vercel.app,
GitHub, and LinkedIn, with no single memorable home tying them together — and no home that carries
the actual destination: a technology group delivering AI and automation solutions to underserved
communities in Rwanda, Canada, and across Africa. makinyx.com becomes that home: the umbrella brand
under which Mike's professional credibility (Bio), his product ventures (TaskPilot and future apps),
and eventually a consulting offering all live on the way to that destination — starting as a single
hub page and deliberately evolving into a multi-page brand site as the ventures under it grow.

**Clarified with Mike 2026-07-16 (two-part answer):** the farmers, shopkeepers, and logistics
operators who keep underserved communities running, and the schools, clinics, and governments that
serve them, ARE the mission's beneficiaries — retail/logistics/clothing/equipment sectors are
lenses on the same underserved-communities mission as agriculture/health/education/governance, not
a separate audience. *In addition*, Mike also wants Makinyx's eventual commercial/consulting work
to fund that mission — broader industry reach is a revenue engine, not just a beneficiary list. He
pointed to `mikegiras.github.io/opsynth` (an illustrative concept site, `D:\Projects\SAMS`,
currently concept-stage per the project registry) as the long-term reference model: a Toronto-based
AI/automation group serving many industries (agriculture, healthcare, defense, logistics, mining,
manufacturing, government) via tiered subscriptions + enterprise contracts + consulting, with
explicit Rwanda/Kenya underserved-community operations funded by that broader commercial base. This
is the shape Makinyx is meant to grow into — see Post-MVP Features below for how that's scoped for
this PRD without overclaiming it in v1.

## Target Users
- Primary: Recruiters/employers evaluating Mike for AI Solutions Architect roles — need a fast,
  credible signal before clicking through to deeper proof (Bio).
- Secondary: Prospective consulting/freelance clients evaluating whether to hire Mike or Makinyx
  for a build.
- Tertiary: General visitors / developer community arriving via GitHub, LinkedIn, or word of mouth.

## Goals
- makinyx.com live on the apex domain, single-page hub shipped, Lighthouse ≥ 90 across all
  categories, loads in < 2s.
- bio.makinyx.com and taskpilot.makinyx.com live as working custom-domain aliases for the existing
  Bio and TaskPilot Vercel projects, with zero functional regression on either app.
- Multi-page evolution actually started (not just planned) within 4-6 weeks of v1 launch — see
  Phase 5 in the Implementation Plan. This is a forcing function, not a someday-idea.
- Zero security/compliance regression vs Bio's baseline: security headers, CSP, no secrets in repo,
  PCI scope stays at zero (no card fields anywhere on this domain).

## Non-Goals
- No blog on makinyx.com in v1 — Bio already owns the blog; don't duplicate.
- No user accounts, login, or auth anywhere on this site.
- No payment collection of any kind.
- No CMS — content is hand-authored HTML like Bio, not database-driven.
- No e-commerce-style checkout for consulting in v1 — a contact form is enough to capture leads.

## Core Features (MVP)
| Priority | Feature | User Story |
|----------|---------|------------|
| P0 | Hero section (wordmark + one-line vision statement) | As a first-time visitor, I want to immediately understand what Makinyx is so I don't bounce. |
| P0 | Ventures section (cards linking to bio.makinyx.com and taskpilot.makinyx.com) | As a recruiter or client, I want to see what Mike has actually built so I can evaluate credibility. |
| P0 | Connect section (email, LinkedIn, GitHub + short contact form) | As a prospective client or recruiter, I want a clear, low-friction way to reach Mike. |
| P1 | Vision paragraph (Makinyx as the umbrella — Bio + products embedded within it, growing over time) | As any visitor, I want to understand why this brand exists, not just what's under it. |
| P1 | security.txt + SEO meta (OG tags, sitemap, robots.txt) | As a search engine or security researcher, I want standard discoverability/contact metadata. |
| P2 | Self-hosted analytics (reuse Bio's pattern) tracking hub traffic + click-through to Bio/TaskPilot | As Mike, I want to know whether the hub is actually driving traffic to my other properties. |

## Post-MVP Features
- Multi-page split: `/about`, `/work` (or `/ventures`), `/services`, `/contact` as dedicated routes.
- `/services` page with a real consulting offer + intake form (Supabase + Resend, mirroring Bio's
  contact pattern).
- Case-study style write-ups, potentially drawing on the "How I Build" content already planned for Bio.
- Possible Makinyx-specific newsletter/blog once the brand has an audience distinct from Bio's.
- **Commercial services across industries, funding the mission** (OpSynth-inspired long-term
  direction, clarified 2026-07-16 — do not build or advertise this in v1): once Makinyx has actual
  delivered work to point to, `/services` can expand beyond a single consulting contact form into
  named industry offerings (agriculture, logistics, retail, manufacturing, etc.), with that revenue
  explicitly funding the underserved-communities work rather than replacing it. This is deliberately
  excluded from the live site's Vision copy for now — announcing broad multi-industry reach with
  zero delivered evidence reads as generic agency positioning and undercuts credibility with
  recruiters/clients evaluating Mike today. Revisit this once Bio/TaskPilot/Makinyx have real case
  studies to back a broader claim, and treat it as its own "new major feature" requiring a PRD +
  Schema update per the Pre-Build Protocol scale-to-scope table, not an ad hoc addition.

## Success Metrics
- Apex domain + both subdomains resolve with valid TLS, zero downtime during cutover.
- Click-through rate from makinyx.com to bio.makinyx.com / taskpilot.makinyx.com (via self-hosted
  analytics).
- The multi-page evolution actually happens on the committed timeline — tracked explicitly because
  Mike flagged that "someday" plans don't happen without a forcing function.

## Open Questions
- TaskPilot is mid-rename to "PilotKit" (pilotkit.dev) per existing plan, not yet executed (GitHub
  repo is still named `taskpilot` as of 2026-07-16). Decide: wire taskpilot.makinyx.com now and
  adjust later, or hold that one subdomain until the rename lands.
- Does Makinyx need its own distinct visual identity, or does it inherit visual cues from Bio (the
  "gold standard" reference) for family resemblance across properties? (Proposed answer in the
  UI/UX doc — confirm or override.)
- Should BridgeUp appear on the hub in v1 given it's unstable/in-dev, or wait until it's stable
  enough to represent publicly? (Recommend: wait — keep it out of v1's Ventures section.)
