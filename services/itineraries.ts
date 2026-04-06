import { supabase } from '@/lib/supabase';
import type {
  Itinerary,
  ItineraryInsert,
  ItineraryRating,
  ItineraryRatingInsert,
  Json,
  LocationWithCoordinates,
  ItineraryPreferences,
  ItineraryDay,
  LocationCluster,
  CollaborationRole,
} from '@/types/database';

/** Payload from hooks may include flight estimate before migration 011 is applied */
export type ItineraryInsertWithFlight = ItineraryInsert & {
  estimated_flight_price?: number | null;
};
import {
  clusterLocations,
  optimizeRoute,
  distributeClustersAcrossDays,
  estimateTravelTime,
} from './geolocation';
import { canEditItinerary as checkEditPermission, getUserRoleForItinerary } from './collaborators';

/**
 * Get all itineraries for a user
 */
export async function getUserItineraries(userId: string): Promise<Itinerary[]> {
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single itinerary by ID
 */
export async function getItineraryById(
  itineraryId: string
): Promise<Itinerary | null> {
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('id', itineraryId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}

/**
 * Get user's liked locations for itinerary generation
 */
export async function getUserLikedLocations(
  userId: string
): Promise<LocationWithCoordinates[]> {
  const { data, error } = await supabase
    .from('likes')
    .select(`
      video_id,
      videos:video_id (
        id,
        title,
        location,
        latitude,
        longitude,
        caption,
        description
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;

  return (
    data?.map((like: any) => like.videos).filter(Boolean) || []
  );
}

/**
 * Generate a rule-based itinerary (fallback when LLM is unavailable)
 */
export async function generateRuleBasedItinerary(
  locations: LocationWithCoordinates[],
  preferences: ItineraryPreferences
): Promise<Omit<ItineraryInsert, 'user_id'>> {
  const startTime = Date.now();

  // Validate inputs
  if (locations.length < 3) {
    throw new Error(
      'Please like at least 3 destinations to generate an itinerary.'
    );
  }

  // Cluster locations by proximity
  const clusters = clusterLocations(locations, 15); // 15km radius for clustering

  // Distribute clusters across days
  const daysClusters = distributeClustersAcrossDays(
    clusters,
    preferences.durationDays
  );

  // Generate day-by-day plan
  const days: ItineraryDay[] = daysClusters.map((dayClusters, dayIndex) => {
    const dayActivities: ItineraryDay = {
      day: dayIndex + 1,
      activities: [],
    };

    // Process each cluster in the day
    for (const cluster of dayClusters) {
      // Optimize route within cluster
      const optimizedLocations = optimizeRoute(cluster.locations);

      // Add activities for each location
      for (let i = 0; i < optimizedLocations.length; i++) {
        const loc = optimizedLocations[i];
        const timeSlot = getDefaultTimeSlot(i);
        const duration = getDefaultDuration(loc.caption || loc.description || '');

        dayActivities.activities?.push({
          time: timeSlot,
          activity: `Visit ${loc.title || 'this location'}`,
          location: loc.location || 'Unknown',
          description: loc.caption || loc.description || 'Explore this destination',
          duration,
        });
      }
    }

    return dayActivities;
  });

  const generationTime = Date.now() - startTime;

  return {
    title: `${preferences.durationDays}-Day Trip to ${preferences.destination}`,
    destination: preferences.destination,
    start_date: preferences.startDate || null,
    end_date: preferences.endDate || null,
    duration_days: preferences.durationDays,
    travel_style: preferences.travelStyle || 'mixed',
    budget_level: preferences.budgetLevel || 'moderate',
    generated_by: 'rule_based',
    generation_time_ms: generationTime,
    days,
    metadata: {
      source_video_ids: locations.map((l) => l.id),
      cluster_count: clusters.length,
      location_count: locations.length,
    },
  };
}

/**
 * Save a new itinerary
 */
export async function saveItinerary(
  itinerary: ItineraryInsertWithFlight
): Promise<Itinerary> {
  const { data, error } = await supabase
    .from('itineraries')
    .insert(itinerary as ItineraryInsert)
    .select()
    .single();

  if (
    error?.code === 'PGRST204' &&
    typeof error.message === 'string' &&
    error.message.includes('estimated_flight_price')
  ) {
    const { estimated_flight_price, ...rest } = itinerary;
    let metadata: Json | null | undefined = rest.metadata as Json | null | undefined;
    if (estimated_flight_price != null) {
      const base =
        metadata !== null &&
        metadata !== undefined &&
        typeof metadata === 'object' &&
        !Array.isArray(metadata)
          ? { ...(metadata as Record<string, unknown>) }
          : {};
      metadata = {
        ...base,
        estimated_flight_price_usd: estimated_flight_price,
      } as Json;
    }
    const fallbackInsert = { ...rest, metadata } as ItineraryInsert;
    const retry = await supabase
      .from('itineraries')
      .insert(fallbackInsert)
      .select()
      .single();
    if (retry.error) throw retry.error;
    return retry.data;
  }

  if (error) throw error;
  return data;
}

/**
 * Update an existing itinerary
 */
export async function updateItinerary(
  itineraryId: string,
  updates: Partial<ItineraryInsert>
): Promise<Itinerary> {
  const { data, error } = await supabase
    .from('itineraries')
    .update(updates)
    .eq('id', itineraryId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an itinerary
 */
export async function deleteItinerary(itineraryId: string): Promise<void> {
  const { error } = await supabase
    .from('itineraries')
    .delete()
    .eq('id', itineraryId);

  if (error) throw error;
}

/**
 * Rate an itinerary
 */
export async function rateItinerary(
  itineraryId: string,
  userId: string,
  rating: boolean,
  feedback?: string
): Promise<ItineraryRating> {
  // Check if user already rated this itinerary
  const { data: existing } = await supabase
    .from('itinerary_ratings')
    .select('*')
    .eq('itinerary_id', itineraryId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // Update existing rating
    const { data, error } = await supabase
      .from('itinerary_ratings')
      .update({ rating, feedback })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Insert new rating
    const ratingInsert: ItineraryRatingInsert = {
      itinerary_id: itineraryId,
      user_id: userId,
      rating,
      feedback: feedback || null,
    };

    const { data, error } = await supabase
      .from('itinerary_ratings')
      .insert(ratingInsert)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Get ratings for an itinerary
 */
export async function getItineraryRatings(
  itineraryId: string
): Promise<ItineraryRating[]> {
  const { data, error } = await supabase
    .from('itinerary_ratings')
    .select('*')
    .eq('itinerary_id', itineraryId);

  if (error) throw error;
  return data || [];
}

/**
 * Get itinerary statistics (average rating, total ratings)
 */
export async function getItineraryStats(itineraryId: string) {
  const { data, error } = await supabase
    .from('itinerary_ratings')
    .select('rating')
    .eq('itinerary_id', itineraryId);

  if (error) throw error;

  if (!data || data.length === 0) {
    return { averageRating: null, totalRatings: 0, thumbsUp: 0, thumbsDown: 0 };
  }

  const thumbsUp = data.filter((r) => r.rating).length;
  const thumbsDown = data.filter((r) => !r.rating).length;
  const averageRating = thumbsUp / data.length;

  return {
    averageRating,
    totalRatings: data.length,
    thumbsUp,
    thumbsDown,
  };
}

// Helper functions for rule-based generation

function getDefaultTimeSlot(index: number): string {
  const timeSlots = [
    '9:00 AM',
    '11:00 AM',
    '1:00 PM',
    '3:00 PM',
    '5:00 PM',
    '7:00 PM',
  ];
  return timeSlots[index % timeSlots.length];
}

function getDefaultDuration(description: string): string {
  const lowerDesc = description.toLowerCase();

  // Museum or cultural sites
  if (lowerDesc.includes('museum') || lowerDesc.includes('gallery')) {
    return '2-3 hours';
  }

  // Outdoor activities
  if (lowerDesc.includes('hike') || lowerDesc.includes('park')) {
    return '2-3 hours';
  }

  // Shopping or quick visits
  if (lowerDesc.includes('shop') || lowerDesc.includes('market')) {
    return '1-2 hours';
  }

  // Landmarks and monuments
  if (lowerDesc.includes('tower') || lowerDesc.includes('monument')) {
    return '1-2 hours';
  }

  // Default
  return '1-2 hours';
}

// ============================================
// COLLABORATION FUNCTIONS
// ============================================

/**
 * Get all itineraries accessible to a user (own + shared)
 * @param userId - The user ID
 * @returns Array of itineraries with collaboration info
 */
export async function getAccessibleItineraries(
  userId: string
): Promise<Array<Itinerary & { user_role: 'owner' | 'editor' | 'viewer' }>> {
  // Get user's own itineraries
  const { data: ownItineraries, error: ownError } = await supabase
    .from('itineraries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (ownError) throw ownError;

  // Get shared itineraries with role info
  const { data: sharedData, error: sharedError } = await supabase
    .from('itinerary_collaborators')
    .select(`
      role,
      itineraries!inner(*)
    `)
    .eq('user_id', userId);

  if (sharedError) throw sharedError;

  // Format results
  const ownWithRole = (ownItineraries || []).map((itinerary) => ({
    ...itinerary,
    user_role: 'owner' as const,
  }));

  const sharedWithRole = (sharedData || []).map((item: any) => ({
    ...item.itineraries,
    user_role: item.role as 'editor' | 'viewer',
  }));

  // Combine and sort by updated_at
  return [...ownWithRole, ...sharedWithRole].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

/**
 * Check if a user can edit an itinerary
 * @param itineraryId - The itinerary ID
 * @param userId - The user ID
 * @returns true if user can edit (owner or editor)
 */
export async function canEditItinerary(
  itineraryId: string,
  userId: string
): Promise<boolean> {
  return checkEditPermission(itineraryId, userId);
}

/**
 * Get the user's role for an itinerary
 * @param itineraryId - The itinerary ID
 * @param userId - The user ID
 * @returns 'owner', 'editor', 'viewer', or null
 */
export async function getUserRole(
  itineraryId: string,
  userId: string
): Promise<'owner' | 'editor' | 'viewer' | null> {
  return getUserRoleForItinerary(itineraryId, userId);
}

/**
 * Get itinerary with collaboration metadata
 * @param itineraryId - The itinerary ID
 * @param userId - The current user ID
 * @returns Itinerary with collaborator count and user's role
 */
export async function getItineraryWithCollaborationInfo(
  itineraryId: string,
  userId: string | undefined
): Promise<(Itinerary & {
  collaborator_count: number;
  current_user_role: 'owner' | 'editor' | 'viewer' | null;
}) | null> {
  // Get the itinerary
  const { data: itinerary, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('id', itineraryId)
    .maybeSingle();

  if (error) throw error;
  if (!itinerary) return null;

  // Get collaborator count
  const { count } = await supabase
    .from('itinerary_collaborators')
    .select('*', { count: 'exact', head: true })
    .eq('itinerary_id', itineraryId);

  // Get user's role
  const userRole = userId ? await getUserRole(itineraryId, userId) : null;

  return {
    ...itinerary,
    collaborator_count: count ?? 0,
    current_user_role: userRole,
  };
}
