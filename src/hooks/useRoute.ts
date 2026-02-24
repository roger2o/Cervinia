import { useMemo } from 'react';
import type { AdjacencyList, Difficulty } from '../types/graph';
import type { RouteResult } from '../types/route';
import { findRoute } from '../engine/router';

const DIFF_RANK: Record<string, number> = { blue: 1, red: 2, black: 3 };

export function useRoute(
  adjacency: AdjacencyList | null,
  waypoints: string[],
  maxDifficulty: Difficulty,
  closedEdgeIds?: Set<string>,
  preferEasier?: boolean,
): { route: RouteResult | null; failedLeg: number | null } {
  return useMemo(() => {
    if (!adjacency || waypoints.length < 2) return { route: null, failedLeg: null };

    const allSteps: RouteResult['steps'] = [];
    let totalDistance = 0;
    let skiingDistance = 0;
    let verticalDrop = 0;
    let totalDuration = 0;
    let maxDiff: Difficulty | null = null;
    const allWarnings: string[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const leg = findRoute(adjacency, waypoints[i], waypoints[i + 1], maxDifficulty, closedEdgeIds, preferEasier);
      if (!leg) return { route: null, failedLeg: i };

      allSteps.push(...leg.steps);
      totalDistance += leg.totalDistance;
      skiingDistance += leg.skiingDistance;
      verticalDrop += leg.verticalDrop;
      totalDuration += leg.totalDuration;
      allWarnings.push(...leg.warnings);

      if (leg.maxDifficulty) {
        if (!maxDiff || DIFF_RANK[leg.maxDifficulty] > DIFF_RANK[maxDiff]) {
          maxDiff = leg.maxDifficulty;
        }
      }
    }

    return {
      route: {
        steps: allSteps,
        totalDistance,
        skiingDistance,
        verticalDrop,
        totalDuration,
        maxDifficulty: maxDiff,
        warnings: allWarnings,
      },
      failedLeg: null,
    };
  }, [adjacency, waypoints, maxDifficulty, closedEdgeIds, preferEasier]);
}
