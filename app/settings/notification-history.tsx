/**
 * Notification History (Debug View)
 *
 * This screen shows notification delivery history for debugging purposes.
 * It's accessible via Settings and shows the status of notifications sent through the system.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColor } from '@/components/Themed';
import { useAuth } from '@/providers/AuthProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { getNotifications } from '@/services/notifications';
import { Notification, NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITIES } from '@/types/notifications';
import { formatDistanceToNow } from 'date-fns';
import { ActivityIndicator } from 'react-native';

export default function NotificationHistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({ light: '#FFFFFF', dark: '#1C1C1E' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E5E5', dark: '#38383A' }, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await getNotifications(user.id, 100);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'sent':
        return '#3B82F6';
      case 'delivered':
        return '#10B981';
      case 'failed':
        return '#EF4444';
      case 'read':
        return '#6B7280';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const categoryMeta = NOTIFICATION_CATEGORIES[item.category];
    const priorityMeta = NOTIFICATION_PRIORITIES[item.priority];

    return (
      <View style={[styles.notificationCard, { backgroundColor: cardColor, borderColor }]}>
        {/* Status indicator */}
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.categoryBadge, { color: categoryMeta.color }]}>
              {categoryMeta.label}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>

          {/* Title & Body */}
          <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.body, { color: textColor + '70' }]} numberOfLines={2}>
            {item.body}
          </Text>

          {/* Metadata */}
          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <Ionicons name="time" size={12} color={textColor + '50'} />
              <Text style={[styles.metadataText, { color: textColor + '60' }]}>
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </Text>
            </View>

            {/* Delivery channels */}
            <View style={styles.channelsContainer}>
              {item.channels.includes('push') && (
                <View style={[styles.channelBadge, { backgroundColor: tintColor + '20' }]}>
                  <Ionicons name="notifications" size={12} color={tintColor} />
                  <Text style={[styles.channelText, { color: tintColor }]}>
                    {item.push_sent ? 'Sent' : 'Pending'}
                  </Text>
                </View>
              )}
              {item.channels.includes('email') && (
                <View style={[styles.channelBadge, { backgroundColor: tintColor + '20' }]}>
                  <Ionicons name="mail" size={12} color={tintColor} />
                  <Text style={[styles.channelText, { color: tintColor }]}>
                    {item.email_sent ? 'Sent' : 'Pending'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Priority */}
          <View style={styles.priorityRow}>
            <View style={[styles.priorityBadge, { backgroundColor: priorityMeta.color + '20' }]}>
              <Text style={[styles.priorityText, { color: priorityMeta.color }]}>
                {priorityMeta.label} priority
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (!user?.id) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.emptyText, { color: textColor }]}>Sign in to view notification history</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <Text style={[styles.loadingText, { color: textColor + '60' }]}>Loading notification history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={textColor} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Notification History</Text>
          <Text style={[styles.headerSubtitle, { color: textColor + '60' }]}>
            Debug view for delivery tracking
          </Text>
        </View>
      </View>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={textColor + '30'} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>No notifications yet</Text>
          <Text style={[styles.emptyMessage, { color: textColor + '60' }]}>
            Notification delivery history will appear here
          </Text>
        </View>
      ) : (
        <FlashList
          data={notifications}
          renderItem={renderNotification}
          estimatedItemSize={160}
          contentContainerStyle={styles.listContent}
        /> as any
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  statusIndicator: {
    width: 4,
  },
  contentContainer: {
    flex: 1,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 11,
  },
  channelsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  channelText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
