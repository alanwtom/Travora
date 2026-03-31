import { getLocationWithPlaceName } from '@/services/location';
import type { OriginLocation } from '@/types/travel';

const FALLBACK_ORIGIN: OriginLocation = {
  latitude: 37.7749,
  longitude: -122.4194,
  label: 'San Francisco (estimate)',
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

export { FALLBACK_ORIGIN };
