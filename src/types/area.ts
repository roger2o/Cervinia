export interface AreaConfig {
  id: string;
  name: string;
  bbox: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
  center: [number, number];
  subAreas: string[];
  dataUrl: string;
  defaultZoom: number;
  tileZoomRange: [number, number];
}

export interface AreaMeta {
  id: string;
  name: string;
  bbox: { south: number; west: number; north: number; east: number };
  center: [number, number];
  subAreas: string[];
  stats: {
    stations: number;
    lifts: number;
    pistes: number;
    bluePistes: number;
    redPistes: number;
    blackPistes: number;
  };
  fetchedAt: string;
  builtAt: string;
}
