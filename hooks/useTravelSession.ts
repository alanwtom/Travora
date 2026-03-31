import { getFlightQuote } from '@/services/flightQuotes';
import { getTravelOrigin, FALLBACK_ORIGIN } from '@/services/travelOrigin';
import { resolveVideoDestination } from '@/services/videoDestination';
import type { VideoWithProfile } from '@/types/database';
import type { DestinationPoint, FlightQuote, OriginLocation } from '@/types/travel';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type DestCache = Record<string, DestinationPoint | null | undefined>;
type QuoteCache = Record<string, FlightQuote | undefined>;

/**
 * Resolves user origin (device or fallback), destination coords per video id, and flight quotes with preload for current + next card.
 */
export function useTravelSession(
  current: VideoWithProfile | undefined,
  next: VideoWithProfile | undefined
) {
  const [origin, setOrigin] = useState<OriginLocation | null>(null);
  const [destByVideoId, setDestByVideoId] = useState<DestCache>({});
  const [quotesByVideoId, setQuotesByVideoId] = useState<QuoteCache>({});

  const destRef = useRef<DestCache>({});
  const quotesRef = useRef<QuoteCache>({});
  const inflight = useRef<Set<string>>(new Set());

  useEffect(() => {
    destRef.current = destByVideoId;
  }, [destByVideoId]);

  useEffect(() => {
    quotesRef.current = quotesByVideoId;
  }, [quotesByVideoId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const o = await getTravelOrigin();
        if (!cancelled) setOrigin(o);
      } catch {
        if (!cancelled) setOrigin(FALLBACK_ORIGIN);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadVideoTravel = useCallback(async (video: VideoWithProfile, o: OriginLocation) => {
    const id = video.id;
    if (inflight.current.has(id)) return;
    if (quotesRef.current[id]) return;

    inflight.current.add(id);
    try {
      let dest = destRef.current[id];
      if (dest === undefined) {
        dest = await resolveVideoDestination(video);
        destRef.current[id] = dest;
        setDestByVideoId((prev) => ({ ...prev, [id]: dest }));
      }

      if (!dest) return;
      if (quotesRef.current[id]) return;

      const quote = await getFlightQuote(o, dest);
      quotesRef.current[id] = quote;
      setQuotesByVideoId((prev) => ({ ...prev, [id]: quote }));
    } finally {
      inflight.current.delete(id);
    }
  }, []);

  useEffect(() => {
    if (!origin) return;
    const run = () => {
      const tasks: Promise<void>[] = [];
      if (current) tasks.push(loadVideoTravel(current, origin));
      if (next) tasks.push(loadVideoTravel(next, origin));
      void Promise.all(tasks);
    };
    const t = setTimeout(run, 120);
    return () => clearTimeout(t);
  }, [origin, current?.id, next?.id, loadVideoTravel]);

  const getDest = useCallback(
    (videoId: string): DestinationPoint | null | undefined => destByVideoId[videoId],
    [destByVideoId]
  );

  const getQuote = useCallback(
    (videoId: string) => quotesByVideoId[videoId],
    [quotesByVideoId]
  );

  const snapshot = useMemo(
    () => ({ origin, destByVideoId, quotesByVideoId }),
    [origin, destByVideoId, quotesByVideoId]
  );

  return {
    origin,
    getDest,
    getQuote,
    snapshot,
  };
}
