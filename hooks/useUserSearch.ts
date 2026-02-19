import { useCallback, useState } from 'react';
import { Profile } from '@/types/database';
import { searchProfiles } from '@/services/profiles';

export function useUserSearch() {
  const [results, setResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const normalized = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
      const data = await searchProfiles(normalized);
      setResults(data);
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
  }, []);

  return { results, isSearching, error, search, clear };
}
