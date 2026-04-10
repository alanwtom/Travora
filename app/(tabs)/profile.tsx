import { useLikedVideos } from '@/hooks/useLikedVideos';
import { useProfile } from '@/hooks/useProfile';
import { useSavedVideos } from '@/hooks/useSavedVideos';
import { useUserVideos } from '@/hooks/useVideos';
import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { signOut } from '@/services/auth';
import { getFollowerCount, getFollowingCount } from '@/services/profiles';
import { deleteVideo } from '@/services/videos';
import { deleteVideoFiles } from '@/services/storage';
import * as Icons from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type TabType = 'videos' | 'saved' | 'liked';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { videos, isLoading: videosLoading, refetch: refetchUserVideos } = useUserVideos(user?.id ?? '');
  const { videos: savedVideos, isLoading: savedLoading } = useSavedVideos(user?.id ?? '');
  const { videos: likedVideos, isLoading: likedLoading } = useLikedVideos(user?.id ?? '');
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('videos');
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user?.id) {
      getFollowerCount(user.id).then(setFollowers).catch(() => {});
      getFollowingCount(user.id).then(setFollowing).catch(() => {});
    }
  }, [user?.id]);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const getVideoFileNameBase = (videoUrl?: string | null): string | null => {
    if (!videoUrl) return null;
    const noQuery = videoUrl.split('?')[0];
    const encodedFile = noQuery.split('/').pop();
    if (!encodedFile) return null;
    const file = decodeURIComponent(encodedFile);
    const dotIndex = file.lastIndexOf('.');
    if (dotIndex <= 0) return null;
    return file.slice(0, dotIndex);
  };

  const confirmDeleteVideo = (item: any) => {
    if (!user?.id || item?.user_id !== user.id) return;
    Alert.alert(
      'Delete video?',
      'This will permanently remove your video and thumbnail.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingVideoId(item.id);
              const fileNameBase = getVideoFileNameBase(item.video_url);
              if (fileNameBase) {
                await deleteVideoFiles(user.id, fileNameBase);
              }
              await deleteVideo(item.id);
              await refetchUserVideos();
            } catch (error: any) {
              Alert.alert('Delete failed', error?.message || 'Unable to delete video.');
            } finally {
              setDeletingVideoId(null);
            }
          },
        },
      ]
    );
  };

  const displayedVideos =
    activeTab === 'videos' ? videos : activeTab === 'saved' ? savedVideos : likedVideos;
  const isLoading =
    activeTab === 'videos' ? videosLoading : activeTab === 'saved' ? savedLoading : likedLoading;

  if (profileLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={displayedVideos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <View style={styles.videoThumbnail}>
            <TouchableOpacity
              style={styles.thumbnailTouchable}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/video-feed/[tab]',
                  params: {
                    tab: activeTab,
                    startIndex: displayedVideos.findIndex((v) => v.id === item.id),
                    returnTo: '/(tabs)/profile',
                  },
                } as any)
              }
            >
              <VideoThumbnail videoUrl={item.video_url} thumbnailUrl={item.thumbnail_url} />
            </TouchableOpacity>
            {activeTab === 'videos' ? (
              <Pressable
                style={styles.deleteBadge}
                onPress={() => confirmDeleteVideo(item)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Delete video"
              >
                {deletingVideoId === item.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icons.Trash2 size={12} color="#fff" strokeWidth={2.5} />
                )}
              </Pressable>
            ) : null}
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Icons.User size={32} color={COLORS.textMuted} strokeWidth={2} />
                </View>
              )}
            </View>

            {/* Name */}
            <Text style={styles.displayName}>
              {profile?.display_name || 'Traveler'}
            </Text>
            {profile?.username && (
              <Text style={styles.username}>@{profile.username}</Text>
            )}

            {/* Bio */}
            {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

            {/* Location */}
            {profile?.location && (
              <View style={styles.locationRow}>
                <Icons.MapPin size={14} color={COLORS.textMuted} strokeWidth={2.5} />
                <Text style={styles.locationText}>{profile.location}</Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{videos.length}</Text>
                <Text style={styles.statLabel}>Videos</Text>
              </View>
              <TouchableOpacity
                style={styles.stat}
                onPress={() => user?.id && router.push({ pathname: '/user/[userId]/followers', params: { userId: user.id } } as any)}
              >
                <Text style={[styles.statValue, styles.statLink]}>{followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stat}
                onPress={() => user?.id && router.push({ pathname: '/user/[userId]/following', params: { userId: user.id } } as any)}
              >
                <Text style={[styles.statValue, styles.statLink]}>{following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>

            {/* Itineraries Button */}
            <TouchableOpacity
              style={styles.itinerariesButton}
              onPress={() => router.push('/profile/itineraries' as any)}
            >
              <Icons.MapPin size={20} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.itinerariesButtonText}>My Itineraries</Text>
              <Icons.ChevronRight size={16} color={COLORS.textMuted} strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Notifications (icon) + Swipe history */}
            <View style={styles.shortcutsRow}>
              <TouchableOpacity
                style={styles.notificationIconButton}
                onPress={() => router.push('/settings/notifications' as any)}
                accessibilityLabel="Notification settings"
                accessibilityRole="button"
              >
                <Icons.Bell size={22} color={COLORS.primary} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.swipeHistoryButton}
                onPress={() => router.push('/(tabs)/discover-itinerary' as any)}
              >
                <Icons.BookmarkCheck size={20} color={COLORS.primary} strokeWidth={2} />
                <Text style={styles.itinerariesButtonText}>Swipe history</Text>
                <Icons.ChevronRight size={16} color={COLORS.textMuted} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push('/profile/edit' as any)}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.devButton}
                onPress={() => router.push('/(tabs)/../dev' as any)}
              >
                <Icons.TestTube2 size={18} color={COLORS.primary} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Icons.LogOut size={18} color={COLORS.error} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'videos' && styles.tabActive]}
                onPress={() => setActiveTab('videos')}
              >
                <Icons.Play
                  size={16}
                  color={activeTab === 'videos' ? COLORS.primary : COLORS.textMuted}
                  fill={activeTab === 'videos' ? COLORS.primary : 'none'}
                  strokeWidth={activeTab === 'videos' ? 0 : 2}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'videos' && styles.tabLabelActive,
                  ]}
                >
                  Videos ({videos.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
                onPress={() => setActiveTab('saved')}
              >
                <Icons.Bookmark
                  size={16}
                  color={activeTab === 'saved' ? COLORS.primary : COLORS.textMuted}
                  fill={activeTab === 'saved' ? COLORS.primary : 'none'}
                  strokeWidth={activeTab === 'saved' ? 0 : 2}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'saved' && styles.tabLabelActive,
                  ]}
                >
                  Saved ({savedVideos.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'liked' && styles.tabActive]}
                onPress={() => setActiveTab('liked')}
              >
                <Icons.Heart
                  size={16}
                  color={activeTab === 'liked' ? COLORS.primary : COLORS.textMuted}
                  fill={activeTab === 'liked' ? COLORS.primary : 'none'}
                  strokeWidth={activeTab === 'liked' ? 0 : 2}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'liked' && styles.tabLabelActive,
                  ]}
                >
                  Liked ({likedVideos.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyVideos}>
              {activeTab === 'videos' ? (
                <Icons.Video size={32} color={COLORS.border} strokeWidth={2} />
              ) : activeTab === 'saved' ? (
                <Icons.Bookmark size={32} color={COLORS.border} strokeWidth={2} />
              ) : (
                <Icons.Heart size={32} color={COLORS.border} strokeWidth={2} />
              )}
              <Text style={styles.emptyText}>
                {activeTab === 'videos'
                  ? 'No videos yet'
                  : activeTab === 'saved'
                  ? 'No saved videos yet'
                  : 'No liked videos yet'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function VideoThumbnail({ videoUrl, thumbnailUrl }: { videoUrl: string; thumbnailUrl: string | null }) {
  const [uri, setUri] = useState<string | null>(thumbnailUrl);

  useEffect(() => {
    if (uri || !videoUrl) return;
    let cancelled = false;
    VideoThumbnails.getThumbnailAsync(videoUrl, { time: 1000 })
      .then(({ uri: generated }) => {
        if (!cancelled) setUri(generated);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [videoUrl]);

  if (uri) {
    return <Image source={{ uri }} style={styles.thumbnailImage} />;
  }
  return (
    <View style={[styles.thumbnailImage, styles.thumbnailPlaceholder]}>
      <Icons.Play size={20} color={COLORS.textMuted} fill="rgba(0,0,0,0.1)" strokeWidth={2} />
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
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  username: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 32,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLink: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  itinerariesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
    marginHorizontal: 16,
  },
  itinerariesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginLeft: 12,
  },
  shortcutsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginTop: 16,
    marginHorizontal: 16,
  },
  notificationIconButton: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
  },
  swipeHistoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
    width: '100%',
    paddingHorizontal: 16,
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  devButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    alignSelf: 'flex-start',
    marginTop: 24,
    marginBottom: 8,
  },
  videoThumbnail: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 1,
  },
  thumbnailTouchable: {
    flex: 1,
  },
  thumbnailImage: {
    flex: 1,
    borderRadius: 4,
  },
  thumbnailPlaceholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  emptyVideos: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
});
