-- ============================================
-- SWIPES TABLE
-- Stores like/dislike swipe actions per user and video
-- ============================================

CREATE TABLE IF NOT EXISTS public.swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  swipe_type TEXT NOT NULL CHECK (swipe_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_swipes_user_id ON public.swipes(user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_video_id ON public.swipes(video_id);
CREATE INDEX IF NOT EXISTS idx_swipes_swipe_type ON public.swipes(swipe_type);

-- Keep updated_at in sync on updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_swipes_updated_at'
  ) THEN
    CREATE TRIGGER set_swipes_updated_at
      BEFORE UPDATE ON public.swipes
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'swipes'
      AND policyname = 'Swipes are viewable by everyone'
  ) THEN
    CREATE POLICY "Swipes are viewable by everyone"
      ON public.swipes FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'swipes'
      AND policyname = 'Users can insert their own swipes'
  ) THEN
    CREATE POLICY "Users can insert their own swipes"
      ON public.swipes FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'swipes'
      AND policyname = 'Users can update their own swipes'
  ) THEN
    CREATE POLICY "Users can update their own swipes"
      ON public.swipes FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'swipes'
      AND policyname = 'Users can delete their own swipes'
  ) THEN
    CREATE POLICY "Users can delete their own swipes"
      ON public.swipes FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
