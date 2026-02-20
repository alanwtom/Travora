/**
 * Notifications Tab Screen
 *
 * Displays all notifications for the current user
 * with filter options and real-time updates
 */

import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/components/useColorScheme';
import { useAuth } from '@/providers/AuthProvider';
import { NotificationList } from '@/components/NotificationList';
import { Notification, NotificationCategory } from '@/types/notifications';
import { getUnreadNotificationCount } from '@/services/notifications';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    if (user?.id) {
      loadUnreadCount();
    }
  }, [user?.id]);

  const loadUnreadCount = async () => {
    if (!user?.id) return;
    try {
      const count = await getUnreadNotificationCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    console.log('Notification pressed:', notification);
    // Handle navigation based on notification type
    if (notification.data?.videoId) {
      // Navigate to video
      console.log('Navigate to video:', notification.data.videoId);
    } else if (notification.data?.userId) {
      // Navigate to profile
      console.log('Navigate to profile:', notification.data.userId);
    }
  };

  if (!user?.id) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: textColor + '20',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="notifications" size={24} color={tintColor} />
          <View style={{ marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    flexDirection: 'row',
                  }}
                >
                  <View
                    style={{
                      marginRight: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                      }}
                    >
                      <View>
                        <View
                          style={{
                            flexDirection: 'row',
                          }}
                        >
                          <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>
                            Notifications
                          </Text>
                          {unreadCount > 0 && (
                            <View
                              style={{
                                backgroundColor: '#EF4444',
                                borderRadius: 10,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                marginLeft: 8,
                                minWidth: 20,
                                alignItems: 'center',
                              }}
                            >
                              <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Filter Toggle */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: textColor + '10',
            borderRadius: 8,
            padding: 2,
          }}
        >
          <TouchableOpacity
            onPress={() => setFilter('all')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: filter === 'all' ? tintColor : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: filter === 'all' ? '#FFFFFF' : textColor + '80',
              }}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('unread')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: filter === 'unread' ? tintColor : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: filter === 'unread' ? '#FFFFFF' : textColor + '80',
              }}
            >
              Unread
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      <NotificationList
        userId={user.id}
        unreadOnly={filter === 'unread'}
        onNotificationPress={handleNotificationPress}
      />
    </View>
  );
}
