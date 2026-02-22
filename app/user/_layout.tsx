import { Stack } from 'expo-router';

export default function UserLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerBackVisible: true,
        title: 'Profile',
        headerTitle: 'Profile',
      }}
    />
  );
}
