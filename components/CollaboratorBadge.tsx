/**
 * CollaboratorBadge Component
 *
 * Displays a badge showing the number of collaborators on an itinerary.
 * Can be pressed to open the collaborators modal.
 */

import { COLORS } from '@/lib/constants';
import * as Icons from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from './Themed';

type Props = {
  count: number;
  onPress: () => void;
  color?: string;
};

export function CollaboratorBadge({ count, onPress, color = COLORS.primary }: Props) {
  if (count === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.badge, { borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icons.Users size={14} color={color} strokeWidth={2} />
      <Text style={[styles.text, { color }]}> {count}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
