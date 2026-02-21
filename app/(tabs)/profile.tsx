import { useLikedVideos } from '@/hooks/useLikedVideos';
import { useProfile } from '@/hooks/useProfile';
import { useSavedVideos } from '@/hooks/useSavedVideos';
import { useUserVideos } from '@/hooks/useVideos';
import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { signOut } from '@/services/auth';
import { getFollowerCount, getFollowingCount } from '@/services/profiles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type TabType = 'videos' | 'saved' | 'liked';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { videos, isLoading: videosLoading } = useUserVideos(user?.id ?? '');
  const { videos: savedVideos, isLoading: savedLoading } = useSavedVideos(user?.id ?? '');
  const { videos: likedVideos, isLoading: likedLoading } = useLikedVideos(user?.id ?? '');
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('videos');
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
          <TouchableOpacity style={styles.videoThumbnail}>
            {item.thumbnail_url ? (
              <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnailImage} />
            ) : (
              <View style={[styles.thumbnailImage, styles.thumbnailPlaceholder]}>
                <FontAwesome name="play" size={20} color={COLORS.textMuted} />
              </View>
            )}
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <FontAwesome name="user" size={32} color={COLORS.textMuted} />
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
                <FontAwesome name="map-marker" size={14} color={COLORS.textMuted} />
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
                <FontAwesome name="flask" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <FontAwesome name="sign-out" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'videos' && styles.tabActive]}
                onPress={() => setActiveTab('videos')}
              >
                <FontAwesome
                  name="play"
                  size={16}
                  color={activeTab === 'videos' ? COLORS.primary : COLORS.textMuted}
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
                <FontAwesome
                  name="bookmark"
                  size={16}
                  color={activeTab === 'saved' ? COLORS.primary : COLORS.textMuted}
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
                <FontAwesome
                  name="heart"
                  size={16}
                  color={activeTab === 'liked' ? COLORS.primary : COLORS.textMuted}
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
              <FontAwesome
                name={
                  activeTab === 'videos'
                    ? 'video-camera'
                    : activeTab === 'saved'
                    ? 'bookmark'
                    : 'heart'
                }
                size={32}
                color={COLORS.border}
              />
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
  thumbnailImage: {
    flex: 1,
    borderRadius: 4,
  },
  thumbnailPlaceholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
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
