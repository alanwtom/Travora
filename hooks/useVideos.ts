import { useEffect, useState, useCallback } from 'react';
import { VideoWithProfile } from '@/types/database';
import { getFeedVideos, getUserVideos, searchVideos } from '@/services/videos';
import { useAuth } from '@/providers/AuthProvider';

export function useFeedVideos() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async (pageNum: number = 0, refresh: boolean = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const data = await getFeedVideos(pageNum, user?.id);

      if (refresh || pageNum === 0) {
        setVideos(data);
      } else {
        setVideos((prev) => [...prev, ...data]);
      }

      setHasMore(data.length > 0);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchVideos(0);
  }, [fetchVideos]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchVideos(page + 1);
    }
  };

  const refresh = () => {
    fetchVideos(0, true);
  };

  return {
    videos,
    isLoading,
    isRefreshing,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

export function useUserVideos(userId: string) {
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserVideos(userId);
      setVideos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return { videos, isLoading, error, refetch: fetchVideos };
}

export function useVideoSearch() {
  const [results, setResults] = useState<VideoWithProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const data = await searchVideos(query);
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return { results, isSearching, error, search };
}
