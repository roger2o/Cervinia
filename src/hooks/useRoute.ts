import { useMemo } from 'react';
import type { AdjacencyList, Difficulty } from '../types/graph';
import type { RouteResult } from '../types/route';
import { findRoute } from '../engine/router';

export function useRoute(
  adjacency: AdjacencyList | null,
  fromId: string | null,
  toId: string | null,
  maxDifficulty: Difficulty,
  closedEdgeIds?: Set<string>,
  preferEasier?: boolean,
): RouteResult | null {
  return useMemo(() => {
    if (!adjacency || !fromId || !toId) return null;
    return findRoute(adjacency, fromId, toId, maxDifficulty, closedEdgeIds, preferEasier);
  }, [adjacency, fromId, toId, maxDifficulty, closedEdgeIds, preferEasier]);
}
