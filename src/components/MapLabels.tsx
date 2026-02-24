import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { useZoom } from '../hooks/useZoom';
import { midpoint, bearing } from '../utils/geoLabel';
import { getLiftStyle } from '../data/liftStyles';

interface MapLabelsProps {
  geo: GeoJSON.FeatureCollection | null;
}

interface LabelData {
  pos: [number, number];
  name: string;
  ref: string;
  rotation: number;
  isLift: boolean;
  color: string;
}

/** Euclidean path length in degree-space (fine for comparison within one ski area). */
function coordsLength(coords: number[][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i][0] - coords[i - 1][0];
    const dy = coords[i][1] - coords[i - 1][1];
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

/** Extract the longest coordinate array from a feature (LineString or MultiLineString). */
function longestCoords(f: GeoJSON.Feature): number[][] {
  if (f.geometry.type === 'MultiLineString') {
    const arrays = (f.geometry as GeoJSON.MultiLineString).coordinates;
    let best = arrays[0];
    let bestLen = coordsLength(best);
    for (let i = 1; i < arrays.length; i++) {
      const len = coordsLength(arrays[i]);
      if (len > bestLen) {
        best = arrays[i];
        bestLen = len;
      }
    }
    return best;
  }
  return (f.geometry as GeoJSON.LineString).coordinates;
}

/** Total path length across all coordinate arrays in a feature. */
function totalLength(f: GeoJSON.Feature): number {
  if (f.geometry.type === 'MultiLineString') {
    return (f.geometry as GeoJSON.MultiLineString).coordinates.reduce(
      (sum, c) => sum + coordsLength(c), 0,
    );
  }
  return coordsLength((f.geometry as GeoJSON.LineString).coordinates);
}

function makeLabelIcon(name: string, ref: string, rotation: number, color: string): L.DivIcon {
  const refBadge = ref
    ? `<span style="
        background: ${color};
        color: #fff;
        font-size: 9px;
        font-weight: 700;
        padding: 1px 3px;
        border-radius: 3px;
        margin-right: 3px;
      ">${ref}</span>`
    : '';
  return L.divIcon({
    className: '',
    html: `<div style="
      transform: rotate(${rotation.toFixed(1)}deg);
      white-space: nowrap;
      font-size: 11px;
      font-weight: 600;
      color: ${color};
      text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 -1px 0 #fff, 0 1px 0 #fff, -1px 0 0 #fff, 1px 0 0 #fff;
      pointer-events: none;
    ">${refBadge}${name}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 6],
  });
}

export function MapLabels({ geo }: MapLabelsProps) {
  const zoom = useZoom();

  const labels = useMemo(() => {
    if (!geo) return [];

    // Deduplicate: group by (name, ref), pick the feature with the longest total path
    const lineFeatures = geo.features.filter(
      (f) => f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString',
    );

    const bestByKey = new Map<string, GeoJSON.Feature>();
    const bestLength = new Map<string, number>();

    for (const f of lineFeatures) {
      const props = f.properties ?? {};
      const name = props.name;
      if (!name) continue;
      const key = `${name}\0${props.ref || ''}`;
      const len = totalLength(f);
      if (!bestByKey.has(key) || len > bestLength.get(key)!) {
        bestByKey.set(key, f);
        bestLength.set(key, len);
      }
    }

    const result: LabelData[] = [];
    for (const f of bestByKey.values()) {
      const props = f.properties ?? {};
      const isLift = props.type === 'lift';

      let color: string;
      if (isLift) {
        const style = getLiftStyle(props.liftType);
        if (!style.label) continue;
        color = style.color as string;
      } else {
        color = props.color || '#ef4444';
      }

      const coords = longestCoords(f);
      const pos = midpoint(coords);
      const rot = bearing(coords);
      const ref = props.ref || '';
      result.push({ pos, name: props.name, ref, rotation: rot, isLift, color });
    }
    return result;
  }, [geo]);

  if (zoom < 13) return null;

  const visible = zoom >= 14 ? labels : labels.filter((l) => l.isLift);

  return (
    <>
      {visible.map((l, i) => (
        <Marker
          key={`label-${i}`}
          position={l.pos}
          icon={makeLabelIcon(l.name, l.ref, l.rotation, l.color)}
          interactive={false}
        />
      ))}
    </>
  );
}
