import { supabase } from '@/lib/supabase';
import {
  Notification,
  NotificationPriority,
  NotificationChannel,
  NotificationStatus,
} from '@/types/notifications';
import * as Notifications from 'expo-notifications';

// Configure expo-notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Notification Delivery Service
 * Handles priority-based notification delivery through different channels
 */

interface DeliveryQueueItem {
  notification: Notification;
  attemptCount: number;
  nextAttemptTime: number;
}

class NotificationDeliveryService {
  private deliveryQueue: Map<string, DeliveryQueueItem> = new Map();
  private isProcessing = false;
  private readonly DELAY_MS = {
    high: 1000, // 1 second
    medium: 15000, // 15 seconds
    low: 60000, // 1 minute
  };

  private readonly MAX_ATTEMPTS = 3;

  /**
   * Queue a notification for delivery
   */
  async queueNotification(notification: Notification): Promise<void> {
    const delay = this.getDelayForPriority(notification.priority);
    const queueItem: DeliveryQueueItem = {
      notification,
      attemptCount: 0,
      nextAttemptTime: Date.now() + delay,
    };

    this.deliveryQueue.set(notification.id, queueItem);
    this.processQueue();
  }

  /**
   * Process the delivery queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const now = Date.now();
      const readyItems = Array.from(this.deliveryQueue.values()).filter(
        (item) => item.nextAttemptTime <= now
      );

      for (const item of readyItems) {
        await this.deliverNotification(item.notification, item.attemptCount);
      }

      // Clean up delivered or failed notifications
      for (const [id, item] of this.deliveryQueue.entries()) {
        if (
          item.notification.status === 'delivered' ||
          item.notification.status === 'failed' ||
          item.attemptCount >= this.MAX_ATTEMPTS
        ) {
          this.deliveryQueue.delete(id);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Deliver a notification through all enabled channels
   */
  private async deliverNotification(
    notification: Notification,
    attemptCount: number
  ): Promise<void> {
    try {
      // Update status to sent
      await this.updateNotificationStatus(notification.id, 'sent');

      const deliveryPromises: Promise<void>[] = [];

      // Deliver through each channel
      for (const channel of notification.channels) {
        if (channel === 'push' && !notification.push_sent) {
          deliveryPromises.push(this.deliverPushNotification(notification));
        } else if (channel === 'email' && !notification.email_sent) {
          deliveryPromises.push(this.deliverEmailNotification(notification));
        } else if (channel === 'in_app' && !notification.in_app_shown) {
          deliveryPromises.push(this.markInAppShown(notification.id));
        }
      }

      await Promise.allSettled(deliveryPromises);

      // Update status to delivered
      await this.updateNotificationStatus(notification.id, 'delivered');
    } catch (error) {
      console.error('Failed to deliver notification:', error);

      // Update status to failed
      await this.updateNotificationStatus(notification.id, 'failed');
      await this.logDeliveryAttempt(notification.id, 'all', 'failed', String(error));

      // Retry if under max attempts
      if (attemptCount < this.MAX_ATTEMPTS) {
        const item = this.deliveryQueue.get(notification.id);
        if (item) {
          item.attemptCount = attemptCount + 1;
          item.nextAttemptTime =
            Date.now() + this.DELAY_MS[notification.priority] * Math.pow(2, attemptCount);
        }
      }
    }
  }

  /**
   * Deliver push notification using Expo Notifications
   */
  private async deliverPushNotification(notification: Notification): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data ?? {},
          sound: notification.priority === 'high' ? 'default' : undefined,
          priority:
            notification.priority === 'high'
              ? Notifications.AndroidNotificationPriority.HIGH
              : Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: null, // Show immediately
      });

      // Mark push as sent
      await this.markChannelSent(notification.id, 'push');
      await this.logDeliveryAttempt(notification.id, 'push', 'sent', null);
    } catch (error) {
      await this.logDeliveryAttempt(notification.id, 'push', 'failed', String(error));
      throw error;
    }
  }

  /**
   * Deliver email notification
   * Note: This requires an email service integration (SendGrid, AWS SES, etc.)
   */
  private async deliverEmailNotification(notification: Notification): Promise<void> {
    try {
      // Call Supabase Edge Function or external email service
      const { error } = await supabase.functions.invoke('send-email-notification', {
        body: {
          notification: {
            id: notification.id,
            title: notification.title,
            body: notification.body,
            userId: notification.user_id,
          },
        },
      });

      if (error) throw error;

      // Mark email as sent
      await this.markChannelSent(notification.id, 'email');
      await this.logDeliveryAttempt(notification.id, 'email', 'sent', null);
    } catch (error) {
      await this.logDeliveryAttempt(notification.id, 'email', 'failed', String(error));
      throw error;
    }
  }

  /**
   * Mark in-app notification as shown
   */
  private async markInAppShown(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ in_app_shown: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  /**
   * Mark a channel as sent for a notification
   */
  private async markChannelSent(
    notificationId: string,
    channel: NotificationChannel
  ): Promise<void> {
    const updateData: any = {};
    if (channel === 'push') updateData.push_sent = true;
    if (channel === 'email') updateData.email_sent = true;
    if (channel === 'in_app') updateData.in_app_shown = true;

    const { error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', notificationId);

    if (error) throw error;
  }

  /**
   * Update notification status
   */
  private async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus
  ): Promise<void> {
    const updateData: any = { status };
    if (status === 'sent') updateData.sent_at = new Date().toISOString();
    if (status === 'delivered') updateData.delivered_at = new Date().toISOString();

    const { error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', notificationId);

    if (error) throw error;
  }

  /**
   * Log delivery attempt to history
   */
  private async logDeliveryAttempt(
    notificationId: string,
    channel: NotificationChannel | 'all',
    status: string,
    errorMessage: string | null
  ): Promise<void> {
    const { error } = await supabase
      .from('notification_delivery_history')
      .insert({
        notification_id: notificationId,
        channel: channel === 'all' ? 'push' : channel, // Use 'push' as default for 'all'
        status,
        error_message: errorMessage,
      });

    if (error) console.error('Failed to log delivery attempt:', error);
  }

  /**
   * Get delay for priority level
   */
  private getDelayForPriority(priority: NotificationPriority): number {
    return this.DELAY_MS[priority] || this.DELAY_MS.medium;
  }

  /**
   * Request push notification permissions
   */
  async requestPushPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  /**
   * Get push notification token
   */
  async getPushToken(): Promise<string | undefined> {
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    if (!projectId) {
      console.error('EXPO_PUBLIC_PROJECT_ID not set');
      return undefined;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  }

  /**
   * Setup push notification listener
   */
  setupPushNotificationListener(callback: (notification: Notification) => void): void {
    Notifications.addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      callback({
        id: data?.id || '',
        user_id: data?.userId || '',
        template_id: null,
        category: data?.category || 'system',
        priority: data?.priority || 'medium',
        status: 'delivered',
        title: title || '',
        body: body || '',
        data: data || null,
        channels: ['push'],
        push_sent: true,
        email_sent: false,
        in_app_shown: false,
        read_at: null,
        created_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
      } as Notification);
    });

    Notifications.addNotificationResponseReceivedListeners((response) => {
      // Handle notification tap
      const { data } = response.notification.request.content;
      console.log('Notification tapped:', data);
    });
  }
}

// Singleton instance
export const notificationDeliveryService = new NotificationDeliveryService();

/**
 * Initialize notification delivery service
 * Call this on app startup
 */
export async function initializeNotificationDelivery(): Promise<void> {
  const hasPermission = await notificationDeliveryService.requestPushPermissions();
  if (!hasPermission) {
    console.warn('Push notification permissions not granted');
  }

  const token = await notificationDeliveryService.getPushToken();
  if (token) {
    console.log('Push notification token:', token);
    // Store token in user profile for later use
  }

  // Subscribe to new notifications and queue them for delivery
  supabase
    .channel('notification_delivery')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: "status=eq.pending",
      },
      async (payload) => {
        const notification = payload.new as Notification;
        await notificationDeliveryService.queueNotification(notification);
      }
    )
    .subscribe();
}
