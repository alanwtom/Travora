-- ============================================
-- Travora Notification System Schema
-- Comprehensive notification management with categories, priorities, and delivery channels
-- ============================================

-- ============================================
-- 1. ENUMS
-- ============================================

-- Notification categories
CREATE TYPE notification_category AS ENUM (
  'trip_updates',
  'price_alerts',
  'promotions',
  'social',
  'system',
  'booking',
  'reminder'
);

-- Notification priorities
CREATE TYPE notification_priority AS ENUM (
  'high',
  'medium',
  'low'
);

-- Delivery channels
CREATE TYPE notification_channel AS ENUM (
  'push',
  'email',
  'in_app'
);

-- Notification status
CREATE TYPE notification_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'failed',
  'read'
);

-- ============================================
-- 2. NOTIFICATION PREFERENCES TABLE
-- User preferences for notification categories
-- ============================================
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category notification_category NOT NULL,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Indexes for notification preferences
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_category ON public.notification_preferences(category);

-- ============================================
-- 3. NOTIFICATION TEMPLATES TABLE
-- Predefined templates for each notification type
-- ============================================
CREATE TABLE public.notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category notification_category NOT NULL,
  trigger_event TEXT NOT NULL,
  priority notification_priority NOT NULL,
  default_channels notification_channel[] NOT NULL DEFAULT ARRAY['push', 'in_app'],
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  data_template JSONB,
  is_essential BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for notification templates
CREATE INDEX idx_notification_templates_category ON public.notification_templates(category);
CREATE INDEX idx_notification_templates_trigger_event ON public.notification_templates(trigger_event);
CREATE INDEX idx_notification_templates_active ON public.notification_templates(is_active);

-- ============================================
-- 4. NOTIFICATIONS TABLE
-- Stores all sent/delivered notifications
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  category notification_category NOT NULL,
  priority notification_priority NOT NULL,
  status notification_status NOT NULL DEFAULT 'pending',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  channels notification_channel[] NOT NULL,
  push_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  in_app_shown BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_category ON public.notifications(category);
CREATE INDEX idx_notifications_priority ON public.notifications(priority);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, status) WHERE status != 'read';

-- ============================================
-- 5. NOTIFICATION HISTORY TABLE
-- Tracks delivery attempts and failures
-- ============================================
CREATE TABLE public.notification_delivery_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for delivery history
CREATE INDEX idx_notification_delivery_history_notification_id ON public.notification_delivery_history(notification_id);
CREATE INDEX idx_notification_delivery_history_status ON public.notification_delivery_history(status);

-- ============================================
-- 6. GLOBAL NOTIFICATION SETTINGS
-- Master switches and mute settings
-- ============================================

-- Add notification settings to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_muted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_mute_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS marketing_notifications_enabled BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- 7. FUNCTIONS
-- ============================================

-- Initialize default notification preferences for new users
CREATE OR REPLACE FUNCTION public.initialize_notification_preferences(user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id, category, push_enabled, email_enabled, in_app_enabled)
  VALUES
    (user_id, 'trip_updates', true, true, true),
    (user_id, 'price_alerts', true, true, true),
    (user_id, 'promotions', false, false, true),
    (user_id, 'social', true, false, true),
    (user_id, 'system', true, true, true),
    (user_id, 'booking', true, true, true),
    (user_id, 'reminder', true, true, true)
  ON CONFLICT (user_id, category) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-initialize notification preferences after profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_notifications()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.initialize_notification_preferences(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_notifications
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_notifications();

-- Function to check if user should receive notification
CREATE OR REPLACE FUNCTION public.should_send_notification(
  user_id_param UUID,
  category_param notification_category,
  channel_param notification_channel
)
RETURNS BOOLEAN AS $$
DECLARE
  is_muted BOOLEAN;
  marketing_enabled BOOLEAN;
  channel_enabled BOOLEAN;
  category_enabled BOOLEAN;
  pref RECORD;
BEGIN
  -- Check master mute switch
  SELECT notification_muted, notification_mute_until, marketing_notifications_enabled
  INTO is_muted, notification_mute_until, marketing_enabled
  FROM public.profiles
  WHERE id = user_id_param;

  -- Check if user is muted
  IF is_muted = true THEN
    RETURN false;
  END IF;

  -- Check if muted until a specific time
  IF notification_mute_until IS NOT NULL AND notification_mute_until > now() THEN
    RETURN false;
  END IF;

  -- Check marketing consent
  IF category_param = 'promotions' AND marketing_enabled = false THEN
    RETURN false;
  END IF;

  -- Check channel master switch
  IF channel_param = 'push' THEN
    SELECT push_notifications_enabled INTO channel_enabled
    FROM public.profiles WHERE id = user_id_param;
    IF channel_enabled = false THEN
      RETURN false;
    END IF;
  ELSIF channel_param = 'email' THEN
    SELECT email_notifications_enabled INTO channel_enabled
    FROM public.profiles WHERE id = user_id_param;
    IF channel_enabled = false THEN
      RETURN false;
    END IF;
  END IF;

  -- Check category-specific preferences
  SELECT * INTO pref
  FROM public.notification_preferences
  WHERE user_id = user_id_param AND category = category_param;

  IF NOT FOUND THEN
    -- Default to enabled if no preference set
    RETURN true;
  END IF;

  -- Check channel-specific preference
  CASE channel_param
    WHEN 'push' THEN RETURN pref.push_enabled;
    WHEN 'email' THEN RETURN pref.email_enabled;
    WHEN 'in_app' THEN RETURN pref.in_app_enabled;
  END CASE;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification from template
CREATE OR REPLACE FUNCTION public.create_notification(
  user_id_param UUID,
  trigger_event_param TEXT,
  title_data JSONB DEFAULT '{}'::jsonb,
  body_data JSONB DEFAULT '{}'::jsonb,
  custom_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  template RECORD;
  notification_id UUID;
  should_send BOOLEAN;
  channels_to_send notification_channel[];
BEGIN
  -- Get the template
  SELECT * INTO template
  FROM public.notification_templates
  WHERE trigger_event = trigger_event_param AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active template found for trigger event: %', trigger_event_param;
  END IF;

  -- Build channels array based on user preferences
  channels_to_send := ARRAY[]::notification_channel[];
  IF template.default_channels @> ARRAY['push'] THEN
    IF public.should_send_notification(user_id_param, template.category, 'push') THEN
      channels_to_send := array_append(channels_to_send, 'push'::notification_channel);
    END IF;
  END IF;

  IF template.default_channels @> ARRAY['email'] THEN
    IF public.should_send_notification(user_id_param, template.category, 'email') THEN
      channels_to_send := array_append(channels_to_send, 'email'::notification_channel);
    END IF;
  END IF;

  IF template.default_channels @> ARRAY['in_app'] THEN
    IF public.should_send_notification(user_id_param, template.category, 'in_app') THEN
      channels_to_send := array_append(channels_to_send, 'in_app'::notification_channel);
    END IF;
  END IF;

  -- If no channels enabled, don't create notification
  IF array_length(channels_to_send, 1) IS NULL THEN
    RETURN NULL;
  END IF;

  -- Create the notification
  INSERT INTO public.notifications (
    user_id,
    template_id,
    category,
    priority,
    title,
    body,
    data,
    channels
  )
  VALUES (
    user_id_param,
    template.id,
    template.category,
    template.priority,
    template.title_template,
    template.body_template,
    custom_data,
    channels_to_send
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = now(),
      status = 'read'
  WHERE id = notification_id
    AND user_id = user_id_param
    AND read_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  marked_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET read_at = now(),
      status = 'read'
  WHERE user_id = user_id_param
    AND read_at IS NULL;

  GET DIAGNOSTICS marked_count = ROW_COUNT;
  RETURN marked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_at timestamp
CREATE TRIGGER set_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_profiles_notification_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_history ENABLE ROW LEVEL SECURITY;

-- ----- NOTIFICATION PREFERENCES -----
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ----- NOTIFICATIONS -----
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ----- NOTIFICATION TEMPLATES -----
CREATE POLICY "Anyone can view active notification templates"
  ON public.notification_templates FOR SELECT
  USING (is_active = true);

-- ----- NOTIFICATION DELIVERY HISTORY -----
CREATE POLICY "Users can view their own notification delivery history"
  ON public.notification_delivery_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.notifications
      WHERE notifications.id = notification_delivery_history.notification_id
        AND notifications.user_id = auth.uid()
    )
  );

-- ============================================
-- 9. SEED NOTIFICATION TEMPLATES
-- ============================================

INSERT INTO public.notification_templates (category, trigger_event, priority, default_channels, title_template, body_template, data_template, is_essential) VALUES
  -- Trip Updates (High Priority)
  ('trip_updates', 'booking_confirmed', 'high', ARRAY['push', 'email', 'in_app'], 'Booking Confirmed', 'Your trip to {{destination}} has been confirmed!', '{"destination": "", "booking_id": ""}', true),
  ('trip_updates', 'booking_cancelled', 'high', ARRAY['push', 'email', 'in_app'], 'Booking Cancelled', 'Your booking {{booking_id}} has been cancelled.', '{"booking_id": ""}', true),
  ('trip_updates', 'flight_delayed', 'high', ARRAY['push', 'email', 'in_app'], 'Flight Delayed', 'Your flight to {{destination}} has been delayed. New departure time: {{new_time}}', '{"destination": "", "new_time": ""}', true),
  ('trip_updates', 'itinerary_changed', 'high', ARRAY['push', 'email', 'in_app'], 'Itinerary Updated', 'Your itinerary for {{destination}} has been updated. Check the app for details.', '{"destination": ""}', true),
  ('trip_updates', 'trip_starting_soon', 'medium', ARRAY['push', 'in_app'], 'Trip Starting Soon', 'Your trip to {{destination}} starts in {{days}} days!', '{"destination": "", "days": ""}', true),

  -- Price Alerts (Medium Priority)
  ('price_alerts', 'price_drop', 'medium', ARRAY['push', 'email', 'in_app'], 'Price Drop Alert', 'Great news! The price for {{destination}} dropped to {{price}}. Book now!', '{"destination": "", "price": ""}', false),
  ('price_alerts', 'deal_expiring_soon', 'medium', ARRAY['push', 'email', 'in_app'], 'Deal Expiring Soon', 'The deal for {{destination}} expires in {{hours}} hours. Don''t miss out!', '{"destination": "", "hours": ""}', false),

  -- Promotions (Low Priority, Marketing)
  ('promotions', 'special_offer', 'low', ARRAY['email', 'in_app'], 'Special Offer', 'Exclusive offer just for you! {{offer_description}}', '{"offer_description": ""}', false),
  ('promotions', 'seasonal_sale', 'low', ARRAY['email', 'in_app'], 'Seasonal Sale', 'Up to {{discount}}% off on {{destination}} trips!', '{"discount": "", "destination": ""}', false),
  ('promotions', 'referral_bonus', 'low', ARRAY['email', 'in_app'], 'Referral Bonus', 'Invite friends and earn {{bonus}} credits for each referral!', '{"bonus": ""}', false),

  -- Social (Medium Priority)
  ('social', 'new_follower', 'medium', ARRAY['push', 'in_app'], 'New Follower', '{{username}} started following you!', '{"username": ""}', false),
  ('social', 'video_liked', 'low', ARRAY['in_app'], 'Like on Your Video', '{{username}} liked your video "{{video_title}}"', '{"username": "", "video_title": ""}', false),
  ('social', 'comment_received', 'medium', ARRAY['push', 'in_app'], 'New Comment', '{{username}} commented: "{{comment_content}}"', '{"username": "", "comment_content": ""}', false),
  ('social', 'mention_received', 'medium', ARRAY['push', 'in_app'], 'You Were Mentioned', '{{username}} mentioned you in a comment.', '{"username": ""}', false),

  -- System (High Priority)
  ('system', 'security_alert', 'high', ARRAY['push', 'email', 'in_app'], 'Security Alert', 'We detected unusual activity on your account. Please review your recent activity.', '{}', true),
  ('system', 'account_verified', 'high', ARRAY['push', 'email', 'in_app'], 'Account Verified', 'Your account has been verified successfully!', '{}', true),
  ('system', 'password_changed', 'high', ARRAY['push', 'email', 'in_app'], 'Password Changed', 'Your password was changed successfully. If you didn''t make this change, contact support immediately.', '{}', true),

  -- Booking (High Priority)
  ('booking', 'payment_received', 'high', ARRAY['push', 'email', 'in_app'], 'Payment Confirmed', 'Payment of {{amount}} received for {{destination}} trip.', '{"amount": "", "destination": ""}', true),
  ('booking', 'booking_reminder', 'high', ARRAY['push', 'email', 'in_app'], 'Booking Reminder', 'Reminder: Your {{destination}} trip is coming up on {{date}}.', '{"destination": "", "date": ""}', true),
  ('booking', 'check_in_open', 'medium', ARRAY['push', 'email', 'in_app'], 'Check-In Available', 'Online check-in is now open for your flight to {{destination}}.', '{"destination": ""}', true),

  -- Reminder (Medium Priority)
  ('reminder', '24_hour_flight', 'high', ARRAY['push', 'email', 'in_app'], 'Flight Tomorrow', 'Your flight to {{destination}} departs tomorrow. Check-in now!', '{"destination": ""}', true),
  ('reminder', 'trip_end_reminder', 'medium', ARRAY['push', 'in_app'], 'Trip Ending Soon', 'Your trip to {{destination}} ends tomorrow. Don''t forget to pack!', '{"destination": ""}', true),
  ('reminder', 'review_request', 'low', ARRAY['email', 'in_app'], 'How Was Your Trip?', 'How was your trip to {{destination}}? Leave a review to help other travelers!', '{"destination": ""}', false);

-- ============================================
-- 10. HELPER FUNCTIONS FOR COMMON QUERIES
-- ============================================

-- Get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.notifications
    WHERE user_id = user_id_param
      AND read_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get notifications by category
CREATE OR REPLACE FUNCTION public.get_notifications_by_category(
  user_id_param UUID,
  category_param notification_category,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS SETOF public.notifications AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.notifications
  WHERE user_id = user_id_param
    AND category = category_param
  ORDER BY created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get notification preferences with defaults
CREATE OR REPLACE FUNCTION public.get_notification_preferences(user_id_param UUID)
RETURNS TABLE (
  category notification_category,
  push_enabled BOOLEAN,
  email_enabled BOOLEAN,
  in_app_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH all_categories AS (
    SELECT unnest(ENUM_RANGE(NULL::notification_category)) AS category
  )
  SELECT
    ac.category,
    COALESCE(np.push_enabled, true) AS push_enabled,
    COALESCE(np.email_enabled, true) AS email_enabled,
    COALESCE(np.in_app_enabled, true) AS in_app_enabled
  FROM all_categories ac
  LEFT JOIN public.notification_preferences np
    ON np.category = ac.category
    AND np.user_id = user_id_param
  ORDER BY ac.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
