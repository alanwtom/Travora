# Comment Features Setup Instructions

## Overview
This guide walks you through setting up and deploying the new comment features (likes, pin by author, and replies).

## Prerequisites
- Supabase project initialized
- Expo/React Native environment set up
- All files updated as per the implementation

## Deployment Steps

### 1. Apply Database Migration
```bash
# Navigate to your project
cd /Users/stephanieluu/Documents/GitHub/Travora

# Apply the migration to create new tables and columns
supabase migration up
# OR manually run: supabase/migrations/003_comment_enhancements.sql
```

### 2. Verify Database Changes
```sql
-- In Supabase SQL Editor, verify the new columns exist:
SELECT * FROM public.comments LIMIT 1;

-- Should see: parent_comment_id, is_pinned, like_count columns

-- Check the new table:
SELECT * FROM public.comment_likes LIMIT 1;
```

### 3. Enable RLS Policies
The migration includes RLS policies. Verify they're active:
```sql
-- Check policies are created
SELECT * FROM pg_policies WHERE tablename = 'comment_likes';
SELECT * FROM pg_policies WHERE tablename = 'comments';
```

### 4. Update TypeScript Types (if using manual generation)
```bash
# Generate fresh types from your Supabase schema
npm run generate:types
# or
supabase gen types typescript --project-id <your-project-id> > types/database.ts
```

### 5. Test the Features

#### Test Comment Likes
1. Navigate to a video detail page
2. Click the heart icon on any comment
3. Heart should fill in and like count increase
4. Click again to unlike

#### Test Pin by Author
1. As the video creator, look for the pin icon on comments
2. Click to pin a comment
3. Pinned comment should move to top
4. Pinned badge should appear above comment

#### Test Replies
1. Click "Reply" button on any comment
2. "Replying to comment" context should appear
3. Type reply text and send
4. Reply appears nested under parent comment
5. Click "X" to cancel reply

### 6. Handle Data Migration (if upgrading)

If you already have comments in your database, you may need to:

```sql
-- Set default values for existing comments
UPDATE public.comments
SET parent_comment_id = NULL,
    is_pinned = FALSE,
    like_count = 0
WHERE parent_comment_id IS NULL 
  AND is_pinned IS NULL 
  AND like_count IS NULL;
```

### 7. Update Backend Queries (if using server)

If you have server-side comment queries, update them:

```typescript
// Old query
const comments = await getVideoComments(videoId);

// New query - pass userId for like status
const comments = await getVideoComments(videoId, currentUserId);
```

## File Locations

```
travora/
├── supabase/
│   └── migrations/
│       └── 003_comment_enhancements.sql ← NEW
├── services/
│   └── comments.ts ← UPDATED
├── types/
│   └── database.ts ← UPDATED
├── app/
│   └── video/
│       └── [id].tsx ← UPDATED
└── COMMENT_FEATURES.md ← NEW
```

## Environment Variables
No new environment variables needed. Uses existing Supabase configuration.

## Troubleshooting

### Migration Won't Apply
```bash
# Check migration status
supabase migration list

# Try running with verbose output
supabase migration up --debug
```

### Comment Likes Not Working
1. Verify `comment_likes` table exists
2. Check RLS policies are enabled
3. Ensure user is authenticated
4. Check browser console for errors

### Pinned Comments Not Showing
1. Verify `is_pinned` column exists
2. Check sort order in `getVideoComments` function
3. Ensure query includes `order('is_pinned', { ascending: false })`

### Replies Not Loading
1. Verify `parent_comment_id` column exists
2. Check that `getCommentReplies` is being called
3. Ensure replies array is initialized in CommentWithProfile type

## Performance Tuning

### For Many Comments
If you have videos with 100+ comments:
1. Implement pagination in comment list
2. Load replies on-demand only
3. Use FlatList with `initialNumToRender={10}`

### Database Queries
Check query performance:
```sql
-- Explain analyze for video comments
EXPLAIN ANALYZE
SELECT * FROM public.comments 
WHERE video_id = '<video-id>'
AND parent_comment_id IS NULL
ORDER BY is_pinned DESC, created_at DESC;

-- Check comment_likes index
EXPLAIN ANALYZE
SELECT comment_id FROM public.comment_likes 
WHERE user_id = '<user-id>'
AND comment_id IN ('<comment-id-1>', '<comment-id-2>');
```

## Rollback Instructions

If you need to rollback:

```bash
# Rollback migration
supabase migration down 003_comment_enhancements

# Or manually in Supabase:
-- Drop new table
DROP TABLE IF EXISTS public.comment_likes CASCADE;

-- Remove new columns
ALTER TABLE public.comments 
DROP COLUMN IF EXISTS parent_comment_id,
DROP COLUMN IF EXISTS is_pinned,
DROP COLUMN IF EXISTS like_count;
```

## Monitoring

Monitor comment interactions:
```sql
-- Most liked comments
SELECT comment_id, COUNT(*) as like_count
FROM public.comment_likes
GROUP BY comment_id
ORDER BY like_count DESC
LIMIT 10;

-- Comments with most replies
SELECT parent_comment_id, COUNT(*) as reply_count
FROM public.comments
WHERE parent_comment_id IS NOT NULL
GROUP BY parent_comment_id
ORDER BY reply_count DESC
LIMIT 10;

-- Most active commenters
SELECT user_id, COUNT(*) as comment_count
FROM public.comments
GROUP BY user_id
ORDER BY comment_count DESC
LIMIT 10;
```

## Success Checklist

- [ ] Migration applied successfully
- [ ] New tables/columns visible in Supabase dashboard
- [ ] RLS policies are active
- [ ] TypeScript types generated
- [ ] All errors cleared in IDE
- [ ] Can like/unlike comments
- [ ] Can pin comments as video author
- [ ] Can reply to comments
- [ ] Replies nest properly
- [ ] Like counts update in real-time
- [ ] Pinned comments sort to top
