import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { SharedContentWithDetails } from '@/types/database';
import {
  getReceivedShares,
  getUnreadShareCount,
  markShareAsRead as markShareReadService,
  markAllSharesAsRead as markAllSharesReadService,
} from '@/services/shares';

export function useShares() {
  const { user } = useAuth();
  const [shares, setShares] = useState<SharedContentWithDetails[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadShares = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [receivedShares, count] = await Promise.all([
        getReceivedShares(user.id, 20, 0),
        getUnreadShareCount(user.id),
      ]);
      setShares(receivedShares);
      setUnreadCount(count);
    } catch (error) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user?.id) return;
    try {
      const count = await getUnreadShareCount(user.id);
      setUnreadCount(count);
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    loadShares();
  }, [user?.id]);

  const markAsRead = async (shareId: string) => {
    if (!user?.id) return;
    // Optimistic update
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setShares((prev) =>
      prev.map((s) => (s.id === shareId ? { ...s, is_read: true } : s))
    );
    try {
      await markShareReadService(shareId, user.id);
    } catch {
      // Revert on failure
      loadShares();
    }
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    // Optimistic update
    setUnreadCount(0);
    setShares((prev) => prev.map((s) => ({ ...s, is_read: true })));
    try {
      await markAllSharesReadService(user.id);
    } catch {
      loadShares();
    }
  };

  return {
    shares,
    unreadCount,
    loading,
    loadShares,
    loadUnreadCount,
    markAsRead,
    markAllRead,
  };
}
