import { SearchBar } from '@/components/SearchBar';
import { useFollowers } from '@/hooks/useFollowers';
import { useAuth } from '@/providers/AuthProvider';
import { ProfileWithFollowStatus } from '@/services/profiles';
import { COLORS } from '@/lib/constants';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFollow } from '@/hooks/useFollow';

function FollowerRow({
  profile,
  currentUserId,
  onFollowChange,
}: {
  profile: ProfileWithFollowStatus;
  currentUserId?: string;
  onFollowChange?: () => void;
}) {
  const router = useRouter();
  const { isFollowing, toggle, isLoading } = useFollow(currentUserId, profile.id);

  const handlePress = () => {
    router.push({
      pathname: '/user/[userId]',
      params: { userId: profile.id },
    } as any);
  };

  const handleToggle = async () => {
    try {
      await toggle();
      onFollowChange?.();
    } catch {
      // Ignore
    }
  };

  const showFollowButton = currentUserId && profile.id !== currentUserId;

  return (
    <TouchableOpacity style={styles.row} onPress={handlePress} activeOpacity={0.7}>
      {profile.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <FontAwesome name="user" size={24} color={COLORS.textMuted} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.displayName} numberOfLines={1}>
          {profile.display_name || 'Traveler'}
        </Text>
        {profile.username && (
          <Text style={styles.username} numberOfLines={1}>
            @{profile.username}
          </Text>
        )}
        {profile.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {profile.bio}
          </Text>
        )}
      </View>
      {showFollowButton && (
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
          onPress={handleToggle}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function FollowersScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const {
    followers,
    isLoading,
    isRefreshing,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useFollowers(userId ?? '', user?.id, searchQuery || undefined);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  if (!userId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Invalid user</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search followers..."
        />
      </View>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={followers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FollowerRow
            profile={item}
            currentUserId={user?.id}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        onEndReached={() => {
          if (hasMore && !isLoading) loadMore();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <FontAwesome name="users" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No matching followers' : 'No followers yet'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading && followers.length > 0 ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
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
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  username: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  bio: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  followBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  followingBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.background,
  },
  followingBtnText: {
    color: COLORS.text,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  errorBanner: {
    padding: 12,
    backgroundColor: COLORS.error + '20',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
});
