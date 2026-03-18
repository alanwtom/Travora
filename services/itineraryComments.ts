/**
 * Itinerary Comments Service
 *
 * Business logic for managing comments on shared itineraries.
 */

import { supabase } from '@/lib/supabase';
import { ItineraryCommentWithProfile } from '@/types/database';

/**
 * Get all comments for an itinerary
 * @param itineraryId - The itinerary ID
 * @returns Array of comments with user profiles
 */
export async function getItineraryComments(
  itineraryId: string
): Promise<ItineraryCommentWithProfile[]> {
  const { data, error } = await supabase
    .from('itinerary_comments')
    .select(`
      *,
      profiles!itinerary_comments_user_id_fkey(*)
    `)
    .eq('itinerary_id', itineraryId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ItineraryCommentWithProfile[];
}

/**
 * Add a comment to an itinerary
 * @param itineraryId - The itinerary ID
 * @param userId - The user's ID
 * @param content - The comment content
 * @returns The created comment with profile data
 */
export async function addItineraryComment(
  itineraryId: string,
  userId: string,
  content: string
): Promise<ItineraryCommentWithProfile> {
  // Validate content length
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    throw new Error('Comment cannot be empty');
  }
  if (trimmed.length > 1000) {
    throw new Error('Comment is too long (max 1000 characters)');
  }

  const { data, error } = await supabase
    .from('itinerary_comments')
    .insert({
      itinerary_id: itineraryId,
      user_id: userId,
      content: trimmed,
    })
    .select(`
      *,
      profiles!itinerary_comments_user_id_fkey(*)
    `)
    .single();

  if (error) throw error;
  return data as ItineraryCommentWithProfile;
}

/**
 * Update an existing comment
 * @param commentId - The comment ID
 * @param content - The new content
 * @param userId - The user's ID (for authorization)
 */
export async function updateItineraryComment(
  commentId: string,
  content: string,
  userId: string
): Promise<void> {
  // Validate content length
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    throw new Error('Comment cannot be empty');
  }
  if (trimmed.length > 1000) {
    throw new Error('Comment is too long (max 1000 characters)');
  }

  const { error } = await supabase
    .from('itinerary_comments')
    .update({ content: trimmed })
    .eq('id', commentId)
    .eq('user_id', userId); // RLS ensures user can only update their own comments

  if (error) throw error;
}

/**
 * Delete a comment
 * @param commentId - The comment ID
 * @param userId - The user's ID (for authorization)
 * Note: RLS policies allow users to delete their own comments,
 * and itinerary owners can delete any comment via the policy.
 */
export async function deleteItineraryComment(
  commentId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('itinerary_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId); // RLS handles authorization

  if (error) throw error;
}

/**
 * Get comment count for an itinerary
 * @param itineraryId - The itinerary ID
 * @returns The number of comments
 */
export async function getItineraryCommentCount(itineraryId: string): Promise<number> {
  const { count, error } = await supabase
    .from('itinerary_comments')
    .select('*', { count: 'exact', head: true })
    .eq('itinerary_id', itineraryId);

  if (error) throw error;
  return count ?? 0;
}
