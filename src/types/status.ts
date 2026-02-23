export interface PisteStatus {
  id: string;
  name: string;
  status: 'open' | 'closed' | 'unknown';
}

export interface StatusData {
  areaId: string;
  fetchedAt: string;
  lifts: PisteStatus[];
  pistes: PisteStatus[];
}
