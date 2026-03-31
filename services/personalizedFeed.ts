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
