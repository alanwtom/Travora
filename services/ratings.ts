import { supabase } from '@/lib/supabase';
import { Rating } from '@/types/database';

/**
 * Submit or update a rating for a video
 */
export async function submitRating(
  userId: string,
  videoId: string,
  rating: number
): Promise<Rating | null> {
  // Validate rating is between 1-5
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  try {
    // Try to update existing rating first
    const { data: existingRating, error: getError } = await (supabase
      .from('ratings') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();

    if (existingRating) {
      // Update existing rating
      const { data, error } = await (supabase
        .from('ratings') as any)
        .update({
          rating,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .select()
        .single();

      if (error) throw error;
      return data as Rating;
    } else {
      // Insert new rating
      const { data, error } = await (supabase
        .from('ratings') as any)
        .insert({
          user_id: userId,
          video_id: videoId,
          rating,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Rating;
    }
  } catch (error: any) {
    console.error('Failed to submit rating:', error);
    throw error;
  }
}

/**
 * Get the current user's rating for a video
 */
export async function getUserRating(
  userId: string,
  videoId: string
): Promise<number | null> {
  try {
    const { data, error } = await (supabase
      .from('ratings') as any)
      .select('rating')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected
      throw error;
    }

    return data?.rating || null;
  } catch (error: any) {
    console.error('Failed to get user rating:', error);
    return null;
  }
}

/**
 * Get all ratings for a video
 */
export async function getVideoRatings(videoId: string): Promise<Rating[]> {
  try {
    const { data, error } = await (supabase
      .from('ratings') as any)
      .select('*')
      .eq('video_id', videoId);

    if (error) throw error;
    return (data || []) as Rating[];
  } catch (error: any) {
    console.error('Failed to get video ratings:', error);
    return [];
  }
}

/**
 * Get average rating for a video
 */
export async function getAverageRating(videoId: string): Promise<{
  average: number;
  count: number;
}> {
  try {
    const ratings = await getVideoRatings(videoId);

    if (ratings.length === 0) {
      return { average: 0, count: 0 };
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / ratings.length;

    return {
      average: Math.round(average * 10) / 10, // Round to 1 decimal place
      count: ratings.length,
    };
  } catch (error: any) {
    console.error('Failed to get average rating:', error);
    return { average: 0, count: 0 };
  }
}

/**
 * Remove a rating
 */
export async function removeRating(
  userId: string,
  videoId: string
): Promise<void> {
  try {
    const { error } = await (supabase
      .from('ratings') as any)
      .delete()
      .eq('user_id', userId)
      .eq('video_id', videoId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Failed to remove rating:', error);
    throw error;
  }
}
