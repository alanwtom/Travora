import type { ItineraryWithStats } from '@/hooks/useUserItineraries';
import { COLORS } from '@/lib/constants';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
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
        pathname: '/profile/itineraries/[id]',
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

  const getTravelStyleIcon = (style?: string | null): React.ComponentType<{ size: number; color: string; strokeWidth?: number }> => {
    switch (style?.toLowerCase()) {
      case 'adventure':
        return Icons.Mountain;
      case 'relaxation':
        return Icons.Umbrella;
      case 'cultural':
        return Icons.Landmark;
      case 'foodie':
        return Icons.Utensils;
      default:
        return Icons.Compass;
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
              <Icons.Trash2 size={14} color={COLORS.error} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Subtitle row */}
        <View style={styles.subtitleRow}>
          <Text style={styles.duration}>{itinerary.duration_days} Days</Text>
          <Text style={styles.separator}>·</Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>

        {/* Flight price row */}
        {itinerary.estimated_flight_price && (
          <View style={styles.flightPriceRow}>
            <Icons.Plane size={12} color={COLORS.primary} strokeWidth={2} />
            <Text style={styles.flightPriceText}>
              Estimated Flight: ${itinerary.estimated_flight_price}
            </Text>
            <Text style={styles.flightPriceLabel}> (based on live data)</Text>
          </View>
        )}

        {/* Badges row */}
        <View style={styles.badgesRow}>
          {/* Travel style badge */}
          {itinerary.travel_style && (
            <View style={styles.badge}>
              {React.createElement(getTravelStyleIcon(itinerary.travel_style), {
                size: 10,
                color: COLORS.primary,
                strokeWidth: 2.5,
              })}
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
              <Icons.Wallet size={10} color={getBudgetColor(itinerary.budget_level)} strokeWidth={2} />
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
            {itinerary.generated_by === 'llm' ? (
              <Icons.Bot size={10} color="white" strokeWidth={2} />
            ) : (
              <Icons.Settings size={10} color="white" strokeWidth={2} />
            )}
            <Text style={styles.badgeTextLight}>
              {itinerary.generated_by === 'llm' ? 'AI' : 'Smart Match'}
            </Text>
          </View>
        </View>

        {/* Rating row */}
        {itinerary.stats && itinerary.stats.totalRatings > 0 && (
          <View style={styles.ratingRow}>
            <Icons.ThumbsUp
              size={12}
              color={itinerary.stats.thumbsUp > 0 ? COLORS.success : COLORS.textMuted}
              strokeWidth={2}
              fill={itinerary.stats.thumbsUp > 0 ? COLORS.success : 'none'}
            />
            <Text style={styles.ratingText}>{itinerary.stats.thumbsUp}</Text>
            <Icons.ThumbsDown
              size={12}
              color={itinerary.stats.thumbsDown > 0 ? COLORS.error : COLORS.textMuted}
              strokeWidth={2}
              style={styles.thumbsDownSpacer}
              fill={itinerary.stats.thumbsDown > 0 ? COLORS.error : 'none'}
            />
            <Text style={styles.ratingText}>{itinerary.stats.thumbsDown}</Text>
            {itinerary.stats.averageRating !== null && (
              <Text style={styles.ratingText}>
                {' · '}{Math.round(itinerary.stats.averageRating * 100)}%)
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Right: Chevron */}
      <Icons.ChevronRight size={16} color={COLORS.textMuted} strokeWidth={2.5} />
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
  flightPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  flightPriceText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  flightPriceLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
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
