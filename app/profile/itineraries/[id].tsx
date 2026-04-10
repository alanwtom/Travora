import { BackButton } from '@/components/BackButton';
import { CollaboratorsModal } from '@/components/CollaboratorsModal';
import { DayPlan } from '@/components/DayPlan';
import { ItineraryRatingModal } from '@/components/ItineraryRatingModal';
import { useItineraryTravelTotals } from '@/hooks/useItineraryTravelTotals';
import { ShareModal } from '@/components/ShareModal';
import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { canEditItinerary } from '@/services/collaborators';
import {
  asFlightData,
  asHotelOption,
  deleteFlightPin,
  deleteHotelPin,
  listFlightPinsForItinerary,
  listHotelPinsForItinerary,
  type ItineraryFlightPinRow,
  type ItineraryHotelPinRow,
} from '@/services/itineraryTravelPins';
import { deleteItinerary, getItineraryById, getItineraryStats, rateItinerary } from '@/services/itineraries';
import { getProfile } from '@/services/profiles';
import { getVideosByIds } from '@/services/videos';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertCircle,
  Bot,
  Building2,
  Calendar,
  Compass,
  Plane,
  Settings,
  Share2,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Wallet,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ItineraryDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [itinerary, setItinerary] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [collaboratorsModalVisible, setCollaboratorsModalVisible] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | undefined>(undefined);
  const [videos, setVideos] = useState<any[]>([]);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [flightPins, setFlightPins] = useState<ItineraryFlightPinRow[]>([]);
  const [hotelPins, setHotelPins] = useState<ItineraryHotelPinRow[]>([]);
  const [canEditPins, setCanEditPins] = useState(false);

  const { totalUsd, loading: travelLoading } = useItineraryTravelTotals(videos);

  useEffect(() => {
    loadItinerary();
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      if (!id || typeof id !== 'string') return;
      let cancelled = false;
      (async () => {
        try {
          const [f, h] = await Promise.all([
            listFlightPinsForItinerary(id),
            listHotelPinsForItinerary(id),
          ]);
          if (!cancelled) {
            setFlightPins(f);
            setHotelPins(h);
          }
        } catch {
          // Table may not exist until migration is applied
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [id])
  );

  // Load current user's profile for notifications
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.id) {
        try {
          const profile = await getProfile(user.id);
          setCurrentUsername(profile?.username);
        } catch (error) {
          console.error('Failed to load user profile:', error);
        }
      }
    };
    loadUserProfile();
  }, [user?.id]);

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

      try {
        const [fp, hp] = await Promise.all([
          listFlightPinsForItinerary(id),
          listHotelPinsForItinerary(id),
        ]);
        setFlightPins(fp);
        setHotelPins(hp);
      } catch {
        setFlightPins([]);
        setHotelPins([]);
      }

      if (user?.id) {
        setCanEditPins(await canEditItinerary(id, user.id));
      } else {
        setCanEditPins(false);
      }

      // Load videos for travel totals
      if (itineraryData?.metadata?.source_video_ids) {
        const videoIds = itineraryData.metadata.source_video_ids;
        const videosData = await getVideosByIds(videoIds, user?.id);
        setVideos(videosData);
      }
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
    setShareModalVisible(true);
  };

  const openAddFlights = () => {
    if (!itinerary) return;
    router.push({
      pathname: '/profile/flights',
      params: { itineraryId: itinerary.id, itineraryTitle: itinerary.title },
    } as any);
  };

  const openAddHotels = () => {
    if (!itinerary) return;
    router.push({
      pathname: '/profile/hotels',
      params: { itineraryId: itinerary.id, itineraryTitle: itinerary.title },
    } as any);
  };

  const confirmRemoveFlightPin = (pinId: string) => {
    Alert.alert('Remove this flight option?', 'It will only be removed from this trip.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFlightPin(pinId, itinerary.id);
            setFlightPins((prev) => prev.filter((p) => p.id !== pinId));
          } catch {
            Alert.alert('Error', 'Could not remove this flight.');
          }
        },
      },
    ]);
  };

  const confirmRemoveHotelPin = (pinId: string) => {
    Alert.alert('Remove this hotel option?', 'It will only be removed from this trip.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHotelPin(pinId, itinerary.id);
            setHotelPins((prev) => prev.filter((p) => p.id !== pinId));
          } catch {
            Alert.alert('Error', 'Could not remove this hotel.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!itinerary) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <AlertCircle size={48} color={COLORS.error} strokeWidth={2} />
        <Text style={styles.errorText}>Itinerary not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const days = Array.isArray(itinerary.days) ? itinerary.days : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Itinerary Details</Text>
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Trash2 size={18} color={COLORS.error} strokeWidth={2.5} />
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
            {itinerary.generated_by === 'llm' ? (
              <Bot size={12} color="white" strokeWidth={2.5} />
            ) : (
              <Settings size={12} color="white" strokeWidth={2.5} />
            )}
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
            <Calendar size={14} color={COLORS.primary} strokeWidth={2.5} />
            <Text style={styles.metaText}>{itinerary.duration_days} Days</Text>
          </View>

          {itinerary.travel_style && (
            <View style={styles.metaItem}>
              <Compass size={14} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.metaText}>
                {itinerary.travel_style.charAt(0).toUpperCase() + itinerary.travel_style.slice(1)}
              </Text>
            </View>
          )}

          {itinerary.budget_level && (
            <View style={styles.metaItem}>
              <Wallet size={14} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.metaText}>
                {itinerary.budget_level.charAt(0).toUpperCase() + itinerary.budget_level.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {totalUsd > 0 && (
          <View style={styles.metaItem}>
            <Wallet size={14} color={COLORS.primary} strokeWidth={2.5} />
            <Text style={styles.metaText}>Est. ${totalUsd} round-trip</Text>
          </View>
        )}

        {/* Stats */}
        {stats && stats.totalRatings > 0 && (
          <View style={styles.statsRow}>
            <ThumbsUp size={14} color={COLORS.success} strokeWidth={2.5} fill={COLORS.success} />
            <Text style={styles.statsText}>{stats.thumbsUp}</Text>
            <ThumbsDown size={14} color={COLORS.error} strokeWidth={2.5} style={styles.statsSpacer} fill={COLORS.error} />
            <Text style={styles.statsText}>{stats.thumbsDown}</Text>
            {stats.averageRating !== null && (
              <Text style={styles.statsText}>
                {' '}· {Math.round(stats.averageRating * 100)}% positive
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.pinsSection}>
        <Text style={styles.sectionTitle}>Saved flights & hotels</Text>
        <Text style={styles.pinsHint}>
          Add options from flight and hotel search; each pin keeps the exact details you saw when you searched.
        </Text>

        {canEditPins && (
          <View style={styles.pinsActions}>
            <TouchableOpacity style={styles.pinsAddBtn} onPress={openAddFlights}>
              <Plane size={18} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.pinsAddBtnText}>Add flights</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pinsAddBtn} onPress={openAddHotels}>
              <Building2 size={18} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.pinsAddBtnText}>Add hotels</Text>
            </TouchableOpacity>
          </View>
        )}

        {flightPins.length === 0 && hotelPins.length === 0 ? (
          <Text style={styles.pinsEmpty}>
            {canEditPins
              ? 'No saved options yet. Tap Add flights or Add hotels.'
              : 'No saved flight or hotel options yet.'}
          </Text>
        ) : null}

        {flightPins.map((pin) => {
          const f = asFlightData(pin.flight);
          const ctx = pin.search_context as { origin?: string; destination?: string; date?: string } | null;
          return (
            <View key={pin.id} style={styles.pinCard}>
              {canEditPins && (
                <Pressable
                  style={styles.pinRemove}
                  onPress={() => confirmRemoveFlightPin(pin.id)}
                  hitSlop={8}
                  accessibilityLabel="Remove flight option"
                >
                  <X size={18} color={COLORS.textMuted} strokeWidth={2.5} />
                </Pressable>
              )}
              <View style={styles.pinCardHeader}>
                <Plane size={16} color={COLORS.primary} strokeWidth={2.5} />
                <Text style={styles.pinCardLabel}>Flight option</Text>
              </View>
              <Text style={styles.pinTitle}>{f.airline}</Text>
              <Text style={styles.pinMeta}>{f.flight_number}</Text>
              <Text style={styles.pinMeta}>
                {(ctx?.origin ?? '—') + ' → ' + (ctx?.destination ?? '—')}
                {ctx?.date ? ` · ${ctx.date}` : ''}
              </Text>
              <Text style={styles.pinMeta}>
                Departs:{' '}
                {f.display_depart_label ??
                  (Number.isFinite(Date.parse(f.departure_time))
                    ? new Date(f.departure_time).toLocaleString()
                    : f.departure_time)}
              </Text>
              <Text style={styles.pinMeta}>
                Arrives:{' '}
                {f.display_arrive_label ??
                  (Number.isFinite(Date.parse(f.arrival_time))
                    ? new Date(f.arrival_time).toLocaleString()
                    : f.arrival_time)}
              </Text>
              <Text style={styles.pinPrice}>
                ${f.estimated_price} {f.currency}
              </Text>
            </View>
          );
        })}

        {hotelPins.map((pin) => {
          const h = asHotelOption(pin.hotel);
          const ctx = pin.search_context as {
            query?: string;
            checkIn?: string;
            checkOut?: string;
            adults?: number;
            rooms?: number;
          } | null;
          return (
            <View key={pin.id} style={styles.pinCard}>
              {canEditPins && (
                <Pressable
                  style={styles.pinRemove}
                  onPress={() => confirmRemoveHotelPin(pin.id)}
                  hitSlop={8}
                  accessibilityLabel="Remove hotel option"
                >
                  <X size={18} color={COLORS.textMuted} strokeWidth={2.5} />
                </Pressable>
              )}
              <View style={styles.pinCardHeader}>
                <Building2 size={16} color={COLORS.primary} strokeWidth={2.5} />
                <Text style={styles.pinCardLabel}>Hotel option</Text>
              </View>
              {h.thumbnail ? (
                <Image source={{ uri: h.thumbnail }} style={styles.pinHotelThumb} />
              ) : null}
              <Text style={styles.pinTitle}>{h.name}</Text>
              <Text style={styles.pinMeta}>{h.destination}</Text>
              {ctx?.checkIn && ctx?.checkOut ? (
                <Text style={styles.pinMeta}>
                  {ctx.checkIn} → {ctx.checkOut}
                  {ctx.adults != null ? ` · ${ctx.adults} guest${ctx.adults === 1 ? '' : 's'}` : ''}
                  {ctx.rooms != null ? ` · ${ctx.rooms} room${ctx.rooms === 1 ? '' : 's'}` : ''}
                </Text>
              ) : null}
              <Text style={styles.pinPrice}>${h.pricePerNight}/night</Text>
              {h.description ? <Text style={styles.pinDescription}>{h.description}</Text> : null}
            </View>
          );
        })}
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
          <Star size={16} color="white" strokeWidth={2.5} fill="white" />
          <Text style={styles.actionButtonText}>Rate Itinerary</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShare}
        >
          <Share2 size={16} color={COLORS.text} strokeWidth={2.5} />
          <Text style={[styles.actionButtonText, styles.shareButtonText]}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Share Modal */}
      <ShareModal
        visible={shareModalVisible}
        contentType="itinerary"
        contentId={itinerary.id}
        contentTitle={itinerary.title}
        onClose={() => setShareModalVisible(false)}
      />

      {/* Rating Modal */}
      <ItineraryRatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={handleRatingSubmit}
        itineraryTitle={itinerary.title}
        isLoading={submittingRating}
      />

      {/* Collaborators Modal */}
      <CollaboratorsModal
        visible={collaboratorsModalVisible}
        itineraryId={itinerary.id}
        itineraryTitle={itinerary.title}
        isOwner={user?.id === itinerary.user_id}
        currentUserId={user?.id}
        currentUsername={currentUsername}
        onClose={() => setCollaboratorsModalVisible(false)}
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
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
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
    color: COLORS.textMuted,
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
  pinsSection: {
    marginBottom: 24,
  },
  pinsHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  pinsActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  pinsAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  pinsAddBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  pinsEmpty: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  pinCard: {
    position: 'relative',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pinRemove: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 4,
  },
  pinCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  pinCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pinTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  pinMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  pinPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 8,
  },
  pinDescription: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 8,
    lineHeight: 18,
  },
  pinHotelThumb: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    marginBottom: 10,
  },
});
