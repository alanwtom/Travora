import { VerticalVideoFeed } from '@/components/VerticalVideoFeed';
import { useFeedVideos } from '@/hooks/useVideos';
import { COLORS } from '@/lib/constants';
import React from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';

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
