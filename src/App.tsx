import { useState, useCallback, useEffect, useMemo } from 'react';
import { MapView } from './components/MapView';
import { StationPicker } from './components/StationPicker';
import { DifficultySelector } from './components/DifficultySelector';
import { RoutePanel } from './components/RoutePanel';
import { MobileMenu } from './components/MobileMenu';
import { useGraph } from './hooks/useGraph';
import { useRoute } from './hooks/useRoute';
import { useOffline } from './hooks/useOffline';
import { useAreaCache } from './hooks/useAreaCache';
import { useHistory } from './hooks/useHistory';
import { useStatus } from './hooks/useStatus';
import { useGeolocation } from './hooks/useGeolocation';
import { useWeather } from './hooks/useWeather';
import { DEFAULT_AREA } from './data/areaRegistry';
import { getArea } from './data/areaRegistry';
import type { DifficultyPreference } from './types/graph';
import { PREFERENCE_ORDER } from './data/difficultyMap';
import { resolvePreference } from './types/graph';
import { PREFERENCE_LABELS } from './data/difficultyMap';

function App() {
  const [areaId, setAreaId] = useState(DEFAULT_AREA);
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [difficultyPref, setDifficultyPref] = useState<DifficultyPreference>('red');
  const [pickingTarget, setPickingTarget] = useState<'from' | 'to'>('from');
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  // Restore route from URL query params (for shared links)
  const [sharedParamsApplied, setSharedParamsApplied] = useState(false);
  useEffect(() => {
    if (sharedParamsApplied) return;
    const params = new URLSearchParams(window.location.search);
    const sharedFrom = params.get('from');
    const sharedTo = params.get('to');
    const sharedDiff = params.get('diff') as DifficultyPreference | null;
    const sharedArea = params.get('area');

    if (sharedFrom && sharedTo) {
      if (sharedArea) setAreaId(sharedArea);
      if (sharedDiff && PREFERENCE_ORDER.includes(sharedDiff)) setDifficultyPref(sharedDiff);
      setFromId(sharedFrom);
      setToId(sharedTo);
      setPickingTarget('from');
      // Clean URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }
    setSharedParamsApplied(true);
  }, [sharedParamsApplied]);

  const { graph, adjacency, geo, meta, loading, error } = useGraph(areaId);
  const { status, closedEdgeIds, refresh: refreshStatus } = useStatus(areaId);

  // Stabilize closedEdgeIds to avoid re-routing on every render
  const closedEdgeIdsKey = useMemo(() => [...closedEdgeIds].sort().join(','), [closedEdgeIds]);
  const stableClosedEdgeIds = useMemo(() => closedEdgeIds, [closedEdgeIdsKey]);

  const { maxDifficulty, preferEasier } = resolvePreference(difficultyPref);
  const route = useRoute(adjacency, fromId, toId, maxDifficulty, stableClosedEdgeIds, preferEasier);
  const { bannerVisible, checkOnline } = useOffline();
  const { cachedAreaId, switchArea } = useAreaCache();
  const { entries: historyEntries, markDone, remove: removeHistory } = useHistory(areaId);
  const { position: gpsPosition, watching: gpsActive, error: gpsError, toggle: toggleGps } = useGeolocation();

  const area = getArea(areaId);
  const weatherCenter = area?.center ?? [45.9369, 7.6292] as [number, number];
  const { weather, loading: weatherLoading, error: weatherError, refresh: refreshWeather } = useWeather(weatherCenter[0], weatherCenter[1]);
  const nodes = graph?.nodes ?? [];

  const handleStationClick = useCallback(
    (stationId: string) => {
      if (pickingTarget === 'from') {
        setFromId(stationId);
        setPickingTarget('to');
      } else {
        setToId(stationId);
        setPickingTarget('from');
      }
    },
    [pickingTarget],
  );

  const handleClearRoute = useCallback(() => {
    setFromId(null);
    setToId(null);
    setPickingTarget('from');
    setSelectedStepIndex(null);
  }, []);

  const handleAreaSwitch = useCallback(
    (newAreaId: string) => {
      switchArea(newAreaId);
      setAreaId(newAreaId);
      handleClearRoute();
    },
    [switchArea, handleClearRoute],
  );

  const handleStepClick = useCallback(
    (index: number) => {
      setSelectedStepIndex((prev) => (prev === index ? null : index));
    },
    [],
  );

  const handleMarkDone = useCallback(() => {
    if (route) {
      markDone(route);
    }
  }, [route, markDone]);

  const handleShare = useCallback(() => {
    if (!checkOnline()) return;
    if (!route || !fromId || !toId || route.steps.length === 0) return;

    const fromName = route.steps[0].fromNode.name;
    const toName = route.steps[route.steps.length - 1].toNode.name;
    const dist = (route.totalDistance / 1000).toFixed(1);
    const ski = (route.skiingDistance / 1000).toFixed(1);
    const mins = Math.round(route.totalDuration);

    const params = new URLSearchParams({
      area: areaId,
      from: fromId,
      to: toId,
      diff: difficultyPref,
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params}`;

    const text =
      `Ski Route: ${fromName} → ${toName}\n` +
      `${dist} km (${ski} km skiing) | ${mins} min | ${route.steps.length} steps\n\n` +
      shareUrl;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }, [route, fromId, toId, areaId, difficultyPref, checkOnline]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-100">
      {/* Offline banner (auto-dismisses after 2s) */}
      {bannerVisible && (
        <div className="bg-amber-500 text-white text-center text-xs py-1 px-2">
          You are offline — using cached data
        </div>
      )}

      {/* Top controls */}
      <div className="flex-shrink-0 p-3 space-y-2 bg-white shadow-md z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-blue-900">Ski Route Planner</h1>
          <div className="flex items-center gap-2">
            {meta && (
              <span className="text-xs text-gray-400">{meta.name}</span>
            )}
            <MobileMenu
              areaId={areaId}
              onAreaSwitch={handleAreaSwitch}
              cachedAreaId={cachedAreaId}
              historyEntries={historyEntries}
              onDeleteHistory={removeHistory}
              status={status}
              onRefreshStatus={refreshStatus}
              weather={weather}
              weatherLoading={weatherLoading}
              weatherError={weatherError}
              onRefreshWeather={refreshWeather}
              checkOnline={checkOnline}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StationPicker
            label={`From ${pickingTarget === 'from' ? '(selecting)' : ''}`}
            nodes={nodes}
            selectedId={fromId}
            onSelect={(id) => {
              setFromId(id);
              setPickingTarget('to');
            }}
            subAreas={area?.subAreas ?? []}
          />
          <StationPicker
            label={`To ${pickingTarget === 'to' ? '(selecting)' : ''}`}
            nodes={nodes}
            selectedId={toId}
            onSelect={(id) => {
              setToId(id);
              setPickingTarget('from');
            }}
            subAreas={area?.subAreas ?? []}
          />
        </div>

        <DifficultySelector value={difficultyPref} onChange={setDifficultyPref} />

        {fromId && toId && !route && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            No route found at {PREFERENCE_LABELS[difficultyPref]} level. Try a higher difficulty.
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
            <div className="text-sm text-gray-500">Loading ski area data...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
            <div className="text-sm text-red-500">Error: {error}</div>
          </div>
        )}
        <MapView
          center={area?.center ?? [45.9369, 7.6292]}
          zoom={area?.defaultZoom ?? 13}
          geo={geo}
          route={route}
          onStationClick={handleStationClick}
          selectedStepIndex={selectedStepIndex}
          closedEdgeIds={stableClosedEdgeIds}
          gpsPosition={gpsPosition}
          gpsActive={gpsActive}
          onGpsToggle={toggleGps}
          gpsError={gpsError}
        />
      </div>

      {/* Route panel (bottom sheet) */}
      {route && (
        <div className="flex-shrink-0 max-h-[40vh] overflow-y-auto">
          <RoutePanel
            route={route}
            onClear={handleClearRoute}
            onMarkDone={handleMarkDone}
            onShare={handleShare}
            selectedStepIndex={selectedStepIndex}
            onStepClick={handleStepClick}
          />
        </div>
      )}
    </div>
  );
}

export default App;
