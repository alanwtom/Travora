import { useActivityFeed } from '@/hooks/useActivityFeed';
import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { ActivityItem } from '@/services/profiles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
  const actionText =
    item.type === 'video_upload'
      ? 'uploaded a new video'
      : 'commented on your video';

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {item.profile.avatar_url ? (
        <Image source={{ uri: item.profile.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <FontAwesome name="user" size={24} color={COLORS.textMuted} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.text} numberOfLines={2}>
          <Text style={styles.name}>
            {item.profile.display_name || item.profile.username || 'Someone'}
          </Text>
          {' '}{actionText}
          {item.video?.title && (
            <Text style={styles.videoTitle}> "{item.video.title}"</Text>
          )}
        </Text>
        {item.type === 'comment' && item.comment_content && (
          <Text style={styles.comment} numberOfLines={2}>
            "{item.comment_content}"
          </Text>
        )}
        <Text style={styles.time}>{formatTimeAgo(item.created_at)}</Text>
      </View>
      {item.video?.thumbnail_url ? (
        <Image
          source={{ uri: item.video.thumbnail_url }}
          style={styles.thumbnail}
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <FontAwesome name="play" size={16} color={COLORS.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ActivityScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    activities,
    isLoading,
    isRefreshing,
    error,
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
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Sign in to see your activity</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityRow item={item} onPress={() => handlePress(item)} />
        )}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        onEndReached={() => {
          if (hasMore && !isLoading) loadMore();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <FontAwesome name="bell" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No activity yet</Text>
              <Text style={styles.emptySubtext}>
                When people you follow upload videos or comment on yours, you'll see it here
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading && activities.length > 0 ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 15,
    color: COLORS.text,
  },
  name: {
    fontWeight: '600',
  },
  videoTitle: {
    color: COLORS.textMuted,
  },
  comment: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  time: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginLeft: 12,
  },
  thumbnailPlaceholder: {
    backgroundColor: COLORS.surface,
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
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  errorBanner: {
    padding: 12,
    backgroundColor: COLORS.error + '20',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
});
