import type { AdjacencyList } from '../types/graph';
import type { Difficulty } from '../types/graph';
import type { RouteResult, RouteStep } from '../types/route';
import { computeWeight } from './weights';

interface DijkstraEntry {
  nodeId: string;
  dist: number;
  prev: string | null;
  prevEdgeId: string | null;
}

export function findRoute(
  adj: AdjacencyList,
  fromId: string,
  toId: string,
  maxDifficulty: Difficulty,
  closedEdgeIds?: Set<string>,
  preferEasier?: boolean,
): RouteResult | null {
  if (!adj.nodes.has(fromId) || !adj.nodes.has(toId)) {
    return null;
  }

  if (fromId === toId) {
    return { steps: [], totalDistance: 0, skiingDistance: 0, totalDuration: 0, maxDifficulty: null, warnings: [] };
  }

  // Dijkstra's algorithm
  const dist = new Map<string, number>();
  const prev = new Map<string, { nodeId: string; edgeId: string } | null>();
  const visited = new Set<string>();

  // Priority queue (simple array-based for correctness; adequate for ski area graphs)
  const queue: DijkstraEntry[] = [];

  for (const nodeId of adj.nodes.keys()) {
    dist.set(nodeId, Infinity);
    prev.set(nodeId, null);
  }
  dist.set(fromId, 0);
  queue.push({ nodeId: fromId, dist: 0, prev: null, prevEdgeId: null });

  while (queue.length > 0) {
    // Find min-distance unvisited node
    queue.sort((a, b) => a.dist - b.dist);
    const current = queue.shift()!;

    if (visited.has(current.nodeId)) continue;
    visited.add(current.nodeId);

    if (current.nodeId === toId) break;

    const edges = adj.edges.get(current.nodeId) || [];
    for (const edge of edges) {
      if (visited.has(edge.to)) continue;

      const { weight } = computeWeight(edge, maxDifficulty, closedEdgeIds, preferEasier);
      const newDist = (dist.get(current.nodeId) ?? Infinity) + weight;

      if (newDist < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, newDist);
        prev.set(edge.to, { nodeId: current.nodeId, edgeId: edge.id });
        queue.push({ nodeId: edge.to, dist: newDist, prev: current.nodeId, prevEdgeId: edge.id });
      }
    }
  }

  // Reconstruct path
  if (dist.get(toId) === Infinity) {
    return null; // No route found
  }

  const path: { nodeId: string; edgeId: string }[] = [];
  let current = toId;
  while (current !== fromId) {
    const prevEntry = prev.get(current);
    if (!prevEntry) return null;
    path.unshift({ nodeId: prevEntry.nodeId, edgeId: prevEntry.edgeId });
    current = prevEntry.nodeId;
  }

  // Build steps
  const steps: RouteStep[] = [];
  const warnings: string[] = [];
  let totalDistance = 0;
  let skiingDistance = 0;
  let totalDuration = 0;
  let maxDiff: Difficulty | null = null;

  const edgeMap = new Map(
    Array.from(adj.edges.values())
      .flat()
      .map((e) => [e.id, e]),
  );

  const diffRank: Record<string, number> = { blue: 1, red: 2, black: 3 };

  for (const segment of path) {
    const edge = edgeMap.get(segment.edgeId)!;
    const fromNode = adj.nodes.get(edge.from)!;
    const toNode = adj.nodes.get(edge.to)!;

    const { warning } = computeWeight(edge, maxDifficulty, closedEdgeIds, preferEasier);
    if (warning) warnings.push(warning);

    let instruction: string;
    if (edge.type === 'lift') {
      instruction = `Take ${edge.liftType?.replace('_', ' ') || 'lift'} "${edge.name}" to ${toNode.name}`;
    } else {
      const diffLabel = edge.difficulty ? ` (${edge.difficulty})` : '';
      instruction = `Ski down "${edge.name}"${diffLabel} to ${toNode.name}`;
    }

    steps.push({ edge, fromNode, toNode, instruction });
    totalDistance += edge.distance;
    if (edge.type === 'piste') {
      skiingDistance += edge.distance;
    }
    totalDuration += edge.duration;

    if (edge.difficulty) {
      if (!maxDiff || diffRank[edge.difficulty] > diffRank[maxDiff]) {
        maxDiff = edge.difficulty;
      }
    }
  }

  return {
    steps,
    totalDistance,
    skiingDistance,
    totalDuration,
    maxDifficulty: maxDiff,
    warnings,
  };
}
