import { getVideosByIds } from '@/services/videos';
import { COLORS } from '@/lib/constants';
import { PersonalizedFeedVideo } from '@/services/personalizedFeed';
import { VerticalVideoFeed } from '@/components/VerticalVideoFeed';
import { useAuth } from '@/providers/AuthProvider';
import * as Icons from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
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

export default function SingleVideoFeedScreen() {
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [videos, setVideos] = useState<PersonalizedFeedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const goBack = () => {
    if (returnTo) {
      router.replace(returnTo as any);
    } else {
      router.back();
    }
  };

  useEffect(() => {
    if (!id) return;
    getVideosByIds([id], user?.id)
      .then((data) => {
        setVideos(data.map(mapToFeedVideo));
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load video');
      })
      .finally(() => setIsLoading(false));
  }, [id, user?.id]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Pressable
          style={[styles.backButton, { top: insets.top + 8 }]}
          onPress={goBack}
        >
          <Icons.X size={24} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Icons.AlertCircle size={48} color={COLORS.error} />
          <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '600', marginTop: 16 }}>{error}</Text>
          <Pressable
            style={{ marginTop: 16, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
            onPress={() => { setError(null); setIsLoading(true); getVideosByIds([id], user?.id).then((data) => setVideos(data.map(mapToFeedVideo))).catch((err) => setError(err?.message || 'Failed to load video')).finally(() => setIsLoading(false)); }}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
        <Pressable
          style={[styles.backButton, { top: insets.top + 8 }]}
          onPress={goBack}
        >
          <Icons.X size={24} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VerticalVideoFeed
        videos={videos}
        isLoading={false}
        isRefreshing={false}
        onLoadMore={() => {}}
        onRefresh={() => {}}
        hasMore={false}
        fullScreen
      />
      <Pressable
        style={[styles.backButton, { top: insets.top + 8 }]}
        onPress={() => router.back()}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
