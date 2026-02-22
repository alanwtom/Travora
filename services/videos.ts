import { FEED_PAGE_SIZE } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { Video, VideoInsert, VideoUpdate, VideoWithProfile } from '@/types/database';

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

  // If user is logged in, check which videos they've liked and saved
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
      v.is_saved = false; // Default to false until saves table is available
    });

    // Try to fetch saves, but don't fail if the table doesn't exist yet
    try {
      const { data: savedData } = await (supabase
        .from('saves') as any)
        .select('video_id')
        .eq('user_id', userId)
        .in('video_id', videoIds);

      const savedSet = new Set((savedData ?? []).map((s: any) => s.video_id));
      videos.forEach((v: any) => {
        v.is_saved = savedSet.has(v.id);
      });
    } catch (error) {
      // Silently ignore if saves table doesn't exist yet
      console.log('Saves table not yet available');
    }
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
    ...(data as any),
    profiles: (data as any).profiles,
    like_count: (data as any).like_count?.[0]?.count ?? 0,
    comment_count: (data as any).comment_count?.[0]?.count ?? 0,
  } as VideoWithProfile;
}

export async function createVideo(video: VideoInsert): Promise<Video> {
  const { data, error } = await (supabase
    .from('videos') as any)
    .insert(video)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVideo(videoId: string, updates: VideoUpdate): Promise<Video> {
  const { data, error } = await (supabase
    .from('videos') as any)
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
  const { error } = await (supabase.rpc as any)('increment_view_count' as any, {
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
      await (supabase
        .from('videos') as any)
        .update({ view_count: (video as any).view_count + 1 })
        .eq('id', videoId);
    }
  }
}

export async function getFollowingFeed(
  userId: string,
  page: number = 0,
  limit: number = FEED_PAGE_SIZE
): Promise<VideoWithProfile[]> {
  const from = page * limit;
  const to = from + limit - 1;

  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = (followingData ?? []).map((f: any) => f.following_id);
  if (followingIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      profiles!videos_user_id_fkey(*),
      like_count:likes(count),
      comment_count:comments(count)
    `)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const videos = (data ?? []).map((video: any) => ({
    ...video,
    profiles: video.profiles,
    like_count: video.like_count?.[0]?.count ?? 0,
    comment_count: video.comment_count?.[0]?.count ?? 0,
  }));

  if (userId && videos.length > 0) {
    const videoIds = videos.map((v: any) => v.id);
    const { data: likedData } = await supabase
      .from('likes')
      .select('video_id')
      .eq('user_id', userId)
      .in('video_id', videoIds);
    const likedSet = new Set((likedData ?? []).map((l: any) => l.video_id));

    try {
      const { data: savedData } = await (supabase
        .from('saves') as any)
        .select('video_id')
        .eq('user_id', userId)
        .in('video_id', videoIds);
      const savedSet = new Set((savedData ?? []).map((s: any) => s.video_id));
      videos.forEach((v: any) => {
        v.is_liked = likedSet.has(v.id);
        v.is_saved = savedSet.has(v.id);
      });
    } catch {
      videos.forEach((v: any) => {
        v.is_liked = likedSet.has(v.id);
        v.is_saved = false;
      });
    }
  }

  return videos as VideoWithProfile[];
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
