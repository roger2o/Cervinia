import type { RouteResult } from '../types/route';
import { DIFFICULTY_COLORS } from '../data/difficultyMap';

interface RoutePanelProps {
  route: RouteResult | null;
  onClear: () => void;
  onMarkDone?: () => void;
  onShare?: () => void;
  selectedStepIndex: number | null;
  onStepClick: (index: number) => void;
}

export function RoutePanel({ route, onClear, onMarkDone, onShare, selectedStepIndex, onStepClick }: RoutePanelProps) {
  if (!route) return null;

  if (route.steps.length === 0) {
    return (
      <div className="bg-snowflake rounded-xl shadow-lg p-4">
        <p className="text-sm text-gray-500">Start and end are the same station.</p>
      </div>
    );
  }

  return (
    <div className="bg-snowflake rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-blue-800 text-white flex items-center justify-between">
        <div>
          <div className="text-sm font-bold">
            {route.steps.length} step{route.steps.length !== 1 ? 's' : ''}
          </div>
          <div className="text-xs opacity-80">
            {(route.totalDistance / 1000).toFixed(1)} km &middot;{' '}
            {(route.skiingDistance / 1000).toFixed(1)} km skiing &middot;{' '}
            {route.verticalDrop}m drop &middot;{' '}
            {Math.round(route.totalDuration)} min
            {route.maxDifficulty && (
              <span
                className="ml-2 inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: DIFFICULTY_COLORS[route.maxDifficulty] }}
              />
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {onShare && (
            <button
              onClick={onShare}
              className="text-xs px-2 py-1 rounded bg-green-600 hover:bg-green-700"
              title="Share via WhatsApp"
            >
              Share
            </button>
          )}
          {onMarkDone && (
            <button
              onClick={onMarkDone}
              className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
            >
              Finished 😊
            </button>
          )}
          <button
            onClick={onClear}
            className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Warnings */}
      {route.warnings.length > 0 && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200">
          {route.warnings.map((w, i) => (
            <div key={i} className="text-xs text-amber-700">
              Warning: {w}
            </div>
          ))}
        </div>
      )}

      {/* Steps */}
      <div className="max-h-64 overflow-y-auto">
        {route.steps.map((step, i) => {
          const isSelected = selectedStepIndex === i;
          return (
            <div
              key={i}
              onClick={() => onStepClick(i)}
              className={`px-4 py-2 border-b border-gray-100 flex items-start gap-3 cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {step.edge.type === 'lift' ? (
                  <div className="w-5 h-5 rounded bg-gray-500 text-white text-[10px] flex items-center justify-center font-bold">
                    L
                  </div>
                ) : (
                  <div
                    className="w-5 h-5 rounded text-white text-[10px] flex items-center justify-center font-bold"
                    style={{
                      backgroundColor: step.edge.difficulty
                        ? DIFFICULTY_COLORS[step.edge.difficulty]
                        : '#6b7280',
                    }}
                  >
                    {i + 1}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm">{step.instruction}</div>
                <div className="text-xs text-gray-400">
                  {(step.edge.distance / 1000).toFixed(1)} km &middot;{' '}
                  {Math.round(step.edge.duration)} min
                  {step.edge.type === 'piste' && step.fromNode.elevation > step.toNode.elevation && (
                    <span> &middot; {Math.round(step.fromNode.elevation - step.toNode.elevation)}m drop</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
