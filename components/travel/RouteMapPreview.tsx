import { COLORS } from '@/lib/constants';
import type { OriginLocation } from '@/types/travel';
import type { DestinationPoint } from '@/types/travel';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  origin: OriginLocation;
  destination: DestinationPoint;
  height?: number;
};

/**
 * Placeholder where a mini map used to render. Maps removed as a product limitation.
 */
export function RouteMapPreview({ height = 112 }: Props) {
  return (
    <View style={[styles.placeholder, { height }]}>
      <Text style={styles.placeholderText}>Map preview unavailable (known limitation)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  placeholderText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
