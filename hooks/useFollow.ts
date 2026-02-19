import { useCallback, useEffect, useState } from 'react';
import {
  followUser,
  unfollowUser,
  isFollowing as checkIsFollowing,
} from '@/services/profiles';

export function useFollow(followerId: string | undefined, followingId: string | undefined) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!followerId || !followingId || followerId === followingId) {
      setIsFollowing(false);
      return;
    }

    try {
      const status = await checkIsFollowing(followerId, followingId);
      setIsFollowing(status);
    } catch (err: any) {
      setError(err.message);
    }
  }, [followerId, followingId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const follow = useCallback(async () => {
    if (!followerId || !followingId || followerId === followingId) return;

    setIsLoading(true);
    setError(null);
    const previous = isFollowing;

    try {
      setIsFollowing(true);
      await followUser(followerId, followingId);
    } catch (err: any) {
      setIsFollowing(previous);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [followerId, followingId, isFollowing]);

  const unfollow = useCallback(async () => {
    if (!followerId || !followingId || followerId === followingId) return;

    setIsLoading(true);
    setError(null);
    const previous = isFollowing;

    try {
      setIsFollowing(false);
      await unfollowUser(followerId, followingId);
    } catch (err: any) {
      setIsFollowing(previous);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [followerId, followingId, isFollowing]);

  const toggle = useCallback(async () => {
    if (isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
  }, [isFollowing, follow, unfollow]);

  return {
    isFollowing,
    isLoading,
    error,
    follow,
    unfollow,
    toggle,
    refetch: fetchStatus,
  };
}
