import { BackButton } from '@/components/BackButton';
import { useFlights } from '@/hooks/useFlights';
import { COLORS } from '@/lib/constants';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { ChevronDown, Plane, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function FlightsScreen() {
  const router = useRouter();
  const { flights, loading, error, hasMore, loadMore, search, reset } = useFlights();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departDate, setDepartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const formatDate = (value: Date) =>
    value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed' || !selected) {
      return;
    }
    setDepartDate(selected);
  };

  const runSearch = async () => {
    if (!from.trim() || !to.trim()) {
      return;
    }

    setHasSearched(true);
    reset();

    try {
      await search({
        origin: from.toUpperCase(),
        destination: to.toUpperCase(),
        date: departDate.toISOString().slice(0, 10),
      });
    } catch (e) {
      // Error handled by hook
    }
  };

  const renderFlight = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.airline}>{item.airline}</Text>
        <Text style={styles.price}>${item.price} {item.currency}</Text>
      </View>
      <Text style={styles.flightNumber}>{item.flight_number}</Text>
      <Text style={styles.routeText}>
        {from} → {to}
      </Text>
      <Text style={styles.metaText}>
        Departs: {new Date(item.departure_time).toLocaleString()}
      </Text>
      <Text style={styles.metaText}>
        Arrives: {new Date(item.arrival_time).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Flight Search</Text>
      </View>

      <FlatList
        data={hasSearched ? flights : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={renderFlight}
        ListHeaderComponent={
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Search Flights</Text>
            <TextInput
              style={styles.input}
              placeholder="Origin airport code (e.g. JFK)"
              placeholderTextColor={COLORS.textMuted}
              value={from}
              onChangeText={setFrom}
              autoCapitalize="characters"
            />
            <TextInput
              style={styles.input}
              placeholder="Destination airport code (e.g. LAX)"
              placeholderTextColor={COLORS.textMuted}
              value={to}
              onChangeText={setTo}
              autoCapitalize="characters"
            />

            <Pressable style={styles.inputButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.inputButtonText}>Departure date: {formatDate(departDate)}</Text>
            </Pressable>

            <TouchableOpacity style={styles.searchButton} onPress={runSearch}>
              <Search size={18} color="#fff" />
              <Text style={styles.searchButtonText}>Search Flights</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.stateWrap}>
            {loading ? (
              <>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.stateText}>Searching flights...</Text>
              </>
            ) : error ? (
              <>
                <Text style={[styles.stateText, styles.stateError]}>{error}</Text>
              </>
            ) : hasSearched ? (
              <>
                <Plane size={36} color={COLORS.textMuted} />
                <Text style={styles.stateText}>No flights found for this route.</Text>
              </>
            ) : (
              <>
                <Plane size={36} color={COLORS.textMuted} />
                <Text style={styles.stateText}>Enter origin, destination, and date to search flights.</Text>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          hasMore && flights.length > 0 ? (
            <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <ChevronDown size={18} color="#fff" />
                  <Text style={styles.loadMoreText}>Load More</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null
        }
      />

      {showDatePicker && (
        <DateTimePicker
          mode="date"
          value={departDate}
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
  inlineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inlineLabel: { color: COLORS.text, fontWeight: '600' },
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
  classRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  classPill: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: COLORS.card,
  },
  classPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  classPillText: { color: COLORS.text, fontWeight: '600', fontSize: 12 },
  classPillTextActive: { color: '#fff' },
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
    padding: 14,
    backgroundColor: COLORS.card,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  airline: { color: COLORS.text, fontWeight: '700', fontSize: 16 },
  price: { color: COLORS.primary, fontWeight: '700', fontSize: 18 },
  routeText: { color: COLORS.text, fontWeight: '600', marginTop: 8 },
  metaText: { color: COLORS.textMuted, marginTop: 4 },
});
