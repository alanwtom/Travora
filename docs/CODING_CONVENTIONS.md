# Coding Conventions & Naming Guide

Shared conventions for Travora's Expo Router + TypeScript codebase. Use these rules when adding or refactoring code so behavior stays predictable and naming stays consistent.

## Scope
- Applies to React Native screens, components, hooks, services, tests, and Supabase-facing code.
- Follows TypeScript strict mode; avoid `any` unless absolutely necessary and documented.
- Use the `@/` alias for internal imports instead of relative path chains.

## File & Folder Naming
- **Routes**: Follow Expo Router patterns (`(group)/screen.tsx`, `_layout.tsx`, `[id].tsx`, `[...slug].tsx`).
- **Components**: `PascalCase` filenames (`VideoCard.tsx`, `NotificationList.tsx`) with matching exported component names.
- **Hooks**: Start with `use` and stay `camelCase` (`useVideos.ts`, `useNotifications.ts`).
- **Services/API**: Domain-focused, `camelCase` filenames (`videos.ts`, `profiles.ts`); exported functions are verbs (`getFeedVideos`, `updateProfile`).
- **Utilities**: `camelCase` filenames (`formatDate.ts`), focused helpers with pure functions.
- **Constants**: Uppercase `SNAKE_CASE` exported from `lib/constants.ts`; shared style tokens live in `constants/Colors.ts`.
- **Tests**: Keep in `__tests__` folders with `*-test.(ts|tsx|js)` suffix to mirror the file under test.

## Components & Screens
- Export screen components as `default` for Expo Router; export shared components and utilities as **named** exports.
- Name props types `Props` or domain-specific (`VideoCardProps`) near the component declaration.
- Event handlers use `handleX` (`handleLike`, `handleSubmit`); callbacks passed as props use `onX` (`onSuccess`, `onChange`).
- Keep presentational components free of data fetching; delegate data access to hooks/services.

## Hooks & State
- Custom hooks always start with `use` and return a tuple or object; expose booleans with `is/has/should` prefixes.
- Keep hook names action-oriented (`useFeedVideos`, `useUserSearch`) and colocate related hooks under `hooks/`.
- Derive state when possible instead of duplicating sources of truth.

## Services & Supabase Access
- Use generated types from `@/types/database` for queries/inserts (`VideoInsert`, `ProfileUpdate`, `VideoWithProfile`).
- Keep Supabase access inside `services/`; services should be UI-agnostic and return typed data or throw typed errors.
- Name functions with clear verbs (`get`, `create`, `update`, `delete`, `toggle`, `increment`) and include the entity (`getVideo`, `toggleLike`).
- Favor small, composable service functions instead of multi-purpose "manager" modules.

## Variables, Functions & Types
- Variables/constants: `camelCase` for locals, `UPPER_SNAKE_CASE` for immutable config, `PascalCase` for React components and types.
- Booleans read positively with `is/has/should/can` (`isSaved`, `hasError`, `shouldRedirect`).
- Enums and union types use `PascalCase` names with `PascalCase` members; string literal unions preferred for small sets.
- Avoid abbreviations unless widely understood (`url`, `id`); prefer clarity over brevity.

## Imports & Module Layout
- Order imports: std/libs → third-party → `@/` modules → relative paths. Group related imports and keep React imports first in components.
- Prefer named exports to reduce default import renames; keep a single responsibility per module.
- Co-locate small helper types with their function; move shared types to `types/` when reused across modules.

## Error Handling & Logging
- Throw or return typed errors from services; UI layers decide how to present them.
- Avoid leaking raw Supabase errors to UI; map to user-friendly messages at the boundary.
- Use console logging sparingly and remove noisy logs before merging; keep any necessary logs scoped and descriptive.

## Documentation & Comments
- Keep docstrings short and purposeful; explain *why* when behavior is non-obvious.
- Prefer self-describing names over comments; update adjacent docs when adding new patterns.
