import { COLORS } from '@/lib/constants';
import { getVideoReviews, voteReviewHelpfulness, removeReviewHelpfulnessVote, SortBy, deleteReview } from '@/services/reviews';
import { PersonalizedFeedVideo } from '@/services/personalizedFeed';
import { VideoWithProfile, ReviewWithProfile } from '@/types/database';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    ScrollView,
} from 'react-native';

type Props = {
  visible: boolean;
  video: VideoWithProfile | PersonalizedFeedVideo;
  userId?: string;
  onClose: () => void;
};

const PAGE_SIZE = 10;

export function ReviewsModal({ visible, video, userId, onClose }: Props) {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  console.log('ReviewsModal props:', { visible, videoId: video.id, userId, videoObject: video });

  useEffect(() => {
    if (visible) {
      console.log('ReviewsModal visible, loading reviews for video:', video.id);
      setCurrentPage(1);
      loadReviews(1, 'recent');
    }
  }, [visible]);

  const loadReviews = async (page: number, sort: SortBy) => {
    try {
      setIsLoading(true);
      const newReviews = await getVideoReviews(video.id, sort, page, PAGE_SIZE, userId);
      console.log('Loaded reviews:', newReviews, 'Video ID:', video.id);
      
      if (page === 1) {
        setReviews(newReviews);
      } else {
        setReviews(prev => [...prev, ...newReviews]);
      }

      setHasMore(newReviews.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (sort: SortBy) => {
    setSortBy(sort);
    setCurrentPage(1);
    loadReviews(1, sort);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadReviews(nextPage, sortBy);
    }
  };

  const handleHelpful = async (review: ReviewWithProfile, isHelpful: boolean) => {
    if (!userId) return;

    try {
      // If user already voted the same way, remove the vote
      if (review.user_helpfulness === isHelpful) {
        await removeReviewHelpfulnessVote(userId, review.id);
        setReviews(reviews.map(r =>
          r.id === review.id
            ? {
                ...r,
                user_helpfulness: null,
                helpful_count: r.helpful_count - (isHelpful ? 1 : 0),
                unhelpful_count: r.unhelpful_count - (!isHelpful ? 1 : 0),
              }
            : r
        ));
      } else {
        // Vote for the new option
        await voteReviewHelpfulness(userId, review.id, isHelpful);
        setReviews(reviews.map(r =>
          r.id === review.id
            ? {
                ...r,
                user_helpfulness: isHelpful,
                helpful_count: r.helpful_count + (isHelpful && !r.user_helpfulness ? 1 : isHelpful && r.user_helpfulness === false ? 1 : 0),
                unhelpful_count: r.unhelpful_count + (!isHelpful && !r.user_helpfulness ? 1 : !isHelpful && r.user_helpfulness === true ? 1 : 0),
              }
            : r
        ));
      }
    } catch (error) {
      console.error('Failed to vote on review:', error);
    }
  };

  const handleDeleteReview = (review: ReviewWithProfile) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              if (userId) {
                await deleteReview(review.id, userId);
                setReviews(reviews.filter(r => r.id !== review.id));
              }
            } catch (error) {
              console.error('Failed to delete review:', error);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleUserProfile = (userId: string) => {
    if (userId === userId) {
      router.push('/(tabs)/profile');
    } else {
      router.push({
        pathname: '/user/[userId]',
        params: { userId },
      } as any);
    }
  };

  const renderReview = ({ item }: { item: ReviewWithProfile }) => {
    const isOwnReview = userId && item.user_id === userId;

    return (
      <View style={styles.reviewCard}>
        {/* Review Header */}
        <View style={styles.reviewHeader}>
          <TouchableOpacity
            style={styles.userRow}
            onPress={() => handleUserProfile(item.user_id)}
          >
            {item.profiles?.avatar_url ? (
              <Image
                source={{ uri: item.profiles.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <FontAwesome name="user" size={12} color={COLORS.textMuted} />
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.username} numberOfLines={1}>
                {item.profiles?.display_name || item.profiles?.username || 'Unknown'}
              </Text>
              <Text style={styles.timestamp}>{getTimeAgo(item.created_at)}</Text>
            </View>
          </TouchableOpacity>

          {isOwnReview && (
            <TouchableOpacity onPress={() => handleDeleteReview(item)}>
              <FontAwesome name="trash-o" size={16} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>

        {/* Rating Stars */}
        <View style={styles.ratingStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <FontAwesome
              key={star}
              name={star <= item.rating ? 'star' : 'star-o'}
              size={14}
              color={COLORS.primary}
              style={styles.star}
            />
          ))}
          <Text style={styles.ratingValue}>{item.rating}.0</Text>
        </View>

        {/* Review Title */}
        {item.title && (
          <Text style={styles.reviewTitle}>{item.title}</Text>
        )}

        {/* Review Content */}
        <Text style={styles.reviewContent}>{item.content}</Text>

        {/* Review Photos */}
        {item.review_photos && item.review_photos.length > 0 && (
          <View style={styles.photosContainer}>
            {item.review_photos.map((photo) => (
              <Image
                key={photo.id}
                source={{ uri: photo.photo_url }}
                style={styles.reviewPhoto}
              />
            ))}
          </View>
        )}

        {/* Helpfulness Section */}
        <View style={styles.helpfulnessContainer}>
          <Text style={styles.helpfulnessLabel}>Was this helpful?</Text>
          <View style={styles.helpfulnessButtons}>
            <TouchableOpacity
              style={[
                styles.helpfulButton,
                item.user_helpfulness === true && styles.helpfulButtonActive,
              ]}
              onPress={() => handleHelpful(item, true)}
            >
              <FontAwesome
                name="thumbs-up"
                size={14}
                color={item.user_helpfulness === true ? COLORS.primary : '#999'}
              />
              <Text
                style={[
                  styles.helpfulButtonText,
                  item.user_helpfulness === true && styles.helpfulButtonTextActive,
                ]}
              >
                {item.helpful_count}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.helpfulButton,
                item.user_helpfulness === false && styles.helpfulButtonActive,
              ]}
              onPress={() => handleHelpful(item, false)}
            >
              <FontAwesome
                name="thumbs-down"
                size={14}
                color={item.user_helpfulness === false ? '#FF3B30' : '#999'}
              />
              <Text
                style={[
                  styles.helpfulButtonText,
                  item.user_helpfulness === false && styles.helpfulButtonTextActive,
                ]}
              >
                {item.unhelpful_count}
              </Text>
            </TouchableOpacity>
          </View>
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
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Reviews</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="times" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'recent' && styles.sortButtonActive]}
              onPress={() => handleSortChange('recent')}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === 'recent' && styles.sortButtonTextActive,
                ]}
              >
                Recent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'highest' && styles.sortButtonActive]}
              onPress={() => handleSortChange('highest')}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === 'highest' && styles.sortButtonTextActive,
                ]}
              >
                Highest Rated
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'helpful' && styles.sortButtonActive]}
              onPress={() => handleSortChange('helpful')}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === 'helpful' && styles.sortButtonTextActive,
                ]}
              >
                Helpful
              </Text>
            </TouchableOpacity>
          </View>

          {/* Reviews List */}
          {(() => {
            console.log('ReviewsModal state:', { isLoading, reviewsLength: reviews.length, reviews: reviews.map(r => ({ id: r.id, title: r.title })) });
            return null;
          })()}
          {isLoading && reviews.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="comments-o" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No reviews yet</Text>
              <Text style={styles.emptySubtext}>Be the first to review this video</Text>
            </View>
          ) : (
            <ScrollView style={styles.reviewsScrollView} showsVerticalScrollIndicator={false}>
              {reviews.map((review) => (
                <View key={review.id}>
                  {renderReview({ item: review })}
                </View>
              ))}
              {hasMore && reviews.length > 0 && (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    minHeight: '50%',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  reviewCard: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  star: {
    marginRight: 2,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  reviewContent: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    marginBottom: 8,
  },
  photosContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  reviewPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  helpfulnessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  helpfulnessLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  helpfulnessButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  helpfulButtonActive: {
    backgroundColor: 'transparent',
  },
  helpfulButtonText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  helpfulButtonTextActive: {
    color: COLORS.primary,
  },
  loadingMore: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewsScrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
