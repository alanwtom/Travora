import { BackButton } from '@/components/BackButton';
import { COLORS } from '@/lib/constants';
import { useLocalSearchParams } from 'expo-router';
import { MapPin, Star, Users } from 'lucide-react-native';
import React from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

type HotelDetail = {
  id: string;
  name: string;
  destination: string;
  stars: number;
  pricePerNight: number;
  thumbnail: string;
  description: string;
  amenities: string[];
};

const DUMMY_HOTELS: HotelDetail[] = [
  {
    id: 'h-1',
    name: 'Harbor View Suites',
    destination: 'Tokyo',
    stars: 5,
    pricePerNight: 249,
    thumbnail: 'https://picsum.photos/seed/hotel-1/900/600',
    description: 'Modern suites near city-center nightlife and transit lines.',
    amenities: ['Pool', 'Spa', 'Free WiFi', 'Breakfast'],
  },
  {
    id: 'h-2',
    name: 'Sakura Stay',
    destination: 'Tokyo',
    stars: 4,
    pricePerNight: 169,
    thumbnail: 'https://picsum.photos/seed/hotel-2/900/600',
    description: 'Comfort-focused stay with family rooms and cozy lounge.',
    amenities: ['Gym', 'Breakfast', 'Airport Shuttle'],
  },
  {
    id: 'h-3',
    name: 'Shinjuku Central Inn',
    destination: 'Tokyo',
    stars: 3,
    pricePerNight: 112,
    thumbnail: 'https://picsum.photos/seed/hotel-3/900/600',
    description: 'Budget-friendly rooms with easy train access.',
    amenities: ['Free WiFi', 'Laundry'],
  },
];

export default function HotelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const hotel = DUMMY_HOTELS.find((item) => item.id === id) ?? DUMMY_HOTELS[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Hotel Details</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: hotel.thumbnail }} style={styles.image} />
        <Text style={styles.name}>{hotel.name}</Text>

        <View style={styles.infoRow}>
          <MapPin size={14} color={COLORS.textMuted} />
          <Text style={styles.infoText}>{hotel.destination}</Text>
        </View>
        <View style={styles.infoRow}>
          <Users size={14} color={COLORS.textMuted} />
          <Text style={styles.infoText}>Dummy capacity: up to 4 guests per room</Text>
        </View>
        <View style={styles.starRow}>
          {Array.from({ length: hotel.stars }).map((_, index) => (
            <Star key={`${hotel.id}-${index}`} size={14} color="#f4b400" fill="#f4b400" />
          ))}
          <Text style={styles.infoText}>{hotel.stars}-star hotel</Text>
        </View>

        <Text style={styles.price}>${hotel.pricePerNight}/night</Text>
        <Text style={styles.description}>{hotel.description}</Text>
        <Text style={styles.sectionTitle}>Amenities</Text>
        {hotel.amenities.map((amenity) => (
          <Text key={amenity} style={styles.amenity}>
            - {amenity}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { marginLeft: 12, fontSize: 18, fontWeight: '700', color: COLORS.text },
  content: { padding: 16, paddingBottom: 24 },
  image: { width: '100%', height: 220, borderRadius: 12, backgroundColor: COLORS.surface },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginTop: 14 },
  infoRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 8 },
  starRow: { flexDirection: 'row', gap: 4, alignItems: 'center', marginTop: 8 },
  infoText: { color: COLORS.textMuted },
  price: { fontSize: 24, color: COLORS.primary, fontWeight: '800', marginTop: 12 },
  description: { color: COLORS.text, lineHeight: 20, marginTop: 12 },
  sectionTitle: { color: COLORS.text, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  amenity: { color: COLORS.textMuted, marginTop: 4 },
});
