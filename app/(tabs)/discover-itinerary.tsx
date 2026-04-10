import { ItineraryRouteMap } from '@/components/travel/ItineraryRouteMap';
import { useItineraryTravelTotals } from '@/hooks/useItineraryTravelTotals';
import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { useSwipeItinerary } from '@/providers/SwipeItineraryProvider';
import {
  personalizedFeedVideoToVideoWithProfile,
  PersonalizedFeedVideo,
  videoWithProfileToPersonalizedFeedVideo,
} from '@/services/personalizedFeed';
import { getUserSwipeLikedVideoIdsOrdered, removeSwipe } from '@/services/swipes';
import { getVideosByIds } from '@/services/videos';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Heart, MapPin, Plane, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';

type SwipeVideoRow = Awaited<ReturnType<typeof getVideosByIds>>[number];
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DiscoverItineraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const {
    itinerary,
    hydrated,
    removeFromItineraryById,
    syncItineraryWithServerVideos,
  } = useSwipeItinerary();
  const [syncing, setSyncing] = useState(false);

  const travelVideos = useMemo(
    () => itinerary.map(personalizedFeedVideoToVideoWithProfile),
    [itinerary],
  );
  const { origin, rows, totalUsd, loading: travelLoading } = useItineraryTravelTotals(travelVideos);

  const quoteByVideoId = useMemo(() => {
    const m = new Map<string, number | undefined>();
    for (const r of rows) {
      m.set(r.video.id, r.quote?.priceUsd);
    }
    return m;
  }, [rows]);

  const pullServerSwipes = useCallback(async () => {
    if (!user?.id || !hydrated) return;
    setSyncing(true);
    try {
      const ids = await getUserSwipeLikedVideoIdsOrdered(user.id);
      if (ids.length === 0) {
        syncItineraryWithServerVideos([]);
        return;
      }
      const fetched = await getVideosByIds(ids, user.id);
      const byId = new Map(fetched.map((v) => [v.id, v]));
      const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as SwipeVideoRow[];
      syncItineraryWithServerVideos(ordered.map(videoWithProfileToPersonalizedFeedVideo));
    } catch (e) {
      console.warn('Swipe itinerary sync failed', e);
    } finally {
      setSyncing(false);
    }
  }, [user?.id, hydrated, syncItineraryWithServerVideos]);

  useFocusEffect(
    useCallback(() => {
      pullServerSwipes();
    }, [pullServerSwipes]),
  );

  const openVideo = (id: string) => {
    router.push({ pathname: '/video-feed/v/[id]', params: { id, returnTo: '/(tabs)/discover-itinerary' } } as any);
  };

  const confirmRemove = (video: PersonalizedFeedVideo) => {
    Alert.alert('Remove from itinerary?', video.title || 'This video will be removed from your saved list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          removeFromItineraryById(video.id);
          if (user?.id) {
            await removeSwipe(user.id, video.id).catch(() => {});
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: PersonalizedFeedVideo }) => {
    const est = quoteByVideoId.get(item.id);
    return (
      <Pressable style={styles.row} onPress={() => openVideo(item.id)} android_ripple={{ color: 'rgba(0,0,0,0.06)' }}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Heart size={24} color={COLORS.textMuted} />
          </View>
        )}
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title || 'Video'}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {item.profiles?.display_name || item.profiles?.username || 'Traveler'}
          </Text>
          {item.location ? (
            <View style={styles.locRow}>
              <MapPin size={12} color={COLORS.accent} />
              <Text style={styles.loc} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          ) : null}
          {est != null && est > 0 ? (
            <View style={styles.flightEstRow}>
              <Plane size={12} color={COLORS.textMuted} />
              <Text style={styles.flightEst}>Est. flight ~${Math.round(est)}</Text>
            </View>
          ) : null}
        </View>
        <Pressable
          style={styles.removeBtn}
          onPress={() => confirmRemove(item)}
          hitSlop={12}
          accessibilityLabel="Remove from itinerary"
        >
          <Trash2 size={20} color={COLORS.error} />
        </Pressable>
      </Pressable>
    );
  };

  const listHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <Text style={styles.subtitle}>Videos you saved with a right swipe on Home</Text>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Saved</Text>
            <Text style={styles.statValue}>{itinerary.length}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Est. flights total</Text>
            <Text style={styles.statValue}>
              {travelLoading ? '…' : totalUsd > 0 ? `~$${Math.round(totalUsd)}` : '—'}
            </Text>
          </View>
        </View>

        {itinerary.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Route overview</Text>
            <ItineraryRouteMap origin={origin} rows={rows} height={200} />
            {syncing ? (
              <View style={styles.syncHint}>
                <ActivityIndicator size="small" color={COLORS.textMuted} />
                <Text style={styles.syncHintText}>Syncing with your account…</Text>
              </View>
            ) : null}
          </>
        ) : null}

        {itinerary.length > 0 ? <Text style={[styles.sectionLabel, styles.listSectionLabel]}>Your picks</Text> : null}
      </View>
    ),
    [itinerary.length, origin, rows, totalUsd, travelLoading, syncing],
  );

  const emptyComponent = useMemo(
    () => (
      <View style={styles.empty}>
        {syncing ? (
          <>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.emptyTitle}>Loading saves…</Text>
            <Text style={styles.emptySub}>Fetching videos you swiped right on from your account.</Text>
          </>
        ) : (
          <>
            <Heart size={40} color={COLORS.accent} />
            <Text style={styles.emptyTitle}>Nothing saved yet</Text>
            <Text style={styles.emptySub}>
              Swipe right on a video in the Home feed to add it here. Your saves sync when you are online.
            </Text>
          </>
        )}
      </View>
    ),
    [syncing],
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <ArrowLeft size={22} color={COLORS.accent} />
        </Pressable>
        <Text style={styles.pageTitle}>Swipe history</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <FlatList
        data={itinerary}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        contentContainerStyle={[
          styles.listContent,
          itinerary.length === 0 && styles.listContentEmpty,
          { paddingBottom: insets.bottom + 28 },
        ]}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        refreshControl={
          <RefreshControl refreshing={syncing} onRefresh={pullServerSwipes} tintColor={COLORS.accent} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarSpacer: {
    width: 40,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  headerBlock: {
    paddingTop: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  statPill: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  listSectionLabel: {
    marginTop: 20,
  },
  syncHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    justifyContent: 'center',
  },
  syncHintText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  listContent: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  listContentEmpty: {
    justifyContent: 'flex-start',
  },
  sep: {
    height: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  thumb: {
    width: 76,
    height: 102,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },
  thumbPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  meta: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  sub: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  loc: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
    flex: 1,
  },
  flightEstRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  flightEst: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  removeBtn: {
    padding: 10,
    alignSelf: 'flex-start',
  },
  empty: {
    paddingVertical: 48,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
});
