import { COLORS } from '@/lib/constants';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: boolean, feedback?: string) => void;
  itineraryTitle: string;
  isLoading?: boolean;
};

export function ItineraryRatingModal({
  visible,
  onClose,
  onSubmit,
  itineraryTitle,
  isLoading = false,
}: Props) {
  const [selectedRating, setSelectedRating] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    if (selectedRating === null) return;

    onSubmit(selectedRating, feedback.trim() || undefined);

    // Reset state
    setSelectedRating(null);
    setFeedback('');
  };

  const handleClose = () => {
    // Reset state
    setSelectedRating(null);
    setFeedback('');
    onClose();
  };

  const isThumbsUp = selectedRating === true;
  const isThumbsDown = selectedRating === false;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Rate Itinerary</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <FontAwesome name="times" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Itinerary Title */}
          <Text style={styles.itineraryTitle} numberOfLines={2}>
            {itineraryTitle}
          </Text>

          {/* Rating Buttons */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingPrompt}>How was this itinerary?</Text>

            <View style={styles.ratingButtons}>
              {/* Thumbs Up */}
              <TouchableOpacity
                style={[
                  styles.ratingButton,
                  isThumbsUp && styles.ratingButtonActiveUp,
                ]}
                onPress={() => setSelectedRating(true)}
                disabled={isLoading}
              >
                <FontAwesome
                  name="thumbs-up"
                  size={32}
                  color={isThumbsUp ? 'white' : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.ratingButtonText,
                    isThumbsUp && styles.ratingButtonTextActive,
                  ]}
                >
                  Loved it
                </Text>
              </TouchableOpacity>

              {/* Thumbs Down */}
              <TouchableOpacity
                style={[
                  styles.ratingButton,
                  isThumbsDown && styles.ratingButtonActiveDown,
                ]}
                onPress={() => setSelectedRating(false)}
                disabled={isLoading}
              >
                <FontAwesome
                  name="thumbs-down"
                  size={32}
                  color={isThumbsDown ? 'white' : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.ratingButtonText,
                    isThumbsDown && styles.ratingButtonTextActive,
                  ]}
                >
                  Needs work
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Feedback Input (Optional) */}
          {selectedRating !== null && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackLabel}>
                Feedback (optional)
              </Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder={
                  isThumbsUp
                    ? 'What did you enjoy?'
                    : 'What could be improved?'
                }
                placeholderTextColor={COLORS.textMuted}
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={3}
                maxLength={500}
                editable={!isLoading}
              />
              <Text style={styles.charCount}>{feedback.length}/500</Text>
            </View>
          )}

          {/* Submit Button */}
          {selectedRating !== null && (
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Submitting...' : 'Submit Rating'}
              </Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  itineraryTitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  ratingContainer: {
    marginBottom: 16,
  },
  ratingPrompt: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  ratingButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  ratingButtonActiveUp: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  ratingButtonActiveDown: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  ratingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  ratingButtonTextActive: {
    color: 'white',
  },
  feedbackContainer: {
    marginBottom: 16,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  feedbackInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
