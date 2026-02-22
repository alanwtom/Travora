-- Migration: Remove Social Category from Notifications
-- Social interactions (likes, comments, follows) are now handled solely by the Activity feed
-- This migration removes social-related notification templates and preferences

-- Remove social notification templates
DELETE FROM notification_templates WHERE category = 'social';

-- Remove social notification preferences
DELETE FROM notification_preferences WHERE category = 'social';

-- Remove any existing social notifications
DELETE FROM notifications WHERE category = 'social';

-- Update table comments to clarify the separation of concerns
COMMENT ON TABLE notifications IS 'System notifications for delivery via push/email. Social interactions (likes, comments, follows) are tracked via activity feed and NOT notified through this system.';

COMMENT ON TABLE notification_templates IS 'Templates for system notifications (trip updates, price alerts, promotions, system, booking, reminders). Social events do NOT use this system.';
