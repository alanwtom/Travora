export default {
  expo: {
    // Paste everything from your old app.json here, exactly as it was.
    name: "Travora",
    slug: "travora",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/travora-logo.png",
    scheme: "travora",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0EA5E9",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.travora.app",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Travora uses your location to tag your videos with where they were taken.",
        NSCameraUsageDescription: "Travora needs camera access to record videos.",
        NSMicrophoneUsageDescription: "Travora needs microphone access to record audio with videos.",
        NSPhotoLibraryUsageDescription: "Travora needs access to your photo library to upload videos.",
        NSPhotoLibraryAddUsageDescription: "Travora needs to save videos to your photo library.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/travora-logo.png",
        backgroundColor: "#0EA5E9",
      },
      edgeToEdgeEnabled: true,
      package: "com.travora.app",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
      ],
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/favicon.png",
    },
    plugins: ["expo-router"],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: "travora",
      },
      // NEW: Add your Geoapify key here
      geoapifyApiKey: process.env.GEOAPIFY_API_KEY,
      // OpenRouter: plain OPENROUTER_API_KEY is not visible to Metro; inject here so the app can read it via expo-constants
      openrouterApiKey:
        process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ||
        process.env.OPENROUTER_API_KEY ||
        "",
      openrouterModel: process.env.EXPO_PUBLIC_OPENROUTER_MODEL || "",
    },
  },
};
