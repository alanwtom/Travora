import { useCallback, useEffect, useState } from 'react';
import { unfollowUser } from '@/services/profiles';
import { isLocallyBlocked, blockUserLocally, unblockUserLocally } from '@/services/localBlocks';

export function useBlock(currentUserId?: string, targetUserId?: string) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!targetUserId) {
      setIsBlocked(false);
      return;
    }
    try {
      const blocked = await isLocallyBlocked(targetUserId);
      setIsBlocked(blocked);
    } catch {
      // Ignore
    }
  }, [targetUserId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(async () => {
    if (!targetUserId) return;
    setIsLoading(true);
    try {
      if (isBlocked) {
        await unblockUserLocally(targetUserId);
        setIsBlocked(false);
      } else {
        await blockUserLocally(targetUserId);
        // Best-effort: blocking implies you no longer follow them.
        if (currentUserId) {
          unfollowUser(currentUserId, targetUserId).catch(() => {});
        }
        setIsBlocked(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, targetUserId, isBlocked]);

  return { isBlocked, isLoading, toggle, refresh };
}

