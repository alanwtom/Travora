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
```

**RLS Policies:**
- Users can see collaborations they're part of
- Owners can manage their itinerary's collaborators
- Collaborators can view their own collaboration records

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

-- Index
CREATE INDEX idx_comments_itinerary ON itinerary_comments(itinerary_id);
```

**RLS Policies:**
- Collaborators can read comments for their itineraries
- All collaborators can create comments
- Users can edit/delete their own comments

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
- Use `canEditItinerary()` before write operations

## UI Components

### New Components

#### `CollaboratorsModal.tsx`
- Search users by username (debounced)
- Display current collaborators with avatars and roles
- Add collaborator with role selector
- Remove collaborator button (owner only)
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

## Type Definitions

### `types/database.ts` additions
```typescript
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
- [ ] Viewer cannot edit itinerary
- [ ] Editor can edit itinerary
- [ ] Remove collaborator → access revoked
- [ ] Delete itinerary → collaborators cascade deleted
- [ ] Comments visible to all collaborators
- [ ] Own comment can be edited/deleted

## Migration Path

1. Create migration file for new tables
2. Run migration in Supabase
3. Update type definitions
4. Implement service layer
5. Create UI components
6. Update existing screens
7. Test end-to-end

## Future Enhancements (Out of Scope)

- Real-time collaborative editing
- Transfer ownership
- Public share links (view-only for non-users)
- Activity history/audit log
- Comment threading
- @mentions in comments
