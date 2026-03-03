-- ============================================
-- RATINGS TABLE
-- Users can rate videos 1-5 stars
-- ============================================
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Indexes for rating lookups
CREATE INDEX idx_ratings_video_id ON public.ratings(video_id);
CREATE INDEX idx_ratings_user_id ON public.ratings(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on ratings table
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Users can view all ratings
CREATE POLICY "Ratings are viewable by everyone" ON public.ratings
  FOR SELECT
  USING (true);

-- Users can only insert their own ratings
CREATE POLICY "Users can insert their own ratings" ON public.ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own ratings
CREATE POLICY "Users can update their own ratings" ON public.ratings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own ratings
CREATE POLICY "Users can delete their own ratings" ON public.ratings
  FOR DELETE
  USING (auth.uid() = user_id);
