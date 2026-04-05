import { COLORS } from '@/lib/constants';
import type { ItinerarySuggestion } from '@/types/database';
import { MapPin, Clock, Wand2, Mountain, Umbrella, Landmark, Utensils, Compass } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';

type Props = {
  suggestion: ItinerarySuggestion;
  onGenerate: (suggestion: ItinerarySuggestion) => void;
  isGenerating: boolean;
};

function getStyleIcon(style: string) {
  switch (style) {
    case 'adventure': return Mountain;
    case 'relaxation': return Umbrella;
    case 'cultural': return Landmark;
    case 'foodie': return Utensils;
    default: return Compass;
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ItinerarySuggestionCard({ suggestion, onGenerate, isGenerating }: Props) {
  const StyleIcon = getStyleIcon(suggestion.inferredTravelStyle);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <MapPin size={16} color={COLORS.accent} strokeWidth={2.5} />
        <Text style={styles.destinationName} numberOfLines={1}>
          {suggestion.destinationName}
        </Text>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        {suggestion.locationCount} liked place{suggestion.locationCount !== 1 ? 's' : ''}
      </Text>

      {/* Badges row */}
      <View style={styles.badgesRow}>
        {/* Travel style badge */}
        <View style={styles.badge}>
          <StyleIcon size={10} color={COLORS.primary} strokeWidth={2.5} />
          <Text style={styles.badgeText}>{capitalize(suggestion.inferredTravelStyle)}</Text>
        </View>

        {/* Duration badge */}
        <View style={styles.badge}>
          <Clock size={10} color={COLORS.primary} strokeWidth={2.5} />
          <Text style={styles.badgeText}>{suggestion.recommendedDuration} day{suggestion.recommendedDuration !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Interest tags */}
      {suggestion.inferredInterests.length > 0 && (
        <View style={styles.interestsRow}>
          {suggestion.inferredInterests.map((interest) => (
            <View key={interest} style={styles.interestPill}>
              <Text style={styles.interestPillText}>{interest}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Generate button */}
      <TouchableOpacity
        style={styles.generateButton}
        onPress={() => onGenerate(suggestion)}
        disabled={isGenerating}
        activeOpacity={0.7}
      >
        {isGenerating ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Wand2 size={14} color="white" strokeWidth={2.5} />
            <Text style={styles.generateButtonText}>Generate</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.primary,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  interestPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  interestPillText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
