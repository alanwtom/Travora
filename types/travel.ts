/**
 * Travel / flight types for swipe + itinerary features.
 */

export type OriginLocation = {
  latitude: number;
  longitude: number;
  label: string;
};

export type DestinationPoint = {
  latitude: number;
  longitude: number;
  label: string;
};

export type FlightQuote = {
  /** Cache key segment */
  destinationKey: string;
  originLabel: string;
  destinationLabel: string;
  /** Display string e.g. "SFO area → Paris" */
  routeLabel: string;
  /** Estimated round-trip USD (mock or API) */
  priceUsd: number;
  roundTrip: true;
  /** Great-circle distance used for mock pricing (km) */
  distanceKm: number;
};

export type FlightSearchParams = {
  origin: string;
  destination: string;
  date: string;
  cursor?: string;
};

export type FlightData = {
  id: string;
  airline: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  estimated_price: number;
  currency: string;
};

export type FlightSearchResponse = {
  flights: FlightData[];
  next_cursor: string | null;
  pagination: {
    cursor: string | null;
    next_cursor: string | null;
    limit: number;
    total: number | null;
  };
  source: 'api' | 'cache' | 'fallback';
};

export type CachedFlightSearch = {
  id: string;
  origin: string;
  destination: string;
  date: string;
  results: FlightSearchResponse;
  created_at: string;
};
