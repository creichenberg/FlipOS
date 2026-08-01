-- Blueprint Studio — Phase 1 schema.
-- Phase 2 tables (media_uploads, transcriptions, music_tracks, render_jobs,
-- final_videos, content_flags) are intentionally not here yet — see
-- /root/.claude/plans/functional-plotting-seal.md §7. Add them in their own
-- migration once auto-edit vendors are chosen.

create extension if not exists "pgcrypto";

create type content_goal as enum ('educate', 'sell', 'entertain', 'build_trust', 'engage');
create type video_card_status as enum ('pending_detail', 'detail_ready', 'filming', 'complete');
create type weekly_plan_status as enum ('generating', 'ready', 'failed');
create type filming_session_status as enum ('in_progress', 'complete');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');

create table businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  industry text not null default '',
  description text not null default '',
  products_services text not null default '',
  target_audience text not null default '',
  location text not null default '',
  brand_personality text[] not null default '{}',
  goals text[] not null default '{}',
  website text,
  logo_url text,
  brand_colors jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table weekly_plans (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  week_start_date date not null,
  status weekly_plan_status not null default 'generating',
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (business_id, week_start_date)
);

create table video_cards (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid not null references weekly_plans(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  title text not null,
  concept text not null,
  content_goal content_goal not null,
  status video_card_status not null default 'pending_detail',
  created_at timestamptz not null default now()
);

create table video_details (
  id uuid primary key default gen_random_uuid(),
  video_card_id uuid not null references video_cards(id) on delete cascade unique,
  hook text not null,
  script text not null,
  voiceover_script text not null,
  on_screen_text text[] not null default '{}',
  editing_suggestions text not null default '',
  caption text not null default '',
  hashtags text[] not null default '{}',
  call_to_action text not null default '',
  generated_at timestamptz not null default now()
);

create table shots (
  id uuid primary key default gen_random_uuid(),
  video_card_id uuid not null references video_cards(id) on delete cascade,
  shot_number int not null,
  description text not null,
  duration_seconds numeric not null,
  camera_angle text not null,
  shot_type text not null,
  order_index int not null
);

create table voiceover_lines (
  id uuid primary key default gen_random_uuid(),
  video_card_id uuid not null references video_cards(id) on delete cascade,
  line_number int not null,
  text text not null,
  order_index int not null
);

create table filming_sessions (
  id uuid primary key default gen_random_uuid(),
  video_card_id uuid not null references video_cards(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status filming_session_status not null default 'in_progress'
);

create table shot_progress (
  id uuid primary key default gen_random_uuid(),
  filming_session_id uuid not null references filming_sessions(id) on delete cascade,
  shot_id uuid not null references shots(id) on delete cascade,
  is_complete boolean not null default false,
  completed_at timestamptz,
  unique (filming_session_id, shot_id)
);

create table voiceover_progress (
  id uuid primary key default gen_random_uuid(),
  filming_session_id uuid not null references filming_sessions(id) on delete cascade,
  voiceover_line_id uuid not null references voiceover_lines(id) on delete cascade,
  is_complete boolean not null default false,
  completed_at timestamptz,
  unique (filming_session_id, voiceover_line_id)
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  status subscription_status not null default 'incomplete',
  plan_tier text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Not user-scoped (service role only) — webhook idempotency ledger.
create table stripe_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb not null
);

-- Row Level Security -----------------------------------------------------
-- business_id/video_card_id are denormalized onto every child table
-- specifically so each policy is a single equality check, not a multi-hop
-- join, per the architecture plan.

alter table businesses enable row level security;
alter table weekly_plans enable row level security;
alter table video_cards enable row level security;
alter table video_details enable row level security;
alter table shots enable row level security;
alter table voiceover_lines enable row level security;
alter table filming_sessions enable row level security;
alter table shot_progress enable row level security;
alter table voiceover_progress enable row level security;
alter table subscriptions enable row level security;

create policy "businesses_owner" on businesses for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "weekly_plans_owner" on weekly_plans for all
  using (business_id in (select id from businesses where user_id = auth.uid()))
  with check (business_id in (select id from businesses where user_id = auth.uid()));

create policy "video_cards_owner" on video_cards for all
  using (business_id in (select id from businesses where user_id = auth.uid()))
  with check (business_id in (select id from businesses where user_id = auth.uid()));

create policy "video_details_owner" on video_details for all
  using (video_card_id in (
    select vc.id from video_cards vc join businesses b on b.id = vc.business_id where b.user_id = auth.uid()
  ))
  with check (video_card_id in (
    select vc.id from video_cards vc join businesses b on b.id = vc.business_id where b.user_id = auth.uid()
  ));

create policy "shots_owner" on shots for all
  using (video_card_id in (
    select vc.id from video_cards vc join businesses b on b.id = vc.business_id where b.user_id = auth.uid()
  ))
  with check (video_card_id in (
    select vc.id from video_cards vc join businesses b on b.id = vc.business_id where b.user_id = auth.uid()
  ));

create policy "voiceover_lines_owner" on voiceover_lines for all
  using (video_card_id in (
    select vc.id from video_cards vc join businesses b on b.id = vc.business_id where b.user_id = auth.uid()
  ))
  with check (video_card_id in (
    select vc.id from video_cards vc join businesses b on b.id = vc.business_id where b.user_id = auth.uid()
  ));

create policy "filming_sessions_owner" on filming_sessions for all
  using (business_id in (select id from businesses where user_id = auth.uid()))
  with check (business_id in (select id from businesses where user_id = auth.uid()));

create policy "shot_progress_owner" on shot_progress for all
  using (filming_session_id in (
    select fs.id from filming_sessions fs join businesses b on b.id = fs.business_id where b.user_id = auth.uid()
  ))
  with check (filming_session_id in (
    select fs.id from filming_sessions fs join businesses b on b.id = fs.business_id where b.user_id = auth.uid()
  ));

create policy "voiceover_progress_owner" on voiceover_progress for all
  using (filming_session_id in (
    select fs.id from filming_sessions fs join businesses b on b.id = fs.business_id where b.user_id = auth.uid()
  ))
  with check (filming_session_id in (
    select fs.id from filming_sessions fs join businesses b on b.id = fs.business_id where b.user_id = auth.uid()
  ));

create policy "subscriptions_owner_read" on subscriptions for select
  using (user_id = auth.uid());

-- subscriptions/stripe_events are otherwise written only by the service-role
-- key from the Stripe webhook route, never directly by a client.

create index on weekly_plans (business_id);
create index on video_cards (weekly_plan_id);
create index on video_cards (business_id);
create index on shots (video_card_id);
create index on voiceover_lines (video_card_id);
create index on filming_sessions (video_card_id);
create index on shot_progress (filming_session_id);
create index on voiceover_progress (filming_session_id);
