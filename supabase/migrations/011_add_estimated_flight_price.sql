-- ============================================
-- 11. ADD ESTIMATED FLIGHT PRICE TO ITINERARIES
-- Add estimated flight price field to itineraries table
-- ============================================
ALTER TABLE public.itineraries
ADD COLUMN estimated_flight_price DECIMAL(10,2) NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.itineraries.estimated_flight_price IS 'Estimated flight price in USD based on real flight data from AviationStack API';