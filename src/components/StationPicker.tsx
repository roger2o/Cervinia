import { useMemo, useState, useRef, useEffect } from 'react';
import type { GraphNode } from '../types/graph';

interface StationPickerProps {
  label: string;
  nodes: GraphNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  subAreas: string[];
}

export function StationPicker({ label, nodes, selectedId, onSelect, subAreas }: StationPickerProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Group nodes by sub-area
  const grouped = useMemo(() => {
    const groups = new Map<string, GraphNode[]>();
    for (const area of subAreas) {
      groups.set(area, []);
    }
    groups.set('Other', []);

    for (const node of nodes) {
      const area = node.subArea && subAreas.includes(node.subArea) ? node.subArea : 'Other';
      groups.get(area)!.push(node);
    }

    // Sort nodes within each group by name
    for (const group of groups.values()) {
      group.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Remove empty groups
    for (const [key, value] of groups) {
      if (value.length === 0) groups.delete(key);
    }

    return groups;
  }, [nodes, subAreas]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const query = search.toLowerCase();
    const result = new Map<string, GraphNode[]>();
    for (const [area, groupNodes] of grouped) {
      const matches = groupNodes.filter((n) => n.name.toLowerCase().includes(query));
      if (matches.length > 0) result.set(area, matches);
    }
    return result;
  }, [grouped, search]);

  const selectedNode = nodes.find((n) => n.id === selectedId);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>
      <input
        type="text"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder={selectedNode ? selectedNode.name : 'Search station...'}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {Array.from(filtered).map(([area, groupNodes]) => (
            <div key={area}>
              <div className="px-3 py-1 text-xs font-bold text-gray-400 bg-gray-50 sticky top-0">
                {area}
              </div>
              {groupNodes.map((node) => (
                <button
                  key={node.id}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 ${
                    node.id === selectedId ? 'bg-blue-100 font-medium' : ''
                  }`}
                  onClick={() => {
                    onSelect(node.id);
                    setSearch('');
                    setOpen(false);
                  }}
                >
                  {node.name}
                  <span className="text-gray-400 ml-1 text-xs">{node.elevation}m</span>
                </button>
              ))}
            </div>
          ))}
          {filtered.size === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">No stations found</div>
          )}
        </div>
      )}
    </div>
  );
}
