import { useState, useCallback } from 'react';
import type { Itinerary, ItineraryPreferences, LocationWithCoordinates } from '@/types/database';
import { generateRuleBasedItinerary, saveItinerary } from '@/services/itineraries';
import { generateItineraryWithLLM, isLLMConfigured } from '@/services/llm';

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
              10000 // 10 second timeout
            );

            setProgress(80);

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

            resultItinerary = await saveItinerary({
              ...ruleBasedResult,
              user_id: userId,
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

          resultItinerary = await saveItinerary({
            ...ruleBasedResult,
            user_id: userId,
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
