import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="itineraries" options={{ title: 'My Trips' }} />
      <Stack.Screen name="itineraries/[id]" options={{ title: 'Trip Details' }} />
      <Stack.Screen name="itineraries/generate" options={{ headerShown: false }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Profile' }} />
    </Stack>
  );
}
