/**
 * Google Flights via SerpAPI (https://serpapi.com/google-flights-api).
 *
 * Set EXPO_PUBLIC_SERPAPI_KEY in your .env (same pattern as other EXPO_PUBLIC_* vars).
 * Note: keys bundled in the client can be extracted; for production, proxy calls through your backend.
 */

const SERPAPI_SEARCH = 'https://serpapi.com/search';

export type FlightSearchClass = 'Economy' | 'Premium Economy' | 'Business';

export type SerpApiFlightOption = {
  id: string;
  airline: string;
  from: string;
  to: string;
  departAt: string;
  arriveAt: string;
  duration: string;
  className: FlightSearchClass;
  price: number;
  stops: number;
};

type SerpLeg = {
  departure_airport: { id: string; time: string };
  arrival_airport: { id: string; time: string };
  airline: string;
  travel_class?: string;
};

type SerpBestFlight = {
  flights: SerpLeg[];
  total_duration: number;
  price: number;
  departure_token?: string;
};

type SerpFlightsResponse = {
  search_metadata?: { status?: string };
  error?: string;
  best_flights?: SerpBestFlight[];
  other_flights?: SerpBestFlight[];
};

const TRAVEL_CLASS_PARAM: Record<FlightSearchClass, string> = {
  Economy: '1',
  'Premium Economy': '2',
  Business: '3',
};

function formatDurationMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function formatTimeShort(isoDateTime: string): string {
  const part = isoDateTime.includes(' ') ? isoDateTime.split(' ')[1] : isoDateTime;
  if (!part) return isoDateTime;
  const [hh, mm] = part.split(':');
  const hour = parseInt(hh ?? '0', 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${mm ?? '00'} ${ampm}`;
}

function normalizeClass(tc: string | undefined): FlightSearchClass {
  const t = (tc ?? '').toLowerCase();
  if (t.includes('premium')) return 'Premium Economy';
  if (t.includes('business') || t.includes('first')) return 'Business';
  return 'Economy';
}

function mapGroup(f: SerpBestFlight, index: number): SerpApiFlightOption | null {
  const legs = f.flights;
  if (!legs?.length) return null;
  const first = legs[0];
  const last = legs[legs.length - 1];
  const stops = Math.max(0, legs.length - 1);
  return {
    id: f.departure_token ?? `serp-flight-${index}-${f.price}`,
    airline: first.airline,
    from: first.departure_airport.id,
    to: last.arrival_airport.id,
    departAt: formatTimeShort(first.departure_airport.time),
    arriveAt: formatTimeShort(last.arrival_airport.time),
    duration: formatDurationMinutes(f.total_duration),
    className: normalizeClass(first.travel_class),
    price: f.price,
    stops,
  };
}

export type SearchFlightsParams = {
  departureId: string;
  arrivalId: string;
  outboundDate: Date;
  returnDate: Date | null;
  roundTrip: boolean;
  adults: number;
  travelClass: FlightSearchClass;
};

export async function searchGoogleFlights(params: SearchFlightsParams): Promise<SerpApiFlightOption[]> {
  const apiKey = process.env.EXPO_PUBLIC_SERPAPI_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_SERPAPI_KEY. Add it to your .env file and restart the Expo dev server.'
    );
  }

  const dep = params.departureId.trim().toUpperCase();
  const arr = params.arrivalId.trim().toUpperCase();
  if (dep.length < 3 || arr.length < 3) {
    throw new Error('Enter 3-letter airport codes for origin and destination (e.g. SFO and NRT).');
  }

  const outbound = params.outboundDate.toISOString().slice(0, 10);
  const ret = params.returnDate ? params.returnDate.toISOString().slice(0, 10) : '';

  const query = new URLSearchParams({
    engine: 'google_flights',
    api_key: apiKey,
    departure_id: dep,
    arrival_id: arr,
    outbound_date: outbound,
    type: params.roundTrip ? '1' : '2',
    adults: String(Math.min(9, Math.max(1, params.adults))),
    travel_class: TRAVEL_CLASS_PARAM[params.travelClass],
    currency: 'USD',
    hl: 'en',
    gl: 'us',
  });

  if (params.roundTrip) {
    if (!ret) {
      throw new Error('Choose a return date for round-trip searches.');
    }
    query.set('return_date', ret);
  }

  const url = `${SERPAPI_SEARCH}?${query.toString()}`;
  const res = await fetch(url);
  const data = (await res.json()) as SerpFlightsResponse;

  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `SerpAPI error (${res.status})`);
  }

  if (data.search_metadata?.status === 'Error' || data.error) {
    throw new Error(data.error || 'Flight search failed.');
  }

  const groups: SerpBestFlight[] = [
    ...(data.best_flights ?? []),
    ...(data.other_flights ?? []),
  ];

  const options: SerpApiFlightOption[] = [];
  groups.forEach((g, i) => {
    const mapped = mapGroup(g, i);
    if (mapped) options.push(mapped);
  });

  return options;
}
