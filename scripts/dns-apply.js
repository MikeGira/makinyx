// Reconciles the Cloudflare zone with the declared state in dns/makinyx.com.json.
//
// Deliberately narrow. It manages exactly the records listed in MANAGED below —
// the hardening records — and will not create, edit or delete anything else. The
// A and NS records that keep the site up are read for a safety check and never
// written, so a bug here cannot take makinyx.com offline.
//
//   node scripts/dns-apply.js            # plan only, changes nothing
//   node scripts/dns-apply.js --apply    # execute the plan
//
// Needs CLOUDFLARE_API_TOKEN with Zone:Read + DNS:Edit (+ Zone Settings:Edit for
// DNSSEC) scoped to this zone alone. Verify afterwards with scripts/dns-guard.js,
// which reads public DNS rather than the API and so checks the result rather than
// the intent.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SPEC = JSON.parse(readFileSync(join(HERE, '..', 'dns', 'makinyx.com.json'), 'utf8'));

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const APPLY = process.argv.includes('--apply');
const API = 'https://api.cloudflare.com/client/v4';

if (!TOKEN) {
  console.error('CLOUDFLARE_API_TOKEN is not set.');
  process.exit(1);
}

async function cf(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    signal: AbortSignal.timeout(20000),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.success) {
    const detail = (json.errors || []).map(e => `${e.code} ${e.message}`).join('; ') || `HTTP ${res.status}`;
    throw new Error(`${options.method || 'GET'} ${path} failed: ${detail}`);
  }
  return json.result;
}

// ── The managed set ──────────────────────────────────────────────────────────
// `match` identifies an existing record this entry owns. Anything not matched by
// one of these is left completely alone, which is what keeps other TXT records
// (domain verification and the like) safe.

function managedRecords() {
  const zone = SPEC.zone;
  const email = SPEC.email;
  const out = [];

  for (const ca of SPEC.caa.issueAllow) {
    out.push({
      label: `CAA issue "${ca}"`,
      type: 'CAA',
      name: zone,
      data: { flags: 0, tag: 'issue', value: ca },
      match: r => r.type === 'CAA' && r.data?.tag === 'issue' && r.data?.value === ca,
    });
  }

  out.push({
    label: 'null MX (RFC 7505)',
    type: 'MX',
    name: zone,
    content: '.',
    priority: 0,
    match: r => r.type === 'MX' && r.name === zone,
  });

  out.push({
    label: `SPF "${email.spf}"`,
    type: 'TXT',
    name: zone,
    content: email.spf,
    // Only the SPF record at the apex, never another TXT that happens to live there.
    match: r => r.type === 'TXT' && r.name === zone && /^"?v=spf1/i.test(r.content),
  });

  out.push({
    label: `DMARC "${email.dmarc}"`,
    type: 'TXT',
    name: `_dmarc.${zone}`,
    content: email.dmarc,
    match: r => r.type === 'TXT' && r.name === `_dmarc.${zone}`,
  });

  out.push({
    label: `wildcard DKIM revocation "${email.dkimRevocation.value}"`,
    type: 'TXT',
    name: `${email.dkimRevocation.name}.${zone}`,
    content: email.dkimRevocation.value,
    match: r => r.type === 'TXT' && r.name === `${email.dkimRevocation.name}.${zone}`,
  });

  return out;
}

const sameContent = (record, want) => {
  if (want.type === 'CAA') {
    return record.data?.flags === want.data.flags && record.data?.tag === want.data.tag && record.data?.value === want.data.value;
  }
  if (want.type === 'MX') {
    return record.content.replace(/\.$/, '') === want.content.replace(/\.$/, '') && record.priority === want.priority;
  }
  return record.content.replace(/^"|"$/g, '') === want.content;
};

// ── Safety check ─────────────────────────────────────────────────────────────
// Refuse to touch a zone that is not the one this repo describes, or whose live
// A records already disagree with the spec — in that case something else is
// wrong and writing more records is not the right move.

function assertZoneIsExpected(zone, records) {
  if (zone.name !== SPEC.zone) {
    throw new Error(`Zone ${zone.id} is ${zone.name}, expected ${SPEC.zone}. Refusing to touch it.`);
  }
  for (const host of SPEC.hosts) {
    const live = records.filter(r => r.type === host.type && r.name === host.name).map(r => r.content).sort();
    const want = [...host.expect].sort();
    if (live.join() !== want.join()) {
      throw new Error(
        `${host.name} ${host.type} is ${JSON.stringify(live)} in Cloudflare but the spec declares ${JSON.stringify(want)}. ` +
          `Resolve that first — this script will not write to a zone it does not recognise.`,
      );
    }
    if (records.some(r => r.name === host.name && r.proxied)) {
      throw new Error(`${host.name} is proxied (orange cloud). That breaks Vercel TLS issuance — fix it before running this.`);
    }
  }
}

// ── Plan and execute ─────────────────────────────────────────────────────────

async function main() {
  const zones = await cf(`/zones?name=${encodeURIComponent(SPEC.zone)}`);
  if (zones.length !== 1) throw new Error(`Expected exactly one zone named ${SPEC.zone}, got ${zones.length}.`);
  const zone = zones[0];
  console.log(`Zone ${zone.name} (${zone.id}), status ${zone.status}\n`);

  const records = await cf(`/zones/${zone.id}/dns_records?per_page=500`);
  assertZoneIsExpected(zone, records);
  console.log(`Safety check passed: ${SPEC.hosts.length} A records match the spec and none are proxied.\n`);

  const plan = [];
  for (const want of managedRecords()) {
    const existing = records.find(want.match);
    if (!existing) {
      plan.push({ action: 'create', want });
    } else if (!sameContent(existing, want)) {
      plan.push({ action: 'update', want, id: existing.id, from: existing.content ?? JSON.stringify(existing.data) });
    } else {
      console.log(`  ok       ${want.label}`);
    }
  }

  const dnssec = await cf(`/zones/${zone.id}/dnssec`);
  const dnssecNeedsEnabling = dnssec.status !== 'active' && dnssec.status !== 'pending';
  if (!dnssecNeedsEnabling) console.log(`  ok       DNSSEC (${dnssec.status})`);

  for (const step of plan) {
    console.log(`  ${step.action === 'create' ? 'CREATE  ' : 'UPDATE  '} ${step.want.label}${step.from ? ` (was: ${step.from})` : ''}`);
  }
  if (dnssecNeedsEnabling) console.log(`  ENABLE   DNSSEC (currently ${dnssec.status})`);

  if (plan.length === 0 && !dnssecNeedsEnabling) {
    console.log('\nNothing to do — Cloudflare already matches the declared state.');
    return;
  }

  if (!APPLY) {
    console.log(`\n${plan.length + (dnssecNeedsEnabling ? 1 : 0)} change(s) planned. Re-run with --apply to execute.`);
    return;
  }

  console.log('');
  for (const step of plan) {
    const { want } = step;
    const body = { type: want.type, name: want.name, ttl: 1, comment: 'Managed by dns/makinyx.com.json' };
    if (want.type === 'CAA') body.data = want.data;
    else body.content = want.content;
    if (want.type === 'MX') body.priority = want.priority;

    if (step.action === 'create') {
      await cf(`/zones/${zone.id}/dns_records`, { method: 'POST', body: JSON.stringify(body) });
      console.log(`  created  ${want.label}`);
    } else {
      await cf(`/zones/${zone.id}/dns_records/${step.id}`, { method: 'PUT', body: JSON.stringify(body) });
      console.log(`  updated  ${want.label}`);
    }
  }

  if (dnssecNeedsEnabling) {
    const result = await cf(`/zones/${zone.id}/dnssec`, { method: 'PATCH', body: JSON.stringify({ status: 'active' }) });
    console.log(`  enabled  DNSSEC — status now ${result.status}`);
    if (result.status !== 'active') {
      console.log('           Cloudflare is the registrar for this zone, so the DS record is published automatically; registry propagation takes a few hours.');
    }
  }

  console.log('\nApplied. Verify with: node scripts/dns-guard.js');
}

main().catch(err => { console.error(`\n${err.message}`); process.exit(1); });
