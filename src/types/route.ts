import type { Difficulty, GraphEdge, GraphNode } from './graph';

export interface RouteStep {
  edge: GraphEdge;
  fromNode: GraphNode;
  toNode: GraphNode;
  instruction: string;
}

export interface RouteResult {
  steps: RouteStep[];
  totalDistance: number;
  skiingDistance: number;
  verticalDrop: number;
  totalDuration: number;
  maxDifficulty: Difficulty | null;
  warnings: string[];
}

export interface RouteRequest {
  fromId: string;
  toId: string;
  maxDifficulty: Difficulty;
}
