# Security Policy

Michael Twagirayezu (sole proprietor) takes the security of Makinyx seriously. We welcome
responsible disclosure of vulnerabilities.

## Reporting a vulnerability
- **Email:** byosekumbuga@gmail.com
- Please include: a description, steps to reproduce, the affected URL/endpoint, and impact.
- **Do not** publicly disclose before we have had a reasonable chance to remediate.
- **Do not** access or modify other users' data, degrade service, or run automated scans that harm availability.

## Our commitment
- We acknowledge reports within **2 business days**.
- We provide a remediation timeline based on severity (Critical 7 days / High 30 days / Medium 90 days).
- We will credit reporters who wish to be acknowledged (optional).

## Scope
In scope: `https://makinyx.com` and its `/api` serverless functions (once added). Out of scope:
third-party services (Vercel, Supabase, Resend, Cloudflare, GitHub) — report those to the
respective provider. `bio.makinyx.com` and `taskpilot.makinyx.com` are custom-domain aliases for
the Bio and TaskPilot applications — report issues in those apps via their own repos
([Bio](https://github.com/MikeGira/Bio/blob/main/SECURITY.md),
[TaskPilot](https://github.com/MikeGira/taskpilot)).

## Safe harbor
Good-faith research consistent with this policy will not lead to legal action by Michael Twagirayezu.
