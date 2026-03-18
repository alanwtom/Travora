/**
 * Activity Feed Screen
 *
 * Shows social activity from your network:
 * - Videos from people you follow
 * - Comments on your videos
 * - Itinerary collaboration invitations
 */

import { Text, useThemeColor } from '@/components/Themed';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/providers/AuthProvider';
import { ActivityItem } from '@/services/profiles';
import { acceptItineraryInvitation, declineItineraryInvitation } from '@/services/collaborators';
import { Notification } from '@/types/notifications';
import * as Icons from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    TouchableOpacity, View
} from 'react-native';

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function ActivityRow({
  item,
  onPress,
}: {
  item: ActivityItem;
  onPress: () => void;
}) {
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({ light: '#9CA3AF', dark: '#6B7280' }, 'text');
  const surfaceColor = useThemeColor({ light: '#F3F4F6', dark: '#1C1C1E' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E5E5', dark: '#38383A' }, 'text');

  const actionText =
    item.type === 'video_upload'
      ? 'uploaded a new video'
      : 'commented on your video';

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: borderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {item.profile.avatar_url ? (
        <Image source={{ uri: item.profile.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: surfaceColor }]}>
          <FontAwesome name="user" size={24} color={textMutedColor} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={[styles.text, { color: textColor }]} numberOfLines={2}>
          <Text style={[styles.name, { color: textColor }]}>
            {item.profile.display_name || item.profile.username || 'Someone'}
          </Text>
          {' '}{actionText}
          {item.video?.title && (
            <Text style={[styles.videoTitle, { color: textMutedColor }]}> "{item.video.title}"</Text>
          )}
        </Text>
        {item.type === 'comment' && item.comment_content && (
          <Text style={[styles.comment, { color: textMutedColor }]} numberOfLines={2}>
            "{item.comment_content}"
          </Text>
        )}
        <Text style={[styles.time, { color: textMutedColor }]}>{formatTimeAgo(item.created_at)}</Text>
      </View>
      {item.video?.thumbnail_url ? (
        <Image
          source={{ uri: item.video.thumbnail_url }}
          style={styles.thumbnail}
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder, { backgroundColor: surfaceColor }]}>
          <FontAwesome name="play" size={16} color={textMutedColor} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function NotificationRow({
  notification,
  onAccept,
  onDecline,
}: {
  notification: Notification;
  onAccept: (itineraryId: string, role: string) => void;
  onDecline: (itineraryId: string) => void;
}) {
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({ light: '#9CA3AF', dark: '#6B7280' }, 'text');
  const surfaceColor = useThemeColor({ light: '#F3F4F6', dark: '#1C1C1E' }, 'background');
  const primaryColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({ light: '#E5E5E5', dark: '#38383A' }, 'text');

  // Check if this is an itinerary invite
  const isItineraryInvite = notification.category === 'social' &&
    notification.data?.itineraryId;

  const handleAccept = () => {
    if (isItineraryInvite && notification.data) {
      onAccept(notification.data.itineraryId, notification.data.role);
    }
  };

  const handleDecline = () => {
    if (isItineraryInvite && notification.data) {
      onDecline(notification.data.itineraryId);
    }
  };

  return (
    <View style={[styles.row, { borderBottomColor: borderColor }]}>
      <View style={[styles.avatar, styles.notificationIcon, { backgroundColor: surfaceColor }]}>
        {isItineraryInvite ? (
          <Icons.Users size={24} color={primaryColor} />
        ) : (
          <Icons.Bell size={24} color={textMutedColor} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.text, { color: textColor }]} numberOfLines={3}>
          <Text style={[styles.name, { color: textColor }]}>{notification.title}</Text>
        </Text>
        <Text style={[styles.comment, { color: textMutedColor }]} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={[styles.time, { color: textMutedColor }]}>{formatTimeAgo(notification.created_at)}</Text>
        {isItineraryInvite && (
          <View style={styles.inviteActions}>
            <TouchableOpacity
              style={[styles.inviteButton, styles.acceptButton, { backgroundColor: primaryColor }]}
              onPress={handleAccept}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.inviteButton, styles.declineButton, { borderColor: borderColor }]}
              onPress={handleDecline}
            >
              <Text style={[styles.declineButtonText, { color: textMutedColor }]}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export default function ActivityScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E5E5E5', dark: '#38383A' }, 'text');

  const {
    activities,
    isLoading: isActivityLoading,
    isRefreshing: isActivityRefreshing,
    error: activityError,
    hasMore: hasMoreActivities,
    loadMore,
    refresh: refreshActivities,
  } = useActivityFeed(user?.id);

  const {
    notifications,
    markAsRead,
    loadNotifications,
    loading: notificationsLoading,
  } = useNotifications();

  // Combine activities and notifications into a single feed
  // Activities don't have a direct notification equivalent, so we keep them separate
  const feedItems: Array<{ type: 'activity' | 'notification'; id: string; data: any }> = [
    ...activities.map(a => ({ type: 'activity' as const, id: a.id, data: a })),
    ...notifications.map(n => ({ type: 'notification' as const, id: n.id, data: n })),
  ].sort((a, b) => {
    const aDate = a.type === 'activity' ? a.data.created_at : a.data.created_at;
    const bDate = b.type === 'notification' ? b.data.created_at : b.data.created_at;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  const handlePress = (item: ActivityItem) => {
    router.push({
      pathname: '/video/[id]',
      params: { id: item.video_id },
    } as any);
  };

  const handleAcceptInvitation = async (itineraryId: string, role: string) => {
    if (!user?.id) return;

    try {
      await acceptItineraryInvitation(itineraryId, user.id);
      // Navigate to itinerary detail page
      // For now, just show an alert since the itinerary detail page doesn't exist yet
      Alert.alert(
        'Invitation Accepted',
        `You now have ${role} access to this itinerary.`
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (itineraryId: string) => {
    if (!user?.id) return;

    try {
      await declineItineraryInvitation(itineraryId, user.id);
      loadNotifications(); // Refresh notifications
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to decline invitation');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshActivities(),
      loadNotifications(),
    ]);
    setRefreshing(false);
  };

  if (!user) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <Text style={styles.emptyText}>Sign in to see your activity</Text>
      </View>
    );
  }

  const isLoading = isActivityLoading || notificationsLoading || refreshing;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <View style={styles.contentContainer}>
        {activityError && (
          <View style={[styles.errorBanner, { backgroundColor: '#EF444420' }]}>
            <Text style={[styles.errorText, { color: '#EF4444' }]}>{activityError}</Text>
          </View>
        )}
        <FlatList
          data={feedItems}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={({ item }) =>
            item.type === 'activity' ? (
              <ActivityRow
                item={item.data}
                onPress={() => handlePress(item.data)}
              />
            ) : (
              <NotificationRow
                notification={item.data}
                onAccept={handleAcceptInvitation}
                onDecline={handleDeclineInvitation}
              />
            )
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={() => {
            if (hasMoreActivities && !isActivityLoading) loadMore();
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color={borderColor} />
                <Text style={[styles.emptyText, { color: textColor }]}>No activity yet</Text>
                <Text style={[styles.emptySubtext, { color: textColor + '60' }]}>
                  When people you follow upload videos or comment on yours, you'll see it here
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            isLoading && feedItems.length > 0 ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={tintColor} />
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 15,
  },
  name: {
    fontWeight: '600',
  },
  videoTitle: {
  },
  comment: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  time: {
    fontSize: 12,
    marginTop: 4,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginLeft: 12,
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorBanner: {
    padding: 12,
  },
  errorText: {
    fontSize: 14,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  notificationIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  inviteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  acceptButton: {
    // backgroundColor is set dynamically via style prop in JSX
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  declineButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  declineButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
