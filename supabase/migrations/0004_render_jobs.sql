-- Blueprint Studio — Phase 2, part one: auto-editing render jobs. Deliberately
-- scoped down from the original plan (/root/.claude/plans/functional-plotting-seal.md
-- §7): no music_tracks table (music explicitly skipped for now) and no
-- separate transcriptions table (captions are built from the already-known
-- voiceover_lines script text, not a separate ASR step - see recipeBuilder.ts).
-- final_videos is folded into render_jobs itself rather than a separate
-- table - a job's outcome *is* the final video reference, and multiple rows
-- per video_card_id already give a full render history if ever needed.

create type render_job_status as enum ('queued', 'rendering', 'complete', 'failed');

create table render_jobs (
  id uuid primary key default gen_random_uuid(),
  video_card_id uuid not null references video_cards(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  provider text not null,
  provider_job_id text,
  status render_job_status not null default 'queued',
  recipe jsonb not null,
  video_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table render_jobs enable row level security;

create policy "render_jobs_owner" on render_jobs for all
  using (business_id in (select id from businesses where user_id = auth.uid()))
  with check (business_id in (select id from businesses where user_id = auth.uid()));

create index on render_jobs (video_card_id);
