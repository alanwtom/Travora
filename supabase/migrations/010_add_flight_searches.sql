-- ============================================
-- 10. FLIGHT SEARCHES TABLE
-- Cache for flight API responses
-- ============================================
CREATE TABLE public.flight_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  date DATE NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient lookups
CREATE INDEX idx_flight_searches_origin_destination_date ON public.flight_searches(origin, destination, date);
CREATE INDEX idx_flight_searches_created_at ON public.flight_searches(created_at DESC);

-- Enable RLS
ALTER TABLE public.flight_searches ENABLE ROW LEVEL SECURITY;

-- Anyone can view flight searches (cached data)
CREATE POLICY "Flight searches are viewable by everyone"
  ON public.flight_searches FOR SELECT
  USING (true);

-- Authenticated users can create flight searches
CREATE POLICY "Authenticated users can create flight searches"
  ON public.flight_searches FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');