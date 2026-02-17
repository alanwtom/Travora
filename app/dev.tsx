/**
 * Development Testing Screen
 * 
 * This screen provides quick access to development utilities for testing,
 * including seeding mock videos for testing the feed, likes, saves, and comments.
 * 
 * This file is only used during development and should not be included in production builds.
 */

import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { MOCK_VIDEOS_DATA, seedMockVideos } from '@/utils/mockVideos';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function DevelopmentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedCount, setSeedCount] = useState(8);

  const handleSeedMockVideos = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to seed videos');
      return;
    }

    Alert.alert(
      'Create Mock Videos',
      `This will create ${seedCount} mock travel videos for testing. Continue?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Create',
          onPress: async () => {
            try {
              setIsSeeding(true);
              const createdVideos = await seedMockVideos(user.id, seedCount);
              Alert.alert(
                'Success',
                `✅ Created ${createdVideos.length} mock video${createdVideos.length !== 1 ? 's' : ''}!\n\nYou can now test the feed, likes, saves, and comments functionality.`
              );
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setIsSeeding(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <FontAwesome name="chevron-left" size={24} color={COLORS.primary} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <FontAwesome name="flask" size={32} color={COLORS.primary} />
        <Text style={styles.title}>Development Tools</Text>
        <Text style={styles.subtitle}>⚠️ For development testing only</Text>
      </View>

      {/* User Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current User</Text>
        <Text style={styles.cardText}>
          {user ? user.email : 'Not logged in'}
        </Text>
      </View>

      {/* Mock Videos Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📹 Mock Videos Generator</Text>
        <Text style={styles.cardDescription}>
          Create realistic travel video data for testing the feed, likes, saves, and comments functionality.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Number of videos:</Text>
          <View style={styles.counterControls}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setSeedCount(Math.max(1, seedCount - 1))}
            >
              <Text style={styles.counterButtonText}>−</Text>
            </TouchableOpacity>
            <View style={styles.counterDisplay}>
              <Text style={styles.counterText}>{seedCount}</Text>
            </View>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setSeedCount(Math.min(MOCK_VIDEOS_DATA.length, seedCount + 1))}
            >
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.counterInfo}>
            Max: {MOCK_VIDEOS_DATA.length} videos available
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, isSeeding && styles.buttonDisabled]}
          onPress={handleSeedMockVideos}
          disabled={isSeeding}
        >
          {isSeeding ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <FontAwesome name="plus" size={16} color="#FFF" />
              <Text style={styles.buttonText}>Create Mock Videos</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <FontAwesome name="info-circle" size={16} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Mock videos include realistic travel locations, descriptions, captions, and placeholder images. They're created under your account.
          </Text>
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔗 Quick Links</Text>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => Linking.openURL('https://supabase.com')}
        >
          <FontAwesome name="database" size={16} color={COLORS.primary} />
          <Text style={styles.linkText}>Supabase Dashboard</Text>
        </TouchableOpacity>
      </View>

      {/* Features to Test */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>✅ What You Can Test</Text>
        <View style={styles.featuresList}>
          <View style={styles.feature}>
            <FontAwesome name="check" size={14} color={COLORS.success} />
            <Text style={styles.featureText}>Feed pagination and loading</Text>
          </View>
          <View style={styles.feature}>
            <FontAwesome name="check" size={14} color={COLORS.success} />
            <Text style={styles.featureText}>Like/unlike functionality</Text>
          </View>
          <View style={styles.feature}>
            <FontAwesome name="check" size={14} color={COLORS.success} />
            <Text style={styles.featureText}>Save/unsave videos</Text>
          </View>
          <View style={styles.feature}>
            <FontAwesome name="check" size={14} color={COLORS.success} />
            <Text style={styles.featureText}>Comments functionality</Text>
          </View>
          <View style={styles.feature}>
            <FontAwesome name="check" size={14} color={COLORS.success} />
            <Text style={styles.featureText}>Profile and user stats</Text>
          </View>
          <View style={styles.feature}>
            <FontAwesome name="check" size={14} color={COLORS.success} />
            <Text style={styles.featureText}>Video details and metadata</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Tip: Use the profile page to view and manage your test videos.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  cardText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: 'monospace',
  },
  section: {
    gap: 12,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  counterDisplay: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  counterText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  counterInfo: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  featuresList: {
    gap: 10,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
