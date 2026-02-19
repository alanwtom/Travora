import { supabase } from '@/lib/supabase';
import { Profile, ProfileUpdate } from '@/types/database';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function getFollowerCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (error) throw error;
  return count ?? 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  if (error) throw error;
  return count ?? 0;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function followUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId });

  if (error) throw error;
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) throw error;
}

const DEFAULT_PAGE_SIZE = 20;

export type ProfileWithFollowStatus = Profile & {
  is_following?: boolean;
};

export async function getFollowers(
  userId: string,
  page: number = 0,
  limit: number = DEFAULT_PAGE_SIZE,
  searchQuery?: string,
  currentUserId?: string
): Promise<ProfileWithFollowStatus[]> {
  const from = page * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('follows')
    .select(`
      follower_id,
      profiles!follows_follower_id_fkey(*)
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data: followData, error } = await query;

  if (error) throw error;

  const profiles = (followData ?? [])
    .map((f: any) => f.profiles)
    .filter(Boolean);

  if (searchQuery && searchQuery.trim()) {
    return await searchFollowers(userId, searchQuery, currentUserId);
  }

  return await enrichWithFollowStatus(profiles, currentUserId);
}

async function searchFollowers(
  userId: string,
  searchQuery: string,
  currentUserId?: string
): Promise<ProfileWithFollowStatus[]> {
  const q = searchQuery.trim();
  const { data: followData } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId);
  const followerIds = (followData ?? []).map((f: any) => f.follower_id);
  if (followerIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', followerIds)
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(100);

  return enrichWithFollowStatus(profiles ?? [], currentUserId);
}

export async function getFollowing(
  userId: string,
  page: number = 0,
  limit: number = DEFAULT_PAGE_SIZE,
  searchQuery?: string,
  currentUserId?: string
): Promise<ProfileWithFollowStatus[]> {
  const from = page * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('follows')
    .select(`
      following_id,
      profiles!follows_following_id_fkey(*)
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data: followData, error } = await query;

  if (error) throw error;

  const profiles = (followData ?? [])
    .map((f: any) => f.profiles)
    .filter(Boolean);

  if (searchQuery && searchQuery.trim()) {
    return await searchFollowing(userId, searchQuery, currentUserId);
  }

  return await enrichWithFollowStatus(profiles, currentUserId);
}

async function searchFollowing(
  userId: string,
  searchQuery: string,
  currentUserId?: string
): Promise<ProfileWithFollowStatus[]> {
  const q = searchQuery.trim();
  const { data: followData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  const followingIds = (followData ?? []).map((f: any) => f.following_id);
  if (followingIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', followingIds)
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(100);

  return enrichWithFollowStatus(profiles ?? [], currentUserId);
}

async function enrichWithFollowStatus(
  profiles: Profile[],
  currentUserId?: string
): Promise<ProfileWithFollowStatus[]> {
  if (!currentUserId || profiles.length === 0) {
    return profiles.map((p) => ({ ...p, is_following: false }));
  }

  const profileIds = profiles.map((p) => p.id).filter((id) => id !== currentUserId);
  if (profileIds.length === 0) {
    return profiles.map((p) => ({ ...p, is_following: p.id === currentUserId }));
  }

  const { data: followData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId)
    .in('following_id', profileIds);

  const followingSet = new Set((followData ?? []).map((f: any) => f.following_id));

  return profiles.map((p) => ({
    ...p,
    is_following: p.id === currentUserId || followingSet.has(p.id),
  }));
}

export async function getSuggestedUsers(
  userId: string,
  limit: number = 5
): Promise<ProfileWithFollowStatus[]> {
  const { data: userLikes } = await supabase
    .from('likes')
    .select('video_id')
    .eq('user_id', userId);

  const likedVideoIds = (userLikes ?? []).map((l: any) => l.video_id);
  if (likedVideoIds.length === 0) {
    return getFallbackSuggestedUsers(userId, limit);
  }

  const { data: likedVideos } = await supabase
    .from('videos')
    .select('id, location')
    .in('id', likedVideoIds);

  const likedLocations = new Set(
    (likedVideos ?? []).map((v: any) => v.location).filter(Boolean)
  );
  const videoIds = new Set((likedVideos ?? []).map((v: any) => v.id));

  if (likedLocations.size === 0) {
    return getFallbackSuggestedUsers(userId, limit);
  }

  const { data: otherUserLikes } = await supabase
    .from('likes')
    .select('user_id, video_id')
    .in('video_id', Array.from(videoIds))
    .neq('user_id', userId);

  const { data: otherVideos } = await supabase
    .from('videos')
    .select('id, location')
    .in('id', (otherUserLikes ?? []).map((l: any) => l.video_id));

  const videoLocationMap = new Map(
    (otherVideos ?? []).map((v: any) => [v.id, v.location])
  );

  const userLocationCounts = new Map<string, number>();
  (otherUserLikes ?? []).forEach((l: any) => {
    const loc = videoLocationMap.get(l.video_id);
    if (loc && likedLocations.has(loc)) {
      userLocationCounts.set(l.user_id, (userLocationCounts.get(l.user_id) ?? 0) + 1);
    }
  });

  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingSet = new Set((followingData ?? []).map((f: any) => f.following_id));

  const sortedUserIds = Array.from(userLocationCounts.entries())
    .filter(([id]) => !followingSet.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (sortedUserIds.length === 0) {
    return getFallbackSuggestedUsers(userId, limit);
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', sortedUserIds);

  const orderMap = new Map(sortedUserIds.map((id, i) => [id, i]));
  const ordered = ((profiles ?? []) as Profile[]).sort(
    (a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999)
  );

  return enrichWithFollowStatus(ordered, userId);
}

async function getFallbackSuggestedUsers(
  userId: string,
  limit: number
): Promise<ProfileWithFollowStatus[]> {
  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingSet = new Set((followingData ?? []).map((f: any) => f.following_id));
  followingSet.add(userId);

  const excludeIds = Array.from(followingSet);
  if (excludeIds.length === 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .limit(limit);
    return enrichWithFollowStatus(profiles ?? [], userId);
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .limit(limit);

  return enrichWithFollowStatus(profiles ?? [], userId);
}

export type ActivityItem = {
  id: string;
  type: 'video_upload' | 'comment';
  created_at: string;
  video_id: string;
  user_id: string;
  profile: Profile;
  video?: { id: string; title: string | null; thumbnail_url: string | null; location: string | null };
  comment_content?: string;
};

export async function getActivityFeed(
  userId: string,
  page: number = 0,
  limit: number = 20
): Promise<ActivityItem[]> {
  const from = page * limit;
  const to = from + limit - 1;

  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = (followingData ?? []).map((f: any) => f.following_id);
  const userVideoIds = await getCurrentUserVideoIds(userId);

  if (followingIds.length === 0 && userVideoIds.length === 0) {
    return [];
  }

  if (followingIds.length === 0) {
    const { data: commentData } = await supabase
      .from('comments')
      .select(`
        id,
        created_at,
        video_id,
        user_id,
        content,
        profiles!comments_user_id_fkey(*),
        videos!inner(id, title, thumbnail_url, location)
      `)
      .in('video_id', userVideoIds)
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    return formatCommentActivities(commentData ?? []);
  }

  const { data: videoData } = await supabase
    .from('videos')
    .select(`
      id,
      user_id,
      created_at,
      title,
      thumbnail_url,
      location,
      profiles!videos_user_id_fkey(*)
    `)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .range(from, to);

  const videoActivities: ActivityItem[] = (videoData ?? []).map((v: any) => ({
    id: v.id,
    type: 'video_upload' as const,
    created_at: v.created_at,
    video_id: v.id,
    user_id: v.user_id,
    profile: v.profiles,
    video: {
      id: v.id,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      location: v.location,
    },
  }));

  if (userVideoIds.length > 0) {
    const { data: commentData } = await supabase
      .from('comments')
      .select(`
        id,
        created_at,
        video_id,
        user_id,
        content,
        profiles!comments_user_id_fkey(*),
        videos!inner(id, title, thumbnail_url, location)
      `)
      .in('video_id', userVideoIds)
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    const commentActivities = formatCommentActivities(commentData ?? []);

    const combined = [...videoActivities, ...commentActivities].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return combined.slice(0, limit);
  }

  return videoActivities;
}

async function getCurrentUserVideoIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('videos')
    .select('id')
    .eq('user_id', userId);
  return (data ?? []).map((v: any) => v.id);
}

function formatCommentActivities(commentData: any[]): ActivityItem[] {
  return commentData.map((c: any) => ({
    id: c.id,
    type: 'comment' as const,
    created_at: c.created_at,
    video_id: c.video_id,
    user_id: c.user_id,
    profile: c.profiles,
    video: c.videos
      ? {
          id: c.videos.id,
          title: c.videos.title,
          thumbnail_url: c.videos.thumbnail_url,
          location: c.videos.location,
        }
      : undefined,
    comment_content: c.content,
  }));
}
