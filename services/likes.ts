import { supabase } from '@/lib/supabase';
import { triggerVideoLiked } from './notificationTriggers';

export async function likeVideo(userId: string, videoId: string) {
  const { error } = await supabase
    .from('likes')
    .insert({ user_id: userId, video_id: videoId });

  if (error) throw error;

  try {
    const [{ data: videoData }, { data: likerProfileData }] = await Promise.all([
      supabase
        .from('videos')
        .select('id, user_id, title')
        .eq('id', videoId)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('username, display_name')
        .eq('id', userId)
        .maybeSingle(),
    ]);

    const video = videoData as { id: string; user_id: string; title: string | null } | null;
    const likerProfile = likerProfileData as
      | { username: string | null; display_name: string | null }
      | null;

    if (!video?.user_id || video.user_id === userId) {
      return;
    }

    const username = likerProfile?.username || likerProfile?.display_name || 'Someone';

    await triggerVideoLiked(video.user_id, {
      username,
      videoTitle: video.title ?? undefined,
      videoId,
      likerId: userId,
    });
  } catch (notifyError) {
    console.warn('Failed to create video liked notification:', notifyError);
  }
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
