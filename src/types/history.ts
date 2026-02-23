import type { Difficulty } from './graph';

export interface HistoryEntry {
  id: string;
  timestamp: string;
  areaId: string;
  fromName: string;
  toName: string;
  totalDistance: number;
  skiingDistance: number;
  totalDuration: number;
  maxDifficulty: Difficulty | null;
  stepCount: number;
  stepsSummary: string;
}
