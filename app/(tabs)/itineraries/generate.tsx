import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import type { ItineraryPreferences } from '@/types/database';
import { useItineraryGeneration } from '@/hooks/useItineraryGeneration';
import { useLikedLocations } from '@/hooks/useLikedLocations';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const TRAVEL_STYLES = ['Adventure', 'Relaxation', 'Cultural', 'Foodie', 'Mixed'] as const;
const BUDGET_LEVELS = ['Budget', 'Moderate', 'Luxury'] as const;
const INTEREST_OPTIONS = ['Museums', 'Food', 'Nightlife', 'Nature', 'Shopping', 'History', 'Art'] as const;

export default function GenerateItineraryScreen() {
  const { user } = useAuth();
  const { locations, isLoading: loadingLocations } = useLikedLocations(user?.id);
  const {
    generate,
    itinerary,
    isLoading: generating,
    error,
    progress,
    usingFallback,
  } = useItineraryGeneration(user?.id, locations);

  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('3');
  const [travelStyle, setTravelStyle] = useState<string | null>(null);
  const [budgetLevel, setBudgetLevel] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);

  const isFormValid = destination.trim().length > 0 && parseInt(duration) >= 1 && parseInt(duration) <= 14;
  const hasEnoughLocations = locations.length >= 3;

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleGenerate = async () => {
    if (!isFormValid) {
      Alert.alert('Invalid Input', 'Please enter a destination and duration (1-14 days)');
      return;
    }

    if (!hasEnoughLocations) {
      Alert.alert(
        'Not Enough Destinations',
        'Please like at least 3 destinations to generate an itinerary. Go to the Explore tab to discover more places!',
        [
          { text: 'Cancel' },
          { text: 'Explore', onPress: () => router.push('/explore') },
        ]
      );
      return;
    }

    const preferences: ItineraryPreferences = {
      destination: destination.trim(),
      durationDays: parseInt(duration),
      travelStyle: (travelStyle?.toLowerCase() as any) || undefined,
      budgetLevel: (budgetLevel?.toLowerCase() as any) || undefined,
      interests: interests.length > 0 ? interests : undefined,
    };

    const result = await generate(preferences);

    if (result) {
      router.push({
        pathname: '/itineraries/[id]',
        params: { id: result.id },
      });
    }
  };

  if (loadingLocations) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={20} color={COLORS.text} />
        </Pressable>
        <Text style={styles.title}>Generate Itinerary</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Liked Locations Info */}
      <View style={styles.locationsInfoCard}>
        <FontAwesome name="heart" size={16} color={COLORS.error} />
        <Text style={styles.locationsInfoText}>
          {locations.length} destination{locations.length !== 1 ? 's' : ''} liked
        </Text>
        {!hasEnoughLocations && (
          <Text style={styles.locationsInfoWarning}>
            {' '}(need 3+ to generate)
          </Text>
        )}
      </View>

      {generating ? (
        /* Generation Progress */
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.progressTitle}>Creating Your Itinerary</Text>
          {usingFallback && (
            <View style={styles.fallbackBadge}>
              <FontAwesome name="cogs" size={14} color={COLORS.textMuted} />
              <Text style={styles.fallbackText}>Using Smart Matching</Text>
            </View>
          )}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}% complete</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Generation Form */
        <>
          {/* Destination */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Destination *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Paris, Tokyo, New York"
              placeholderTextColor={COLORS.textMuted}
              value={destination}
              onChangeText={setDestination}
              autoCapitalize="words"
            />
          </View>

          {/* Duration */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Duration (Days) *</Text>
            <View style={styles.durationContainer}>
              <TouchableOpacity
                style={styles.durationButton}
                onPress={() => setDuration(Math.max(1, parseInt(duration) - 1).toString())}
              >
                <FontAwesome name="minus" size={16} color={COLORS.primary} />
              </TouchableOpacity>
              <TextInput
                style={styles.durationInput}
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                maxLength={2}
                textAlign="center"
              />
              <TouchableOpacity
                style={styles.durationButton}
                onPress={() => setDuration(Math.min(14, parseInt(duration) + 1).toString())}
              >
                <FontAwesome name="plus" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Travel Style */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Travel Style (Optional)</Text>
            <View style={styles.segmentContainer}>
              {TRAVEL_STYLES.map((style) => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.segmentButton,
                    travelStyle === style && styles.segmentButtonActive,
                  ]}
                  onPress={() => setTravelStyle(travelStyle === style ? null : style)}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      travelStyle === style && styles.segmentButtonTextActive,
                    ]}
                  >
                    {style}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Budget Level */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Budget Level (Optional)</Text>
            <View style={styles.segmentContainer}>
              {BUDGET_LEVELS.map((budget) => (
                <TouchableOpacity
                  key={budget}
                  style={[
                    styles.segmentButton,
                    budgetLevel === budget && styles.segmentButtonActive,
                  ]}
                  onPress={() => setBudgetLevel(budgetLevel === budget ? null : budget)}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      budgetLevel === budget && styles.segmentButtonTextActive,
                    ]}
                  >
                    {budget}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Interests */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Special Interests (Optional)</Text>
            <View style={styles.interestsContainer}>
              {INTEREST_OPTIONS.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestTag,
                    interests.includes(interest) && styles.interestTagActive,
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <FontAwesome
                    name={interests.includes(interest) ? 'check' : 'plus'}
                    size={12}
                    color={interests.includes(interest) ? 'white' : COLORS.primary}
                  />
                  <Text
                    style={[
                      styles.interestTagText,
                      interests.includes(interest) && styles.interestTagTextActive,
                    ]}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorCard}>
              <FontAwesome name="exclamation-circle" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Generate Button */}
          <TouchableOpacity
            style={[
              styles.generateButton,
              (!isFormValid || !hasEnoughLocations) && styles.generateButtonDisabled,
            ]}
            onPress={handleGenerate}
            disabled={!isFormValid || !hasEnoughLocations}
          >
            <FontAwesome name="magic" size={18} color="white" />
            <Text style={styles.generateButtonText}>Generate Itinerary</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholder: {
    width: 36,
  },
  locationsInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationsInfoText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  locationsInfoWarning: {
    fontSize: 14,
    color: COLORS.warning,
  },
  progressContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  fallbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 24,
  },
  fallbackText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 24,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  durationButton: {
    padding: 12,
  },
  durationInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  segmentContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  segmentButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  segmentButtonTextActive: {
    color: 'white',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  interestTagActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  interestTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.primary,
  },
  interestTagTextActive: {
    color: 'white',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '10',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
    marginLeft: 8,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
