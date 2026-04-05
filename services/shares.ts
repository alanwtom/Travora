/**
 * Shares Service
 *
 * Business logic for in-app content sharing between users.
 */

import { supabase } from '@/lib/supabase';
import { Profile, SharedContent, SharedContentWithDetails } from '@/types/database';
import { searchProfiles } from './profiles';
import { triggerBulkNotification } from './notificationTriggers';

export type ContentType = 'video' | 'itinerary' | 'profile';

/**
 * Share content with one or more users.
 * Creates shared_content rows and fires notifications (non-blocking).
 */
export async function shareContent(
  senderId: string,
  recipientIds: string[],
  contentType: ContentType,
  contentId: string,
  message?: string,
): Promise<SharedContent[]> {
  const rows = recipientIds
    .filter((rid) => rid !== senderId)
    .map((recipientId) => ({
      sender_id: senderId,
      recipient_id: recipientId,
      content_type: contentType,
      content_id: contentId,
      message: message || null,
    }));

  if (rows.length === 0) return [];

  const { data, error } = await supabase
    .from('shared_content')
    .insert(rows)
    .select();

  if (error) throw error;

  // Fire notifications non-blocking — get sender profile for name
  getProfileBasic(senderId).then((senderProfile) => {
    const senderName = senderProfile?.display_name || senderProfile?.username || 'Someone';
    
    triggerBulkNotification(recipientIds, {
      triggerEvent: 'content_shared',
      titleData: { sender_name: senderName, content_type: contentType },
      bodyData: {
        sender_name: senderName,
        content_type: contentType,
        ...(message && { message }),
      },
      customData: {
        senderId,
        contentType,
        contentId,
        ...(message && { message }),
      },
    }).catch(() => {});
  }).catch(() => {});

  return data;
}

/**
 * Get shares received by the current user with sender profile info.
 */
export async function getReceivedShares(
  userId: string,
  limit: number = 20,
  offset: number = 0,
): Promise<SharedContentWithDetails[]> {
  const { data, error } = await supabase
    .from('shared_content')
    .select(`
      *,
      sender:profiles!shared_content_sender_id_fkey(id, display_name, username, avatar_url)
    `)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data as SharedContentWithDetails[]) || [];
}

/**
 * Get received video shares with video details joined.
 */
export async function getReceivedVideoShares(
  userId: string,
  limit: number = 20,
  offset: number = 0,
): Promise<any[]> {
  const { data, error } = await supabase
    .from('shared_content')
    .select(`
      *,
      sender:profiles!shared_content_sender_id_fkey(id, display_name, username, avatar_url),
      videos:content_id(id, title, thumbnail_url, video_url, user_id, profiles:videos_user_id_fkey(id, display_name, username, avatar_url))
    `)
    .eq('recipient_id', userId)
    .eq('content_type', 'video')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

/**
 * Get count of unread shares for the current user.
 */
export async function getUnreadShareCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('shared_content')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count ?? 0;
}

/**
 * Mark a single share as read.
 */
export async function markShareAsRead(shareId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('shared_content')
    .update({ is_read: true })
    .eq('id', shareId)
    .eq('recipient_id', userId);

  if (error) throw error;
}

/**
 * Mark all shares as read for a user.
 */
export async function markAllSharesAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('shared_content')
    .update({ is_read: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

/**
 * Delete a share.
 */
export async function deleteShare(shareId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('shared_content')
    .delete()
    .eq('id', shareId)
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

  if (error) throw error;
}

/**
 * Search for users to share content with.
 * Excludes self and users already shared with.
 */
export async function searchUsersToShare(
  query: string,
  contentType: ContentType,
  contentId: string,
  currentUserId: string,
): Promise<Profile[]> {
  const [profiles, existing] = await Promise.all([
    searchProfiles(query),
    supabase
      .from('shared_content')
      .select('recipient_id')
      .eq('sender_id', currentUserId)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .then(({ data }) => data?.map((r) => r.recipient_id) ?? []),
  ]);

  const excludedIds = new Set(existing);
  excludedIds.add(currentUserId);

  return profiles.filter((p) => !excludedIds.has(p.id));
}

/**
 * Get share suggestions based on user's following list,
 * excluding users already shared with for this content.
 */
export async function getShareSuggestions(
  currentUserId: string,
  contentType: ContentType,
  contentId: string,
): Promise<Profile[]> {
  const [followsResult, existingResult] = await Promise.all([
    supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, display_name, username, avatar_url)')
      .eq('follower_id', currentUserId)
      .limit(50)
      .then(({ data }) => data || []),
    supabase
      .from('shared_content')
      .select('recipient_id')
      .eq('sender_id', currentUserId)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .then(({ data }) => new Set(data?.map((r) => r.recipient_id) ?? [])),
  ]);

  const excludedIds = existingResult;
  const profiles: Profile[] = [];

  for (const follow of followsResult) {
    const profile = follow.profiles as any;
    if (profile && !excludedIds.has(profile.id)) {
      profiles.push(profile);
    }
  }

  return profiles;
}

/**
 * Get basic profile info (helper).
 */
async function getProfileBasic(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data;
}
