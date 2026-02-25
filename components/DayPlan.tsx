import { COLORS } from '@/lib/constants';
import type { ItineraryDay } from '@/types/database';
import { ActivityItem } from './ActivityItem';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  day: ItineraryDay;
};

export function DayPlan({ day }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = () => setIsExpanded((prev) => !prev);

  const activities = day.activities || [
    day.morning,
    day.afternoon,
    day.evening,
  ].filter(Boolean);

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.dayNumberContainer}>
            <Text style={styles.dayNumber}>{day.day}</Text>
          </View>
          <Text style={styles.dayLabel}>Day {day.day}</Text>
          {day.date && <Text style={styles.dateText}> · {formatDate(day.date)}</Text>}
        </View>

        <FontAwesome
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={COLORS.textMuted}
        />
      </TouchableOpacity>

      {/* Activities */}
      {isExpanded && (
        <View style={styles.activitiesContainer}>
          {activities.map((activity, index) => {
            if (!activity) return null;

            return (
              <ActivityItem
                key={`${day.day}-${index}`}
                time={activity.time}
                activity={activity.activity}
                location={activity.location}
                description={activity.description}
                duration={activity.duration}
              />
            );
          })}

          {activities.length === 0 && (
            <View style={styles.noActivities}>
              <Text style={styles.noActivitiesText}>No activities planned</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: COLORS.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dayNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  activitiesContainer: {
    padding: 14,
    paddingTop: 8,
  },
  noActivities: {
    padding: 20,
    alignItems: 'center',
  },
  noActivitiesText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});
