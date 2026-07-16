# Makinyx — Incident Response Plan (Runbook)

| Field | Value |
|---|---|
| Owner | Michael Twagirayezu (Incident Lead) |
| Version | 1.0 |
| Effective | 2026-07-16 |
| Next review | 2027-07-16 |
| Classification | Internal |

Operational runbook. Kept short enough to actually use during a 2am incident.

## Roles
- **Incident Lead:** Michael Twagirayezu (byosekumbuga@gmail.com) — declares severity, coordinates response, decides on notification.

## Severity tiers
| SEV | Definition | Examples |
|---|---|---|
| SEV1 | Confirmed breach of personal data, or full outage | Contact-submission data exposure (Phase 2+), DNS hijack, full site down |
| SEV2 | Significant security event, partial impact | Key leaked, DNS misconfiguration exposing a subdomain |
| SEV3 | Minor / contained | Single failed control, low-risk vuln in prod |

## Response steps
1. **Detect & record.** Note time (UTC), source, what is observed. Start an incident log entry.
2. **Triage & declare severity.** Assign a SEV; the Incident Lead owns it.
3. **Contain.** Revoke/rotate exposed credentials and keys; roll back or take the site down on
   Vercel if needed; if DNS is compromised, lock the Cloudflare account and review DNS records for
   unauthorized changes.
4. **Eradicate.** Remove the root cause (patch, fix config, revoke access).
5. **Recover.** Restore from a clean state; validate integrity; bring services back; monitor.
6. **Preserve evidence.** Capture logs/artifacts before they roll off. Do not destroy evidence.
7. **Notify (if required).** See decision rules below.
8. **Post-incident review.** Within 5 business days for SEV1/SEV2: timeline, root cause, what worked, corrective actions.

## Key-rotation quick list (containment)
Rotate any that may be exposed:
- GitHub tokens
- Vercel env secrets
- Cloudflare API tokens / account password
- Supabase service key (Phase 2+)
- Resend API key (Phase 2+)

## Notification decision rules
- **Personal-data breach (GDPR):** notify the supervisory authority within **72 hours** of
  awareness if there is risk to individuals; notify affected individuals if high risk.
- **PIPEDA:** report to the Office of the Privacy Commissioner of Canada and affected individuals
  if there is a "real risk of significant harm."
- This site takes no payments — no card data exposure is possible.
- v1 collects no personal data at all — most breach scenarios reduce to availability/DNS incidents,
  not data breaches, until Phase 2 ships.
- When unsure, consult counsel; document the decision and rationale.

## Contacts
- Hosting: Vercel · DNS/registrar: Cloudflare · Database: Supabase (Phase 2+) · Email: Resend (Phase 2+) · Source/CI: GitHub
- Status pages: vercel-status.com · cloudflarestatus.com · status.supabase.com · status.resend.com
