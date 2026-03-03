-- ============================================
-- REVIEWS SYSTEM
-- Users can write text reviews with photos
-- ============================================

-- 1. REVIEWS TABLE
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 500),
  helpful_count INTEGER NOT NULL DEFAULT 0,
  unhelpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Indexes for review lookups
CREATE INDEX idx_reviews_video_id ON public.reviews(video_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_created_at ON public.reviews(video_id, created_at DESC);
CREATE INDEX idx_reviews_helpful ON public.reviews(video_id, helpful_count DESC);

-- 2. REVIEW PHOTOS TABLE
-- Users can attach up to 3 photos per review
CREATE TABLE public.review_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for photo lookups
CREATE INDEX idx_review_photos_review_id ON public.review_photos(review_id);

-- 3. REVIEW HELPFULNESS TABLE
-- Users can vote on whether a review is helpful
CREATE TABLE public.review_helpfulness (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, review_id)
);

-- Indexes for helpfulness lookups
CREATE INDEX idx_review_helpfulness_review_id ON public.review_helpfulness(review_id);
CREATE INDEX idx_review_helpfulness_user_id ON public.review_helpfulness(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can view all reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT
  USING (true);

-- Users can insert their own reviews
CREATE POLICY "Users can insert their own reviews" ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Review photos table
ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;

-- Everyone can view review photos
CREATE POLICY "Review photos are viewable by everyone" ON public.review_photos
  FOR SELECT
  USING (true);

-- Users can insert photos for their own reviews
CREATE POLICY "Users can insert photos for their own reviews" ON public.review_photos
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.reviews WHERE id = review_id
    )
  );

-- Users can delete photos from their own reviews
CREATE POLICY "Users can delete photos from their own reviews" ON public.review_photos
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.reviews WHERE id = review_id
    )
  );

-- Review helpfulness table
ALTER TABLE public.review_helpfulness ENABLE ROW LEVEL SECURITY;

-- Everyone can view helpfulness votes
CREATE POLICY "Review helpfulness votes are viewable by everyone" ON public.review_helpfulness
  FOR SELECT
  USING (true);

-- Users can insert their own helpfulness votes
CREATE POLICY "Users can insert their own helpfulness votes" ON public.review_helpfulness
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own helpfulness votes
CREATE POLICY "Users can update their own helpfulness votes" ON public.review_helpfulness
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own helpfulness votes
CREATE POLICY "Users can delete their own helpfulness votes" ON public.review_helpfulness
  FOR DELETE
  USING (auth.uid() = user_id);
