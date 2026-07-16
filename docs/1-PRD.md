# PRD — Product Requirements Document
# Project: Makinyx (makinyx.com)
# Date: 2026-07-16
# Status: DRAFT

---

## Problem Statement
Mike's professional presence is fragmented across bio-two-eta.vercel.app, taskpilot-umber.vercel.app,
GitHub, and LinkedIn, with no single memorable home tying them together. makinyx.com becomes that
home: the umbrella brand under which Mike's professional credibility (Bio), his product ventures
(TaskPilot and future apps), and eventually a consulting offering all live — starting as a single
hub page and deliberately evolving into a multi-page brand site as the ventures under it grow.

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
