import { supabase } from '@/lib/supabase';
import { CommentWithProfile } from '@/types/database';

export async function getVideoComments(videoId: string): Promise<CommentWithProfile[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles!comments_user_id_fkey(*)
    `)
    .eq('video_id', videoId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((comment: any) => ({
    ...comment,
    profiles: comment.profiles,
  })) as CommentWithProfile[];
}

export async function addComment(
  userId: string,
  videoId: string,
  content: string
): Promise<CommentWithProfile> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ user_id: userId, video_id: videoId, content })
    .select(`
      *,
      profiles!comments_user_id_fkey(*)
    `)
    .single();

  if (error) throw error;

  return {
    ...data,
    profiles: (data as any).profiles,
  } as CommentWithProfile;
}

export async function updateComment(commentId: string, content: string) {
  const { data, error } = await supabase
    .from('comments')
    .update({ content })
    .eq('id', commentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}

export async function getCommentCount(videoId: string): Promise<number> {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', videoId);

  if (error) throw error;
  return count ?? 0;
}
