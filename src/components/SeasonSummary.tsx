import type { HistoryEntry } from '../types/history';
import { DIFFICULTY_COLORS } from '../data/difficultyMap';

interface SeasonSummaryProps {
  entries: HistoryEntry[];
  onClose: () => void;
}

export function SeasonSummary({ entries, onClose }: SeasonSummaryProps) {
  const totalRuns = entries.length;
  const totalKm = entries.reduce((sum, e) => sum + e.skiingDistance, 0) / 1000;
  const totalVertical = entries.reduce((sum, e) => sum + (e.verticalDrop ?? 0), 0);
  const totalDuration = entries.reduce((sum, e) => sum + e.totalDuration, 0);

  // Favourite routes (most repeated from→to pairs)
  const routeCounts = new Map<string, { fromName: string; toName: string; count: number }>();
  for (const e of entries) {
    const key = `${e.fromName}→${e.toName}`;
    const existing = routeCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      routeCounts.set(key, { fromName: e.fromName, toName: e.toName, count: 1 });
    }
  }
  const favourites = [...routeCounts.values()].sort((a, b) => b.count - a.count).slice(0, 3);

  // Difficulty breakdown
  const diffCounts = { blue: 0, red: 0, black: 0 };
  for (const e of entries) {
    if (e.maxDifficulty && e.maxDifficulty in diffCounts) {
      diffCounts[e.maxDifficulty as keyof typeof diffCounts]++;
    }
  }

  return (
    <div>
      <div className="px-4 py-3 bg-blue-800 text-white flex items-center justify-between">
        <div className="text-sm font-bold">Season Summary</div>
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
        >
          Close
        </button>
      </div>

      {totalRuns === 0 ? (
        <div className="p-4 text-sm text-gray-500">
          No runs recorded yet. Complete some routes to see your season stats.
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {/* Key stats grid */}
          <div className="grid grid-cols-2 gap-px bg-gray-100">
            <div className="bg-white px-4 py-3 text-center">
              <div className="text-2xl font-bold text-blue-900">{totalRuns}</div>
              <div className="text-xs text-gray-500">Runs</div>
            </div>
            <div className="bg-white px-4 py-3 text-center">
              <div className="text-2xl font-bold text-blue-900">{totalKm.toFixed(1)}</div>
              <div className="text-xs text-gray-500">km Skied</div>
            </div>
            <div className="bg-white px-4 py-3 text-center">
              <div className="text-2xl font-bold text-blue-900">{totalVertical.toLocaleString()}</div>
              <div className="text-xs text-gray-500">m Vertical Drop</div>
            </div>
            <div className="bg-white px-4 py-3 text-center">
              <div className="text-2xl font-bold text-blue-900">{Math.round(totalDuration)}</div>
              <div className="text-xs text-gray-500">min Total</div>
            </div>
          </div>

          {/* Difficulty breakdown */}
          <div className="px-4 py-2 border-t border-gray-100">
            <div className="text-xs font-bold text-gray-400 mb-1.5">DIFFICULTY BREAKDOWN</div>
            <div className="flex gap-3">
              {(['blue', 'red', 'black'] as const).map((d) => (
                <div key={d} className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: DIFFICULTY_COLORS[d] }}
                  />
                  <span className="text-sm">{diffCounts[d]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Favourite routes */}
          {favourites.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100">
              <div className="text-xs font-bold text-gray-400 mb-1.5">FAVOURITE ROUTES</div>
              {favourites.map((f, i) => (
                <div key={i} className="text-sm py-0.5 flex items-center justify-between">
                  <span className="truncate">{f.fromName} → {f.toName}</span>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{f.count}x</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
