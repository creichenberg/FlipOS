-- Blueprint Studio — thumbs up/down feedback on a finished, rendered video.
-- One rating per render_job (a card can be re-rendered, and each render is
-- its own thing to rate) rather than per video_card, hence the unique
-- constraint on render_job_id - rating the same job twice updates it
-- in place instead of creating a second row.
--
-- Owner-scoped via RLS the same way render_jobs itself is ("for all",
-- scoped through the business a rating belongs to) - a business can only
-- see/write its own ratings. The admin dashboard reads across every
-- business's ratings via the service-role client, same as it does for
-- businesses/subscriptions.

create type video_rating_value as enum ('up', 'down');

create table video_ratings (
  id uuid primary key default gen_random_uuid(),
  render_job_id uuid not null unique references render_jobs(id) on delete cascade,
  video_card_id uuid not null references video_cards(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  rating video_rating_value not null,
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table video_ratings enable row level security;

create policy "video_ratings_owner" on video_ratings for all
  using (business_id in (select id from businesses where user_id = auth.uid()))
  with check (business_id in (select id from businesses where user_id = auth.uid()));

create index on video_ratings (business_id);
create index on video_ratings (created_at);
