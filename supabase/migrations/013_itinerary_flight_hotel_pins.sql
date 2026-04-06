-- Pins for flights and hotels saved to an itinerary (exact search result JSON preserved)

CREATE TABLE public.itinerary_flight_pins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  flight JSONB NOT NULL,
  search_context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.itinerary_hotel_pins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hotel JSONB NOT NULL,
  search_context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_itinerary_flight_pins_itinerary ON public.itinerary_flight_pins(itinerary_id);
CREATE INDEX idx_itinerary_flight_pins_created ON public.itinerary_flight_pins(itinerary_id, created_at DESC);
CREATE INDEX idx_itinerary_hotel_pins_itinerary ON public.itinerary_hotel_pins(itinerary_id);
CREATE INDEX idx_itinerary_hotel_pins_created ON public.itinerary_hotel_pins(itinerary_id, created_at DESC);

ALTER TABLE public.itinerary_flight_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_hotel_pins ENABLE ROW LEVEL SECURITY;

-- Readable by owner or any collaborator (same pattern as itinerary_comments)
CREATE POLICY "itinerary_flight_pins_select"
  ON public.itinerary_flight_pins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_flight_pins.itinerary_id
      AND (
        i.user_id::text = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM public.itinerary_collaborators c
          WHERE c.itinerary_id = i.id
          AND c.user_id::text = auth.uid()::text
        )
      )
    )
  );

CREATE POLICY "itinerary_hotel_pins_select"
  ON public.itinerary_hotel_pins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_hotel_pins.itinerary_id
      AND (
        i.user_id::text = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM public.itinerary_collaborators c
          WHERE c.itinerary_id = i.id
          AND c.user_id::text = auth.uid()::text
        )
      )
    )
  );

-- Insert: owner or editor only; must set user_id to self
CREATE POLICY "itinerary_flight_pins_insert"
  ON public.itinerary_flight_pins FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id::text
    AND EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id
      AND (
        i.user_id::text = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM public.itinerary_collaborators c
          WHERE c.itinerary_id = i.id
          AND c.user_id::text = auth.uid()::text
          AND c.role = 'editor'
        )
      )
    )
  );

CREATE POLICY "itinerary_hotel_pins_insert"
  ON public.itinerary_hotel_pins FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id::text
    AND EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id
      AND (
        i.user_id::text = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM public.itinerary_collaborators c
          WHERE c.itinerary_id = i.id
          AND c.user_id::text = auth.uid()::text
          AND c.role = 'editor'
        )
      )
    )
  );

-- Delete: owner or editor on that itinerary
CREATE POLICY "itinerary_flight_pins_delete"
  ON public.itinerary_flight_pins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_flight_pins.itinerary_id
      AND (
        i.user_id::text = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM public.itinerary_collaborators c
          WHERE c.itinerary_id = i.id
          AND c.user_id::text = auth.uid()::text
          AND c.role = 'editor'
        )
      )
    )
  );

CREATE POLICY "itinerary_hotel_pins_delete"
  ON public.itinerary_hotel_pins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_hotel_pins.itinerary_id
      AND (
        i.user_id::text = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM public.itinerary_collaborators c
          WHERE c.itinerary_id = i.id
          AND c.user_id::text = auth.uid()::text
          AND c.role = 'editor'
        )
      )
    )
  );
