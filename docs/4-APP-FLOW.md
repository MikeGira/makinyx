# App Flow — User Journey Map
# Project: Makinyx (makinyx.com)
# Date: 2026-07-16

---

## User Types
- Guest (unauthenticated) — the only user type. No accounts exist anywhere on this site.

## Core Journeys

### Journey 1: First-time visitor evaluating credibility
**Actor**: Recruiter or prospective client
**Goal**: Quickly understand who Mike is and see proof of work
**Steps**:
1. Visitor lands on makinyx.com (from LinkedIn, GitHub, or a business card/resume link)
2. Reads the hero + vision section
3. Clicks a venture card (Bio or TaskPilot)
4. Redirected to bio.makinyx.com or taskpilot.makinyx.com
5. Forms an impression of credibility from the linked app itself

**Success state**: Visitor clicks through to Bio or TaskPilot and spends time there.
**Failure state**: Visitor bounces from the hub without clicking anything — page was unclear,
slow, or didn't establish credibility fast enough.

---

### Journey 2: Consulting inquiry
**Actor**: Prospective client
**Goal**: Contact Mike about hiring him for a project
**Steps**:
1. Visitor reads the Connect section
2. Fills the short contact form (name, email, message)
3. Submits
4. `api/contact.js` validates input, stores the row in Supabase, notifies Mike via Resend
5. Visitor sees a confirmation toast

**Success state**: Submission stored, Mike notified within seconds.
**Failure state**: Network/server error shows an inline message with a retry option; the form
retains the visitor's entered values so nothing is lost.

---

### Journey 3: Reaching Bio/TaskPilot via a Makinyx subdomain
**Actor**: Any visitor
**Goal**: Reach Bio or TaskPilot via a makinyx.com subdomain instead of the `*.vercel.app` URL
**Steps**:
1. Visitor navigates to bio.makinyx.com or taskpilot.makinyx.com directly
2. DNS resolves to the existing Vercel project — no new deployment involved
3. The app loads exactly as it does today at its `*.vercel.app` URL

**Success state**: Identical experience to the existing production URL, just under the new domain.
**Failure state**: DNS misconfiguration causes a Vercel "domain not found" or SSL error — this must
be caught during Phase 0 verification, before this journey is ever considered done.

---

## Edge Cases & Error States
| Scenario | What happens |
|----------|-------------|
| Visitor hits a route that doesn't exist (v1 has no routes beyond `/`) | Vercel default 404, styled to match the hub's dark/light theme |
| Form submission fails (network error) | Inline error message, form retains entered values, retry button shown |
| Rate limit hit on `/api/contact` | 429 response with a plain "Too many requests, try again in a few minutes" message — no stack trace |
| User submits duplicate inquiry | Allowed — no uniqueness constraint; Mike simply gets two notifications |
| Empty state (no data yet) | N/A in v1 — all public content is static/hand-authored, nothing renders from a database |
| Bio/TaskPilot subdomain DNS not yet propagated | Visitor falls back to the existing `*.vercel.app` URL, which stays live throughout the cutover |

## Navigation Map
```
/ (Home — v1: single page with anchors #vision #ventures #connect)
├── bio.makinyx.com        (alias -> existing Bio Vercel project, unchanged app)
├── taskpilot.makinyx.com  (alias -> existing TaskPilot Vercel project, unchanged app)
└── [POST-MVP — Phase 5 multi-page split]
    ├── /about
    ├── /work        (or /ventures)
    ├── /services
    └── /contact
```
