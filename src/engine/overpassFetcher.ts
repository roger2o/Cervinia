/**
 * Fetch ski pistes and lifts from OpenStreetMap via Overpass API.
 * TypeScript port of data-pipeline/fetch_osm.py
 */

export interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface RawNode {
  lat: number;
  lon: number;
}

export interface RawPiste {
  id: string;
  osmId: number;
  type: 'piste';
  name: string;
  difficulty: string;
  nodes: RawNode[];
  tags: Record<string, string>;
}

export interface RawLift {
  id: string;
  osmId: number;
  type: 'lift';
  liftType: string;
  name: string;
  nodes: RawNode[];
  tags: Record<string, string>;
}

export interface RawData {
  area: string;
  bbox: BBox;
  fetchedAt: string;
  pistes: RawPiste[];
  lifts: RawLift[];
}

export interface FetchProgress {
  stage: 'searching' | 'pistes' | 'lifts' | 'done';
  message: string;
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

async function overpassQuery(query: string): Promise<unknown> {
  // Use GET with encoded query — more reliable with CORS and caching
  const url = `${OVERPASS_URL}?data=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
  if (!res.ok) {
    throw new Error(`Overpass API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

interface OverpassElement {
  type: string;
  id: number;
  nodes?: number[];
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
}

interface OverpassResult {
  elements: OverpassElement[];
}

function resolveWayNodes(
  ways: OverpassElement[],
  nodeMap: Map<number, { lat: number; lon: number }>,
): Map<number, RawNode[]> {
  const result = new Map<number, RawNode[]>();
  for (const way of ways) {
    if (!way.nodes) continue;
    const nodes: RawNode[] = [];
    for (const nodeId of way.nodes) {
      const n = nodeMap.get(nodeId);
      if (n) nodes.push({ lat: n.lat, lon: n.lon });
    }
    result.set(way.id, nodes);
  }
  return result;
}

export async function fetchPistes(
  bbox: BBox,
  onProgress?: (p: FetchProgress) => void,
): Promise<RawPiste[]> {
  onProgress?.({ stage: 'pistes', message: 'Fetching pistes from OpenStreetMap...' });

  const query = `
    [out:json][timeout:120];
    (
      way["piste:type"="downhill"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    );
    out body;
    >;
    out skel qt;
  `;

  const data = (await overpassQuery(query)) as OverpassResult;

  const nodeMap = new Map<number, { lat: number; lon: number }>();
  const ways: OverpassElement[] = [];

  for (const el of data.elements) {
    if (el.type === 'node' && el.lat != null && el.lon != null) {
      nodeMap.set(el.id, { lat: el.lat, lon: el.lon });
    } else if (el.type === 'way') {
      ways.push(el);
    }
  }

  const wayNodes = resolveWayNodes(ways, nodeMap);

  const pistes: RawPiste[] = [];
  for (const way of ways) {
    const nodes = wayNodes.get(way.id);
    if (!nodes || nodes.length < 2) continue;

    const tags = way.tags ?? {};
    const difficulty = tags['piste:difficulty'] ?? 'unknown';
    const name = tags.name ?? tags['piste:name'] ?? '';

    pistes.push({
      id: `piste_${way.id}`,
      osmId: way.id,
      type: 'piste',
      name,
      difficulty,
      nodes,
      tags,
    });
  }

  onProgress?.({ stage: 'pistes', message: `Found ${pistes.length} pistes` });
  return pistes;
}

export async function fetchLifts(
  bbox: BBox,
  onProgress?: (p: FetchProgress) => void,
): Promise<RawLift[]> {
  onProgress?.({ stage: 'lifts', message: 'Fetching lifts from OpenStreetMap...' });

  const query = `
    [out:json][timeout:120];
    (
      way["aerialway"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    );
    out body;
    >;
    out skel qt;
  `;

  const data = (await overpassQuery(query)) as OverpassResult;

  const nodeMap = new Map<number, { lat: number; lon: number }>();
  const ways: OverpassElement[] = [];

  for (const el of data.elements) {
    if (el.type === 'node' && el.lat != null && el.lon != null) {
      nodeMap.set(el.id, { lat: el.lat, lon: el.lon });
    } else if (el.type === 'way') {
      ways.push(el);
    }
  }

  const wayNodes = resolveWayNodes(ways, nodeMap);
  const skipTypes = new Set(['pylon', 'station']);

  const lifts: RawLift[] = [];
  for (const way of ways) {
    const tags = way.tags ?? {};
    const aerialwayType = tags.aerialway ?? '';
    if (skipTypes.has(aerialwayType)) continue;

    const nodes = wayNodes.get(way.id);
    if (!nodes || nodes.length < 2) continue;

    const name = tags.name ?? '';

    lifts.push({
      id: `lift_${way.id}`,
      osmId: way.id,
      type: 'lift',
      liftType: aerialwayType,
      name,
      nodes,
      tags,
    });
  }

  onProgress?.({ stage: 'lifts', message: `Found ${lifts.length} lifts` });
  return lifts;
}

export async function fetchArea(
  areaId: string,
  bbox: BBox,
  onProgress?: (p: FetchProgress) => void,
): Promise<RawData> {
  onProgress?.({ stage: 'pistes', message: 'Fetching pistes and lifts from OpenStreetMap...' });

  // Single combined query for both pistes and lifts to avoid rate limiting
  const query = `[out:json][timeout:120];(way["piste:type"="downhill"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});way["aerialway"](${bbox.south},${bbox.west},${bbox.north},${bbox.east}););out body;>;out skel qt;`;

  const data = (await overpassQuery(query)) as OverpassResult;

  const nodeMap = new Map<number, { lat: number; lon: number }>();
  const ways: OverpassElement[] = [];

  for (const el of data.elements) {
    if (el.type === 'node' && el.lat != null && el.lon != null) {
      nodeMap.set(el.id, { lat: el.lat, lon: el.lon });
    } else if (el.type === 'way') {
      ways.push(el);
    }
  }

  const wayNodes = resolveWayNodes(ways, nodeMap);
  const skipLiftTypes = new Set(['pylon', 'station']);

  const pistes: RawPiste[] = [];
  const lifts: RawLift[] = [];

  for (const way of ways) {
    const tags = way.tags ?? {};
    const nodes = wayNodes.get(way.id);
    if (!nodes || nodes.length < 2) continue;

    if (tags['piste:type'] === 'downhill') {
      const difficulty = tags['piste:difficulty'] ?? 'unknown';
      const name = tags.name ?? tags['piste:name'] ?? '';
      pistes.push({
        id: `piste_${way.id}`,
        osmId: way.id,
        type: 'piste',
        name,
        difficulty,
        nodes,
        tags,
      });
    } else if (tags.aerialway && !skipLiftTypes.has(tags.aerialway)) {
      const name = tags.name ?? '';
      lifts.push({
        id: `lift_${way.id}`,
        osmId: way.id,
        type: 'lift',
        liftType: tags.aerialway,
        name,
        nodes,
        tags,
      });
    }
  }

  onProgress?.({ stage: 'lifts', message: `Found ${pistes.length} pistes and ${lifts.length} lifts` });

  return {
    area: areaId,
    bbox,
    fetchedAt: new Date().toISOString(),
    pistes,
    lifts,
  };
}

/** Search for ski areas matching a name query. Returns candidate areas with bbox. */
export interface SkiAreaResult {
  id: string;
  name: string;
  bbox: BBox;
  center: [number, number];
}

interface SkiAreaEntry {
  name: string;
  bbox: BBox;
  center: [number, number];
}

let skiAreaIndex: SkiAreaEntry[] | null = null;

async function loadSkiAreaIndex(): Promise<SkiAreaEntry[]> {
  if (skiAreaIndex) return skiAreaIndex;
  const res = await fetch('/data/ski-areas.json');
  if (!res.ok) throw new Error('Failed to load ski area index');
  skiAreaIndex = await res.json();
  return skiAreaIndex!;
}

export async function searchSkiAreas(
  query: string,
  onProgress?: (p: FetchProgress) => void,
): Promise<SkiAreaResult[]> {
  onProgress?.({ stage: 'searching', message: `Searching for "${query}"...` });

  const index = await loadSkiAreaIndex();
  const lower = query.toLowerCase();

  const matches = index
    .filter((a) => a.name.toLowerCase().includes(lower))
    .slice(0, 20)
    .map((a) => ({
      id: a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      name: a.name,
      bbox: a.bbox,
      center: a.center,
    }));

  onProgress?.({ stage: 'done', message: `Found ${matches.length} ski areas` });
  return matches;
}
