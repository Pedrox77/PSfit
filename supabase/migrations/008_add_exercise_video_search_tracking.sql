  alter table public.exercise_catalog
    add column if not exists video_search_status text,
    add column if not exists video_search_attempts integer not null default 0,
    add column if not exists video_last_searched_at timestamptz,
    add column if not exists video_search_score numeric,
    add column if not exists video_search_query text,
    add column if not exists video_search_title text,
    add column if not exists video_search_channel text;

  alter table public.exercise_catalog
    drop constraint if exists exercise_catalog_video_search_status_check;

  alter table public.exercise_catalog
    add constraint exercise_catalog_video_search_status_check
    check (
      video_search_status is null
      or video_search_status in ('pending', 'connected', 'no_match', 'review', 'error')
    );

  update public.exercise_catalog
  set video_search_status = 'connected'
  where video_url is not null
    and video_search_status is distinct from 'connected';

  -- These IDs are the rejected items recorded by the legacy YouTube report.
  -- Recording the historical attempt prevents them from consuming quota again.
  update public.exercise_catalog
  set
    video_search_status = 'no_match',
    video_search_attempts = greatest(video_search_attempts, 1)
  where video_url is null
    and video_search_status is null
    and id in (
      '81eff828-8174-4fba-a509-fe4e44a80dbf',
      '85abc3a2-5b48-48c4-8bcc-103b523082cb',
      'ba87b8da-bdce-4a33-8984-1c02007cf213',
      'dc757cf3-28ba-4ccb-86a8-a4995fc786f3',
      'fb4a50a0-5096-484b-aa47-3626e9fc15ab',
      '2366f50c-9b17-4be3-8dd0-6048a28e8097',
      '713dcf42-48f6-4b3c-9ad0-5281854ab389',
      'ac43b698-d56b-43dd-af02-03f930c923e2',
      '275322f5-a740-4266-af6e-ff3f1798ad2b',
      '442f822f-0bc6-4afd-9afb-37d4eee4be4f',
      '2e579e38-dd29-4a55-9c25-ed843adfeffb',
      '8105f70b-a805-46c9-a035-908e481b503a',
      '790ebfca-b43c-49e0-af76-854c2ff5baa0',
      '11c7bf60-fa06-4569-b0cd-b229c03dd92b',
      '235e3e4a-d90d-4e14-b300-30708073dd57',
      'be4e2146-5439-4789-83eb-deb41b75ba77',
      '9d775d64-7760-4bca-a256-62cd9a8a42c5',
      'c9c98a80-cdcb-43fd-a5e4-fcdf9749d1d0',
      '72dd8310-7610-4c8b-85b2-9390043809ed',
      '4c5734c1-09ff-4103-b68c-f616b3242ea8',
      '4439f46a-6ed1-404d-ab54-3653a77be0d2',
      'ae5430e5-e5f6-4361-b7f7-3d985d721562',
      '2388dea0-6f91-4da0-8690-f059a666651b',
      'e1b18d03-f444-4863-b813-e57cedcf2b3d',
      '59b98d8a-36cf-4eb5-a97c-72cfa2ebe9d0',
      '25a25e28-0985-4223-a73f-bcf2544c73fc',
      '7ba56ea5-4f59-40a8-b84e-2352e6e8456a',
      'c8ca958a-667c-4f41-b472-b02f6e326214',
      'b5d81cfe-6156-4458-a1a7-19032f866a27',
      'b063071c-1c65-4229-9652-ad2cda742b1e'
    );

  update public.exercise_catalog
  set video_search_status = 'pending'
  where video_url is null
    and video_search_status is null
    and video_search_attempts = 0;

  create index if not exists exercise_catalog_video_search_queue_idx
    on public.exercise_catalog (is_active, video_search_status, video_url);
