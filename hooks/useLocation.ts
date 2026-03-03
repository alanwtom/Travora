import { useState } from 'react';
import { getLocationWithPlaceName } from '../services/location';

interface LocationData {
  coords: { latitude: number; longitude: number } | null;
  placeName: string | null;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData>({
    coords: null,
    placeName: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLocationWithPlaceName();
      setLocation(result);
      if (!result.coords) {
        setError('Could not obtain location');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    ...location,
    loading,
    error,
    fetchLocation,
  };
}