import { COLORS } from '@/lib/constants';
import { VideoWithProfile } from '@/types/database';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    View,
    ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VerticalVideoCard } from './VerticalVideoCard';

type Props = {
  videos: VideoWithProfile[];
  isLoading: boolean;
  isRefreshing: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  hasMore: boolean;
};

const { height } = Dimensions.get('window');

export function VerticalVideoFeed({
  videos,
  isLoading,
  isRefreshing,
  onLoadMore,
  onRefresh,
  hasMore,
}: Props) {
  const insets = useSafeAreaInsets();
  const [activeVideoId, setActiveVideoId] = useState<string | null>(
    videos[0]?.id || null
  );
  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        itemVisiblePercentThreshold: 80,
        minimumViewTime: 100,
      },
      onViewableItemsChanged: onViewableItemsChanged,
    },
  ]);

  function onViewableItemsChanged({ changed }: { changed: ViewToken[] }) {
    if (changed.length > 0) {
      const mostVisible = changed[changed.length - 1];
      if (mostVisible.isViewable && mostVisible.item?.id) {
        setActiveVideoId(mostVisible.item.id);
      }
    }
  }

  const renderVideoItem = useCallback(
    ({ item }: { item: VideoWithProfile }) => (
      <VerticalVideoCard
        video={item}
        isActive={activeVideoId === item.id}
      />
    ),
    [activeVideoId]
  );

  if (isLoading && videos.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isLoading && videos.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No videos available</Text>
        <Text style={styles.emptySubtext}>Check back later for new content</Text>
      </View>
    );
  }

  const snapInterval = height - insets.bottom;

  return (
    <FlatList
      data={videos}
      renderItem={renderVideoItem}
      keyExtractor={(item) => item.id}
      pagingEnabled
      snapToInterval={snapInterval}
      decelerationRate="fast"
      scrollEventThrottle={16}
      viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
      onEndReached={() => {
        if (hasMore && !isLoading) {
          onLoadMore();
        }
      }}
      onEndReachedThreshold={0.5}
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 0 }}
      ListFooterComponent={
        isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  loader: {
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
