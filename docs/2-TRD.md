# TRD — Technical Requirements Document
# Project: Makinyx (makinyx.com)
# Date: 2026-07-16

---

## Tech Stack
| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Vanilla HTML5/CSS3/ES2022+, zero npm dependencies | Mirrors Bio's gold-standard pattern; a marketing hub needs no framework, and this keeps supply-chain risk at zero. |
| Backend | Vercel Serverless Functions (Node.js, `/api/`) | Only for the contact form (Phase 2) — same proxy pattern as Bio's `api/db.js`. |
| Database | Supabase PostgreSQL + RLS | Single `contact_submissions` table, provisioned only when the contact form ships (Phase 2), not needed for the static hero+cards MVP. |
| Auth | None | No accounts anywhere on this site. |
| Email | Resend API | Contact-form notifications, same pattern as Bio. |
| Hosting | Vercel (new project, new repo) | Apex domain via A record, DNS-only (grey cloud) in Cloudflare — see Architecture Overview. |
| CI/CD | GitHub Actions — Gitleaks + CodeQL + workflow-lint | Copied from Bio's `deploy.yml` / `workflow-lint.yml`. |
| AI (if any) | None planned for v1 | No assistant needed on a hub page. |

## Architecture Overview
Static HTML/CSS/JS served by Vercel's CDN for the hub page itself. A single optional serverless
function (`api/contact.js`) handles the Connect-section form: validates input, writes to Supabase,
and notifies Mike via Resend — following the exact proxy pattern already proven in Bio's
`api/db.js` (browser never talks to Supabase directly; only the server-side function holds the
service key). `bio.makinyx.com` and `taskpilot.makinyx.com` are **not** part of this codebase —
they are custom-domain aliases configured directly on the existing Bio and TaskPilot Vercel
projects, resolving to the same deployments those apps already serve at their `*.vercel.app` URLs.
The apex domain (`makinyx.com`) requires an A record (not a CNAME — DNS RFC1034 forbids other
records alongside a CNAME at the zone apex), and because Cloudflare is the DNS provider, both the
A record (apex) and CNAME records (subdomains) must be set to **DNS-only / grey-cloud**, not
proxied — Cloudflare's proxy would terminate TLS itself and break Vercel's Let's Encrypt
certificate issuance.

## API Endpoints (planned)
| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| GET | / | No | Hub page |
| POST | /api/contact | No (public, rate-limited) | Consulting/contact inquiry submission |

## Environment Variables Required
<!-- Names only — never values here -->
| Variable | Purpose |
|----------|---------|
| SUPABASE_URL | Supabase project URL (added in Phase 2, not Phase 0) |
| SUPABASE_SERVICE_KEY | Supabase service role key, server-side only |
| RESEND_API_KEY | Resend email API (Sending Access only) |
| NOTIFY_EMAIL | Where contact-form submissions are sent |
| SITE_URL | Vercel deployment URL, for CORS |

## Security Requirements
- [ ] Auth method: none (no accounts on this site)
- [ ] RLS / authorization model: `contact_submissions` has RLS enabled with no anon/authenticated
      policies at all — all writes go through the server-side function using the service role key,
      which bypasses RLS by design (same as Bio's pattern)
- [ ] Rate limiting on: `/api/contact`
- [ ] CORS allowed origins: `makinyx.com`, `www.makinyx.com` only
- [ ] Security headers configured: yes — CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options:
      nosniff, Referrer-Policy: strict-origin-when-cross-origin (copy `vercel.json` from Bio)

## Performance Requirements
- Hub page loads in < 2s on a throttled 3G connection (static HTML/CSS, minimal JS)
- Lighthouse Performance / Accessibility / Best Practices / SEO all ≥ 90

## External Services & Dependencies
| Service | Purpose | Free tier sufficient? |
|---------|---------|----------------------|
| Vercel | Hosting, CDN, TLS | Yes |
| Supabase | Contact-form storage (Phase 2) | Yes |
| Resend | Contact-form email notifications (Phase 2) | Yes |
| Cloudflare | DNS + registrar for makinyx.com | Yes (Free plan already active) |

## Known Technical Risks
- Apex domain + Cloudflare proxy misconfiguration breaks TLS provisioning — must be DNS-only
  (grey-cloud), not proxied (orange-cloud), on both the A record and the subdomain CNAMEs.
- Subdomain wiring for bio.makinyx.com / taskpilot.makinyx.com must not disturb the existing
  `*.vercel.app` URLs already in production use — add the custom domain as an addition, not a
  replacement, until verified working end-to-end.
- TaskPilot → PilotKit rename is in flight but not executed (repo still named `taskpilot` as of
  2026-07-16). If it lands mid-project, the `taskpilot.makinyx.com` CNAME target and hub-page copy
  need a follow-up pass.
- The "single page that evolves into multi-page" pattern risks silently staying single-page forever
  without a forcing function — mitigated by a time-boxed Phase 5 in the Implementation Plan plus a
  standing memory reminder (see that doc).
