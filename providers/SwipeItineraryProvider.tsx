import { VideoWithProfile } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const ITINERARY_STORAGE_KEY = 'travora:swipe_itinerary_v1';

type SwipeItineraryContextValue = {
  itinerary: VideoWithProfile[];
  hydrated: boolean;
  addToItinerary: (video: VideoWithProfile) => void;
  removeFromItineraryById: (videoId: string) => void;
  clearItinerary: () => void;
};

const SwipeItineraryContext = createContext<SwipeItineraryContextValue | null>(null);

export function SwipeItineraryProvider({ children }: { children: React.ReactNode }) {
  const [itinerary, setItinerary] = useState<VideoWithProfile[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ITINERARY_STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as VideoWithProfile[];
          if (Array.isArray(parsed)) {
            setItinerary(parsed);
          }
        }
      } catch {
        /* ignore corrupt storage */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(itinerary)).catch(() => {});
  }, [itinerary, hydrated]);

  const addToItinerary = useCallback((video: VideoWithProfile) => {
    setItinerary((prev) => {
      if (prev.some((v) => v.id === video.id)) return prev;
      return [...prev, video];
    });
  }, []);

  const removeFromItineraryById = useCallback((videoId: string) => {
    setItinerary((prev) => prev.filter((v) => v.id !== videoId));
  }, []);

  const clearItinerary = useCallback(() => setItinerary([]), []);

  const value = useMemo(
    () => ({
      itinerary,
      hydrated,
      addToItinerary,
      removeFromItineraryById,
      clearItinerary,
    }),
    [itinerary, hydrated, addToItinerary, removeFromItineraryById, clearItinerary]
  );

  return (
    <SwipeItineraryContext.Provider value={value}>{children}</SwipeItineraryContext.Provider>
  );
}

export function useSwipeItinerary() {
  const ctx = useContext(SwipeItineraryContext);
  if (!ctx) {
    throw new Error('useSwipeItinerary must be used within SwipeItineraryProvider');
  }
  return ctx;
}
