import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { COLORS } from '@/lib/constants';

function HeaderBackButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      style={{ marginLeft: 16, padding: 8 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <FontAwesome name="chevron-left" size={24} color={COLORS.primary} />
    </TouchableOpacity>
  );
}

export default function UserLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerBackVisible: false,
        headerLeft: () => <HeaderBackButton />,
        presentation: 'card',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Profile',
          headerTitle: 'Profile',
          headerBackTitleVisible: false,
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="followers"
        options={{
          title: 'Followers',
          headerBackTitleVisible: false,
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="following"
        options={{
          title: 'Following',
          headerBackTitleVisible: false,
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
    </Stack>
  );
}
