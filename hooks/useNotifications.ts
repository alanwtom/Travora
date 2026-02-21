/**
 * useNotifications Hook
 *
 * Custom hook for managing notifications throughout the app
 * Provides easy access to notification functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  Notification,
  NotificationCategoryWithPreferences,
  NotificationSettings,
  NotificationCategory,
  NotificationChannel,
  CreateNotificationParams,
} from '@/types/notifications';
import {
  getNotifications,
  getUnreadNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationCategoriesWithPreferences,
  getNotificationSettings,
  toggleNotificationChannel,
  updateNotificationSettings,
  muteAllNotifications,
  unmuteAllNotifications,
  createNotification as createNotificationService,
  subscribeToNotifications,
  subscribeToNotificationPreferences,
} from '@/services/notifications';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationCategoryWithPreferences[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const count = await getUnreadNotificationCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, [user?.id]);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await getNotificationCategoriesWithPreferences(user.id);
      setPreferences(data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, [user?.id]);

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await getNotificationSettings(user.id);
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [user?.id, loadNotifications, loadUnreadCount]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToNotifications(user.id, (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      loadUnreadCount();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, loadUnreadCount]);

  // Create notification
  const createNotification = useCallback(
    async (params: Omit<CreateNotificationParams, 'userId'>) => {
      if (!user?.id) return null;

      try {
        const notificationId = await createNotificationService({
          ...params,
          userId: user.id,
        });
        return notificationId;
      } catch (error) {
        console.error('Failed to create notification:', error);
        return null;
      }
    },
    [user?.id]
  );

  // Mark as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user?.id) return false;

      try {
        const result = await markNotificationAsRead(notificationId, user.id);
        if (result) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        return result;
      } catch (error) {
        console.error('Failed to mark as read:', error);
        return false;
      }
    },
    [user?.id]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return 0;

    try {
      const count = await markAllNotificationsAsRead(user.id);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      return count;
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      return 0;
    }
  }, [user?.id]);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!user?.id) return;

      try {
        await deleteNotification(notificationId); // Delete notification by ID only
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        loadUnreadCount();
      } catch (error) {
        console.error('Failed to delete notification:', error);
      }
    },
    [user?.id, loadUnreadCount]
  );

  // Toggle channel
  const toggleChannel = useCallback(
    async (category: NotificationCategory, channel: NotificationChannel, enabled: boolean) => {
      if (!user?.id) return;

      try {
        await toggleNotificationChannel(user.id, category, channel, enabled);
        await loadPreferences();
      } catch (error) {
        console.error('Failed to toggle channel:', error);
        throw error;
      }
    },
    [user?.id, loadPreferences]
  );

  // Update settings
  const updateSettings = useCallback(
    async (updates: Partial<NotificationSettings>) => {
      if (!user?.id) return;

      try {
        await updateNotificationSettings(user.id, updates);
        await loadSettings();
      } catch (error) {
        console.error('Failed to update settings:', error);
        throw error;
      }
    },
    [user?.id, loadSettings]
  );

  // Mute all
  const muteAll = useCallback(async () => {
    if (!user?.id) return;

    try {
      await muteAllNotifications(user.id);
      await loadSettings();
    } catch (error) {
      console.error('Failed to mute all:', error);
      throw error;
    }
  }, [user?.id, loadSettings]);

  // Unmute all
  const unmuteAll = useCallback(async () => {
    if (!user?.id) return;

    try {
      await unmuteAllNotifications(user.id);
      await loadSettings();
    } catch (error) {
      console.error('Failed to unmute all:', error);
      throw error;
    }
  }, [user?.id, loadSettings]);

  return {
    // Data
    notifications,
    unreadCount,
    preferences,
    settings,
    loading,

    // Actions
    loadNotifications,
    loadUnreadCount,
    loadPreferences,
    loadSettings,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    toggleChannel,
    updateSettings,
    muteAll,
    unmuteAll,
  };
}
