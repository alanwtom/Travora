import { supabase } from '@/lib/supabase';
import { VideoWithProfile } from '@/types/database';
import { useCallback, useEffect, useState } from 'react';

export function useLikedVideos(userId: string | undefined) {
  const [videos, setVideos] = useState<VideoWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    if (!userId) {
      setVideos([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch videos that the user has liked
      const { data, error: fetchError } = (
        await supabase
          .from('likes')
          .select(`
            video_id,
            videos:video_id (
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
              profiles:user_id (
                id,
                username,
                display_name,
                avatar_url
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
      ) as any;

      if (fetchError) throw fetchError;

      // Transform the data to match VideoWithProfile interface
      const transformedVideos: VideoWithProfile[] = data
        ?.map((like: any) => ({
          ...like.videos,
          is_liked: true,
          is_saved: false,
        }))
        .filter((v: any) => v !== null) || [];

      setVideos(transformedVideos);
    } catch (err) {
      console.error('Error fetching liked videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch liked videos');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return { videos, isLoading, error, refetch: fetchVideos };
}
