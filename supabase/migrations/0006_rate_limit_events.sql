-- Blueprint Studio — per-user rate limiting for the AI-generation and
-- render-triggering routes (weekly plan generate/regenerate, per-card idea
-- regenerate, per-card detail generate, render submit). Each of those hits a
-- real paid API (Anthropic or the render provider) - this is a plain
-- append-only log of "user X did action Y at time Z" that the routes query
-- for a recent count before proceeding, rather than a new caching layer
-- (Redis/Upstash) - correctness across serverless instances matters more
-- here than raw speed for what are already deliberately-occasional actions.
--
-- Owner-scoped via RLS like most other tables (not a zero-policy
-- service-role-only table like qr_login_tokens/stripe_events - there's
-- nothing sensitive in a user seeing their own event timestamps), but only
-- select/insert are granted, deliberately no update/delete policy - a user
-- being able to see their own throttle history is harmless, being able to
-- delete it to reset their own limit would defeat the point.

create table rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

alter table rate_limit_events enable row level security;

create policy "rate_limit_events_select_own" on rate_limit_events for select
  using (user_id = auth.uid());

create policy "rate_limit_events_insert_own" on rate_limit_events for insert
  with check (user_id = auth.uid());

create index on rate_limit_events (user_id, action, created_at);
