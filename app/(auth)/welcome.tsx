import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/lib/constants';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Hero Image */}
      <ImageBackground
        source={require('../../assets/images/hero-travel.png')}
        style={styles.heroImage}
        resizeMode="cover"
      >
        {/* Gradient overlay at bottom for text readability */}
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.85)', '#FFFFFF']}
          locations={[0, 0.4, 0.75, 1]}
          style={styles.gradient}
        />
      </ImageBackground>

      {/* Bottom Content */}
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>The new way to{'\n'}explore the world</Text>
          <Text style={styles.subtitle}>
            Share your travel adventures, discover hidden gems, and connect with fellow explorers.
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.9}
          >
            <Text style={styles.getStartedText}>Get started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroImage: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.58,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingBottom: 48,
    marginTop: -20,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 23,
    paddingHorizontal: 8,
  },
  buttons: {
    gap: 16,
  },
  getStartedButton: {
    backgroundColor: '#000000',
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
