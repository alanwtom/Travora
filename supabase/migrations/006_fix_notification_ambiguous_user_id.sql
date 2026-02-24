-- ============================================
-- Migration: Fix ambiguous user_id parameter in notification initialization
-- ============================================
--
-- Fixes the "column reference user_id is ambiguous" error that occurs during new user registration.
--
-- The issue was that the initialize_notification_preferences function had a parameter named
-- user_id which conflicted with the column name user_id in the INSERT statement, causing
-- PostgreSQL to be unable to resolve which user_id was being referenced.
--
-- Solution: Rename the parameter from user_id to user_id_param for clarity.

-- Drop and recreate the function with the renamed parameter
CREATE OR REPLACE FUNCTION public.initialize_notification_preferences(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id, category, push_enabled, email_enabled, in_app_enabled)
  VALUES
    (user_id_param, 'trip_updates', true, true, true),
    (user_id_param, 'price_alerts', true, true, true),
    (user_id_param, 'promotions', false, false, true),
    (user_id_param, 'social', true, false, true),
    (user_id_param, 'system', true, true, true),
    (user_id_param, 'booking', true, true, true),
    (user_id_param, 'reminder', true, true, true)
  ON CONFLICT (user_id, category) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger function is correctly set up
CREATE OR REPLACE FUNCTION public.handle_new_user_notifications()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.initialize_notification_preferences(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
