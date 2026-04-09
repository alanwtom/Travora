import { useUserVideos } from '@/hooks/useVideos';
import { COLORS } from '@/lib/constants';
import { PersonalizedFeedVideo } from '@/services/personalizedFeed';
import { VerticalVideoFeed } from '@/components/VerticalVideoFeed';
import * as Icons from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function mapToFeedVideo(v: any): PersonalizedFeedVideo {
  return {
    id: v.id,
    user_id: v.user_id,
    title: v.title,
    description: v.description ?? null,
    caption: v.caption ?? null,
    video_url: v.video_url,
    thumbnail_url: v.thumbnail_url ?? null,
    location: v.location ?? null,
    latitude: v.latitude ?? null,
    longitude: v.longitude ?? null,
    view_count: v.view_count ?? 0,
    created_at: v.created_at,
    updated_at: v.updated_at,
    media_type: 'video',
    tags: [],
    score: 0,
    like_count: v.like_count ?? 0,
    comment_count: v.comment_count ?? 0,
    is_liked: v.is_liked ?? false,
    is_saved: v.is_saved ?? false,
    profiles: v.profiles ?? { username: null, display_name: null, avatar_url: null },
  };
}

export default function UserVideoFeedScreen() {
  const { userId, startIndex, returnTo } = useLocalSearchParams<{ userId: string; startIndex?: string; returnTo?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const initialIndex = parseInt(startIndex ?? '0', 10) || 0;

  const goBack = () => {
    if (returnTo) {
      router.replace(returnTo as any);
    } else {
      router.back();
    }
  };

  const { videos, isLoading, refetch } = useUserVideos(userId ?? '');

  const feedVideos = useMemo(() => videos.map(mapToFeedVideo), [videos]);

  return (
    <View style={styles.container}>
      <VerticalVideoFeed
        videos={feedVideos}
        isLoading={isLoading}
        isRefreshing={false}
        onLoadMore={() => {}}
        onRefresh={refetch}
        hasMore={false}
        initialScrollIndex={initialIndex}
        fullScreen
      />

      <Pressable
        style={[styles.backButton, { top: insets.top + 8 }]}
        onPress={goBack}
      >
        <Icons.X size={24} color="#FFFFFF" strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
