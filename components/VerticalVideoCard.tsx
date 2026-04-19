import { useFollow } from '@/hooks/useFollow';
import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { useVideoMute } from '@/providers/VideoMuteProvider';
import { toggleLike } from '@/services/likes';
import { PersonalizedFeedVideo } from '@/services/personalizedFeed';
import { toggleSave } from '@/services/saves';
import { incrementViewCount } from '@/services/videos';
import * as Icons from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { useFocusEffect, useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CommentsModal } from './CommentsModal';
import { RatingsModal } from './RatingsModal';
import { ReviewsModal } from './ReviewsModal';
import { ReviewSubmitModal } from './ReviewSubmitModal';
import { ShareModal } from './ShareModal';

type Props = {
  video: PersonalizedFeedVideo;
  isActive: boolean;
  fullScreen?: boolean;
  onSwipeDecision?: (direction: 'left' | 'right', video: PersonalizedFeedVideo) => void;
};

const { height, width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 78 : 64;

export function VerticalVideoCard({ video, isActive, fullScreen, onSwipeDecision }: Props) {
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
  const availableHeight = fullScreen ? height : height - TAB_BAR_HEIGHT;
  
  const [isLiked, setIsLiked] = useState(video.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(video.like_count);
  const [isSaved, setIsSaved] = useState(video.is_saved ?? false);
  const [isPlaying, setIsPlaying] = useState(isActive);
  const { isMuted, setMuted: setGlobalMuted } = useVideoMute();
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showRatingsModal, setShowRatingsModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showReviewSubmitModal, setShowReviewSubmitModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [posterUri, setPosterUri] = useState<string | null>(video.thumbnail_url ?? null);
  const hasIncrementedView = useRef(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Generate a thumbnail from the video if none exists
  useEffect(() => {
    if (posterUri || !video.video_url) return;
    let cancelled = false;
    VideoThumbnails.getThumbnailAsync(video.video_url, { time: 1000 })
      .then(({ uri }) => {
        if (!cancelled) setPosterUri(uri);
      })
      .catch((e) => {
        console.warn('Thumbnail generation failed for', video.id, e?.message);
      });
    return () => { cancelled = true; };
  }, [video.video_url]);

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
        incrementViewCount(video.id).catch((err) => {
          console.warn('Failed to increment view count:', err);
        });
        hasIncrementedView.current = true;
      }
    } else if (!shouldBePlaying && videoRef.current) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, [isActive, isScreenFocused, video.id]);

  // Sync mute state from global context to the video player
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.setIsMutedAsync(isMuted).catch((err) => {
        console.warn('Failed to set mute state:', err);
      });
    }
  }, [isMuted]);

  const handleLike = useCallback(async () => {
    if (!user) return;

    try {
      const liked = await toggleLike(user.id, video.id);
      setIsLiked(liked);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
    } catch (error) {
      console.warn('Failed to toggle like:', error);
    }
  }, [user, video.id]);

  const handleSave = async () => {
    if (!user) return;

    try {
      const saved = await toggleSave(user.id, video.id);
      setIsSaved(saved);
    } catch (error) {
      console.warn('Failed to toggle save:', error);
    }
  };

  const togglePlayPause = useCallback(async () => {
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
      console.warn('Failed to toggle play/pause:', error);
    }
  }, [isPlaying]);

  const toggleMute = async () => {
    if (!videoRef.current) return;

    try {
      const newMuted = !isMuted;
      await videoRef.current.setIsMutedAsync(newMuted);
      setGlobalMuted(newMuted);
    } catch (error) {
      console.warn('Failed to toggle mute:', error);
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

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCommentPress = () => {
    setShowCommentsModal(true);
  };

  const handleRatingPress = () => {
    if (!user) return;
    setShowRatingsModal(true);
  };

  const handleReviewsPress = () => {
    setShowReviewsModal(true);
  };

  const handleWriteReviewPress = () => {
    setShowReviewSubmitModal(true);
    setShowRatingsModal(false);
  };

  const timeAgo = getTimeAgo(video.created_at);
  const tags = (video.tags ?? []).filter(Boolean);
  const recommendationTag = video.score > 0 ? tags[0] : null;
  const locations = (video.locations ?? []).filter(Boolean);
  const SWIPE_THRESHOLD = width * 0.2;
  const SWIPE_OUT = width * 1.2;

  const handleSwipeDecisionInternal = useCallback(
    (direction: 'left' | 'right') => {
      onSwipeDecision?.(direction, video);
    },
    [onSwipeDecision, video]
  );

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.06;
    })
    .onEnd((e) => {
      const goRight = translateX.value > SWIPE_THRESHOLD || e.velocityX > 900;
      const goLeft = translateX.value < -SWIPE_THRESHOLD || e.velocityX < -900;
      if (goRight || goLeft) {
        translateX.value = withTiming(goRight ? SWIPE_OUT : -SWIPE_OUT, { duration: 180 }, () => {
          runOnJS(handleSwipeDecisionInternal)(goRight ? 'right' : 'left');
          translateX.value = 0;
          translateY.value = 0;
        });
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 240 });
        translateY.value = withSpring(0, { damping: 18, stiffness: 240 });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-width, 0, width], [-12, 0, 12], 'clamp');
    return {
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotateZ: `${rotate}deg` }],
    };
  });

  const likeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
  }));

  const passOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
  }));

  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
          runOnJS(handleLike)();
        }),
    [handleLike]
  );

  const singleTap = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(1)
        .onEnd(() => {
          runOnJS(togglePlayPause)();
        }),
    [togglePlayPause]
  );

  const videoTapGesture = useMemo(() => Gesture.Exclusive(doubleTap, singleTap), [doubleTap, singleTap]);

  return (
    <GestureDetector gesture={pan}>
    <Animated.View style={[styles.container, { height: availableHeight }, cardAnimatedStyle]}>
      {/* Video Player: single tap = play/pause, double tap / double-click = like (same as heart button) */}
      <GestureDetector gesture={videoTapGesture}>
      <View style={styles.videoWrapper}>
        {video.video_url ? (
          <>
            <Video
              ref={videoRef}
              source={{ uri: video.video_url }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              isLooping
              isMuted={isMuted}
              usePoster={!!posterUri}
              posterSource={posterUri ? { uri: posterUri } : undefined}
              posterStyle={{ resizeMode: 'cover' }}
              onLoadStart={() => setIsLoadingVideo(true)}
              onReadyForDisplay={() => setIsLoadingVideo(false)}
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
                {posterUri && (
                  <Image source={{ uri: posterUri }} style={styles.posterImage} />
                )}
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}
            {!isPlaying && !isLoadingVideo && (
              <View style={styles.pauseOverlay}>
                {posterUri && (
                  <Image source={{ uri: posterUri }} style={styles.posterImage} />
                )}
                <Icons.Play size={64} color="rgba(255,255,255,0.9)" fill="rgba(255,255,255,0.2)" strokeWidth={2} />
              </View>
            )}
          </>
        ) : (
          <View style={[styles.video, styles.videoPlaceholder]}>
            <Icons.PlayCircle size={64} color={COLORS.primary} fill="rgba(255,255,255,0.2)" strokeWidth={2} />
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
      </View>
      </GestureDetector>

      <Animated.View pointerEvents="none" style={[styles.swipeOverlay, styles.likeSwipeOverlay, likeOverlayStyle]}>
        <Icons.Heart size={62} color={COLORS.success} fill={COLORS.success} strokeWidth={1.5} />
        <Text style={styles.swipeOverlayTextLike}>SAVE</Text>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.swipeOverlay, styles.passSwipeOverlay, passOverlayStyle]}>
        <Icons.X size={62} color={COLORS.error} strokeWidth={3} />
        <Text style={styles.swipeOverlayTextPass}>PASS</Text>
      </Animated.View>

      {/* Bottom Content Overlay */}
      <View style={styles.contentOverlay}>
        {/* Mute button overlay */}
        <TouchableOpacity
          style={styles.muteButton}
          onPress={toggleMute}
          activeOpacity={0.7}
        >
          {isMuted ? (
            <Icons.VolumeX size={20} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
          ) : (
            <Icons.Volume2 size={20} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
          )}
        </TouchableOpacity>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          locations={[0.3, 1]}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />
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
                  <Icons.User size={14} color={COLORS.textMuted} strokeWidth={2} />
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
              <Icons.MapPin size={14} color="#FF3B30" strokeWidth={2.5} fill="rgba(255,59,48,0.2)" />
              <Text style={styles.location}>{video.location}</Text>
            </View>
          )}

          {/* Tagged Locations */}
          {locations.length > 0 && (
            <View style={styles.locationsRow}>
              {locations.slice(0, 3).map((loc) => (
                <View key={loc} style={styles.locationChip}>
                  <Icons.MapPin size={10} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
                  <Text style={styles.locationChipText}>{loc}</Text>
                </View>
              ))}
              {locations.length > 3 && (
                <Text style={styles.locationMore}>+{locations.length - 3}</Text>
              )}
            </View>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
              {tags.length > 3 && (
                <Text style={styles.tagMore}>+{tags.length - 3}</Text>
              )}
            </View>
          )}
          {recommendationTag ? (
            <Text style={styles.recommendationText}>Recommended by #{recommendationTag}</Text>
          ) : null}
        </View>

        {/* Right side - Action buttons */}
        <View style={styles.rightContent}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Icons.Heart
              size={28}
              color={isLiked ? COLORS.error : 'rgba(255,255,255,0.8)'}
              fill={isLiked ? COLORS.error : 'none'}
              strokeWidth={isLiked ? 0 : 2}
            />
            <Text style={styles.actionLabel}>{likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCommentPress}
            activeOpacity={0.7}
          >
            <Icons.MessageCircle size={28} color="rgba(255,255,255,0.8)" strokeWidth={2} />
            <Text style={styles.actionLabel}>{video.comment_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRatingPress}
            activeOpacity={0.7}
          >
            <Icons.Star size={28} color="rgba(255,255,255,0.8)" fill="none" strokeWidth={2} />
            <Text style={styles.actionLabel}>Rate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Icons.Bookmark
              size={28}
              color={isSaved ? COLORS.accent : 'rgba(255,255,255,0.8)'}
              fill={isSaved ? COLORS.accent : 'none'}
              strokeWidth={isSaved ? 0 : 2}
            />
            <Text style={[styles.actionLabel, isSaved && { color: COLORS.accent }]}>{isSaved ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Icons.Share2 size={28} color="rgba(255,255,255,0.8)" strokeWidth={2} />
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

      <RatingsModal
        visible={showRatingsModal}
        video={video}
        userId={user?.id}
        onClose={() => setShowRatingsModal(false)}
        onWriteReview={handleWriteReviewPress}
        onViewReviews={handleReviewsPress}
      />

      <ReviewsModal
        visible={showReviewsModal}
        video={video}
        userId={user?.id}
        onClose={() => setShowReviewsModal(false)}
      />

      <ReviewSubmitModal
        visible={showReviewSubmitModal}
        video={video}
        userId={user?.id}
        onClose={() => setShowReviewSubmitModal(false)}
        onSubmitted={() => {
          setShowReviewSubmitModal(false);
          // Reload reviews if reviews modal is open
          if (showReviewsModal) {
            handleReviewsPress();
          }
        }}
      />
      
      <ShareModal
        visible={showShareModal}
        contentType="video"
        contentId={video.id}
        contentTitle={video.title}
        onClose={() => setShowShareModal(false)}
      />
    </Animated.View>
    </GestureDetector>
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
    overflow: 'hidden',
  },
  posterImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'cover',
    opacity: 0.4,
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
    overflow: 'hidden',
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
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  muteButton: {
    position: 'absolute',
    top: 80,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 1)',
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
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  caption: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.7)',
  },
  tagText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
  tagMore: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  recommendationText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontStyle: 'italic',
    marginTop: 2,
  },
  locationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.7)',
  },
  locationChipText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
  locationMore: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    alignSelf: 'center',
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
  swipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  likeSwipeOverlay: {
    backgroundColor: 'rgba(106,175,114,0.12)',
    borderColor: COLORS.success,
  },
  passSwipeOverlay: {
    backgroundColor: 'rgba(212,100,90,0.12)',
    borderColor: COLORS.error,
  },
  swipeOverlayTextLike: {
    marginTop: 10,
    color: COLORS.success,
    fontWeight: '800',
    fontSize: 26,
    letterSpacing: 1.5,
  },
  swipeOverlayTextPass: {
    marginTop: 10,
    color: COLORS.error,
    fontWeight: '800',
    fontSize: 26,
    letterSpacing: 1.5,
  },
});
