/**
 * Build a routing graph from raw OSM ski data.
 * TypeScript port of data-pipeline/build_graph.py
 */

import type { Graph, GraphNode, GraphEdge, Difficulty } from '../types/graph';
import type { AreaMeta } from '../types/area';
import type { RawData, RawNode, BBox } from './overpassFetcher';

// --- Geo utilities ---

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function polylineLength(nodes: RawNode[]): number {
  let total = 0;
  for (let i = 0; i < nodes.length - 1; i++) {
    total += haversine(nodes[i].lat, nodes[i].lon, nodes[i + 1].lat, nodes[i + 1].lon);
  }
  return total;
}

// --- Difficulty mapping ---

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  novice: 'blue',
  easy: 'blue',
  intermediate: 'red',
  advanced: 'black',
  expert: 'black',
  freeride: 'black',
  unknown: 'red',
};

// --- Station Clustering ---

interface InternalStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevation: number;
  subArea: string;
  _count: number;
}

class StationClusterer {
  private stations: InternalStation[] = [];
  private threshold: number;

  constructor(thresholdM = 200) {
    this.threshold = thresholdM;
  }

  findOrCreate(lat: number, lon: number, nameHint = ''): string {
    for (const station of this.stations) {
      const dist = haversine(lat, lon, station.lat, station.lon);
      if (dist < this.threshold) {
        if (nameHint && (!station.name || station.name.startsWith('Station'))) {
          station.name = nameHint;
        }
        const n = station._count;
        station.lat = (station.lat * n + lat) / (n + 1);
        station.lon = (station.lon * n + lon) / (n + 1);
        station._count = n + 1;
        return station.id;
      }
    }

    const stationId = `station_${this.stations.length}`;
    this.stations.push({
      id: stationId,
      name: nameHint || `Station ${this.stations.length}`,
      lat,
      lon,
      elevation: 0,
      subArea: '',
      _count: 1,
    });
    return stationId;
  }

  getStations(): GraphNode[] {
    return this.stations.map((s) => ({
      id: s.id,
      name: s.name,
      lat: Math.round(s.lat * 1e6) / 1e6,
      lon: Math.round(s.lon * 1e6) / 1e6,
      elevation: s.elevation,
      subArea: s.subArea,
    }));
  }

  getRawStations(): InternalStation[] {
    return this.stations;
  }
}

// --- Sub-area assignment ---

function assignSubArea(_lat: number, lon: number, bbox: BBox, subAreas: string[]): string {
  if (subAreas.length === 0) return 'Main';
  if (subAreas.length === 1) return subAreas[0];

  const sectorWidth = (bbox.east - bbox.west) / subAreas.length;
  const index = Math.max(0, Math.min(subAreas.length - 1, Math.floor((lon - bbox.west) / sectorWidth)));
  return subAreas[index];
}

// --- Connectivity bridging ---

function directedReachable(adjOut: Map<string, Set<string>>, start: string): Set<string> {
  const reached = new Set<string>();
  const queue = [start];
  while (queue.length > 0) {
    const n = queue.pop()!;
    if (reached.has(n)) continue;
    reached.add(n);
    const neighbors = adjOut.get(n);
    if (neighbors) {
      for (const to of neighbors) {
        if (!reached.has(to)) queue.push(to);
      }
    }
  }
  return reached;
}

function bridgeConnectivityGaps(
  stations: GraphNode[],
  edges: GraphEdge[],
  maxRadiusM = 500,
  maxIterations = 50,
): GraphEdge[] {
  const nodeMap = new Map(stations.map((s) => [s.id, s]));
  const newEdges = [...edges];

  // Precompute nearby pairs
  const nearbyPairs: { dist: number; a: string; b: string }[] = [];
  for (let i = 0; i < stations.length; i++) {
    for (let j = i + 1; j < stations.length; j++) {
      const a = stations[i];
      const b = stations[j];
      const d = haversine(a.lat, a.lon, b.lat, b.lon);
      if (d < maxRadiusM) {
        nearbyPairs.push({ dist: d, a: a.id, b: b.id });
      }
    }
  }
  nearbyPairs.sort((x, y) => x.dist - y.dist);

  let totalAdded = 0;

  for (let iter = 0; iter < maxIterations; iter++) {
    const adjOut = new Map<string, Set<string>>();
    const connectedNodes = new Set<string>();
    for (const e of newEdges) {
      connectedNodes.add(e.from);
      connectedNodes.add(e.to);
      if (!adjOut.has(e.from)) adjOut.set(e.from, new Set());
      adjOut.get(e.from)!.add(e.to);
    }

    const reach = new Map<string, Set<string>>();
    for (const nid of connectedNodes) {
      reach.set(nid, directedReachable(adjOut, nid));
    }

    let bestGain = 0;
    let bestPair: { a: string; b: string; dist: number } | null = null;

    for (const { dist, a, b } of nearbyPairs) {
      if (!connectedNodes.has(a) || !connectedNodes.has(b)) continue;

      const aReachesB = reach.get(a)?.has(b) ?? false;
      const bReachesA = reach.get(b)?.has(a) ?? false;
      if (aReachesB && bReachesA) continue;

      let gain = 0;
      if (!aReachesB) {
        let aReachers = 0;
        for (const n of connectedNodes) {
          if (reach.get(n)?.has(a)) aReachers++;
        }
        gain += aReachers * (reach.get(b)?.size ?? 0);
      }
      if (!bReachesA) {
        let bReachers = 0;
        for (const n of connectedNodes) {
          if (reach.get(n)?.has(b)) bReachers++;
        }
        gain += bReachers * (reach.get(a)?.size ?? 0);
      }

      if (gain > bestGain) {
        bestGain = gain;
        bestPair = { a, b, dist };
      }
    }

    if (!bestPair || bestGain === 0) break;

    const aName = nodeMap.get(bestPair.a)?.name ?? bestPair.a;
    const bName = nodeMap.get(bestPair.b)?.name ?? bestPair.b;

    newEdges.push({
      id: `connector_${totalAdded}_ab`,
      from: bestPair.a,
      to: bestPair.b,
      type: 'lift',
      liftType: 'connector',
      name: `Transfer to ${bName}`,
      distance: Math.round(bestPair.dist),
      duration: Math.round((bestPair.dist / 50) * 10) / 10,
      difficulty: null,
    });
    newEdges.push({
      id: `connector_${totalAdded}_ba`,
      from: bestPair.b,
      to: bestPair.a,
      type: 'lift',
      liftType: 'connector',
      name: `Transfer to ${aName}`,
      distance: Math.round(bestPair.dist),
      duration: Math.round((bestPair.dist / 50) * 10) / 10,
      difficulty: null,
    });
    totalAdded++;
  }

  return newEdges;
}

// --- GeoJSON merging ---

interface GeoFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

function filterParallelSegments(members: GeoFeature[], overlapThreshold = 0.5): GeoFeature[] {
  if (members.length <= 1) return members;

  const n = members.length;

  const bboxes: { minLat: number; maxLat: number; minLon: number; maxLon: number }[] = [];
  const lengths: number[] = [];

  for (const m of members) {
    const coords = m.geometry.coordinates as number[][];
    const lats = coords.map((c) => c[1]);
    const lons = coords.map((c) => c[0]);
    bboxes.push({
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLon: Math.min(...lons),
      maxLon: Math.max(...lons),
    });

    let pathLen = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const dlat = coords[i + 1][1] - coords[i][1];
      const dlon = coords[i + 1][0] - coords[i][0];
      pathLen += Math.sqrt(dlat * dlat + dlon * dlon);
    }
    lengths.push(pathLen);
  }

  // Union-find
  const parent = Array.from({ length: n }, (_, i) => i);
  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }
  function union(a: number, b: number): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const latOverlap = Math.max(
        0,
        Math.min(bboxes[i].maxLat, bboxes[j].maxLat) - Math.max(bboxes[i].minLat, bboxes[j].minLat),
      );
      const latSpanSmaller = Math.min(
        bboxes[i].maxLat - bboxes[i].minLat,
        bboxes[j].maxLat - bboxes[j].minLat,
      );
      if (latSpanSmaller <= 0) continue;
      const latRatio = latOverlap / latSpanSmaller;

      const lonOverlap = Math.max(
        0,
        Math.min(bboxes[i].maxLon, bboxes[j].maxLon) - Math.max(bboxes[i].minLon, bboxes[j].minLon),
      );
      const lonSpanSmaller = Math.min(
        bboxes[i].maxLon - bboxes[i].minLon,
        bboxes[j].maxLon - bboxes[j].minLon,
      );
      if (lonSpanSmaller <= 0) continue;
      const lonRatio = lonOverlap / lonSpanSmaller;

      if (latRatio > overlapThreshold && lonRatio > overlapThreshold) {
        union(i, j);
      }
    }
  }

  const clusters = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root)!.push(i);
  }

  const keptIndices: number[] = [];
  for (const indices of clusters.values()) {
    let best = indices[0];
    for (const idx of indices) {
      if (lengths[idx] > lengths[best]) best = idx;
    }
    keptIndices.push(best);
  }

  keptIndices.sort((a, b) => a - b);
  return keptIndices.map((i) => members[i]);
}

function mergeGeoFeatures(geoFeatures: GeoFeature[]): GeoFeature[] {
  const groups = new Map<string, GeoFeature[]>();
  const ungrouped: GeoFeature[] = [];

  for (const f of geoFeatures) {
    const props = f.properties;
    const name = (props.name as string) ?? '';
    if (!name) {
      ungrouped.push(f);
      continue;
    }

    const ftype = (props.type as string) ?? '';
    let key: string;
    if (ftype === 'piste') {
      key = `${name}|piste|${props.difficulty ?? ''}`;
    } else if (ftype === 'lift') {
      key = `${name}|lift|${props.liftType ?? ''}`;
    } else {
      ungrouped.push(f);
      continue;
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }

  const merged: GeoFeature[] = [...ungrouped];

  for (const members of groups.values()) {
    const filtered = filterParallelSegments(members);

    if (filtered.length === 1) {
      merged.push(filtered[0]);
    } else {
      const base: GeoFeature = {
        type: 'Feature',
        properties: { ...filtered[0].properties },
        geometry: {
          type: 'MultiLineString',
          coordinates: filtered.map((m) => m.geometry.coordinates),
        },
      };
      // Pick best ref
      let bestRef = '';
      for (const m of filtered) {
        const r = (m.properties.ref as string) ?? '';
        if (r) {
          bestRef = r;
          break;
        }
      }
      base.properties.ref = bestRef;
      base.properties.id = filtered.map((m) => m.properties.id);
      merged.push(base);
    }
  }

  return merged;
}

// --- Main build function ---

export interface BuildProgress {
  stage: 'clustering' | 'edges' | 'bridging' | 'geo' | 'done';
  message: string;
}

export function buildGraph(
  rawData: RawData,
  areaName: string,
  subAreas: string[] = [],
  clusterThreshold = 200,
  onProgress?: (p: BuildProgress) => void,
): { graph: Graph; geo: GeoJSON.FeatureCollection; meta: AreaMeta } {
  onProgress?.({ stage: 'clustering', message: 'Clustering stations...' });

  const clusterer = new StationClusterer(clusterThreshold);
  const edges: GraphEdge[] = [];
  const geoFeatures: GeoFeature[] = [];

  // Process lifts
  for (const lift of rawData.lifts) {
    if (lift.nodes.length < 2) continue;

    const start = lift.nodes[0];
    const end = lift.nodes[lift.nodes.length - 1];
    const name = lift.name;

    const fromId = clusterer.findOrCreate(start.lat, start.lon, `${name} (bottom)`);
    const toId = clusterer.findOrCreate(end.lat, end.lon, `${name} (top)`);

    const distance = polylineLength(lift.nodes);
    const speedFactor = ['gondola', 'cable_car'].includes(lift.liftType) ? 5.0 : 8.0;
    const duration = (distance / 1000) * speedFactor;

    edges.push({
      id: lift.id,
      from: fromId,
      to: toId,
      type: 'lift',
      liftType: lift.liftType,
      name,
      distance: Math.round(distance),
      duration: Math.round(duration * 10) / 10,
      difficulty: null,
    });

    const ref = lift.tags.ref ?? '';
    geoFeatures.push({
      type: 'Feature',
      properties: {
        id: lift.id,
        name,
        ref,
        type: 'lift',
        liftType: lift.liftType,
      },
      geometry: {
        type: 'LineString',
        coordinates: lift.nodes.map((n) => [n.lon, n.lat]),
      },
    });
  }

  onProgress?.({ stage: 'edges', message: 'Processing pistes...' });

  // Process pistes
  for (const piste of rawData.pistes) {
    if (piste.nodes.length < 2) continue;

    const start = piste.nodes[0];
    const end = piste.nodes[piste.nodes.length - 1];
    const name = piste.name;
    const difficulty = DIFFICULTY_MAP[piste.difficulty] ?? 'red';

    const fromId = clusterer.findOrCreate(start.lat, start.lon, `${name} (top)`);
    const toId = clusterer.findOrCreate(end.lat, end.lon, `${name} (bottom)`);

    const distance = polylineLength(piste.nodes);
    const speedMap: Record<string, number> = { blue: 2.0, red: 1.5, black: 1.0 };
    const duration = (distance / 1000) * (speedMap[difficulty] ?? 1.5);

    edges.push({
      id: piste.id,
      from: fromId,
      to: toId,
      type: 'piste',
      name,
      distance: Math.round(distance),
      duration: Math.round(duration * 10) / 10,
      difficulty,
    });

    const tags = piste.tags;
    const ref = tags.ref ?? tags['piste:ref'] ?? '';
    const colorMap: Record<string, string> = { blue: '#3b82f6', red: '#ef4444', black: '#1f2937' };

    geoFeatures.push({
      type: 'Feature',
      properties: {
        id: piste.id,
        name,
        ref,
        type: 'piste',
        difficulty,
        color: colorMap[difficulty] ?? '#ef4444',
      },
      geometry: {
        type: 'LineString',
        coordinates: piste.nodes.map((n) => [n.lon, n.lat]),
      },
    });
  }

  // Assign sub-areas to stations
  const stations = clusterer.getStations();
  for (const station of stations) {
    station.subArea = assignSubArea(station.lat, station.lon, rawData.bbox, subAreas);
  }

  onProgress?.({ stage: 'bridging', message: 'Bridging connectivity gaps...' });

  // Bridge connectivity gaps
  let finalEdges = bridgeConnectivityGaps(stations, edges, 500, 50);

  // Remove self-loops
  finalEdges = finalEdges.filter((e) => e.from !== e.to);

  const graph: Graph = { nodes: stations, edges: finalEdges };

  onProgress?.({ stage: 'geo', message: 'Building map features...' });

  // Merge geo features
  const mergedGeo = mergeGeoFeatures(geoFeatures);

  // Add station markers
  for (const station of stations) {
    mergedGeo.push({
      type: 'Feature',
      properties: {
        id: station.id,
        name: station.name,
        type: 'station',
        elevation: station.elevation,
        subArea: station.subArea ?? '',
      },
      geometry: {
        type: 'Point',
        coordinates: [station.lon, station.lat],
      },
    });
  }

  const geo: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: mergedGeo as GeoJSON.Feature[],
  };

  const meta: AreaMeta = {
    id: rawData.area,
    name: areaName,
    bbox: rawData.bbox,
    center: [
      (rawData.bbox.south + rawData.bbox.north) / 2,
      (rawData.bbox.west + rawData.bbox.east) / 2,
    ],
    subAreas: subAreas.length > 0 ? subAreas : ['Main'],
    stats: {
      stations: stations.length,
      lifts: finalEdges.filter((e) => e.type === 'lift').length,
      pistes: finalEdges.filter((e) => e.type === 'piste').length,
      bluePistes: finalEdges.filter((e) => e.difficulty === 'blue').length,
      redPistes: finalEdges.filter((e) => e.difficulty === 'red').length,
      blackPistes: finalEdges.filter((e) => e.difficulty === 'black').length,
    },
    fetchedAt: rawData.fetchedAt,
    builtAt: new Date().toISOString(),
  };

  onProgress?.({ stage: 'done', message: 'Graph built successfully' });

  return { graph, geo, meta };
}
