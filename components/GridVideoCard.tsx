import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { VideoWithProfile } from '@/types/database';
import { COLORS } from '@/lib/constants';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type Props = {
  video: VideoWithProfile;
};

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = 8;
const TOTAL_GAP = GAP * (COLUMN_COUNT - 1);
const CARD_WIDTH = (width - 32 - TOTAL_GAP) / COLUMN_COUNT; // 32 = padding
const CARD_HEIGHT = CARD_WIDTH * 1.4; // Aspect ratio

export function GridVideoCard({ video }: Props) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);

  const handlePress = () => {
    router.push({
      pathname: '/video/[id]',
      params: { id: video.id },
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.8}>
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {video.thumbnail_url ? (
          <Image
            source={{ uri: video.thumbnail_url }}
            style={styles.thumbnail}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <FontAwesome name="play-circle" size={36} color="rgba(255,255,255,0.8)" />
          </View>
        )}

        {/* Overlay gradient effect and play icon */}
        <View style={styles.overlay}>
          <FontAwesome name="play-circle" size={32} color="rgba(255,255,255,0.9)" />
        </View>

        {/* Stats overlay - bottom left */}
        <View style={styles.statsOverlay}>
          {video.location && (
            <View style={styles.locationBadge}>
              <FontAwesome name="map-marker" size={10} color="#FFFFFF" />
              <Text style={styles.locationText} numberOfLines={1}>
                {video.location}
              </Text>
            </View>
          )}
        </View>

        {/* View count - bottom right */}
        <View style={styles.viewCountOverlay}>
          <FontAwesome name="eye" size={12} color="#FFFFFF" />
          <Text style={styles.viewCountText}>{formatCount(video.view_count)}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {video.title}
      </Text>

      {/* User info */}
      <View style={styles.userInfo}>
        {video.profiles?.avatar_url ? (
          <Image
            source={{ uri: video.profiles.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <FontAwesome name="user" size={9} color={COLORS.textMuted} />
          </View>
        )}
        <Text style={styles.username} numberOfLines={1}>
          {video.profiles?.display_name || video.profiles?.username || 'Unknown'}
        </Text>
      </View>

      {/* Like and comment counts */}
      <View style={styles.engagementRow}>
        <View style={styles.engagementItem}>
          <FontAwesome name="heart" size={11} color={COLORS.error} />
          <Text style={styles.engagementText}>{formatCount(video.like_count)}</Text>
        </View>
        <View style={styles.engagementItem}>
          <FontAwesome name="comment" size={11} color={COLORS.textMuted} />
          <Text style={styles.engagementText}>{formatCount(video.comment_count)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: GAP,
  },
  thumbnailContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    gap: 6,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '500',
    maxWidth: 80,
  },
  viewCountOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  viewCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '500',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
    lineHeight: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 11,
    color: COLORS.textMuted,
    flex: 1,
  },
  engagementRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  engagementText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
