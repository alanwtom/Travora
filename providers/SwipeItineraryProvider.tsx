import { PersonalizedFeedVideo } from '@/services/personalizedFeed';
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

/** Merge AsyncStorage restore with in-memory rows so a fast swipe before hydration completes is not lost. */
function mergeItineraryHydrate(
  stored: PersonalizedFeedVideo[],
  current: PersonalizedFeedVideo[]
): PersonalizedFeedVideo[] {
  if (!current.length) return stored;
  const currentById = new Map(current.map((v) => [v.id, v]));
  const storedIds = new Set(stored.map((v) => v.id));
  const out: PersonalizedFeedVideo[] = [];
  for (const v of stored) {
    out.push(currentById.get(v.id) ?? v);
  }
  for (const v of current) {
    if (!storedIds.has(v.id)) out.push(v);
  }
  return out;
}

type SwipeItineraryContextValue = {
  itinerary: PersonalizedFeedVideo[];
  hydrated: boolean;
  addToItinerary: (video: PersonalizedFeedVideo) => void;
  removeFromItineraryById: (videoId: string) => void;
  /** Replace server-backed likes in order, keep local-only rows at the end. */
  syncItineraryWithServerVideos: (videos: PersonalizedFeedVideo[]) => void;
  clearItinerary: () => void;
};

const SwipeItineraryContext = createContext<SwipeItineraryContextValue | null>(null);

export function SwipeItineraryProvider({ children }: { children: React.ReactNode }) {
  const [itinerary, setItinerary] = useState<PersonalizedFeedVideo[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ITINERARY_STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as PersonalizedFeedVideo[];
          if (Array.isArray(parsed)) {
            setItinerary((current) => mergeItineraryHydrate(parsed, current));
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

  const addToItinerary = useCallback((video: PersonalizedFeedVideo) => {
    setItinerary((prev) => {
      if (prev.some((v) => v.id === video.id)) return prev;
      return [...prev, video];
    });
  }, []);

  const removeFromItineraryById = useCallback((videoId: string) => {
    setItinerary((prev) => prev.filter((v) => v.id !== videoId));
  }, []);

  const syncItineraryWithServerVideos = useCallback((serverVideos: PersonalizedFeedVideo[]) => {
    setItinerary((prev) => {
      const serverIds = new Set(serverVideos.map((v) => v.id));
      const tail = prev.filter((v) => !serverIds.has(v.id));
      return [...serverVideos, ...tail];
    });
  }, []);

  const clearItinerary = useCallback(() => setItinerary([]), []);

  const value = useMemo(
    () => ({
      itinerary,
      hydrated,
      addToItinerary,
      removeFromItineraryById,
      syncItineraryWithServerVideos,
      clearItinerary,
    }),
    [
      itinerary,
      hydrated,
      addToItinerary,
      removeFromItineraryById,
      syncItineraryWithServerVideos,
      clearItinerary,
    ]
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
