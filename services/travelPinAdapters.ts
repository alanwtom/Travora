/**
 * Normalizes flight/hotel payloads before persisting itinerary pins.
 * Profile flight search uses AviationStack → FlightData; SerpAPI Google Flights uses a different
 * row shape — we map both into the same FlightData type the itinerary screen expects.
 */

import type { SerpApiFlightOption } from '@/services/serpapiFlights';
import type { SerpApiHotelOption } from '@/services/serpapiHotels';
import type { FlightData } from '@/types/travel';

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isSerpApiFlightOption(raw: unknown): raw is SerpApiFlightOption {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  return (
    isNonEmptyString(o.id) &&
    isNonEmptyString(o.airline) &&
    isNonEmptyString(o.from) &&
    isNonEmptyString(o.to) &&
    isNonEmptyString(o.departAt) &&
    isNonEmptyString(o.arriveAt) &&
    isFiniteNumber(o.price)
  );
}

/** Best-effort ISO from YYYY-MM-DD search date + Serp "3:45 PM" style clock */
function isoFromSearchDateAndClock(dateStr: string, clock: string): string {
  const parsed = Date.parse(`${dateStr} ${clock}`);
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString();
  }
  return `${dateStr}T12:00:00.000Z`;
}

function assertFlightDataShape(o: FlightData): void {
  if (!isNonEmptyString(o.id)) throw new Error('Invalid flight: missing id');
  if (!isNonEmptyString(o.airline)) throw new Error('Invalid flight: missing airline');
  if (!isNonEmptyString(o.flight_number)) throw new Error('Invalid flight: missing flight_number');
  if (!isNonEmptyString(o.departure_time)) throw new Error('Invalid flight: missing departure_time');
  if (!isNonEmptyString(o.arrival_time)) throw new Error('Invalid flight: missing arrival_time');
  if (!isFiniteNumber(o.estimated_price)) throw new Error('Invalid flight: missing estimated_price');
  if (!isNonEmptyString(o.currency)) throw new Error('Invalid flight: missing currency');
}

/**
 * Accepts canonical FlightData or a SerpAPI Google Flights option; returns FlightData for storage/display.
 */
export function normalizeFlightForItineraryPin(raw: unknown, searchDate: string): FlightData {
  const date = searchDate.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Invalid search date for flight pin');
  }

  if (isSerpApiFlightOption(raw)) {
    const f = raw;
    const data: FlightData = {
      id: f.id,
      airline: f.airline,
      flight_number: `${f.from}-${f.to}`,
      departure_time: isoFromSearchDateAndClock(date, f.departAt),
      arrival_time: isoFromSearchDateAndClock(date, f.arriveAt),
      estimated_price: f.price,
      currency: 'USD',
      source: 'serpapi',
      display_depart_label: f.departAt,
      display_arrive_label: f.arriveAt,
    };
    assertFlightDataShape(data);
    return data;
  }

  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid flight data');
  }
  const o = raw as Record<string, unknown>;
  const data: FlightData = {
    id: String(o.id),
    airline: String(o.airline ?? ''),
    flight_number: String(o.flight_number ?? ''),
    departure_time: String(o.departure_time ?? ''),
    arrival_time: String(o.arrival_time ?? ''),
    estimated_price: typeof o.estimated_price === 'number' ? o.estimated_price : Number(o.estimated_price),
    currency: String(o.currency ?? 'USD'),
    source:
      o.source === 'aviationstack' || o.source === 'serpapi' || o.source === 'fallback'
        ? o.source
        : undefined,
    display_depart_label: typeof o.display_depart_label === 'string' ? o.display_depart_label : undefined,
    display_arrive_label: typeof o.display_arrive_label === 'string' ? o.display_arrive_label : undefined,
  };
  assertFlightDataShape(data);
  return data;
}

export function normalizeHotelForItineraryPin(raw: unknown): SerpApiHotelOption {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid hotel data');
  }
  const o = raw as Record<string, unknown>;
  const amenities = Array.isArray(o.amenities) ? o.amenities.filter((x) => typeof x === 'string') : [];
  const stars = typeof o.stars === 'number' ? o.stars : Number(o.stars);
  const pricePerNight =
    typeof o.pricePerNight === 'number' ? o.pricePerNight : Number(o.pricePerNight);

  const hotel: SerpApiHotelOption = {
    id: String(o.id ?? ''),
    name: String(o.name ?? ''),
    destination: String(o.destination ?? ''),
    stars: Number.isFinite(stars) ? stars : 0,
    pricePerNight: Number.isFinite(pricePerNight) ? pricePerNight : 0,
    thumbnail: typeof o.thumbnail === 'string' ? o.thumbnail : '',
    description: typeof o.description === 'string' ? o.description : '',
    amenities: amenities as string[],
  };

  if (!isNonEmptyString(hotel.id)) throw new Error('Invalid hotel: missing id');
  if (!isNonEmptyString(hotel.name)) throw new Error('Invalid hotel: missing name');
  if (!isFiniteNumber(hotel.pricePerNight) || hotel.pricePerNight < 0) {
    throw new Error('Invalid hotel: missing or invalid price');
  }
  return hotel;
}
