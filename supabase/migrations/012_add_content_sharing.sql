-- Content Sharing Migration
-- Adds shared_content table for in-app user-to-user sharing

CREATE TABLE IF NOT EXISTS shared_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'itinerary', 'profile')),
  content_id UUID NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sender_id, recipient_id, content_type, content_id),
  CONSTRAINT no_self_share CHECK (sender_id != recipient_id)
);

CREATE INDEX idx_shared_content_recipient_created
  ON shared_content (recipient_id, created_at DESC);

CREATE INDEX idx_shared_content_recipient_unread
  ON shared_content (recipient_id) WHERE is_read = false;

ALTER TABLE shared_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shares"
  ON shared_content FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create shares as sender"
  ON shared_content FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipient can update share read status"
  ON shared_content FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Users can delete own shares"
  ON shared_content FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

INSERT INTO notification_templates (
  category,
  trigger_event,
  priority,
  default_channels,
  title_template,
  body_template,
  data_template,
  is_essential,
  is_active
) VALUES (
  'social',
  'content_shared',
  'medium',
  ARRAY['push', 'in_app']::notification_channel[],
  '{{sender_name}} shared content with you',
  '{{sender_name}} shared a {{content_type}} with you',
  jsonb_build_object(
    'sender_id', '',
    'content_type', '',
    'content_id', '',
    'message', ''
  ),
  false,
  true
) ON CONFLICT (trigger_event) DO NOTHING;
