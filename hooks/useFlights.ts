import { searchFlights } from '@/services/flightService';
import type { FlightData, FlightSearchParams, FlightSearchResponse } from '@/types/travel';
import { useCallback, useState } from 'react';

export interface UseFlightsReturn {
  flights: FlightData[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  search: (params: Omit<FlightSearchParams, 'cursor'>) => Promise<void>;
  reset: () => void;
}

export function useFlights(): UseFlightsReturn {
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [currentParams, setCurrentParams] = useState<FlightSearchParams | null>(null);

  const search = useCallback(async (params: Omit<FlightSearchParams, 'cursor'>) => {
    setLoading(true);
    setError(null);
    setFlights([]);
    setNextCursor(undefined);

    const searchParams: FlightSearchParams = { ...params };

    try {
      const response: FlightSearchResponse = await searchFlights(searchParams);
      setFlights(response.flights);
      setNextCursor(response.next_cursor);
      setCurrentParams(searchParams);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!currentParams || !nextCursor || loading) return;

    setLoading(true);
    setError(null);

    const paramsWithCursor: FlightSearchParams = {
      ...currentParams,
      cursor: nextCursor,
    };

    try {
      const response: FlightSearchResponse = await searchFlights(paramsWithCursor);
      setFlights(prev => [...prev, ...response.flights]);
      setNextCursor(response.next_cursor);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Load more failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentParams, nextCursor, loading]);

  const reset = useCallback(() => {
    setFlights([]);
    setLoading(false);
    setError(null);
    setNextCursor(undefined);
    setCurrentParams(null);
  }, []);

  return {
    flights,
    loading,
    error,
    hasMore: !!nextCursor,
    loadMore,
    search,
    reset,
  };
}