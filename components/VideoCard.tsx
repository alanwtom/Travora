import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { toggleLike } from '@/services/likes';
import { toggleSave } from '@/services/saves';
import { VideoWithProfile } from '@/types/database';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type Props = {
  video: VideoWithProfile;
};

export function VideoCard({ video }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(video.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(video.like_count);
  const [isSaved, setIsSaved] = useState(video.is_saved ?? false);

  const handleLike = async () => {
    if (!user) return;

    try {
      const liked = await toggleLike(user.id, video.id);
      setIsLiked(liked);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
    } catch (error) {
      // Silently fail
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const saved = await toggleSave(user.id, video.id);
      setIsSaved(saved);
    } catch (error) {
      // Silently fail
    }
  };

  const handleVideoPress = () => {
    router.push({
      pathname: '/video/[id]',
      params: { id: video.id },
    });
  };

  const timeAgo = getTimeAgo(video.created_at);

  return (
    <View style={styles.card}>
      {/* Thumbnail */}
      <TouchableOpacity style={styles.thumbnailContainer} onPress={handleVideoPress}>
        {video.thumbnail_url ? (
          <Image source={{ uri: video.thumbnail_url }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <FontAwesome name="play-circle" size={48} color="rgba(255,255,255,0.8)" />
          </View>
        )}
        {/* Location badge */}
        {video.location && (
          <View style={styles.locationBadge}>
            <FontAwesome name="map-marker" size={10} color="#FFFFFF" />
            <Text style={styles.locationBadgeText}>{video.location}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.info}>
        {/* User row */}
        <View style={styles.userRow}>
          {video.profiles?.avatar_url ? (
            <Image
              source={{ uri: video.profiles.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <FontAwesome name="user" size={12} color={COLORS.textMuted} />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.title} numberOfLines={1}>
              {video.title}
            </Text>
            <Text style={styles.username}>
              {video.profiles?.display_name || video.profiles?.username || 'Unknown'}
              {' · '}
              {timeAgo}
            </Text>
          </View>
        </View>

        {/* Caption */}
        {video.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            {video.caption}
          </Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <FontAwesome
              name={isLiked ? 'heart' : 'heart-o'}
              size={16}
              color={isLiked ? COLORS.error : COLORS.textMuted}
            />
            <Text style={[styles.actionText, isLiked && { color: COLORS.error }]}>
              {likeCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <FontAwesome name="comment-o" size={16} color={COLORS.textMuted} />
            <Text style={styles.actionText}>{video.comment_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
            <FontAwesome
              name={isSaved ? 'bookmark' : 'bookmark-o'}
              size={16}
              color={isSaved ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.actionText, isSaved && { color: COLORS.primary }]}>
              {isSaved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <FontAwesome name="eye" size={16} color={COLORS.textMuted} />
            <Text style={styles.actionText}>{video.view_count}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / 604800)}w`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  thumbnailPlaceholder: {
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  info: {
    padding: 12,
    gap: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  username: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  caption: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
