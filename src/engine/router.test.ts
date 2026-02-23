import { describe, it, expect } from 'vitest';
import { buildAdjacencyList } from './graphLoader';
import { findRoute } from './router';
import type { Graph } from '../types/graph';

function makeTestGraph(): Graph {
  return {
    nodes: [
      { id: 'A', name: 'Station A (top)', lat: 46.0, lon: 7.6, elevation: 3000 },
      { id: 'B', name: 'Station B (mid)', lat: 45.95, lon: 7.65, elevation: 2500 },
      { id: 'C', name: 'Station C (bottom)', lat: 45.9, lon: 7.7, elevation: 2000 },
      { id: 'D', name: 'Station D (alt mid)', lat: 45.96, lon: 7.62, elevation: 2600 },
    ],
    edges: [
      // Lift C -> A (bottom to top)
      { id: 'lift1', from: 'C', to: 'A', type: 'lift', name: 'Main Gondola', distance: 3000, duration: 8, difficulty: null },
      // Blue piste A -> B
      { id: 'piste1', from: 'A', to: 'B', type: 'piste', name: 'Easy Run', distance: 2000, duration: 4, difficulty: 'blue' },
      // Red piste A -> D
      { id: 'piste2', from: 'A', to: 'D', type: 'piste', name: 'Red Run', distance: 1500, duration: 2.5, difficulty: 'red' },
      // Black piste A -> C (direct)
      { id: 'piste3', from: 'A', to: 'C', type: 'piste', name: 'Black Diamond', distance: 2500, duration: 2, difficulty: 'black' },
      // Blue piste B -> C
      { id: 'piste4', from: 'B', to: 'C', type: 'piste', name: 'Blue Valley', distance: 1800, duration: 3.5, difficulty: 'blue' },
      // Red piste D -> C
      { id: 'piste5', from: 'D', to: 'C', type: 'piste', name: 'Red Valley', distance: 1600, duration: 2, difficulty: 'red' },
      // Lift B -> D
      { id: 'lift2', from: 'B', to: 'D', type: 'lift', name: 'Chair Lift', distance: 800, duration: 5, difficulty: null },
    ],
  };
}

describe('findRoute', () => {
  it('finds a simple direct path', () => {
    const graph = makeTestGraph();
    const adj = buildAdjacencyList(graph);
    const result = findRoute(adj, 'A', 'B', 'blue');

    expect(result).not.toBeNull();
    expect(result!.steps).toHaveLength(1);
    expect(result!.steps[0].edge.id).toBe('piste1');
    expect(result!.warnings).toHaveLength(0);
  });

  it('finds route from bottom to mid via lift then piste', () => {
    const graph = makeTestGraph();
    const adj = buildAdjacencyList(graph);
    const result = findRoute(adj, 'C', 'B', 'blue');

    expect(result).not.toBeNull();
    expect(result!.steps.length).toBeGreaterThanOrEqual(2);
    // Should take lift up then ski down
    expect(result!.steps[0].edge.type).toBe('lift');
  });

  it('avoids harder pistes when easier alternatives exist', () => {
    const graph = makeTestGraph();
    const adj = buildAdjacencyList(graph);

    // With blue preference, A->C should go via B (blue+blue) not direct black
    const result = findRoute(adj, 'A', 'C', 'blue');

    expect(result).not.toBeNull();
    expect(result!.warnings).toHaveLength(0);
    // Should not use the black piste
    const usedBlack = result!.steps.some((s) => s.edge.id === 'piste3');
    expect(usedBlack).toBe(false);
  });

  it('returns null when only harder pistes exist (strict difficulty)', () => {
    // Create graph where only a black piste connects two nodes
    const graph: Graph = {
      nodes: [
        { id: 'X', name: 'X', lat: 46.0, lon: 7.6, elevation: 3000 },
        { id: 'Y', name: 'Y', lat: 45.9, lon: 7.7, elevation: 2000 },
      ],
      edges: [
        { id: 'only_black', from: 'X', to: 'Y', type: 'piste', name: 'Only Black', distance: 2000, duration: 3, difficulty: 'black' },
      ],
    };
    const adj = buildAdjacencyList(graph);
    const result = findRoute(adj, 'X', 'Y', 'blue');

    // Strict mode: route is impossible at blue level
    expect(result).toBeNull();
  });

  it('returns null for unreachable destination', () => {
    const graph: Graph = {
      nodes: [
        { id: 'X', name: 'X', lat: 46.0, lon: 7.6, elevation: 3000 },
        { id: 'Y', name: 'Y', lat: 45.9, lon: 7.7, elevation: 2000 },
      ],
      edges: [],
    };
    const adj = buildAdjacencyList(graph);
    const result = findRoute(adj, 'X', 'Y', 'blue');

    expect(result).toBeNull();
  });

  it('returns empty route for same start and end', () => {
    const graph = makeTestGraph();
    const adj = buildAdjacencyList(graph);
    const result = findRoute(adj, 'A', 'A', 'blue');

    expect(result).not.toBeNull();
    expect(result!.steps).toHaveLength(0);
    expect(result!.totalDistance).toBe(0);
  });

  it('returns null for unknown node IDs', () => {
    const graph = makeTestGraph();
    const adj = buildAdjacencyList(graph);

    expect(findRoute(adj, 'UNKNOWN', 'A', 'blue')).toBeNull();
    expect(findRoute(adj, 'A', 'UNKNOWN', 'blue')).toBeNull();
  });

  it('generates correct step instructions', () => {
    const graph = makeTestGraph();
    const adj = buildAdjacencyList(graph);
    const result = findRoute(adj, 'C', 'B', 'blue');

    expect(result).not.toBeNull();
    for (const step of result!.steps) {
      if (step.edge.type === 'lift') {
        expect(step.instruction).toContain('Take');
      } else {
        expect(step.instruction).toContain('Ski down');
      }
    }
  });

  it('tracks max difficulty across route', () => {
    const graph = makeTestGraph();
    const adj = buildAdjacencyList(graph);

    // Route A -> D is a red piste
    const result = findRoute(adj, 'A', 'D', 'red');
    expect(result).not.toBeNull();
    expect(result!.maxDifficulty).toBe('red');
  });
});
