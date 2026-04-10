-- Multi-location tagging for videos
-- Mirrors the tags / video_tags pattern

-- 1. locations table
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

-- 2. video_locations junction table
create table if not exists public.video_locations (
  video_id uuid not null references public.videos(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  primary key (video_id, location_id)
);

-- 3. Indexes for lookups
create index if not exists idx_locations_name on public.locations(name);
create index if not exists idx_video_locations_video on public.video_locations(video_id);
create index if not exists idx_video_locations_location on public.video_locations(location_id);

-- 4. RLS
alter table public.locations enable row level security;
alter table public.video_locations enable row level security;

create policy "Locations are readable by all"
  on public.locations for select
  using (true);

create policy "Authenticated users can insert locations"
  on public.locations for insert
  with check (auth.role() = 'authenticated');

create policy "Video locations are readable by all"
  on public.video_locations for select
  using (true);

create policy "Authenticated users can insert video locations"
  on public.video_locations for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete their own video locations"
  on public.video_locations for delete
  using (auth.uid() in (
    select user_id from public.videos where id = video_id
  ));

-- 5. Updated get_personalized_feed to include locations
create or replace function public.get_personalized_feed(
  p_user_id uuid,
  p_limit integer default 10,
  p_media_type text default 'both'
)
returns table (
  id uuid,
  user_id uuid,
  title text,
  description text,
  caption text,
  video_url text,
  thumbnail_url text,
  location text,
  latitude double precision,
  longitude double precision,
  view_count integer,
  created_at timestamptz,
  updated_at timestamptz,
  media_type text,
  profile_username text,
  profile_avatar_url text,
  tags text[],
  locations text[],
  score double precision
)
language sql
stable
as $$
  with liked_tags as (
    select distinct t.name
    from public.swipes s
    join public.video_tags vt on vt.video_id = s.video_id
    join public.tags t on t.id = vt.tag_id
    where s.user_id = p_user_id
      and s.swipe_type = 'like'
  ),
  disliked_tags as (
    select distinct t.name
    from public.swipes s
    join public.video_tags vt on vt.video_id = s.video_id
    join public.tags t on t.id = vt.tag_id
    where s.user_id = p_user_id
      and s.swipe_type = 'dislike'
  ),
  videos_with_tags as (
    select
      v.id,
      v.user_id,
      v.title,
      v.description,
      v.caption,
      v.video_url,
      v.thumbnail_url,
      v.location,
      v.latitude,
      v.longitude,
      v.view_count,
      v.created_at,
      v.updated_at,
      'video'::text as media_type,
      p.username as profile_username,
      p.avatar_url as profile_avatar_url,
      array_remove(array_agg(distinct t.name), null) as tags,
      count(distinct lt.name) as like_tag_matches,
      count(distinct dt.name) as dislike_tag_matches
    from public.videos v
    left join public.profiles p on p.id = v.user_id
    left join public.video_tags vt on vt.video_id = v.id
    left join public.tags t on t.id = vt.tag_id
    left join liked_tags lt on lt.name = t.name
    left join disliked_tags dt on dt.name = t.name
    group by
      v.id,
      v.user_id,
      v.title,
      v.description,
      v.caption,
      v.video_url,
      v.thumbnail_url,
      v.location,
      v.latitude,
      v.longitude,
      v.view_count,
      v.created_at,
      v.updated_at,
      p.username,
      p.avatar_url
  ),
  videos_with_locations as (
    select
      vwt.*,
      array_remove(array_agg(distinct loc.name), null) as locations
    from videos_with_tags vwt
    left join public.video_locations vl on vl.video_id = vwt.id
    left join public.locations loc on loc.id = vl.location_id
    group by
      vwt.id,
      vwt.user_id,
      vwt.title,
      vwt.description,
      vwt.caption,
      vwt.video_url,
      vwt.thumbnail_url,
      vwt.location,
      vwt.latitude,
      vwt.longitude,
      vwt.view_count,
      vwt.created_at,
      vwt.updated_at,
      vwt.media_type,
      vwt.profile_username,
      vwt.profile_avatar_url,
      vwt.tags,
      vwt.like_tag_matches,
      vwt.dislike_tag_matches
  )
  select
    id,
    user_id,
    title,
    description,
    caption,
    video_url,
    thumbnail_url,
    location,
    latitude,
    longitude,
    view_count,
    created_at,
    updated_at,
    media_type,
    profile_username,
    profile_avatar_url,
    coalesce(tags, array[]::text[]) as tags,
    coalesce(locations, array[]::text[]) as locations,
    (like_tag_matches * 2 - dislike_tag_matches)::double precision as score
  from videos_with_locations
  where
    (p_media_type = 'both' or p_media_type = 'video')
  order by
    score desc,
    created_at desc
  limit greatest(coalesce(p_limit, 10), 1);
$$;
