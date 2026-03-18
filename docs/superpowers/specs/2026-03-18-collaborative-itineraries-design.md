# Collaborative Itinerary Editing Design

**Date:** 2026-03-18
**Author:** Claude
**Status:** Draft
**Related Issue:** TM07-14

## Overview

Enable users to invite collaborators to their travel itineraries with role-based access control. Viewers can comment; editors can make changes. Invitations are sent via in-app notifications.

## Requirements

### Functional Requirements
- Users can invite others by username to collaborate on itineraries
- Two roles: **Editor** (full edit access) and **Viewer** (read-only + comment)
- In-app notifications for invitations
- Comment system for all collaborators
- Permission enforcement at database and UI levels

### Non-Functional Requirements
- Basic sync (last-save-wins), no real-time collaboration
- Existing notification system leveraged for invites
- RLS policies for data security

## Architecture

### Approach
**Direct Row-Level Sharing** - New junction table links users to itineraries with roles. RLS policies enforce permissions at database level.

### Rationale
- Clean architecture, leverages Supabase RLS
- Scales well with clear permission boundaries
- Maintains data integrity

## Database Schema

### Migration File
`supabase/migrations/008_collaborative_itineraries.sql`

### New Tables

#### `itinerary_collaborators`
```sql
CREATE TABLE itinerary_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(itinerary_id, user_id)
);

ALTER TABLE itinerary_collaborators ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_collaborators_itinerary ON itinerary_collaborators(itinerary_id);
CREATE INDEX idx_collaborators_user ON itinerary_collaborators(user_id);

-- RLS Policies
-- Users can see their own collaborations
CREATE POLICY "Users can view own collaborations"
  ON itinerary_collaborators FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can see collaborations for itineraries they own or collaborate on
CREATE POLICY "Users can view collaborations for accessible itineraries"
  ON itinerary_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_collaborators.itinerary_id
      AND (itineraries.user_id::text = auth.uid()::text
           OR EXISTS (
             SELECT 1 FROM itinerary_collaborators AS ic
             WHERE ic.itinerary_id = itineraries.id
             AND ic.user_id::text = auth.uid()::text
           ))
    )
  );

-- Owners can insert collaborators
CREATE POLICY "Owners can add collaborators"
  ON itinerary_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_id
      AND itineraries.user_id::text = auth.uid()::text
    )
  );

-- Owners can update collaborator roles
CREATE POLICY "Owners can update collaborators"
  ON itinerary_collaborators FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_id
      AND itineraries.user_id::text = auth.uid()::text
    )
  );

-- Owners can delete collaborators
CREATE POLICY "Owners can remove collaborators"
  ON itinerary_collaborators FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_id
      AND itineraries.user_id::text = auth.uid()::text
    )
  );
```

#### `itinerary_comments`
```sql
CREATE TABLE itinerary_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE itinerary_comments ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_comments_itinerary ON itinerary_comments(itinerary_id);
CREATE INDEX idx_comments_itinerary_user ON itinerary_comments(itinerary_id, created_at DESC);

-- Auto-update updated_at trigger
CREATE TRIGGER itinerary_comments_updated_at
  BEFORE UPDATE ON itinerary_comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- RLS Policies
-- Collaborators can read comments
CREATE POLICY "Collaborators can read comments"
  ON itinerary_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_comments.itinerary_id
      AND (itineraries.user_id::text = auth.uid()::text
           OR EXISTS (
             SELECT 1 FROM itinerary_collaborators
             WHERE itinerary_collaborators.itinerary_id = itineraries.id
             AND itinerary_collaborators.user_id::text = auth.uid()::text
           ))
    )
  );

-- Collaborators can create comments
CREATE POLICY "Collaborators can create comments"
  ON itinerary_comments FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id::text
    AND EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_id
      AND (itineraries.user_id::text = auth.uid()::text
           OR EXISTS (
             SELECT 1 FROM itinerary_collaborators
             WHERE itinerary_collaborators.itinerary_id = itineraries.id
             AND itinerary_collaborators.user_id::text = auth.uid()::text
           ))
    )
  );

-- Users can update own comments (only while still a collaborator)
CREATE POLICY "Users can update own comments"
  ON itinerary_comments FOR UPDATE
  USING (
    auth.uid()::text = user_id::text
    AND EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_comments.itinerary_id
      AND (itineraries.user_id::text = auth.uid()::text
           OR EXISTS (
             SELECT 1 FROM itinerary_collaborators
             WHERE itinerary_collaborators.itinerary_id = itineraries.id
             AND itinerary_collaborators.user_id::text = auth.uid()::text
           ))
    )
  );

-- Users can delete own comments or itinerary owners can delete any
CREATE POLICY "Users can delete own comments"
  ON itinerary_comments FOR DELETE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Owners can delete any comment"
  ON itinerary_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_comments.itinerary_id
      AND itineraries.user_id::text = auth.uid()::text
    )
  );
```

### Update Existing `itineraries` RLS Policies

The existing `itineraries` table RLS policies must be updated to allow collaborators to read shared itineraries:

```sql
-- Drop existing SELECT policy (if it only checks ownership)
DROP POLICY IF EXISTS "Users can view own itineraries" ON itineraries;

-- New policy: Users can view own itineraries OR shared itineraries
CREATE POLICY "Users can view own and shared itineraries"
  ON itineraries FOR SELECT
  USING (
    itineraries.user_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM itinerary_collaborators
      WHERE itinerary_collaborators.itinerary_id = itineraries.id
      AND itinerary_collaborators.user_id::text = auth.uid()::text
    )
  );

-- Update UPDATE policy to allow editors
CREATE POLICY "Owners and editors can update itineraries"
  ON itineraries FOR UPDATE
  USING (
    itineraries.user_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM itinerary_collaborators
      WHERE itinerary_collaborators.itinerary_id = itineraries.id
      AND itinerary_collaborators.user_id::text = auth.uid()::text
      AND itinerary_collaborators.role = 'editor'
    )
  );

-- Update DELETE policy (owner only)
CREATE POLICY "Owners can delete own itineraries"
  ON itineraries FOR DELETE
  USING (itineraries.user_id::text = auth.uid()::text);
```

### Notification Template

Add the `itinerary_invite` notification template:

```sql
INSERT INTO notification_templates (
  category,
  trigger_event,
  priority,
  default_channels,
  title_template,
  body_template,
  is_essential
) VALUES (
  'social',
  'itinerary_invite',
  'medium',
  ARRAY['push'::notification_channel, 'in_app'::notification_channel],
  'You're invited to collaborate!',
  '{inviter} invited you to {itinerary_title} as a {role}.',
  false
);
```

## Services Layer

### `services/collaborators.ts`
```typescript
inviteCollaborator(itineraryId: string, username: string, role: 'editor' | 'viewer')
  → Look up user by username
  → Create collaboration record
  → Send notification

getCollaborators(itineraryId: string)
  → Fetch collaborators with profile data

removeCollaborator(itineraryId: string, userId: string)
  → Delete collaboration record (owner only)

leaveItinerary(itineraryId: string)
  → User voluntarily leaves a shared itinerary
  → CONSTRAINT: Owners cannot leave (must delete itinerary or transfer ownership)

updateCollaboratorRole(itineraryId: string, userId: string, role: 'editor' | 'viewer')
  → Update role (owner only)

getSharedItineraries(userId: string)
  → Fetch itineraries shared with user

canEditItinerary(itineraryId: string, userId: string)
  → Check if user is owner or editor
```

### `services/itineraryComments.ts`
```typescript
addComment(itineraryId: string, content: string)
  → Create comment

getComments(itineraryId: string)
  → Fetch comments with user profiles

updateComment(commentId: string, content: string)
  → Edit own comment

deleteComment(commentId: string)
  → Delete own comment or as itinerary owner
```

### Updated `services/itineraries.ts`
- Modify queries to include shared itineraries
- Permission enforcement occurs at TWO levels:
  1. **Database RLS policies** - Primary security enforcement
  2. **UI guards via `canEditItinerary()`** - User experience (disable controls)
- Note: RLS is the authoritative permission check; UI checks are for UX only

## UI Components

### New Components

#### `CollaboratorsModal.tsx`
- Search users by username (debounced)
- Display current collaborators with avatars and roles
- Add collaborator with role selector
- Remove collaborator button (owner only)
- "Leave Itinerary" button for collaborators (non-owners)
- Role badges (Editor/Viewer)

#### `ItineraryComments.tsx`
- Comment list at bottom of itinerary detail
- Input field (all roles can comment)
- Delete button on own comments
- Timestamp and user avatar display

#### `CollaboratorBadge.tsx`
- Shows "X collaborators" pill/badge
- Taps open CollaboratorsModal

### Updated Screens

#### `app/profile/itineraries/[id].tsx`
- Replace "Share" placeholder with "Invite" button
- Show collaborator avatars in header
- Conditionally show edit controls based on permission
- Integrate comments section

#### `app/(tabs)/activity.tsx`
- Show collaboration invites in feed
- Accept/decline actions

## Data Flows

### Invitation Flow
```
User → CollaboratorsModal → search username
                ↓
inviteCollaborator() → lookup user
                ↓
      Create itinerary_collaborators row
                ↓
      Create notification (itinerary_invite)
                ↓
      Invitee sees in activity → accepts
```

### Permission Check
```
canEditItinerary(itineraryId, userId)
  → Is owner? → true
  → Has 'editor' role? → true
  → Otherwise → false
```

### Comment Flow
```
User types comment → addComment()
        ↓
Insert to itinerary_comments
        ↓
Refresh comment list
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| Username not found | Show "User not found" error |
| Already collaborator | Show "User already has access" |
| Non-owner removes collaborator | Block with "Only owner can remove" |
| Viewer tries to edit | Silently disable controls |
| Notification fails | Log error, don't block collaboration |
| Owner deletes itinerary | CASCADE delete collaborators/comments |
| User deleted | CASCADE removes collaborations/comments |
| Collaborator removed | Comments remain (attributed to user who left) |
| User leaves itinerary | Comments remain (historical preservation) |

## Type Definitions

### `types/database.ts` additions

**Note:** The `Itinerary` and `ItineraryRating` base types must be added to `types/database.ts` as they are currently missing despite existing in migration 007.

```typescript
// Base types (need to be added - missing from current codebase)
interface Itinerary {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  duration_days: number | null;
  travel_style: string | null;
  budget_level: string | null;
  generated_by: string;
  generation_time_ms: number | null;
  days: ItineraryDay[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface ItineraryRating {
  id: string;
  itinerary_id: string;
  user_id: string;
  rating: boolean;
  feedback: string | null;
  created_at: string;
}

interface ItineraryDay {
  date: string;
  activities: ItineraryActivity[];
}

interface ItineraryActivity {
  time: string;
  title: string;
  location: string | null;
  duration?: number;
  description?: string;
}

// New collaborative types
interface ItineraryCollaborator {
  id: string;
  itinerary_id: string;
  user_id: string;
  role: 'editor' | 'viewer';
  created_at: string;
}

interface ItineraryComment {
  id: string;
  itinerary_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

type CollaborationRole = 'editor' | 'viewer';
```

### `types/notifications.ts` additions

Add `itinerary_invite` to the notification trigger types:

```typescript
// Add to NotificationTriggerEvent union type (around line 154)
export type NotificationTriggerEvent =
  | 'follow_received'
  | 'like_received'
  | 'comment_received'
  | 'itinerary_invite'  // NEW - add this line
  | 'review_received'
  // ... existing events
```

## Testing Strategy

### Unit Tests
- `canEditItinerary()` logic variations
- Username lookup validation
- Role boundary checking

### Integration Tests
- Invite flow end-to-end
- Permission enforcement
- Comment CRUD operations

### Manual Testing Checklist
- [ ] Invite by username → notification received
- [ ] Accept invite → access granted
- [ ] Decline invite → no access granted
- [ ] Viewer cannot edit itinerary
- [ ] Editor can edit itinerary
- [ ] Remove collaborator → access revoked
- [ ] Leave itinerary (as collaborator) → access removed
- [ ] Delete itinerary → collaborators cascade deleted
- [ ] Comments visible to all collaborators
- [ ] Own comment can be edited/deleted
- [ ] RLS policies prevent unauthorized access

## Migration Path

**File:** `supabase/migrations/008_collaborative_itineraries.sql`

**Note:** This migration builds upon `007_itinerary_system.sql` which created the base itineraries table. Verify the migration sequence is clean before proceeding.

1. Create `itinerary_collaborators` table with RLS policies
2. Create `itinerary_comments` table with RLS policies and updated_at trigger
3. Update existing `itineraries` RLS policies to allow collaborator read/editor write
4. Insert `itinerary_invite` notification template
5. Run migration in Supabase
6. Update type definitions in `types/database.ts`
7. Update `types/notifications.ts` with `itinerary_invite` trigger event
8. Implement service layer (`services/collaborators.ts`, `services/itineraryComments.ts`)
9. Create UI components (`CollaboratorsModal.tsx`, `ItineraryComments.tsx`, `CollaboratorBadge.tsx`)
10. Update existing screens (`app/profile/itineraries/[id].tsx`, `app/(tabs)/activity.tsx`)
11. Test end-to-end

## Future Enhancements (Out of Scope)

- Real-time collaborative editing
- Transfer ownership
- Public share links (view-only for non-users)
- Activity history/audit log
- Comment threading
- @mentions in comments
