import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { buildOptimizedItineraryForUser } from '@/services/itineraries';
import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// runtime-safe import of react-native-maps
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
try {
  // require at runtime so app doesn't crash if package isn't installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Maps = require('react-native-maps');
  MapView = Maps.default || Maps;
  Marker = Maps.Marker || Maps.Marker;
  Polyline = Maps.Polyline || Maps.Polyline;
} catch (e) {
  MapView = null;
}

export default function ItineraryScreen() {
  const { user } = useAuth();
  const [places, setPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalKm, setTotalKm] = useState<number>(0);

  const generate = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { ordered, totalDistanceKm } = await buildOptimizedItineraryForUser(user.id);
      setPlaces(ordered as any[]);
      setTotalKm(totalDistanceKm ?? 0);
    } catch (err) {
      console.warn('Failed to build itinerary', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Itinerary</Text>
        <TouchableOpacity style={styles.button} onPress={generate}>
          <Text style={styles.buttonText}>{isLoading ? 'Generating...' : 'Generate'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>Stops: {places.length}</Text>
        <Text style={styles.summaryText}>Total distance: {totalKm.toFixed(2)} km</Text>
      </View>

      {MapView && places.length > 0 ? (
        <View style={{ height: 260 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: places[0].latitude,
              longitude: places[0].longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
          >
            {places.map((p, i) => (
              <Marker key={p.id} coordinate={{ latitude: p.latitude, longitude: p.longitude }} title={p.title ?? p.location} description={`${i + 1}`} />
            ))}
            <Polyline coordinates={places.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))} strokeColor={COLORS.primary} strokeWidth={3} />
          </MapView>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          {!MapView && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#FF9500' }]}
              onPress={() => Alert.alert('Map not available', 'Install react-native-maps to see a map preview')}
            >
              <Text style={styles.buttonText}>Install react-native-maps to preview route</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={places}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.index}>{index + 1}.</Text>
            <View style={styles.info}>
              <Text style={styles.placeTitle}>{item.title ?? item.location ?? 'Untitled'}</Text>
              <Text style={styles.placeSub}>{item.location ?? ''}</Text>
              {item.latitude != null && item.longitude != null && (
                <Text style={styles.coords}>{item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</Text>
              )}
            </View>
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  button: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  summary: { paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  summaryText: { color: COLORS.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  index: { width: 28, fontWeight: '700', color: COLORS.text },
  info: { flex: 1 },
  placeTitle: { color: COLORS.text, fontWeight: '700' },
  placeSub: { color: COLORS.textMuted, fontSize: 13 },
  coords: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
});
