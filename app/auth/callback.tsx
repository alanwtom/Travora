import { useEffect } from 'react';
import { useRouter, useLocalSearchParams, useSegments } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { COLORS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase session is automatically set when the deep link opens
        // We just need to verify the user is authenticated and redirect
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Success - redirect to main app
          router.replace('/(tabs)');
        } else {
          // No session found - redirect to sign in
          router.replace('/(auth)/sign-in');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/(auth)/sign-in');
      }
    };

    handleCallback();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
