-- Blueprint Studio — clip uploads. A deliberately small slice of Phase 2's
-- planned media_uploads table: this stores raw clips only, with no
-- transcription/rendering/music - those still need vendor decisions per
-- /root/.claude/plans/functional-plotting-seal.md §7. Storing a raw clip
-- against its shot needs no vendor at all, so it doesn't have to wait.

create table media_uploads (
  id uuid primary key default gen_random_uuid(),
  video_card_id uuid not null references video_cards(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  shot_id uuid references shots(id) on delete cascade,
  voiceover_line_id uuid references voiceover_lines(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  uploaded_at timestamptz not null default now(),
  check ((shot_id is not null) <> (voiceover_line_id is not null))
);

alter table media_uploads enable row level security;

create policy "media_uploads_owner" on media_uploads for all
  using (business_id in (select id from businesses where user_id = auth.uid()))
  with check (business_id in (select id from businesses where user_id = auth.uid()));

create index on media_uploads (video_card_id);
create index on media_uploads (shot_id);
create index on media_uploads (voiceover_line_id);

-- Storage bucket for the raw clips themselves. Private (not public) - every
-- read/write goes through the RLS policies below, gated by the authenticated
-- user's own session, same as every other table in this schema.
insert into storage.buckets (id, name, public)
values ('clips', 'clips', false)
on conflict (id) do nothing;

-- Objects are keyed as `{business_id}/{video_card_id}/{filename}`, so
-- ownership is checked straight from the path - no join needed, same
-- cheap-RLS principle as the denormalized business_id columns above.
create policy "clips_owner_select" on storage.objects for select
  using (
    bucket_id = 'clips'
    and (storage.foldername(name))[1]::uuid in (select id from businesses where user_id = auth.uid())
  );

create policy "clips_owner_insert" on storage.objects for insert
  with check (
    bucket_id = 'clips'
    and (storage.foldername(name))[1]::uuid in (select id from businesses where user_id = auth.uid())
  );

create policy "clips_owner_delete" on storage.objects for delete
  using (
    bucket_id = 'clips'
    and (storage.foldername(name))[1]::uuid in (select id from businesses where user_id = auth.uid())
  );
