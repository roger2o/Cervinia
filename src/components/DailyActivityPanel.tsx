interface DailyActivityPanelProps {
  recording: boolean;
  track: { lat: number; lon: number }[];
  maxSpeed: number;
  totalDistance: number;
  showOnMap: boolean;
  replayPlaying: boolean;
  replaySpeed: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onStartReplay: () => void;
  onStopReplay: () => void;
  onSetReplaySpeed: (speed: number) => void;
  onToggleShowOnMap: () => void;
  onClose: () => void;
}

const SPEED_OPTIONS = [1, 2, 5, 10];

export function DailyActivityPanel({
  recording,
  track,
  maxSpeed,
  totalDistance,
  showOnMap,
  replayPlaying,
  replaySpeed,
  onStart,
  onStop,
  onReset,
  onStartReplay,
  onStopReplay,
  onSetReplaySpeed,
  onToggleShowOnMap,
  onClose,
}: DailyActivityPanelProps) {
  const hasTrack = track.length >= 2;

  const handleReset = () => {
    if (window.confirm('Clear today\'s activity data?')) {
      onReset();
    }
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
  };

  return (
    <div>
      <div className="px-4 py-3 bg-blue-800 text-white flex items-center justify-between">
        <div className="text-sm font-bold">Daily Activity</div>
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
        >
          Close
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500">Max Speed</div>
            <div className="text-lg font-bold text-blue-900">
              {maxSpeed > 0 ? `${maxSpeed.toFixed(1)}` : '--'}
            </div>
            <div className="text-xs text-gray-400">km/h</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500">Distance</div>
            <div className="text-lg font-bold text-blue-900">
              {totalDistance > 0 ? formatDistance(totalDistance) : '--'}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-400 text-center">
          {track.length} points recorded
        </div>

        {/* Record button */}
        <button
          onClick={recording ? onStop : onStart}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
            recording
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {recording ? 'Stop Recording' : 'Start Recording'}
        </button>

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

          {/* Speed selector */}
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
  );
}
