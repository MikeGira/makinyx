# Makinyx — Compliance Statement

| Field | Value |
|---|---|
| Owner | Michael Twagirayezu (sole proprietor) |
| Product | Makinyx (`https://makinyx.com`) |
| Version | 1.0 |
| Effective | 2026-07-16 |
| Next review | 2027-07-16 (or on any change to data flows or subprocessors) |
| Jurisdiction | Ontario, Canada |
| Classification | Internal |

> **Readiness, not certification.** This site is built to the *technical controls* of SOC 2 and
> ISO 27001, and to GDPR/PIPEDA obligations. A formal certificate/attestation additionally requires
> written policies, a risk assessment, an evidence window, and an external auditor. We do not claim
> to be "certified"; we claim to be **built to these controls**.

## 1. Scope of personal data

v1 (single-page hub) collects **no personal data** — it is fully static, no forms, no database.
Once the Phase 2 contact form ships, this table takes effect:

| Feature | Personal data | Storage |
|---|---|---|
| Contact form (Phase 2, not yet live) | Name, email, message | Supabase `contact_submissions`; email notification via Resend |

**No payments are taken and no cardholder data is processed** — the site's `Permissions-Policy`
explicitly disables `payment=()`. PCI DSS is therefore out of scope. `bio.makinyx.com` and
`taskpilot.makinyx.com` are domain aliases only — their data handling is governed by Bio's and
TaskPilot's own compliance documents, not this one.

## 2. Data classification

| Class | Examples | Handling |
|---|---|---|
| **Restricted** | `SUPABASE_SERVICE_KEY`, `RESEND_API_KEY` (added Phase 2) | Vercel env vars only; server-side functions only; never in client code or git. |
| **Confidential (PII)** | Contact name/email/message (Phase 2) | Supabase RLS (service-role-only, no public policies); access via server-side proxy holding the service key; TLS in transit. |
| **Public** | Site content, this document, `SECURITY.md` | No restrictions. |

## 3. Subprocessors

(ISO A.5.19 · SOC 2 CC9.2 · GDPR Art. 28)

| Vendor | Service | Data processed | Data location | Attestation |
|---|---|---|---|---|
| Vercel | Hosting / CDN / serverless | Request traffic, logs | Global edge (primary US) | SOC 2 Type II |
| Cloudflare | DNS / registrar | DNS query metadata | Global | SOC 2 Type II, ISO 27001 |
| Supabase | Postgres / REST / RLS (Phase 2) | Contact-form PII | us-east-1 (AWS, N. Virginia, USA) | SOC 2 Type II |
| Resend | Transactional email (Phase 2) | Recipient + notification email, content | US | SOC 2 |
| GitHub | Source control / CI | Code, CI metadata | US | SOC 2, ISO 27001 |

Each is reviewed at least annually and whenever the integration changes.

## 4. Control mapping (selected)

| Area | Control on this site | Framework refs |
|---|---|---|
| MFA | Required on all production-reaching accounts (GitHub, Vercel, Cloudflare) | SOC 2 CC6.1 · ISO A.5.17 |
| Access control | No auth/accounts exist on this site (nothing to control); Phase 2 RLS is service-role-only | CC6.1–6.3 · A.5.15 |
| Security headers | CSP (no `unsafe-inline`, no external font/script origins allowed), HSTS (2y, preload), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy — set in `vercel.json` | CC6.6 · A.8.23 |
| Encryption | TLS/HSTS in transit; provider-managed encryption at rest | CC6.7 · A.8.24 |
| Secrets | Vercel env vars; gitleaks gate in CI | CC6.1 · A.8.24 |
| Secure SDLC | CI gates (gitleaks + CodeQL + zizmor workflow lint) green before Vercel deploy | CC8.1 · A.8.25–8.28 |
| Incident response | See [INCIDENT-RESPONSE.md](./INCIDENT-RESPONSE.md) | CC7.3–7.5 · A.5.24–5.26 |

## 5. Data retention & disposal

No personal data is collected in v1. When Phase 2 ships:

| Data | Retention | Basis |
|---|---|---|
| Contact submissions | 24 months, then deleted | Correspondence handling; minimization |

Subjects may request access or erasure via byosekumbuga@gmail.com (GDPR Art. 15/17 · PIPEDA).

## 6. Open items (tracked)

- Publish a short **Privacy notice** before the Phase 2 contact form goes live, covering what it
  collects, the subprocessors, and the erasure contact — same pattern as Bio's `/privacy.html`.
