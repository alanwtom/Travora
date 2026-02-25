import { COLORS } from '@/lib/constants';
import type { ItineraryWithStats } from '@/hooks/useUserItineraries';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  itinerary: ItineraryWithStats;
  onPress?: () => void;
  onDelete?: () => void;
};

export function ItineraryCard({ itinerary, onPress, onDelete }: Props) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/itineraries/[id]',
        params: { id: itinerary.id },
      });
    }
  };

  const handleDelete = (e: React.GestureResponderEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  const getTravelStyleIcon = (style?: string | null) => {
    switch (style?.toLowerCase()) {
      case 'adventure':
        return 'hiking';
      case 'relaxation':
        return 'umbrella-beach';
      case 'cultural':
        return 'landmark';
      case 'foodie':
        return 'utensils';
      default:
        return 'compass';
    }
  };

  const getBudgetColor = (budget?: string | null) => {
    switch (budget?.toLowerCase()) {
      case 'budget':
        return COLORS.success;
      case 'moderate':
        return COLORS.warning;
      case 'luxury':
        return '#9C27B0';
      default:
        return COLORS.textMuted;
    }
  };

  const timeAgo = getTimeAgo(itinerary.created_at);

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      {/* Left: Destination and Info */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.destination} numberOfLines={1}>
            {itinerary.destination}
          </Text>
          {onDelete && (
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="trash" size={14} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>

        {/* Subtitle row */}
        <View style={styles.subtitleRow}>
          <Text style={styles.duration}>{itinerary.duration_days} Days</Text>
          <Text style={styles.separator}>·</Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>

        {/* Badges row */}
        <View style={styles.badgesRow}>
          {/* Travel style badge */}
          {itinerary.travel_style && (
            <View style={styles.badge}>
              <FontAwesome
                name={getTravelStyleIcon(itinerary.travel_style) as any}
                size={10}
                color={COLORS.primary}
              />
              <Text style={styles.badgeText}>
                {itinerary.travel_style.charAt(0).toUpperCase() +
                  itinerary.travel_style.slice(1)}
              </Text>
            </View>
          )}

          {/* Budget badge */}
          {itinerary.budget_level && (
            <View
              style={[
                styles.badge,
                { backgroundColor: getBudgetColor(itinerary.budget_level) + '20' },
              ]}
            >
              <FontAwesome name="wallet" size={10} color={getBudgetColor(itinerary.budget_level)} />
              <Text style={[styles.badgeText, { color: getBudgetColor(itinerary.budget_level) }]}>
                {itinerary.budget_level.charAt(0).toUpperCase() +
                  itinerary.budget_level.slice(1)}
              </Text>
            </View>
          )}

          {/* Generation method badge */}
          <View
            style={[
              styles.badge,
              itinerary.generated_by === 'llm'
                ? styles.badgeAI
                : styles.badgeRuleBased,
            ]}
          >
            <FontAwesome
              name={itinerary.generated_by === 'llm' ? 'robot' : 'cogs'}
              size={10}
              color="white"
            />
            <Text style={styles.badgeTextLight}>
              {itinerary.generated_by === 'llm' ? 'AI' : 'Smart Match'}
            </Text>
          </View>
        </View>

        {/* Rating row */}
        {itinerary.stats && itinerary.stats.totalRatings > 0 && (
          <View style={styles.ratingRow}>
            <FontAwesome
              name="thumbs-up"
              size={12}
              color={itinerary.stats.thumbsUp > 0 ? COLORS.success : COLORS.textMuted}
            />
            <Text style={styles.ratingText}>{itinerary.stats.thumbsUp}</Text>
            <FontAwesome
              name="thumbs-down"
              size={12}
              color={itinerary.stats.thumbsDown > 0 ? COLORS.error : COLORS.textMuted}
              style={styles.thumbsDownSpacer}
            />
            <Text style={styles.ratingText}>{itinerary.stats.thumbsDown}</Text>
            {itinerary.stats.averageRating !== null && (
              <>
                <Text style={styles.ratingText}>
                  {' '}(Math.round(itinerary.stats.averageRating * 100)}%)
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      {/* Right: Chevron */}
      <FontAwesome name="chevron-right" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  destination: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  duration: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  separator: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  timeAgo: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
  badgeAI: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0',
  },
  badgeRuleBased: {
    backgroundColor: COLORS.textMuted,
    borderColor: COLORS.textMuted,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.primary,
  },
  badgeTextLight: {
    fontSize: 11,
    fontWeight: '500',
    color: 'white',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  thumbsDownSpacer: {
    marginLeft: 8,
  },
});
