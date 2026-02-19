import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { toggleLike } from '@/services/likes';
import { toggleSave } from '@/services/saves';
import { incrementViewCount } from '@/services/videos';
import { VideoWithProfile } from '@/types/database';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Video } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type Props = {
  video: VideoWithProfile;
  isActive: boolean;
};

const { height, width } = Dimensions.get('window');

export function VerticalVideoCard({ video, isActive }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<any>(null);
  
  const [isLiked, setIsLiked] = useState(video.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(video.like_count);
  const [isSaved, setIsSaved] = useState(video.is_saved ?? false);
  const [isPlaying, setIsPlaying] = useState(isActive);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const hasIncrementedView = useRef(false);

  // Auto-play/pause based on active state
  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.playAsync();
      setIsPlaying(true);

      // Increment view count on first play
      if (!hasIncrementedView.current) {
        incrementViewCount(video.id).catch(() => {
          // Silently fail
        });
        hasIncrementedView.current = true;
      }
    } else if (!isActive && videoRef.current) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, [isActive, video.id]);

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

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      // Silently fail
    }
  };

  const handleUserProfile = () => {
    if (video.user_id === user?.id) {
      router.push('/profile');
    } else {
      // Navigate to user's profile - you may need to create a dynamic route for this
      router.push({
        pathname: '/video/[id]',
        params: { id: video.id },
      });
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
    <View style={styles.container}>
      {/* Video Player */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={togglePlayPause}
        style={styles.videoWrapper}
      >
        {video.video_url ? (
          <>
            <Video
              ref={videoRef}
              source={{ uri: video.video_url }}
              style={styles.video}
              isLooping
              onLoadStart={() => setIsLoadingVideo(true)}
              onLoad={(status: any) => {
                setIsLoadingVideo(false);
                if (status.durationMillis) {
                  setVideoDuration(status.durationMillis / 1000);
                }
              }}
              onPlaybackStatusUpdate={(status: any) => {
                if (status.isLoaded) {
                  setCurrentTime((status.positionMillis ?? 0) / 1000);
                }
              }}
              progressUpdateIntervalMillis={500}
            />
            {isLoadingVideo && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}
            {!isPlaying && !isLoadingVideo && (
              <View style={styles.pauseOverlay}>
                <FontAwesome name="play" size={64} color="rgba(255,255,255,0.9)" />
              </View>
            )}
          </>
        ) : (
          <View style={[styles.video, styles.videoPlaceholder]}>
            <FontAwesome name="play-circle" size={64} color={COLORS.primary} />
          </View>
        )}

        {/* Progress bar */}
        {videoDuration > 0 && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(currentTime / videoDuration) * 100}%` },
              ]}
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Bottom Content Overlay */}
      <View style={styles.contentOverlay}>
        {/* Left side - User info and description */}
        <View style={styles.leftContent}>
          {/* User Info */}
          <TouchableOpacity
            style={styles.userRow}
            onPress={handleUserProfile}
            activeOpacity={0.7}
          >
            {video.profiles?.avatar_url ? (
              <Image
                source={{ uri: video.profiles.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <FontAwesome name="user" size={14} color={COLORS.textMuted} />
              </View>
            )}
            <View>
              <Text style={styles.username} numberOfLines={1}>
                {video.profiles?.display_name || video.profiles?.username || 'Unknown'}
              </Text>
              <Text style={styles.timestamp}>{timeAgo}</Text>
            </View>
          </TouchableOpacity>

          {/* Title and Caption */}
          {video.title && (
            <Text style={styles.title} numberOfLines={2}>
              {video.title}
            </Text>
          )}
          {video.caption && (
            <Text style={styles.caption} numberOfLines={3}>
              {video.caption}
            </Text>
          )}

          {/* Location */}
          {video.location && (
            <View style={styles.locationRow}>
              <FontAwesome name="map-marker" size={12} color={COLORS.primary} />
              <Text style={styles.location}>{video.location}</Text>
            </View>
          )}
        </View>

        {/* Right side - Action buttons */}
        <View style={styles.rightContent}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <FontAwesome
              name={isLiked ? 'heart' : 'heart-o'}
              size={28}
              color={isLiked ? COLORS.error : 'rgba(255,255,255,0.8)'}
            />
            <Text style={styles.actionLabel}>{likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <FontAwesome name="comment-o" size={28} color="rgba(255,255,255,0.8)" />
            <Text style={styles.actionLabel}>{video.comment_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <FontAwesome
              name={isSaved ? 'bookmark' : 'bookmark-o'}
              size={28}
              color={isSaved ? COLORS.primary : 'rgba(255,255,255,0.8)'}
            />
            <Text style={styles.actionLabel}>{isSaved ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleVideoPress}
            activeOpacity={0.7}
          >
            <FontAwesome name="share-square-o" size={28} color="rgba(255,255,255,0.8)" />
            <Text style={styles.actionLabel}>Share</Text>
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
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

const styles = StyleSheet.create({
  container: {
    height: height,
    width: width,
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  videoWrapper: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    flex: 1,
    width: '100%',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 12,
    marginRight: 12,
  },
  rightContent: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    maxWidth: 200,
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  location: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
});
