import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { BackButton } from '@/components/BackButton';
import { COLORS } from '@/lib/constants';
import { searchGoogleHotels, SerpApiHotelOption } from '@/services/serpapiHotels';
import { useRouter } from 'expo-router';
import { Hotel, Search, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HotelsScreen() {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState<null | 'checkIn' | 'checkOut'>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SerpApiHotelOption[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const formatDate = (value: Date) =>
    value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(null);
    }
    if (event.type === 'dismissed' || !selected || !showDatePicker) {
      return;
    }
    if (showDatePicker === 'checkIn') {
      setCheckInDate(selected);
    } else {
      setCheckOutDate(selected);
    }
  };

  const runSearch = async () => {
    setHasSearched(true);
    setSearchError(null);
    setIsLoading(true);
    setResults([]);
    try {
      const hotels = await searchGoogleHotels({
        query: destination,
        checkInDate,
        checkOutDate,
        adults: guests,
      });
      setResults(hotels);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong. Try again.';
      setSearchError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Travel Search</Text>
      </View>

      <View style={styles.routeTabs}>
        <TouchableOpacity style={styles.routeTab} onPress={() => router.push('/profile/flights' as any)}>
          <Text style={styles.routeTabText}>Flights</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.routeTab, styles.routeTabActive]}>
          <Text style={[styles.routeTabText, styles.routeTabTextActive]}>Hotels</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={hasSearched ? results : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push(
                {
                  pathname: '/profile/hotels/[id]',
                  params: {
                    id: item.id,
                    name: item.name,
                    destination: item.destination,
                    stars: String(item.stars),
                    pricePerNight: String(item.pricePerNight),
                    thumbnail: item.thumbnail,
                    description: item.description,
                    amenities: item.amenities.join('||'),
                  },
                } as any
              )
            }
          >
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <Text style={styles.hotelName}>{item.name}</Text>
                <Text style={styles.price}>${item.pricePerNight}/night</Text>
              </View>
              <View style={styles.starRow}>
                {Array.from({ length: item.stars }).map((_, index) => (
                  <Star key={`${item.id}-${index}`} size={13} color="#f4b400" fill="#f4b400" />
                ))}
              </View>
              <Text style={styles.cardMeta}>
                {item.destination} · {rooms} room{rooms > 1 ? 's' : ''} · {guests} guest
                {guests > 1 ? 's' : ''}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Hotels</Text>
            <TextInput
              style={styles.input}
              placeholder="Destination or hotel name"
              placeholderTextColor={COLORS.textMuted}
              value={destination}
              onChangeText={setDestination}
            />

            <Pressable style={styles.inputButton} onPress={() => setShowDatePicker('checkIn')}>
              <Text style={styles.inputButtonText}>Check-in: {formatDate(checkInDate)}</Text>
            </Pressable>
            <Pressable style={styles.inputButton} onPress={() => setShowDatePicker('checkOut')}>
              <Text style={styles.inputButtonText}>Check-out: {formatDate(checkOutDate)}</Text>
            </Pressable>

            <View style={styles.counterRow}>
              <Text style={styles.counterLabel}>Rooms</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepButton}
                  onPress={() => setRooms((prev) => Math.max(1, prev - 1))}
                >
                  <Text style={styles.stepText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepValue}>{rooms}</Text>
                <TouchableOpacity style={styles.stepButton} onPress={() => setRooms((prev) => prev + 1)}>
                  <Text style={styles.stepText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.counterRow}>
              <Text style={styles.counterLabel}>Guests</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepButton}
                  onPress={() => setGuests((prev) => Math.max(1, prev - 1))}
                >
                  <Text style={styles.stepText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepValue}>{guests}</Text>
                <TouchableOpacity style={styles.stepButton} onPress={() => setGuests((prev) => prev + 1)}>
                  <Text style={styles.stepText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.searchButton} onPress={runSearch}>
              <Search size={18} color="#fff" />
              <Text style={styles.searchButtonText}>Search Hotels</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.stateWrap}>
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.stateText}>Loading hotel options...</Text>
              </>
            ) : searchError ? (
              <Text style={[styles.stateText, styles.stateError]}>{searchError}</Text>
            ) : (
              <>
                <Hotel size={36} color={COLORS.textMuted} />
                <Text style={styles.stateText}>
                  {hasSearched
                    ? 'No hotels found for your destination.'
                    : 'Search by destination, dates, rooms, and guests.'}
                </Text>
              </>
            )}
          </View>
        }
      />

      {showDatePicker && (
        <DateTimePicker
          mode="date"
          value={showDatePicker === 'checkIn' ? checkInDate : checkOutDate}
          minimumDate={new Date()}
          onChange={onDateChange}
        />
      )}
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
  routeTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 4,
  },
  routeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  routeTabActive: { backgroundColor: COLORS.primary },
  routeTabText: { color: COLORS.textMuted, fontWeight: '600' },
  routeTabTextActive: { color: '#fff' },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  form: { marginTop: 14, gap: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: COLORS.text,
  },
  inputButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputButtonText: { color: COLORS.text, fontSize: 14 },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counterLabel: { color: COLORS.text, fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: { fontSize: 18, color: COLORS.text },
  stepValue: { minWidth: 18, textAlign: 'center', color: COLORS.text, fontWeight: '700' },
  searchButton: {
    marginTop: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  stateWrap: { alignItems: 'center', paddingVertical: 36, gap: 10 },
  stateText: { color: COLORS.textMuted, textAlign: 'center' },
  stateError: { color: COLORS.error, paddingHorizontal: 12 },
  card: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  thumbnail: { width: '100%', height: 164, backgroundColor: COLORS.surface },
  cardBody: { padding: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  hotelName: { color: COLORS.text, fontWeight: '700', fontSize: 16, flex: 1 },
  price: { color: COLORS.primary, fontWeight: '700' },
  starRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  cardMeta: { marginTop: 8, color: COLORS.textMuted, fontSize: 13 },
});
