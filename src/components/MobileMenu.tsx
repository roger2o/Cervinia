import { useState, useRef, useEffect } from 'react';
import { AreaSwitcher } from './AreaSwitcher';
import { HistoryPanel } from './HistoryPanel';
import { WeatherPanel } from './WeatherPanel';
import type { HistoryEntry } from '../types/history';
import type { StatusData } from '../types/status';
import type { WeatherData } from '../hooks/useWeather';

type MenuView = 'menu' | 'history' | 'status' | 'site' | 'weather';

interface MobileMenuProps {
  areaId: string;
  onAreaSwitch: (areaId: string) => void;
  cachedAreaId: string | null;
  historyEntries: HistoryEntry[];
  onDeleteHistory: (id: string) => void;
  status: StatusData | null;
  onRefreshStatus: () => void;
  weather: WeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;
  onRefreshWeather: () => void;
  checkOnline: () => boolean;
}

export function MobileMenu({
  areaId,
  onAreaSwitch,
  cachedAreaId,
  historyEntries,
  onDeleteHistory,
  status,
  onRefreshStatus,
  weather,
  weatherLoading,
  weatherError,
  onRefreshWeather,
  checkOnline,
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

  const close = () => {
    setOpen(false);
    setView('menu');
  };

  const openLifts = status ? status.lifts.filter((l) => l.status === 'open').length : 0;
  const totalLifts = status ? status.lifts.length : 0;
  const openPistes = status ? status.pistes.filter((p) => p.status === 'open').length : 0;
  const totalPistes = status ? status.pistes.length : 0;

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
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-[10000] overflow-hidden">
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
                onClick={() => setView('status')}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between border-b border-gray-100"
              >
                <span className="font-medium">P&L Status</span>
                {status && (totalLifts > 0 || totalPistes > 0) ? (
                  <span className="text-xs text-gray-400">
                    {openLifts}/{totalLifts} lifts, {openPistes}/{totalPistes} pistes
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">
                    {status ? 'All open' : 'Loading...'}
                  </span>
                )}
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
                onClick={() => setView('site')}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between"
              >
                <span className="font-medium">Ski Site</span>
                <span className="text-xs text-gray-400 truncate ml-2">{areaId}</span>
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

          {view === 'status' && (
            <div>
              <div className="px-4 py-3 bg-blue-800 text-white flex items-center justify-between">
                <div className="text-sm font-bold">P&L Status</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { if (checkOnline()) onRefreshStatus(); }}
                    className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={close}
                    className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
                  >
                    Close
                  </button>
                </div>
              </div>
              {status ? (
                <div className="max-h-64 overflow-y-auto">
                  <div className="px-4 py-2 text-[10px] text-gray-400">
                    Updated: {new Date(status.fetchedAt).toLocaleString()}
                  </div>
                  {status.lifts.length === 0 && status.pistes.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      All pistes and lifts are open.
                    </div>
                  )}
                  {status.lifts.length > 0 && (
                    <>
                      <div className="px-4 py-1 text-xs font-bold text-gray-400 bg-gray-50">Lifts</div>
                      {status.lifts.map((l) => (
                        <div key={l.id} className="px-4 py-1.5 text-sm flex items-center justify-between border-b border-gray-50">
                          <span>{l.name}</span>
                          <span className={`text-xs font-medium ${l.status === 'open' ? 'text-green-600' : l.status === 'closed' ? 'text-red-600' : 'text-gray-400'}`}>
                            {l.status}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                  {status.pistes.length > 0 && (
                    <>
                      <div className="px-4 py-1 text-xs font-bold text-gray-400 bg-gray-50">Pistes</div>
                      {status.pistes.map((p) => (
                        <div key={p.id} className="px-4 py-1.5 text-sm flex items-center justify-between border-b border-gray-50">
                          <span>{p.name}</span>
                          <span className={`text-xs font-medium ${p.status === 'open' ? 'text-green-600' : p.status === 'closed' ? 'text-red-600' : 'text-gray-400'}`}>
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">Loading status...</div>
              )}
            </div>
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
                  currentAreaId={areaId}
                  onSwitch={(id) => {
                    onAreaSwitch(id);
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
