-- ============================================
-- Migration: Enable and restore social notifications
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_category') THEN
    CREATE TYPE notification_category AS ENUM (
      'trip_updates',
      'price_alerts',
      'promotions',
      'social',
      'system',
      'booking',
      'reminder'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_priority') THEN
    CREATE TYPE notification_priority AS ENUM ('high', 'medium', 'low');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
    CREATE TYPE notification_channel AS ENUM ('push', 'email', 'in_app');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
    CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_category')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_enum e
       JOIN pg_type t ON t.oid = e.enumtypid
       WHERE t.typname = 'notification_category'
         AND e.enumlabel = 'social'
     ) THEN
    ALTER TYPE notification_category ADD VALUE 'social';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.notification_preferences (
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

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category notification_category NOT NULL,
  trigger_event TEXT NOT NULL,
  priority notification_priority NOT NULL,
  default_channels notification_channel[] NOT NULL DEFAULT ARRAY['push', 'in_app']::notification_channel[],
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  data_template JSONB,
  is_essential BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
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

CREATE TABLE IF NOT EXISTS public.notification_delivery_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id
  ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_trigger_event
  ON public.notification_templates(trigger_event);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_templates_trigger_event_unique
  ON public.notification_templates(trigger_event);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_history_notification_id
  ON public.notification_delivery_history(notification_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_muted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_mute_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS marketing_notifications_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notification_preferences' AND policyname = 'Users can view own notification preferences'
  ) THEN
    CREATE POLICY "Users can view own notification preferences"
      ON public.notification_preferences FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notification_preferences' AND policyname = 'Users can update own notification preferences'
  ) THEN
    CREATE POLICY "Users can update own notification preferences"
      ON public.notification_preferences FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notification_preferences' AND policyname = 'Users can create own notification preferences'
  ) THEN
    CREATE POLICY "Users can create own notification preferences"
      ON public.notification_preferences FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications"
      ON public.notifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications"
      ON public.notifications FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can delete own notifications'
  ) THEN
    CREATE POLICY "Users can delete own notifications"
      ON public.notifications FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notification_templates' AND policyname = 'Notification templates are readable'
  ) THEN
    CREATE POLICY "Notification templates are readable"
      ON public.notification_templates FOR SELECT
      USING (true);
  END IF;
END $$;

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

CREATE OR REPLACE FUNCTION public.handle_new_user_notifications()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.initialize_notification_preferences(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created_notifications'
  ) THEN
    CREATE TRIGGER on_auth_user_created_notifications
      AFTER INSERT ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user_notifications();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.should_send_notification(
  user_id_param UUID,
  category_param notification_category,
  channel_param notification_channel
)
RETURNS BOOLEAN AS $$
DECLARE
  is_muted BOOLEAN;
  mute_until TIMESTAMPTZ;
  marketing_enabled BOOLEAN;
  push_enabled BOOLEAN;
  email_enabled BOOLEAN;
  pref RECORD;
BEGIN
  SELECT
    notification_muted,
    notification_mute_until,
    marketing_notifications_enabled,
    push_notifications_enabled,
    email_notifications_enabled
  INTO
    is_muted,
    mute_until,
    marketing_enabled,
    push_enabled,
    email_enabled
  FROM public.profiles
  WHERE id = user_id_param;

  IF is_muted = true THEN
    RETURN false;
  END IF;

  IF mute_until IS NOT NULL AND mute_until > now() THEN
    RETURN false;
  END IF;

  IF category_param = 'promotions' AND marketing_enabled = false THEN
    RETURN false;
  END IF;

  IF channel_param = 'push' AND push_enabled = false THEN
    RETURN false;
  END IF;

  IF channel_param = 'email' AND email_enabled = false THEN
    RETURN false;
  END IF;

  SELECT * INTO pref
  FROM public.notification_preferences
  WHERE user_id = user_id_param
    AND category = category_param;

  IF NOT FOUND THEN
    RETURN true;
  END IF;

  CASE channel_param
    WHEN 'push' THEN RETURN pref.push_enabled;
    WHEN 'email' THEN RETURN pref.email_enabled;
    WHEN 'in_app' THEN RETURN pref.in_app_enabled;
  END CASE;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  channels_to_send notification_channel[];
BEGIN
  SELECT * INTO template
  FROM public.notification_templates
  WHERE trigger_event = trigger_event_param
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  channels_to_send := ARRAY[]::notification_channel[];

  IF template.default_channels @> ARRAY['push']::notification_channel[]
     AND public.should_send_notification(user_id_param, template.category, 'push') THEN
    channels_to_send := array_append(channels_to_send, 'push'::notification_channel);
  END IF;

  IF template.default_channels @> ARRAY['email']::notification_channel[]
     AND public.should_send_notification(user_id_param, template.category, 'email') THEN
    channels_to_send := array_append(channels_to_send, 'email'::notification_channel);
  END IF;

  IF template.default_channels @> ARRAY['in_app']::notification_channel[]
     AND public.should_send_notification(user_id_param, template.category, 'in_app') THEN
    channels_to_send := array_append(channels_to_send, 'in_app'::notification_channel);
  END IF;

  IF array_length(channels_to_send, 1) IS NULL THEN
    RETURN NULL;
  END IF;

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

CREATE OR REPLACE FUNCTION public.get_unread_notification_count(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER
  INTO unread_count
  FROM public.notifications
  WHERE user_id = user_id_param
    AND read_at IS NULL;

  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

INSERT INTO public.notification_templates (
  category,
  trigger_event,
  priority,
  default_channels,
  title_template,
  body_template,
  data_template,
  is_essential,
  is_active
)
VALUES
  (
    'social',
    'new_follower',
    'medium',
    ARRAY['push', 'in_app']::notification_channel[],
    'New follower',
    'Someone started following you',
    '{"deepLink":"/profile"}'::jsonb,
    false,
    true
  ),
  (
    'social',
    'video_liked',
    'low',
    ARRAY['push', 'in_app']::notification_channel[],
    'Your video got a like',
    'Someone liked your video',
    '{"deepLink":"/video"}'::jsonb,
    false,
    true
  ),
  (
    'social',
    'comment_received',
    'medium',
    ARRAY['push', 'in_app']::notification_channel[],
    'New comment on your video',
    'Someone commented on your video',
    '{"deepLink":"/video"}'::jsonb,
    false,
    true
  ),
  (
    'social',
    'mention_received',
    'medium',
    ARRAY['push', 'in_app']::notification_channel[],
    'You were mentioned',
    'Someone mentioned you in a comment',
    '{"deepLink":"/video"}'::jsonb,
    false,
    true
  )
ON CONFLICT (trigger_event)
DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  default_channels = EXCLUDED.default_channels,
  title_template = EXCLUDED.title_template,
  body_template = EXCLUDED.body_template,
  data_template = EXCLUDED.data_template,
  is_essential = EXCLUDED.is_essential,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.notification_preferences (user_id, category, push_enabled, email_enabled, in_app_enabled)
SELECT id, 'social'::notification_category, true, false, true
FROM public.profiles
ON CONFLICT (user_id, category) DO NOTHING;