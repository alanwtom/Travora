-- ============================================
-- Collaborative Itineraries Migration
-- Supports sharing travel itineraries with collaborators
-- ============================================

-- ============================================
-- ITINERARY COLLABORATORS TABLE
-- Junction table linking users to itineraries with roles
-- ============================================
CREATE TABLE public.itinerary_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(itinerary_id, user_id)
);

-- Indexes for common queries
CREATE INDEX idx_itinerary_collaborators_itinerary ON public.itinerary_collaborators(itinerary_id);
CREATE INDEX idx_itinerary_collaborators_user ON public.itinerary_collaborators(user_id);

-- ============================================
-- ITINERARY COMMENTS TABLE
-- Comments on shared itineraries
-- ============================================
CREATE TABLE public.itinerary_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for comments
CREATE INDEX idx_itinerary_comments_itinerary ON public.itinerary_comments(itinerary_id);
CREATE INDEX idx_itinerary_comments_itinerary_user ON public.itinerary_comments(itinerary_id, created_at DESC);

-- Auto-update updated_at trigger for comments
CREATE TRIGGER itinerary_comments_updated_at
  BEFORE UPDATE ON public.itinerary_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on itinerary_collaborators
ALTER TABLE public.itinerary_collaborators ENABLE ROW LEVEL SECURITY;

-- Users can see their own collaborations
-- Note: A separate policy for "collaborations for accessible itineraries" would cause
-- circular dependency with the itineraries table policies. The itineraries table
-- policies already handle checking collaborator access, so this is not needed here.
CREATE POLICY "Users can view own collaborations"
  ON public.itinerary_collaborators FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Owners can insert collaborators
CREATE POLICY "Owners can add collaborators"
  ON public.itinerary_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itinerary_id
      AND itineraries.user_id::text = auth.uid()::text
    )
  );

-- Owners can update collaborator roles
CREATE POLICY "Owners can update collaborators"
  ON public.itinerary_collaborators FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itinerary_id
      AND itineraries.user_id::text = auth.uid()::text
    )
  );

-- Owners can delete collaborators
CREATE POLICY "Owners can remove collaborators"
  ON public.itinerary_collaborators FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itinerary_id
      AND itineraries.user_id::text = auth.uid()::text
    )
  );

-- Enable RLS on itinerary_comments
ALTER TABLE public.itinerary_comments ENABLE ROW LEVEL SECURITY;

-- Collaborators can read comments
CREATE POLICY "Collaborators can read comments"
  ON public.itinerary_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itinerary_comments.itinerary_id
      AND (itineraries.user_id::text = auth.uid()::text
           OR EXISTS (
             SELECT 1 FROM public.itinerary_collaborators
             WHERE itinerary_collaborators.itinerary_id = itineraries.id
             AND itinerary_collaborators.user_id::text = auth.uid()::text
           ))
    )
  );

-- Collaborators can create comments
CREATE POLICY "Collaborators can create comments"
  ON public.itinerary_comments FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id::text
    AND EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itinerary_id
      AND (itineraries.user_id::text = auth.uid()::text
           OR EXISTS (
             SELECT 1 FROM public.itinerary_collaborators
             WHERE itinerary_collaborators.itinerary_id = itineraries.id
             AND itinerary_collaborators.user_id::text = auth.uid()::text
           ))
    )
  );

-- Users can update own comments (only while still a collaborator)
CREATE POLICY "Users can update own comments"
  ON public.itinerary_comments FOR UPDATE
  USING (
    auth.uid()::text = user_id::text
    AND EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itinerary_comments.itinerary_id
      AND (itineraries.user_id::text = auth.uid()::text
           OR EXISTS (
             SELECT 1 FROM public.itinerary_collaborators
             WHERE itinerary_collaborators.itinerary_id = itineraries.id
             AND itinerary_collaborators.user_id::text = auth.uid()::text
           ))
    )
  );

-- Users can delete own comments
CREATE POLICY "Users can delete own comments"
  ON public.itinerary_comments FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Owners can delete any comment
CREATE POLICY "Owners can delete any comment"
  ON public.itinerary_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itinerary_comments.itinerary_id
      AND itineraries.user_id::text = auth.uid()::text
    )
  );

-- ============================================
-- UPDATE EXISTING ITINERARIES RLS POLICIES
-- Allow collaborators to access shared itineraries
-- ============================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own itineraries" ON public.itineraries;

-- New policy: Users can view own itineraries OR shared itineraries
CREATE POLICY "Users can view own and shared itineraries"
  ON public.itineraries FOR SELECT
  USING (
    itineraries.user_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.itinerary_collaborators
      WHERE itinerary_collaborators.itinerary_id = itineraries.id
      AND itinerary_collaborators.user_id::text = auth.uid()::text
    )
  );

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update own itineraries" ON public.itineraries;

-- New policy: Owners and editors can update itineraries
CREATE POLICY "Owners and editors can update itineraries"
  ON public.itineraries FOR UPDATE
  USING (
    itineraries.user_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.itinerary_collaborators
      WHERE itinerary_collaborators.itinerary_id = itineraries.id
      AND itinerary_collaborators.user_id::text = auth.uid()::text
      AND itinerary_collaborators.role = 'editor'
    )
  );

-- ============================================
-- NOTIFICATION TEMPLATE
-- Insert itinerary invite notification template
-- ============================================

INSERT INTO public.notification_templates (
  category,
  trigger_event,
  priority,
  default_channels,
  title_template,
  body_template,
  is_essential
) VALUES (
  'social',
  'itinerary_invite',
  'medium',
  ARRAY['push'::notification_channel, 'in_app'::notification_channel],
  'You''re invited to collaborate!',
  '{inviter} invited you to {itinerary_title} as a {role}.',
  false
) ON CONFLICT (trigger_event) DO NOTHING;
