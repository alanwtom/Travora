import { supabase } from '@/lib/supabase';
import { Review, ReviewPhoto, ReviewWithProfile, ReviewHelpfulness } from '@/types/database';

export type SortBy = 'recent' | 'highest' | 'helpful';

/**
 * Submit a new review
 */
export async function submitReview(
  userId: string,
  videoId: string,
  rating: number,
  content: string,
  title?: string
): Promise<Review | null> {
  // Validate content length
  if (content.length < 10 || content.length > 500) {
    throw new Error('Review must be between 10 and 500 characters');
  }

  try {
    const { data, error } = await (supabase
      .from('reviews') as any)
      .insert({
        user_id: userId,
        video_id: videoId,
        rating,
        title: title || null,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Review;
  } catch (error: any) {
    console.error('Failed to submit review:', error);
    throw error;
  }
}

/**
 * Update an existing review
 */
export async function updateReview(
  reviewId: string,
  userId: string,
  rating: number,
  content: string,
  title?: string
): Promise<Review | null> {
  // Validate content length
  if (content.length < 10 || content.length > 500) {
    throw new Error('Review must be between 10 and 500 characters');
  }

  try {
    const { data, error } = await (supabase
      .from('reviews') as any)
      .update({
        rating,
        title: title || null,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Review;
  } catch (error: any) {
    console.error('Failed to update review:', error);
    throw error;
  }
}

/**
 * Get reviews for a video with sorting and pagination
 */
export async function getVideoReviews(
  videoId: string,
  sortBy: SortBy = 'recent',
  page: number = 1,
  pageSize: number = 10,
  userId?: string
): Promise<ReviewWithProfile[]> {
  try {
    let query = (supabase
      .from('reviews') as any)
      .select('*')
      .eq('video_id', videoId);

    // Apply sorting
    switch (sortBy) {
      case 'highest':
        query = query.order('rating', { ascending: false });
        break;
      case 'helpful':
        query = query.order('helpful_count', { ascending: false });
        break;
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data: reviewData, error } = await query;

    console.log('Review query result:', { reviewData, error, videoId });

    if (error) throw error;

    if (!reviewData || reviewData.length === 0) {
      console.log('No review data found');
      return [];
    }

    // Fetch profiles for all reviews
    const userIds = [...new Set(reviewData.map((r: any) => r.user_id))];
    const { data: profileData } = await (supabase
      .from('profiles') as any)
      .select('*')
      .in('id', userIds);

    const profileMap = new Map(
      (profileData || []).map((p: any) => [p.id, p])
    );

    // Fetch review photos for all reviews
    const reviewIds = reviewData.map((r: any) => r.id);
    const { data: photoData } = await (supabase
      .from('review_photos') as any)
      .select('*')
      .in('review_id', reviewIds);

    const photosMap = new Map<string, any[]>();
    (photoData || []).forEach((photo: any) => {
      if (!photosMap.has(photo.review_id)) {
        photosMap.set(photo.review_id, []);
      }
      photosMap.get(photo.review_id)!.push(photo);
    });

    // Combine data
    let reviewsWithData = reviewData.map((review: any) => ({
      ...review,
      profiles: profileMap.get(review.user_id) || {},
      review_photos: photosMap.get(review.id) || [],
      user_helpfulness: null as boolean | null,
    })) as ReviewWithProfile[];

    // Fetch user's helpfulness votes if authenticated
    if (userId) {
      const { data: helpfulness } = await (supabase
        .from('review_helpfulness') as any)
        .select('review_id, is_helpful')
        .eq('user_id', userId)
        .in('review_id', reviewIds);

      const helpfulnessMap = new Map(
        (helpfulness || []).map((h: any) => [h.review_id, h.is_helpful])
      );

      reviewsWithData = reviewsWithData.map(review => ({
        ...review,
        user_helpfulness: helpfulnessMap.get(review.id) ?? null,
      })) as ReviewWithProfile[];
    }

    return reviewsWithData;
  } catch (error: any) {
    console.error('Failed to get reviews:', error);
    return [];
  }
}

/**
 * Get user's review for a video
 */
export async function getUserReviewForVideo(
  userId: string,
  videoId: string
): Promise<ReviewWithProfile | null> {
  try {
    const { data, error } = await (supabase
      .from('reviews') as any)
      .select(`
        *,
        profiles!reviews_user_id_fkey(*),
        review_photos(*)
      `)
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return {
        ...data,
        profiles: data.profiles,
        review_photos: data.review_photos || [],
        user_helpfulness: null,
      } as ReviewWithProfile;
    }

    return null;
  } catch (error: any) {
    console.error('Failed to get user review:', error);
    return null;
  }
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string, userId: string): Promise<void> {
  try {
    const { error } = await (supabase
      .from('reviews') as any)
      .delete()
      .eq('id', reviewId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Failed to delete review:', error);
    throw error;
  }
}

/**
 * Add a photo to a review (max 3 photos)
 */
export async function addReviewPhoto(
  reviewId: string,
  photoUrl: string,
  displayOrder: number = 0
): Promise<ReviewPhoto | null> {
  try {
    // Check if review already has 3 photos
    const { data: existingPhotos, error: countError } = await (supabase
      .from('review_photos') as any)
      .select('id')
      .eq('review_id', reviewId);

    if (countError) throw countError;
    if ((existingPhotos || []).length >= 3) {
      throw new Error('Maximum 3 photos per review');
    }

    const { data, error } = await (supabase
      .from('review_photos') as any)
      .insert({
        review_id: reviewId,
        photo_url: photoUrl,
        display_order: displayOrder,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ReviewPhoto;
  } catch (error: any) {
    console.error('Failed to add review photo:', error);
    throw error;
  }
}

/**
 * Delete a review photo
 */
export async function deleteReviewPhoto(photoId: string): Promise<void> {
  try {
    const { error } = await (supabase
      .from('review_photos') as any)
      .delete()
      .eq('id', photoId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Failed to delete review photo:', error);
    throw error;
  }
}

/**
 * Vote on review helpfulness
 */
export async function voteReviewHelpfulness(
  userId: string,
  reviewId: string,
  isHelpful: boolean
): Promise<void> {
  try {
    // Check if user already voted
    const { data: existingVote, error: checkError } = await (supabase
      .from('review_helpfulness') as any)
      .select('id')
      .eq('user_id', userId)
      .eq('review_id', reviewId)
      .single();

    if (existingVote) {
      // Update existing vote
      await (supabase
        .from('review_helpfulness') as any)
        .update({ is_helpful: isHelpful })
        .eq('id', existingVote.id);
    } else {
      // Insert new vote
      await (supabase
        .from('review_helpfulness') as any)
        .insert({
          user_id: userId,
          review_id: reviewId,
          is_helpful: isHelpful,
        });
    }

    // Update review helpful/unhelpful counts
    const { data: allVotes } = await (supabase
      .from('review_helpfulness') as any)
      .select('is_helpful')
      .eq('review_id', reviewId);

    const helpfulCount = (allVotes || []).filter((v: any) => v.is_helpful).length;
    const unhelpfulCount = (allVotes || []).filter((v: any) => !v.is_helpful).length;

    await (supabase
      .from('reviews') as any)
      .update({
        helpful_count: helpfulCount,
        unhelpful_count: unhelpfulCount,
      })
      .eq('id', reviewId);
  } catch (error: any) {
    console.error('Failed to vote on review helpfulness:', error);
    throw error;
  }
}

/**
 * Remove a helpfulness vote
 */
export async function removeReviewHelpfulnessVote(
  userId: string,
  reviewId: string
): Promise<void> {
  try {
    await (supabase
      .from('review_helpfulness') as any)
      .delete()
      .eq('user_id', userId)
      .eq('review_id', reviewId);

    // Update review helpful/unhelpful counts
    const { data: allVotes } = await (supabase
      .from('review_helpfulness') as any)
      .select('is_helpful')
      .eq('review_id', reviewId);

    const helpfulCount = (allVotes || []).filter((v: any) => v.is_helpful).length;
    const unhelpfulCount = (allVotes || []).filter((v: any) => !v.is_helpful).length;

    await (supabase
      .from('reviews') as any)
      .update({
        helpful_count: helpfulCount,
        unhelpful_count: unhelpfulCount,
      })
      .eq('id', reviewId);
  } catch (error: any) {
    console.error('Failed to remove helpfulness vote:', error);
    throw error;
  }
}

/**
 * Get review count for a video
 */
export async function getReviewCount(videoId: string): Promise<number> {
  try {
    const { data, error } = await (supabase
      .from('reviews') as any)
      .select('id', { count: 'exact', head: true })
      .eq('video_id', videoId);

    if (error) throw error;
    return 0; // In head mode, count is in the response header, handled by Supabase
  } catch (error: any) {
    console.error('Failed to get review count:', error);
    return 0;
  }
}

/**
 * Get review count and average rating for a video
 */
export async function getReviewStats(videoId: string): Promise<{
  reviewCount: number;
  averageRating: number;
}> {
  try {
    const { data, error } = await (supabase
      .from('reviews') as any)
      .select('rating')
      .eq('video_id', videoId);

    if (error) throw error;

    const reviews = data || [];
    if (reviews.length === 0) {
      return { reviewCount: 0, averageRating: 0 };
    }

    const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
    const average = sum / reviews.length;

    return {
      reviewCount: reviews.length,
      averageRating: Math.round(average * 10) / 10,
    };
  } catch (error: any) {
    console.error('Failed to get review stats:', error);
    return { reviewCount: 0, averageRating: 0 };
  }
}
