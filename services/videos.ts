import { supabase } from '@/lib/supabase';
import { Video, VideoInsert, VideoUpdate, VideoWithProfile } from '@/types/database';
import { FEED_PAGE_SIZE } from '@/lib/constants';

export async function getFeedVideos(
  page: number = 0,
  userId?: string
): Promise<VideoWithProfile[]> {
  const from = page * FEED_PAGE_SIZE;
  const to = from + FEED_PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      profiles!videos_user_id_fkey(*),
      like_count:likes(count),
      comment_count:comments(count)
    `)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  // Transform the count aggregates and check if user liked each video
  const videos = (data ?? []).map((video: any) => ({
    ...video,
    profiles: video.profiles,
    like_count: video.like_count?.[0]?.count ?? 0,
    comment_count: video.comment_count?.[0]?.count ?? 0,
  }));

  // If user is logged in, check which videos they've liked
  if (userId && videos.length > 0) {
    const videoIds = videos.map((v: any) => v.id);
    const { data: likedData } = await supabase
      .from('likes')
      .select('video_id')
      .eq('user_id', userId)
      .in('video_id', videoIds);

    const likedSet = new Set(likedData?.map((l) => l.video_id) ?? []);
    videos.forEach((v: any) => {
      v.is_liked = likedSet.has(v.id);
    });
  }

  return videos as VideoWithProfile[];
}

export async function getUserVideos(userId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getVideo(videoId: string): Promise<VideoWithProfile | null> {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      profiles!videos_user_id_fkey(*),
      like_count:likes(count),
      comment_count:comments(count)
    `)
    .eq('id', videoId)
    .single();

  if (error) throw error;

  return {
    ...data,
    profiles: (data as any).profiles,
    like_count: (data as any).like_count?.[0]?.count ?? 0,
    comment_count: (data as any).comment_count?.[0]?.count ?? 0,
  } as VideoWithProfile;
}

export async function createVideo(video: VideoInsert): Promise<Video> {
  const { data, error } = await supabase
    .from('videos')
    .insert(video)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVideo(videoId: string, updates: VideoUpdate): Promise<Video> {
  const { data, error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', videoId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVideo(videoId: string) {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', videoId);

  if (error) throw error;
}

export async function incrementViewCount(videoId: string) {
  const { error } = await supabase.rpc('increment_view_count' as any, {
    video_id: videoId,
  });

  // Fallback if RPC doesn't exist: direct update
  if (error) {
    const { data: video } = await supabase
      .from('videos')
      .select('view_count')
      .eq('id', videoId)
      .single();

    if (video) {
      await supabase
        .from('videos')
        .update({ view_count: video.view_count + 1 })
        .eq('id', videoId);
    }
  }
}

export async function searchVideos(query: string): Promise<VideoWithProfile[]> {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      profiles!videos_user_id_fkey(*),
      like_count:likes(count),
      comment_count:comments(count)
    `)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%,caption.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data ?? []).map((video: any) => ({
    ...video,
    profiles: video.profiles,
    like_count: video.like_count?.[0]?.count ?? 0,
    comment_count: video.comment_count?.[0]?.count ?? 0,
  })) as VideoWithProfile[];
}
