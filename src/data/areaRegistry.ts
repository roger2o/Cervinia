import type { AreaConfig } from '../types/area';

export const builtInAreas: AreaConfig[] = [
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
    name: 'Pontedilegno-Tonale',
    bbox: { south: 46.22, west: 10.47, north: 46.30, east: 10.65 },
    center: [46.26, 10.56],
    subAreas: ['Ponte di Legno', 'Passo Tonale', 'Presena'],
    dataUrl: '/data/passo-tonale',
    defaultZoom: 14,
    tileZoomRange: [12, 16],
  },
];

/** Dynamic areas added at runtime (from Overpass search) */
const dynamicAreas = new Map<string, AreaConfig>();

export function registerDynamicArea(config: AreaConfig): void {
  dynamicAreas.set(config.id, config);
}

/** All areas: built-in + dynamic */
export function getAllAreas(): AreaConfig[] {
  return [...builtInAreas, ...dynamicAreas.values()];
}

/** Keep backward compat — `areas` is just the built-in list */
export const areas = builtInAreas;

export function getArea(id: string): AreaConfig | undefined {
  return builtInAreas.find((a) => a.id === id) ?? dynamicAreas.get(id);
}

export const DEFAULT_AREA = 'matterhorn';
