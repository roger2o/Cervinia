import { useState, useCallback, useEffect, useMemo } from 'react';
import { MapView } from './components/MapView';
import { WaypointList } from './components/WaypointList';
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
import { useDailyActivity } from './hooks/useDailyActivity';
import { useWeather } from './hooks/useWeather';
import { useDragSheet } from './hooks/useDragSheet';
import { DEFAULT_AREA } from './data/areaRegistry';
import { getArea } from './data/areaRegistry';
import type { DifficultyPreference } from './types/graph';
import { PREFERENCE_ORDER } from './data/difficultyMap';
import { resolvePreference } from './types/graph';
import { PREFERENCE_LABELS } from './data/difficultyMap';

function App() {
  const [areaId, setAreaId] = useState(DEFAULT_AREA);
  const [waypoints, setWaypoints] = useState<string[]>([]);
  const [difficultyPref, setDifficultyPref] = useState<DifficultyPreference>('red');
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

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

  // Stabilize waypoints array reference for useMemo dependency
  const waypointsKey = waypoints.join(',');
  const stableWaypoints = useMemo(() => waypoints, [waypointsKey]);

  const { maxDifficulty, preferEasier } = resolvePreference(difficultyPref);
  const { route, failedLeg } = useRoute(adjacency, stableWaypoints, maxDifficulty, stableClosedEdgeIds, preferEasier);
  const { bannerVisible, checkOnline } = useOffline();
  const { cachedAreaId, switchArea } = useAreaCache();
  const { entries: historyEntries, markDone, remove: removeHistory } = useHistory(areaId);
  const { position: gpsPosition, watching: gpsActive, error: gpsError, toggle: toggleGps } = useGeolocation();
  const activity = useDailyActivity(gpsPosition, gpsActive);
  const dragSheet = useDragSheet({ resetDep: route });

  const area = getArea(areaId);
  const weatherCenter = area?.center ?? [45.9369, 7.6292] as [number, number];
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
    if (!route || waypoints.length < 2 || route.steps.length === 0) return;

    const fromName = route.steps[0].fromNode.name;
    const toName = route.steps[route.steps.length - 1].toNode.name;
    const dist = (route.totalDistance / 1000).toFixed(1);
    const ski = (route.skiingDistance / 1000).toFixed(1);
    const mins = Math.round(route.totalDuration);

    const params = new URLSearchParams({
      area: areaId,
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
      return `No route found from ${fromName} to ${toName} at ${PREFERENCE_LABELS[difficultyPref]} level. Try a higher difficulty.`;
    }
    return `No route found at ${PREFERENCE_LABELS[difficultyPref]} level. Try a higher difficulty.`;
  }, [waypoints, route, failedLeg, nodes, difficultyPref]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F5FAFF]">
      {/* Offline banner (auto-dismisses after 2s) */}
      {bannerVisible && (
        <div className="bg-amber-500 text-white text-center text-xs py-1 px-2">
          You are offline — using cached data
        </div>
      )}

      {/* Top controls */}
      <div className="flex-shrink-0 p-3 space-y-2 bg-snowflake shadow-md z-[10000] relative">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-blue-900">Ski Route Planner</h1>
          <div className="flex items-center gap-2">
            {meta && (
              <span className="text-xs text-gray-400">{meta.name}</span>
            )}
            <MobileMenu
              areaId={areaId}
              area={area}
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
              activityRecording={activity.recording}
              activityTrack={activity.track}
              activityMaxSpeed={activity.maxSpeed}
              activityTotalDistance={activity.totalDistance}
              activityShowOnMap={activity.showOnMap}
              activityReplayPlaying={activity.replayPlaying}
              activityReplaySpeed={activity.replaySpeed}
              onActivityStart={activity.start}
              onActivityStop={activity.stop}
              onActivityReset={activity.reset}
              onActivityStartReplay={activity.startReplay}
              onActivityStopReplay={activity.stopReplay}
              onActivitySetReplaySpeed={activity.setReplaySpeed}
              onActivityToggleShowOnMap={activity.toggleShowOnMap}
            />
          </div>
        </div>

        <WaypointList
          waypoints={waypoints}
          nodes={nodes}
          subAreas={area?.subAreas ?? []}
          onAdd={handleStationClick}
          onRemove={handleWaypointRemove}
          onMoveUp={handleWaypointMoveUp}
          onMoveDown={handleWaypointMoveDown}
        />

        <DifficultySelector value={difficultyPref} onChange={setDifficultyPref} />

        {noRouteMessage && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {noRouteMessage}
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
          dailyTrack={activity.track}
          dailySegments={activity.segments}
          showDailyTrack={activity.showOnMap}
          replayPlaying={activity.replayPlaying}
          replayIndex={activity.replayIndex}
        />
      </div>

      {/* Route panel (bottom sheet) */}
      {route && (
        <div className="flex-shrink-0 overflow-hidden">
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
        </div>
      )}
    </div>
  );
}

export default App;
