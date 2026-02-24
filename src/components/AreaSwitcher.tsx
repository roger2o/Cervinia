import { useState, useMemo } from 'react';
import { areas } from '../data/areaRegistry';

interface AreaSwitcherProps {
  currentAreaId: string;
  onSwitch: (areaId: string) => void;
  cachedAreaId: string | null;
}

export function AreaSwitcher({ currentAreaId, onSwitch, cachedAreaId }: AreaSwitcherProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return areas;
    const query = search.toLowerCase();
    return areas.filter((a) => a.name.toLowerCase().includes(query));
  }, [search]);

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
        Ski Site
      </label>
      <input
        type="text"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Search ski site..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="mt-1 w-full max-h-60 overflow-y-auto bg-snowflake border border-gray-200 rounded-lg">
        {filtered.map((a) => (
          <button
            key={a.id}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
              a.id === currentAreaId ? 'bg-blue-100 font-medium' : ''
            }`}
            onClick={() => {
              if (a.id !== currentAreaId) {
                if (cachedAreaId && cachedAreaId !== a.id) {
                  const confirmed = window.confirm(
                    'Switching areas will replace the offline cache. Continue?',
                  );
                  if (!confirmed) return;
                }
                onSwitch(a.id);
              }
              setSearch('');
            }}
          >
            {a.name}
            {cachedAreaId === a.id && (
              <span className="ml-2 text-xs text-gray-400">(cached)</span>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="px-3 py-2 text-sm text-gray-400">No ski sites found</div>
        )}
      </div>
    </div>
  );
}
