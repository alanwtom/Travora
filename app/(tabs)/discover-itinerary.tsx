import { COLORS } from '@/lib/constants';
import { useSwipeItinerary } from '@/providers/SwipeItineraryProvider';
import { PersonalizedFeedVideo } from '@/services/personalizedFeed';
import { useRouter } from 'expo-router';
import { Heart, Trash2 } from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DiscoverItineraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { itinerary, removeFromItineraryById } = useSwipeItinerary();

  const openVideo = (id: string) => {
    router.push({ pathname: '/video/[id]', params: { id } } as any);
  };

  const confirmRemove = (video: PersonalizedFeedVideo) => {
    Alert.alert('Remove from itinerary?', video.title || 'This video will be removed from your saved list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeFromItineraryById(video.id),
      },
    ]);
  };

  const renderItem = ({ item }: { item: PersonalizedFeedVideo }) => (
    <TouchableOpacity style={styles.row} onPress={() => openVideo(item.id)} activeOpacity={0.85}>
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
          <Text style={styles.loc} numberOfLines={1}>
            {item.location}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => confirmRemove(item)}
        hitSlop={12}
      >
        <Trash2 size={20} color={COLORS.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Swipe itinerary</Text>
        <View style={styles.backPlaceholder} />
      </View>
      <Text style={styles.subtitle}>Videos you saved with a right swipe</Text>

      {itinerary.length === 0 ? (
        <View style={styles.empty}>
          <Heart size={40} color={COLORS.accent} />
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.emptySub}>Swipe right on Discover to add spots to your itinerary.</Text>
        </View>
      ) : (
        <FlatList
          data={itinerary}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  back: {
    minWidth: 72,
  },
  backText: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600',
  },
  backPlaceholder: {
    minWidth: 72,
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  list: {
    paddingHorizontal: 16,
  },
  sep: {
    height: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumb: {
    width: 72,
    height: 96,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  thumbPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  meta: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  sub: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  loc: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
    marginTop: 2,
  },
  removeBtn: {
    padding: 8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
    marginTop: 8,
    lineHeight: 20,
  },
});
