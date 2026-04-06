import { COLORS } from '@/lib/constants';
import type { ItineraryTravelRow } from '@/hooks/useItineraryTravelTotals';
import type { OriginLocation } from '@/types/travel';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

type Props = {
  origin: OriginLocation | null;
  rows: ItineraryTravelRow[];
  height?: number;
};

function fitRegion(
  points: { latitude: number; longitude: number }[],
  padding = 1.4
) {
  if (!points.length) {
    return {
      latitude: 20,
      longitude: 0,
      latitudeDelta: 40,
      longitudeDelta: 40,
    };
  }
  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const midLat = (minLat + maxLat) / 2;
  const midLon = (minLon + maxLon) / 2;
  const latDelta = Math.max((maxLat - minLat) * padding, 0.15);
  const lonDelta = Math.max((maxLon - minLon) * padding, 0.15);
  return {
    latitude: midLat,
    longitude: midLon,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
}

/**
 * All saved destinations + origin on one map (native only).
 */
export function ItineraryRouteMap({ origin, rows, height = 220 }: Props) {
  const markers = useMemo(() => {
    const pts: { latitude: number; longitude: number }[] = [];
    if (origin) pts.push({ latitude: origin.latitude, longitude: origin.longitude });
    for (const r of rows) {
      if (r.destination) {
        pts.push({
          latitude: r.destination.latitude,
          longitude: r.destination.longitude,
        });
      }
    }
    return pts;
  }, [origin, rows]);

  const region = useMemo(() => fitRegion(markers), [markers]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.fallback, { height }]}>
        <Text style={styles.fallbackText}>Map of saved destinations (open in iOS/Android app)</Text>
      </View>
    );
  }

  if (markers.length === 0) {
    return (
      <View style={[styles.fallback, { height }]}>
        <Text style={styles.fallbackText}>No destinations with coordinates yet</Text>
      </View>
    );
  }

  const MapView = require('react-native-maps').default;
  const { Marker, Polyline } = require('react-native-maps');

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView style={StyleSheet.absoluteFill} region={region} accessibilityLabel="Itinerary map">
        {origin ? (
          <Marker
            coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}
            title="From"
            pinColor={COLORS.primary}
          />
        ) : null}
        {rows.map((r) =>
          r.destination ? (
            <Marker
              key={r.video.id}
              coordinate={{
                latitude: r.destination.latitude,
                longitude: r.destination.longitude,
              }}
              title={r.video.title || r.destination.label}
              pinColor={COLORS.accent}
            />
          ) : null
        )}
        {origin &&
          rows.map((r) =>
            r.destination ? (
              <Polyline
                key={`line-${r.video.id}`}
                coordinates={[
                  { latitude: origin.latitude, longitude: origin.longitude },
                  {
                    latitude: r.destination.latitude,
                    longitude: r.destination.longitude,
                  },
                ]}
                strokeColor={COLORS.accent}
                strokeWidth={2}
              />
            ) : null
          )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  fallback: {
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  fallbackText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
