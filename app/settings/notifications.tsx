/**
 * Notification Settings Screen
 *
 * Comprehensive notification settings with:
 * - Category-specific preferences
 * - Master mute switch
 * - Marketing opt-in/out
 * - Real-time updates
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColor } from '@/components/useColorScheme';
import { useAuth } from '@/providers/AuthProvider';
import { NotificationSettingsScreen } from '@/components/NotificationSettings';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationSettingsScreen() {
  const { user } = useAuth();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  if (!user?.id) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: textColor + '20',
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: textColor }}>
          Notification Settings
        </Text>
        <Text style={{ fontSize: 14, color: textColor + '60', marginTop: 4 }}>
          Customize how you receive notifications
        </Text>
      </View>

      {/* Settings Content */}
      <NotificationSettingsScreen userId={user.id} />
    </SafeAreaView>
  );
}
