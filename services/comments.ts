import { supabase } from '@/lib/supabase';
import { CommentWithProfile } from '@/types/database';
import { triggerCommentReceived, triggerMentionReceived } from './notificationTriggers';

export async function getVideoComments(videoId: string, userId?: string): Promise<CommentWithProfile[]> {
  try {
    // Try to fetch with new columns (requires migration)
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!comments_user_id_fkey(*)
      `)
      .eq('video_id', videoId)
      .is('parent_comment_id', null)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      // Check if the error is specifically about missing columns (migration not applied)
      const isMigrationMissing = 
        error.message.includes('parent_comment_id') || 
        error.message.includes('is_pinned') ||
        error.code === 'PGRST301'; // Column not found
      
      if (isMigrationMissing) {
        console.log('Migration not applied, using legacy comment loading');
        return getVideoCommentsLegacy(videoId, userId);
      }
      
      // For other errors, rethrow
      throw error;
    }

    // Fetch likes for each comment if user is authenticated
    const comments = (data ?? []).map((comment: any) => ({
      ...comment,
      profiles: comment.profiles,
    })) as CommentWithProfile[];

    if (userId) {
      const commentIds = comments.map(c => c.id);
      if (commentIds.length > 0) {
        try {
          const { data: likes } = await supabase
            .from('comment_likes')
            .select('comment_id')
            .eq('user_id', userId)
            .in('comment_id', commentIds);

          const likedCommentIds = new Set((likes ?? []).map((l: any) => l.comment_id));
          comments.forEach(comment => {
            comment.is_liked = likedCommentIds.has(comment.id);
          });
        } catch (likeError) {
          // Silently fail if comment_likes table doesn't exist
          console.log('Comment likes not available yet');
        }
      }
    }

    // Fetch replies for each comment
    try {
      for (const comment of comments) {
        const replies = await getCommentReplies(comment.id, userId);
        comment.replies = replies;
      }
    } catch (replyError) {
      // Silently fail if replies not supported yet
      console.log('Replies not available yet');
    }

    console.log(`Loaded ${comments.length} top-level comments with replies`, 
      comments.map(c => ({ id: c.id, replyCount: c.replies?.length || 0 })));

    return comments;
  } catch (error: any) {
    console.log('Error in getVideoComments:', error);
    // Fall back to legacy version if anything fails
    return getVideoCommentsLegacy(videoId, userId);
  }
}

// Legacy version for databases without migration applied
async function getVideoCommentsLegacy(videoId: string, userId?: string): Promise<CommentWithProfile[]> {
  // In legacy mode, we can't filter by parent_comment_id, so get all comments
  // but only return top-level ones (those without parent_comment_id if the column exists)
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles!comments_user_id_fkey(*)
    `)
    .eq('video_id', videoId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Filter to only include comments without a parent_comment_id
  // If the column doesn't exist, parent_comment_id will be undefined
  const topLevelComments = (data ?? [])
    .filter((comment: any) => !comment.parent_comment_id)
    .map((comment: any) => ({
      ...comment,
      profiles: comment.profiles,
      is_liked: false,
      replies: [],
    })) as CommentWithProfile[];

  return topLevelComments;
}

async function getCommentRepliesInternal(parentCommentId: string, userId?: string, depth: number = 0): Promise<CommentWithProfile[]> {
  // Limit recursion depth to prevent infinite loops
  const MAX_DEPTH = 10;
  if (depth > MAX_DEPTH) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!comments_user_id_fkey(*)
      `)
      .eq('parent_comment_id', parentCommentId)
      .order('created_at', { ascending: true });

    if (error) {
      // Migration not applied yet
      if (error.message.includes('parent_comment_id')) {
        return [];
      }
      throw error;
    }

    const replies = (data ?? []).map((comment: any) => ({
      ...comment,
      profiles: comment.profiles,
    })) as CommentWithProfile[];

    // Fetch likes for replies if user is authenticated
    if (userId && replies.length > 0) {
      const replyIds = replies.map(r => r.id);
      try {
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', userId)
          .in('comment_id', replyIds);

        const likedCommentIds = new Set((likes ?? []).map((l: any) => l.comment_id));
        replies.forEach(reply => {
          reply.is_liked = likedCommentIds.has(reply.id);
        });
      } catch (likeError) {
        // Silently fail if comment_likes doesn't exist
      }
    }

    // Fetch nested replies for each reply (replies to replies)
    try {
      for (const reply of replies) {
        const nestedReplies = await getCommentRepliesInternal(reply.id, userId, depth + 1);
        reply.replies = nestedReplies;
      }
    } catch (nestedError) {
      // Silently fail if nested replies not supported
      console.log('Nested replies not available yet');
    }

    return replies;
  } catch (error) {
    // If migration not applied, return empty array
    return [];
  }
}

export async function getCommentReplies(parentCommentId: string, userId?: string): Promise<CommentWithProfile[]> {
  return getCommentRepliesInternal(parentCommentId, userId, 0);
}

export async function addComment(
  userId: string,
  videoId: string,
  content: string,
  parentCommentId?: string
): Promise<CommentWithProfile> {
  try {
    // Try to insert with parent_comment_id if provided
    const { data, error } = await supabase
      .from('comments')
      .insert({ 
        user_id: userId, 
        video_id: videoId, 
        content,
        parent_comment_id: parentCommentId || null
      } as any)
      .select(`
        *,
        profiles!comments_user_id_fkey(*)
      `)
      .single();

    if (error) {
      // If parent_comment_id not supported, try without it
      if (parentCommentId && error.message.includes('parent_comment_id')) {
        return addCommentLegacy(userId, videoId, content);
      }
      throw error;
    }

    const createdComment = {
      ...(data as any),
      profiles: (data as any).profiles,
    } as CommentWithProfile;

    void notifyVideoOwnerAboutComment(
      userId,
      videoId,
      createdComment.id,
      content
    );

    return createdComment;
  } catch (error: any) {
    // Fall back to legacy if anything fails
    if (parentCommentId && error.message.includes('parent_comment_id')) {
      return addCommentLegacy(userId, videoId, content);
    }
    throw error;
  }
}

// Legacy version without reply support
async function addCommentLegacy(
  userId: string,
  videoId: string,
  content: string
): Promise<CommentWithProfile> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ 
      user_id: userId, 
      video_id: videoId, 
      content
    } as any)
    .select(`
      *,
      profiles!comments_user_id_fkey(*)
    `)
    .single();

  if (error) throw error;

  const createdComment = {
    ...(data as any),
    profiles: (data as any).profiles,
    is_liked: false,
    replies: [],
  } as CommentWithProfile;

  void notifyVideoOwnerAboutComment(
    userId,
    videoId,
    createdComment.id,
    content
  );

  return createdComment;
}

async function notifyVideoOwnerAboutComment(
  commenterId: string,
  videoId: string,
  commentId: string,
  commentContent: string
): Promise<void> {
  try {
    const [{ data: videoData }, { data: commenterProfileData }] = await Promise.all([
      supabase
        .from('videos')
        .select('user_id')
        .eq('id', videoId)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('username, display_name')
        .eq('id', commenterId)
        .maybeSingle(),
    ]);

    const video = videoData as { user_id: string } | null;
    const commenterProfile = commenterProfileData as
      | { username: string | null; display_name: string | null }
      | null;

    if (!video?.user_id || video.user_id === commenterId) {
      return;
    }

    const username =
      commenterProfile?.username || commenterProfile?.display_name || 'Someone';

    await triggerCommentReceived(video.user_id, {
      username,
      commentContent: commentContent.trim().slice(0, 140),
      videoId,
      commentId,
      commenterId,
    });

    const mentionUsernames = extractMentionUsernames(commentContent);
    if (mentionUsernames.length === 0) {
      return;
    }

    const { data: mentionedProfiles, error: mentionQueryError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('username', mentionUsernames as any);

    if (mentionQueryError) {
      console.warn('Failed to load mentioned users:', mentionQueryError);
      return;
    }

    const uniqueMentionIds = Array.from(
      new Set((mentionedProfiles ?? []).map((profile: any) => profile.id as string))
    ).filter((mentionedId) => mentionedId !== commenterId && mentionedId !== video.user_id);

    if (uniqueMentionIds.length === 0) {
      return;
    }

    await Promise.all(
      uniqueMentionIds.map((mentionedId) =>
        triggerMentionReceived(mentionedId, {
          username,
          commentContent: commentContent.trim().slice(0, 140),
          videoId,
          commentId,
          mentionerId: commenterId,
        })
      )
    );
  } catch (notifyError) {
    console.warn('Failed to create comment received notification:', notifyError);
  }
}

function extractMentionUsernames(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
  const mentions = new Set<string>();
  let match: RegExpExecArray | null = null;

  while ((match = mentionRegex.exec(content)) !== null) {
    const username = match[1]?.trim();
    if (username) {
      mentions.add(username);
    }
  }

  return Array.from(mentions);
}

export async function updateComment(commentId: string, content: string) {
  const updates: Record<string, any> = { content };
  const { error } = await (supabase as any)
    .from('comments')
    .update(updates)
    .eq('id', commentId);

  if (error) throw error;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}

export async function toggleCommentLike(userId: string, commentId: string): Promise<boolean> {
  try {
    // Check if already liked
    const { data: existingLike, error: checkError } = await (supabase as any)
      .from('comment_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('comment_id', commentId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // If comment_likes table doesn't exist, silently return false
      if (checkError.message.includes('comment_likes')) {
        console.log('Comment likes not available yet');
        return false;
      }
      throw checkError;
    }

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('user_id', userId)
        .eq('comment_id', commentId);

      if (deleteError) throw deleteError;
      return false;
    } else {
      // Like
      const { error: insertError } = await (supabase as any)
        .from('comment_likes')
        .insert({ user_id: userId, comment_id: commentId });

      if (insertError) throw insertError;
      return true;
    }
  } catch (error: any) {
    // If comment_likes table doesn't exist, silently return false
    if (error.message.includes('comment_likes')) {
      console.log('Comment likes not available yet');
      return false;
    }
    throw error;
  }
}

export async function pinComment(commentId: string, isPinned: boolean) {
  try {
    const updates: Record<string, any> = { is_pinned: isPinned };
    const { error } = await (supabase as any)
      .from('comments')
      .update(updates)
      .eq('id', commentId);

    if (error) {
      // If is_pinned column doesn't exist, silently fail
      if (error.message.includes('is_pinned')) {
        console.log('Pin feature not available yet');
        return;
      }
      throw error;
    }
  } catch (error: any) {
    // Silently fail if migration not applied
    if (error.message.includes('is_pinned')) {
      console.log('Pin feature not available yet');
      return;
    }
    throw error;
  }
}

export async function getCommentCount(videoId: string): Promise<number> {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', videoId);

  if (error) throw error;
  return count ?? 0;
}
