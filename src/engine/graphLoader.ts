import type { AdjacencyList, Graph, GraphEdge } from '../types/graph';

export function buildAdjacencyList(graph: Graph): AdjacencyList {
  const nodes = new Map(graph.nodes.map((n) => [n.id, n]));
  const edges = new Map<string, GraphEdge[]>();

  // Initialize empty edge lists for all nodes
  for (const node of graph.nodes) {
    edges.set(node.id, []);
  }

  // Add edges to adjacency list
  for (const edge of graph.edges) {
    const list = edges.get(edge.from);
    if (list) {
      list.push(edge);
    }
  }

  return { nodes, edges };
}

export async function loadGraph(areaId: string): Promise<Graph> {
  const response = await fetch(`/data/${areaId}/graph.json`);
  if (!response.ok) {
    throw new Error(`Failed to load graph for ${areaId}: ${response.statusText}`);
  }
  return response.json();
}
