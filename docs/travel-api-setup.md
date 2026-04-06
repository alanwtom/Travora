# Travel features (geo + flights + maps)

## Environment variables

| Variable | Purpose |
|----------|---------|
| `GEOAPIFY_API_KEY` | Geoapify API key for forward geocoding place names and reverse geocoding the user position (recommended; injected via `app.config.js` → `extra.geoapifyApiKey`). |
| `EXPO_PUBLIC_GEOAPIFY_API_KEY` | Optional fallback read in `services/geoapifySearch.ts` if you prefer the `EXPO_PUBLIC_` prefix. |

Create a key at [Geoapify](https://www.geoapify.com/). Add to `.env` in the project root:

```bash
GEOAPIFY_API_KEY=your_key_here
```

Restart Expo after changing env vars (`npx expo start`).

## Location

The app uses `expo-location` for the user’s coordinates and Geoapify reverse geocoding for a short label. If permission is denied, a **San Francisco** fallback origin is used so mock flight estimates still work.

## Flight prices

`services/flightQuotes.ts` uses **deterministic mock** round-trip USD prices from great-circle distance (see `services/geolocation.ts`). Replace `getFlightQuote` with a real provider (Duffel, Amadeus, Kiwi, etc.) when you have credentials; the rest of the UI and cache keys are structured to swap cleanly.

## Maps

`react-native-maps` is used for route previews and the itinerary map. **Web** shows a placeholder; run on **iOS/Android** (or a dev build) for full maps.

## Google Maps (Android)

If you use Google as the map provider on Android, add your Google Maps SDK key per [Expo maps docs](https://docs.expo.dev/versions/latest/sdk/map-view/).
