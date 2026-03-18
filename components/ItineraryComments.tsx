/**
 * ItineraryComments Component
 *
 * Displays and manages comments for a shared itinerary.
 * Shows all collaborators' comments with avatars and timestamps.
 */

import { COLORS } from '@/lib/constants';
import {
  addItineraryComment,
  deleteItineraryComment,
  getItineraryComments,
  updateItineraryComment,
} from '@/services/itineraryComments';
import { ItineraryCommentWithProfile } from '@/types/database';
import * as Icons from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  itineraryId: string;
  userId?: string;
  onClose: () => void;
};

type EditingState = {
  commentId: string;
  content: string;
} | null;

export function ItineraryComments({ visible, itineraryId, userId, onClose }: Props) {
  const [comments, setComments] = useState<ItineraryCommentWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [editingComment, setEditingComment] = useState<EditingState>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (visible) {
      loadComments();
    }
  }, [visible]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const data = await getItineraryComments(itineraryId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!userId || !commentText.trim()) return;

    try {
      setIsPosting(true);
      const newComment = await addItineraryComment(itineraryId, userId, commentText.trim());
      setComments([newComment, ...comments]);
      setCommentText('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to post comment');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!userId) return;

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItineraryComment(commentId, userId);
              setComments(comments.filter(c => c.id !== commentId));
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const handleStartEditing = (comment: ItineraryCommentWithProfile) => {
    setEditingComment({
      commentId: comment.id,
      content: comment.content,
    });
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
  };

  const handleUpdateComment = async () => {
    if (!editingComment || !userId) return;

    try {
      setIsUpdating(true);
      await updateItineraryComment(editingComment.commentId, editingComment.content, userId);
      setComments(comments.map(c =>
        c.id === editingComment.commentId
          ? { ...c, content: editingComment.content }
          : c
      ));
      setEditingComment(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update comment');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatTimestamp = (dateStr: string) => {
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
  };

  const renderComment = ({ item }: { item: ItineraryCommentWithProfile }) => {
    const isEditing = editingComment?.commentId === item.id;
    const isOwnComment = item.user_id === userId;

    return (
      <View style={styles.commentItem}>
        <Image
          source={{ uri: item.profiles?.avatar_url || '' }}
          style={styles.avatar}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.username}>
              {item.profiles?.display_name || item.profiles?.username || 'Unknown'}
            </Text>
            <Text style={styles.timestamp}>{formatTimestamp(item.created_at)}</Text>
          </View>

          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editingComment.content}
                onChangeText={(text) => setEditingComment({ commentId: item.id, content: text })}
                multiline
                autoFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={handleCancelEdit}
                  disabled={isUpdating}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveButton]}
                  onPress={handleUpdateComment}
                  disabled={isUpdating || !editingComment.content.trim()}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.commentText}>{item.content}</Text>
              {isOwnComment && (
                <View style={styles.commentActions}>
                  <TouchableOpacity
                    onPress={() => handleStartEditing(item)}
                    style={styles.actionButton}
                  >
                    <Icons.Edit2 size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteComment(item.id)}
                    style={styles.actionButton}
                  >
                    <Icons.Trash2 size={14} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

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
            <Text style={styles.headerTitle}>Comments ({comments.length})</Text>
            <TouchableOpacity onPress={onClose}>
              <Icons.X size={24} color="#000" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {isLoading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.centerContent}>
              <Icons.MessageCircle size={48} color="#ccc" />
              <Text style={styles.emptyText}>No comments yet</Text>
              <Text style={styles.emptySubtext}>Be the first to comment</Text>
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
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Add a comment..."
                  placeholderTextColor="#999"
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  editable={!isPosting}
                />
                <TouchableOpacity
                  style={[styles.postButton, !commentText.trim() && styles.postButtonDisabled]}
                  onPress={handlePostComment}
                  disabled={!commentText.trim() || isPosting}
                >
                  {isPosting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Icons.Send size={18} color="#fff" strokeWidth={2.5} />
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
    maxHeight: '80%',
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
    paddingBottom: 16,
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
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
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    padding: 4,
  },
  editContainer: {
    marginTop: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
});
