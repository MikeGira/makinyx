# Runbook — makinyx.com DNS hardening

Applies the four controls declared with `"enforce": false` in [`dns/makinyx.com.json`](../../dns/makinyx.com.json).
Each is a Cloudflare dashboard change — nobody but the account owner can make them — followed by a
one-line edit in this repo to turn the control from a warning into a CI failure.

The decision to keep DNS at Cloudflare at all is [ADR 0001](../adr/0001-dns-authority-stays-at-cloudflare.md).
Read that first if the question is "should we move to Vercel nameservers", because the answer is no.

**Verify after each step** with:

```bash
node scripts/dns-guard.js
```

It reads the live zone over DNS-over-HTTPS, so it is not fooled by a local resolver. Run it from any
machine; no credentials needed for the local (report-only) mode.

---

## 1. Enable DNSSEC

**Why.** Without DNSSEC, a resolver anywhere in the path can hand a client a forged address for
`makinyx.com` and nothing detects it. That is not hypothetical here: on 2026-07-31 an ISP resolver
answered `makinyx.com` with `18.204.152.241`, an address that has never belonged to this domain. A
validating resolver rejects a forged answer for a signed zone. It does not fix a client that does not
validate, and it does nothing about TLS-layer filtering — it removes one attack class, not all of them.

**Steps.**

1. Cloudflare dashboard → account → **makinyx.com** → **DNS** → **Settings**.
2. **Enable DNSSEC**.
3. Because Cloudflare is also the registrar for this domain, the DS record is published to the `.com`
   registry automatically — there is nothing to copy anywhere. No dialog asking for a DS record
   should appear; if one does, stop, because it means the registrar is not what this repo believes.

**Verify.** `dig +dnssec DS makinyx.com` returns a record, or `node scripts/dns-guard.js` prints
`DNSSEC ok`. Registry propagation can take a few hours.

**Then.** Set `dnssec.enforce` to `true` in `dns/makinyx.com.json`.

---

## 2. Add CAA records

**Why.** With no CAA record, every publicly trusted CA in the world is permitted to issue a
certificate for `makinyx.com`. CAA narrows that to the CAs actually in use.

**The values.** All four are needed, and getting this wrong causes a silent outage weeks later when a
renewal fails, so do not trim the list:

| Tag | Value | Who needs it |
|---|---|---|
| `issue` | `letsencrypt.org` | Vercel — issues and renews the live certificates |
| `issue` | `pki.goog; cansignhttpexchanges=yes` | Cloudflare Universal SSL |
| `issue` | `ssl.com` | Cloudflare CA |
| `issue` | `sectigo.com` | Cloudflare backup CA |

All four appear in the certificate transparency log for this domain already, or are documented by
Cloudflare as a CA it may use for the zone.

Do **not** add an `issuewild` record. Under RFC 8659, when `issuewild` is absent the `issue` records
govern wildcard issuance too — one record set to keep correct instead of two, and no risk of
accidentally blocking Cloudflare's wildcard Universal SSL renewal.

**Steps.**

1. **DNS** → **Records** → **Add record** → Type **CAA**.
2. Name `@`, Tag **Only allow specific hostnames** (`issue`), CA domain name as per the table.
3. Repeat for each of the four.

Cloudflare may add some of these itself; duplicates are harmless and it de-duplicates.

**Verify.** `node scripts/dns-guard.js` prints `CAA present: letsencrypt.org, pki.goog, ssl.com, sectigo.com`.

**Then.** Set `caa.enforce` to `true`.

> The guard treats "a CAA record exists but omits `letsencrypt.org`" as a hard failure even while
> `enforce` is `false`, because that specific mistake breaks Vercel's renewals and shows up only when
> the certificate expires.

---

## 3. Publish the parked-domain email records

**Why.** `makinyx.com` neither sends nor receives mail, and has no SPF, no DMARC and no MX. That means
anyone can send mail as `mike@makinyx.com` and receiving servers have no instruction to reject it —
against a domain that is on a résumé and named in published legal pages. The M3AAWG parked-domain
baseline is three records.

**The values.**

| Type | Name | Content |
|---|---|---|
| MX | `makinyx.com` | priority `0`, mail server `.` |
| TXT | `makinyx.com` | `v=spf1 -all` |
| TXT | `_dmarc.makinyx.com` | `v=DMARC1; p=reject; rua=mailto:byosekumbuga@gmail.com; ruf=mailto:byosekumbuga@gmail.com; fo=1; aspf=s; adkim=s` |

**Steps.** Cloudflare's **DNS** → **Records** page has an **Email security** wizard for domains that
do not send email, which writes SPF and DMARC for you; use it, then check the values match the table
above and adjust the DMARC policy to `p=reject` if it wrote something weaker.

The null MX must be added by hand. Cloudflare's form rejects a bare `.` unless the priority is `0` and
the **Name** field is the full domain (`makinyx.com`) rather than `@` — a known quirk of their
validation, not a DNS restriction.

**Verify.** `node scripts/dns-guard.js` prints `Null MX ok`, `SPF ok`, `DMARC ok`.

**Then.** Set `email.enforce` to `true`.

> ⚠ **Standing up `privacy@makinyx.com` reverses part of this.** Cloudflare Email Routing needs real
> MX records, so the null MX has to go and SPF has to be relaxed to whatever Cloudflare publishes.
> Make that change in `dns/makinyx.com.json` in the same commit as the Cloudflare change, or the
> guard will correctly start failing.

---

## 4. Confirm every record stays DNS-only

**Why.** An orange-clouded (proxied) record terminates TLS at Cloudflare, which breaks Vercel's
Let's Encrypt HTTP-01 challenge, and Vercel states it does not recommend any reverse proxy in front of
it — the Vercel Firewall and bot protection lose the traffic visibility they depend on. See ADR 0001 §5.

**Steps.** **DNS** → **Records** — every record for this zone shows a grey cloud. If any is orange,
click it off.

**Verify.** The guard catches this automatically: a proxied record answers with a Cloudflare anycast
address instead of `76.76.21.21`, which fails the declared-value check for that host.

---

## Rolling back

Every step here is a DNS record, and DNS changes take effect at TTL speed. Delete the record in
Cloudflare and revert the corresponding `enforce` flag. DNSSEC is the one to be careful with: disable
it in the Cloudflare dashboard rather than deleting anything at the registry, and wait for the DS to
be withdrawn before changing DNS provider — a stale DS with no matching key makes the domain
unresolvable for validating resolvers.
