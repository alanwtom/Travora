import { COLORS } from '@/lib/constants';
import { PersonalizedFeedVideo } from '@/services/personalizedFeed';
import { Video } from 'expo-av';
import * as Icons from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

type Props = {
  video: PersonalizedFeedVideo;
  isActive: boolean;
  dimmed?: boolean;
};

export function SwipeDeckVideoCard({ video, isActive, dimmed = false }: Props) {
  const videoRef = useRef<Video>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(isActive);

  useEffect(() => {
    const ref = videoRef.current;
    if (!ref) return;

    if (isActive) {
      ref.playAsync().catch(() => {});
      setIsPlaying(true);
    } else {
      ref.pauseAsync().catch(() => {});
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = async () => {
    const ref = videoRef.current;
    if (!ref) return;
    try {
      if (isPlaying) {
        await ref.pauseAsync();
        setIsPlaying(false);
      } else {
        await ref.playAsync();
        setIsPlaying(true);
      }
    } catch {
      /* ignore */
    }
  };

  const toggleMute = async () => {
    const ref = videoRef.current;
    if (!ref) return;
    try {
      await ref.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* RN TouchableOpacity + expo-av Video steal horizontal pans from the deck GestureDetector.
          Use a plain View and pointerEvents so swipes reach the parent pan handler. */}
      <View style={styles.videoTouch} collapsable={false}>
        {video.video_url ? (
          <>
            <Video
              ref={videoRef}
              source={{ uri: video.video_url }}
              style={styles.video}
              isLooping
              isMuted={isMuted}
              pointerEvents="none"
              onLoadStart={() => setIsLoading(true)}
              onLoad={() => setIsLoading(false)}
            />
            {isLoading && (
              <View style={styles.loading} pointerEvents="none">
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}
            {!isPlaying && !isLoading && isActive && (
              <View style={styles.pauseHint} pointerEvents="none">
                <Icons.Play size={56} color="rgba(255,255,255,0.9)" fill="rgba(255,255,255,0.15)" />
              </View>
            )}
          </>
        ) : (
          <View style={[styles.video, styles.placeholder]} pointerEvents="none">
            <Icons.Film size={48} color={COLORS.textMuted} />
          </View>
        )}
      </View>

      {dimmed && <View style={styles.dim} pointerEvents="none" />}

      <View style={styles.footer} pointerEvents="box-none">
        <View style={styles.footerRow}>
          {video.profiles?.avatar_url ? (
            <Image source={{ uri: video.profiles.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPh]}>
              <Icons.User size={16} color={COLORS.textMuted} />
            </View>
          )}
          <View style={styles.meta}>
            <Text style={styles.name} numberOfLines={1}>
              {video.profiles?.display_name || video.profiles?.username || 'Traveler'}
            </Text>
            {video.title ? (
              <Text style={styles.title} numberOfLines={2}>
                {video.title}
              </Text>
            ) : null}
            {video.location ? (
              <View style={styles.locRow}>
                <Icons.MapPin size={12} color="#FF3B30" />
                <Text style={styles.loc} numberOfLines={1}>
                  {video.location}
                </Text>
              </View>
            ) : null}
            {!!(video.tags && video.tags.length) && (
              <View style={styles.tagsRow}>
                {video.tags.slice(0, 3).map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
                {video.tags.length > 3 && (
                  <Text style={styles.tagMore}>+{video.tags.length - 3}</Text>
                )}
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.footerIconBtn} onPress={togglePlay}>
            {isPlaying ? (
              <Icons.Pause size={20} color="#fff" />
            ) : (
              <Icons.Play size={20} color="#fff" />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.muteBtn} onPress={toggleMute}>
            {isMuted ? (
              <Icons.VolumeX size={20} color="#fff" />
            ) : (
              <Icons.Volume2 size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  videoTouch: {
    flex: 1,
  },
  video: {
    flex: 1,
    width: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  pauseHint: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarPh: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    lineHeight: 18,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  loc: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  footerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tagChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.7)',
  },
  tagText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
  },
  tagMore: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
});
