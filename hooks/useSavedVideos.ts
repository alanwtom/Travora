import { getSavedVideos } from '@/services/saves';
import { VideoWithProfile } from '@/types/database';
import { useCallback, useEffect, useState } from 'react';

export function useSavedVideos(userId: string) {
  const [videos, setVideos] = useState<VideoWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSavedVideos(userId);
      setVideos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchVideos();
    }
  }, [userId, fetchVideos]);

  return { videos, isLoading, error, refetch: fetchVideos };
}
