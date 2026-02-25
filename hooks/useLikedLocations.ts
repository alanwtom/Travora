import { useState, useCallback, useEffect } from 'react';
import type { LocationWithCoordinates, LocationCluster } from '@/types/database';
import { getUserLikedLocations } from '@/services/itineraries';
import { clusterLocations } from '@/services/geolocation';

export interface UseLikedLocationsReturn {
  locations: LocationWithCoordinates[];
  clusters: LocationCluster[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage user's liked locations for itinerary generation
 */
export function useLikedLocations(
  userId: string | undefined
): UseLikedLocationsReturn {
  const [locations, setLocations] = useState<LocationWithCoordinates[]>([]);
  const [clusters, setClusters] = useState<LocationCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    if (!userId) {
      setLocations([]);
      setClusters([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const likedLocations = await getUserLikedLocations(userId);
      setLocations(likedLocations);

      // Cluster locations for better organization
      const locationClusters = clusterLocations(likedLocations, 15);
      setClusters(locationClusters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch liked locations');
      setLocations([]);
      setClusters([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return {
    locations,
    clusters,
    isLoading,
    error,
    refetch: fetchLocations,
  };
}
