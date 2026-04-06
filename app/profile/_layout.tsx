import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="itineraries" options={{ title: 'My Trips' }} />
      <Stack.Screen name="itineraries/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="itineraries/generate" options={{ headerShown: false }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="flights" options={{ title: 'My Flights' }} />
      <Stack.Screen name="hotels" options={{ title: 'My Hotels' }} />
      <Stack.Screen name="hotels/[id]" options={{ title: 'Hotel Details' }} />
    </Stack>
  );
}
