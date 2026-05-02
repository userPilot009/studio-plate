-- Run this in the Supabase dashboard SQL editor (Database → SQL Editor → New query).
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS.

create table if not exists generations (
  id                        uuid        primary key default gen_random_uuid(),
  created_at                timestamptz not null    default now(),

  -- The form inputs submitted by the user
  form_data                 jsonb       not null,

  -- Generated HTML files: 1 element for Signature, 3 for Triple
  html                      text[]      not null    default '{}',

  -- Which tier was generated
  tier                      text        not null    check (tier in ('signature', 'triple')),

  -- Filled in at purchase time
  email                     text,
  paid                      boolean     not null    default false,
  stripe_session_id         text,

  -- Tokenised download link (set after successful payment)
  -- Separate UUID from row id so the row id can be shared in preview URLs
  -- without granting download access
  download_token            uuid        unique,
  download_token_expires_at timestamptz,
  download_count            integer     not null    default 0,

  -- Set after Resend successfully sends the purchase confirmation (retry-safe webhook handling)
  confirmation_email_sent_at timestamptz
);

-- All access goes through the service-role key (server-only), which bypasses RLS.
-- No public policies means the anon key can read nothing.
alter table generations enable row level security;

-- Fast lookups for the Stripe webhook and the download endpoint
create index if not exists generations_stripe_session_id_idx
  on generations (stripe_session_id)
  where stripe_session_id is not null;

create index if not exists generations_download_token_idx
  on generations (download_token)
  where download_token is not null;

-- If you created `generations` before confirmation emails existed, run once:
-- alter table generations add column if not exists confirmation_email_sent_at timestamptz;
