import { useState, useCallback, useEffect } from 'react';
import { useAreaSetup } from '../hooks/useAreaSetup';
import type { SkiAreaResult } from '../engine/overpassFetcher';

interface AreaSwitcherProps {
  onDynamicArea: (area: SkiAreaResult) => void;
  cachedAreaId: string | null;
}

export function AreaSwitcher({ onDynamicArea, cachedAreaId }: AreaSwitcherProps) {
  const [search, setSearch] = useState('');
  const { searchResults, progress, loading, search: searchAreas, setup } = useAreaSetup();

  // Auto-search as user types (index is local, no API call)
  useEffect(() => {
    if (search.trim().length >= 2) {
      searchAreas(search.trim());
    }
  }, [search, searchAreas]);

  const handleSelectDynamic = useCallback(
    async (area: SkiAreaResult) => {
      if (loading) return;
      if (cachedAreaId && cachedAreaId !== area.id) {
        const confirmed = window.confirm('Switching areas will replace the offline cache. Continue?');
        if (!confirmed) return;
      }
      const result = await setup(area);
      if (result) {
        onDynamicArea(area);
        setSearch('');
      }
    },
    [loading, cachedAreaId, setup, onDynamicArea],
  );

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
        Ski Site
      </label>
      <input
        type="text"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Search 4,600+ ski areas worldwide..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Progress when loading area data */}
      {loading && (
        <div className="mt-1 px-3 py-2 text-xs text-blue-600 bg-blue-50 rounded-lg">
          {progress.message || 'Loading...'}
        </div>
      )}
      {progress.stage === 'error' && (
        <div className="mt-1 px-3 py-2 text-xs text-red-600 bg-red-50 rounded-lg">
          {progress.message}
        </div>
      )}

      <div className="mt-1 w-full max-h-60 overflow-y-auto bg-snowflake border border-gray-200 rounded-lg">
        {searchResults.length > 0 ? (
          searchResults.map((area) => (
            <button
              key={area.id}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 disabled:opacity-50"
              disabled={loading}
              onClick={() => handleSelectDynamic(area)}
            >
              {area.name}
            </button>
          ))
        ) : search.trim().length >= 2 ? (
          <div className="px-3 py-2 text-sm text-gray-400">No ski areas found</div>
        ) : (
          <div className="px-3 py-2 text-sm text-gray-400">Type to search 4,600+ ski areas</div>
        )}
      </div>
    </div>
  );
}
