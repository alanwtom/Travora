import { SwipeVideoDeck } from '@/components/SwipeVideoDeck';
import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { useSwipeItinerary } from '@/providers/SwipeItineraryProvider';
import { PersonalizedFeedVideo } from '@/services/personalizedFeed';
import { recordSwipe, removeDislikedVideo, removeSwipe, saveDislikedVideo } from '@/services/swipes';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SwipeDiscoverContentProps = {
  videos: PersonalizedFeedVideo[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: () => void;
  hasMore: boolean;
  /** Extra top padding when a floating control (e.g. Feed/Swipe bar) sits above this view */
  topInsetExtra?: number;
  /** Hide large title row for tighter layout under a shared header */
  compactHeader?: boolean;
};

export function SwipeDiscoverContent({
  videos,
  isLoading,
  isRefreshing,
  error,
  loadMore,
  refresh,
  hasMore,
  topInsetExtra = 0,
  compactHeader = false,
}: SwipeDiscoverContentProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { addToItinerary, removeFromItineraryById } = useSwipeItinerary();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAction, setLastAction] = useState<{
    type: 'like' | 'dislike';
    video: PersonalizedFeedVideo;
  } | null>(null);

  useEffect(() => {
    if (currentIndex >= Math.max(0, videos.length - 3) && hasMore && !isLoading && videos.length > 0) {
      loadMore();
    }
  }, [currentIndex, videos.length, hasMore, isLoading, loadMore]);

  const current = videos[currentIndex];
  const next = videos[currentIndex + 1];

  const completeSwipe = useCallback(
    (direction: 'like' | 'dislike', video: PersonalizedFeedVideo) => {
      if (direction === 'like') {
        addToItinerary(video);
        if (user?.id) {
          recordSwipe(user.id, video.id, 'like').catch(() => {});
        }
      } else {
        saveDislikedVideo(video.id).catch(() => {});
        if (user?.id) {
          recordSwipe(user.id, video.id, 'dislike').catch(() => {});
        }
      }
      setLastAction({ type: direction, video });
      setCurrentIndex((i) => i + 1);
    },
    [addToItinerary, user?.id]
  );

  const onSwipeRight = useCallback(() => {
    if (!current) return;
    completeSwipe('like', current);
  }, [completeSwipe, current]);

  const onSwipeLeft = useCallback(() => {
    if (!current) return;
    completeSwipe('dislike', current);
  }, [completeSwipe, current]);

  const handleUndo = useCallback(async () => {
    if (!lastAction || currentIndex === 0) return;
    const { type, video } = lastAction;
    if (type === 'like') {
      removeFromItineraryById(video.id);
    } else {
      await removeDislikedVideo(video.id);
    }
    if (user?.id) {
      await removeSwipe(user.id, video.id);
    }
    setCurrentIndex((i) => Math.max(0, i - 1));
    setLastAction(null);
  }, [lastAction, currentIndex, removeFromItineraryById, user?.id]);

  const openItinerary = () => {
    router.push('/(tabs)/discover-itinerary' as any);
  };

  const topPad = insets.top + topInsetExtra;

  if (error && videos.length === 0) {
    return (
      <View style={[styles.centered, { paddingTop: topPad }]}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorSub}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refresh()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading && videos.length === 0) {
    return (
      <View style={[styles.centered, { paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const exhausted = !current && videos.length > 0;
  const noVideos = videos.length === 0;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={[styles.header, compactHeader && styles.headerCompact]}>
        {!compactHeader ? <Text style={styles.headerTitle}>Swipe</Text> : null}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, !lastAction && styles.headerBtnDisabled]}
            onPress={handleUndo}
            disabled={!lastAction}
            accessibilityLabel="Undo last swipe"
          >
            <Icons.Undo2 size={22} color={lastAction ? COLORS.primary : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtnPrimary}
            onPress={openItinerary}
            accessibilityLabel="Open swipe itinerary"
          >
            <Icons.BookmarkCheck size={22} color={COLORS.accent} />
            <Text style={styles.itineraryLink}>Itinerary</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.hint}>Swipe right to save · Swipe left to pass</Text>

      {noVideos ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No videos yet</Text>
          <Text style={styles.emptySub}>Check back later for new places to explore.</Text>
        </View>
      ) : exhausted ? (
        <ScrollView
          contentContainerStyle={styles.centered}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        >
          <Icons.Sparkles size={48} color={COLORS.accent} />
          <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
          <Text style={styles.emptySub}>Pull to refresh for new inspiration.</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setCurrentIndex(0);
              refresh();
            }}
          >
            <Text style={styles.retryText}>Start over</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={[styles.deckWrap, { paddingBottom: insets.bottom + 12 }]}>
          <SwipeVideoDeck
            key={current!.id}
            current={current!}
            next={next}
            onSwipeLeft={onSwipeLeft}
            onSwipeRight={onSwipeRight}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCompact: {
    justifyContent: 'flex-end',
  },
  headerBtn: {
    padding: 8,
  },
  headerBtnDisabled: {
    opacity: 0.45,
  },
  headerBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  itineraryLink: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textMuted,
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  deckWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
