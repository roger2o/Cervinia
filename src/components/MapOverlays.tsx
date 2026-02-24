import { GeoJSON, CircleMarker, Tooltip, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Feature, GeoJsonProperties, Geometry } from 'geojson';
import type { PathOptions } from 'leaflet';
import type { RouteResult } from '../types/route';
import { DIFFICULTY_ROUTE_COLORS } from '../data/difficultyMap';

interface MapOverlaysProps {
  geo: GeoJSON.FeatureCollection | null;
  route: RouteResult | null;
  onStationClick: (stationId: string) => void;
  selectedStepIndex: number | null;
  closedEdgeIds: Set<string>;
}

function pisteStyle(feature: Feature<Geometry, GeoJsonProperties> | undefined): PathOptions {
  if (!feature) return {};
  const props = feature.properties ?? {};

  if (props.type === 'lift') {
    return {
      color: '#6b7280',
      weight: 2,
      dashArray: '8 4',
      opacity: 0.8,
    };
  }

  return {
    color: props.color || '#ef4444',
    weight: 3,
    opacity: 0.7,
  };
}

function makeStopIcon(index: number): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:#1e40af;color:white;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:bold;
      border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);
    ">${index}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export function MapOverlays({ geo, route, onStationClick, selectedStepIndex, closedEdgeIds }: MapOverlaysProps) {
  if (!geo) return null;

  const lines = geo.features.filter((f) => f.geometry.type === 'LineString');
  const stations = geo.features.filter(
    (f) => f.geometry.type === 'Point' && f.properties?.type === 'station',
  );

  // Build a lookup from edge ID to geo coordinates
  const linesByEdgeId = new Map<string, [number, number][]>();
  for (const f of lines) {
    const id = f.properties?.id;
    if (id && f.geometry.type === 'LineString') {
      linesByEdgeId.set(
        id,
        (f.geometry as GeoJSON.LineString).coordinates.map(([lon, lat]) => [lat, lon] as [number, number]),
      );
    }
  }

  // Compute route segments
  const routeSegments = route
    ? route.steps.map((step, i) => {
        const coords = linesByEdgeId.get(step.edge.id) ?? [
          [step.fromNode.lat, step.fromNode.lon] as [number, number],
          [step.toNode.lat, step.toNode.lon] as [number, number],
        ];
        const isLift = step.edge.type === 'lift';
        const isClosed = closedEdgeIds.has(step.edge.id);
        const isSelected = selectedStepIndex === i;
        const color = isClosed
          ? '#9ca3af'
          : isLift
            ? '#6b7280'
            : step.edge.difficulty
              ? DIFFICULTY_ROUTE_COLORS[step.edge.difficulty]
              : '#f59e0b';
        return { coords, color, isLift, isSelected, isClosed, step, index: i };
      })
    : [];

  // Collect unique stop positions along route (ordered station nodes)
  const stopMarkers: { lat: number; lon: number; index: number; name: string }[] = [];
  if (route && route.steps.length > 0) {
    stopMarkers.push({
      lat: route.steps[0].fromNode.lat,
      lon: route.steps[0].fromNode.lon,
      index: 1,
      name: route.steps[0].fromNode.name,
    });
    route.steps.forEach((step, i) => {
      stopMarkers.push({
        lat: step.toNode.lat,
        lon: step.toNode.lon,
        index: i + 2,
        name: step.toNode.name,
      });
    });
  }

  // Closed edge midpoint markers
  const closedMarkers: { lat: number; lon: number; name: string }[] = [];
  if (route) {
    for (const seg of routeSegments) {
      if (seg.isClosed && seg.coords.length > 0) {
        const mid = seg.coords[Math.floor(seg.coords.length / 2)];
        closedMarkers.push({ lat: mid[0], lon: mid[1], name: seg.step.edge.name });
      }
    }
  }

  return (
    <>
      {/* Base pistes and lifts */}
      <GeoJSON
        key={`base-geo-${lines.length}-${lines[0]?.properties?.id ?? ''}`}
        data={{ type: 'FeatureCollection', features: lines } as GeoJSON.FeatureCollection}
        style={pisteStyle}
      />

      {/* Route segments as individual Polylines */}
      {routeSegments.map((seg) => (
        <Polyline
          key={`route-seg-${seg.index}`}
          positions={seg.coords}
          pathOptions={{
            color: seg.color,
            weight: seg.isSelected ? 7 : 5,
            opacity: 0.9,
            dashArray: seg.isLift ? '10 6' : undefined,
          }}
        />
      ))}

      {/* Numbered stop markers along route */}
      {stopMarkers.map((stop) => (
        <Marker
          key={`stop-${stop.index}`}
          position={[stop.lat, stop.lon]}
          icon={makeStopIcon(stop.index)}
        >
          <Tooltip direction="top" offset={[0, -14]}>
            {stop.name}
          </Tooltip>
        </Marker>
      ))}

      {/* Red X markers for closed edges */}
      {closedMarkers.map((m, i) => (
        <Marker
          key={`closed-${i}`}
          position={[m.lat, m.lon]}
          icon={L.divIcon({
            className: '',
            html: `<div style="
              width:20px;height:20px;border-radius:50%;
              background:#dc2626;color:white;
              display:flex;align-items:center;justify-content:center;
              font-size:13px;font-weight:bold;
              border:2px solid white;
            ">X</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })}
        >
          <Tooltip direction="top" offset={[0, -12]}>
            {m.name} (closed)
          </Tooltip>
        </Marker>
      ))}

      {/* Station markers */}
      {stations.map((station) => {
        const [lon, lat] = (station.geometry as GeoJSON.Point).coordinates;
        const props = station.properties!;
        return (
          <CircleMarker
            key={props.id}
            center={[lat, lon]}
            radius={6}
            pathOptions={{
              fillColor: '#ffffff',
              fillOpacity: 1,
              color: '#1e40af',
              weight: 2,
            }}
            eventHandlers={{
              click: () => onStationClick(props.id),
            }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              {props.name} ({props.elevation}m)
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
