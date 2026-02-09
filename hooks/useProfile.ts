import { useEffect, useState, useCallback } from 'react';
import { Profile, ProfileUpdate } from '@/types/database';
import { getProfile, updateProfile as updateProfileService } from '@/services/profiles';
import { useAuth } from '@/providers/AuthProvider';

export function useProfile(userId?: string) {
  const { user } = useAuth();
  const targetId = userId ?? user?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!targetId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getProfile(targetId);
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: ProfileUpdate) => {
    if (!targetId) throw new Error('No user ID');

    try {
      const updated = await updateProfileService(targetId, updates);
      setProfile(updated);
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
}
