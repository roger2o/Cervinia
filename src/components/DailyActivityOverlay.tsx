import { Polyline, CircleMarker } from 'react-leaflet';
import type { TrackSegment, TrackPoint } from '../hooks/useDailyActivity';

interface DailyActivityOverlayProps {
  segments: TrackSegment[];
  track: TrackPoint[];
  replayPlaying: boolean;
  replayIndex: number;
}

export function DailyActivityOverlay({
  segments,
  track,
  replayPlaying,
  replayIndex,
}: DailyActivityOverlayProps) {
  const replayPoint = replayPlaying && track.length > 0 && replayIndex < track.length
    ? track[replayIndex]
    : null;

  return (
    <>
      {segments.map((seg, i) => (
        <Polyline
          key={i}
          positions={seg.points}
          pathOptions={
            seg.type === 'lift'
              ? { color: '#6b7280', weight: 3, dashArray: '8 6', opacity: 0.8 }
              : { color: '#3b82f6', weight: 3, opacity: 0.9 }
          }
        />
      ))}
      {replayPoint && (
        <CircleMarker
          center={[replayPoint.lat, replayPoint.lon]}
          radius={8}
          pathOptions={{
            fillColor: '#f59e0b',
            fillOpacity: 1,
            color: '#ffffff',
            weight: 3,
          }}
        />
      )}
    </>
  );
}
