-- ============================================
-- Itinerary System Migration
-- Supports AI-powered travel itinerary generation
-- ============================================

-- ============================================
-- ITINERARIES TABLE
-- Stores generated travel itineraries with day-by-day plans
-- ============================================
CREATE TABLE public.itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  duration_days INTEGER NOT NULL,
  travel_style TEXT, -- 'adventure', 'relaxation', 'cultural', 'foodie', 'mixed'
  budget_level TEXT, -- 'budget', 'moderate', 'luxury'
  generated_by TEXT NOT NULL DEFAULT 'llm', -- 'llm' or 'rule_based'
  generation_time_ms INTEGER, -- Track performance metrics
  days JSONB NOT NULL, -- Structured day-by-day plan
  metadata JSONB, -- Store generation context, source video IDs, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX idx_itineraries_user_id ON public.itineraries(user_id);
CREATE INDEX idx_itineraries_destination ON public.itineraries(destination);
CREATE INDEX idx_itineraries_created_at ON public.itineraries(created_at DESC);
CREATE INDEX idx_itineraries_generated_by ON public.itineraries(generated_by);

-- ============================================
-- ITINERARY RATINGS TABLE
-- Stores user ratings and feedback for itineraries
-- ============================================
CREATE TABLE public.itinerary_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating BOOLEAN NOT NULL, -- true = thumbs up, false = thumbs down
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(itinerary_id, user_id)
);

-- Add indexes for ratings
CREATE INDEX idx_itinerary_ratings_itinerary_id ON public.itinerary_ratings(itinerary_id);
CREATE INDEX idx_itinerary_ratings_user_id ON public.itinerary_ratings(user_id);
CREATE INDEX idx_itinerary_ratings_rating ON public.itinerary_ratings(rating);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on itineraries
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Users can view their own itineraries
CREATE POLICY "Users can view own itineraries"
  ON public.itineraries FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own itineraries
CREATE POLICY "Users can insert own itineraries"
  ON public.itineraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own itineraries
CREATE POLICY "Users can update own itineraries"
  ON public.itineraries FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own itineraries
CREATE POLICY "Users can delete own itineraries"
  ON public.itineraries FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on itinerary_ratings
ALTER TABLE public.itinerary_ratings ENABLE ROW LEVEL SECURITY;

-- Users can view all ratings (for aggregate stats)
CREATE POLICY "Users can view itinerary ratings"
  ON public.itinerary_ratings FOR SELECT
  USING (true);

-- Users can insert their own ratings
CREATE POLICY "Users can insert own ratings"
  ON public.itinerary_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own ratings
CREATE POLICY "Users can update own ratings"
  ON public.itinerary_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete own ratings"
  ON public.itinerary_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Create update timestamp trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to itineraries table
CREATE TRIGGER itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
