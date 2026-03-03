import { Stack } from 'expo-router';

export default function UserLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="followers" options={{ headerShown: true, title: 'Followers' }} />
      <Stack.Screen name="following" options={{ headerShown: true, title: 'Following' }} />
    </Stack>
  );
}
