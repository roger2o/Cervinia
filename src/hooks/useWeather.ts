import { useState, useEffect, useCallback } from 'react';

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipitation: number;
  snowfall: number;
  windSpeed: number;
  windGusts: number;
}

export interface WeatherData {
  current: {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
    windGusts: number;
  };
  daily: DailyForecast[];
  fetchedAt: string;
  elevation: number;
}

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Heavy freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers',
  81: 'Showers',
  82: 'Heavy showers',
  85: 'Light snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
};

export function weatherLabel(code: number): string {
  return WEATHER_CODE_LABELS[code] ?? 'Unknown';
}

export function weatherIcon(code: number): string {
  if (code === 0) return '\u2600\uFE0F';       // sunny
  if (code <= 2) return '\u26C5';               // partly cloudy
  if (code === 3) return '\u2601\uFE0F';        // cloudy
  if (code <= 48) return '\uD83C\uDF2B\uFE0F';  // fog
  if (code <= 57) return '\uD83C\uDF27\uFE0F';  // drizzle
  if (code <= 67) return '\uD83C\uDF27\uFE0F';  // rain
  if (code <= 77) return '\u2744\uFE0F';         // snow
  if (code <= 82) return '\uD83C\uDF26\uFE0F';  // showers
  if (code <= 86) return '\uD83C\uDF28\uFE0F';  // snow showers
  return '\u26A1';                               // thunderstorm
}

export function useWeather(lat: number, lon: number) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        current: 'temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_speed_10m_max,wind_gusts_10m_max',
        timezone: 'auto',
        forecast_days: '7',
      });
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!res.ok) throw new Error('Weather API error');
      const data = await res.json();

      const daily: DailyForecast[] = data.daily.time.map((date: string, i: number) => ({
        date,
        tempMax: data.daily.temperature_2m_max[i],
        tempMin: data.daily.temperature_2m_min[i],
        weatherCode: data.daily.weather_code[i],
        precipitation: data.daily.precipitation_sum[i],
        snowfall: data.daily.snowfall_sum[i],
        windSpeed: data.daily.wind_speed_10m_max[i],
        windGusts: data.daily.wind_gusts_10m_max[i],
      }));

      setWeather({
        current: {
          temperature: data.current.temperature_2m,
          weatherCode: data.current.weather_code,
          windSpeed: data.current.wind_speed_10m,
          windGusts: data.current.wind_gusts_10m,
        },
        daily,
        fetchedAt: new Date().toISOString(),
        elevation: data.elevation,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return { weather, loading, error, refresh: fetchWeather };
}
