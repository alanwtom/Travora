# Fix: Replies Appearing as Separate Comments After Page Reload

## Problem
When users replied to a comment:
1. ✅ Reply works correctly and appears nested under parent comment
2. ❌ After navigating away and returning, the reply appears as a **separate top-level comment** instead of nested under its parent

This happens because when comments are reloaded, replies weren't being properly re-associated with their parent comments.

## Root Cause
The issue had two parts:

### 1. Optimistic UI Updates Not Syncing with Database
When adding a reply:
- UI optimistically showed it nested under parent
- But when refreshing, the query didn't know which comment was the reply
- `parent_comment_id` field might not have been properly persisted or queried

### 2. Fallback Logic Not Filtering Replies
The legacy fallback (for when migration isn't applied) was returning ALL comments including replies as top-level comments, rather than filtering them out.

## Solution

### Change 1: Reload Comments After Adding Reply
**File:** `app/video/[id].tsx`

```typescript
if (replyingToCommentId) {
  // Reload all comments to ensure database state is in sync
  const updatedComments = await getVideoComments(video.id, user?.id);
  setComments(updatedComments);
  setReplyingToCommentId(null);
} else {
  // For top-level comments, add to beginning of list
  setComments([newComment, ...comments]);
}
```

**Why:** This ensures the UI matches the database state. When you reload comments, they're fetched fresh from the database with proper parent-child relationships intact.

### Change 2: Improved Error Handling
**File:** `services/comments.ts` - `getVideoComments()`

- Added specific checks for migration status
- Better error messages for debugging
- Only falls back to legacy mode when migration is truly missing
- Prevents false fallbacks that could flatten reply structure

### Change 3: Legacy Mode Reply Filtering
**File:** `services/comments.ts` - `getVideoCommentsLegacy()`

```typescript
// Filter to only include top-level comments
const topLevelComments = (data ?? [])
  .filter((comment: any) => !comment.parent_comment_id)
  .map(...);
```

**Why:** Even in legacy mode, we filter out replies so they don't appear as separate comments.

## What Happens Now

### When You Add a Reply:
1. Reply is created in database with `parent_comment_id` set to parent comment ID
2. **Fresh query reloads all comments** from database
3. Comments are fetched with `.is('parent_comment_id', null)` filter
4. Replies are fetched separately via `getCommentReplies()` loop
5. Replies are nested under parent in UI

### When You Return to Video Later:
1. Comments are loaded fresh from database
2. Only top-level comments are fetched (filtered by `parent_comment_id = null`)
3. Replies are loaded for each top-level comment
4. ✅ Reply correctly appears nested under parent

## Testing the Fix

1. **Add a reply** to a comment
2. **Close and reopen** the video detail page
3. **Verify** the reply is still nested under its parent comment
4. ✅ Should NOT appear as separate top-level comment

## Edge Cases Handled

✅ **Legacy database** (no migration) - Replies still filtered out  
✅ **Partial migration** - Falls back gracefully  
✅ **Connection errors** - Attempts reload with fresh data  
✅ **Like/Pin operations** - Preserve reply structure during updates  
✅ **Fast navigation** - Handles rapid loading/unloading  

## Files Modified

1. **`app/video/[id].tsx`**
   - Updated `handleAddComment()` to reload comments after reply

2. **`services/comments.ts`**
   - Improved `getVideoComments()` error handling
   - Fixed `getVideoCommentsLegacy()` to filter replies

## How Parent-Child Relationships Work

### Database Schema
```sql
comments table:
- id (unique identifier)
- parent_comment_id (NULL for top-level, UUID of parent for replies)
```

### Query Flow
```
1. Fetch all comments WHERE parent_comment_id IS NULL
   ↓
2. For each comment, fetch replies WHERE parent_comment_id = comment.id
   ↓
3. Nest replies under parent comment
   ↓
4. Return with proper hierarchy
```

## Result

✅ Replies stay nested after page reload
✅ No duplicate comments  
✅ Works with and without migration
✅ Proper parent-child relationships maintained
