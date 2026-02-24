import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { GeoPosition } from './useGeolocation';

export interface TrackPoint {
  lat: number;
  lon: number;
  altitude: number | null;
  accuracy: number;
  timestamp: number;
  speed: number; // km/h
}

export interface TrackSegment {
  points: [number, number][]; // [lat, lon] pairs
  type: 'lift' | 'run';
}

export interface DailyActivityState {
  recording: boolean;
  track: TrackPoint[];
  maxSpeed: number;       // km/h
  totalDistance: number;   // meters
  showOnMap: boolean;
  segments: TrackSegment[];
  replayIndex: number;
  replayPlaying: boolean;
  replaySpeed: number;
}

function todayKey(): string {
  const d = new Date();
  return `daily-activity-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeSegments(track: TrackPoint[]): TrackSegment[] {
  if (track.length < 2) return [];

  const segments: TrackSegment[] = [];
  let currentType: 'lift' | 'run' = classifyPoint(track[0], track[1]);
  let currentPoints: [number, number][] = [[track[0].lat, track[0].lon]];

  for (let i = 1; i < track.length; i++) {
    const type = i < track.length - 1
      ? classifyPoint(track[i], track[i + 1])
      : currentType;

    if (type !== currentType) {
      // Add the boundary point to close the current segment
      currentPoints.push([track[i].lat, track[i].lon]);
      segments.push({ points: currentPoints, type: currentType });
      // Start new segment from this point
      currentType = type;
      currentPoints = [[track[i].lat, track[i].lon]];
    } else {
      currentPoints.push([track[i].lat, track[i].lon]);
    }
  }

  if (currentPoints.length >= 2) {
    segments.push({ points: currentPoints, type: currentType });
  }

  return segments;
}

function classifyPoint(a: TrackPoint, b: TrackPoint): 'lift' | 'run' {
  // Prefer altitude-based detection
  if (a.altitude != null && b.altitude != null) {
    const altDiff = b.altitude - a.altitude;
    if (altDiff > 1) return 'lift';
    if (altDiff < -1) return 'run';
  }
  // Fallback: speed threshold
  return b.speed < 12 ? 'lift' : 'run';
}

interface SavedData {
  track: TrackPoint[];
  maxSpeed: number;
  totalDistance: number;
}

function loadSaved(): SavedData | null {
  try {
    const raw = localStorage.getItem(todayKey());
    if (!raw) return null;
    return JSON.parse(raw) as SavedData;
  } catch {
    return null;
  }
}

function save(track: TrackPoint[], maxSpeed: number, totalDistance: number) {
  try {
    localStorage.setItem(todayKey(), JSON.stringify({ track, maxSpeed, totalDistance }));
  } catch {
    // localStorage full — ignore
  }
}

export function useDailyActivity(gpsPosition: GeoPosition | null, gpsActive: boolean) {
  const [recording, setRecording] = useState(false);
  const [track, setTrack] = useState<TrackPoint[]>([]);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [showOnMap, setShowOnMap] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);

  const lastPositionRef = useRef<GeoPosition | null>(null);
  const rafRef = useRef<number>(0);
  const replayStartRef = useRef<number>(0);
  const replayBaseIndexRef = useRef<number>(0);

  // Load saved data on mount
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      setTrack(saved.track);
      setMaxSpeed(saved.maxSpeed);
      setTotalDistance(saved.totalDistance);
    }
  }, []);

  // Record GPS points
  useEffect(() => {
    if (!recording || !gpsActive || !gpsPosition) return;

    const prev = lastPositionRef.current;
    lastPositionRef.current = gpsPosition;

    // Skip if same timestamp
    if (prev && prev.timestamp === gpsPosition.timestamp) return;

    let speed = 0;
    let dist = 0;
    if (prev) {
      dist = haversineDistance(prev.lat, prev.lon, gpsPosition.lat, gpsPosition.lon);
      const timeDelta = (gpsPosition.timestamp - prev.timestamp) / 1000; // seconds
      if (timeDelta > 0 && dist > 0) {
        speed = (dist / timeDelta) * 3.6; // m/s → km/h
      }
      // Filter out GPS noise: ignore points with very low movement and high inaccuracy
      if (dist < 2 && gpsPosition.accuracy > 20) return;
    }

    const point: TrackPoint = {
      lat: gpsPosition.lat,
      lon: gpsPosition.lon,
      altitude: gpsPosition.altitude,
      accuracy: gpsPosition.accuracy,
      timestamp: gpsPosition.timestamp,
      speed,
    };

    setTrack((prev) => {
      const next = [...prev, point];
      // Persist every 10 points to avoid excessive writes
      if (next.length % 10 === 0) {
        const newMax = Math.max(maxSpeed, speed);
        const newDist = totalDistance + dist;
        save(next, newMax, newDist);
      }
      return next;
    });

    if (speed > maxSpeed) {
      setMaxSpeed(speed);
    }
    if (dist > 0) {
      setTotalDistance((prev) => prev + dist);
    }
  }, [recording, gpsActive, gpsPosition]); // eslint-disable-line react-hooks/exhaustive-deps

  // Replay animation
  useEffect(() => {
    if (!replayPlaying || track.length < 2) return;

    replayStartRef.current = performance.now();
    replayBaseIndexRef.current = replayIndex;

    const animate = (now: number) => {
      const elapsed = now - replayStartRef.current;
      const baseIdx = replayBaseIndexRef.current;
      const baseTime = track[baseIdx].timestamp;

      // Find the point whose timestamp matches the elapsed scaled time
      const targetTime = baseTime + elapsed * replaySpeed;
      let idx = baseIdx;
      while (idx < track.length - 1 && track[idx + 1].timestamp <= targetTime) {
        idx++;
      }

      setReplayIndex(idx);

      if (idx >= track.length - 1) {
        setReplayPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [replayPlaying, replaySpeed]); // eslint-disable-line react-hooks/exhaustive-deps

  const segments = useMemo(() => computeSegments(track), [track]);

  const start = useCallback(() => {
    setRecording(true);
    lastPositionRef.current = gpsPosition;
  }, [gpsPosition]);

  const stop = useCallback(() => {
    setRecording(false);
    // Persist on stop
    save(track, maxSpeed, totalDistance);
  }, [track, maxSpeed, totalDistance]);

  const reset = useCallback(() => {
    setRecording(false);
    setTrack([]);
    setMaxSpeed(0);
    setTotalDistance(0);
    setReplayIndex(0);
    setReplayPlaying(false);
    lastPositionRef.current = null;
    try { localStorage.removeItem(todayKey()); } catch {}
  }, []);

  const startReplay = useCallback(() => {
    if (track.length < 2) return;
    setReplayIndex(0);
    setReplayPlaying(true);
    setShowOnMap(true);
  }, [track.length]);

  const stopReplay = useCallback(() => {
    setReplayPlaying(false);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const setReplaySpeedValue = useCallback((speed: number) => {
    setReplaySpeed(speed);
  }, []);

  const toggleShowOnMap = useCallback(() => {
    setShowOnMap((v) => !v);
  }, []);

  return {
    recording,
    track,
    maxSpeed,
    totalDistance,
    showOnMap,
    segments,
    replayIndex,
    replayPlaying,
    replaySpeed,
    start,
    stop,
    reset,
    startReplay,
    stopReplay,
    setReplaySpeed: setReplaySpeedValue,
    toggleShowOnMap,
  };
}
