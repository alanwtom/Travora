import Constants from 'expo-constants';

const getKey = () =>
  Constants.expoConfig?.extra?.geoapifyApiKey ||
  process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY ||
  '';

export type GeocodeHit = {
  latitude: number;
  longitude: number;
  label: string;
};

/**
 * Forward geocode a place name via Geoapify (same key as reverse in `location.ts`).
 * Returns null if no key or no results.
 */
export async function forwardGeocodeSearch(text: string): Promise<GeocodeHit | null> {
  const apiKey = getKey();
  const q = text.trim();
  if (!q || !apiKey) return null;

  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
      q
    )}&limit=1&apiKey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    const hit = data?.features?.[0];
    if (!hit?.geometry?.coordinates) return null;
    const [lon, lat] = hit.geometry.coordinates;
    const label =
      hit.properties?.formatted ||
      hit.properties?.name ||
      hit.properties?.city ||
      q;
    return { latitude: lat, longitude: lon, label };
  } catch (e) {
    console.warn('forwardGeocodeSearch failed', e);
    return null;
  }
}
