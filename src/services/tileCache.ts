const TILE_CACHE_NAME = 'ski-map-tiles';
const TILE_URL_TEMPLATE = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
const SUBDOMAINS = ['a', 'b', 'c'];

/** Convert lat/lon to tile x/y at a given zoom level */
function latLonToTile(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

/** Get all tile URLs for a bounding box and zoom range */
function getTileUrls(
  bbox: { south: number; west: number; north: number; east: number },
  zoomMin: number,
  zoomMax: number,
): string[] {
  const urls: string[] = [];

  for (let z = zoomMin; z <= zoomMax; z++) {
    const topLeft = latLonToTile(bbox.north, bbox.west, z);
    const bottomRight = latLonToTile(bbox.south, bbox.east, z);

    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        const s = SUBDOMAINS[(x + y) % SUBDOMAINS.length];
        urls.push(TILE_URL_TEMPLATE.replace('{s}', s).replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y)));
      }
    }
  }

  return urls;
}

export interface TileCacheProgress {
  total: number;
  cached: number;
  failed: number;
  done: boolean;
}

/** Count how many tiles would be cached */
export function countTiles(
  bbox: { south: number; west: number; north: number; east: number },
  zoomMin: number,
  zoomMax: number,
): number {
  return getTileUrls(bbox, zoomMin, zoomMax).length;
}

/** Pre-cache map tiles for a bounding box */
export async function cacheTiles(
  bbox: { south: number; west: number; north: number; east: number },
  zoomMin: number,
  zoomMax: number,
  onProgress: (progress: TileCacheProgress) => void,
): Promise<void> {
  const urls = getTileUrls(bbox, zoomMin, zoomMax);
  const total = urls.length;
  let cached = 0;
  let failed = 0;

  onProgress({ total, cached, failed, done: false });

  const cache = await caches.open(TILE_CACHE_NAME);

  // Check which tiles are already cached
  const uncached: string[] = [];
  for (const url of urls) {
    const existing = await cache.match(url);
    if (existing) {
      cached++;
    } else {
      uncached.push(url);
    }
  }
  onProgress({ total, cached, failed, done: uncached.length === 0 });

  if (uncached.length === 0) return;

  // Download in batches of 6 to avoid overwhelming the server
  const BATCH_SIZE = 6;
  for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
    const batch = uncached.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          return true;
        }
        return false;
      }),
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        cached++;
      } else {
        failed++;
      }
    }
    onProgress({ total, cached, failed, done: i + BATCH_SIZE >= uncached.length });
  }
}

/** Check if tiles are cached for an area */
export async function isTileCacheAvailable(): Promise<boolean> {
  try {
    const cache = await caches.open(TILE_CACHE_NAME);
    const keys = await cache.keys();
    return keys.length > 0;
  } catch {
    return false;
  }
}

/** Clear all cached tiles */
export async function clearTileCache(): Promise<void> {
  await caches.delete(TILE_CACHE_NAME);
}
