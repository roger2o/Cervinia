import type { TrackPoint } from '../hooks/useDailyActivity';
import type { PanelState } from '../hooks/useDragSheet';

const DIFFICULTY_DOT_COLORS: Record<string, string> = {
  blue: '#3b82f6',
  red: '#ef4444',
  black: '#1f2937',
};

const SPEED_OPTIONS = [1, 2, 5, 10];

interface ActivityStatsBarProps {
  recording: boolean;
  track: TrackPoint[];
  maxSpeed: number;
  totalDistance: number;
  skiingDistance: number;
  showOnMap: boolean;
  replayPlaying: boolean;
  replaySpeed: number;
  maxSpeedPisteName: string | null;
  maxSpeedPisteDifficulty: string | null;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onStartReplay: () => void;
  onStopReplay: () => void;
  onSetReplaySpeed: (speed: number) => void;
  onToggleShowOnMap: () => void;
  // Drag sheet
  panelState: PanelState;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onHeaderTap: () => void;
  handleRef: React.RefObject<HTMLDivElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
  transitioning: boolean;
}

const expandedMaxHeight: Record<PanelState, string> = {
  collapsed: 'max-h-0',
  half: 'max-h-64',
  full: 'max-h-[60vh]',
};

function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export function ActivityStatsBar({
  recording,
  track,
  maxSpeed,
  totalDistance,
  skiingDistance,
  showOnMap,
  replayPlaying,
  replaySpeed,
  maxSpeedPisteName,
  maxSpeedPisteDifficulty,
  onStart,
  onStop,
  onReset,
  onStartReplay,
  onStopReplay,
  onSetReplaySpeed,
  onToggleShowOnMap,
  panelState,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onHeaderTap,
  handleRef,
  panelRef,
  transitioning,
}: ActivityStatsBarProps) {
  const isCollapsed = panelState === 'collapsed';
  const hasTrack = track.length >= 2;

  const handleReset = () => {
    if (window.confirm('Clear today\'s activity data?')) {
      onReset();
    }
  };

  return (
    <div
      ref={panelRef}
      className={`bg-snowflake rounded-t-xl shadow-lg overflow-hidden ${transitioning ? 'transition-transform duration-300 ease-out' : ''}`}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Drag handle */}
      <div
        ref={handleRef}
        className="flex justify-center py-2 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
      >
        <div className="w-8 h-1 rounded-full bg-gray-300" />
      </div>

      {/* Compact stats header */}
      <div
        className="px-4 pb-3"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          onHeaderTap();
        }}
      >
        {/* Stats row */}
        <div className="flex items-center gap-3 mb-2">
          {/* Recording indicator */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                recording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
              }`}
            />
            <span className="text-[10px] text-gray-500 uppercase font-medium tracking-wide">
              {recording ? 'Rec' : 'Off'}
            </span>
          </div>

          {/* Stat chips */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <StatChip label="Speed" value={maxSpeed > 0 ? `${maxSpeed.toFixed(1)}` : '--'} unit="km/h" />
            <StatChip label="Skiing" value={skiingDistance > 0 ? formatDistance(skiingDistance) : '--'} />
            <StatChip label="Total" value={totalDistance > 0 ? formatDistance(totalDistance) : '--'} />
          </div>
        </div>

        {/* Record button */}
        <button
          onClick={recording ? onStop : onStart}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
            recording
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {recording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>

      {/* Expanded content */}
      {!isCollapsed && (
        <div className={`${expandedMaxHeight[panelState]} overflow-y-auto border-t border-gray-200`}>
          <div className="p-4 space-y-3">
            {/* Top speed on piste */}
            {maxSpeed > 0 && (
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="text-xs text-amber-700 font-medium mb-1">Top Speed</div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-amber-900">
                    {maxSpeed.toFixed(1)} km/h
                  </span>
                  {maxSpeedPisteName && (
                    <span className="flex items-center gap-1 text-sm text-amber-800">
                      on {maxSpeedPisteName}
                      {maxSpeedPisteDifficulty && (
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: DIFFICULTY_DOT_COLORS[maxSpeedPisteDifficulty] ?? '#6b7280' }}
                        />
                      )}
                    </span>
                  )}
                  {!maxSpeedPisteName && maxSpeed > 0 && (
                    <span className="text-xs text-amber-600">(piste unknown)</span>
                  )}
                </div>
              </div>
            )}

            {/* Stats grid (larger display) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500">Max Speed</div>
                <div className="text-lg font-bold text-blue-900">
                  {maxSpeed > 0 ? `${maxSpeed.toFixed(1)}` : '--'}
                </div>
                <div className="text-xs text-gray-400">km/h</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500">Skiing</div>
                <div className="text-lg font-bold text-blue-900">
                  {skiingDistance > 0 ? formatDistance(skiingDistance) : '--'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-lg font-bold text-blue-900">
                  {totalDistance > 0 ? formatDistance(totalDistance) : '--'}
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-400 text-center">
              {track.length} points recorded
            </div>

            {/* Show on Map toggle */}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showOnMap}
                onChange={onToggleShowOnMap}
                className="rounded"
              />
              <span>Show track on map</span>
            </label>

            {/* Replay controls */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={replayPlaying ? onStopReplay : onStartReplay}
                  disabled={!hasTrack}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    !hasTrack
                      ? 'bg-gray-100 text-gray-400'
                      : replayPlaying
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {replayPlaying ? 'Stop Replay' : 'Replay'}
                </button>
              </div>

              {hasTrack && (
                <div className="flex items-center gap-1 justify-center">
                  <span className="text-xs text-gray-500 mr-1">Speed:</span>
                  {SPEED_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => onSetReplaySpeed(s)}
                      className={`px-2 py-0.5 text-xs rounded ${
                        replaySpeed === s
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reset */}
            {(track.length > 0 || totalDistance > 0) && (
              <button
                onClick={handleReset}
                className="w-full py-2 rounded-lg text-sm text-red-600 bg-red-50 hover:bg-red-100"
              >
                Reset Today's Activity
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex-1 min-w-0 bg-gray-100 rounded px-2 py-1 text-center">
      <div className="text-[10px] text-gray-400 leading-tight">{label}</div>
      <div className="text-xs font-bold text-blue-900 truncate">
        {value}
        {unit && <span className="text-[10px] font-normal text-gray-400 ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}
