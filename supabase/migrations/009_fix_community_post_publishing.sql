-- Consolidates every value currently emitted by the Community composer.
-- public.posts uses text columns with check constraints (not PostgreSQL enums).
alter table public.posts
  add column if not exists training_visual_style text not null
  default 'full_carousel';

alter table public.posts
  drop constraint if exists posts_post_type_check;
alter table public.posts
  add constraint posts_post_type_check check (
    post_type in (
      'daily_life',
      'workout',
      'progress',
      'meal',
      'photo',
      'carousel',
      'video',
      'achievement',
      'text',
      'verified_workout'
    )
  );

alter table public.posts
  drop constraint if exists posts_visibility_check;
alter table public.posts
  add constraint posts_visibility_check check (
    visibility in ('public', 'followers', 'private')
  );

alter table public.posts
  drop constraint if exists posts_training_visual_style_check;
alter table public.posts
  add constraint posts_training_visual_style_check check (
    training_visual_style in (
      'photo_only',
      'photo_stats',
      'photo_body_map',
      'full_carousel',
      'stats_only'
    )
  );

alter table public.posts enable row level security;
alter table public.post_media enable row level security;

drop policy if exists "own posts insert" on public.posts;
create policy "own posts insert"
  on public.posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "own post media write" on public.post_media;
create policy "own post media write"
  on public.post_media
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.posts
      where posts.id = post_media.post_id
        and posts.user_id = auth.uid()
    )
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'community-media',
  'community-media',
  false,
  41943040,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "community media own uploads" on storage.objects;
drop policy if exists "community social uploads" on storage.objects;
drop policy if exists "community media own reads" on storage.objects;
drop policy if exists "community media own changes" on storage.objects;
drop policy if exists "community media own deletes" on storage.objects;

create policy "community media own uploads"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] in (
      'posts',
      'stories',
      'highlights',
      'profile'
    )
  );

create policy "community media own reads"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "community media own changes"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "community media own deletes"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
