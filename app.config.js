export default {
  expo: {
    // Paste everything from your old app.json here, exactly as it was.
    name: "Travora",
    slug: "travora",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
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
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#0EA5E9",
      },
      edgeToEdgeEnabled: true,
      package: "com.travora.app",
      permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
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
    },
  },
};
