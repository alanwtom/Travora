/**
 * Notification Settings Components
 *
 * A comprehensive notification settings UI with:
 * - Independent toggle for Push and Email notifications per category
 * - Master switch to mute all notifications
 * - Real-time updates with immediate database persistence
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from './Themed';
import {
  NotificationCategory,
  NotificationChannel,
  NotificationCategoryWithPreferences,
  NotificationSettings,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
} from '@/types/notifications';
import {
  getNotificationCategoriesWithPreferences,
  getNotificationSettings,
  toggleNotificationChannel,
  muteAllNotifications,
  unmuteAllNotifications,
  muteNotificationsForDuration,
  updateNotificationSettings,
} from '@/services/notifications';

interface NotificationSettingsProps {
  userId: string;
}

export function NotificationSettingsScreen({ userId }: NotificationSettingsProps) {
  const [categories, setCategories] = useState<NotificationCategoryWithPreferences[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({ light: '#FFFFFF', dark: '#1C1C1E' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E5E5E5', dark: '#38383A' }, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, settingsData] = await Promise.all([
        getNotificationCategoriesWithPreferences(userId),
        getNotificationSettings(userId),
      ]);
      setCategories(categoriesData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChannel = async (
    category: NotificationCategory,
    channel: NotificationChannel,
    currentValue: boolean
  ) => {
    const updateKey = `${category}-${channel}`;
    try {
      setUpdating(updateKey);

      // Optimistic update
      setCategories((prev) =>
        prev.map((cat) => {
          if (cat.category === category) {
            return {
              ...cat,
              [`${channel}_enabled`]: !currentValue,
            };
          }
          return cat;
        })
      );

      // Real-time database update
      await toggleNotificationChannel(userId, category, channel, !currentValue);
    } catch (error) {
      console.error('Failed to update notification preference:', error);
      // Revert on error
      loadData();
      Alert.alert('Error', 'Failed to update notification preference');
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleMasterSwitch = async () => {
    if (!settings) return;

    try {
      setUpdating('master');

      // Optimistic update
      const newMutedState = !settings.notification_muted;
      setSettings((prev) => (prev ? { ...prev, notification_muted: newMutedState } : null));

      // Real-time database update
      if (newMutedState) {
        await muteAllNotifications(userId);
      } else {
        await unmuteAllNotifications(userId);
      }
    } catch (error) {
      console.error('Failed to update master switch:', error);
      loadData();
      Alert.alert('Error', 'Failed to update master switch');
    } finally {
      setUpdating(null);
    }
  };

  const handleMuteForDuration = async (hours: number) => {
    try {
      setUpdating('mute-duration');

      // Optimistic update
      setSettings((prev) =>
        prev ? { ...prev, notification_muted: true, notification_mute_until: null } : null
      );

      // Real-time database update
      await muteNotificationsForDuration(userId, hours);
      await loadData();
    } catch (error) {
      console.error('Failed to mute for duration:', error);
      loadData();
      Alert.alert('Error', 'Failed to mute notifications');
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleMarketing = async () => {
    if (!settings) return;

    try {
      setUpdating('marketing');

      // Optimistic update
      const newValue = !settings.marketing_notifications_enabled;
      setSettings((prev) =>
        prev ? { ...prev, marketing_notifications_enabled: newValue } : null
      );

      // Real-time database update
      await updateNotificationSettings(userId, {
        marketing_notifications_enabled: newValue,
      });
    } catch (error) {
      console.error('Failed to update marketing preferences:', error);
      loadData();
      Alert.alert('Error', 'Failed to update marketing preferences');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor }}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor }}>
      <View style={{ padding: 16 }}>
        {/* Master Switch Section */}
        <View
          style={{
            backgroundColor: cardColor,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="notifications-off" size={24} color={textColor} />
            <Text style={{ fontSize: 18, fontWeight: '600', marginLeft: 12, color: textColor }}>
              Master Switch
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, color: textColor, marginBottom: 4 }}>
                {settings?.notification_muted ? 'Notifications Muted' : 'Notifications Enabled'}
              </Text>
              <Text style={{ fontSize: 14, color: textColor + '80' }}>
                {settings?.notification_muted
                  ? 'All notifications are paused'
                  : 'You will receive notifications based on your preferences'}
              </Text>
            </View>
            <Switch
              value={!settings?.notification_muted}
              onValueChange={handleToggleMasterSwitch}
              disabled={updating === 'master'}
              trackColor={{ false: '#767577', true: tintColor }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Mute Duration Options */}
          {!settings?.notification_muted && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 14, color: textColor + '80', marginBottom: 8 }}>
                Mute for:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { label: '1 Hour', hours: 1 },
                  { label: '8 Hours', hours: 8 },
                  { label: '24 Hours', hours: 24 },
                  { label: '7 Days', hours: 168 },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    onPress={() => handleMuteForDuration(option.hours)}
                    disabled={updating === 'mute-duration'}
                    style={{
                      backgroundColor: tintColor + '20',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: tintColor,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: tintColor, fontWeight: '600' }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Marketing Consent */}
        <View
          style={{
            backgroundColor: cardColor,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="gift" size={20} color="#F59E0B" />
                <Text
                  style={{ fontSize: 16, fontWeight: '600', marginLeft: 8, color: textColor }}
                >
                  Marketing Notifications
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: textColor + '80' }}>
                Receive special offers, deals, and promotions
              </Text>
            </View>
            <Switch
              value={settings?.marketing_notifications_enabled}
              onValueChange={handleToggleMarketing}
              disabled={updating === 'marketing'}
              trackColor={{ false: '#767577', true: tintColor }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Channel Legend */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: textColor + '60', marginBottom: 8 }}>
            DELIVERY CHANNELS
          </Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {Object.entries(NOTIFICATION_CHANNELS).map(([key, channel]) => (
              <View key={key} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={channel.icon as any} size={16} color={textColor + '80'} />
                <Text style={{ fontSize: 12, color: textColor + '80', marginLeft: 4 }}>
                  {channel.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Notification Categories */}
        <Text style={{ fontSize: 14, fontWeight: '600', color: textColor + '60', marginBottom: 12 }}>
          NOTIFICATION CATEGORIES
        </Text>

        {categories.map((category) => (
          <NotificationCategoryCard
            key={category.category}
            category={category}
            onToggleChannel={handleToggleChannel}
            updating={updating}
            textColor={textColor}
            cardColor={cardColor}
            borderColor={borderColor}
            tintColor={tintColor}
          />
        ))}

        {/* Priority Information */}
        <View style={{ marginTop: 24, padding: 16, backgroundColor: cardColor, borderRadius: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: textColor, marginBottom: 12 }}>
            Delivery Priorities
          </Text>
          {Object.entries(NOTIFICATION_PRIORITIES).map(([key, priority]) => (
            <View key={key} style={{ flexDirection: 'row', marginBottom: 8 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: priority.color,
                  marginRight: 8,
                  marginTop: 2,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>
                  {priority.label} Priority
                </Text>
                <Text style={{ fontSize: 12, color: textColor + '80' }}>
                  {priority.description} • Target: {priority.deliveryTarget}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

interface NotificationCategoryCardProps {
  category: NotificationCategoryWithPreferences;
  onToggleChannel: (category: NotificationCategory, channel: NotificationChannel, value: boolean) => void;
  updating: string | null;
  textColor: string;
  cardColor: string;
  borderColor: string;
  tintColor: string;
}

function NotificationCategoryCard({
  category,
  onToggleChannel,
  updating,
  textColor,
  cardColor,
  borderColor,
  tintColor,
}: NotificationCategoryCardProps) {
  return (
    <View
      style={{
        backgroundColor: cardColor,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: tintColor + '20',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name={category.icon as any} size={20} color={tintColor} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>
              {category.label}
            </Text>
            {category.is_essential && (
              <View
                style={{
                  backgroundColor: '#EF4444',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  marginLeft: 8,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#FFFFFF' }}>ESSENTIAL</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 13, color: textColor + '70', marginTop: 2 }}>
            {category.description}
          </Text>
        </View>
      </View>

      {/* Channel Toggles */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 }}>
        {([
          { channel: 'push' as NotificationChannel, enabled: category.push_enabled },
          { channel: 'email' as NotificationChannel, enabled: category.email_enabled },
          { channel: 'in_app' as NotificationChannel, enabled: category.in_app_enabled },
        ]).map((item) => (
          <TouchableOpacity
            key={item.channel}
            style={{ alignItems: 'center' }}
            onPress={() => onToggleChannel(category.category, item.channel, item.enabled)}
            disabled={updating === `${category.category}-${item.channel}`}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: item.enabled ? tintColor + '20' : textColor + '10',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: item.enabled ? tintColor : textColor + '30',
              }}
            >
              <Ionicons
                name={NOTIFICATION_CHANNELS[item.channel].icon as any}
                size={22}
                color={item.enabled ? tintColor : textColor + '40'}
              />
            </View>
            <Text
              style={{
                fontSize: 11,
                color: item.enabled ? tintColor : textColor + '60',
                marginTop: 4,
                fontWeight: item.enabled ? '600' : '400',
              }}
            >
              {NOTIFICATION_CHANNELS[item.channel].label.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
