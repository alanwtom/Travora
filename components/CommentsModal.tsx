import { COLORS } from '@/lib/constants';
import { addComment, getVideoComments, toggleCommentLike, getCommentReplies } from '@/services/comments';
import { CommentWithProfile, VideoWithProfile } from '@/types/database';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  video: VideoWithProfile;
  userId?: string;
  onClose: () => void;
};

export function CommentsModal({ visible, video, userId, onClose }: Props) {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [expandedCommentIds, setExpandedCommentIds] = useState<Set<string>>(new Set());
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      loadComments();
    }
  }, [visible]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const videoComments = await getVideoComments(video.id, userId);
      setComments(videoComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!userId || !commentText.trim()) return;

    try {
      setIsPostingComment(true);
      const newComment = await addComment(userId, video.id, commentText, replyingToCommentId || undefined);

      if (newComment) {
        if (replyingToCommentId) {
          // Update replies for the parent comment
          setComments(comments.map(c => {
            if (c.id === replyingToCommentId) {
              return {
                ...c,
                replies: [newComment, ...(c.replies || [])]
              };
            }
            return c;
          }));
        } else {
          // Add to main comments list
          setComments([newComment, ...comments]);
        }
        setCommentText('');
        setReplyingToCommentId(null);
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleCommentLike = async (commentId: string, isLiked: boolean) => {
    if (!userId) return;

    try {
      await toggleCommentLike(userId, commentId);
      
      setComments(comments.map(c => 
        c.id === commentId 
          ? {
              ...c,
              is_liked: !c.is_liked,
              like_count: (c.like_count || 0) + (isLiked ? -1 : 1)
            }
          : c
      ));
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const toggleExpandReplies = async (commentId: string) => {
    const newExpanded = new Set(expandedCommentIds);
    
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      // Load replies if not already loaded
      const comment = comments.find(c => c.id === commentId);
      if (!comment?.replies || comment.replies.length === 0) {
        try {
          const newLoadingReplies = new Set(loadingReplies);
          newLoadingReplies.add(commentId);
          setLoadingReplies(newLoadingReplies);
          
          const replies = await getCommentReplies(commentId, userId);
          
          setComments(comments.map(c =>
            c.id === commentId
              ? { ...c, replies }
              : c
          ));
          
          newLoadingReplies.delete(commentId);
          setLoadingReplies(newLoadingReplies);
        } catch (error) {
          console.error('Failed to load replies:', error);
        }
      }
      newExpanded.add(commentId);
    }
    
    setExpandedCommentIds(newExpanded);
  };

  const renderComment = ({ item }: { item: CommentWithProfile }) => (
    <View>
      <View style={styles.commentItem}>
        <Image
          source={{ uri: item.profiles?.avatar_url || '' }}
          style={styles.avatar}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.username}>{item.profiles?.display_name || item.profiles?.username || 'Unknown'}</Text>
            {item.profiles?.id === video.user_id && (
              <Text style={styles.creatorBadge}>Creator</Text>
            )}
          </View>
          <Text style={styles.commentText}>{item.content}</Text>
          <Text style={styles.timestamp}>{item.created_at}</Text>
          {/* Reply button */}
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => setReplyingToCommentId(item.id)}
          >
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => handleCommentLike(item.id, item.is_liked || false)}
        >
          <FontAwesome
            name={item.is_liked ? 'heart' : 'heart-o'}
            size={18}
            color={item.is_liked ? COLORS.error : 'rgba(0,0,0,0.5)'}
          />
          {item.like_count > 0 && (
            <Text style={styles.likeCount}>{item.like_count}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Replies section */}
      {item.replies && item.replies.length > 0 && (
        <View>
          <TouchableOpacity
            style={styles.viewRepliesButton}
            onPress={() => toggleExpandReplies(item.id)}
          >
            <Text style={styles.viewRepliesText}>
              {expandedCommentIds.has(item.id) ? 'Hide' : 'View'} {item.replies.length} {item.replies.length === 1 ? 'reply' : 'replies'}
            </Text>
          </TouchableOpacity>

          {expandedCommentIds.has(item.id) && (
            <View style={styles.repliesContainer}>
              {item.replies.map((reply) => (
                <View key={reply.id} style={styles.replyItem}>
                  <Image
                    source={{ uri: reply.profiles?.avatar_url || '' }}
                    style={[styles.avatar, styles.replyAvatar]}
                  />
                  <View style={styles.replyContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.username}>{reply.profiles?.display_name || reply.profiles?.username || 'Unknown'}</Text>
                      {reply.profiles?.id === video.user_id && (
                        <Text style={styles.creatorBadge}>Creator</Text>
                      )}
                    </View>
                    <Text style={styles.commentText}>{reply.content}</Text>
                    <Text style={styles.timestamp}>{reply.created_at}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleCommentLike(reply.id, reply.is_liked || false)}
                  >
                    <FontAwesome
                      name={reply.is_liked ? 'heart' : 'heart-o'}
                      size={16}
                      color={reply.is_liked ? COLORS.error : 'rgba(0,0,0,0.5)'}
                    />
                    {reply.like_count > 0 && (
                      <Text style={styles.likeCount}>{reply.like_count}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{comments.length} comments</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {isLoading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentsList}
            />
          )}

          {/* Comment Input */}
          {userId && (
            <View style={styles.inputContainer}>
              {replyingToCommentId && (
                <View style={styles.replyingToContainer}>
                  <Text style={styles.replyingToText}>
                    Replying to {comments.find(c => c.id === replyingToCommentId)?.profiles?.display_name || 'a comment'}
                  </Text>
                  <TouchableOpacity onPress={() => setReplyingToCommentId(null)}>
                    <FontAwesome name="close" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder={replyingToCommentId ? "Write a reply..." : "Add comment..."}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  editable={!isPostingComment}
                />
                <TouchableOpacity
                  style={[styles.postButton, !commentText.trim() && styles.postButtonDisabled]}
                  onPress={handlePostComment}
                  disabled={!commentText.trim() || isPostingComment}
                >
                  {isPostingComment ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <FontAwesome name="send" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  commentsList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  creatorBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  likeCount: {
    fontSize: 11,
    color: COLORS.error,
    marginTop: 2,
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000',
    maxHeight: 100,
  },
  postButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  replyButton: {
    marginTop: 6,
  },
  replyButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  viewRepliesButton: {
    marginLeft: 50,
    marginVertical: 8,
    paddingVertical: 4,
  },
  viewRepliesText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  repliesContainer: {
    paddingLeft: 50,
    paddingBottom: 12,
  },
  replyItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
    gap: 12,
  },
  replyAvatar: {
    width: 32,
    height: 32,
  },
  replyContent: {
    flex: 1,
  },
});
