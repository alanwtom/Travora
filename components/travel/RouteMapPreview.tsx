import { COLORS } from '@/lib/constants';
import type { OriginLocation } from '@/types/travel';
import type { DestinationPoint } from '@/types/travel';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

type Props = {
  origin: OriginLocation;
  destination: DestinationPoint;
  height?: number;
};

function fitRegion(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) {
  const minLat = Math.min(a.latitude, b.latitude);
  const maxLat = Math.max(a.latitude, b.latitude);
  const minLon = Math.min(a.longitude, b.longitude);
  const maxLon = Math.max(a.longitude, b.longitude);
  const midLat = (minLat + maxLat) / 2;
  const midLon = (minLon + maxLon) / 2;
  const latDelta = Math.max((maxLat - minLat) * 2.8, 0.08);
  const lonDelta = Math.max((maxLon - minLon) * 2.8, 0.08);
  return {
    latitude: midLat,
    longitude: midLon,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
}

/**
 * Mini map with origin/destination markers and a great-circle style polyline (straight on Mercator).
 */
export function RouteMapPreview({ origin, destination, height = 112 }: Props) {
  const region = useMemo(
    () => fitRegion(origin, destination),
    [origin.latitude, origin.longitude, destination.latitude, destination.longitude]
  );

  const line = useMemo(
    () => [
      { latitude: origin.latitude, longitude: origin.longitude },
      { latitude: destination.latitude, longitude: destination.longitude },
    ],
    [origin, destination]
  );

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webFallback, { height }]}>
        <Text style={styles.webFallbackText}>Route map available on iOS & Android</Text>
      </View>
    );
  }

  const MapView = require('react-native-maps').default;
  const { Marker, Polyline } = require('react-native-maps');

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        region={region}
        scrollEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        zoomEnabled={false}
        accessibilityLabel="Route map"
      >
        <Marker
          coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}
          title="From"
          pinColor={COLORS.primary}
        />
        <Marker
          coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
          title="To"
          pinColor={COLORS.accent}
        />
        <Polyline coordinates={line} strokeColor={COLORS.accent} strokeWidth={2.5} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  webFallback: {
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  webFallbackText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
