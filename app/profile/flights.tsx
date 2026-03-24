import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { BackButton } from '@/components/BackButton';
import { COLORS } from '@/lib/constants';
import { useRouter } from 'expo-router';
import { Plane, Search } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type FlightOption = {
  id: string;
  airline: string;
  from: string;
  to: string;
  departAt: string;
  arriveAt: string;
  duration: string;
  className: 'Economy' | 'Premium Economy' | 'Business';
  price: number;
};

const DUMMY_FLIGHTS: FlightOption[] = [
  {
    id: 'f-1',
    airline: 'Sky Pacific',
    from: 'SFO',
    to: 'NRT',
    departAt: '08:20 AM',
    arriveAt: '12:40 PM',
    duration: '11h 20m',
    className: 'Economy',
    price: 629,
  },
  {
    id: 'f-2',
    airline: 'Northwind Air',
    from: 'SFO',
    to: 'NRT',
    departAt: '03:10 PM',
    arriveAt: '07:25 PM',
    duration: '11h 15m',
    className: 'Premium Economy',
    price: 899,
  },
  {
    id: 'f-3',
    airline: 'AeroOne',
    from: 'SFO',
    to: 'NRT',
    departAt: '10:55 PM',
    arriveAt: '02:30 AM',
    duration: '10h 35m',
    className: 'Business',
    price: 1499,
  },
];

const TRAVEL_CLASSES: Array<FlightOption['className']> = ['Economy', 'Premium Economy', 'Business'];

export default function FlightsScreen() {
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [travelers, setTravelers] = useState(1);
  const [selectedClass, setSelectedClass] = useState<FlightOption['className']>('Economy');
  const [departDate, setDepartDate] = useState(new Date());
  const [returnDate, setReturnDate] = useState(new Date(Date.now() + 4 * 24 * 60 * 60 * 1000));
  const [departTime, setDepartTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState<null | 'depart' | 'return'>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const filteredFlights = useMemo(() => {
    return DUMMY_FLIGHTS.filter((flight) => {
      const validClass = flight.className === selectedClass;
      const validFrom = from.trim().length === 0 || flight.from.toLowerCase().includes(from.toLowerCase());
      const validTo = to.trim().length === 0 || flight.to.toLowerCase().includes(to.toLowerCase());
      return validClass && validFrom && validTo;
    });
  }, [from, to, selectedClass]);

  const formatDate = (value: Date) =>
    value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (value: Date) =>
    value.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(null);
    }
    if (event.type === 'dismissed' || !selected || !showDatePicker) {
      return;
    }
    if (showDatePicker === 'depart') {
      setDepartDate(selected);
    } else {
      setReturnDate(selected);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'dismissed' || !selected) {
      return;
    }
    setDepartTime(selected);
  };

  const runSearch = () => {
    setHasSearched(true);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Travel Search</Text>
      </View>

      <View style={styles.routeTabs}>
        <TouchableOpacity style={[styles.routeTab, styles.routeTabActive]}>
          <Text style={[styles.routeTabText, styles.routeTabTextActive]}>Flights</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.routeTab} onPress={() => router.push('/profile/hotels' as any)}>
          <Text style={styles.routeTabText}>Hotels</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={hasSearched ? filteredFlights : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.airline}>{item.airline}</Text>
              <Text style={styles.price}>${item.price}</Text>
            </View>
            <Text style={styles.routeText}>
              {item.from} -> {item.to}
            </Text>
            <Text style={styles.metaText}>
              {item.departAt} - {item.arriveAt} ({item.duration})
            </Text>
            <Text style={styles.metaText}>
              {item.className} · {travelers} traveler{travelers > 1 ? 's' : ''}
            </Text>
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Flights</Text>
            <TextInput
              style={styles.input}
              placeholder="Starting destination (e.g. SFO)"
              placeholderTextColor={COLORS.textMuted}
              value={from}
              onChangeText={setFrom}
            />
            <TextInput
              style={styles.input}
              placeholder="Ending destination (e.g. NRT)"
              placeholderTextColor={COLORS.textMuted}
              value={to}
              onChangeText={setTo}
            />

            <View style={styles.inlineRow}>
              <Text style={styles.inlineLabel}>Round trip</Text>
              <Switch value={isRoundTrip} onValueChange={setIsRoundTrip} />
            </View>

            <Pressable style={styles.inputButton} onPress={() => setShowDatePicker('depart')}>
              <Text style={styles.inputButtonText}>Departure date: {formatDate(departDate)}</Text>
            </Pressable>

            {isRoundTrip && (
              <Pressable style={styles.inputButton} onPress={() => setShowDatePicker('return')}>
                <Text style={styles.inputButtonText}>Return date: {formatDate(returnDate)}</Text>
              </Pressable>
            )}

            <Pressable style={styles.inputButton} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.inputButtonText}>Preferred departure time: {formatTime(departTime)}</Text>
            </Pressable>

            <View style={styles.inlineRow}>
              <Text style={styles.inlineLabel}>Travelers</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepButton}
                  onPress={() => setTravelers((prev) => Math.max(1, prev - 1))}
                >
                  <Text style={styles.stepText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepValue}>{travelers}</Text>
                <TouchableOpacity style={styles.stepButton} onPress={() => setTravelers((prev) => prev + 1)}>
                  <Text style={styles.stepText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.inlineLabel}>Ticket class</Text>
            <View style={styles.classRow}>
              {TRAVEL_CLASSES.map((className) => (
                <TouchableOpacity
                  key={className}
                  style={[styles.classPill, selectedClass === className && styles.classPillActive]}
                  onPress={() => setSelectedClass(className)}
                >
                  <Text
                    style={[
                      styles.classPillText,
                      selectedClass === className && styles.classPillTextActive,
                    ]}
                  >
                    {className}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.searchButton} onPress={runSearch}>
              <Search size={18} color="#fff" />
              <Text style={styles.searchButtonText}>Search Flights</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.stateWrap}>
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.stateText}>Loading flight options...</Text>
              </>
            ) : (
              <>
                <Plane size={36} color={COLORS.textMuted} />
                <Text style={styles.stateText}>
                  {hasSearched
                    ? 'No flights match your filters.'
                    : 'Search by route, date, class, and travelers.'}
                </Text>
              </>
            )}
          </View>
        }
      />

      {showDatePicker && (
        <DateTimePicker
          mode="date"
          value={showDatePicker === 'depart' ? departDate : returnDate}
          minimumDate={new Date()}
          onChange={onDateChange}
        />
      )}
      {showTimePicker && (
        <DateTimePicker mode="time" value={departTime} onChange={onTimeChange} is24Hour={false} />
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
