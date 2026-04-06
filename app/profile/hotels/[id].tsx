import { BackButton } from '@/components/BackButton';
import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import {
  addHotelPin,
  type HotelPinSearchContext,
} from '@/services/itineraryTravelPins';
import type { SerpApiHotelOption } from '@/services/serpapiHotels';
import { useLocalSearchParams } from 'expo-router';
import { MapPin, Star, Users } from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

export default function HotelDetailScreen() {
  const { user } = useAuth();
  const {
    id,
    name,
    destination,
    stars,
    pricePerNight,
    thumbnail,
    description,
    amenities,
    itineraryId,
    itineraryTitle,
    pinCheckIn,
    pinCheckOut,
    pinAdults,
    pinRooms,
    pinQuery,
  } = useLocalSearchParams<{
    id?: string;
    name?: string;
    destination?: string;
    stars?: string;
    pricePerNight?: string;
    thumbnail?: string;
    description?: string;
    amenities?: string;
    itineraryId?: string;
    itineraryTitle?: string;
    pinCheckIn?: string;
    pinCheckOut?: string;
    pinAdults?: string;
    pinRooms?: string;
    pinQuery?: string;
  }>();

  const parsedStars = stars ? Number.parseInt(stars, 10) : 0;
  const parsedPrice = pricePerNight ? Number.parseFloat(pricePerNight) : 0;
  const parsedAmenities =
    typeof amenities === 'string' && amenities.length > 0
      ? amenities.split('||').filter(Boolean)
      : [];

  const hotel: HotelDetail = {
    id: id ?? 'unknown',
    name: name ?? 'Hotel details',
    destination: destination ?? 'Destination',
    stars: Number.isFinite(parsedStars) ? parsedStars : 0,
    pricePerNight: Number.isFinite(parsedPrice) ? parsedPrice : 0,
    thumbnail: thumbnail ?? '',
    description: description ?? '',
    amenities: parsedAmenities,
  };

  const canPinToTrip = Boolean(itineraryId && user?.id && pinCheckIn && pinCheckOut);

  const addHotelToItinerary = async () => {
    if (!itineraryId || !user?.id || !pinCheckIn || !pinCheckOut) return;
    const option: SerpApiHotelOption = {
      id: hotel.id,
      name: hotel.name,
      destination: hotel.destination,
      stars: hotel.stars,
      pricePerNight: hotel.pricePerNight,
      thumbnail: hotel.thumbnail,
      description: hotel.description,
      amenities: hotel.amenities,
    };
    const ctx: HotelPinSearchContext = {
      query: pinQuery ?? hotel.destination,
      checkIn: pinCheckIn,
      checkOut: pinCheckOut,
      adults: pinAdults ? parseInt(pinAdults, 10) || 1 : 1,
      rooms: pinRooms ? parseInt(pinRooms, 10) || 1 : 1,
    };
    try {
      await addHotelPin(itineraryId, user.id, option, ctx);
      Alert.alert('Saved', `Added to ${itineraryTitle ?? 'your trip'}.`);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : e && typeof e === 'object' && 'message' in e && typeof (e as { message: string }).message === 'string'
            ? (e as { message: string }).message
            : 'Could not add this hotel.';
      Alert.alert('Error', msg);
    }
  };

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
          <Text style={styles.infoText}>Capacity depends on the listing.</Text>
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

        {canPinToTrip ? (
          <TouchableOpacity style={styles.addToTripBtn} onPress={addHotelToItinerary}>
            <Text style={styles.addToTripBtnText}>Add to trip</Text>
          </TouchableOpacity>
        ) : null}
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
  addToTripBtn: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addToTripBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
