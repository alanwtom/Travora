import { supabase } from '@/lib/supabase';
import type { FlightData, FlightSearchParams, FlightSearchResponse } from '@/types/travel';

const AVIATIONSTACK_API_KEY =
  process.env.EXPO_PUBLIC_AVIATIONSTACK_API_KEY || process.env.AVIATIONSTACK_API_KEY;
const CACHE_DURATION_HOURS = 1;
const AVIATIONSTACK_URL = 'http://api.aviationstack.com/v1/flights';
const DEFAULT_LIMIT = 25;

const PREMIUM_AIRLINES = ['emirates', 'qatar', 'singapore', 'lufthansa', 'british', 'delta'];
const LOW_COST_AIRLINES = ['ryanair', 'easyjet', 'wizz', 'spirit', 'frontier', 'southwest'];

type AviationStackFlight = {
  flight?: { iata?: string | null; icao?: string | null; number?: string | null };
  airline?: { name?: string | null };
  departure?: { scheduled?: string | null; estimated?: string | null };
  arrival?: { scheduled?: string | null; estimated?: string | null };
};

type AviationStackPayload = {
  data?: AviationStackFlight[];
  pagination?: { limit?: number; offset?: number; total?: number };
  error?: { code?: string | number; message?: string };
};

function responseTemplate(
  source: FlightSearchResponse['source'],
  cursor: string | null
): FlightSearchResponse {
  return {
    flights: [],
    next_cursor: null,
    pagination: {
      cursor,
      next_cursor: null,
      limit: DEFAULT_LIMIT,
      total: null,
    },
    source,
  };
}

function durationHours(departure: string, arrival: string): number {
  const d = new Date(departure).getTime();
  const a = new Date(arrival).getTime();
  if (!Number.isFinite(d) || !Number.isFinite(a) || a <= d) return 2;
  return (a - d) / (1000 * 60 * 60);
}

function estimatePrice(
  origin: string,
  destination: string,
  airline: string,
  departureTime: string,
  arrivalTime: string,
  date: string
): number {
  const dur = durationHours(departureTime, arrivalTime);
  const base = dur < 2 ? 140 : dur < 6 ? 290 : 620;
  const airlineNorm = airline.toLowerCase();
  const airlineMul = PREMIUM_AIRLINES.some((a) => airlineNorm.includes(a))
    ? 1.22
    : LOW_COST_AIRLINES.some((a) => airlineNorm.includes(a))
      ? 0.84
      : 1;
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  const seasonMul = month >= 6 && month <= 8 ? 1.16 : 1;
  const dayMul = weekend ? 1.08 : 1;
  const routeMul = origin === destination ? 0.7 : 1;
  const stableJitter = ((`${origin}-${destination}-${airline}`.length % 9) - 4) * 0.015;
  return Math.max(60, Math.round(base * airlineMul * seasonMul * dayMul * routeMul * (1 + stableJitter)));
}

function normalizeFlight(item: AviationStackFlight, index: number, p: FlightSearchParams): FlightData {
  const airline = item.airline?.name || 'Unknown Airline';
  const departure = item.departure?.scheduled || item.departure?.estimated || '';
  const arrival = item.arrival?.scheduled || item.arrival?.estimated || '';
  const flightNumber = item.flight?.iata || item.flight?.icao || item.flight?.number || 'N/A';
  return {
    id: flightNumber !== 'N/A' ? flightNumber : `flight-${index}-${p.origin}-${p.destination}`,
    airline,
    flight_number: flightNumber,
    departure_time: departure,
    arrival_time: arrival,
    estimated_price: estimatePrice(p.origin, p.destination, airline, departure, arrival, p.date),
    currency: 'USD',
  };
}

function mapAviationStackError(payload: AviationStackPayload): Error {
  const code = String(payload.error?.code ?? '');
  const message = payload.error?.message || 'AviationStack API error';
  if (message.toLowerCase().includes('rate') || code === '429') {
    return new Error('Rate limit reached from AviationStack. Please retry later.');
  }
  if (
    message.toLowerCase().includes('access key') ||
    message.toLowerCase().includes('invalid') ||
    code === '101'
  ) {
    return new Error('Invalid AviationStack API key.');
  }
  return new Error(message);
}

async function fetchFromAviationStack(params: FlightSearchParams): Promise<FlightSearchResponse> {
  if (!AVIATIONSTACK_API_KEY) {
    throw new Error('Missing AVIATIONSTACK_API_KEY.');
  }

  const cursor = params.cursor ?? null;
  const query = new URLSearchParams({
    access_key: AVIATIONSTACK_API_KEY,
    dep_iata: params.origin,
    arr_iata: params.destination,
    flight_date: params.date,
    limit: String(DEFAULT_LIMIT),
  });
  if (cursor) query.set('offset', cursor);

  const res = await fetch(`${AVIATIONSTACK_URL}?${query.toString()}`);
  const payload = (await res.json()) as AviationStackPayload;

  if (!res.ok || payload.error) {
    throw mapAviationStackError(payload);
  }

  const rows = payload.data ?? [];
  const pagination = payload.pagination ?? {};
  const parsedOffset = Number(cursor ?? 0);
  const offset = pagination.offset ?? (Number.isFinite(parsedOffset) ? parsedOffset : 0);
  const limit = pagination.limit ?? DEFAULT_LIMIT;
  const total = pagination.total ?? null;
  const next =
    total != null && offset + limit < total
      ? String(offset + limit)
      : rows.length === limit
        ? String(offset + limit)
        : null;

  return {
    flights: rows.map((f, i) => normalizeFlight(f, i, params)),
    next_cursor: next,
    pagination: {
      cursor,
      next_cursor: next,
      limit,
      total,
    },
    source: 'api',
  };
}

async function getCachedResult(params: FlightSearchParams): Promise<FlightSearchResponse | null> {
  const oneHourAgo = new Date(Date.now() - CACHE_DURATION_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await (supabase as any)
    .from('flight_searches')
    .select('results, created_at')
    .eq('origin', params.origin)
    .eq('destination', params.destination)
    .eq('date', params.date)
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.warn('Cache lookup failed:', error);
    return null;
  }

  const requested = params.cursor ?? null;
  const hit = (data ?? []).find((row: any) => row?.results?.pagination?.cursor === requested);
  if (!hit?.results) return null;
  return { ...hit.results, source: 'cache' as const };
}

async function cacheResult(params: FlightSearchParams, results: FlightSearchResponse): Promise<void> {
  const payload = {
    ...results,
    pagination: {
      ...results.pagination,
      cursor: params.cursor ?? null,
    },
  };
  const { error } = await (supabase as any).from('flight_searches').insert({
    origin: params.origin,
    destination: params.destination,
    date: params.date,
    results: payload,
  });
  if (error) {
    console.warn('Failed to cache flight search:', error);
  }
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightSearchResponse> {
  const normalized: FlightSearchParams = {
    origin: params.origin.trim().toUpperCase(),
    destination: params.destination.trim().toUpperCase(),
    date: params.date,
    cursor: params.cursor,
  };

  const cached = await getCachedResult(normalized);
  if (cached) return cached;

  try {
    const live = await fetchFromAviationStack(normalized);
    await cacheResult(normalized, live);
    if (live.flights.length === 0) {
      return {
        ...live,
        source: 'fallback',
      };
    }
    return live;
  } catch (err) {
    const fallbackCached = await getCachedResult(normalized);
    if (fallbackCached) return fallbackCached;
    console.warn('Flight search failed, using fallback estimate:', err);
    const fallback = responseTemplate('fallback', normalized.cursor ?? null);
    fallback.flights = [
      {
        id: `fallback-${normalized.origin}-${normalized.destination}-${normalized.date}`,
        airline: 'Estimated Carrier',
        flight_number: 'EST-001',
        departure_time: `${normalized.date}T08:00:00.000Z`,
        arrival_time: `${normalized.date}T12:00:00.000Z`,
        estimated_price: estimatePrice(
          normalized.origin,
          normalized.destination,
          'Estimated Carrier',
          `${normalized.date}T08:00:00.000Z`,
          `${normalized.date}T12:00:00.000Z`,
          normalized.date
        ),
        currency: 'USD',
      },
    ];
    return fallback;
  }
}

/**
 * Returns the cheapest estimate for itinerary calculations.
 */
export async function getEstimatedFlightPrice(
  origin: string,
  destination: string,
  date: string
): Promise<number | null> {
  const res = await searchFlights({ origin, destination, date });
  if (!res.flights.length) return null;
  return res.flights.reduce(
    (min, f) => (f.estimated_price < min ? f.estimated_price : min),
    Number.MAX_SAFE_INTEGER
  );
}