import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

const GEOAPIFY_API_KEY = Constants.expoConfig?.extra?.geoapifyApiKey || '';

if (!GEOAPIFY_API_KEY) {
  console.error('Geoapify API key is missing. Check your .env file and app.config.js');
}

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Location Permission Required',
      'Travora needs access to your location to tag your videos. You can enable it in your device settings.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
}

export async function getCurrentLocation() {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) return null;

  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return location.coords;
  } catch (error) {
    Alert.alert('Error', 'Could not fetch your location. Please try again.');
    console.error(error);
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${GEOAPIFY_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results[0].formatted;
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}

export async function getLocationWithPlaceName() {
  const coords = await getCurrentLocation();
  if (!coords) return { coords: null, placeName: null };

  const placeName = await reverseGeocode(coords.latitude, coords.longitude);
  return { coords, placeName };
}