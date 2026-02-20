// ============================================
// Notification System Types
// ============================================

export type NotificationCategory =
  | 'trip_updates'
  | 'price_alerts'
  | 'promotions'
  | 'social'
  | 'system'
  | 'booking'
  | 'reminder';

export type NotificationPriority = 'high' | 'medium' | 'low';

export type NotificationChannel = 'push' | 'email' | 'in_app';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  category: NotificationCategory;
  push_enabled: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferencesInsert {
  id?: string;
  user_id: string;
  category: NotificationCategory;
  push_enabled?: boolean;
  email_enabled?: boolean;
  in_app_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationPreferencesUpdate {
  push_enabled?: boolean;
  email_enabled?: boolean;
  in_app_enabled?: boolean;
  updated_at?: string;
}

export interface NotificationTemplate {
  id: string;
  category: NotificationCategory;
  trigger_event: string;
  priority: NotificationPriority;
  default_channels: NotificationChannel[];
  title_template: string;
  body_template: string;
  data_template: Record<string, any> | null;
  is_essential: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  template_id: string | null;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  body: string;
  data: Record<string, any> | null;
  channels: NotificationChannel[];
  push_sent: boolean;
  email_sent: boolean;
  in_app_shown: boolean;
  read_at: string | null;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
}

export interface NotificationInsert {
  id?: string;
  user_id: string;
  template_id?: string | null;
  category: NotificationCategory;
  priority: NotificationPriority;
  status?: NotificationStatus;
  title: string;
  body: string;
  data?: Record<string, any> | null;
  channels: NotificationChannel[];
  push_sent?: boolean;
  email_sent?: boolean;
  in_app_shown?: boolean;
  read_at?: string | null;
  created_at?: string;
  sent_at?: string | null;
  delivered_at?: string | null;
}

export interface NotificationDeliveryHistory {
  id: string;
  notification_id: string;
  channel: NotificationChannel;
  status: string;
  error_message: string | null;
  attempt_count: number;
  created_at: string;
}

export interface NotificationSettings {
  notification_muted: boolean;
  notification_mute_until: string | null;
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  marketing_notifications_enabled: boolean;
}

export interface NotificationSettingsUpdate {
  notification_muted?: boolean;
  notification_mute_until?: string | null;
  email_notifications_enabled?: boolean;
  push_notifications_enabled?: boolean;
  marketing_notifications_enabled?: boolean;
}

// Extended types
export interface NotificationWithTemplate extends Notification {
  template: NotificationTemplate | null;
}

export interface NotificationCategoryWithPreferences {
  category: NotificationCategory;
  push_enabled: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
  icon: string;
  label: string;
  description: string;
  is_essential: boolean;
}

export type CreateNotificationParams = {
  triggerEvent: string;
  userId: string;
  titleData?: Record<string, any>;
  bodyData?: Record<string, any>;
  customData?: Record<string, any>;
};

export type NotificationTriggerEvent =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'flight_delayed'
  | 'itinerary_changed'
  | 'trip_starting_soon'
  | 'price_drop'
  | 'deal_expiring_soon'
  | 'special_offer'
  | 'seasonal_sale'
  | 'referral_bonus'
  | 'new_follower'
  | 'video_liked'
  | 'comment_received'
  | 'mention_received'
  | 'security_alert'
  | 'account_verified'
  | 'password_changed'
  | 'payment_received'
  | 'booking_reminder'
  | 'check_in_open'
  | '24_hour_flight'
  | 'trip_end_reminder'
  | 'review_request';

// Notification category metadata
export const NOTIFICATION_CATEGORIES: Record<
  NotificationCategory,
  { label: string; description: string; icon: string; color: string; isEssential: boolean }
> = {
  trip_updates: {
    label: 'Trip Updates',
    description: 'Booking confirmations, cancellations, delays, and itinerary changes',
    icon: 'airplane',
    color: '#3B82F6',
    isEssential: true,
  },
  price_alerts: {
    label: 'Price Alerts',
    description: 'Price drops, deals, and expiring offers',
    icon: 'tag',
    color: '#10B981',
    isEssential: false,
  },
  promotions: {
    label: 'Promotions',
    description: 'Special offers, seasonal sales, and referral bonuses',
    icon: 'gift',
    color: '#F59E0B',
    isEssential: false,
  },
  social: {
    label: 'Social',
    description: 'New followers, likes, comments, and mentions',
    icon: 'people',
    color: '#EC4899',
    isEssential: false,
  },
  system: {
    label: 'System',
    description: 'Security alerts, account verification, and password changes',
    icon: 'shield',
    color: '#6366F1',
    isEssential: true,
  },
  booking: {
    label: 'Booking',
    description: 'Payment confirmations, booking reminders, and check-in notifications',
    icon: 'calendar',
    color: '#8B5CF6',
    isEssential: true,
  },
  reminder: {
    label: 'Reminders',
    description: 'Flight reminders, trip end notifications, and review requests',
    icon: 'clock',
    color: '#06B6D4',
    isEssential: false,
  },
};

// Priority levels with delivery time targets
export const NOTIFICATION_PRIORITIES: Record<
  NotificationPriority,
  { label: string; description: string; deliveryTarget: string; color: string }
> = {
  high: {
    label: 'High',
    description: 'Immediate delivery for critical updates',
    deliveryTarget: '< 1 minute',
    color: '#EF4444',
  },
  medium: {
    label: 'Medium',
    description: 'Standard delivery for important updates',
    deliveryTarget: '< 15 minutes',
    color: '#F59E0B',
  },
  low: {
    label: 'Low',
    description: 'Batched delivery for non-urgent updates',
    deliveryTarget: '< 1 hour',
    color: '#10B981',
  },
};

// Channel metadata
export const NOTIFICATION_CHANNELS: Record<
  NotificationChannel,
  { label: string; description: string; icon: string }
> = {
  push: {
    label: 'Push Notifications',
    description: 'Instant alerts on your device',
    icon: 'notifications',
  },
  email: {
    label: 'Email',
    description: 'Digest emails for important updates',
    icon: 'mail',
  },
  in_app: {
    label: 'In-App',
    description: 'Notifications within the app',
    icon: 'chatbubbles',
  },
};
