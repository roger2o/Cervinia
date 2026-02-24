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
  {
    id: 'passo-tonale',
    name: 'Passo Tonale',
    bbox: { south: 46.22, west: 10.50, north: 46.30, east: 10.65 },
    center: [46.26, 10.58],
    subAreas: ['Passo Tonale', 'Presena', 'Ponte di Legno'],
    dataUrl: '/data/passo-tonale',
    defaultZoom: 14,
    tileZoomRange: [12, 16],
  },
];

export function getArea(id: string): AreaConfig | undefined {
  return areas.find((a) => a.id === id);
}

export const DEFAULT_AREA = 'matterhorn';
