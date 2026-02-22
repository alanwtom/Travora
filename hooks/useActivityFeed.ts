import { useCallback, useEffect, useState } from 'react';
import { ActivityItem, getActivityFeed } from '@/services/profiles';

const PAGE_SIZE = 20;

export function useActivityFeed(userId: string | undefined) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(
    async (pageNum: number = 0, refresh: boolean = false) => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        if (refresh || pageNum === 0) setIsRefreshing(true);
        else setIsLoading(true);
        setError(null);

        const data = await getActivityFeed(userId, pageNum, PAGE_SIZE);

        if (refresh || pageNum === 0) {
          setActivities(data);
        } else {
          setActivities((prev) => [...prev, ...data]);
        }

        setHasMore(data.length >= PAGE_SIZE);
        setPage(pageNum);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchActivities(0);
  }, [fetchActivities]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && userId) {
      fetchActivities(page + 1);
    }
  }, [isLoading, hasMore, userId, page, fetchActivities]);

  const refresh = useCallback(() => {
    fetchActivities(0, true);
  }, [fetchActivities]);

  return {
    activities,
    isLoading,
    isRefreshing,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
