import { useState, useCallback, useEffect } from 'react';
import type { Itinerary } from '@/types/database';
import {
  getUserItineraries,
  deleteItinerary,
  getItineraryStats,
} from '@/services/itineraries';

export interface ItineraryWithStats extends Itinerary {
  stats?: {
    averageRating: number | null;
    totalRatings: number;
    thumbsUp: number;
    thumbsDown: number;
  };
}

export interface UseUserItinerariesReturn {
  itineraries: ItineraryWithStats[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deleteItinerary: (id: string) => Promise<void>;
}

/**
 * Hook to fetch and manage user's saved itineraries
 */
export function useUserItineraries(
  userId: string | undefined
): UseUserItinerariesReturn {
  const [itineraries, setItineraries] = useState<ItineraryWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItineraries = useCallback(async () => {
    if (!userId) {
      setItineraries([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const userItineraries = await getUserItineraries(userId);

      // Fetch stats for each itinerary
      const itinerariesWithStats = await Promise.all(
        userItineraries.map(async (itinerary) => {
          try {
            const stats = await getItineraryStats(itinerary.id);
            return { ...itinerary, stats };
          } catch {
            return itinerary;
          }
        })
      );

      setItineraries(itinerariesWithStats);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch itineraries'
      );
      setItineraries([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const handleDeleteItinerary = useCallback(
    async (itineraryId: string) => {
      try {
        await deleteItinerary(itineraryId);

        // Remove from local state
        setItineraries((prev) =>
          prev.filter((itinerary) => itinerary.id !== itineraryId)
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to delete itinerary'
        );
        throw err;
      }
    },
    []
  );

  useEffect(() => {
    fetchItineraries();
  }, [fetchItineraries]);

  return {
    itineraries,
    isLoading,
    error,
    refetch: fetchItineraries,
    deleteItinerary: handleDeleteItinerary,
  };
}
