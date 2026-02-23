import type { HistoryEntry } from '../types/history';
import { DIFFICULTY_COLORS } from '../data/difficultyMap';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function HistoryPanel({ entries, onDelete, onClose }: HistoryPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-4 py-3 bg-blue-800 text-white flex items-center justify-between">
        <div className="text-sm font-bold">Run History</div>
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
        >
          Close
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="p-4 text-sm text-gray-500">
          No runs recorded yet. Plan a route and tap "Finished" to log it.
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="px-4 py-3 border-b border-gray-100 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {entry.fromName} → {entry.toName}
                  {entry.maxDifficulty && (
                    <span
                      className="ml-2 inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: DIFFICULTY_COLORS[entry.maxDifficulty] }}
                    />
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(entry.timestamp).toLocaleDateString()} &middot;{' '}
                  {(entry.totalDistance / 1000).toFixed(1)} km &middot;{' '}
                  {(entry.skiingDistance / 1000).toFixed(1)} km skiing &middot;{' '}
                  {Math.round(entry.totalDuration)} min &middot;{' '}
                  {entry.stepCount} steps
                </div>
              </div>
              <button
                onClick={() => onDelete(entry.id)}
                className="flex-shrink-0 text-xs text-red-400 hover:text-red-600 px-1"
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
