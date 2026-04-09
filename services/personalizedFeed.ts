import { supabase } from "@/lib/supabase";

export interface VideoItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  caption: string | null;
  video_url: string;
  thumbnail_url: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  media_type: "video" | "image";
  profile_username: string | null;
  profile_avatar_url: string | null;
  tags: string[];
  locations: string[];
  score: number;
}

export type PersonalizedFeedVideo = Omit<
  VideoItem,
  "profile_username" | "profile_avatar_url"
> & {
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  like_count: number;
  comment_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
  user_rating?: number;
  average_rating?: number;
  review_count?: number;
};

/** Map a joined video row (e.g. from `getVideosByIds`) to the feed/itinerary card shape. */
export function videoWithProfileToPersonalizedFeedVideo(v: {
  id: string;
  user_id: string;
  title?: string | null;
  description?: string | null;
  caption?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  view_count?: number | null;
  created_at: string;
  updated_at: string;
  media_type?: string | null;
  tags?: unknown;
  score?: number | null;
  profiles?: {
    username?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
  like_count?: number | null;
  comment_count?: number | null;
  is_liked?: boolean;
  is_saved?: boolean;
}): PersonalizedFeedVideo {
  const row = v;
  const p = row.profiles ?? {};
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title ?? "",
    description: row.description ?? null,
    caption: row.caption ?? null,
    video_url: row.video_url ?? "",
    thumbnail_url: row.thumbnail_url ?? null,
    location: row.location ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    view_count: row.view_count ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    media_type: (row.media_type ?? "video") as PersonalizedFeedVideo["media_type"],
    tags: Array.isArray(row.tags) ? row.tags : [],
    score: typeof row.score === "number" ? row.score : 0,
    profiles: {
      username: p.username ?? null,
      display_name: p.display_name ?? p.username ?? null,
      avatar_url: p.avatar_url ?? null,
    },
    like_count: row.like_count ?? 0,
    comment_count: row.comment_count ?? 0,
    is_liked: row.is_liked,
    is_saved: row.is_saved,
  };
}

/** Satisfies travel hooks that expect a joined video row (IDs, location, coords). */
export function personalizedFeedVideoToVideoWithProfile(v: PersonalizedFeedVideo) {
  return v as any;
}

export async function getPersonalizedFeed(
  userId: string,
  limit = 10,
  mediaType: "video" | "image" | "both" = "both",
) {
  // @ts-ignore – Supabase types don't know about get_personalized_feed yet
  const { data, error } = await supabase.rpc("get_personalized_feed", {
    p_user_id: userId,
    p_limit: limit,
    p_media_type: mediaType,
  });
  return { data: data as VideoItem[] | null, error };
}
