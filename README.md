# Travora

A mobile travel video-sharing app built with React Native (Expo) and Supabase.

## Features

- **Authentication** — Email/password, Google OAuth, and Apple Sign-In
- **User Profiles** — Editable profiles with avatar, bio, location, and website
- **Video Upload** — Upload travel videos with titles, descriptions, captions, and location tags
- **Video Feed** — Browse a feed of travel videos from other users
- **Explore & Search** — Discover videos by destination, topic, or creator
- **Social** — Like videos, leave comments, follow other travelers

## Tech Stack

| Layer        | Technology              |
| ------------ | ----------------------- |
| Framework    | React Native (Expo 54)  |
| Routing      | Expo Router (file-based)|
| Backend      | Supabase (PostgreSQL)   |
| Auth         | Supabase Auth           |
| Storage      | Supabase Storage        |
| Language     | TypeScript              |

## Project Structure

```
Travora/
├── app/                        # Expo Router pages
│   ├── _layout.tsx             # Root layout (AuthProvider)
│   ├── index.tsx               # Entry redirect
│   ├── (auth)/                 # Auth screens (sign-in, sign-up)
│   ├── (tabs)/                 # Main tab screens
│   │   ├── index.tsx           # Home feed
│   │   ├── explore.tsx         # Search & discover
│   │   ├── upload.tsx          # Upload video
│   │   └── profile.tsx         # User profile
│   └── profile/
│       └── edit.tsx            # Edit profile screen
├── components/                 # Reusable components
│   └── VideoCard.tsx
├── hooks/                      # Custom React hooks
│   ├── useProfile.ts
│   └── useVideos.ts
├── lib/                        # Core config
│   ├── supabase.ts             # Supabase client
│   └── constants.ts            # App constants & colors
├── providers/
│   └── AuthProvider.tsx        # Auth context provider
├── services/                   # Business logic / API layer
│   ├── auth.ts
│   ├── profiles.ts
│   ├── videos.ts
│   ├── likes.ts
│   ├── comments.ts
│   └── storage.ts
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql  # Full DB schema
│       └── 002_add_default_username.sql  # Default username trigger
├── scripts/
│   └── verify-supabase.js          # Supabase verification script
├── types/
│   ├── database.ts             # Supabase-typed schema
│   └── index.ts
├── utils/
│   └── helpers.ts
├── .env                        # Environment variables (not committed)
├── .env.example                # Template for env vars
└── app.json                    # Expo config
```

## Database Schema

| Table      | Purpose                                  |
| ---------- | ---------------------------------------- |
| `profiles` | User profiles (extends auth.users)       |
| `videos`   | Travel videos with metadata & location   |
| `likes`    | One like per user per video              |
| `comments` | User comments on videos                  |
| `follows`  | User-to-user follow relationships        |

**Storage Buckets:** `avatars` (profile photos), `videos` (video files + thumbnails)

All tables have Row Level Security (RLS) enabled with appropriate policies.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

Run the SQL migrations in the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) for your project:

1. Run `supabase/migrations/001_initial_schema.sql` — Creates all tables, indexes, triggers, RLS policies, and storage buckets
2. Run `supabase/migrations/002_add_default_username.sql` — Adds default username generation for new users

This creates all tables, indexes, triggers, RLS policies, and storage buckets.

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Verify Supabase setup

Run the verification script to ensure your Supabase connection, database schema, and storage buckets are configured correctly:

```bash
npm run verify-supabase
```

This will check:
- ✅ Environment variables are set
- ✅ Database connection works
- ✅ All tables exist (`profiles`, `videos`, `likes`, `comments`, `follows`, `saves`)
- ✅ Row Level Security (RLS) is enabled
- ✅ Storage buckets exist (`avatars`, `videos`)
- ✅ Authentication service is working

If any checks fail, the script will provide guidance on what needs to be fixed.

### 5. Enable Auth Providers (in Supabase Dashboard)

- **Email/Password** — enabled by default
- **Google** — Authentication > Providers > Google (add OAuth credentials)
- **Apple** — Authentication > Providers > Apple (add Service ID)

### 6. Run the app

```bash
npx expo start
```

Then press `a` for Android, `i` for iOS, or `w` for web.

## License

MIT
