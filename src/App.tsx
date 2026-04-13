import { useState, useCallback, useEffect, useMemo } from 'react';
import { MapView } from './components/MapView';
import { WaypointList } from './components/WaypointList';
import { DifficultySelector } from './components/DifficultySelector';
import { RoutePanel } from './components/RoutePanel';
import { ActivityStatsBar } from './components/ActivityStatsBar';
import { MobileMenu } from './components/MobileMenu';
import { identifyPiste } from './utils/pisteMatch';
import { useGraph } from './hooks/useGraph';
import { useRoute } from './hooks/useRoute';
import { useOffline } from './hooks/useOffline';
import { useAreaCache } from './hooks/useAreaCache';
import { useHistory } from './hooks/useHistory';
// import { useStatus } from './hooks/useStatus';
import { useGeolocation } from './hooks/useGeolocation';
import { useDailyActivity } from './hooks/useDailyActivity';
import { useWeather } from './hooks/useWeather';
import { useDragSheet } from './hooks/useDragSheet';
import { getArea, registerDynamicArea } from './data/areaRegistry';
import type { DifficultyPreference } from './types/graph';
import { PREFERENCE_ORDER } from './data/difficultyMap';
import { resolvePreference } from './types/graph';

function App() {
  const [areaId, setAreaId] = useState<string | null>(() => {
    return localStorage.getItem('lastAreaId');
  });
  const [waypoints, setWaypoints] = useState<string[]>([]);
  const [difficultyPref, setDifficultyPref] = useState<DifficultyPreference>('red');
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<'activity' | 'route'>('activity');
  const [labelSize, setLabelSize] = useState(() => {
    const saved = localStorage.getItem('labelSize');
    return saved ? Number(saved) : 12;
  });

  useEffect(() => {
    localStorage.setItem('labelSize', String(labelSize));
  }, [labelSize]);

  // Persist selected area so it survives app restarts
  useEffect(() => {
    if (areaId) localStorage.setItem('lastAreaId', areaId);
  }, [areaId]);

  // Restore route from URL query params (for shared links)
  const [sharedParamsApplied, setSharedParamsApplied] = useState(false);
  useEffect(() => {
    if (sharedParamsApplied) return;
    const params = new URLSearchParams(window.location.search);
    const sharedDiff = params.get('diff') as DifficultyPreference | null;
    const sharedArea = params.get('area');

    // Support new multi-stop format (?stops=id1,id2,id3)
    const sharedStops = params.get('stops');
    // Also support legacy two-stop format (?from=X&to=Y)
    const sharedFrom = params.get('from');
    const sharedTo = params.get('to');

    let restoredWaypoints: string[] = [];
    if (sharedStops) {
      restoredWaypoints = sharedStops.split(',').filter(Boolean);
    } else if (sharedFrom && sharedTo) {
      restoredWaypoints = [sharedFrom, sharedTo];
    }

    if (restoredWaypoints.length >= 2) {
      if (sharedArea) setAreaId(sharedArea);
      if (sharedDiff && PREFERENCE_ORDER.includes(sharedDiff)) setDifficultyPref(sharedDiff);
      setWaypoints(restoredWaypoints);
      setMode('route');
      // Clean URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }
    setSharedParamsApplied(true);
  }, [sharedParamsApplied]);

  const { graph, adjacency, geo, meta, loading, error } = useGraph(areaId);
  // P&L status infrastructure kept in codebase but disabled from UI
  // (no universal data source for live piste/lift status across resorts)
  const stableClosedEdgeIds = useMemo(() => new Set<string>(), []);

  // Stabilize waypoints array reference for useMemo dependency
  const waypointsKey = waypoints.join(',');
  const stableWaypoints = useMemo(() => waypoints, [waypointsKey]);

  const { maxDifficulty, preferEasier } = resolvePreference(difficultyPref);
  const { route, failedLeg } = useRoute(adjacency, stableWaypoints, maxDifficulty, stableClosedEdgeIds, preferEasier);
  const { bannerVisible, checkOnline } = useOffline();
  const { cachedAreaId } = useAreaCache();
  const { entries: historyEntries, markDone, remove: removeHistory } = useHistory(areaId ?? '');
  const { position: gpsPosition, watching: gpsActive, error: gpsError, toggle: toggleGps, startWatching: startGps } = useGeolocation();
  const activity = useDailyActivity(gpsPosition, gpsActive, startGps);
  const dragSheet = useDragSheet({ resetDep: route });
  const activityDragSheet = useDragSheet({ initialState: 'collapsed' });

  // Identify which piste the top speed was achieved on
  const maxSpeedPiste = useMemo(
    () => activity.maxSpeedPoint ? identifyPiste(activity.maxSpeedPoint, geo) : null,
    [activity.maxSpeedPoint, geo],
  );

  // Register dynamic area from cached meta when not in static registry
  useEffect(() => {
    if (meta && areaId && !getArea(areaId)) {
      const latSpan = meta.bbox.north - meta.bbox.south;
      const defaultZoom = latSpan > 0.15 ? 12 : latSpan > 0.08 ? 13 : 14;
      registerDynamicArea({
        id: meta.id,
        name: meta.name,
        bbox: meta.bbox,
        center: meta.center,
        subAreas: meta.subAreas,
        dataUrl: `/data/${meta.id}`,
        defaultZoom,
        tileZoomRange: [defaultZoom - 2, defaultZoom + 2],
      });
    }
  }, [meta, areaId]);

  const area = areaId ? getArea(areaId) : undefined;
  // Fall back to meta for center/zoom when area not yet registered
  const effectiveCenter = area?.center ?? meta?.center ?? [45.9369, 7.6292] as [number, number];
  const effectiveZoom = area?.defaultZoom ?? 13;
  const weatherCenter = effectiveCenter;
  const { weather, loading: weatherLoading, error: weatherError, refresh: refreshWeather } = useWeather(weatherCenter[0], weatherCenter[1]);
  const nodes = graph?.nodes ?? [];

  const handleStationClick = useCallback(
    (stationId: string) => {
      setWaypoints((prev) => [...prev, stationId]);
    },
    [],
  );

  const handleClearRoute = useCallback(() => {
    setWaypoints([]);
    setSelectedStepIndex(null);
  }, []);

  const handleWaypointRemove = useCallback((index: number) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== index));
    setSelectedStepIndex(null);
  }, []);

  const handleWaypointMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setWaypoints((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
    setSelectedStepIndex(null);
  }, []);

  const handleWaypointMoveDown = useCallback((index: number) => {
    setWaypoints((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
    setSelectedStepIndex(null);
  }, []);

  const handleDynamicArea = useCallback(
    (newAreaId: string) => {
      // Register from meta once graph loads (meta comes from useGraph via cache)
      setAreaId(newAreaId);
      handleClearRoute();
    },
    [handleClearRoute],
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
    if (!route || waypoints.length < 2 || route.steps.length === 0) return;

    const fromName = route.steps[0].fromNode.name;
    const toName = route.steps[route.steps.length - 1].toNode.name;
    const dist = (route.totalDistance / 1000).toFixed(1);
    const ski = (route.skiingDistance / 1000).toFixed(1);
    const mins = Math.round(route.totalDuration);

    const params = new URLSearchParams({
      area: areaId ?? '',
      stops: waypoints.join(','),
      diff: difficultyPref,
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params}`;

    const drop = route.verticalDrop;
    const stopsLabel = waypoints.length > 2 ? ` (${waypoints.length} stops)` : '';

    const text =
      `Ski Route: ${fromName} → ${toName}${stopsLabel}\n` +
      `${dist} km (${ski} km skiing) | ${drop}m drop | ${mins} min | ${route.steps.length} steps\n\n` +
      shareUrl;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }, [route, waypoints, areaId, difficultyPref, checkOnline]);

  // Build "no route" error message
  const noRouteMessage = useMemo(() => {
    if (waypoints.length < 2 || route) return null;
    if (failedLeg !== null) {
      const fromNode = nodes.find((n) => n.id === waypoints[failedLeg]);
      const toNode = nodes.find((n) => n.id === waypoints[failedLeg + 1]);
      const fromName = fromNode?.name ?? `Stop ${failedLeg + 1}`;
      const toName = toNode?.name ?? `Stop ${failedLeg + 2}`;
      const hint = difficultyPref === 'black'
        ? 'These stations may not be connected in the ski area data.'
        : 'Try a higher difficulty or different stops.';
      return `No route found from ${fromName} to ${toName}. ${hint}`;
    }
    const hint = difficultyPref === 'black'
      ? 'These stations may not be connected in the ski area data.'
      : 'Try a higher difficulty or different stops.';
    return `No route found. ${hint}`;
  }, [waypoints, route, failedLeg, nodes, difficultyPref]);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#F5FAFF]">
      {/* Offline banner (auto-dismisses after 2s) */}
      {bannerVisible && (
        <div className="bg-amber-500 text-white text-center text-xs py-1 px-2">
          You are offline — using cached data
        </div>
      )}

      {/* Top controls */}
      <div className="flex-shrink-0 px-3 py-2 space-y-1 bg-snowflake shadow-md z-[10000] relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-bold text-blue-900 truncate">
              {meta?.name ?? 'Ski Planner'}
            </h1>
            {/* Mode toggle */}
            <div className="flex bg-gray-200 rounded-lg p-0.5 flex-shrink-0">
              <button
                onClick={() => setMode('activity')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  mode === 'activity'
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Activity
              </button>
              <button
                onClick={() => setMode('route')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  mode === 'route'
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Routes
              </button>
            </div>
            {mode === 'route' && (
              <DifficultySelector value={difficultyPref} onChange={setDifficultyPref} />
            )}
          </div>
          <div className="flex items-center gap-2">
            {activity.recording && mode === 'route' && (
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Recording" />
            )}
            <MobileMenu
              areaId={areaId ?? ''}
              area={area}
              onDynamicArea={handleDynamicArea}
              cachedAreaId={cachedAreaId}
              historyEntries={historyEntries}
              onDeleteHistory={removeHistory}
              weather={weather}
              weatherLoading={weatherLoading}
              weatherError={weatherError}
              onRefreshWeather={refreshWeather}
              checkOnline={checkOnline}
              labelSize={labelSize}
              onLabelSizeChange={setLabelSize}
            />
          </div>
        </div>

        {mode === 'route' && (
          <>
            <WaypointList
              waypoints={waypoints}
              nodes={nodes}
              subAreas={area?.subAreas ?? meta?.subAreas ?? []}
              onAdd={handleStationClick}
              onRemove={handleWaypointRemove}
              onMoveUp={handleWaypointMoveUp}
              onMoveDown={handleWaypointMoveDown}
            />

            {noRouteMessage && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {noRouteMessage}
              </div>
            )}
          </>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
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
          center={effectiveCenter}
          zoom={effectiveZoom}
          geo={geo}
          route={route}
          onStationClick={handleStationClick}
          selectedStepIndex={selectedStepIndex}
          closedEdgeIds={stableClosedEdgeIds}
          gpsPosition={gpsPosition}
          gpsActive={gpsActive}
          onGpsToggle={toggleGps}
          gpsError={gpsError}
          labelSize={labelSize}
          dailyTrack={activity.track}
          dailySegments={activity.segments}
          showDailyTrack={mode === 'activity' || activity.showOnMap}
          replayPlaying={activity.replayPlaying}
          replayIndex={activity.replayIndex}
        />
      </div>

      {/* Bottom panel */}
      <div className="flex-shrink-0 overflow-hidden">
        {mode === 'activity' && (
          <ActivityStatsBar
            recording={activity.recording}
            track={activity.track}
            maxSpeed={activity.maxSpeed}
            totalDistance={activity.totalDistance}
            skiingDistance={activity.skiingDistance}
            showOnMap={activity.showOnMap}
            replayPlaying={activity.replayPlaying}
            replaySpeed={activity.replaySpeed}
            maxSpeedPisteName={maxSpeedPiste?.name ?? null}
            maxSpeedPisteDifficulty={maxSpeedPiste?.difficulty ?? null}
            onStart={activity.start}
            onStop={activity.stop}
            onReset={activity.reset}
            onStartReplay={activity.startReplay}
            onStopReplay={activity.stopReplay}
            onSetReplaySpeed={activity.setReplaySpeed}
            onToggleShowOnMap={activity.toggleShowOnMap}
            panelState={activityDragSheet.panelState}
            onPointerDown={activityDragSheet.onPointerDown}
            onPointerMove={activityDragSheet.onPointerMove}
            onPointerUp={activityDragSheet.onPointerUp}
            onHeaderTap={activityDragSheet.onHeaderTap}
            handleRef={activityDragSheet.handleRef}
            panelRef={activityDragSheet.panelRef}
            transitioning={activityDragSheet.transitioning}
          />
        )}
        {mode === 'route' && route && (
          <RoutePanel
            route={route}
            onClear={handleClearRoute}
            onMarkDone={handleMarkDone}
            onShare={handleShare}
            selectedStepIndex={selectedStepIndex}
            onStepClick={handleStepClick}
            panelState={dragSheet.panelState}
            onPointerDown={dragSheet.onPointerDown}
            onPointerMove={dragSheet.onPointerMove}
            onPointerUp={dragSheet.onPointerUp}
            onHeaderTap={dragSheet.onHeaderTap}
            handleRef={dragSheet.handleRef}
            panelRef={dragSheet.panelRef}
            transitioning={dragSheet.transitioning}
          />
        )}
      </div>
    </div>
  );
}

export default App;
