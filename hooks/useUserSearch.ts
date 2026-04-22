import { useCallback, useEffect, useState } from 'react';
import { Profile } from '@/types/database';
import { searchProfiles } from '@/services/profiles';
import { getLocallyBlockedUserIds, subscribeToLocalBlocks } from '@/services/localBlocks';

export function useUserSearch() {
  const [results, setResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string>('');

  const search = useCallback(async (query: string) => {
    const trimmed = query.trim();
    setLastQuery(trimmed);
    if (!trimmed) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const normalized = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
      const data = await searchProfiles(normalized);
      const blockedIds = await getLocallyBlockedUserIds();
      const filtered = blockedIds.length ? data.filter((p) => !blockedIds.includes(p.id)) : data;
      setResults(filtered);
    } catch (err: any) {
      setError(err.message);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
    setLastQuery('');
  }, []);

  useEffect(() => {
    const unsub = subscribeToLocalBlocks(() => {
      if (lastQuery) {
        search(lastQuery).catch(() => {});
      }
    });
    return unsub;
  }, [lastQuery, search]);

  return { results, isSearching, error, search, clear };
}
