import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapOverlays } from './MapOverlays';
import { DailyActivityOverlay } from './DailyActivityOverlay';
import type { RouteResult } from '../types/route';
import type { GeoPosition } from '../hooks/useGeolocation';
import type { TrackSegment, TrackPoint } from '../hooks/useDailyActivity';

interface MapViewProps {
  center: [number, number];
  zoom: number;
  geo: GeoJSON.FeatureCollection | null;
  route: RouteResult | null;
  onStationClick: (stationId: string) => void;
  selectedStepIndex: number | null;
  closedEdgeIds: Set<string>;
  gpsPosition: GeoPosition | null;
  gpsActive: boolean;
  onGpsToggle: () => void;
  gpsError: string | null;
  dailyTrack?: TrackPoint[];
  dailySegments?: TrackSegment[];
  showDailyTrack?: boolean;
  replayPlaying?: boolean;
  replayIndex?: number;
}

function FlyToArea({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.0 });
  }, [map, center[0], center[1], zoom]);

  return null;
}

function FlyToSegment({ route, selectedStepIndex }: { route: RouteResult | null; selectedStepIndex: number | null }) {
  const map = useMap();

  useEffect(() => {
    if (route == null || selectedStepIndex == null || selectedStepIndex >= route.steps.length) return;
    const step = route.steps[selectedStepIndex];
    const bounds = L.latLngBounds(
      [step.fromNode.lat, step.fromNode.lon],
      [step.toNode.lat, step.toNode.lon],
    );
    map.flyToBounds(bounds.pad(0.3), { duration: 0.5 });
  }, [map, route, selectedStepIndex]);

  return null;
}

function FlyToPosition({ position }: { position: GeoPosition }) {
  const map = useMap();
  const [hasFlown, setHasFlown] = useState(false);

  useEffect(() => {
    if (!hasFlown) {
      map.flyTo([position.lat, position.lon], 15, { duration: 0.8 });
      setHasFlown(true);
    }
  }, [map, position, hasFlown]);

  // Reset when position changes significantly (user taps locate again)
  return null;
}

function MapLegend() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center bg-white text-gray-600 hover:bg-gray-50 transition-colors"
        title="Map legend"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="9" cy="9" r="7.5" />
          <line x1="9" y1="8" x2="9" y2="13" />
          <circle cx="9" cy="5.5" r="0.5" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-3 m-4 max-w-[90vw] max-h-[85vh] overflow-auto touch-pan-x touch-pan-y"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">Map Legend</span>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1"
              >
                ✕
              </button>
            </div>
            <img
              src="https://www.opensnowmap.org/pics/mapkey_wide.png"
              alt="OpenSnowMap Legend"
              style={{ minWidth: '500px', width: '100%' }}
            />
            <div className="border-t border-gray-200 mt-3 pt-2 text-sm">
              <div className="font-bold text-gray-700 mb-1">Route Planner</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1e40af] text-white text-[10px] font-bold flex items-center justify-center border border-white shrink-0">1</span>
                  <span className="text-gray-600">Stop marker</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white border-2 border-[#1e40af] shrink-0" />
                  <span className="text-gray-600">Station (tap to add stop)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LocateButton({ active, onToggle, error }: { active: boolean; onToggle: () => void; error: string | null }) {
  return (
    <div className="absolute bottom-4 right-3 z-[1000] flex flex-col items-end gap-2">
      <MapLegend />
      {error && active && (
        <div className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded shadow max-w-48">
          {error}
        </div>
      )}
      <button
        onClick={onToggle}
        className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          active
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
        title={active ? 'Stop GPS tracking' : 'Show my location'}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="10" cy="10" r="3" />
          <line x1="10" y1="1" x2="10" y2="5" />
          <line x1="10" y1="15" x2="10" y2="19" />
          <line x1="1" y1="10" x2="5" y2="10" />
          <line x1="15" y1="10" x2="19" y2="10" />
        </svg>
      </button>
    </div>
  );
}

export function MapView({
  center,
  zoom,
  geo,
  route,
  onStationClick,
  selectedStepIndex,
  closedEdgeIds,
  gpsPosition,
  gpsActive,
  onGpsToggle,
  gpsError,
  dailyTrack = [],
  dailySegments = [],
  showDailyTrack = false,
  replayPlaying = false,
  replayIndex = 0,
}: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='Tiles &copy; Esri'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
        maxZoom={18}
      />
      <TileLayer
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        maxZoom={19}
        opacity={0.35}
      />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
        maxZoom={19}
        pane="tooltipPane"
      />
      <TileLayer
        attribution='&copy; <a href="https://www.opensnowmap.org">OpenSnowMap</a>'
        url="https://tiles.opensnowmap.org/pistes/{z}/{x}/{y}.png"
        maxZoom={18}
        opacity={1.0}
      />
      <MapOverlays
        geo={geo}
        route={route}
        onStationClick={onStationClick}
        selectedStepIndex={selectedStepIndex}
        closedEdgeIds={closedEdgeIds}
      />
      <FlyToArea center={center} zoom={zoom} />
      <FlyToSegment route={route} selectedStepIndex={selectedStepIndex} />

      {/* GPS position */}
      {gpsPosition && gpsActive && (
        <>
          <Circle
            center={[gpsPosition.lat, gpsPosition.lon]}
            radius={gpsPosition.accuracy}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              weight: 1,
            }}
          />
          <CircleMarker
            center={[gpsPosition.lat, gpsPosition.lon]}
            radius={8}
            pathOptions={{
              fillColor: '#3b82f6',
              fillOpacity: 1,
              color: '#ffffff',
              weight: 3,
            }}
          />
          <FlyToPosition position={gpsPosition} />
        </>
      )}

      {/* Daily activity track overlay */}
      {showDailyTrack && dailySegments.length > 0 && (
        <DailyActivityOverlay
          segments={dailySegments}
          track={dailyTrack}
          replayPlaying={replayPlaying}
          replayIndex={replayIndex}
        />
      )}

      {/* Locate button (rendered outside MapContainer via portal would be ideal, but positioning works here) */}
      <LocateButton active={gpsActive} onToggle={onGpsToggle} error={gpsError} />
    </MapContainer>
  );
}
