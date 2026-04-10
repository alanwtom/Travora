import { COLORS } from '@/lib/constants';
import { PersonalizedFeedVideo } from '@/services/personalizedFeed';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { VerticalVideoCard } from './VerticalVideoCard';

type Props = {
  videos: PersonalizedFeedVideo[];
  isLoading: boolean;
  isRefreshing: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  hasMore: boolean;
  initialScrollIndex?: number;
  fullScreen?: boolean;
  onSwipeDecision?: (direction: 'left' | 'right', video: PersonalizedFeedVideo) => void;
};

const { height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 78 : 64;

export function VerticalVideoFeed({
  videos,
  isLoading,
  isRefreshing,
  onLoadMore,
  onRefresh,
  hasMore,
  initialScrollIndex,
  fullScreen,
  onSwipeDecision,
}: Props) {
  const listRef = useRef<FlatList<PersonalizedFeedVideo>>(null);
  const safeInitialIndex = initialScrollIndex != null && initialScrollIndex < videos.length ? initialScrollIndex : 0;
  const [activeVideoId, setActiveVideoId] = useState<string | null>(
    videos[safeInitialIndex]?.id || null
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
    ({ item, index }: { item: PersonalizedFeedVideo; index: number }) => (
      <VerticalVideoCard
        video={item}
        isActive={activeVideoId === item.id}
        fullScreen={fullScreen}
        onSwipeDecision={(direction, swipedVideo) => {
          onSwipeDecision?.(direction, swipedVideo);
          const nextIndex = index + 1;
          if (nextIndex < videos.length) {
            listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
          }
        }}
      />
    ),
    [activeVideoId, onSwipeDecision, videos.length]
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

  const snapInterval = fullScreen ? height : height - TAB_BAR_HEIGHT;
  const itemHeight = snapInterval;

  return (
    <FlatList
      ref={listRef}
      data={videos}
      renderItem={renderVideoItem}
      keyExtractor={(item) => item.id}
      getItemLayout={(_, index) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      })}
      initialScrollIndex={safeInitialIndex > 0 ? safeInitialIndex : undefined}
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
      contentContainerStyle={{ flexGrow: 1 }}
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
