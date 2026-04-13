import { useState, useRef, useEffect, useCallback } from 'react';
import { AreaSwitcher } from './AreaSwitcher';
import { HistoryPanel } from './HistoryPanel';
import { SeasonSummary } from './SeasonSummary';
import { WeatherPanel } from './WeatherPanel';
import type { HistoryEntry } from '../types/history';
import type { WeatherData } from '../hooks/useWeather';
import type { AreaConfig } from '../types/area';
import { cacheTiles, countTiles, type TileCacheProgress } from '../services/tileCache';

type MenuView = 'menu' | 'history' | 'season' | 'site' | 'weather' | 'offline-map';

interface MobileMenuProps {
  areaId: string;
  area: AreaConfig | undefined;
  onDynamicArea: (areaId: string) => void;
  cachedAreaId: string | null;
  historyEntries: HistoryEntry[];
  onDeleteHistory: (id: string) => void;
  weather: WeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;
  onRefreshWeather: () => void;
  checkOnline: () => boolean;
  labelSize: number;
  onLabelSizeChange: (size: number) => void;
}

export function MobileMenu({
  areaId,
  area,
  onDynamicArea,
  cachedAreaId,
  historyEntries,
  onDeleteHistory,
  weather,
  weatherLoading,
  weatherError,
  onRefreshWeather,
  checkOnline,
  labelSize,
  onLabelSizeChange,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<MenuView>('menu');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setView('menu');
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  const [tileProgress, setTileProgress] = useState<TileCacheProgress | null>(null);
  const [tileDownloading, setTileDownloading] = useState(false);

  const close = () => {
    setOpen(false);
    setView('menu');
  };

  const tileCount = area ? countTiles(area.bbox, area.tileZoomRange[0], area.tileZoomRange[1]) : 0;

  const handleDownloadTiles = useCallback(async () => {
    if (!area || !checkOnline()) return;
    setTileDownloading(true);
    setTileProgress({ total: tileCount, cached: 0, failed: 0, done: false });
    try {
      await cacheTiles(
        area.bbox,
        area.tileZoomRange[0],
        area.tileZoomRange[1],
        setTileProgress,
      );
    } finally {
      setTileDownloading(false);
    }
  }, [area, tileCount, checkOnline]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          setView('menu');
        }}
        className="p-1.5 rounded hover:bg-gray-100"
        aria-label="Menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="5" x2="17" y2="5" />
          <line x1="3" y1="10" x2="17" y2="10" />
          <line x1="3" y1="15" x2="17" y2="15" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-snowflake border border-gray-200 rounded-xl shadow-xl z-[10000] overflow-hidden">
          {view === 'menu' && (
            <div>
              <button
                onClick={() => setView('history')}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between border-b border-gray-100"
              >
                <span className="font-medium">History</span>
                <span className="text-xs text-gray-400">{historyEntries.length} runs</span>
              </button>
              <button
                onClick={() => setView('season')}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between border-b border-gray-100"
              >
                <span className="font-medium">Season Summary</span>
                <span className="text-xs text-gray-400">{historyEntries.length} runs</span>
              </button>
              <button
                onClick={() => setView('weather')}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between border-b border-gray-100"
              >
                <span className="font-medium">Weather</span>
                {weather ? (
                  <span className="text-xs text-gray-400">
                    {Math.round(weather.current.temperature)}°C
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">
                    {weatherLoading ? 'Loading...' : '--'}
                  </span>
                )}
              </button>
              <button
                onClick={() => setView('offline-map')}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between border-b border-gray-100"
              >
                <span className="font-medium">Offline Map</span>
                <span className="text-xs text-gray-400">{tileCount} tiles</span>
              </button>
              <button
                onClick={() => setView('site')}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between border-b border-gray-100"
              >
                <span className="font-medium">Ski Site</span>
                <span className="text-xs text-gray-400 truncate ml-2">{areaId}</span>
              </button>
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Label Size</span>
                  <span className="text-xs text-gray-400">{labelSize}px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="24"
                  step="1"
                  value={labelSize}
                  onChange={(e) => onLabelSizeChange(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Small</span>
                  <span>Large</span>
                </div>
              </div>
              <button
                onClick={async () => {
                  const regs = await navigator.serviceWorker?.getRegistrations();
                  if (regs) {
                    for (const reg of regs) await reg.unregister();
                  }
                  const keys = await caches.keys();
                  for (const key of keys) await caches.delete(key);
                  window.location.reload();
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between text-red-600"
              >
                <span className="font-medium">Refresh App Data</span>
                <span className="text-xs text-gray-400">Clear cache</span>
              </button>
            </div>
          )}

          {view === 'history' && (
            <div>
              <HistoryPanel
                entries={historyEntries}
                onDelete={onDeleteHistory}
                onClose={close}
              />
            </div>
          )}

          {view === 'season' && (
            <SeasonSummary entries={historyEntries} onClose={close} />
          )}

          {view === 'weather' && (
            <WeatherPanel
              weather={weather}
              loading={weatherLoading}
              error={weatherError}
              onRefresh={() => { if (checkOnline()) onRefreshWeather(); }}
              onClose={close}
            />
          )}

          {view === 'offline-map' && (
            <div>
              <div className="px-4 py-3 bg-blue-800 text-white flex items-center justify-between">
                <div className="text-sm font-bold">Offline Map</div>
                <button
                  onClick={close}
                  className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
                >
                  Close
                </button>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-600">
                  Download map tiles for offline use. This caches {tileCount} tiles
                  (zoom levels {area?.tileZoomRange[0]}–{area?.tileZoomRange[1]}) for the current ski area.
                </p>
                {tileProgress && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{tileProgress.cached} / {tileProgress.total} tiles</span>
                      {tileProgress.failed > 0 && (
                        <span className="text-red-500">{tileProgress.failed} failed</span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.round((tileProgress.cached / tileProgress.total) * 100)}%` }}
                      />
                    </div>
                    {tileProgress.done && (
                      <div className="text-xs text-green-600 mt-1">
                        Download complete! Map available offline.
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={handleDownloadTiles}
                  disabled={tileDownloading}
                  className={`w-full py-2 rounded-lg text-sm font-medium ${
                    tileDownloading
                      ? 'bg-gray-200 text-gray-400'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {tileDownloading ? 'Downloading...' : 'Download Map Tiles'}
                </button>
              </div>
            </div>
          )}

          {view === 'site' && (
            <div>
              <div className="px-4 py-3 bg-blue-800 text-white flex items-center justify-between">
                <div className="text-sm font-bold">Ski Site</div>
                <button
                  onClick={close}
                  className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
                >
                  Close
                </button>
              </div>
              <div className="p-3">
                <AreaSwitcher
                  onDynamicArea={(area) => {
                    onDynamicArea(area.id);
                    close();
                  }}
                  cachedAreaId={cachedAreaId}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
