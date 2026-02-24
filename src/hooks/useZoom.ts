import { useState } from 'react';
import { useMapEvents } from 'react-leaflet';

export function useZoom(): number {
  const [zoom, setZoom] = useState(() => 0);

  useMapEvents({
    zoomend: (e) => setZoom(e.target.getZoom()),
    load: (e) => setZoom(e.target.getZoom()),
  });

  return zoom;
}
