/** Get the midpoint of a GeoJSON LineString coordinate array */
export function midpoint(coords: number[][]): [number, number] {
  const mid = Math.floor(coords.length / 2);
  const [lon, lat] = coords[mid];
  return [lat, lon];
}

/** Bearing in degrees between two [lon, lat] points, for label rotation */
export function bearing(coords: number[][]): number {
  if (coords.length < 2) return 0;
  const mid = Math.floor(coords.length / 2);
  const i0 = Math.max(0, mid - 1);
  const i1 = Math.min(coords.length - 1, mid + 1);
  const [lon1, lat1] = coords[i0];
  const [lon2, lat2] = coords[i1];
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLon);
  let deg = (Math.atan2(y, x) * 180) / Math.PI;
  // Keep labels readable (avoid upside-down text)
  if (deg > 90) deg -= 180;
  if (deg < -90) deg += 180;
  return deg;
}
