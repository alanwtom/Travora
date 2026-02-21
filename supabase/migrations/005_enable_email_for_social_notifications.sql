-- ============================================
-- Migration: Enable email channel for social notifications
-- ============================================

-- Make social templates deliverable by email too
UPDATE public.notification_templates
SET default_channels = ARRAY['push', 'email', 'in_app']::notification_channel[],
    updated_at = now()
WHERE trigger_event IN ('new_follower', 'video_liked', 'comment_received', 'mention_received');

-- Ensure social email preference is enabled for existing users
UPDATE public.notification_preferences
SET email_enabled = true,
    updated_at = now()
WHERE category = 'social'::notification_category
  AND email_enabled = false;

-- Ensure new/legacy users have social preferences with email enabled
INSERT INTO public.notification_preferences (user_id, category, push_enabled, email_enabled, in_app_enabled)
SELECT id, 'social'::notification_category, true, true, true
FROM public.profiles
ON CONFLICT (user_id, category)
DO UPDATE SET
  push_enabled = EXCLUDED.push_enabled,
  email_enabled = EXCLUDED.email_enabled,
  in_app_enabled = EXCLUDED.in_app_enabled,
  updated_at = now();
