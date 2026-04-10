import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SwipeType = 'like' | 'dislike';

const DISLIKED_KEY = 'travora:disliked_videos';

/**
 * Record a swipe interaction (like or dislike) for a video
 */
function isMissingTableError(err: any): boolean {
  // PostgREST returns PGRST205 when table isn't in schema cache
  return err && err.code === 'PGRST205';
}

export async function recordSwipe(
  userId: string,
  videoId: string,
  swipeType: SwipeType
): Promise<boolean> {
  try {
    // Try to insert or update the swipe
    const { error } = await supabase
      .from('swipes')
      .upsert({
        user_id: userId,
        video_id: videoId,
        swipe_type: swipeType,
      });

    if (error) {
      if (isMissingTableError(error)) {
        // ignore if table hasn't been migrated yet
        return false;
      }
      console.error('Error recording swipe:', error);
      return false;
    }

    return true;
  } catch (err: any) {
    if (isMissingTableError(err)) {
      return false;
    }
    console.error('Failed to record swipe:', err);
    return false;
  }
}

/**
 * Get the swipe status for a specific video by current user
 */
export async function getUserSwipe(
  userId: string,
  videoId: string
): Promise<SwipeType | null> {
  try {
    const { data, error } = await supabase
      .from('swipes')
      .select('swipe_type')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found
        return null;
      }
      if (isMissingTableError(error)) {
        return null;
      }
      console.error('Error getting swipe:', error);
      return null;
    }

    return data?.swipe_type as SwipeType;
  } catch (err: any) {
    if (isMissingTableError(err)) {
      return null;
    }
    console.error('Failed to get swipe:', err);
    return null;
  }
}

/**
 * Toggle swipe (like/dislike). Returns the new swipe type or null if removed
 */
export async function toggleSwipe(
  userId: string,
  videoId: string,
  swipeType: SwipeType
): Promise<SwipeType | null> {
  try {
    const current = await getUserSwipe(userId, videoId);
    
    // If same type, remove it
    if (current === swipeType) {
      await removeSwipe(userId, videoId);
      return null;
    }
    
    // Otherwise, set the new type
    await recordSwipe(userId, videoId, swipeType);
    return swipeType;
  } catch (err: any) {
    if (isMissingTableError(err)) {
      return null;
    }
    console.error('Failed to toggle swipe:', err);
    return null;
  }
}

/**
 * Remove a swipe (undo like or dislike)
 */
export async function removeSwipe(userId: string, videoId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('swipes')
      .delete()
      .eq('user_id', userId)
      .eq('video_id', videoId);

    if (error) {
      if (isMissingTableError(error)) {
        return false;
      }
      console.error('Error removing swipe:', error);
      return false;
    }

    return true;
  } catch (err: any) {
    if (isMissingTableError(err)) {
      return false;
    }
    console.error('Failed to remove swipe:', err);
    return false;
  }
}

/**
 * Get user's swipe stats
 */
export async function getUserSwipeStats(userId: string): Promise<{
  likes: number;
  dislikes: number;
}> {
  try {
    const { data, error } = await supabase
      .from('swipes')
      .select('swipe_type')
      .eq('user_id', userId);

    if (error) {
      if (isMissingTableError(error)) {
        return { likes: 0, dislikes: 0 };
      }
      console.error('Error getting swipe stats:', error);
      return { likes: 0, dislikes: 0 };
    }

    const likes = data?.filter((s) => s.swipe_type === 'like').length || 0;
    const dislikes = data?.filter((s) => s.swipe_type === 'dislike').length || 0;

    return { likes, dislikes };
  } catch (err: any) {
    if (isMissingTableError(err)) {
      return { likes: 0, dislikes: 0 };
    }
    console.error('Failed to get swipe stats:', err);
    return { likes: 0, dislikes: 0 };
  }
}

export async function saveDislikedVideo(videoId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(DISLIKED_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(videoId)) {
      list.push(videoId);
      await AsyncStorage.setItem(DISLIKED_KEY, JSON.stringify(list));
    }
  } catch (err) {
    console.warn('Failed to save disliked video', err);
  }
}

export async function removeDislikedVideo(videoId: string) {
  try {
    const raw = await AsyncStorage.getItem(DISLIKED_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((id) => id !== videoId);
    await AsyncStorage.setItem(DISLIKED_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to remove disliked video', err);
  }
}

export async function getDislikedVideos(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(DISLIKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to load disliked videos', err);
    return [];
  }
}

/**
 * Video ids the user swiped right (like), newest first — for hydrating swipe itinerary from Supabase.
 */
export async function getUserSwipeLikedVideoIdsOrdered(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('swipes')
      .select('video_id')
      .eq('user_id', userId)
      .eq('swipe_type', 'like')
      .order('updated_at', { ascending: false });

    if (error) {
      if (isMissingTableError(error)) return [];
      console.error('Error loading swipe likes:', error);
      return [];
    }

    return (data ?? []).map((r) => r.video_id);
  } catch (err: any) {
    if (isMissingTableError(err)) return [];
    console.error('Failed to load swipe likes:', err);
    return [];
  }
}
