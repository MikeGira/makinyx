# ADR 0001 — DNS authority for makinyx.com stays at Cloudflare

- **Status**: Accepted
- **Date**: 2026-08-16
- **Decision owner**: Mike Byosekumbuga
- **Prompted by**: Vercel marketing email, 2026-08-15, "Complete your domain setup for makinyx.com",
  asking that the nameservers be repointed to `ns1.vercel-dns.com` / `ns2.vercel-dns.com`.

## Decision

`makinyx.com` keeps Cloudflare as both registrar and authoritative DNS operator. The domain stays
attached to Vercel projects with A records, as it is today. **No action is taken on that email, now
or on any repeat of it.**

## Context

Verified live on 2026-08-16, not recalled:

| Fact | Value | Source |
|---|---|---|
| Registrar | Cloudflare, Inc. (IANA 1910) | RDAP `rdap.verisign.com/com/v1/domain/makinyx.com` |
| Registered / expires | 2026-06-05 / 2027-06-05 | same |
| Registry lock | `clientTransferProhibited` | same |
| Nameservers | `bill.ns.cloudflare.com`, `naomi.ns.cloudflare.com` | DoH `cloudflare-dns.com` |
| Apex + `www` + `bio` + `taskpilot` | A → `76.76.21.21`, DNS-only | DoH |
| Live certificates | Let's Encrypt (Vercel) on all four hostnames | TLS handshake, `crt.sh` |

Four hostnames sit under one apex and fan out to **three separate Vercel projects** (`makinyx`,
`bio`, `taskpilot`).

## Rationale

**1. The email's instruction cannot be carried out without transferring the registrar away.**
Cloudflare Registrar's own FAQ: *"No, all domains on Cloudflare Registrar use Cloudflare nameservers,
so that we can protect and speed up your content or services"* — and if you need different
nameservers you must *"move your domain to another Registrar."* This is a term of the Domain
Registration Agreement, not a soft default. Following step 2 of the email would either be rejected by
Cloudflare or, if forced through, break the domain. Cost of complying: a full registrar transfer of a
domain that is currently registry-locked and 10 months from renewal.

**2. Nothing is wrong.** The email is a lifecycle nudge, not an alert. Vercel documents apex A record
plus subdomain records at a third-party DNS provider as a fully supported configuration, and the
evidence above shows it working: four hostnames resolving correctly, all four serving HTTP 200 from
outside Mike's home network, all four with valid Let's Encrypt certificates that Vercel is renewing
on schedule.

**3. Moving to Vercel nameservers would cost capability that is already committed.**

- **Email routing.** `privacy@makinyx.com` is a committed follow-up (it is the contact address the
  published Privacy Policy and Terms are meant to move to). Cloudflare Email Routing delivers that
  for free and requires Cloudflare DNS.
- **Multi-project apex.** Vercel's headline nameserver benefit is auto-creating records for a domain
  attached to *a* project. This apex spans three projects, so the records would still be managed by
  hand — the benefit largely does not apply here.
- **Free DNSSEC with automatic DS publication.** Because Cloudflare is registrar *and* DNS operator,
  enabling DNSSEC is one toggle and Cloudflare publishes the DS record to the `.com` registry itself.
  Split registrar/DNS setups require manually copying DS material between two vendors.

**4. Keeping the DNS control plane independent of the origin is the point.** DNS is the mechanism by
which you fail *away* from a hosting provider. Putting it inside the hosting provider means an
incident affecting Vercel is an incident affecting the ability to repoint away from Vercel. Cloudflare
DNS is a separate failure domain, on a separate account, with a separate status page. Concentration
into one vendor here buys marginal convenience and sells the escape hatch.

**5. Cloudflare's proxy stays off, which is a separate decision from where DNS lives.** Vercel is
explicit that it *"does not recommend"* a reverse proxy in front of it: the Vercel Firewall and bot
protection lose traffic visibility, proxied IP rotation forces repeated challenges, and latency and
cache behaviour degrade. Independently, an orange-clouded record terminates TLS at Cloudflare and
breaks Vercel's Let's Encrypt HTTP-01 challenge. Every record in this zone is and stays DNS-only
(grey cloud). This closes the open question of whether to front the domain with the Cloudflare proxy
plus ECH to work around the 2026-07-31 ISP filtering incident: the answer is no.

## Consequences

- DNS records are added and changed by hand in Cloudflare, so drift is possible. Mitigated by
  declaring the intended state in `dns/makinyx.com.json` and enforcing it in CI
  (`.github/workflows/dns-guard.yml`), which also detects certificate non-renewal and mis-issuance.
- Vercel will keep sending this email. It has an answer now: this file.
- Any change to Cloudflare's assigned nameserver pair is legitimate and will not trip the guard —
  it enforces the `.ns.cloudflare.com` suffix, not the specific pair.

## What would reopen this decision

Only these. None of them is "Vercel emailed again".

1. Cloudflare Registrar ceases to be viable for this domain (price, policy, or account loss), forcing
   a registrar transfer anyway — at which point where DNS lives is genuinely back on the table.
2. `makinyx.com` collapses to a single Vercel project *and* the email-routing requirement disappears,
   removing most of what Cloudflare DNS is being kept for.
3. A wildcard subdomain (`*.makinyx.com`) becomes a real requirement, where Vercel nameservers do
   remove meaningful manual work — and even then, weigh it against the failure-domain argument in §4,
   which does not go away.

## Sources

- [Cloudflare Registrar FAQ](https://developers.cloudflare.com/registrar/faq/)
- [Cloudflare — Certificate authorities and CAA records](https://developers.cloudflare.com/ssl/reference/certificate-authorities/)
- [Vercel — Working with nameservers](https://vercel.com/docs/domains/working-with-nameservers)
- [Vercel KB — Can I use my domain on Vercel with A records?](https://vercel.com/kb/guide/a-record-and-caa-with-vercel)
- [Vercel KB — Should I use Cloudflare in front of Vercel?](https://vercel.com/kb/guide/cloudflare-with-vercel)
- [Vercel — Working with SSL certificates](https://vercel.com/docs/domains/working-with-ssl)
