import { GridVideoCard } from '@/components/GridVideoCard';
import { SearchBar } from '@/components/SearchBar';
import { useFollow } from '@/hooks/useFollow';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useFeedVideos, useVideoSearch } from '@/hooks/useVideos';
import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { getSuggestedUsers } from '@/services/profiles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ExploreScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { videos, isLoading, isRefreshing, error, loadMore, refresh, hasMore } = useFeedVideos();
  const { results: userResults, isSearching: userSearching, search: searchUsers } = useUserSearch();
  const { results: videoResults, isSearching: videoSearching, search: searchVideos } = useVideoSearch();
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.id) {
      getSuggestedUsers(user.id, 5).then(setSuggestedUsers).catch(() => {});
    }
  }, [user?.id]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchUsers(query);
      searchVideos(query);
    }
  }, [searchUsers, searchVideos]);

  const isSearching = userSearching || videoSearching;
  const showSearchResults = searchQuery.trim().length > 0;

  if (isLoading && videos.length === 0 && !showSearchResults) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error && videos.length === 0 && !showSearchResults) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  const renderVideoRow = ({ item: rowVideos }: { item: any[] }) => (
    <View style={styles.row}>
      {rowVideos.map((video: any, index: number) => (
        <View key={`${video.id}-${index}`} style={styles.columnWrapper}>
          <GridVideoCard video={video} />
        </View>
      ))}
      {rowVideos.length === 1 && <View style={styles.columnWrapper} />}
    </View>
  );

  const displayVideos = showSearchResults ? videoResults : videos;
  const groupedVideos: any[] = [];
  for (let i = 0; i < displayVideos.length; i += 2) {
    groupedVideos.push(displayVideos.slice(i, i + 2));
  }

  const SuggestedUserRow = ({ profile }: { profile: any }) => {
    const { isFollowing, toggle, isLoading } = useFollow(user?.id, profile.id);
    return (
      <TouchableOpacity
        style={styles.suggestedRow}
        onPress={() => router.push({ pathname: '/user/[userId]', params: { userId: profile.id } } as any)}
      >
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.suggestedAvatar} />
        ) : (
          <View style={[styles.suggestedAvatar, styles.avatarPlaceholder]}>
            <FontAwesome name="user" size={20} color={COLORS.textMuted} />
          </View>
        )}
        <View style={styles.suggestedInfo}>
          <Text style={styles.suggestedName} numberOfLines={1}>
            {profile.display_name || 'Traveler'}
          </Text>
          {profile.username && (
            <Text style={styles.suggestedUsername} numberOfLines={1}>
              @{profile.username}
            </Text>
          )}
        </View>
        {user?.id !== profile.id && (
          <TouchableOpacity
            style={[styles.suggestedFollowBtn, isFollowing && styles.followingBtn]}
            onPress={() => toggle()}
            disabled={isLoading}
          >
            <Text style={[styles.suggestedFollowText, isFollowing && styles.followingBtnText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const SearchUserRow = ({ profile }: { profile: any }) => {
    const { isFollowing, toggle, isLoading } = useFollow(user?.id, profile.id);
    return (
      <TouchableOpacity
        style={styles.searchUserRow}
        onPress={() => router.push({ pathname: '/user/[userId]', params: { userId: profile.id } } as any)}
      >
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.searchUserAvatar} />
        ) : (
          <View style={[styles.searchUserAvatar, styles.avatarPlaceholder]}>
            <FontAwesome name="user" size={24} color={COLORS.textMuted} />
          </View>
        )}
        <View style={styles.searchUserInfo}>
          <Text style={styles.searchUserName} numberOfLines={1}>
            {profile.display_name || 'Traveler'}
          </Text>
          {profile.username && (
            <Text style={styles.searchUserUsername} numberOfLines={1}>
              @{profile.username}
            </Text>
          )}
        </View>
        {user?.id !== profile.id && (
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followingBtn]}
            onPress={() => toggle()}
            disabled={isLoading}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <>
      {showSearchResults ? (
        <>
          {userResults.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>People</Text>
              {userResults.map((profile) => (
                <SearchUserRow key={profile.id} profile={profile} />
              ))}
            </View>
          )}
          {videoResults.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Videos</Text>
            </View>
          )}
        </>
      ) : (
        suggestedUsers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Travelers to Follow</Text>
            {suggestedUsers.map((profile) => (
              <SuggestedUserRow key={profile.id} profile={profile} />
            ))}
          </View>
        )
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search by @username or name..."
          isLoading={isSearching}
        />
      </View>
      <FlatList
        data={groupedVideos}
        renderItem={renderVideoRow}
        keyExtractor={(item, index) => `row-${index}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        onEndReached={() => {
          if (hasMore && !isLoading && !showSearchResults) {
            loadMore();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          !showSearchResults ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          ) : undefined
        }
        ListEmptyComponent={
          !isLoading && !isSearching && displayVideos.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                {showSearchResults ? 'No videos found' : 'No videos yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {showSearchResults ? 'Try a different search' : 'Check back later for new content'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading && displayVideos.length > 0 && !showSearchResults ? (
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  suggestedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  suggestedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  suggestedInfo: {
    flex: 1,
  },
  suggestedName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  suggestedUsername: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  suggestedFollowBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  suggestedFollowText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.background,
  },
  searchUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchUserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  searchUserInfo: {
    flex: 1,
  },
  searchUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  searchUserUsername: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  followBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.background,
  },
  followingBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followingBtnText: {
    color: COLORS.text,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
