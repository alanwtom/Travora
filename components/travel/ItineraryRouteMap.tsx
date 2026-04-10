import { COLORS } from '@/lib/constants';
import type { ItineraryTravelRow } from '@/hooks/useItineraryTravelTotals';
import type { OriginLocation } from '@/types/travel';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  origin: OriginLocation | null;
  rows: ItineraryTravelRow[];
  height?: number;
};

/**
 * Route overview placeholder. Native maps were removed (react-native-maps caused
 * crashes / required a custom dev build). Lists and travel estimates still work.
 */
export function ItineraryRouteMap({ origin, rows, height = 220 }: Props) {
  const markerCount = useMemo(() => {
    let n = origin ? 1 : 0;
    for (const r of rows) {
      if (r.destination) n += 1;
    }
    return n;
  }, [origin, rows]);

  if (markerCount === 0) {
    return (
      <View style={[styles.fallback, { height }]}>
        <Text style={styles.fallbackText}>No destinations with coordinates yet</Text>
      </View>
    );
  }

  return (
    <View style={[styles.fallback, { height }]}>
      <Text style={styles.fallbackTitle}>Route map</Text>
      <Text style={styles.fallbackText}>
        Map preview is not available in this build (known limitation). Your saved stops and flight
        estimates below are unchanged.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  fallbackText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
