
import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { addComment, getVideoComments, toggleCommentLike, pinComment, getCommentReplies } from '@/services/comments';
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
  FlatList,
  Image,
  ListRenderItem,
  Modal,
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
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [expandedCommentIds, setExpandedCommentIds] = useState<Set<string>>(new Set());

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

        // Load comments with userId if authenticated
        const videoComments = await getVideoComments(id, user?.id);
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
      const replyTargetId = replyingToCommentId; // Store the reply target before clearing
      const newComment = await addComment(user.id, video.id, commentText, replyingToCommentId || undefined);
      
      if (replyTargetId) {
        // For replies, we need to reload all comments to ensure the database state is in sync
        // This prevents the reply from appearing as a separate top-level comment after refresh
        const updatedComments = await getVideoComments(video.id, user?.id);
        setComments(updatedComments);
        
        // Find the top-level parent by looking through all loaded comments
        let topLevelId = replyTargetId;
        for (const comment of updatedComments) {
          if (comment.id === replyTargetId) {
            topLevelId = comment.id;
            break;
          }
          
          const searchReplies = (replies: CommentWithProfile[] | undefined): boolean => {
            if (!replies) return false;
            for (const reply of replies) {
              if (reply.id === replyTargetId) {
                topLevelId = comment.id;
                return true;
              }
              if (reply.replies && searchReplies(reply.replies)) {
                topLevelId = comment.id;
                return true;
              }
            }
            return false;
          };
          
          if (searchReplies(comment.replies)) {
            break;
          }
        }
        
        setExpandedCommentIds(new Set([...expandedCommentIds, topLevelId]));
        setReplyingToCommentId(null);
      } else {
        // For top-level comments, add to the beginning of the list
        setComments([newComment, ...comments]);
      }
      setCommentText('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleToggleCommentLike = async (commentId: string) => {
    if (!user) return;

    try {
      const isNowLiked = await toggleCommentLike(user.id, commentId);
      
      // Update comment like status in the list
      const updateComment = (comment: CommentWithProfile): CommentWithProfile => {
        if (comment.id === commentId) {
          return {
            ...comment,
            is_liked: isNowLiked,
            like_count: isNowLiked ? (comment.like_count || 0) + 1 : Math.max(0, (comment.like_count || 0) - 1)
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(updateComment)
          };
        }
        return comment;
      };

      setComments(prev => prev.map(updateComment));
    } catch (error: any) {
      Alert.alert('Error', 'Failed to like comment');
    }
  };

  const handlePinComment = async (commentId: string, currentPinned: boolean) => {
    if (!user || !video) return;

    // Check if user is video author
    if (user.id !== video.user_id) {
      Alert.alert('Error', 'Only the video author can pin comments');
      return;
    }

    try {
      const newPinnedStatus = !currentPinned;
      await pinComment(commentId, newPinnedStatus);

      // Update comment pinned status
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, is_pinned: newPinnedStatus }
          : c
      ));
      
      Alert.alert('Success', newPinnedStatus ? 'Comment pinned' : 'Comment unpinned');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const calculateTotalCommentCount = (commentsArray: CommentWithProfile[]): number => {
    let count = commentsArray.length;
    for (const comment of commentsArray) {
      if (comment.replies && comment.replies.length > 0) {
        count += calculateTotalCommentCount(comment.replies);
      }
    }
    return count;
  };

  const totalCommentCount = calculateTotalCommentCount(comments);

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

  const renderCommentItem: ListRenderItem<CommentWithProfile> = ({ item: comment }) => (
    <>
      {comment.is_pinned && (
        <View style={styles.pinnedBadge}>
          <FontAwesome name="thumb-tack" size={12} color={COLORS.primary} />
          <Text style={styles.pinnedText}>Pinned by author</Text>
        </View>
      )}
      <View style={styles.commentItem}>
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
            <View style={styles.authorRow}>
              <Text style={styles.commentAuthor}>
                {comment.profiles?.display_name || comment.profiles?.username}
              </Text>
              {video.user_id === comment.user_id && (
                <Text style={styles.authorBadge}>Author</Text>
              )}
            </View>
            <Text style={styles.commentTime}>
              {getTimeAgo(comment.created_at)}
            </Text>
          </View>
          {user?.id === video.user_id && (
            <TouchableOpacity 
              onPress={() => handlePinComment(comment.id, comment.is_pinned)}
              style={styles.pinButton}
            >
              <FontAwesome 
                name={comment.is_pinned ? 'thumb-tack' : 'thumb-tack'} 
                size={14} 
                color={comment.is_pinned ? COLORS.primary : COLORS.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.commentContent}>{comment.content}</Text>
        
        {/* Comment Actions */}
        <View style={styles.commentActions}>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => handleToggleCommentLike(comment.id)}
          >
            <FontAwesome 
              name={comment.is_liked ? 'heart' : 'heart-o'} 
              size={14} 
              color={comment.is_liked ? COLORS.error : COLORS.textMuted}
            />
            <Text style={[
              styles.actionText,
              comment.is_liked && { color: COLORS.error }
            ]}>
              {comment.like_count || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => setReplyingToCommentId(comment.id)}
          >
            <FontAwesome name="reply" size={14} color={COLORS.textMuted} />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>

          {(comment.replies && comment.replies.length > 0) && (
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => {
                const newExpanded = new Set(expandedCommentIds);
                if (newExpanded.has(comment.id)) {
                  newExpanded.delete(comment.id);
                } else {
                  newExpanded.add(comment.id);
                }
                setExpandedCommentIds(newExpanded);
              }}
            >
              <FontAwesome name="comments" size={14} color={COLORS.textMuted} />
              <Text style={styles.actionText}>
                {comment.replies.length} repl{comment.replies.length === 1 ? 'y' : 'ies'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Replies */}
        {expandedCommentIds.has(comment.id) && comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map(reply => (
              <View key={reply.id} style={styles.replyItem}>
                <View style={styles.replyHeader}>
                  {reply.profiles?.avatar_url ? (
                    <Image
                      source={{ uri: reply.profiles.avatar_url }}
                      style={styles.replyAvatar}
                    />
                  ) : (
                    <View style={[styles.replyAvatar, styles.avatarPlaceholder]}>
                      <FontAwesome name="user" size={8} color={COLORS.textMuted} />
                    </View>
                  )}
                  <View style={styles.replyInfo}>
                    <View style={styles.authorRow}>
                      <Text style={styles.replyAuthor}>
                        {reply.profiles?.display_name || reply.profiles?.username}
                      </Text>
                      {video.user_id === reply.user_id && (
                        <Text style={styles.authorBadge}>Author</Text>
                      )}
                    </View>
                    <Text style={styles.replyTime}>
                      {getTimeAgo(reply.created_at)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.replyContent}>{reply.content}</Text>
                
                {/* Reply Actions */}
                <View style={styles.replyActions}>
                  <TouchableOpacity 
                    style={styles.replyActionItem}
                    onPress={() => handleToggleCommentLike(reply.id)}
                  >
                    <FontAwesome 
                      name={reply.is_liked ? 'heart' : 'heart-o'} 
                      size={12} 
                      color={reply.is_liked ? COLORS.error : COLORS.textMuted}
                    />
                    <Text style={[
                      styles.replyActionText,
                      reply.is_liked && { color: COLORS.error }
                    ]}>
                      {reply.like_count || 0}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.replyActionItem}
                    onPress={() => setReplyingToCommentId(reply.id)}
                  >
                    <FontAwesome name="reply" size={12} color={COLORS.textMuted} />
                    <Text style={styles.replyActionText}>Reply</Text>
                  </TouchableOpacity>

                  {(reply.replies && reply.replies.length > 0) && (
                    <TouchableOpacity 
                      style={styles.replyActionItem}
                      onPress={() => {
                        const newExpanded = new Set(expandedCommentIds);
                        if (newExpanded.has(reply.id)) {
                          newExpanded.delete(reply.id);
                        } else {
                          newExpanded.add(reply.id);
                        }
                        setExpandedCommentIds(newExpanded);
                      }}
                    >
                      <FontAwesome name="comments" size={12} color={COLORS.textMuted} />
                      <Text style={styles.replyActionText}>
                        {reply.replies.length} repl{reply.replies.length === 1 ? 'y' : 'ies'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Nested Replies */}
                {expandedCommentIds.has(reply.id) && reply.replies && reply.replies.length > 0 && (
                  <View style={styles.nestedRepliesContainer}>
                    {reply.replies.map(nestedReply => (
                      <View key={nestedReply.id} style={styles.nestedReplyItem}>
                        <View style={styles.nestedReplyHeader}>
                          {nestedReply.profiles?.avatar_url ? (
                            <Image
                              source={{ uri: nestedReply.profiles.avatar_url }}
                              style={styles.nestedReplyAvatar}
                            />
                          ) : (
                            <View style={[styles.nestedReplyAvatar, styles.avatarPlaceholder]}>
                              <FontAwesome name="user" size={6} color={COLORS.textMuted} />
                            </View>
                          )}
                          <View style={styles.nestedReplyInfo}>
                            <View style={styles.authorRow}>
                              <Text style={styles.nestedReplyAuthor}>
                                {nestedReply.profiles?.display_name || nestedReply.profiles?.username}
                              </Text>
                              {video.user_id === nestedReply.user_id && (
                                <Text style={styles.authorBadge}>Author</Text>
                              )}
                            </View>
                            <Text style={styles.nestedReplyTime}>
                              {getTimeAgo(nestedReply.created_at)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.nestedReplyContent}>{nestedReply.content}</Text>
                        
                        {/* Nested Reply Actions */}
                        <View style={styles.nestedReplyActions}>
                          <TouchableOpacity 
                            style={styles.replyActionItem}
                            onPress={() => handleToggleCommentLike(nestedReply.id)}
                          >
                            <FontAwesome 
                              name={nestedReply.is_liked ? 'heart' : 'heart-o'} 
                              size={11} 
                              color={nestedReply.is_liked ? COLORS.error : COLORS.textMuted}
                            />
                            <Text style={[
                              styles.nestedReplyActionText,
                              nestedReply.is_liked && { color: COLORS.error }
                            ]}>
                              {nestedReply.like_count || 0}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={styles.replyActionItem}
                            onPress={() => setReplyingToCommentId(nestedReply.id)}
                          >
                            <FontAwesome name="reply" size={11} color={COLORS.textMuted} />
                            <Text style={styles.nestedReplyActionText}>Reply</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  );

  const headerComponent = (
    <>
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
            <Text style={styles.statValue}>{totalCommentCount}</Text>
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

        {/* Comments Header */}
        <View style={styles.commentsHeader}>
          <Text style={styles.sectionTitle}>Comments ({totalCommentCount})</Text>
        </View>

        {/* Add Comment */}
        {user && (
          <View>
            {replyingToCommentId && (
              <View style={styles.replyingToContext}>
                <FontAwesome name="reply" size={14} color={COLORS.primary} />
                <Text style={styles.replyingToText}>Replying to comment</Text>
                <TouchableOpacity onPress={() => setReplyingToCommentId(null)}>
                  <FontAwesome name="times" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder={replyingToCommentId ? "Write a reply..." : "Add a comment..."}
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
          </View>
        )}
      </View>
    </>
  );

  const emptyCommentsComponent = (
    <View style={styles.emptyCommentsContainer}>
      <Text style={styles.noComments}>No comments yet. Be the first!</Text>
    </View>
  );

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
      <FlatList
        data={comments}
        renderItem={renderCommentItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={emptyCommentsComponent}
        contentContainerStyle={styles.flatListContent}
        scrollEventThrottle={16}
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
  flatListContent: {
    paddingBottom: 24,
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
  commentsHeader: {
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
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
    paddingHorizontal: 16,
  },
  replyingToContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: `${COLORS.primary}15`,
    marginBottom: 8,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  replyingToText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  emptyCommentsContainer: {
    paddingHorizontal: 16,
  },
  noComments: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: `${COLORS.primary}15`,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  pinnedText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorBadge: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: `${COLORS.primary}20`,
    borderRadius: 4,
  },
  pinButton: {
    padding: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
    marginLeft: 40,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  repliesContainer: {
    marginTop: 12,
    paddingLeft: 40,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    marginLeft: 16,
    paddingRight: 0,
  },
  replyItem: {
    gap: 8,
    paddingVertical: 12,
    paddingRight: 16,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  replyInfo: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  replyTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  replyContent: {
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.text,
    marginLeft: 32,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 32,
    marginTop: 6,
  },
  replyActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyActionText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  nestedRepliesContainer: {
    marginTop: 12,
    paddingLeft: 24,
    borderLeftWidth: 1,
    borderLeftColor: `${COLORS.border}80`,
    marginLeft: 8,
    paddingRight: 0,
  },
  nestedReplyItem: {
    gap: 6,
    paddingVertical: 8,
    paddingRight: 8,
  },
  nestedReplyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  nestedReplyAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  nestedReplyInfo: {
    flex: 1,
  },
  nestedReplyAuthor: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  nestedReplyTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  nestedReplyContent: {
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.text,
    marginLeft: 26,
  },
  nestedReplyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 26,
    marginTop: 4,
  },
  nestedReplyActionText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.error,
  },
});
