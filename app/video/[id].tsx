import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { addComment, getVideoComments } from '@/services/comments';
import { toggleLike } from '@/services/likes';
import { isVideoSaved, toggleSave } from '@/services/saves';
import { getVideo, incrementViewCount } from '@/services/videos';
import { CommentWithProfile, VideoWithProfile } from '@/types/database';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [video, setVideo] = useState<VideoWithProfile | null>(null);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  useEffect(() => {
    loadVideo();
  }, [id]);

  const loadVideo = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const videoData = await getVideo(id);
      if (videoData) {
        setVideo(videoData);
        setIsLiked(videoData.is_liked ?? false);
        setLikeCount(videoData.like_count);

        // Check if video is saved by current user
        if (user?.id) {
          try {
            const saved = await isVideoSaved(user.id, id);
            setIsSaved(saved);
          } catch (error) {
            // Silently ignore if saves table doesn't exist yet
            setIsSaved(false);
          }
        }

        // Increment view count
        await incrementViewCount(id);

        // Load comments
        const videoComments = await getVideoComments(id);
        setComments(videoComments);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || !video) return;

    try {
      const liked = await toggleLike(user.id, video.id);
      setIsLiked(liked);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
    } catch (error) {
      Alert.alert('Error', 'Failed to like video');
    }
  };

  const handleSave = async () => {
    if (!user || !video) return;

    try {
      const saved = await toggleSave(user.id, video.id);
      setIsSaved(saved);
    } catch (error) {
      // Silently ignore save errors (table may not exist yet)
      console.log('Save not available:', error);
    }
  };

  const handleAddComment = async () => {
    if (!user || !video || !commentText.trim()) return;

    try {
      setIsPostingComment(true);
      const newComment = await addComment(user.id, video.id, commentText);
      setComments([...comments, newComment]);
      setCommentText('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsPostingComment(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!video) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Video not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="chevron-left" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Details</Text>
          <View style={styles.spacer} />
        </View>
      </SafeAreaView>
      <ScrollView style={styles.scrollView}>

        {/* Video Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {video.thumbnail_url ? (
            <Image source={{ uri: video.thumbnail_url }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <FontAwesome name="play-circle" size={64} color="rgba(255,255,255,0.8)" />
            </View>
          )}
          <View style={styles.playOverlay}>
            <FontAwesome name="play" size={48} color="rgba(255,255,255,0.9)" />
          </View>
        </View>

        {/* Video Info */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{video.title}</Text>

          {/* Creator Info */}
          <View style={styles.creatorRow}>
            {video.profiles?.avatar_url ? (
              <Image
                source={{ uri: video.profiles.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <FontAwesome name="user" size={16} color={COLORS.textMuted} />
              </View>
            )}
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>
                {video.profiles?.display_name || video.profiles?.username || 'Unknown'}
              </Text>
              <Text style={styles.creatorHandle}>
                @{video.profiles?.username || 'unknown'}
              </Text>
            </View>
          </View>

          {/* Description */}
          {video.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{video.description}</Text>
            </View>
          )}

          {/* Location */}
          {video.location && (
            <View style={styles.section}>
              <View style={styles.locationRow}>
                <FontAwesome name="map-marker" size={16} color={COLORS.primary} />
                <Text style={styles.locationText}>{video.location}</Text>
              </View>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{video.view_count}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{likeCount}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{comments.length}</Text>
              <Text style={styles.statLabel}>Comments</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <FontAwesome
                name={isLiked ? 'heart' : 'heart-o'}
                size={24}
                color={isLiked ? COLORS.error : COLORS.text}
              />
              <Text style={[styles.actionLabel, isLiked && { color: COLORS.error }]}>
                {isLiked ? 'Liked' : 'Like'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
              <FontAwesome
                name={isSaved ? 'bookmark' : 'bookmark-o'}
                size={24}
                color={isSaved ? COLORS.primary : COLORS.text}
              />
              <Text style={[styles.actionLabel, isSaved && { color: COLORS.primary }]}>
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <FontAwesome name="share-alt" size={24} color={COLORS.text} />
              <Text style={styles.actionLabel}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>

            {/* Add Comment */}
            {user && (
              <View style={styles.addCommentContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor={COLORS.textMuted}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  numberOfLines={2}
                />
                <TouchableOpacity
                  style={[
                    styles.postCommentButton,
                    (!commentText.trim() || isPostingComment) && styles.buttonDisabled,
                  ]}
                  onPress={handleAddComment}
                  disabled={!commentText.trim() || isPostingComment}
                >
                  {isPostingComment ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <FontAwesome name="send" size={16} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Comments List */}
            {comments.length > 0 ? (
              <View style={styles.commentsList}>
                {comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      {comment.profiles?.avatar_url ? (
                        <Image
                          source={{ uri: comment.profiles.avatar_url }}
                          style={styles.commentAvatar}
                        />
                      ) : (
                        <View style={[styles.commentAvatar, styles.avatarPlaceholder]}>
                          <FontAwesome name="user" size={10} color={COLORS.textMuted} />
                        </View>
                      )}
                      <View style={styles.commentInfo}>
                        <Text style={styles.commentAuthor}>
                          {comment.profiles?.display_name || comment.profiles?.username}
                        </Text>
                        <Text style={styles.commentTime}>
                          {getTimeAgo(comment.created_at)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noComments}>No comments yet. Be the first!</Text>
            )}
          </View>
        </View>
      </ScrollView>
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
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  spacer: {
    width: 40,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  infoSection: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  creatorHandle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  addCommentContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
    maxHeight: 80,
  },
  postCommentButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  commentsList: {
    gap: 16,
  },
  commentItem: {
    gap: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  commentTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  commentContent: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text,
    marginLeft: 40,
  },
  noComments: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.error,
  },
});
