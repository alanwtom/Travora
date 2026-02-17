import { GridVideoCard } from '@/components/GridVideoCard';
import { useFeedVideos } from '@/hooks/useVideos';
import { COLORS } from '@/lib/constants';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ExploreScreen() {
  const { videos, isLoading, isRefreshing, error, loadMore, refresh, hasMore } = useFeedVideos();

  if (isLoading && videos.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error && videos.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  const renderRow = ({ item: videos }: { item: any[] }) => (
    <View style={styles.row}>
      {videos.map((video, index) => (
        <View key={`${video.id}-${index}`} style={styles.columnWrapper}>
          <GridVideoCard video={video} />
        </View>
      ))}
      {/* Add empty view if odd number to maintain grid */}
      {videos.length === 1 && <View style={styles.columnWrapper} />}
    </View>
  );

  // Group videos into pairs for 2-column layout
  const groupedVideos = [];
  for (let i = 0; i < videos.length; i += 2) {
    groupedVideos.push(videos.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groupedVideos}
        renderItem={renderRow}
        keyExtractor={(item, index) => `row-${index}`}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (hasMore && !isLoading) {
            loadMore();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No videos yet</Text>
            <Text style={styles.emptySubtext}>Check back later for new content</Text>
          </View>
        }
        ListFooterComponent={
          isLoading && videos.length > 0 ? (
            <View style={styles.footer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  columnWrapper: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
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
  footer: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
