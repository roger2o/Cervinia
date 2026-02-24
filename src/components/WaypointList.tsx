import { StationPicker } from './StationPicker';
import type { GraphNode } from '../types/graph';

interface WaypointListProps {
  waypoints: string[];
  nodes: GraphNode[];
  subAreas: string[];
  onAdd: (id: string) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function WaypointList({
  waypoints,
  nodes,
  subAreas,
  onAdd,
  onRemove,
  onMoveUp,
  onMoveDown,
}: WaypointListProps) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="space-y-1">
      {waypoints.length === 0 && (
        <p className="text-xs text-gray-400 mb-1">Tap the map or search to add your first stop</p>
      )}

      {waypoints.map((id, i) => {
        const node = nodeMap.get(id);
        return (
          <div key={`${id}-${i}`} className="flex items-center gap-1 text-sm">
            <span className="w-5 text-center font-bold text-blue-700">{i + 1}</span>
            <span className="flex-1 truncate">{node?.name ?? id}</span>
            <button
              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
              disabled={i === 0}
              onClick={() => onMoveUp(i)}
              aria-label="Move up"
            >
              ▲
            </button>
            <button
              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
              disabled={i === waypoints.length - 1}
              onClick={() => onMoveDown(i)}
              aria-label="Move down"
            >
              ▼
            </button>
            <button
              className="p-1 text-gray-400 hover:text-red-600"
              onClick={() => onRemove(i)}
              aria-label="Remove stop"
            >
              ✕
            </button>
          </div>
        );
      })}

      {waypoints.length === 1 && (
        <p className="text-xs text-gray-400 mb-1">Add your destination</p>
      )}

      <StationPicker
        label="Add stop"
        nodes={nodes}
        selectedId={null}
        onSelect={onAdd}
        subAreas={subAreas}
      />
    </div>
  );
}
