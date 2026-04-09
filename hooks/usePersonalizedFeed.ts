import { useAuth } from "@/providers/AuthProvider";
import {
    getPersonalizedFeed,
    PersonalizedFeedVideo,
    VideoItem,
} from "@/services/personalizedFeed";
import { useCallback, useEffect, useState } from "react";

export function usePersonalizedFeed(
  mediaType: "video" | "image" | "both" = "both",
) {
  const { user } = useAuth();
  const [videos, setVideos] = useState<PersonalizedFeedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const loadVideos = useCallback(
    async (refresh = false) => {
      if (!user) return;
      if (isLoading && !refresh) return;
      setIsLoading(true);
      if (refresh) setIsRefreshing(true);
      setError(null);

      try {
        const { data, error: err } = await getPersonalizedFeed(
          user.id,
          limit,
          mediaType,
        );
        if (err) throw err;
        const rawVideos = (data as VideoItem[]) || [];

        const mapped: PersonalizedFeedVideo[] = rawVideos.map((v) => ({
          id: v.id,
          user_id: v.user_id,
          title: v.title,
          description: v.description,
          caption: v.caption,
          video_url: v.video_url,
          thumbnail_url: v.thumbnail_url,
          location: v.location,
          latitude: v.latitude,
          longitude: v.longitude,
          view_count: v.view_count,
          created_at: v.created_at,
          updated_at: v.updated_at,
          media_type: v.media_type,
          score: v.score,
          tags: v.tags ?? [],
          locations: v.locations ?? [],
          profiles: {
            username: v.profile_username,
            display_name: v.profile_username,
            avatar_url: v.profile_avatar_url,
          },
          like_count: 0,
          comment_count: 0,
        }));

        if (refresh) {
          setVideos(mapped);
        } else {
          setVideos((prev) => [...prev, ...mapped]);
        }
        setHasMore(mapped.length === limit);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user, mediaType, isLoading],
  );

  const refresh = useCallback(() => loadVideos(true), [loadVideos]);
  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;
    loadVideos(false);
  }, [hasMore, isLoading, loadVideos]);

  useEffect(() => {
    refresh();
  }, [mediaType]);

  return { videos, isLoading, isRefreshing, error, hasMore, refresh, loadMore };
}
