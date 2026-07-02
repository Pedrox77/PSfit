-- Incremental PSFIT social feed: Moments, Highlights, richer profiles and Spotify metadata.
alter table public.profiles add column if not exists pronouns text;
alter table public.profiles add column if not exists profile_category text;
alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists profile_song_url text;
alter table public.profiles add column if not exists profile_song_provider text;
alter table public.profiles add column if not exists profile_song_title text;
alter table public.profiles add column if not exists profile_song_artist text;
alter table public.profiles add column if not exists profile_song_artwork_url text;
alter table public.profiles add column if not exists close_friends_count integer not null default 0 check(close_friends_count >= 0);

alter table public.posts add column if not exists daily_context text;
alter table public.posts add column if not exists meal_id uuid;
alter table public.posts add column if not exists tagged_users_count integer not null default 0 check(tagged_users_count >= 0);
alter table public.posts add column if not exists music_attached boolean not null default false;
alter table public.post_media drop constraint if exists post_media_position_check;
alter table public.post_media add constraint post_media_position_check check(position between 0 and 9);
alter table public.post_media drop constraint if exists post_media_duration_seconds_check;
alter table public.post_media add constraint post_media_duration_seconds_check check(duration_seconds is null or duration_seconds between 0 and 60);

alter table public.posts drop constraint if exists posts_post_type_check;
alter table public.posts add constraint posts_post_type_check check(post_type in (
  'daily_life','workout','progress','meal','photo','carousel','video',
  'achievement','text','verified_workout'
));
alter table public.profiles drop constraint if exists profiles_category_check;
alter table public.profiles add constraint profiles_category_check check(
  profile_category is null or profile_category in (
    'athlete','fitness_creator','personal_trainer','runner','cyclist',
    'bodybuilder','nutrition_creator','lifestyle','beginner'
  )
);
alter table public.profiles drop constraint if exists profiles_username_format_check;
alter table public.profiles add constraint profiles_username_format_check check(
  username is null or (
    char_length(username) between 3 and 30
    and username ~ '^[a-zA-Z0-9._]+$'
    and lower(username) not in ('admin','support','psfit','settings')
  )
);
create unique index if not exists profiles_username_lower_unique on public.profiles(lower(username)) where username is not null;

create table if not exists public.post_music (
  id uuid primary key default gen_random_uuid(),
  post_id uuid unique not null references public.posts(id) on delete cascade,
  provider text not null default 'spotify' check(provider='spotify'),
  spotify_url text not null check(spotify_url ~ '^https://(open\.spotify\.com|spotify\.link)/'),
  spotify_uri text,
  spotify_id text,
  content_type text check(content_type in ('track','album','playlist','episode')),
  title text,
  artist_name text,
  album_name text,
  artwork_url text check(artwork_url is null or artwork_url ~ '^https://'),
  duration_ms integer check(duration_ms is null or duration_ms >= 0),
  embed_url text check(embed_url is null or embed_url ~ '^https://open\.spotify\.com/embed/'),
  created_at timestamptz not null default now()
);
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_path text,
  media_type text not null check(media_type in ('image','video','text','workout','meal','progress')),
  text_content text check(char_length(text_content) <= 500),
  background_style jsonb not null default '{}'::jsonb,
  caption text check(char_length(caption) <= 500),
  location text,
  visibility text not null default 'followers' check(visibility in ('public','followers','close_friends')),
  allow_replies boolean not null default true,
  music_url text check(music_url is null or music_url ~ '^https://(open\.spotify\.com|spotify\.link)/'),
  music_provider text check(music_provider is null or music_provider='spotify'),
  music_title text,
  music_artist text,
  music_artwork_url text,
  workout_session_id uuid,
  expires_at timestamptz not null default now() + interval '24 hours',
  created_at timestamptz not null default now(),
  check(media_path is not null or text_content is not null or workout_session_id is not null)
);
create table if not exists public.story_views (
  story_id uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key(story_id,viewer_id)
);
create table if not exists public.story_likes (
  story_id uuid not null references public.stories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(story_id,user_id)
);
create table if not exists public.story_replies (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check(char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  check(sender_id <> recipient_id)
);
create table if not exists public.close_friends (
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,friend_id),
  check(user_id <> friend_id)
);
create table if not exists public.story_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check(char_length(name) between 1 and 30),
  cover_path text,
  position integer not null default 0 check(position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.story_highlight_items (
  highlight_id uuid not null references public.story_highlights(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  position integer not null default 0 check(position >= 0),
  added_at timestamptz not null default now(),
  primary key(highlight_id,story_id)
);
create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tagged_user_id uuid not null references auth.users(id) on delete cascade,
  tagged_by_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id,tagged_user_id),
  check(tagged_user_id <> tagged_by_user_id)
);

create index if not exists post_music_post_idx on public.post_music(post_id);
create index if not exists post_music_search_idx on public.post_music using gin((coalesce(title,'')||' '||coalesce(artist_name,'')) gin_trgm_ops);
create index if not exists stories_user_expiry_idx on public.stories(user_id,expires_at desc);
create index if not exists stories_expiry_idx on public.stories(expires_at);
create index if not exists stories_feed_idx on public.stories(created_at desc,id desc) where expires_at > created_at;
create index if not exists story_views_story_idx on public.story_views(story_id,viewed_at desc);
create index if not exists story_views_viewer_idx on public.story_views(viewer_id,viewed_at desc);
create index if not exists highlights_user_position_idx on public.story_highlights(user_id,position);
create index if not exists posts_caption_search_idx on public.posts using gin(caption gin_trgm_ops);
create index if not exists profiles_category_idx on public.profiles(profile_category);

drop trigger if exists story_highlights_updated_at on public.story_highlights;
create trigger story_highlights_updated_at before update on public.story_highlights
for each row execute function public.set_updated_at();

create or replace function public.can_view_story(target public.stories) returns boolean
language sql stable security definer set search_path='' as $$
  select target.user_id=auth.uid() or (
    target.expires_at > now()
    and not exists(select 1 from public.user_blocks b where
      (b.blocker_id=auth.uid() and b.blocked_id=target.user_id)
      or (b.blocker_id=target.user_id and b.blocked_id=auth.uid()))
    and (
      target.visibility='public'
      or (target.visibility='followers' and exists(select 1 from public.follows f where f.follower_id=auth.uid() and f.following_id=target.user_id and f.status='accepted'))
      or (target.visibility='close_friends' and exists(select 1 from public.close_friends c where c.user_id=target.user_id and c.friend_id=auth.uid()))
    )
  )
$$;

create or replace function public.validate_close_friend() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.user_id<>auth.uid() or new.user_id=new.friend_id then raise exception 'Invalid close friend'; end if;
 if exists(select 1 from public.user_blocks where
   (blocker_id=new.user_id and blocked_id=new.friend_id) or (blocker_id=new.friend_id and blocked_id=new.user_id))
 then raise exception 'Blocked relationship'; end if;
 return new;
end $$;
drop trigger if exists close_friends_validate on public.close_friends;
create trigger close_friends_validate before insert or update on public.close_friends
for each row execute function public.validate_close_friend();

create or replace function public.sync_social_counts() returns trigger
language plpgsql security definer set search_path='' as $$
declare owner uuid; target_post uuid;
begin
 if tg_table_name='close_friends' then
   owner:=case when tg_op='DELETE' then old.user_id else new.user_id end;
   update public.profiles set close_friends_count=(select count(*) from public.close_friends where user_id=owner) where id=owner;
 elsif tg_table_name='post_tags' then
   target_post:=case when tg_op='DELETE' then old.post_id else new.post_id end;
   update public.posts set tagged_users_count=(select count(*) from public.post_tags where post_id=target_post) where id=target_post;
 elsif tg_table_name='post_music' then
   target_post:=case when tg_op='DELETE' then old.post_id else new.post_id end;
   update public.posts set music_attached=exists(select 1 from public.post_music where post_id=target_post) where id=target_post;
 end if;
 if tg_op='DELETE' then return old; end if; return new;
end $$;
do $$ declare t text; begin foreach t in array array['close_friends','post_tags','post_music'] loop
 execute format('drop trigger if exists %I_social_counts on public.%I',t,t);
 execute format('create trigger %I_social_counts after insert or update or delete on public.%I for each row execute function public.sync_social_counts()',t,t);
end loop; end $$;

create or replace function public.validate_post_tag() returns trigger
language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from public.posts where id=new.post_id and user_id=auth.uid()) or new.tagged_by_user_id<>auth.uid() then raise exception 'Only the author can tag'; end if;
 if exists(select 1 from public.user_blocks where
   (blocker_id=auth.uid() and blocked_id=new.tagged_user_id) or (blocker_id=new.tagged_user_id and blocked_id=auth.uid()))
 then raise exception 'User cannot be tagged'; end if;
 return new;
end $$;
drop trigger if exists post_tags_validate on public.post_tags;
create trigger post_tags_validate before insert or update on public.post_tags
for each row execute function public.validate_post_tag();

alter table public.post_music enable row level security;
alter table public.stories enable row level security;
alter table public.story_views enable row level security;
alter table public.story_likes enable row level security;
alter table public.story_replies enable row level security;
alter table public.close_friends enable row level security;
alter table public.story_highlights enable row level security;
alter table public.story_highlight_items enable row level security;
alter table public.post_tags enable row level security;

create policy "music follows post visibility" on public.post_music for select to authenticated
using(exists(select 1 from public.posts p where p.id=post_id and public.can_view_post(p)));
create policy "post author manages music" on public.post_music for all to authenticated
using(exists(select 1 from public.posts p where p.id=post_id and p.user_id=auth.uid()))
with check(exists(select 1 from public.posts p where p.id=post_id and p.user_id=auth.uid()));

create policy "visible active stories" on public.stories for select to authenticated using(public.can_view_story(stories));
create policy "author inserts stories" on public.stories for insert to authenticated with check(user_id=auth.uid() and expires_at<=now()+interval '24 hours 5 minutes');
create policy "author updates stories" on public.stories for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "author deletes stories" on public.stories for delete to authenticated using(user_id=auth.uid());

create policy "story views visible to viewer and author" on public.story_views for select to authenticated
using(viewer_id=auth.uid() or exists(select 1 from public.stories s where s.id=story_id and s.user_id=auth.uid()));
create policy "viewer records own story view" on public.story_views for insert to authenticated
with check(viewer_id=auth.uid() and exists(select 1 from public.stories s where s.id=story_id and public.can_view_story(s)));
create policy "visible story likes" on public.story_likes for select to authenticated
using(user_id=auth.uid() or exists(select 1 from public.stories s where s.id=story_id and s.user_id=auth.uid()));
create policy "own story likes" on public.story_likes for all to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from public.stories s where s.id=story_id and public.can_view_story(s)));
create policy "involved story replies" on public.story_replies for select to authenticated
using(sender_id=auth.uid() or recipient_id=auth.uid());
create policy "sender creates story reply" on public.story_replies for insert to authenticated
with check(sender_id=auth.uid() and exists(select 1 from public.stories s where s.id=story_id and s.user_id=recipient_id and s.allow_replies and public.can_view_story(s)));

create policy "owner sees close friends" on public.close_friends for select to authenticated using(user_id=auth.uid());
create policy "owner manages close friends" on public.close_friends for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "visible highlights" on public.story_highlights for select to authenticated
using(user_id=auth.uid() or exists(select 1 from public.profiles p where p.id=user_id and not p.is_private) or exists(select 1 from public.follows f where f.following_id=user_id and f.follower_id=auth.uid() and f.status='accepted'));
create policy "owner manages highlights" on public.story_highlights for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "visible highlight items" on public.story_highlight_items for select to authenticated
using(exists(select 1 from public.story_highlights h where h.id=highlight_id));
create policy "owner manages highlight items" on public.story_highlight_items for all to authenticated
using(exists(select 1 from public.story_highlights h where h.id=highlight_id and h.user_id=auth.uid()))
with check(exists(select 1 from public.story_highlights h where h.id=highlight_id and h.user_id=auth.uid()));
create policy "visible post tags" on public.post_tags for select to authenticated
using(exists(select 1 from public.posts p where p.id=post_id and public.can_view_post(p)));
create policy "author inserts post tags" on public.post_tags for insert to authenticated
with check(tagged_by_user_id=auth.uid() and exists(select 1 from public.posts p where p.id=post_id and p.user_id=auth.uid()));
create policy "author or tagged user removes tag" on public.post_tags for delete to authenticated
using(tagged_by_user_id=auth.uid() or tagged_user_id=auth.uid());

-- Storage ownership remains enforced by 002. These path checks narrow each media family.
create policy "community social uploads" on storage.objects for insert to authenticated
with check(
  bucket_id='community-media'
  and (storage.foldername(name))[1]=auth.uid()::text
  and (storage.foldername(name))[2] in ('posts','stories','highlights','profile')
);
update storage.buckets set file_size_limit=41943040 where id='community-media';

do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='stories')
 then alter publication supabase_realtime add table public.stories; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='story_replies')
 then alter publication supabase_realtime add table public.story_replies; end if;
end $$;
