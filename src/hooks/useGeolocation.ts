import { useState, useEffect, useCallback } from 'react';

export interface GeoPosition {
  lat: number;
  lon: number;
  altitude: number | null;
  accuracy: number;
  timestamp: number;
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [watching, setWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setWatching(true);
    setError(null);
  }, []);

  const stopWatching = useCallback(() => {
    setWatching(false);
  }, []);

  const toggle = useCallback(() => {
    if (watching) {
      stopWatching();
    } else {
      startWatching();
    }
  }, [watching, startWatching, stopWatching]);

  useEffect(() => {
    if (!watching || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          altitude: pos.coords.altitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [watching]);

  return { position, watching, error, toggle };
}
