-- PSFIT Community. Safe to re-run; no existing application table is removed.
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_path text,
  primary_goal text,
  experience_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists location text;
alter table public.profiles add colum n if not exists website text;
alter table public.profiles add column if not exists is_private boolean not null default false;
alter table public.profiles add column if not exists allow_comments boolean not null default true;
alter table public.profiles add column if not exists allow_workout_copying boolean not null default true;
alter table public.profiles add column if not exists sensitive_progress_photos boolean not null default true;
alter table public.profiles add column if not exists show_momentum_score boolean not null default true;
alter table public.profiles add column if not exists show_workout_stats boolean not null default true;
alter table public.profiles add column if not exists momentum_score integer;
alter table public.profiles add column if not exists followers_count integer not null default 0 check (followers_count >= 0);
alter table public.profiles add column if not exists following_count integer not null default 0 check (following_count >= 0);
alter table public.profiles add column if not exists posts_count integer not null default 0 check (posts_count >= 0);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_session_id uuid,
  post_type text not null check (post_type in ('workout','progress','photo','video','achievement','text')),
  caption text check (char_length(caption) <= 2200),
  workout_title text,
  visibility text not null default 'public' check (visibility in ('public','followers','private')),
  location text,
  allow_comments boolean not null default true,
  hide_like_count boolean not null default false,
  sensitive_content boolean not null default false,
  is_verified_workout boolean not null default false,
  workout_receipt jsonb,
  like_count integer not null default 0 check (like_count >= 0),
  comment_count integer not null default 0 check (comment_count >= 0),
  save_count integer not null default 0 check (save_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  media_type text not null check (media_type in ('image','video')),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','video/mp4','video/webm')),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_seconds numeric check (duration_seconds is null or duration_seconds between 0 and 30),
  position integer not null default 0 check (position between 0 and 5),
  alt_text text check (char_length(alt_text) <= 500),
  created_at timestamptz not null default now(),
  unique(post_id, position)
);
create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.post_comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  like_count integer not null default 0 check (like_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.comment_likes (
  comment_id uuid not null references public.post_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(comment_id,user_id)
);
create table if not exists public.saved_posts (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key(follower_id,following_id),
  check(follower_id <> following_id)
);
create table if not exists public.hashtags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null check (name = lower(name) and name ~ '^[a-z0-9_]{1,50}$'),
  posts_count integer not null default 0 check(posts_count >= 0),
  created_at timestamptz not null default now()
);
create table if not exists public.post_hashtags (
  post_id uuid not null references public.posts(id) on delete cascade,
  hashtag_id uuid not null references public.hashtags(id) on delete cascade,
  primary key(post_id,hashtag_id)
);
create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id,blocked_id),
  check(blocker_id <> blocked_id)
);
create table if not exists public.user_mutes (
  user_id uuid not null references auth.users(id) on delete cascade,
  muted_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,muted_user_id),
  check(user_id <> muted_user_id)
);
create table if not exists public.post_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  reason text not null check(reason in ('spam','harassment','nudity','dangerous_behavior','misinformation','hate_speech','impersonation','other')),
  details text check(char_length(details) <= 1000),
  status text not null default 'pending' check(status in ('pending','reviewed','resolved','dismissed')),
  created_at timestamptz not null default now(),
  unique(reporter_id,post_id)
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete cascade,
  type text not null check(type in ('new_follower','follow_request','follow_accepted','post_liked','comment_added','comment_replied','comment_liked','mentioned_post','mentioned_comment','workout_copied','challenge_invitation')),
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.post_comments(id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.workout_copies (
  id uuid primary key default gen_random_uuid(),
  source_post_id uuid references public.posts(id) on delete set null,
  source_workout_id uuid,
  source_user_id uuid references auth.users(id) on delete set null,
  copied_by_user_id uuid not null references auth.users(id) on delete cascade,
  new_workout_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unique(source_post_id,copied_by_user_id)
);

create index if not exists posts_cursor_idx on public.posts(created_at desc,id desc);
create index if not exists posts_user_cursor_idx on public.posts(user_id,created_at desc);
create index if not exists posts_public_cursor_idx on public.posts(created_at desc,id desc) where visibility='public';
create index if not exists comments_post_cursor_idx on public.post_comments(post_id,created_at desc,id desc);
create index if not exists notifications_recipient_idx on public.notifications(recipient_id,read_at,created_at desc);
create index if not exists follows_following_idx on public.follows(following_id,status);
create index if not exists follows_follower_idx on public.follows(follower_id,status);
create index if not exists profiles_username_trgm_idx on public.profiles using gin(username gin_trgm_ops);
create index if not exists profiles_name_trgm_idx on public.profiles using gin(full_name gin_trgm_ops);
create index if not exists posts_workout_title_trgm_idx on public.posts using gin(workout_title gin_trgm_ops);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at before update on public.posts for each row execute function public.set_updated_at();
drop trigger if exists comments_updated_at on public.post_comments;
create trigger comments_updated_at before update on public.post_comments for each row execute function public.set_updated_at();

create or replace function public.can_view_post(target public.posts) returns boolean
language sql stable security definer set search_path='' as $$
  select target.user_id=auth.uid() or (
    not exists(select 1 from public.user_blocks b where (b.blocker_id=auth.uid() and b.blocked_id=target.user_id) or (b.blocker_id=target.user_id and b.blocked_id=auth.uid()))
    and (target.visibility='public' or (target.visibility='followers' and exists(select 1 from public.follows f where f.follower_id=auth.uid() and f.following_id=target.user_id and f.status='accepted')))
  )
$$;

create or replace function public.prevent_nested_replies() returns trigger language plpgsql set search_path='' as $$
begin
 if new.parent_id is not null and exists(select 1 from public.post_comments where id=new.parent_id and parent_id is not null) then raise exception 'Replies may only be one level deep'; end if;
 if new.parent_id is not null and not exists(select 1 from public.post_comments where id=new.parent_id and post_id=new.post_id) then raise exception 'Parent comment belongs to another post'; end if;
 return new;
end $$;
drop trigger if exists comments_depth on public.post_comments;
create trigger comments_depth before insert or update on public.post_comments for each row execute function public.prevent_nested_replies();

create or replace function public.verify_workout_receipt() returns trigger language plpgsql set search_path='' as $$
declare valid boolean:=false;
begin
 if new.workout_session_id is null then new.is_verified_workout:=false; return new; end if;
 if to_regclass('public.workout_sessions') is not null then
   begin
     execute 'select exists(select 1 from public.workout_sessions where id=$1 and user_id=$2 and status=''completed'')'
       into valid using new.workout_session_id,new.user_id;
   exception when undefined_column then valid:=false;
   end;
 end if;
 new.is_verified_workout:=valid;
 if not valid then new.workout_receipt:=null; end if;
 return new;
end $$;
drop trigger if exists posts_verify_workout on public.posts;
create trigger posts_verify_workout before insert or update of workout_session_id,is_verified_workout,workout_receipt on public.posts for each row execute function public.verify_workout_receipt();

create or replace function public.sync_community_counts() returns trigger
language plpgsql security definer set search_path='' as $$
declare target_post uuid; target_user uuid;
begin
 if tg_table_name='post_likes' then target_post:=coalesce(new.post_id,old.post_id); update public.posts set like_count=(select count(*) from public.post_likes where post_id=target_post) where id=target_post;
 elsif tg_table_name='post_comments' then target_post:=coalesce(new.post_id,old.post_id); update public.posts set comment_count=(select count(*) from public.post_comments where post_id=target_post) where id=target_post;
 elsif tg_table_name='saved_posts' then target_post:=coalesce(new.post_id,old.post_id); update public.posts set save_count=(select count(*) from public.saved_posts where post_id=target_post) where id=target_post;
 elsif tg_table_name='posts' then target_user:=coalesce(new.user_id,old.user_id); update public.profiles set posts_count=(select count(*) from public.posts where user_id=target_user) where id=target_user;
 elsif tg_table_name='follows' then
   update public.profiles set following_count=(select count(*) from public.follows where follower_id=coalesce(new.follower_id,old.follower_id) and status='accepted') where id=coalesce(new.follower_id,old.follower_id);
   update public.profiles set followers_count=(select count(*) from public.follows where following_id=coalesce(new.following_id,old.following_id) and status='accepted') where id=coalesce(new.following_id,old.following_id);
 elsif tg_table_name='post_hashtags' then
   update public.hashtags set posts_count=(select count(*) from public.post_hashtags where hashtag_id=coalesce(new.hashtag_id,old.hashtag_id)) where id=coalesce(new.hashtag_id,old.hashtag_id);
 end if;
 if tg_op='DELETE' then return old; end if; return new;
end $$;
do $$ declare t text; begin foreach t in array array['post_likes','post_comments','saved_posts','posts','follows','post_hashtags'] loop
 execute format('drop trigger if exists %I_counts on public.%I',t,t);
 execute format('create trigger %I_counts after insert or update or delete on public.%I for each row execute function public.sync_community_counts()',t,t);
end loop; end $$;

create or replace function public.community_notification() returns trigger
language plpgsql security definer set search_path='' as $$
declare recipient uuid; kind text; p uuid; c uuid;
begin
 if tg_op='DELETE' then
   if tg_table_name='post_likes' then delete from public.notifications where actor_id=old.user_id and post_id=old.post_id and type='post_liked';
   elsif tg_table_name='comment_likes' then delete from public.notifications where actor_id=old.user_id and comment_id=old.comment_id and type='comment_liked';
   elsif tg_table_name='follows' then delete from public.notifications where actor_id=old.follower_id and recipient_id=old.following_id and type in ('new_follower','follow_request');
   end if; return old;
 end if;
 if tg_table_name='post_likes' then select user_id into recipient from public.posts where id=new.post_id; kind:='post_liked'; p:=new.post_id;
 elsif tg_table_name='post_comments' then select user_id into recipient from public.posts where id=new.post_id; kind:=case when new.parent_id is null then 'comment_added' else 'comment_replied' end; p:=new.post_id; c:=new.id;
 elsif tg_table_name='comment_likes' then select user_id into recipient from public.post_comments where id=new.comment_id; kind:='comment_liked'; c:=new.comment_id;
 elsif tg_table_name='follows' then recipient:=new.following_id; kind:=case when new.status='accepted' then 'new_follower' else 'follow_request' end;
 end if;
 if recipient is distinct from auth.uid() then insert into public.notifications(recipient_id,actor_id,type,post_id,comment_id) values(recipient,auth.uid(),kind,p,c); end if;
 return new;
end $$;
do $$ declare t text; begin foreach t in array array['post_likes','post_comments','comment_likes','follows'] loop
 execute format('drop trigger if exists %I_notifications on public.%I',t,t);
 execute format('create trigger %I_notifications after insert or delete on public.%I for each row execute function public.community_notification()',t,t);
end loop; end $$;

create or replace function public.toggle_post_like(p_post_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin if auth.uid() is null then raise exception 'Authentication required'; end if;
 if exists(select 1 from public.post_likes where post_id=p_post_id and user_id=auth.uid()) then delete from public.post_likes where post_id=p_post_id and user_id=auth.uid(); return false;
 else insert into public.post_likes(post_id,user_id) values(p_post_id,auth.uid()); return true; end if; end $$;
create or replace function public.toggle_comment_like(p_comment_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin if auth.uid() is null then raise exception 'Authentication required'; end if;
 if exists(select 1 from public.comment_likes where comment_id=p_comment_id and user_id=auth.uid()) then delete from public.comment_likes where comment_id=p_comment_id and user_id=auth.uid(); return false;
 else insert into public.comment_likes(comment_id,user_id) values(p_comment_id,auth.uid()); return true; end if; end $$;
create or replace function public.toggle_saved_post(p_post_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin if auth.uid() is null then raise exception 'Authentication required'; end if;
 if exists(select 1 from public.saved_posts where post_id=p_post_id and user_id=auth.uid()) then delete from public.saved_posts where post_id=p_post_id and user_id=auth.uid(); return false;
 else insert into public.saved_posts(post_id,user_id) values(p_post_id,auth.uid()); return true; end if; end $$;
create or replace function public.follow_user(p_user_id uuid) returns text language plpgsql security definer set search_path='' as $$
declare result text; begin
 if auth.uid() is null or p_user_id=auth.uid() then raise exception 'Invalid follow'; end if;
 if exists(select 1 from public.user_blocks where (blocker_id=auth.uid() and blocked_id=p_user_id) or (blocker_id=p_user_id and blocked_id=auth.uid())) then raise exception 'Relationship unavailable'; end if;
 select case when is_private then 'pending' else 'accepted' end into result from public.profiles where id=p_user_id;
 insert into public.follows(follower_id,following_id,status,accepted_at) values(auth.uid(),p_user_id,result,case when result='accepted' then now() end) on conflict do nothing; return result; end $$;
create or replace function public.accept_follow_request(p_follower_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 update public.follows set status='accepted',accepted_at=now() where follower_id=p_follower_id and following_id=auth.uid() and status='pending';
 if found then insert into public.notifications(recipient_id,actor_id,type) values(p_follower_id,auth.uid(),'follow_accepted'); end if;
end $$;
create or replace function public.reject_follow_request(p_follower_id uuid) returns void language sql security definer set search_path='' as $$
 delete from public.follows where follower_id=p_follower_id and following_id=auth.uid() and status='pending' $$;
create or replace function public.remove_follower(p_follower_id uuid) returns void language sql security definer set search_path='' as $$
 delete from public.follows where follower_id=p_follower_id and following_id=auth.uid() $$;
create or replace function public.copy_shared_workout(p_post_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare source public.posts; copied uuid:=gen_random_uuid(); begin
 select * into source from public.posts where id=p_post_id and is_verified_workout and public.can_view_post(posts);
 if source.id is null or source.user_id=auth.uid() then raise exception 'Workout unavailable'; end if;
 if not coalesce((select allow_workout_copying from public.profiles where id=source.user_id),true) then raise exception 'Copying disabled'; end if;
 insert into public.workout_copies(source_post_id,source_workout_id,source_user_id,copied_by_user_id,new_workout_id) values(source.id,source.workout_session_id,source.user_id,auth.uid(),copied);
 insert into public.notifications(recipient_id,actor_id,type,post_id) values(source.user_id,auth.uid(),'workout_copied',source.id);
 return copied; end $$;
create or replace function public.mark_notifications_read() returns integer language plpgsql security definer set search_path='' as $$
declare affected integer; begin update public.notifications set read_at=now() where recipient_id=auth.uid() and read_at is null; get diagnostics affected=row_count; return affected; end $$;

revoke all on function public.toggle_post_like(uuid),public.toggle_comment_like(uuid),public.toggle_saved_post(uuid),public.follow_user(uuid),public.accept_follow_request(uuid),public.reject_follow_request(uuid),public.remove_follower(uuid),public.copy_shared_workout(uuid),public.mark_notifications_read() from public;
grant execute on function public.toggle_post_like(uuid),public.toggle_comment_like(uuid),public.toggle_saved_post(uuid),public.follow_user(uuid),public.accept_follow_request(uuid),public.reject_follow_request(uuid),public.remove_follower(uuid),public.copy_shared_workout(uuid),public.mark_notifications_read() to authenticated;

do $$ declare t text; begin foreach t in array array['profiles','posts','post_media','post_likes','post_comments','comment_likes','saved_posts','follows','hashtags','post_hashtags','user_blocks','user_mutes','post_reports','notifications','workout_copies'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;
create policy "profiles visible without blocks" on public.profiles for select to authenticated using(not exists(select 1 from public.user_blocks b where (b.blocker_id=auth.uid() and b.blocked_id=id) or (b.blocker_id=id and b.blocked_id=auth.uid())));
create policy "own profile insert" on public.profiles for insert to authenticated with check(id=auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy "visible posts" on public.posts for select to authenticated using(public.can_view_post(posts));
create policy "own posts insert" on public.posts for insert to authenticated with check(user_id=auth.uid());
create policy "own posts update" on public.posts for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own posts delete" on public.posts for delete to authenticated using(user_id=auth.uid());
create policy "visible post media" on public.post_media for select to authenticated using(exists(select 1 from public.posts p where p.id=post_id and public.can_view_post(p)));
create policy "own post media write" on public.post_media for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from public.posts p where p.id=post_id and p.user_id=auth.uid()));
create policy "visible post likes" on public.post_likes for select to authenticated using(exists(select 1 from public.posts p where p.id=post_id and public.can_view_post(p)));
create policy "own likes write" on public.post_likes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from public.posts p where p.id=post_id and public.can_view_post(p)));
create policy "visible comments" on public.post_comments for select to authenticated using(exists(select 1 from public.posts p where p.id=post_id and public.can_view_post(p)));
create policy "own comments insert" on public.post_comments for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.posts p where p.id=post_id and p.allow_comments and public.can_view_post(p)));
create policy "own comments change" on public.post_comments for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own comments delete" on public.post_comments for delete to authenticated using(user_id=auth.uid());
create policy "comment likes visible" on public.comment_likes for select to authenticated using(exists(select 1 from public.post_comments c join public.posts p on p.id=c.post_id where c.id=comment_id and public.can_view_post(p)));
create policy "own comment likes" on public.comment_likes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own saves" on public.saved_posts for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "involved follows visible" on public.follows for select to authenticated using(follower_id=auth.uid() or following_id=auth.uid() or status='accepted');
create policy "own follows insert" on public.follows for insert to authenticated with check(follower_id=auth.uid());
create policy "involved follows delete" on public.follows for delete to authenticated using(follower_id=auth.uid() or following_id=auth.uid());
create policy "hashtags visible" on public.hashtags for select to authenticated using(posts_count >= 0);
create policy "authenticated hashtag creation" on public.hashtags for insert to authenticated with check(name=lower(name) and name ~ '^[a-z0-9_]{1,50}$');
create policy "post hashtags visible" on public.post_hashtags for select to authenticated using(exists(select 1 from public.posts p where p.id=post_id and public.can_view_post(p)));
create policy "own post hashtags write" on public.post_hashtags for all to authenticated using(exists(select 1 from public.posts p where p.id=post_id and p.user_id=auth.uid())) with check(exists(select 1 from public.posts p where p.id=post_id and p.user_id=auth.uid()));
create policy "own blocks" on public.user_blocks for all to authenticated using(blocker_id=auth.uid()) with check(blocker_id=auth.uid());
create policy "own mutes" on public.user_mutes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own reports" on public.post_reports for select to authenticated using(reporter_id=auth.uid());
create policy "own report insert" on public.post_reports for insert to authenticated with check(reporter_id=auth.uid() and status='pending');
create policy "own notifications" on public.notifications for select to authenticated using(recipient_id=auth.uid());
create policy "own notification update" on public.notifications for update to authenticated using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());
create policy "own workout copies" on public.workout_copies for select to authenticated using(copied_by_user_id=auth.uid() or source_user_id=auth.uid());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('community-media','community-media',false,26214400,array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "community media own uploads" on storage.objects for insert to authenticated with check(bucket_id='community-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "community media own changes" on storage.objects for update to authenticated using(bucket_id='community-media' and owner_id=auth.uid()::text) with check(bucket_id='community-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "community media own deletes" on storage.objects for delete to authenticated using(bucket_id='community-media' and owner_id=auth.uid()::text);

do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then alter publication supabase_realtime add table public.notifications; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='post_comments') then alter publication supabase_realtime add table public.post_comments; end if;
end $$;
