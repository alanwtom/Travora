import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { useFollow } from '@/hooks/useFollow';
import { toggleLike } from '@/services/likes';
import { toggleSave } from '@/services/saves';
import { incrementViewCount } from '@/services/videos';
import { VideoWithProfile } from '@/types/database';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Video } from 'expo-av';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommentsModal } from './CommentsModal';

type Props = {
  video: VideoWithProfile;
  isActive: boolean;
};

const { height, width } = Dimensions.get('window');
const BOTTOM_SAFE_AREA = Platform.OS === 'ios' ? 80 : 0;

export function VerticalVideoCard({ video, isActive }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<any>(null);
  const { isFollowing, toggle, isLoading: followLoading } = useFollow(
    user?.id,
    video.user_id
  );
  const showFollowButton = user?.id && video.user_id !== user.id;
  
  // Calculate the available height accounting for the tab bar
  const availableHeight = height - insets.bottom;
  
  const [isLiked, setIsLiked] = useState(video.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(video.like_count);
  const [isSaved, setIsSaved] = useState(video.is_saved ?? false);
  const [isPlaying, setIsPlaying] = useState(isActive);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
<<<<<<< HEAD
  const [showCommentsModal, setShowCommentsModal] = useState(false);
=======
  const [isScreenFocused, setIsScreenFocused] = useState(true);
>>>>>>> 667a73a459e95d68d3cb9354a0f5b8f483689732
  const hasIncrementedView = useRef(false);

  // Handle screen focus (tab switching)
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  // Auto-play/pause based on active state and screen focus
  useEffect(() => {
    const shouldBePlaying = isActive && isScreenFocused;

    if (shouldBePlaying && videoRef.current) {
      videoRef.current.playAsync();
      setIsPlaying(true);

      // Increment view count on first play
      if (!hasIncrementedView.current) {
        incrementViewCount(video.id).catch(() => {
          // Silently fail
        });
        hasIncrementedView.current = true;
      }
    } else if (!shouldBePlaying && videoRef.current) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, [isActive, isScreenFocused, video.id]);

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
      router.push('/(tabs)/profile');
    } else {
      router.push({
        pathname: '/user/[userId]',
        params: { userId: video.user_id },
      } as any);
    }
  };

  const handleVideoPress = () => {
    router.push({
      pathname: '/video/[id]',
      params: { id: video.id },
    });
  };

  const handleCommentPress = () => {
    setShowCommentsModal(true);
  };

  const timeAgo = getTimeAgo(video.created_at);

  return (
    <View style={[styles.container, { height: availableHeight, marginTop: -insets.top }]}>
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
          <View style={styles.userRow}>
            <TouchableOpacity
              style={styles.userInfoTouchable}
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
            {showFollowButton && (
              <TouchableOpacity
                style={[styles.followButton, isFollowing && styles.followingButton]}
                onPress={toggle}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

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
              <FontAwesome name="map-marker" size={14} color="#FF3B30" />
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

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleCommentPress}
            activeOpacity={0.7}
          >
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

      <CommentsModal
        visible={showCommentsModal}
        video={video}
        userId={user?.id}
        onClose={() => setShowCommentsModal(false)}
      />
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
<<<<<<< HEAD
    paddingBottom: 80,
=======
    paddingBottom: BOTTOM_SAFE_AREA + 16,
>>>>>>> 667a73a459e95d68d3cb9354a0f5b8f483689732
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
    paddingBottom: 0,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  userInfoTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  followButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  followingButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followingButtonText: {
    color: '#FFFFFF',
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
<<<<<<< HEAD
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
=======
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
>>>>>>> 667a73a459e95d68d3cb9354a0f5b8f483689732
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
