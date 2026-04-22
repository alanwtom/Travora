import { Tabs } from 'expo-router';
import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, Compass, Plus, Bell, User } from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { COLORS } from '@/lib/constants';
import { useAppColors } from '@/lib/theme';
import { SwipeItineraryProvider } from '@/providers/SwipeItineraryProvider';

function TabBarIcon(props: {
  name: 'Home' | 'Compass' | 'Bell' | 'User';
  color: string;
  focused?: boolean;
}) {
  const { name, color, focused } = props;
  const colors = useAppColors();
  const IconComponent = { Home, Compass, Bell, User }[name];
  return (
    <View style={styles.iconContainer}>
      <IconComponent
        size={22}
        color={focused ? colors.accent : color}
        strokeWidth={2.5}
      />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = useAppColors();

  return (
    <SwipeItineraryProvider>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 78 : 64,
          paddingBottom: Platform.OS === 'ios' ? 22 : 8,
          paddingTop: 8,
          paddingHorizontal: 4,
          elevation: 0,
          backgroundColor: colors.background,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="Home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="Compass" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="itinerary"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="discover-itinerary"
        options={{
          href: null,
          title: 'Swipe history',
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.uploadButtonWrapper}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.uploadButton}
              >
                <Plus size={26} color="#FFFFFF" strokeWidth={3} />
              </LinearGradient>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="Bell" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="User" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
    </SwipeItineraryProvider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  uploadButtonWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  uploadButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
