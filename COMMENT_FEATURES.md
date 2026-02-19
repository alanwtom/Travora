# Comment Enhancements: Likes, Pin by Author, and Replies

## Summary of Changes

This implementation adds three major features to the comment system:

### 1. **Comment Likes** ❤️
- Users can now like/unlike individual comments
- Like count is displayed and updated in real-time
- Liked state is tracked per user

### 2. **Pin by Author** 📌
- Video creators can pin important comments
- Pinned comments appear at the top of the comments list
- Visual indicator shows pinned status with a badge

### 3. **Reply to Comments** 💬
- Users can reply directly to specific comments
- Replies are nested under parent comments
- Reply count with expandable/collapsible view
- Reply context indicator when composing a reply

---

## Files Modified

### 1. **Database Migration** (`supabase/migrations/003_comment_enhancements.sql`)
- Added `parent_comment_id` column to `comments` table for reply threading
- Added `is_pinned` boolean column to `comments` table
- Added `like_count` integer column to `comments` table (auto-updated)
- Created new `comment_likes` table to track comment likes
- Added indexes for efficient queries
- Created trigger to auto-update comment like count
- Added RLS policies for security

### 2. **Database Types** (`types/database.ts`)
- Updated `comments` table schema with new fields
- Added `comment_likes` table type definition
- Added `CommentLike` and `CommentLikeInsert` convenience types
- Extended `CommentWithProfile` type with `is_liked` and `replies` fields

### 3. **Comments Service** (`services/comments.ts`)
New/Updated functions:
- `getVideoComments(videoId, userId?)` - Fetches top-level comments with replies, sorted by pinned status
- `getCommentReplies(parentCommentId, userId?)` - Fetches replies for a specific comment
- `addComment(userId, videoId, content, parentCommentId?)` - Create comment or reply
- `toggleCommentLike(userId, commentId)` - Like/unlike a comment
- `pinComment(commentId, isPinned)` - Pin/unpin a comment (author only)
- `updateComment()` - Update comment content
- `deleteComment()` - Delete a comment
- `getCommentCount()` - Get total comment count

### 4. **Video Detail Screen** (`app/video/[id].tsx`)

#### State Management
- `replyingToCommentId` - Track which comment is being replied to
- `expandedCommentId` - Track which comment thread is expanded

#### Event Handlers
- `handleToggleCommentLike()` - Toggle like status and update UI
- `handlePinComment()` - Pin/unpin comments (author only with validation)
- `handleAddComment()` - Create comment or reply with context awareness

#### UI Components
- **Pinned Badge**: Visual indicator for pinned comments
- **Author Badge**: Shows if comment is from video creator
- **Comment Actions**: Like, Reply, and View Replies buttons
- **Replies Container**: Expandable/collapsible reply thread with nested styling
- **Reply Context**: Shows when user is composing a reply with option to cancel

#### Styling
Added 30+ new style definitions:
- `pinnedBadge` - Pinned indicator styling
- `authorBadge` - Author label styling
- `commentActions` - Action buttons row
- `replyingToContext` - Reply composition context
- `repliesContainer` - Nested replies container
- `replyItem`, `replyHeader`, `replyAvatar`, etc. - Reply-specific styles
- `actionItem`, `actionText` - Action button styling

---

## Features Overview

### Comment Likes
```typescript
// Like a comment
const isNowLiked = await toggleCommentLike(userId, commentId);

// Display with visual feedback
<FontAwesome 
  name={comment.is_liked ? 'heart' : 'heart-o'} 
  color={comment.is_liked ? COLORS.error : COLORS.textMuted}
/>
```

### Pin by Author
```typescript
// Only video author can pin
if (user.id === video.user_id) {
  await handlePinComment(commentId, currentPinnedStatus);
}

// Pinned comments sort to top
.order('is_pinned', { ascending: false })
```

### Reply Threading
```typescript
// Create reply
await addComment(userId, videoId, content, parentCommentId);

// Fetch with replies
const comments = await getVideoComments(videoId, userId);
// Each comment has replies[] array

// Expand/collapse replies
{expandedCommentId === comment.id && comment.replies && 
  <View style={styles.repliesContainer}>
    {comment.replies.map(reply => renderReply(reply))}
  </View>
}
```

---

## User Experience

### For Readers
1. **Like Comments**: Click heart icon to like/unlike
2. **View Replies**: Click reply count to expand/collapse thread
3. **See Author**: Identify video creator's comments with badge
4. **See Pinned**: Important comments are pinned at top

### For Authors
1. **Create Comments**: Comment on their own videos
2. **Pin Comments**: Highlight important feedback
3. **Reply**: Engage in threaded discussions
4. **Like Comments**: Engage with community feedback

---

## Database Schema

### Comments Table (Enhanced)
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- video_id (UUID, FK)
- parent_comment_id (UUID, FK) -- NEW: For replies
- content (TEXT)
- is_pinned (BOOLEAN) -- NEW: Pinned by author
- like_count (INTEGER) -- NEW: Auto-updated
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Comment Likes Table (NEW)
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- comment_id (UUID, FK)
- created_at (TIMESTAMPTZ)
- UNIQUE(user_id, comment_id) -- One like per user per comment
```

---

## Security & Permissions

✅ RLS Policies enforced:
- Only authenticated users can like comments
- Only video author can pin comments
- Users can only unlike their own likes
- Comments are viewable by everyone
- Authenticated users can create comments/replies

---

## Performance Optimizations

1. **Efficient Queries**
   - Comments sorted by `is_pinned` DESC, then `created_at` DESC
   - Comment likes fetched in single batch query
   - Replies loaded on-demand when expanded

2. **Indexes**
   - `idx_comments_parent_id` - Fast reply lookups
   - `idx_comment_likes_comment_id` - Fast like count queries
   - `idx_comment_likes_user_id` - Fast user like lookups

3. **UI Performance**
   - FlatList for comment rendering
   - Expandable replies prevent rendering all at once
   - Lazy loading of reply threads

---

## Testing Checklist

- [ ] Can like/unlike comments
- [ ] Like count updates in real-time
- [ ] Only video author can pin comments
- [ ] Pinned comments appear at top
- [ ] Can reply to comments
- [ ] Replies are nested and expandable
- [ ] Reply context shows when composing
- [ ] Author badge shows on creator's comments
- [ ] Video author can pin/unpin own comments
- [ ] Non-author sees pin button but can't use it
- [ ] All comment actions work offline (optimistic updates)

---

## Future Enhancements

- [ ] Edit comments
- [ ] Delete comments (with soft delete)
- [ ] Block users from commenting
- [ ] Comment mentions (@user)
- [ ] Emoji reactions
- [ ] Rich text formatting
- [ ] Comment notifications
- [ ] Comment moderation tools
