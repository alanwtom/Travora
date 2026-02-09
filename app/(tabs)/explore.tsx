import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useVideoSearch } from '@/hooks/useVideos';
import { VideoCard } from '@/components/VideoCard';
import { COLORS } from '@/lib/constants';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const { results, isSearching, search } = useVideoSearch();

  const handleSearch = (text: string) => {
    setQuery(text);
    // Debounce would be ideal here; for now, search on each keystroke
    search(text);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search destinations, videos..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
      </View>

      {/* Results */}
      {isSearching ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VideoCard video={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centered}>
              <FontAwesome name="compass" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>
                {query ? 'No results found' : 'Discover travel videos'}
              </Text>
              <Text style={styles.emptySubtext}>
                {query
                  ? 'Try a different search term'
                  : 'Search for destinations, travelers, or topics'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 48,
  },
  list: {
    padding: 16,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
});
