import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { getItineraryById, getItineraryStats, rateItinerary, deleteItinerary } from '@/services/itineraries';
import { DayPlan } from '@/components/DayPlan';
import { ItineraryRatingModal } from '@/components/ItineraryRatingModal';
import { BackButton } from '@/components/BackButton';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ItineraryDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  const [itinerary, setItinerary] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    loadItinerary();
  }, [id]);

  const loadItinerary = async () => {
    if (!id || typeof id !== 'string') return;

    try {
      setLoading(true);
      const [itineraryData, statsData] = await Promise.all([
        getItineraryById(id),
        getItineraryStats(id),
      ]);
      setItinerary(itineraryData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load itinerary:', error);
      Alert.alert('Error', 'Failed to load itinerary');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (rating: boolean, feedback?: string) => {
    if (!user || !itinerary) return;

    try {
      setSubmittingRating(true);
      await rateItinerary(itinerary.id, user.id, rating, feedback);
      await loadItinerary(); // Reload to update stats
      setRatingModalVisible(false);
      Alert.alert('Success', 'Thanks for your feedback!');
    } catch (error) {
      console.error('Failed to submit rating:', error);
      Alert.alert('Error', 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleDelete = () => {
    if (!itinerary) return;

    Alert.alert('Delete Itinerary', `Are you sure you want to delete "${itinerary.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItinerary(itinerary.id);
            router.replace('/profile/itineraries');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete itinerary');
          }
        },
      },
    ]);
  };

  const handleShare = () => {
    if (!itinerary) return;

    // Simple share implementation
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!itinerary) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-circle" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Itinerary not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const days = Array.isArray(itinerary.days) ? itinerary.days : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Itinerary Details</Text>
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <FontAwesome name="trash" size={18} color={COLORS.error} />
        </Pressable>
      </View>

      {/* Title Card */}
      <View style={styles.titleCard}>
        <View style={styles.titleRow}>
          <Text style={styles.destination} numberOfLines={2}>
            {itinerary.destination}
          </Text>
          <View
            style={[
              styles.methodBadge,
              itinerary.generated_by === 'llm' ? styles.methodBadgeAI : styles.methodBadgeRule,
            ]}
          >
            <FontAwesome
              name={itinerary.generated_by === 'llm' ? 'robot' : 'cogs'}
              size={12}
              color="white"
            />
            <Text style={styles.methodBadgeText}>
              {itinerary.generated_by === 'llm' ? 'AI' : 'Smart Match'}
            </Text>
          </View>
        </View>

        <Text style={styles.titleText} numberOfLines={2}>
          {itinerary.title}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <FontAwesome name="calendar" size={14} color={COLORS.primary} />
            <Text style={styles.metaText}>{itinerary.duration_days} Days</Text>
          </View>

          {itinerary.travel_style && (
            <View style={styles.metaItem}>
              <FontAwesome name="compass" size={14} color={COLORS.primary} />
              <Text style={styles.metaText}>
                {itinerary.travel_style.charAt(0).toUpperCase() + itinerary.travel_style.slice(1)}
              </Text>
            </View>
          )}

          {itinerary.budget_level && (
            <View style={styles.metaItem}>
              <FontAwesome name="wallet" size={14} color={COLORS.primary} />
              <Text style={styles.metaText}>
                {itinerary.budget_level.charAt(0).toUpperCase() + itinerary.budget_level.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        {stats && stats.totalRatings > 0 && (
          <View style={styles.statsRow}>
            <FontAwesome name="thumbs-up" size={14} color={COLORS.success} />
            <Text style={styles.statsText}>{stats.thumbsUp}</Text>
            <FontAwesome name="thumbs-down" size={14} color={COLORS.error} style={styles.statsSpacer} />
            <Text style={styles.statsText}>{stats.thumbsDown}</Text>
            {stats.averageRating !== null && (
              <Text style={styles.statsText}>
                {' '}· {Math.round(stats.averageRating * 100)}% positive
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Days */}
      <View style={styles.daysSection}>
        <Text style={styles.sectionTitle}>Your Itinerary</Text>

        {days.length === 0 ? (
          <View style={styles.emptyDays}>
            <Text style={styles.emptyDaysText}>No days planned</Text>
          </View>
        ) : (
          days.map((day: any, index: number) => <DayPlan key={index} day={day} />)
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rateButton]}
          onPress={() => setRatingModalVisible(true)}
        >
          <FontAwesome name="star" size={16} color="white" />
          <Text style={styles.actionButtonText}>Rate Itinerary</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShare}
        >
          <FontAwesome name="share-alt" size={16} color={COLORS.text} />
          <Text style={[styles.actionButtonText, styles.shareButtonText]}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Rating Modal */}
      <ItineraryRatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={handleRatingSubmit}
        itineraryTitle={itinerary.title}
        isLoading={submittingRating}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  deleteButton: {
    padding: 8,
  },
  titleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  destination: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 8,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  methodBadgeAI: {
    backgroundColor: '#9C27B0',
  },
  methodBadgeRule: {
    backgroundColor: COLORS.textMuted,
  },
  methodBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  titleText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 12,
  },
  statsText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  statsSpacer: {
    marginLeft: 12,
  },
  daysSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyDays: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyDaysText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  rateButton: {
    backgroundColor: COLORS.primary,
  },
  shareButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  shareButtonText: {
    color: COLORS.text,
  },
});
