import { useFollow } from '@/hooks/useFollow';
import { useProfile } from '@/hooks/useProfile';
import { useUserVideos } from '@/hooks/useVideos';
import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import {
  getFollowerCount,
  getFollowingCount,
} from '@/services/profiles';
import { BackButton } from '@/components/BackButton';
import { Play, User, MapPin, Video } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CustomHeader({ username, displayName }: { username?: string; displayName?: string }) {
  const { top } = useSafeAreaInsets();
  const title = displayName || username || 'Profile';

  return (
    <View style={[headerStyles.container, { paddingTop: 12 + top }]}>
      <BackButton />
      <Text style={headerStyles.title} numberOfLines={1}>
        {title}
      </Text>
      <TouchableOpacity onPress={onClose} style={headerStyles.shareButton}>
        <Icons.Share size={22} color={COLORS.text} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  shareButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
});

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile(userId ?? undefined);
  const { videos, isLoading: videosLoading } = useUserVideos(userId ?? '');
  const { isFollowing, toggle, isLoading: followLoading } = useFollow(
    user?.id,
    userId
  );
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId && !isOwnProfile) {
      getFollowerCount(userId).then(setFollowers).catch(() => {});
      getFollowingCount(userId).then(setFollowing).catch(() => {});
    }
  }, [userId, isFollowing, isOwnProfile]);

  useEffect(() => {
    if (isOwnProfile && userId) {
      router.replace('/(tabs)/profile');
    }
  }, [isOwnProfile, userId]);

  if (!userId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  if (isOwnProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (profileLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  const handleFollowersPress = () => {
    router.push({
      pathname: '/user/[userId]/followers',
      params: { userId },
    } as any);
  };

  const handleFollowingPress = () => {
    router.push({
      pathname: '/user/[userId]/following',
      params: { userId },
    } as any);
  };

  const handleVideoPress = (videoId: string) => {
    router.push({
      pathname: '/video/[id]',
      params: { id: videoId },
    } as any);
  };

  return (
    <View style={styles.container}>
      <CustomHeader username={profile.username} displayName={profile.display_name} />
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.videoThumbnail}
            onPress={() => handleVideoPress(item.id)}
          >
            {item.thumbnail_url ? (
              <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnailImage} />
            ) : (
              <View style={[styles.thumbnailImage, styles.thumbnailPlaceholder]}>
                <Play size={20} color={COLORS.textMuted} fill="rgba(0,0,0,0.1)" strokeWidth={2} />
              </View>
            )}
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <User size={32} color={COLORS.textMuted} strokeWidth={2} />
                </View>
              )}
            </View>

            <Text style={styles.displayName}>
              {profile.display_name || 'Traveler'}
            </Text>
            {profile.username && (
              <Text style={styles.username}>@{profile.username}</Text>
            )}

            {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

            {profile.location && (
              <View style={styles.locationRow}>
                <MapPin size={14} color={COLORS.textMuted} strokeWidth={2.5} />
                <Text style={styles.locationText}>{profile.location}</Text>
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{videos.length}</Text>
                <Text style={styles.statLabel}>Videos</Text>
              </View>
              <TouchableOpacity style={styles.stat} onPress={handleFollowersPress}>
                <Text style={styles.statValue}>{followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stat} onPress={handleFollowingPress}>
                <Text style={styles.statValue}>{following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={toggle}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text
                  style={[
                    styles.followButtonText,
                    isFollowing && styles.followingButtonText,
                  ]}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.tabContainer}>
              <View style={[styles.tab, styles.tabActive]}>
                <Play size={16} color={COLORS.primary} fill={COLORS.primary} strokeWidth={0} />
                <Text style={[styles.tabLabel, styles.tabLabelActive]}>
                  Videos ({videos.length})
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          !videosLoading ? (
            <View style={styles.emptyVideos}>
              <Video size={32} color={COLORS.border} strokeWidth={2} />
              <Text style={styles.emptyText}>No videos yet</Text>
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
    paddingTop: 24,
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
  statLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  followButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 48,
    alignItems: 'center',
    minWidth: 120,
  },
  followingButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.background,
  },
  followingButtonText: {
    color: COLORS.text,
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
  errorText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
});
