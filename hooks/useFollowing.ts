import { useCallback, useEffect, useState } from 'react';
import { ProfileWithFollowStatus } from '@/services/profiles';
import { getFollowing } from '@/services/profiles';

const PAGE_SIZE = 20;

export function useFollowing(
  userId: string,
  currentUserId?: string,
  searchQuery?: string
) {
  const [following, setFollowing] = useState<ProfileWithFollowStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowing = useCallback(
    async (pageNum: number = 0, refresh: boolean = false) => {
      if (!userId) return;

      try {
        if (refresh || pageNum === 0) setIsRefreshing(true);
        else setIsLoading(true);
        setError(null);

        const data = await getFollowing(
          userId,
          pageNum,
          PAGE_SIZE,
          searchQuery,
          currentUserId
        );

        if (refresh || pageNum === 0) {
          setFollowing(data);
        } else {
          setFollowing((prev) => [...prev, ...data]);
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
    fetchFollowing(0);
  }, [fetchFollowing]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && !searchQuery) {
      fetchFollowing(page + 1);
    }
  }, [isLoading, hasMore, searchQuery, page, fetchFollowing]);

  const refresh = useCallback(() => {
    fetchFollowing(0, true);
  }, [fetchFollowing]);

  return {
    following,
    isLoading,
    isRefreshing,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
