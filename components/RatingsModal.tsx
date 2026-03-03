import { COLORS } from '@/lib/constants';
import { getAverageRating, getUserRating, removeRating, submitRating } from '@/services/ratings';
import { getUserReviewForVideo, getReviewStats } from '@/services/reviews';
import { VideoWithProfile } from '@/types/database';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type Props = {
  visible: boolean;
  video: VideoWithProfile;
  userId?: string;
  onClose: () => void;
  onWriteReview?: () => void;
  onViewReviews?: () => void;
};

export function RatingsModal({
  visible,
  video,
  userId,
  onClose,
  onWriteReview,
  onViewReviews,
}: Props) {
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [userHasReview, setUserHasReview] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      loadRatingData();
    }
  }, [visible, userId]);

  const loadRatingData = async () => {
    try {
      setIsLoading(true);
      
      // Get user's rating
      const userRate = await getUserRating(userId!, video.id);
      setUserRating(userRate);

      // Get average rating
      const { average, count } = await getAverageRating(video.id);
      setAverageRating(average);
      setRatingCount(count);

      // Get review stats
      const { reviewCount, averageRating: avgFromReviews } = await getReviewStats(video.id);
      setReviewCount(reviewCount);

      // Check if user has a review
      const userReview = await getUserReviewForVideo(userId!, video.id);
      setUserHasReview(!!userReview);
    } catch (error) {
      console.error('Failed to load rating data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRating = async (rating: number) => {
    if (!userId) return;

    try {
      setIsSubmitting(true);
      
      if (rating === 0) {
        // Remove rating
        await removeRating(userId, video.id);
        setUserRating(null);
      } else {
        // Submit rating
        await submitRating(userId, video.id, rating);
        setUserRating(rating);
      }

      // Reload average rating
      const { average, count } = await getAverageRating(video.id);
      setAverageRating(average);
      setRatingCount(count);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating || userRating;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Rate This Video</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="times" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <>
              {/* Average Rating Display */}
              <View style={styles.averageRatingContainer}>
                <View style={styles.averageRatingContent}>
                  <Text style={styles.averageRatingNumber}>
                    {averageRating.toFixed(1)}
                  </Text>
                  <View style={styles.starsSmall}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FontAwesome
                        key={star}
                        name={star <= Math.round(averageRating) ? 'star' : 'star-o'}
                        size={16}
                        color={COLORS.primary}
                        style={styles.starSmall}
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingCount}>
                    {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}
                  </Text>
                </View>
              </View>

              {/* Your Rating Section */}
              <View style={styles.yourRatingContainer}>
                <Text style={styles.yourRatingLabel}>Your Rating</Text>
                
                {/* Star Rating Selector */}
                <View style={styles.starsContainer}>
                  {[0, 1, 2, 3, 4, 5].map((star) => {
                    const isFilled =
                      displayRating !== null && displayRating > 0 && star <= displayRating;
                    const isHovered = hoverRating !== null && star <= hoverRating && star > 0;

                    return (
                      <TouchableOpacity
                        key={star}
                        onPress={() => handleRating(star)}
                        onPressIn={() => star > 0 && setHoverRating(star)}
                        onPressOut={() => setHoverRating(null)}
                        disabled={isSubmitting}
                        style={styles.starButton}
                      >
                        <FontAwesome
                          name={isFilled || isHovered ? 'star' : 'star-o'}
                          size={48}
                          color={
                            isFilled || isHovered ? COLORS.primary : '#ccc'
                          }
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {userRating === null && (
                  <Text style={styles.noRatingText}>No review yet</Text>
                )}

                {userRating !== null && (
                  <Text style={styles.ratingText}>You rated {userRating} star{userRating !== 1 ? 's' : ''}</Text>
                )}
              </View>

              {/* Remove Rating Button */}
              {userRating !== null && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRating(0)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.removeButtonText}>Remove Rating</Text>
                </TouchableOpacity>
              )}

              {/* Reviews Section */}
              {reviewCount > 0 && (
                <TouchableOpacity
                  style={styles.viewReviewsButton}
                  onPress={onViewReviews}
                >
                  <FontAwesome name="comments-o" size={16} color={COLORS.primary} />
                  <Text style={styles.viewReviewsText}>View {reviewCount} Review{reviewCount !== 1 ? 's' : ''}</Text>
                  <FontAwesome name="chevron-right" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              )}

              {/* Write/Edit Review Button */}
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={onWriteReview}
                disabled={isSubmitting}
              >
                <FontAwesome name="edit" size={16} color="white" />
                <Text style={styles.reviewButtonText}>
                  {userHasReview ? 'Edit Your Review' : 'Write a Review'}
                </Text>
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={styles.closeButtonText}>Done</Text>
              </TouchableOpacity>
            </>
          )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  averageRatingContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  averageRatingContent: {
    alignItems: 'center',
  },
  averageRatingNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  starsSmall: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starSmall: {
    marginHorizontal: 2,
  },
  ratingCount: {
    fontSize: 14,
    color: '#666',
  },
  yourRatingContainer: {
    marginBottom: 24,
  },
  yourRatingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starButton: {
    padding: 8,
  },
  noRatingText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  viewReviewsButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewReviewsText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  reviewButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reviewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
