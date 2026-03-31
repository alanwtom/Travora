-- Personalized feed with tag-based scoring

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
    (like_tag_matches * 2 - dislike_tag_matches)::double precision as score
  from videos_with_tags
  where
    (p_media_type = 'both' or p_media_type = 'video')
  order by
    score desc,
    created_at desc
  limit greatest(coalesce(p_limit, 10), 1);
$$;

