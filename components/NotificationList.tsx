/**
 * Notification List Component
 *
 * Displays a list of notifications with:
 * - Priority-based visual indicators
 * - Category icons and colors
 * - Read/unread status
 * - Tap to mark as read
 * - Delete functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from './useColorScheme';
import { FlashList } from '@shopify/flash-list';
import { Notification, NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITIES } from '@/types/notifications';
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
} from '@/services/notifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationListProps {
  userId: string;
  onNotificationPress?: (notification: Notification) => void;
  unreadOnly?: boolean;
}

export function NotificationList({
  userId,
  onNotificationPress,
  unreadOnly = false,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({ light: '#FFFFFF', dark: '#1C1C1E' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E5E5E5', dark: '#38383A' }, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadNotifications();
  }, [userId, unreadOnly]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications(userId, 50);
      const filtered = unreadOnly ? data.filter((n) => !n.read_at) : data;
      setNotifications(filtered);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read_at) {
      try {
        await markNotificationAsRead(notification.id, userId);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
          )
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    onNotificationPress?.(notification);
  };

  const handleDelete = async (notification: Notification) => {
    Alert.alert('Delete Notification', 'Are you sure you want to delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingId(notification.id);
            await deleteNotification(notification.id, userId);
            setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
          } catch (error) {
            console.error('Failed to delete notification:', error);
            Alert.alert('Error', 'Failed to delete notification');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const handleMarkAllRead = async () => {
    try {
      const count = await markAllNotificationsAsRead(userId);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
      Alert.alert('Success', `${count} notifications marked as read`);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const renderNotification = useCallback(
    ({ item }: { item: Notification }) => {
      const categoryMeta = NOTIFICATION_CATEGORIES[item.category];
      const priorityMeta = NOTIFICATION_PRIORITIES[item.priority];
      const isUnread = !item.read_at;
      const isDeleting = deletingId === item.id;

      return (
        <TouchableOpacity
          onPress={() => handleNotificationPress(item)}
          onLongPress={() => handleDelete(item)}
          disabled={isDeleting}
          style={[
            styles.notificationCard,
            {
              backgroundColor: cardColor,
              borderColor: isUnread ? tintColor : borderColor,
              borderWidth: isUnread ? 2 : 1,
              opacity: isDeleting ? 0.5 : 1,
            },
          ]}
        >
          {/* Priority Indicator */}
          <View
            style={[
              styles.priorityIndicator,
              { backgroundColor: priorityMeta.color },
            ]}
          />

          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: categoryMeta.color + '20' },
            ]}
          >
            <Ionicons
              name={categoryMeta.icon as any}
              size={22}
              color={categoryMeta.color}
            />
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text
                style={[
                  styles.title,
                  { color: textColor, fontWeight: isUnread ? '600' : '400' },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {isUnread && (
                <View
                  style={[styles.unreadDot, { backgroundColor: tintColor }]}
                />
              )}
            </View>

            <Text
              style={[styles.body, { color: textColor + '80' }]}
              numberOfLines={2}
            >
              {item.body}
            </Text>

            <View style={styles.footerRow}>
              <Text style={[styles.timestamp, { color: textColor + '60' }]}>
                {formatDistanceToNow(new Date(item.created_at), {
                  addSuffix: true,
                })}
              </Text>

              <View style={styles.chipsContainer}>
                {/* Channel indicators */}
                {item.channels.includes('push') && (
                  <View style={[styles.chip, { backgroundColor: tintColor + '20' }]}>
                    <Ionicons name="notifications" size={12} color={tintColor} />
                  </View>
                )}
                {item.channels.includes('email') && (
                  <View style={[styles.chip, { backgroundColor: tintColor + '20' }]}>
                    <Ionicons name="mail" size={12} color={tintColor} />
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={styles.deleteButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={20} color={textColor + '40'} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [notifications, deletingId, textColor, cardColor, borderColor, tintColor]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off" size={64} color={textColor + '30'} />
      <Text style={[styles.emptyStateTitle, { color: textColor }]}>
        No Notifications
      </Text>
      <Text style={[styles.emptyStateMessage, { color: textColor + '60' }]}>
        {unreadOnly
          ? 'You have no unread notifications'
          : 'You\'re all caught up!'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Mark all as read button */}
      {!unreadOnly && notifications.length > 0 && (
        <View style={[styles.actionBar, { backgroundColor: cardColor, borderColor }]}>
          <Text style={[styles.actionBarText, { color: textColor + '60' }]}>
            {notifications.filter((n) => !n.read_at).length} unread
          </Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={[styles.actionBarButton, { color: tintColor }]}>
              Mark all as read
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      <FlashList
        data={notifications}
        renderItem={renderNotification}
        estimatedItemSize={100}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tintColor}
          />
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyListContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  actionBarText: {
    fontSize: 14,
  },
  actionBarButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
