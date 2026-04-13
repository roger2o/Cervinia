import type { FeatureCollection, Feature, LineString, MultiLineString } from 'geojson';

interface PisteMatch {
  name: string;
  difficulty: string | null;
}

/**
 * Find the nearest piste to a GPS point using perpendicular distance to polyline segments.
 * Returns null if no piste is within the threshold (75m).
 */
export function identifyPiste(
  point: { lat: number; lon: number },
  geo: FeatureCollection | null,
): PisteMatch | null {
  if (!geo) return null;

  const MAX_DISTANCE = 75; // meters
  let bestDist = Infinity;
  let bestMatch: PisteMatch | null = null;

  for (const feature of geo.features) {
    const props = feature.properties;
    if (!props || props.type !== 'piste') continue;
    if (!props.name) continue;

    const coords = extractCoords(feature);
    if (!coords) continue;

    for (const ring of coords) {
      for (let i = 0; i < ring.length - 1; i++) {
        const dist = pointToSegmentDistance(
          point.lat, point.lon,
          ring[i][1], ring[i][0],     // GeoJSON is [lon, lat]
          ring[i + 1][1], ring[i + 1][0],
        );
        if (dist < bestDist) {
          bestDist = dist;
          bestMatch = { name: props.name, difficulty: props.difficulty ?? null };
        }
      }
    }
  }

  return bestDist <= MAX_DISTANCE ? bestMatch : null;
}

/** Extract coordinate arrays from LineString or MultiLineString geometry. */
function extractCoords(feature: Feature): number[][][] | null {
  const geom = feature.geometry;
  if (geom.type === 'LineString') {
    return [(geom as LineString).coordinates];
  }
  if (geom.type === 'MultiLineString') {
    return (geom as MultiLineString).coordinates;
  }
  return null;
}

/** Distance in meters from a point to a line segment (all in degrees). */
function pointToSegmentDistance(
  pLat: number, pLon: number,
  aLat: number, aLon: number,
  bLat: number, bLon: number,
): number {
  // Project point onto segment using parametric form, then compute haversine distance
  const dx = bLon - aLon;
  const dy = bLat - aLat;
  const lenSq = dx * dx + dy * dy;

  let t = 0;
  if (lenSq > 0) {
    t = Math.max(0, Math.min(1, ((pLon - aLon) * dx + (pLat - aLat) * dy) / lenSq));
  }

  const projLat = aLat + t * dy;
  const projLon = aLon + t * dx;

  return haversine(pLat, pLon, projLat, projLon);
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
