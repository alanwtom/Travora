import { COLORS } from '@/lib/constants';
import type { FlightQuote } from '@/types/travel';
import type { DestinationPoint } from '@/types/travel';
import type { OriginLocation } from '@/types/travel';
import { ChevronDown, ChevronUp, Plane } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { RouteMapPreview } from './RouteMapPreview';

type Props = {
  origin: OriginLocation | null;
  destination: DestinationPoint | null | undefined;
  quote: FlightQuote | undefined;
  loading?: boolean;
  mapExpanded: boolean;
  onToggleMap: () => void;
  /** Shown while destination coords are still resolving */
  fallbackLabel?: string | null;
};

export function TravelFlightOverlay({
  origin,
  destination,
  quote,
  loading,
  mapExpanded,
  onToggleMap,
  fallbackLabel,
}: Props) {
  const destName = destination?.label || fallbackLabel?.trim() || 'Destination';

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={styles.card} pointerEvents="auto">
        <View style={styles.row}>
          <Plane size={16} color={COLORS.accent} strokeWidth={2.2} />
          <Text style={styles.dest} numberOfLines={1}>
            {destName}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.accent} />
            <Text style={styles.muted}>Estimating flights…</Text>
          </View>
        ) : quote ? (
          <Text style={styles.price}>
            ~${quote.priceUsd} round trip · {quote.routeLabel}
          </Text>
        ) : destination === null ? (
          <Text style={styles.muted}>Add coordinates or a place name on the video to see flight estimates</Text>
        ) : null}

        {origin && destination && mapExpanded ? (
          <View style={styles.mapBox}>
            <RouteMapPreview origin={origin} destination={destination} height={140} />
          </View>
        ) : null}

        {origin && destination ? (
          <Pressable onPress={onToggleMap} style={styles.mapToggle} hitSlop={8}>
            <Text style={styles.mapToggleText}>{mapExpanded ? 'Hide map' : 'Show map'}</Text>
            {mapExpanded ? (
              <ChevronUp size={16} color={COLORS.accent} />
            ) : (
              <ChevronDown size={16} color={COLORS.accent} />
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dest: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  price: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    fontWeight: '600',
  },
  muted: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  mapBox: {
    marginTop: 10,
  },
  mapToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  mapToggleText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
});
