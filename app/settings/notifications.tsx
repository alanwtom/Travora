/**
 * Notification Settings Screen
 *
 * Comprehensive notification settings with:
 * - Category-specific preferences
 * - Master mute switch
 * - Marketing opt-in/out
 * - Real-time updates
 * - Link to notification history (debug view)
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColor } from '@/components/Themed';
import { useAuth } from '@/providers/AuthProvider';
import { NotificationSettingsScreen } from '@/components/NotificationSettings';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E5E5E5', dark: '#38383A' }, 'text');
  const tintColor = useThemeColor({}, 'tint');

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
          Customize how you receive notifications via push and email
        </Text>
      </View>

      {/* Debug History Link */}
      <TouchableOpacity
        onPress={() => router.push('/settings/notification-history')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
          backgroundColor: backgroundColor,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="bug" size={20} color={textColor + '60'} />
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 15, color: textColor }}>Notification History</Text>
            <Text style={{ fontSize: 12, color: textColor + '60' }}>
              Debug view for delivery tracking
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={textColor + '40'} />
      </TouchableOpacity>

      {/* Settings Content */}
      <NotificationSettingsScreen userId={user.id} />
    </SafeAreaView>
  );
}
