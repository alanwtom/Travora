import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { useFeedVideos } from '@/hooks/useVideos';
import { VerticalVideoFeed } from '@/components/VerticalVideoFeed';
import { COLORS } from '@/lib/constants';

export default function HomeScreen() {
  const { videos, isLoading, isRefreshing, error, loadMore, refresh, hasMore } = useFeedVideos();

  return (
    <View style={styles.container}>
      <VerticalVideoFeed
        videos={videos}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onLoadMore={loadMore}
        onRefresh={refresh}
        hasMore={hasMore}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
