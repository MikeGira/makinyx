# Makinyx — Project CLAUDE.md
# GitHub repo: https://github.com/MikeGira/makinyx
# Live: https://makinyx.com

## What this is
The umbrella brand hub for Mike Byosekumbuga's professional work and product ventures. v1 is a
single-page hub; it is committed to evolving into a multi-page site (see Phase 5 in
`docs/6-PLAN.md`) — this is a forcing function, not an optional idea.

## Stack
- **Hosting**: Vercel (serverless functions in `/api/`, none yet — added in Phase 2)
- **Database**: Supabase PostgreSQL with RLS (Phase 2, contact form only)
- **Email**: Resend API (Phase 2, contact-form notifications only)
- **Frontend**: Vanilla HTML5/CSS3, zero npm dependencies
- **DNS/Registrar**: Cloudflare, for both. Intended zone state is declared in `dns/makinyx.com.json`
  — that file is the source of truth, not this list; read it rather than copying values out of it.
  Every record is DNS-only/grey-cloud; proxying breaks Vercel's Let's Encrypt issuance and is against
  Vercel's own guidance.
- **CI/CD**: GitHub Actions (Gitleaks + CodeQL + zizmor workflow lint) → Vercel auto-deploy, plus a
  daily DNS Guard that diffs the live zone against `dns/makinyx.com.json`

## Commands
```bash
# Local dev — static site, any local server works
python3 -m http.server 5500
```

## Project Structure
```
index.html              # v1 hub page
src/styles/tokens.css   # design tokens — ONLY place hex/spacing/radius values are defined
src/styles/main.css     # layout and components, references tokens only
api/                    # serverless functions — none yet, contact form lands in Phase 2
dns/makinyx.com.json    # declared DNS state — source of truth for the zone, enforced by CI
scripts/dns-guard.js    # diffs the live zone against dns/makinyx.com.json over DoH
docs/                   # Pre-Build docs (1-PRD through 6-PLAN) + COMPLIANCE + INCIDENT-RESPONSE
docs/adr/               # architecture decision records
docs/runbooks/          # operational procedures
```

## Environment Variables
None yet. Phase 2 (contact form) adds:
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` — contact_submissions storage
- `RESEND_API_KEY`, `NOTIFY_EMAIL` — contact-form notification email
- `SITE_URL` — CORS

## Security Notes
- No auth/accounts anywhere on this site.
- CSP has no `unsafe-inline` and no external font/script/style origins — everything is served
  same-origin, deliberately stricter than Bio's CSP (which allows Google Fonts).
- Phase 2's `contact_submissions` table will have RLS enabled with zero anon/authenticated
  policies — all access goes through a server-side function using the service role key, same
  pattern as Bio's `api/db.js`.
- Rate limiting required on `/api/contact` once it exists.

## Related domains — not part of this repo
`bio.makinyx.com` and `taskpilot.makinyx.com` are custom-domain aliases configured directly on the
existing Bio and TaskPilot Vercel projects. They do not deploy from this repo and their app code
lives in `github.com/MikeGira/Bio` and `github.com/MikeGira/taskpilot` respectively.

## Architecture Decisions
- DNS authority stays at Cloudflare; the domain is attached to Vercel with A records, not by
  delegating nameservers to Vercel — `docs/adr/0001-dns-authority-stays-at-cloudflare.md`.
- Apex domain requires an A record, not a CNAME (DNS RFC1034 forbids other records at the zone
  apex) — see `docs/2-TRD.md` Architecture Overview.
- No web font is self-hosted or CDN-loaded — `Inter Variable`/`JetBrains Mono` are requested by
  name and fall back to system fonts if not installed locally, keeping the CSP free of any
  external origin allowlist.
- Visual identity deliberately does not copy Bio's palette — Claude/ChatGPT/Gemini desktop are the
  named design role models (see `docs/3-UI-UX.md`), Bio is only the reference for proven
  serverless/Supabase *patterns*, not for Makinyx's specific colors/wordmark.

## Do Not
- Repoint `makinyx.com`'s nameservers to `ns1/ns2.vercel-dns.com`, or act on Vercel's recurring
  "complete your domain setup" email. Cloudflare Registrar contractually requires Cloudflare
  nameservers, so it is not even possible without a registrar transfer, and the current A-record
  setup is a supported, working Vercel configuration. Full reasoning and the only three conditions
  that would reopen it: `docs/adr/0001-dns-authority-stays-at-cloudflare.md`.
- Change a DNS record in Cloudflare without making the matching change in `dns/makinyx.com.json` in
  the same piece of work — the DNS Guard workflow will fail, correctly.
- Commit `.env` or any file with real credentials.
- Add a database table or auth flow without updating `docs/5-SCHEMA.md` and `docs/COMPLIANCE.md`.
- Let the single-page hub sit past the Phase 5 trigger date without actively starting the
  multi-page split — Mike explicitly asked for this to be driven, not just planned.

## Current Focus
Phase 0/1 (Foundation + Core Structure) — repo, CI, domain/DNS wiring, static hub page. Contact
form (Phase 2) and the multi-page evolution (Phase 5) are not started yet.
