# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Start development server
npm start
# Run on specific platform
npm run android    # or press 'a' in dev server
npm run ios        # or press 'i' in dev server
npm run web        # or press 'w' in dev server
```

## Architecture Overview

### Tech Stack
- **Framework**: React Native (Expo SDK 54)
- **Routing**: Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Language**: TypeScript

### Directory Structure & Patterns

```
app/                    # Expo Router pages (file-based routing)
├── (auth)/            # Authenticated route group (sign-in, sign-up, welcome)
├── (tabs)/            # Main tab navigation (home, explore, upload, profile)
└── profile/           # Nested profile routes (edit)
components/            # Reusable UI components (VideoCard, Themed, etc.)
hooks/                 # Custom React hooks for data fetching (useFeedVideos, useUserVideos, useVideoSearch)
lib/                   # Core configuration (supabase client, constants, colors)
providers/             # React context providers (AuthProvider)
services/              # Business logic / API layer (auth, videos, profiles, storage, likes, comments)
types/                 # TypeScript definitions (database schema types)
```

### Key Architectural Patterns

**Supabase Client Singleton** (`lib/supabase.ts`):
- Uses a Proxy to lazily initialize the Supabase client
- Handles SSR compatibility by detecting `typeof window` and using no-op storage on server
- On client-side, uses AsyncStorage for session persistence

**Authentication Flow**:
- `AuthProvider` wraps the entire app in `app/_layout.tsx`
- Auth state is managed via Supabase's `onAuthStateChange`
- Route protection logic in `RootLayoutNav` redirects unauthenticated users to `/(auth)/welcome`
- On signup, a database trigger (`handle_new_user()`) auto-creates a profile row

**Data Fetching Pattern**:
- Services layer (`services/`) contains pure functions for API calls
- Hooks layer (`hooks/`) wraps services with React state (loading, error, pagination)
- Hooks like `useFeedVideos` support infinite scroll (`loadMore`, `hasMore`)
- `VideoWithProfile` and `CommentWithProfile` are extended types that join related data

**Video Upload Optimization** (`services/storage.ts`):
- Videos are uploaded using `FileSystem.uploadAsync` to avoid base64 memory issues with large files
- Thumbnails use base64 encoding (smaller files)
- Video and thumbnail upload in parallel via `Promise.all()` for performance
- Storage structure: `videos/{userId}/{filename}.mp4` and `videos/{userId}/thumbnails/{filename}.jpg`

**Database Schema** (`supabase/migrations/001_initial_schema.sql`):
- All tables have RLS enabled with appropriate policies
- Automatic `updated_at` timestamps via triggers
- Profile auto-creation on signup via trigger
- Storage policies enforce users can only access their own folder (`auth.uid()::text = (storage.foldername(name))[1]`)

### Routing Structure

- `app/index.tsx` — Entry point that redirects based on auth state
- `app/(auth)/` — Unauthenticated screens (sign-in, sign-up, welcome)
- `app/(tabs)/` — Authenticated tab navigation
- Route groups `()` in directory names don't appear in URL

### Type Safety

- `types/database.ts` contains auto-generated Supabase types
- Always use these types when working with Supabase queries
- Extended types like `VideoWithProfile` include joined relations and aggregates

### Environment Variables

Required in `.env` (see `.env.example`):
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key

### Database Setup

Run the SQL migration in Supabase SQL Editor:
```
supabase/migrations/001_initial_schema.sql
```

This creates all tables, indexes, RLS policies, storage buckets, and triggers.

### Key Constraints & Invariants

- Videos max 100MB, avatars max 5MB (see `lib/constants.ts`)
- Feed page size is 10 videos per page
- All storage uploads use the user's ID as the top-level folder for RLS compliance
- `likes` table has `UNIQUE(user_id, video_id)` constraint to prevent duplicate likes
- `follows` table prevents self-follows via constraint
