import { COLORS } from '@/lib/constants';
import { PersonalizedFeedVideo } from '@/services/personalizedFeed';
import { submitReview, updateReview } from '@/services/reviews';
import { VideoWithProfile, ReviewWithProfile } from '@/types/database';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type Props = {
  visible: boolean;
  video: VideoWithProfile | PersonalizedFeedVideo;
  userId?: string;
  initialReview?: ReviewWithProfile | null;
  onClose: () => void;
  onSubmitted: () => void;
};

const MIN_CHARS = 10;
const MAX_CHARS = 500;

export function ReviewSubmitModal({
  visible,
  video,
  userId,
  initialReview,
  onClose,
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [title, setTitle] = useState(initialReview?.title ?? '');
  const [content, setContent] = useState(initialReview?.content ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const isValid = rating > 0 && content.length >= MIN_CHARS && content.length <= MAX_CHARS;
  const displayRating = hoverRating || rating;
  const charCount = content.length;

  const handleSubmit = async () => {
    if (!userId || !isValid) return;

    try {
      setError(null);
      setIsSubmitting(true);

      if (initialReview) {
        // Update existing review
        await updateReview(initialReview.id, userId, rating, content, title || undefined);
      } else {
        // Submit new review
        await submitReview(userId, video.id, rating, content, title || undefined);
      }

      onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content} pointerEvents="box-none">
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {initialReview ? 'Edit Review' : 'Write a Review'}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
              <FontAwesome name="times" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Video Info */}
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle}>{video.title}</Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <FontAwesome name="exclamation-circle" size={16} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Star Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Rating *</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= (displayRating || 0);

                  return (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      onPressIn={() => setHoverRating(star)}
                      onPressOut={() => setHoverRating(null)}
                      disabled={isSubmitting}
                      style={styles.starButton}
                    >
                      <FontAwesome
                        name={isFilled ? 'star' : 'star-o'}
                        size={44}
                        color={isFilled ? COLORS.primary : '#ccc'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              {rating > 0 && (
                <Text style={styles.ratingText}>{rating} star{rating !== 1 ? 's' : ''}</Text>
              )}
            </View>

            {/* Title (optional) */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Title (optional)</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Summarize your experience..."
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                editable={!isSubmitting}
                maxLength={100}
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </View>

            {/* Review Content */}
            <View style={styles.section}>
              <View style={styles.contentLabelRow}>
                <Text style={styles.sectionLabel}>Review *</Text>
                <Text style={[
                  styles.charCountLabel,
                  {
                    color: charCount < MIN_CHARS ? '#FF3B30' : charCount > MAX_CHARS ? '#FF3B30' : COLORS.textMuted
                  }
                ]}>
                  {charCount}/{MAX_CHARS}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.contentInput,
                  charCount < MIN_CHARS && styles.contentInputError,
                  charCount > MAX_CHARS && styles.contentInputError,
                ]}
                placeholder="Share your experience at this location..."
                placeholderTextColor="#999"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
                editable={!isSubmitting}
                maxLength={MAX_CHARS}
                textAlignVertical="top"
              />
              <Text style={styles.helperText}>
                {charCount < MIN_CHARS
                  ? `At least ${MIN_CHARS - charCount} more characters required`
                  : `${MAX_CHARS - charCount} characters remaining`}
              </Text>
            </View>

            {/* Note about validation */}
            <View style={styles.note}>
              <FontAwesome name="info-circle" size={14} color={COLORS.textMuted} />
              <Text style={styles.noteText}>
                Reviews must be between {MIN_CHARS} and {MAX_CHARS} characters and include a rating.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            {initialReview && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={styles.deleteButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.submitButton,
                !isValid && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {initialReview ? 'Update Review' : 'Post Review'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '95%',
    minHeight: '85%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  videoInfo: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
    flex: 1,
  },
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
    gap: 6,
  },
  starButton: {
    padding: 2,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#000',
    marginBottom: 4,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#000',
    minHeight: 80,
  },
  contentInputError: {
    borderColor: '#FF3B30',
  },
  contentLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  charCountLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  note: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 6,
    alignItems: 'flex-start',
  },
  noteText: {
    fontSize: 11,
    color: COLORS.textMuted,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  deleteButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
});
