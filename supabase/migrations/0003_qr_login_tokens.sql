-- Blueprint Studio — short-lived, single-use tokens for the Filming Mode
-- QR code's auto-login handoff (desktop -> phone). No RLS policies are
-- defined below, so with RLS enabled this table is default-deny for the
-- anon/authenticated roles entirely - only the service-role client (which
-- bypasses RLS) can read or write it, same as stripe_events. A leaked
-- token is still bounded by its own short expiry and single-use consume,
-- but it shouldn't be readable through the normal API at all regardless.

create table qr_login_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  next_path text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table qr_login_tokens enable row level security;

create index on qr_login_tokens (token);
create index on qr_login_tokens (expires_at);
