import { calculateDistance } from '@/services/geolocation';
import type { DestinationPoint, FlightQuote, OriginLocation } from '@/types/travel';

const memoryCache = new Map<string, FlightQuote>();

function cacheKey(origin: OriginLocation, dest: DestinationPoint): string {
  return `${origin.latitude.toFixed(4)}:${origin.longitude.toFixed(4)}→${dest.latitude.toFixed(
    4
  )}:${dest.longitude.toFixed(4)}`;
}

/**
 * Deterministic mock round-trip price from great-circle distance.
 * Replace `getFlightQuote` body with a real flight API (Duffel, Amadeus, etc.) when ready.
 */
function mockRoundTripUsd(distanceKm: number, seed: string): number {
  const perKm = 0.08 + (seed.length % 7) * 0.01;
  const base = 120 + distanceKm * perKm;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const jitter = (h % 90) - 45;
  return Math.max(99, Math.round(base + jitter));
}

/**
 * Fetch (or compute mock) round-trip estimate origin → destination. Results are cached in-memory.
 */
export async function getFlightQuote(
  origin: OriginLocation,
  destination: DestinationPoint
): Promise<FlightQuote> {
  const key = cacheKey(origin, destination);
  const cached = memoryCache.get(key);
  if (cached) return cached;

  const distanceKm = calculateDistance(
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude
  );

  const destKey = `${destination.latitude.toFixed(3)}_${destination.longitude.toFixed(3)}`;
  const priceUsd = mockRoundTripUsd(distanceKm, destKey);

  const originShort = origin.label.split(',')[0]?.trim() || 'Origin';
  const destShort = destination.label.split(',')[0]?.trim() || 'Destination';

  const quote: FlightQuote = {
    destinationKey: destKey,
    originLabel: originShort,
    destinationLabel: destShort,
    routeLabel: `${originShort} → ${destShort}`,
    priceUsd,
    roundTrip: true,
    distanceKm,
  };

  memoryCache.set(key, quote);
  return quote;
}

export function peekFlightQuoteCache(
  origin: OriginLocation,
  destination: DestinationPoint
): FlightQuote | undefined {
  return memoryCache.get(cacheKey(origin, destination));
}

export function clearFlightQuoteCache(): void {
  memoryCache.clear();
}
