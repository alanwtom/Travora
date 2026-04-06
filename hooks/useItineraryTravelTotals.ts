import { getFlightQuote } from '@/services/flightQuotes';
import { getTravelOrigin } from '@/services/travelOrigin';
import { resolveVideoDestination } from '@/services/videoDestination';
import type { VideoWithProfile } from '@/types/database';
import type { DestinationPoint, FlightQuote, OriginLocation } from '@/types/travel';
import { useEffect, useMemo, useState } from 'react';

export type ItineraryTravelRow = {
  video: VideoWithProfile;
  destination: DestinationPoint | null;
  quote: FlightQuote | undefined;
};

/**
 * Aggregates flight estimates for saved itinerary videos (uses same cache as swipe).
 */
export function useItineraryTravelTotals(videos: VideoWithProfile[]) {
  const [origin, setOrigin] = useState<OriginLocation | null>(null);
  const [rows, setRows] = useState<ItineraryTravelRow[]>([]);
  const [loading, setLoading] = useState(true);

  const videoIdsKey = useMemo(() => videos.map((v) => v.id).join('|'), [videos]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (videos.length === 0) {
        setOrigin(null);
        setRows([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const o = await getTravelOrigin();
        if (cancelled) return;
        setOrigin(o);

        const nextRows: ItineraryTravelRow[] = [];
        for (const v of videos) {
          const dest = await resolveVideoDestination(v);
          if (cancelled) return;
          let quote: FlightQuote | undefined;
          if (dest) {
            quote = await getFlightQuote(o, dest);
          }
          nextRows.push({ video: v, destination: dest, quote });
        }
        if (!cancelled) {
          setRows(nextRows);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- videoIdsKey tracks itinerary membership
  }, [videoIdsKey]);

  const totalUsd = rows.reduce((sum, r) => sum + (r.quote?.priceUsd ?? 0), 0);

  return { origin, rows, totalUsd, loading };
}
