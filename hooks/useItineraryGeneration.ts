import { getEstimatedFlightPrice } from '@/services/flightService';
import { generateRuleBasedItinerary, saveItinerary } from '@/services/itineraries';
import { generateItineraryWithLLM, isLLMConfigured } from '@/services/llm';
import { coordinatesToAirportCode, getTravelOrigin } from '@/services/travelOrigin';
import type { Itinerary, ItineraryPreferences, LocationWithCoordinates } from '@/types/database';
import { useCallback, useState } from 'react';

export interface UseItineraryGenerationReturn {
  generate: (preferences: ItineraryPreferences) => Promise<Itinerary | null>;
  itinerary: Itinerary | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  usingFallback: boolean;
  reset: () => void;
}

/**
 * Hook to manage itinerary generation process
 */
export function useItineraryGeneration(
  userId: string | undefined,
  likedLocations: LocationWithCoordinates[]
): UseItineraryGenerationReturn {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);

  /**
   * Get estimated flight price for the itinerary
   */
  const getFlightPriceEstimate = useCallback(async (
    destination: string,
    startDate: string | null
  ): Promise<number | null> => {
    if (!startDate) return null;

    try {
      // Get user's origin location
      const originLocation = await getTravelOrigin();
      const originCode = coordinatesToAirportCode(
        originLocation.latitude,
        originLocation.longitude,
        originLocation.label
      );

      // Convert destination to airport code (simplified - use destination name)
      const destinationCode = coordinatesToAirportCode(0, 0, destination) || 'JFK';

      // Get flight price estimate
      const estimatedPrice = await getEstimatedFlightPrice(
        originCode,
        destinationCode,
        startDate
      );

      return estimatedPrice;
    } catch (error) {
      console.warn('Failed to get flight price estimate:', error);
      return null;
    }
  }, []);

  const generate = useCallback(
    async (preferences: ItineraryPreferences): Promise<Itinerary | null> => {
      if (!userId) {
        setError('User not authenticated');
        return null;
      }

      if (likedLocations.length < 3) {
        setError('Please like at least 3 destinations to generate an itinerary.');
        return null;
      }

      setIsLoading(true);
      setError(null);
      setProgress(0);
      setUsingFallback(false);

      try {
        let resultItinerary;

        // Try LLM generation first if configured
        if (isLLMConfigured()) {
          setProgress(10);

          try {
            const llmResult = await generateItineraryWithLLM(
              likedLocations,
              preferences,
              30000 // 30 second timeout (increased from 10s)
            );

            setProgress(80);

            // Get estimated flight price
            const flightPrice = await getFlightPriceEstimate(
              preferences.destination,
              preferences.startDate ?? null
            );

            // Save LLM-generated itinerary
            resultItinerary = await saveItinerary({
              user_id: userId,
              title: llmResult.title,
              destination: preferences.destination,
              start_date: preferences.startDate || null,
              end_date: preferences.endDate || null,
              duration_days: preferences.durationDays,
              travel_style: preferences.travelStyle || null,
              budget_level: preferences.budgetLevel || null,
              generated_by: 'llm',
              generation_time_ms: llmResult.generationTime,
              days: llmResult.days,
              estimated_flight_price: flightPrice,
              metadata: {
                source_video_ids: likedLocations.map((l) => l.id),
                llm_provider: process.env.EXPO_PUBLIC_LLM_PROVIDER,
              },
            });

            setProgress(100);
          } catch (llmError) {
            console.warn('LLM generation failed, falling back to rule-based:', llmError);
            setUsingFallback(true);
            setProgress(20);

            // Fallback to rule-based generation
            const ruleBasedResult = await generateRuleBasedItinerary(
              likedLocations,
              preferences
            );

            setProgress(80);

            // Get estimated flight price
            const flightPrice = await getFlightPriceEstimate(
              preferences.destination,
              preferences.startDate ?? null
            );

            resultItinerary = await saveItinerary({
              ...ruleBasedResult,
              user_id: userId,
              estimated_flight_price: flightPrice,
            });

            setProgress(100);
          }
        } else {
          // LLM not configured, use rule-based directly
          setUsingFallback(true);
          setProgress(20);

          const ruleBasedResult = await generateRuleBasedItinerary(
            likedLocations,
            preferences
          );

          setProgress(80);

          const flightPrice = await getFlightPriceEstimate(
            preferences.destination,
            preferences.startDate ?? null
          );

          resultItinerary = await saveItinerary({
            ...ruleBasedResult,
            user_id: userId,
            estimated_flight_price: flightPrice,
          });

          setProgress(100);
        }

        setItinerary(resultItinerary);
        return resultItinerary;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to generate itinerary';
        setError(errorMessage);
        setProgress(0);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, likedLocations]
  );

  const reset = useCallback(() => {
    setItinerary(null);
    setError(null);
    setProgress(0);
    setUsingFallback(false);
  }, []);

  return {
    generate,
    itinerary,
    isLoading,
    error,
    progress,
    usingFallback,
    reset,
  };
}
