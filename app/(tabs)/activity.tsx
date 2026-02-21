/**
 * Activity Feed Screen
 *
 * Shows social activity from your network:
 * - Videos from people you follow
 * - Comments on your videos
 */

import { Text, useThemeColor } from '@/components/Themed';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { useAuth } from '@/providers/AuthProvider';
import { ActivityItem } from '@/services/profiles';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React from 'react';
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

export default function ActivityScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E5E5E5', dark: '#38383A' }, 'text');

  const {
    activities,
    isLoading: isActivityLoading,
    isRefreshing: isActivityRefreshing,
    error: activityError,
    hasMore,
    loadMore,
    refresh,
  } = useActivityFeed(user?.id);

  const handlePress = (item: ActivityItem) => {
    router.push({
      pathname: '/video/[id]',
      params: { id: item.video_id },
    } as any);
  };

  if (!user) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <Text style={styles.emptyText}>Sign in to see your activity</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      {/* Activity Feed */}
      <View style={styles.contentContainer}>
        {activityError && (
          <View style={[styles.errorBanner, { backgroundColor: '#EF444420' }]}>
            <Text style={[styles.errorText, { color: '#EF4444' }]}>{activityError}</Text>
          </View>
        )}
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ActivityRow item={item} onPress={() => handlePress(item)} />
          )}
          refreshControl={
            <RefreshControl refreshing={isActivityRefreshing} onRefresh={refresh} />
          }
          onEndReached={() => {
            if (hasMore && !isActivityLoading) loadMore();
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            !isActivityLoading ? (
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
            isActivityLoading && activities.length > 0 ? (
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
});
