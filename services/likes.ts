import { supabase } from '@/lib/supabase';

export async function likeVideo(userId: string, videoId: string) {
  const { error } = await supabase
    .from('likes')
    .insert({ user_id: userId, video_id: videoId });

  if (error) throw error;
}

export async function unlikeVideo(userId: string, videoId: string) {
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('video_id', videoId);

  if (error) throw error;
}

export async function isVideoLiked(userId: string, videoId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function getVideoLikeCount(videoId: string): Promise<number> {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', videoId);

  if (error) throw error;
  return count ?? 0;
}

export async function toggleLike(userId: string, videoId: string): Promise<boolean> {
  const liked = await isVideoLiked(userId, videoId);

  if (liked) {
    await unlikeVideo(userId, videoId);
    return false;
  } else {
    await likeVideo(userId, videoId);
    return true;
  }
}
