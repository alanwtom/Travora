import { VideoWithProfile } from '@/types/database';
import type { DestinationPoint } from '@/types/travel';
import { forwardGeocodeSearch } from './geoapifySearch';

/**
 * Resolve a stable destination point for a video: DB coords, then forward geocode of `location`.
 */
export async function resolveVideoDestination(
  video: VideoWithProfile
): Promise<DestinationPoint | null> {
  if (
    video.latitude != null &&
    video.longitude != null &&
    !Number.isNaN(video.latitude) &&
    !Number.isNaN(video.longitude)
  ) {
    return {
      latitude: video.latitude,
      longitude: video.longitude,
      label: video.location?.trim() || 'Destination',
    };
  }

  const place = video.location?.trim();
  if (place) {
    const hit = await forwardGeocodeSearch(place);
    if (hit) {
      return {
        latitude: hit.latitude,
        longitude: hit.longitude,
        label: hit.label,
      };
    }
  }

  return null;
}
