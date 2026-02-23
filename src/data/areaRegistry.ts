import type { AreaConfig } from '../types/area';

export const areas: AreaConfig[] = [
  {
    id: 'matterhorn',
    name: 'Matterhorn Ski Paradise',
    bbox: { south: 45.88, west: 7.58, north: 46.05, east: 7.80 },
    center: [45.9369, 7.6292],
    subAreas: ['Cervinia', 'Valtournenche', 'Zermatt'],
    dataUrl: '/data/matterhorn',
    defaultZoom: 13,
    tileZoomRange: [11, 15],
  },
];

export function getArea(id: string): AreaConfig | undefined {
  return areas.find((a) => a.id === id);
}

export const DEFAULT_AREA = 'matterhorn';
