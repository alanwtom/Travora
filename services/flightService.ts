import { supabase } from '@/lib/supabase';
import type { FlightSearchParams, FlightSearchResponse } from '@/types/travel';

const AVIATIONSTACK_API_KEY = process.env.EXPO_PUBLIC_AVIATIONSTACK_API_KEY;
const CACHE_DURATION_HOURS = 1;

function generateEstimatedPrice(distanceKm: number): number {
  // Base price + distance multiplier + random variation
  const basePrice = 200;
  const perKmRate = 0.15;
  const distanceCost = distanceKm * perKmRate;
  const variation = Math.random() * 100 - 50; // -50 to +50
  return Math.max(99, Math.round(basePrice + distanceCost + variation));
}

async function fetchFromAviationStack(params: FlightSearchParams): Promise<FlightSearchResponse> {
  if (!AVIATIONSTACK_API_KEY) {
    throw new Error('AviationStack API key not configured');
  }

  const { origin, destination, date, cursor } = params;

  let url = `http://api.aviationstack.com/v1/flights?access_key=${AVIATIONSTACK_API_KEY}&dep_iata=${origin}&arr_iata=${destination}&flight_date=${date}`;

  if (cursor) {
    url += `&offset=${cursor}`;
  }

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'AviationStack API error');
  }

  if (data.error) {
    throw new Error(data.error.message || 'AviationStack API error');
  }

  // Transform to our format
  const flights = data.data.map((flight: any, index: number) => {
    const price = flight.price || generateEstimatedPrice(1000); // Estimate if not provided
    return {
      id: flight.flight.iata || flight.flight.icao || `flight-${index}`,
      airline: flight.airline?.name || 'Unknown Airline',
      flight_number: flight.flight.iata || flight.flight.icao || 'N/A',
      departure_time: flight.departure?.scheduled || flight.departure?.estimated || '',
      arrival_time: flight.arrival?.scheduled || flight.arrival?.estimated || '',
      price,
      currency: flight.currency || 'USD',
    };
  });

  const nextCursor = data.pagination?.offset + data.pagination?.limit < data.pagination?.total
    ? (data.pagination.offset + data.pagination.limit).toString()
    : undefined;

  return {
    flights,
    next_cursor: nextCursor,
  };
}

async function getCachedResult(params: FlightSearchParams): Promise<FlightSearchResponse | null> {
  const { origin, destination, date } = params;
  const oneHourAgo = new Date(Date.now() - CACHE_DURATION_HOURS * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('flight_searches')
    .select('*')
    .eq('origin', origin)
    .eq('destination', destination)
    .eq('date', date)
    .gte('created_at', oneHourAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.warn('Cache lookup failed:', error);
    return null;
  }

  return data?.[0]?.results || null;
}

async function cacheResult(params: FlightSearchParams, results: FlightSearchResponse): Promise<void> {
  const { origin, destination, date } = params;

  const { error } = await supabase
    .from('flight_searches')
    .insert({
      origin,
      destination,
      date,
      results,
    });

  if (error) {
    console.warn('Failed to cache flight search:', error);
  }
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightSearchResponse> {
  try {
    // Check cache first
    const cached = await getCachedResult(params);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const results = await fetchFromAviationStack(params);

    // Cache the results
    await cacheResult(params, results);

    return results;
  } catch (error) {
    console.error('Flight search failed:', error);

    // Try to return cached data as fallback
    const cached = await getCachedResult(params);
    if (cached) {
      return cached;
    }

    // Last resort: return empty results
    return { flights: [] };
  }
}