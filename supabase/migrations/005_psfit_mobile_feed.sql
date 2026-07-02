-- Mobile feed presentation preference. Incremental; no existing data is removed.
alter table public.posts add column if not exists training_visual_style text not null default 'full_carousel';
alter table public.posts drop constraint if exists posts_training_visual_style_check;
alter table public.posts add constraint posts_training_visual_style_check check(training_visual_style in (
  'photo_only','photo_stats','photo_body_map','full_carousel','stats_only'
));
