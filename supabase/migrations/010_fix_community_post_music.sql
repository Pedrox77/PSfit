create table if not exists public.post_music (
  id uuid primary key default gen_random_uuid(),
  post_id uuid unique not null
    references public.posts(id) on delete cascade,
  provider text not null default 'spotify',
  spotify_url text not null,
  title text,
  artist_name text,
  artwork_url text,
  embed_url text,
  content_type text,
  created_at timestamptz not null default now()
);

alter table public.post_music
  add column if not exists post_id uuid,
  add column if not exists spotify_url text,
  add column if not exists title text,
  add column if not exists artist_name text,
  add column if not exists artwork_url text,
  add column if not exists embed_url text,
  add column if not exists content_type text;

create unique index if not exists post_music_post_id_unique
  on public.post_music (post_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.post_music'::regclass
      and contype = 'f'
      and confrelid = 'public.posts'::regclass
  ) then
    alter table public.post_music
      add constraint post_music_post_id_fkey
      foreign key (post_id)
      references public.posts(id)
      on delete cascade;
  end if;
end
$$;

alter table public.post_music enable row level security;

drop policy if exists "music follows post visibility"
  on public.post_music;
create policy "music follows post visibility"
  on public.post_music
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts
      where posts.id = post_music.post_id
        and public.can_view_post(posts)
    )
  );

drop policy if exists "post author manages music"
  on public.post_music;
create policy "post author manages music"
  on public.post_music
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.posts
      where posts.id = post_music.post_id
        and posts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.posts
      where posts.id = post_music.post_id
        and posts.user_id = auth.uid()
    )
  );
