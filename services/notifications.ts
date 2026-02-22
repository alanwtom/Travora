import { supabase } from '@/lib/supabase';
import {
  Notification,
  NotificationPreferences,
  NotificationPreferencesInsert,
  NotificationPreferencesUpdate,
  NotificationSettings,
  NotificationSettingsUpdate,
  NotificationCategory,
  NotificationChannel,
  NotificationWithTemplate,
  NotificationCategoryWithPreferences,
  CreateNotificationParams,
  NOTIFICATION_CATEGORIES,
} from '@/types/notifications';

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

/**
 * Get all notification preferences for a user
 */
export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences[]> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data ?? [];
}

/**
 * Get notification preference for a specific category
 */
export async function getNotificationPreference(
  userId: string,
  category: NotificationCategory
): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Update notification preference for a specific category
 * Provides real-time updates without requiring a save button
 */
export async function updateNotificationPreference(
  userId: string,
  category: NotificationCategory,
  updates: NotificationPreferencesUpdate
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .update(updates)
    .eq('user_id', userId)
    .eq('category', category)
    .select()
    .single();

  if (error) {
    // If preference doesn't exist, create it
    if (error.code === 'PGRST116') {
      return createNotificationPreference(userId, category, updates);
    }
    throw error;
  }

  return data;
}

/**
 * Create notification preference for a category
 */
export async function createNotificationPreference(
  userId: string,
  category: NotificationCategory,
  preferences: Partial<NotificationPreferencesInsert>
): Promise<NotificationPreferences> {
  const insertData: NotificationPreferencesInsert = {
    user_id: userId,
    category,
    push_enabled: preferences.push_enabled ?? true,
    email_enabled: preferences.email_enabled ?? true,
    in_app_enabled: preferences.in_app_enabled ?? true,
  };

  const { data, error } = await supabase
    .from('notification_preferences')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Toggle a specific channel for a category
 * Real-time update for instant feedback
 */
export async function toggleNotificationChannel(
  userId: string,
  category: NotificationCategory,
  channel: NotificationChannel,
  enabled: boolean
): Promise<NotificationPreferences> {
  const updateData: NotificationPreferencesUpdate = {};

  switch (channel) {
    case 'push':
      updateData.push_enabled = enabled;
      break;
    case 'email':
      updateData.email_enabled = enabled;
      break;
    case 'in_app':
      updateData.in_app_enabled = enabled;
      break;
  }

  return updateNotificationPreference(userId, category, updateData);
}

/**
 * Get all notification categories with user preferences
 * Includes default values for categories not yet set
 */
export async function getNotificationCategoriesWithPreferences(
  userId: string
): Promise<NotificationCategoryWithPreferences[]> {
  const preferences = await getNotificationPreferences(userId);
  const preferencesMap = new Map(preferences.map((p) => [p.category, p]));

  return Object.entries(NOTIFICATION_CATEGORIES).map(([category, meta]) => {
    const pref = preferencesMap.get(category as NotificationCategory);
    return {
      category: category as NotificationCategory,
      push_enabled: pref?.push_enabled ?? true,
      email_enabled: pref?.email_enabled ?? true,
      in_app_enabled: pref?.in_app_enabled ?? true,
      icon: meta.icon,
      label: meta.label,
      description: meta.description,
      is_essential: meta.isEssential,
    };
  });
}

// ============================================
// GLOBAL NOTIFICATION SETTINGS
// ============================================

/**
 * Get global notification settings for a user
 */
export async function getNotificationSettings(userId: string): Promise<NotificationSettings> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'notification_muted, notification_mute_until, email_notifications_enabled, push_notifications_enabled, marketing_notifications_enabled'
    )
    .eq('id', userId)
    .single();

  if (error) throw error;

  return {
    notification_muted: data.notification_muted ?? false,
    notification_mute_until: data.notification_mute_until ?? null,
    email_notifications_enabled: data.email_notifications_enabled ?? true,
    push_notifications_enabled: data.push_notifications_enabled ?? true,
    marketing_notifications_enabled: data.marketing_notifications_enabled ?? false,
  };
}

/**
 * Update global notification settings
 * Real-time update for instant feedback
 */
export async function updateNotificationSettings(
  userId: string,
  updates: NotificationSettingsUpdate
): Promise<NotificationSettings> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select(
      'notification_muted, notification_mute_until, email_notifications_enabled, push_notifications_enabled, marketing_notifications_enabled'
    )
    .single();

  if (error) throw error;

  return {
    notification_muted: data.notification_muted ?? false,
    notification_mute_until: data.notification_mute_until ?? null,
    email_notifications_enabled: data.email_notifications_enabled ?? true,
    push_notifications_enabled: data.push_notifications_enabled ?? true,
    marketing_notifications_enabled: data.marketing_notifications_enabled ?? false,
  };
}

/**
 * Mute all notifications (Master Switch)
 */
export async function muteAllNotifications(userId: string): Promise<void> {
  await updateNotificationSettings(userId, { notification_muted: true });
}

/**
 * Unmute all notifications
 */
export async function unmuteAllNotifications(userId: string): Promise<void> {
  await updateNotificationSettings(userId, {
    notification_muted: false,
    notification_mute_until: null,
  });
}

/**
 * Mute notifications for a specific duration
 */
export async function muteNotificationsForDuration(
  userId: string,
  durationHours: number
): Promise<void> {
  const muteUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
  await updateNotificationSettings(userId, {
    notification_muted: true,
    notification_mute_until: muteUntil,
  });
}

/**
 * Check if user is currently muted
 */
export async function isUserMuted(userId: string): Promise<boolean> {
  const settings = await getNotificationSettings(userId);

  if (settings.notification_muted) {
    // Check if temporary mute has expired
    if (settings.notification_mute_until) {
      const muteUntil = new Date(settings.notification_mute_until);
      if (muteUntil > new Date()) {
        return true;
      } else {
        // Mute has expired, unmute the user
        await unmuteAllNotifications(userId);
        return false;
      }
    }
    return true;
  }

  return false;
}

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Get all notifications for a user
 */
export async function getNotifications(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data ?? [];
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(
  userId: string,
  limit: number = 20
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_notification_count', {
    user_id_param: userId,
  });

  if (error) throw error;
  return data ?? 0;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase.rpc('mark_notification_read', {
    notification_id: notificationId,
    user_id_param: userId,
  });

  if (error) throw error;
  return true;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('mark_all_notifications_read', {
    user_id_param: userId,
  });

  if (error) throw error;
  return data ?? 0;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Get notifications by category
 */
export async function getNotificationsByCategory(
  userId: string,
  category: NotificationCategory,
  limit: number = 20,
  offset: number = 0
): Promise<Notification[]> {
  const { data, error } = await supabase.rpc('get_notifications_by_category', {
    user_id_param: userId,
    category_param: category,
    limit_count: limit,
    offset_count: offset,
  });

  if (error) throw error;
  return data ?? [];
}

// ============================================
// NOTIFICATION CREATION & DELIVERY
// ============================================

/**
 * Create a notification from a template
 * This is the main function to trigger notifications
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_notification', {
    user_id_param: params.userId,
    trigger_event_param: params.triggerEvent,
    title_data: params.titleData ?? {},
    body_data: params.bodyData ?? {},
    custom_data: params.customData ?? {},
  });

  if (error) {
    console.error('Failed to create notification:', error);
    return null;
  }

  return data;
}

/**
 * Check if user should receive a notification for a specific category and channel
 */
export async function shouldSendNotification(
  userId: string,
  category: NotificationCategory,
  channel: NotificationChannel
): Promise<boolean> {
  const { data, error } = await supabase.rpc('should_send_notification', {
    user_id_param: userId,
    category_param: category,
    channel_param: channel,
  });

  if (error) {
    console.error('Failed to check notification preference:', error);
    return false;
  }

  return data ?? false;
}

/**
 * Initialize default notification preferences for a user
 * Called automatically when a new user signs up
 */
export async function initializeNotificationPreferences(userId: string): Promise<void> {
  const { error } = await supabase.rpc('initialize_notification_preferences', {
    user_id: userId,
  });

  if (error) throw error;
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to new notifications for a user
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .subscribe();
}

/**
 * Subscribe to notification preference changes
 */
export function subscribeToNotificationPreferences(
  userId: string,
  callback: (preferences: NotificationPreferences) => void
) {
  return supabase
    .channel(`notification_preferences:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notification_preferences',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          callback(payload.new as NotificationPreferences);
        }
      }
    )
    .subscribe();
}
