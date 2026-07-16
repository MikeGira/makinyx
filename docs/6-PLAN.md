# Implementation Plan
# Project: Makinyx (makinyx.com)
# Date: 2026-07-16
# Target launch (v1 hub): 2026-07-23
# Target multi-page evolution checkpoint: 2026-08-20

---

## Phases

### Phase 0: Foundation (Day 1)
The non-negotiables before any feature work.
- [ ] Create GitHub repo `MikeGira/makinyx`
- [ ] Set up Vercel project + connect to GitHub
- [ ] Add makinyx.com as a custom domain in Vercel; configure Cloudflare DNS — A record on the
      apex, set to **DNS-only / grey-cloud** (not proxied)
- [ ] Add Gitleaks + CodeQL + workflow-lint to GitHub Actions (copy from Bio)
- [ ] Verify deploy pipeline works (push → Vercel auto-deploys)
- [ ] Confirm `.env` is in `.gitignore`
- [ ] (Parallel, no new Pre-Build docs needed — existing apps, domain-only change) Add
      bio.makinyx.com as a custom domain on the existing Bio Vercel project + matching Cloudflare
      CNAME, DNS-only
- [ ] (Parallel) Add taskpilot.makinyx.com as a custom domain on the existing TaskPilot Vercel
      project + matching Cloudflare CNAME, DNS-only — **first confirm the PilotKit rename status**;
      if it has landed, use pilotkit naming instead
- [ ] Keep both apps' existing `*.vercel.app` URLs live throughout — the custom domain is additive,
      not a replacement, until verified end-to-end

### Phase 1: Core Structure (Day 1-2)
The skeleton users see.
- [ ] `index.html` skeleton: nav, hero, vision, ventures, connect, footer sections
- [ ] `tokens.css` copied from `~/.claude/templates/design-tokens.css`, customized to Makinyx's
      accent color (#5B5BD6)
- [ ] Responsive layout at 480 / 768 / 1024 / 1440
- [ ] Pull reference patterns from refero.design for hero/card/contact-form layout before finalizing

### Phase 2: Core Features (Day 2-3)
The features in the P0/P1 list from the PRD.
- [ ] Hero + vision copy, written in Mike's voice — no AI-generated puffery, no "AI-powered"/
      "magic" language per Design Discipline
- [ ] Ventures cards linking to bio.makinyx.com and taskpilot.makinyx.com
- [ ] Contact form + `api/contact.js` serverless function + Supabase `contact_submissions` table +
      Resend notification
- [ ] security.txt + OG tags + sitemap.xml + robots.txt

### Phase 3: Auth & Security (Day 3)
- [ ] Auth flow: N/A — confirm no accounts anywhere on this site
- [ ] Rate limiting on `/api/contact`
- [ ] Security headers in `vercel.json` (CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
      Referrer-Policy — copy from Bio)
- [ ] CORS locked to makinyx.com / www.makinyx.com
- [ ] Input validation on the contact form (name/email/message length + format)
- [ ] RLS confirmed on `contact_submissions` (service-role-only, zero public policies)

### Phase 4: Polish & Launch Prep (Day 4)
- [ ] Mobile responsive check
- [ ] Loading/error states on the contact form
- [ ] Confirm zero npm dependencies introduced (no `npm audit` needed if truly zero-dep)
- [ ] Test all 3 journeys from `4-APP-FLOW.md`
- [ ] Final deploy + smoke test on makinyx.com, bio.makinyx.com, taskpilot.makinyx.com

### Phase 5: Evolution to Multi-Page (forcing function)
This is the phase Mike explicitly asked to be driven, not just planned.
- [ ] **Trigger date: 2026-08-20** (4 weeks after v1 launch) — Claude proactively raises this in
      session and drives the split regardless of whether Mike brings it up
- [ ] Split single-page sections into `/about`, `/work`, `/services`, `/contact` routes
- [ ] Memory entry saved this session (`project_makinyx_domain.md`) so any future session — even
      one with no memory of this conversation — surfaces the reminder
- [ ] If `/services` introduces a real consulting-intake data flow beyond the basic contact form,
      re-run the relevant Pre-Build docs (PRD + Schema) for that feature only, per the "New major
      feature on existing app" row in the Pre-Build Protocol scale-to-scope table

---

## Dependencies Between Phases
- Phase 0 must complete before any Phase 1 work (no feature without CI/CD).
- Apex/subdomain DNS + TLS verification must pass before Phase 0 is considered done — apex TLS
  provisioning can take time and must not be assumed to work without checking.
- Contact form (Phase 2) must exist before its RLS/rate-limiting hardening (Phase 3).
- Schema must be finalized before the `api/contact.js` endpoint is built (no mid-build migrations).
- Phase 5 is **time-boxed, not feature-gated** — it fires on the calendar trigger (2026-08-20) even
  if unrelated polish elsewhere is still pending.

## Definition of Done
- [ ] Feature works end-to-end in production (not just local)
- [ ] No console errors
- [ ] No hardcoded secrets
- [ ] Security checklist passed for this feature
- [ ] Committed with conventional commit message and pushed
- [ ] For Phase 5 specifically: evolution reminder saved to memory with a concrete date trigger,
      confirmed present before this plan is marked fully done
