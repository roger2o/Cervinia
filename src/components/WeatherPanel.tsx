import type { WeatherData } from '../hooks/useWeather';
import { weatherIcon, weatherLabel } from '../hooks/useWeather';

interface WeatherPanelProps {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onClose: () => void;
}

function formatDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function WeatherPanel({ weather, loading, error, onRefresh, onClose }: WeatherPanelProps) {
  return (
    <div>
      <div className="px-4 py-3 bg-blue-800 text-white flex items-center justify-between">
        <div className="text-sm font-bold">Weather Forecast</div>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
          >
            Close
          </button>
        </div>
      </div>

      {loading && !weather && (
        <div className="px-4 py-3 text-sm text-gray-500">Loading weather...</div>
      )}

      {error && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50">{error}</div>
      )}

      {weather && (
        <div className="max-h-80 overflow-y-auto">
          {/* Current conditions */}
          <div className="px-4 py-3 bg-[#E0F0FF] border-b border-[#B8D8F8]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-blue-900">
                  {weatherIcon(weather.current.weatherCode)} {Math.round(weather.current.temperature)}°C
                </div>
                <div className="text-xs text-blue-700">
                  {weatherLabel(weather.current.weatherCode)}
                </div>
              </div>
              <div className="text-right text-xs text-blue-600">
                <div>Wind: {Math.round(weather.current.windSpeed)} km/h</div>
                <div>Gusts: {Math.round(weather.current.windGusts)} km/h</div>
                <div className="text-[10px] text-gray-400 mt-1">
                  {Math.round(weather.elevation)}m elevation
                </div>
              </div>
            </div>
          </div>

          {/* 7-day forecast */}
          {weather.daily.map((day) => (
            <div
              key={day.date}
              className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3"
            >
              <div className="text-lg w-8 text-center">{weatherIcon(day.weatherCode)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{formatDay(day.date)}</div>
                <div className="text-xs text-gray-400">
                  {weatherLabel(day.weatherCode)}
                </div>
              </div>
              <div className="text-right text-xs flex-shrink-0">
                <div className="font-medium">
                  {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
                </div>
                {day.snowfall > 0 && (
                  <div className="text-blue-600">{day.snowfall.toFixed(1)} cm snow</div>
                )}
                {day.snowfall === 0 && day.precipitation > 0 && (
                  <div className="text-gray-400">{day.precipitation.toFixed(1)} mm</div>
                )}
                <div className="text-gray-400">
                  {Math.round(day.windSpeed)} km/h
                </div>
              </div>
            </div>
          ))}

          <div className="px-4 py-2 text-[10px] text-gray-400">
            Updated: {new Date(weather.fetchedAt).toLocaleTimeString()} | Source: Open-Meteo
          </div>
        </div>
      )}
    </div>
  );
}
