import { useCallback, useEffect, useState } from 'react';
import { ProfileWithFollowStatus } from '@/services/profiles';
import { getFollowers } from '@/services/profiles';

const PAGE_SIZE = 20;

export function useFollowers(
  userId: string,
  currentUserId?: string,
  searchQuery?: string
) {
  const [followers, setFollowers] = useState<ProfileWithFollowStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowers = useCallback(
    async (pageNum: number = 0, refresh: boolean = false) => {
      if (!userId) return;

      try {
        if (refresh || pageNum === 0) setIsRefreshing(true);
        else setIsLoading(true);
        setError(null);

        const data = await getFollowers(
          userId,
          pageNum,
          PAGE_SIZE,
          searchQuery,
          currentUserId
        );

        if (refresh || pageNum === 0) {
          setFollowers(data);
        } else {
          setFollowers((prev) => [...prev, ...data]);
        }

        setHasMore(!searchQuery && data.length >= PAGE_SIZE);
        setPage(pageNum);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [userId, currentUserId, searchQuery]
  );

  useEffect(() => {
    fetchFollowers(0);
  }, [fetchFollowers]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && !searchQuery) {
      fetchFollowers(page + 1);
    }
  }, [isLoading, hasMore, searchQuery, page, fetchFollowers]);

  const refresh = useCallback(() => {
    fetchFollowers(0, true);
  }, [fetchFollowers]);

  return {
    followers,
    isLoading,
    isRefreshing,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
