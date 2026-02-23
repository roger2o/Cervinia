export interface GraphNode {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevation: number;
  subArea?: string;
}

export type Difficulty = 'blue' | 'red' | 'black';

export type DifficultyPreference = 'blue' | 'easy-red' | 'red' | 'easy-black' | 'black';

export function resolvePreference(pref: DifficultyPreference): { maxDifficulty: Difficulty; preferEasier: boolean } {
  switch (pref) {
    case 'blue': return { maxDifficulty: 'blue', preferEasier: false };
    case 'easy-red': return { maxDifficulty: 'red', preferEasier: true };
    case 'red': return { maxDifficulty: 'red', preferEasier: false };
    case 'easy-black': return { maxDifficulty: 'black', preferEasier: true };
    case 'black': return { maxDifficulty: 'black', preferEasier: false };
  }
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: 'lift' | 'piste';
  liftType?: string;
  name: string;
  distance: number;
  duration: number;
  difficulty: Difficulty | null;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AdjacencyList {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge[]>; // nodeId -> outgoing edges
}
