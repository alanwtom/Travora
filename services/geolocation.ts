import type { LocationWithCoordinates, LocationCluster } from '@/types/database';

// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate the Haversine distance between two coordinates
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Cluster locations by proximity using a simple distance-based algorithm
 * @param locations Array of locations with coordinates
 * @param maxDistance Maximum distance in km for locations to be in same cluster (default: 10km)
 * @returns Array of location clusters
 */
export function clusterLocations(
  locations: LocationWithCoordinates[],
  maxDistance: number = 10
): LocationCluster[] {
  if (!locations.length) return [];

  // Filter out locations without coordinates
  const validLocations = locations.filter(
    (loc) => loc.latitude && loc.longitude
  );

  if (!validLocations.length) {
    // If no valid coordinates, group by location name
    return groupByLocationName(locations);
  }

  const clusters: LocationCluster[] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < validLocations.length; i++) {
    if (assigned.has(i)) continue;

    const currentLoc = validLocations[i];
    const clusterLocations: LocationWithCoordinates[] = [currentLoc];
    assigned.add(i);

    // Find nearby locations
    for (let j = i + 1; j < validLocations.length; j++) {
      if (assigned.has(j)) continue;

      const otherLoc = validLocations[j];
      if (
        otherLoc.latitude &&
        otherLoc.longitude &&
        calculateDistance(
          currentLoc.latitude,
          currentLoc.longitude,
          otherLoc.latitude,
          otherLoc.longitude
        ) <= maxDistance
      ) {
        clusterLocations.push(otherLoc);
        assigned.add(j);
      }
    }

    // Calculate cluster center
    const center = calculateClusterCenter(clusterLocations);

    // Determine cluster name from most common location name
    const clusterName = getClusterName(clusterLocations);

    clusters.push({
      id: `cluster-${clusters.length}`,
      name: clusterName,
      center,
      locations: clusterLocations,
    });
  }

  // Add any locations without coordinates as individual clusters
  const invalidLocations = locations.filter(
    (loc) => !loc.latitude || !loc.longitude
  );
  for (const loc of invalidLocations) {
    clusters.push({
      id: `cluster-${clusters.length}`,
      name: loc.location || 'Unknown Location',
      center: { latitude: 0, longitude: 0 },
      locations: [loc],
    });
  }

  return clusters;
}

/**
 * Group locations by their location name field
 */
function groupByLocationName(
  locations: LocationWithCoordinates[]
): LocationCluster[] {
  const groups = new Map<string, LocationWithCoordinates[]>();

  for (const loc of locations) {
    const name = loc.location || 'Unknown';
    if (!groups.has(name)) {
      groups.set(name, []);
    }
    groups.get(name)!.push(loc);
  }

  return Array.from(groups.entries()).map(([name, locs], index) => ({
    id: `cluster-${index}`,
    name,
    center: { latitude: 0, longitude: 0 },
    locations: locs,
  }));
}

/**
 * Calculate the geographic center of a cluster
 */
function calculateClusterCenter(
  locations: LocationWithCoordinates[]
): { latitude: number; longitude: number } {
  const validLocations = locations.filter(
    (loc) => loc.latitude && loc.longitude
  );

  if (!validLocations.length) {
    return { latitude: 0, longitude: 0 };
  }

  const sumLat = validLocations.reduce(
    (sum, loc) => sum + loc.latitude!,
    0
  );
  const sumLon = validLocations.reduce(
    (sum, loc) => sum + loc.longitude!,
    0
  );

  return {
    latitude: sumLat / validLocations.length,
    longitude: sumLon / validLocations.length,
  };
}

/**
 * Determine the most appropriate name for a cluster
 */
function getClusterName(locations: LocationWithCoordinates[]): string {
  // Count occurrences of each location name
  const nameCounts = new Map<string, number>();
  for (const loc of locations) {
    const name = loc.location || 'Unknown';
    nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
  }

  // Return the most common name
  let maxCount = 0;
  let mostCommon = 'Unknown Location';
  for (const [name, count] of nameCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = name;
    }
  }

  return mostCommon;
}

/**
 * Optimize route using a simple nearest-neighbor algorithm
 * Orders locations to minimize total travel distance
 */
export function optimizeRoute(
  locations: LocationWithCoordinates[]
): LocationWithCoordinates[] {
  if (locations.length <= 1) return locations;

  const validLocations = locations.filter(
    (loc) => loc.latitude && loc.longitude
  );

  if (validLocations.length <= 1) return locations;

  const unvisited = [...validLocations];
  const optimized: LocationWithCoordinates[] = [];
  let current = unvisited.shift()!;

  optimized.push(current);

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const candidate = unvisited[i];
      if (!candidate.latitude || !candidate.longitude) continue;

      const dist = calculateDistance(
        current.latitude!,
        current.longitude!,
        candidate.latitude,
        candidate.longitude
      );

      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = i;
      }
    }

    current = unvisited.splice(nearestIndex, 1)[0];
    optimized.push(current);
  }

  // Add any locations without coordinates at the end
  const invalidLocations = locations.filter(
    (loc) => !loc.latitude || !loc.longitude
  );
  optimized.push(...invalidLocations);

  return optimized;
}

/**
 * Distribute clusters across days for itinerary planning
 * Tries to balance the number of activities per day
 */
export function distributeClustersAcrossDays(
  clusters: LocationCluster[],
  numDays: number
): LocationCluster[][] {
  if (!clusters.length) return Array.from({ length: numDays }, () => []);

  const days: LocationCluster[][] = Array.from({ length: numDays }, () => []);

  // Sort clusters by size (largest first) for better distribution
  const sortedClusters = [...clusters].sort(
    (a, b) => b.locations.length - a.locations.length
  );

  // Assign clusters to days using round-robin
  for (let i = 0; i < sortedClusters.length; i++) {
    const dayIndex = i % numDays;
    days[dayIndex].push(sortedClusters[i]);
  }

  return days;
}

/**
 * Calculate total distance of a route
 */
export function calculateRouteDistance(
  locations: LocationWithCoordinates[]
): number {
  let totalDistance = 0;

  for (let i = 0; i < locations.length - 1; i++) {
    const current = locations[i];
    const next = locations[i + 1];

    if (
      current.latitude &&
      current.longitude &&
      next.latitude &&
      next.longitude
    ) {
      totalDistance += calculateDistance(
        current.latitude,
        current.longitude,
        next.latitude,
        next.longitude
      );
    }
  }

  return totalDistance;
}

/**
 * Estimate travel time between two locations
 * @returns Estimated travel time in minutes
 */
export function estimateTravelTime(distanceKm: number): number {
  // Assume average speed of 30 km/h in urban areas
  const avgSpeedKmH = 30;
  return Math.round((distanceKm / avgSpeedKmH) * 60);
}
