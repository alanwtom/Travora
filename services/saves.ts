import { supabase } from '@/lib/supabase';

export async function saveVideo(userId: string, videoId: string) {
  const { error } = await (supabase
    .from('saves') as any)
    .insert({ user_id: userId, video_id: videoId });

  if (error) throw error;
}

export async function unsaveVideo(userId: string, videoId: string) {
  const { error } = await (supabase
    .from('saves') as any)
    .delete()
    .eq('user_id', userId)
    .eq('video_id', videoId);

  if (error) throw error;
}

export async function isVideoSaved(userId: string, videoId: string): Promise<boolean> {
  try {
    const { data, error } = await (supabase
      .from('saves') as any)
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    // Return false if saves table doesn't exist yet
    return false;
  }
}

export async function getSavedVideos(userId: string) {
  const { data, error } = await (supabase
    .from('saves') as any)
    .select(`
      video_id,
      videos!inner(
        *,
        profiles!videos_user_id_fkey(*),
        like_count:likes(count),
        comment_count:comments(count)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const videos = (data ?? []).map((item: any) => ({
    ...item.videos,
    profiles: item.videos.profiles,
    like_count: item.videos.like_count?.[0]?.count ?? 0,
    comment_count: item.videos.comment_count?.[0]?.count ?? 0,
    is_saved: true,
  }));

  // Check which videos the user has liked
  if (userId && videos.length > 0) {
    const videoIds = videos.map((v: any) => v.id);
    const { data: likedData } = await supabase
      .from('likes')
      .select('video_id')
      .eq('user_id', userId)
      .in('video_id', videoIds);
    const likedSet = new Set((likedData ?? []).map((l: any) => l.video_id));
    videos.forEach((v: any) => {
      v.is_liked = likedSet.has(v.id);
    });
  }

  return videos;
}

export async function toggleSave(userId: string, videoId: string): Promise<boolean> {
  try {
    const saved = await isVideoSaved(userId, videoId);

    if (saved) {
      await unsaveVideo(userId, videoId);
      return false;
    } else {
      await saveVideo(userId, videoId);
      return true;
    }
  } catch (error) {
    // Silently fail if saves table doesn't exist
    console.log('Save functionality not available yet');
    return false;
  }
}

export async function getSaveCount(videoId: string): Promise<number> {
  const { count, error } = await (supabase
    .from('saves') as any)
    .select('*', { count: 'exact', head: true })
    .eq('video_id', videoId);

  if (error) throw error;
  return count ?? 0;
}
