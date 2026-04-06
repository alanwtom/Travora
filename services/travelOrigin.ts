import { getLocationWithPlaceName } from '@/services/location';
import type { OriginLocation } from '@/types/travel';

const FALLBACK_ORIGIN: OriginLocation = {
  latitude: 37.7749,
  longitude: -122.4194,
  label: 'San Francisco (estimate)',
};

const CITY_TO_AIRPORT: Record<string, string> = {
  'San Francisco': 'SFO',
  'Los Angeles': 'LAX',
  Seattle: 'SEA',
  Denver: 'DEN',
  Chicago: 'ORD',
  Boston: 'BOS',
  Miami: 'MIA',
  Atlanta: 'ATL',
  'New York': 'JFK',
  London: 'LHR',
  Paris: 'CDG',
  Tokyo: 'NRT',
  Singapore: 'SIN',
  Sydney: 'SYD',
  Dubai: 'DXB',
};

/**
 * Device location with place name, or a fallback origin for mock pricing.
 */
export async function getTravelOrigin(): Promise<OriginLocation> {
  try {
    const { coords, placeName } = await getLocationWithPlaceName();
    if (coords) {
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
        label: placeName?.split(',').slice(0, 2).join(',') || 'Your location',
      };
    }
  } catch {
    /* use fallback */
  }
  return FALLBACK_ORIGIN;
}

/**
 * Convert location coordinates or label to a likely IATA code.
 */
export function coordinatesToAirportCode(latitude: number, longitude: number, label?: string): string {
  if (label) {
    const cityName = label.split(',')[0].trim().toLowerCase();
    for (const [city, code] of Object.entries(CITY_TO_AIRPORT)) {
      if (city.toLowerCase().includes(cityName) || cityName.includes(city.toLowerCase())) {
        return code;
      }
    }
  }

  if (latitude > 24 && latitude < 49 && longitude > -125 && longitude < -67) {
    if (latitude > 40) return longitude > -95 ? 'JFK' : 'SFO';
    return longitude > -95 ? 'MIA' : 'LAX';
  }

  if (latitude > 35 && latitude < 71 && longitude > -10 && longitude < 40) {
    return longitude > 10 ? 'FRA' : 'LHR';
  }

  if (latitude > -10 && latitude < 50 && longitude > 70 && longitude < 150) {
    return longitude > 100 ? 'SIN' : 'DEL';
  }

  return 'JFK';
}

export { FALLBACK_ORIGIN };
