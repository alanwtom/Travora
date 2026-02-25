import { COLORS } from '@/lib/constants';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  time: string;
  activity: string;
  location: string;
  description?: string;
  duration: string;
};

export function ActivityItem({ time, activity, location, description, duration }: Props) {
  return (
    <View style={styles.container}>
      {/* Time Column */}
      <View style={styles.timeColumn}>
        <Text style={styles.time}>{time}</Text>
        <View style={styles.timeLine} />
      </View>

      {/* Activity Column */}
      <View style={styles.activityColumn}>
        <View style={styles.activityCard}>
          {/* Header */}
          <View style={styles.activityHeader}>
            <Text style={styles.activityName} numberOfLines={2}>
              {activity}
            </Text>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{duration}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <FontAwesome name="map-marker" size={12} color={COLORS.primary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>

          {/* Description */}
          {description && (
            <Text style={styles.description} numberOfLines={3}>
              {description}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeColumn: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  time: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  timeLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.border,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  activityColumn: {
    flex: 1,
    paddingLeft: 4,
  },
  activityCard: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  activityName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 8,
  },
  durationBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
