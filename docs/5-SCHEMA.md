# Backend Schema
# Project: Makinyx (makinyx.com)
# Date: 2026-07-16
# Database: Supabase PostgreSQL

---

## Tables

### Table: contact_submissions
**Purpose**: Store consulting/contact inquiries submitted via the hub's Connect-section form.
Provisioned in Phase 2 — not needed for the static Phase 1 MVP.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| name | text | NOT NULL, length-checked at app layer | |
| email | text | NOT NULL, format-checked at app layer | |
| message | text | NOT NULL, length-capped at app layer (e.g. 2000 chars) | |
| source | text | NOT NULL DEFAULT 'makinyx-hub' | Distinguishes this from any future Bio-originated submissions if tables are ever shared |
| ip_hash | text | nullable | Hashed (not raw) requester IP for basic abuse tracking — never store raw IPs |

**Indexes**:
- `created_at` (for admin sorting, most-recent-first)

**RLS Policies**:
```sql
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- No anon or authenticated policies are defined on this table at all.
-- All access goes through api/contact.js using the Supabase service role key,
-- which bypasses RLS by design — same pattern as Bio's api/db.js.
-- This means the browser can never read or write this table directly, even
-- with the anon key, because no policy grants it that access.
```

---

## Required GRANTs
```sql
-- Deliberately minimal: no GRANT to anon or authenticated on this table.
-- The service role (used only server-side in api/contact.js) bypasses RLS
-- and GRANTs entirely, so no public-facing GRANT is needed or wanted here.
GRANT USAGE ON SCHEMA public TO service_role;
```

## Relationships Diagram
```
contact_submissions (no foreign keys — no auth.users table exists, no accounts on this site)
```

## Migrations Checklist
- [ ] Enable RLS on `contact_submissions`: `ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;`
- [ ] Confirm zero anon/authenticated policies exist (intentional — service-role-only access)
- [ ] No public GRANTs applied (intentional)
- [ ] Index on `created_at`
- [ ] Run through Supabase Security Advisor after applying — expect it to flag "no policies" as
      informational, not a finding, since service-role access is the intended design
