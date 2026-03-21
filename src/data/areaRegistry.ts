import type { AreaConfig } from '../types/area';

/** Dynamic areas registered at runtime (from search + Overpass fetch) */
const dynamicAreas = new Map<string, AreaConfig>();

export function registerDynamicArea(config: AreaConfig): void {
  dynamicAreas.set(config.id, config);
}

export function getArea(id: string): AreaConfig | undefined {
  return dynamicAreas.get(id);
}
