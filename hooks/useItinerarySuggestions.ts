import { useMemo } from 'react';
import type { LocationWithCoordinates, LocationCluster, ItinerarySuggestion } from '@/types/database';

const STYLE_KEYWORDS: Record<string, string[]> = {
  adventure: ['hike', 'mountain', 'surf', 'climb', 'trek', 'dive', 'adventure', 'kayak', 'raft', 'bike', 'trail', 'camp', 'zip', 'paraglid'],
  relaxation: ['beach', 'spa', 'resort', 'relax', 'pool', 'island', 'massage', 'yoga', 'retreat', 'sun', 'lounge', 'hammock'],
  cultural: ['museum', 'temple', 'history', 'historic', 'heritage', 'ancient', 'castle', 'palace', 'ruins', 'monument', 'cathedral', 'church', 'mosque', 'art gallery'],
  foodie: ['food', 'restaurant', 'market', 'cuisine', 'cook', 'taste', 'street food', 'wine', 'brewery', 'cafe', 'bakery', 'dining', 'tapas'],
};

const BUDGET_KEYWORDS: Record<string, string[]> = {
  budget: ['hostel', 'backpack', 'free', 'cheap', 'budget', 'street', 'local', 'public'],
  luxury: ['luxury', 'resort', 'premium', 'five star', '5 star', 'vip', 'private', 'exclusive', 'penthouse', 'boutique'],
};

const INTEREST_KEYWORDS: Record<string, string[]> = {
  'Museums': ['museum', 'gallery', 'exhibition', 'collection'],
  'Food': ['food', 'restaurant', 'market', 'cuisine', 'cook', 'cafe', 'bakery', 'dining'],
  'Nightlife': ['night', 'club', 'bar', 'party', 'live music', 'cocktail', 'pub'],
  'Nature': ['nature', 'park', 'garden', 'forest', 'waterfall', 'lake', 'mountain', 'hike', 'trail', 'beach', 'ocean', 'reef'],
  'Shopping': ['shop', 'market', 'mall', 'boutique', 'store', 'souvenir', 'bazaar'],
  'History': ['history', 'historic', 'ancient', 'ruins', 'heritage', 'monument', 'castle', 'temple', 'war'],
  'Art': ['art', 'gallery', 'mural', 'sculpture', 'painting', 'street art', 'design'],
};

function inferTravelStyle(locs: LocationWithCoordinates[]): ItinerarySuggestion['inferredTravelStyle'] {
  const text = locs
    .map((l) => `${l.title || ''} ${l.caption || ''} ${l.description || ''} ${l.location || ''}`.toLowerCase())
    .join(' ');

  let bestStyle = 'mixed';
  let bestCount = 0;

  for (const [style, keywords] of Object.entries(STYLE_KEYWORDS)) {
    const count = keywords.filter((kw) => text.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      bestStyle = style;
    }
  }

  return bestStyle as ItinerarySuggestion['inferredTravelStyle'];
}

function inferBudgetLevel(locs: LocationWithCoordinates[]): ItinerarySuggestion['inferredBudgetLevel'] {
  const text = locs
    .map((l) => `${l.title || ''} ${l.caption || ''} ${l.description || ''} ${l.location || ''}`.toLowerCase())
    .join(' ');

  for (const [level, keywords] of Object.entries(BUDGET_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return level as ItinerarySuggestion['inferredBudgetLevel'];
    }
  }

  return 'moderate';
}

function inferInterests(locs: LocationWithCoordinates[]): string[] {
  const text = locs
    .map((l) => `${l.title || ''} ${l.caption || ''} ${l.description || ''} ${l.location || ''}`.toLowerCase())
    .join(' ');

  const matched: string[] = [];
  for (const [interest, keywords] of Object.entries(INTEREST_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      matched.push(interest);
    }
  }

  return matched;
}

export function useItinerarySuggestions(
  locations: LocationWithCoordinates[],
  clusters: LocationCluster[]
): ItinerarySuggestion[] {
  return useMemo(() => {
    const MIN_LOCATIONS = 3;
    const MAX_SUGGESTIONS = 5;

    const eligible = clusters.filter((c) => c.locations.length >= MIN_LOCATIONS);

    const suggestions: ItinerarySuggestion[] = eligible.map((cluster) => ({
      id: cluster.id,
      destinationName: cluster.name,
      locationCount: cluster.locations.length,
      locations: cluster.locations,
      center: cluster.center,
      inferredTravelStyle: inferTravelStyle(cluster.locations),
      inferredBudgetLevel: inferBudgetLevel(cluster.locations),
      recommendedDuration: Math.min(14, Math.max(1, Math.ceil(cluster.locations.length / 3))),
      inferredInterests: inferInterests(cluster.locations),
    }));

    // Sort by location count descending, cap at MAX_SUGGESTIONS
    return suggestions
      .sort((a, b) => b.locationCount - a.locationCount)
      .slice(0, MAX_SUGGESTIONS);
  }, [locations, clusters]);
}
