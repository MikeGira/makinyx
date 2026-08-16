// DNS drift + hardening guard for makinyx.com.
//
// Compares the live zone against the declared state in dns/makinyx.com.json and
// fails when they diverge. Everything resolves over DNS-over-HTTPS so the check
// behaves identically on a GitHub runner and on a home network whose ISP
// resolver lies about makinyx.com (see the 2026-07-31 Bell sinkhole incident).
//
// Records marked "enforce": false are hardening that is declared but not yet
// applied in Cloudflare — they report as warnings so the gap stays visible
// until someone closes it, then the flag flips to true and they become failures.
//
// On failure: deduped issue (label: dns-guard) + non-zero exit so the scheduled
// run emails. On recovery: auto-closes the open issues.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { connect } from 'node:tls';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SPEC = JSON.parse(readFileSync(join(HERE, '..', 'dns', 'makinyx.com.json'), 'utf8'));

const GH_TOKEN = process.env.GH_TOKEN;
const REPO = process.env.REPO;
const LABEL = 'dns-guard';
const RESOLVERS = [
  'https://cloudflare-dns.com/dns-query',
  'https://dns.google/resolve',
];

const failures = [];
const warnings = [];
const notes = [];

const record = (enforced, message) => (enforced ? failures : warnings).push(message);

// ── DNS over HTTPS ───────────────────────────────────────────────────────────

async function doh(name, type, resolver = RESOLVERS[0]) {
  const url = `${resolver}?name=${encodeURIComponent(name)}&type=${type}&do=1`;
  const res = await fetch(url, {
    headers: { accept: 'application/dns-json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`${resolver} returned HTTP ${res.status} for ${name}/${type}`);
  return res.json();
}

const TYPE_CODE = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, DS: 43, CAA: 257 };

// Answers can carry a CNAME chain; keep only the records actually asked for.
function answers(json, type) {
  return (json.Answer || []).filter(a => a.type === TYPE_CODE[type]).map(a => a.data.trim());
}

// Cross-check two independent resolvers. Disagreement means the zone is mid
// propagation or one path is being tampered with — either way, do not act on it.
async function lookup(name, type) {
  const [primary, secondary] = await Promise.all(
    RESOLVERS.map(r => doh(name, type, r).catch(err => ({ error: err.message }))),
  );
  if (primary.error) throw new Error(primary.error);
  const values = answers(primary, type);
  if (!secondary.error) {
    const other = answers(secondary, type);
    const same = values.length === other.length && [...values].sort().join() === [...other].sort().join();
    if (!same) {
      notes.push(`\`${name}\` ${type}: resolvers disagree — Cloudflare ${JSON.stringify(values)} vs Google ${JSON.stringify(other)}.`);
    }
  }
  return { values, ad: primary.AD === true };
}

const stripDot = v => v.replace(/\.$/, '').toLowerCase();
const unquote = v => v.replace(/^"|"$/g, '').replace(/" "/g, '');

// Cloudflare returns CAA in presentation form (`0 issue "letsencrypt.org"`);
// some resolvers return RFC 3597 hex (`\# 22 0005...`). Handle both.
function parseCaa(data) {
  if (data.startsWith('\\#')) {
    const hex = data.split(/\s+/).slice(2).join('');
    const bytes = Buffer.from(hex, 'hex');
    const tagLen = bytes[1];
    return {
      flags: bytes[0],
      tag: bytes.subarray(2, 2 + tagLen).toString('ascii'),
      value: bytes.subarray(2 + tagLen).toString('ascii').trim(),
    };
  }
  const m = data.match(/^(\d+)\s+(\S+)\s+"?([^"]*)"?$/);
  return m ? { flags: Number(m[1]), tag: m[2], value: m[3].trim() } : null;
}

// ── Checks ───────────────────────────────────────────────────────────────────

async function checkNameservers() {
  const spec = SPEC.nameservers;
  const { values } = await lookup(SPEC.zone, 'NS');
  const observed = values.map(stripDot);
  if (observed.length === 0) {
    record(spec.enforce, `**Nameservers missing:** \`${SPEC.zone}\` returned no NS records.`);
    return;
  }
  const wrong = observed.filter(ns => !ns.endsWith(spec.expectSuffix));
  if (wrong.length > 0) {
    record(
      spec.enforce,
      `**Nameserver delegation changed:** \`${SPEC.zone}\` now answers ${JSON.stringify(observed)}, expected all to end in \`${spec.expectSuffix}\`. ` +
        `Moving DNS authority off Cloudflare is a rejected decision — see ${SPEC.decisionRecord}. If this was intentional, amend the ADR first.`,
    );
    return;
  }
  console.log(`NS ok: ${observed.join(', ')}`);
}

async function checkHost(host) {
  const { values } = await lookup(host.name, host.type);
  const observed = values.map(stripDot).sort();
  const expected = [...host.expect].map(stripDot).sort();
  if (observed.join() !== expected.join()) {
    record(
      host.enforce,
      `**${host.name} ${host.type} drift:** live ${JSON.stringify(observed)} vs declared ${JSON.stringify(expected)} ` +
        `(Vercel project \`${host.vercelProject}\`). Update Cloudflare, or update \`dns/${SPEC.zone}.json\` if Vercel changed the recommended target.`,
    );
  } else {
    console.log(`${host.name} ${host.type} ok: ${observed.join(', ')}`);
  }

  // A Cloudflare-proxied record answers from Cloudflare's anycast range, not
  // Vercel's — proxying is explicitly not wanted here, so the value drift above
  // already catches it. This only reports the 200 and the certificate.
  await checkHttp(host);
  await checkTls(host);
}

async function checkHttp(host) {
  if (!host.http) return;
  let status = 0;
  let error;
  try {
    const res = await fetch(`https://${host.name}`, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
    status = res.status;
  } catch (err) {
    error = err.message;
  }
  if (status !== host.http) {
    record(host.enforce, `**${host.name} returned HTTP ${status || `0 (${error})`}**, expected ${host.http}.`);
  } else {
    console.log(`${host.name} HTTP ${status} ok`);
  }
}

function peerCertificate(hostname) {
  return new Promise((resolve, reject) => {
    const socket = connect({ host: hostname, port: 443, servername: hostname, timeout: 15000 }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      resolve(cert);
    });
    socket.on('timeout', () => { socket.destroy(); reject(new Error('TLS handshake timed out')); });
    socket.on('error', reject);
  });
}

async function checkTls(host) {
  const spec = SPEC.tls;
  let cert;
  try {
    cert = await peerCertificate(host.name);
  } catch (err) {
    record(spec.enforce, `**${host.name} TLS handshake failed:** ${err.message}.`);
    return;
  }
  const issuer = cert.issuer?.O || 'unknown';
  if (!spec.allowedIssuerOrgs.includes(issuer)) {
    record(
      spec.enforce,
      `**${host.name} certificate issued by an unexpected CA:** \`${issuer}\`. Allowed: ${spec.allowedIssuerOrgs.join(', ')}. ` +
        `Treat as possible mis-issuance until explained.`,
    );
  }
  const daysLeft = Math.floor((Date.parse(cert.valid_to) - Date.now()) / 86400000);
  if (Number.isNaN(daysLeft)) {
    record(spec.enforce, `**${host.name} certificate expiry unreadable** (valid_to: ${cert.valid_to}).`);
  } else if (daysLeft < spec.minDaysRemaining) {
    record(spec.enforce, `**${host.name} certificate expires in ${daysLeft} day(s)** (threshold ${spec.minDaysRemaining}) — renewal is not happening.`);
  } else {
    console.log(`${host.name} TLS ok: ${issuer}, ${daysLeft}d remaining`);
  }
}

async function checkCaa() {
  const spec = SPEC.caa;
  const { values } = await lookup(SPEC.zone, 'CAA');
  const parsed = values.map(parseCaa).filter(Boolean);
  const issuers = parsed.filter(r => r.tag === 'issue').map(r => r.value.split(';')[0].trim().toLowerCase());

  if (parsed.length === 0) {
    record(
      spec.enforce,
      `**No CAA record on \`${SPEC.zone}\`:** any public CA may issue for this domain. ` +
        `Add \`0 issue\` records for ${spec.issueAllow.join(', ')} — see ${SPEC.runbook}.`,
    );
    return;
  }

  // A CAA record that omits Let's Encrypt silently breaks Vercel's renewals —
  // the failure surfaces weeks later as an expired certificate, so it is always
  // a hard failure regardless of the enforce flag.
  if (spec.hardFailIfPresentButMissingLetsEncrypt && !issuers.includes('letsencrypt.org') && !issuers.includes(';')) {
    failures.push(
      `**CAA blocks Let's Encrypt:** \`${SPEC.zone}\` allows ${JSON.stringify(issuers)}. ` +
        `Vercel renews via Let's Encrypt — certificates will fail to renew.`,
    );
  }
  const unexpected = issuers.filter(i => i !== ';' && !spec.issueAllow.includes(i));
  if (unexpected.length > 0) {
    record(spec.enforce, `**CAA allows undeclared CAs:** ${JSON.stringify(unexpected)} are not in the declared allowlist.`);
  }
  const missing = spec.issueAllow.filter(i => !issuers.includes(i));
  if (missing.length > 0) {
    record(spec.enforce, `**CAA missing declared CAs:** ${JSON.stringify(missing)} — Cloudflare-issued certificates for this zone may fail to renew.`);
  }
  if (issuers.length > 0) console.log(`CAA present: ${issuers.join(', ')}`);
}

async function checkDnssec() {
  const spec = SPEC.dnssec;
  const ds = await lookup(SPEC.zone, 'DS');
  if (ds.values.length === 0) {
    record(
      spec.enforce,
      `**DNSSEC not enabled:** no DS record for \`${SPEC.zone}\` in the .com registry, so forged answers cannot be detected by validating resolvers. ` +
        `Cloudflare is both registrar and DNS operator here, so this is one toggle — see ${SPEC.runbook}.`,
    );
    return;
  }
  const apex = await lookup(SPEC.zone, 'A');
  if (!apex.ad) {
    record(spec.enforce, `**DNSSEC published but not validating:** DS record exists, yet the resolver did not set the AD bit for \`${SPEC.zone}\` A. The chain of trust is broken.`);
  } else {
    console.log(`DNSSEC ok: DS published, answers validate`);
  }
}

async function checkEmail() {
  const spec = SPEC.email;
  if (!spec.sendsMail) {
    const mx = await lookup(SPEC.zone, 'MX');
    const isNull = mx.values.length === 1 && /^0\s+\.?$/.test(mx.values[0].trim());
    if (!isNull) {
      const detail = mx.values.length === 0 ? 'no MX record at all' : `MX ${JSON.stringify(mx.values)}`;
      record(spec.enforce, `**No RFC 7505 null MX:** \`${SPEC.zone}\` has ${detail}. Publish \`MX 0 .\` to declare the domain accepts no mail.`);
    } else {
      console.log('Null MX ok');
    }
  }

  const txt = await lookup(SPEC.zone, 'TXT');
  const spf = txt.values.map(unquote).find(v => v.toLowerCase().startsWith('v=spf1'));
  if (!spf) {
    record(spec.enforce, `**No SPF record:** anyone can send mail claiming to be \`@${SPEC.zone}\`. Publish TXT \`${spec.spf}\`.`);
  } else if (spf.replace(/\s+/g, ' ').trim() !== spec.spf) {
    record(spec.enforce, `**SPF drift:** live \`${spf}\` vs declared \`${spec.spf}\`.`);
  } else {
    console.log('SPF ok');
  }

  const dmarcTxt = await lookup(`_dmarc.${SPEC.zone}`, 'TXT');
  const dmarc = dmarcTxt.values.map(unquote).find(v => v.toLowerCase().startsWith('v=dmarc1'));
  if (!dmarc) {
    record(spec.enforce, `**No DMARC record:** receivers have no instruction to reject spoofed \`@${SPEC.zone}\` mail. Publish TXT at \`_dmarc.${SPEC.zone}\`: \`${spec.dmarc}\`.`);
  } else if (!/p\s*=\s*reject/i.test(dmarc)) {
    record(spec.enforce, `**DMARC not enforcing:** live policy is \`${dmarc}\`, declared \`${spec.dmarc}\`.`);
  } else if (!spec.sendsMail && !/sp\s*=\s*reject/i.test(dmarc)) {
    // Without sp=, subdomains inherit p= — but only for subdomains with no
    // record of their own. Stating it explicitly is what M3AAWG specifies, and
    // this zone has three subdomains in production.
    record(spec.enforce, `**DMARC does not cover subdomains:** live policy is \`${dmarc}\`, which omits \`sp=reject\`. \`bio.\`, \`taskpilot.\` and any future subdomain are unprotected.`);
  } else {
    console.log('DMARC ok');
  }

  if (spec.dkimRevocation) {
    // A wildcard record only proves itself through a label nobody would create.
    const probe = `zz-dns-guard-probe._domainkey.${SPEC.zone}`;
    const dkim = await lookup(probe, 'TXT');
    const revoked = dkim.values.map(unquote).some(v => /^v=DKIM1\s*;\s*p=\s*$/i.test(v.trim()));
    if (!revoked) {
      record(
        spec.enforce,
        `**No wildcard DKIM revocation:** \`${spec.dkimRevocation.name}.${SPEC.zone}\` does not publish \`${spec.dkimRevocation.value}\`, ` +
          `so a forged message can claim any DKIM selector and receivers have nothing that says the key is void.`,
      );
    } else {
      console.log('DKIM wildcard revocation ok');
    }
  }
}

// ── Reporting ────────────────────────────────────────────────────────────────

const API = REPO ? `https://api.github.com/repos/${REPO}` : null;
const HEADERS = {
  Authorization: `Bearer ${GH_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

async function gh(path, options = {}) {
  return fetch(`${API}${path}`, {
    ...options,
    headers: { ...HEADERS, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
}

async function openIssues() {
  const res = await gh(`/issues?labels=${LABEL}&state=open`);
  if (!res.ok) return [];
  const issues = await res.json();
  return Array.isArray(issues) ? issues : [];
}

async function report(severity, lines) {
  const today = new Date().toISOString().slice(0, 10);
  const blob = p => `https://github.com/${REPO}/blob/main/${p}`;
  // The same unapplied hardening would otherwise be re-reported every night
  // until it is done, which trains everyone to ignore the issue. Only speak up
  // when the set of findings actually changes.
  const fingerprint = createHash('sha256').update([...lines].sort().join('\n')).digest('hex').slice(0, 16);
  const body =
    `## DNS guard — ${today} (${severity})\n\nZone: \`${SPEC.zone}\`\n\n${lines.map(l => `- ${l}`).join('\n')}\n\n` +
    `---\n*Declared state: [\`dns/${SPEC.zone}.json\`](${blob(`dns/${SPEC.zone}.json`)}). Decision record: [\`${SPEC.decisionRecord}\`](${blob(SPEC.decisionRecord)}). ` +
    `Items reported as warnings are declared-but-not-yet-applied hardening; apply them per [\`${SPEC.runbook}\`](${blob(SPEC.runbook)}) and flip \`enforce\` to \`true\`.*\n` +
    `<!-- dns-guard-fingerprint: ${fingerprint} -->`;

  const open = await openIssues();
  if (open.length > 0) {
    const issue = open[0];
    const res = await gh(`/issues/${issue.number}/comments?per_page=100`);
    const comments = res.ok ? await res.json() : [];
    const latest = [issue, ...(Array.isArray(comments) ? comments : [])].pop();
    if (latest?.body?.includes(`dns-guard-fingerprint: ${fingerprint}`)) {
      console.log(`Findings unchanged since last run — issue #${issue.number} left alone.`);
      return;
    }
    await gh(`/issues/${issue.number}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
    console.log(`Appended findings to issue #${issue.number}`);
    return;
  }
  const label = await gh('/labels', {
    method: 'POST',
    body: JSON.stringify({ name: LABEL, color: '5319e7', description: 'DNS drift and hardening findings for makinyx.com' }),
  });
  if (!label.ok && label.status !== 422) console.warn(`Label create returned ${label.status}`);
  const res = await gh('/issues', {
    method: 'POST',
    body: JSON.stringify({ title: `DNS guard: ${severity} [${today}]`, body, labels: [LABEL] }),
  });
  if (!res.ok) throw new Error(`Issue create failed: ${res.status} ${await res.text()}`);
  console.log(`Issue created: ${(await res.json()).html_url}`);
}

async function closeIssues() {
  for (const issue of await openIssues()) {
    await gh(`/issues/${issue.number}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: `All declared DNS state verified as of ${new Date().toISOString()} — closing.` }),
    });
    await gh(`/issues/${issue.number}`, { method: 'PATCH', body: JSON.stringify({ state: 'closed', state_reason: 'completed' }) });
    console.log(`Closed issue #${issue.number}`);
  }
}

async function main() {
  await checkNameservers();
  for (const host of SPEC.hosts) await checkHost(host);
  await checkCaa();
  await checkDnssec();
  await checkEmail();

  const lines = [...failures, ...warnings, ...notes];
  console.log(`\n${failures.length} failure(s), ${warnings.length} warning(s), ${notes.length} note(s)`);
  for (const line of lines) console.log(`  - ${line.replace(/\*\*/g, '')}`);

  if (!API || !GH_TOKEN) {
    console.log('\nNo GH_TOKEN/REPO — local run, skipping issue reporting.');
    if (failures.length > 0) process.exit(1);
    return;
  }

  if (lines.length === 0) {
    await closeIssues();
    return;
  }
  await report(failures.length > 0 ? 'FAILING' : 'warning', lines);
  if (failures.length > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
