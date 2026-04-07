/**
 * Google Hotels via SerpAPI (https://serpapi.com/google-hotels-api).
 *
 * Uses EXPO_PUBLIC_SERPAPI_KEY from your app's `.env`.
 * Note: since this runs in the client, the key is bundled with the app.
 * For production, proxy via a backend or Edge Function.
 *
 * Adding a hotel to an itinerary does not call this API — only search does. Debounce rapid
 * searches in the UI if you wire live search; each call here counts against the SerpAPI quota.
 */

const SERPAPI_SEARCH = 'https://serpapi.com/search';

export type SerpApiHotelOption = {
  id: string;
  name: string;
  destination: string;
  stars: number;
  pricePerNight: number;
  thumbnail: string;
  description: string;
  amenities: string[];
};

export type SearchHotelsParams = {
  query: string;
  checkInDate: Date;
  checkOutDate: Date;
  adults: number;
};

type SerpApiHotelAds = {
  name?: string;
  property_token?: string;
  thumbnail?: string;
  extracted_price?: number;
  amenities?: string[];
  overall_rating?: number;
  hotel_class?: number | string;
  extracted_hotel_class?: number;
};

type SerpApiHotelsResponse = {
  search_metadata?: { status?: string };
  error?: string;
  ads?: SerpApiHotelAds[];
};

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function clampStars(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, Math.round(value)));
}

function parseStars(hotelClass: SerpApiHotelAds['hotel_class'], extractedHotelClass: unknown): number {
  if (typeof extractedHotelClass === 'number') return clampStars(extractedHotelClass);

  if (typeof hotelClass === 'number') return clampStars(hotelClass);

  if (typeof hotelClass === 'string') {
    const match = hotelClass.match(/\d+/);
    if (match) return clampStars(parseInt(match[0] ?? '0', 10));
  }

  return 0;
}

export async function searchGoogleHotels(
  params: SearchHotelsParams
): Promise<SerpApiHotelOption[]> {
  const apiKey = process.env.EXPO_PUBLIC_SERPAPI_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_SERPAPI_KEY. Add it to your .env file and restart the Expo dev server.'
    );
  }

  const q = params.query.trim();
  if (q.length < 2) {
    throw new Error('Enter a destination or hotel name (e.g. "Tokyo").');
  }

  if (!(params.checkOutDate.getTime() > params.checkInDate.getTime())) {
    throw new Error('Check-out date must be after check-in date.');
  }

  const adults = Math.max(1, Math.floor(params.adults || 1));

  const query = new URLSearchParams({
    engine: 'google_hotels',
    api_key: apiKey,
    q,
    check_in_date: toISODate(params.checkInDate),
    check_out_date: toISODate(params.checkOutDate),
    adults: String(Math.min(9, adults)),
    currency: 'USD',
    hl: 'en',
    gl: 'us',
  });

  const url = `${SERPAPI_SEARCH}?${query.toString()}`;
  const res = await fetch(url);
  const data = (await res.json()) as SerpApiHotelsResponse;

  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `SerpAPI error (${res.status})`);
  }

  if (data.search_metadata?.status === 'Error' || data.error) {
    throw new Error(data.error || 'Hotel search failed.');
  }

  const ads = data.ads ?? [];
  return ads
    .map((ad, idx): SerpApiHotelOption | null => {
      const id = ad.property_token ?? `serp-hotel-${idx}`;
      const pricePerNight = typeof ad.extracted_price === 'number' ? ad.extracted_price : 0;
      const amenities = Array.isArray(ad.amenities) ? ad.amenities : [];
      const stars = parseStars(ad.hotel_class, ad.extracted_hotel_class);

      return {
        id,
        name: ad.name ?? 'Unknown hotel',
        destination: q,
        stars,
        pricePerNight,
        thumbnail: ad.thumbnail ?? '',
        description: amenities.slice(0, 4).join(' · '),
        amenities,
      };
    })
    .filter((x): x is SerpApiHotelOption => x !== null);
}

