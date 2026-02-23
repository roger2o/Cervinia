import type { Difficulty, GraphEdge } from '../types/graph';

const DIFFICULTY_RANK: Record<Difficulty, number> = {
  blue: 1,
  red: 2,
  black: 3,
};

const CLOSED_PENALTY = 10000;

export interface WeightResult {
  weight: number;
  warning: string | null;
}

export function computeWeight(
  edge: GraphEdge,
  maxDifficulty: Difficulty,
  closedEdgeIds?: Set<string>,
  preferEasier?: boolean,
): WeightResult {
  if (edge.type === 'lift') {
    let weight = edge.duration;
    if (closedEdgeIds?.has(edge.id)) {
      return { weight: weight * CLOSED_PENALTY, warning: `${edge.name} is currently closed` };
    }
    return { weight, warning: null };
  }

  // Piste: base weight is duration
  let weight = edge.duration;
  let warning: string | null = null;

  // Check closed status first
  if (closedEdgeIds?.has(edge.id)) {
    weight *= CLOSED_PENALTY;
    warning = `${edge.name} is currently closed`;
  }

  const edgeDifficulty = edge.difficulty;
  if (!edgeDifficulty) {
    return { weight, warning };
  }

  const edgeRank = DIFFICULTY_RANK[edgeDifficulty];
  const maxRank = DIFFICULTY_RANK[maxDifficulty];

  if (edgeRank > maxRank) {
    // Harder than max: impassable (strict mode)
    return { weight: Infinity, warning: null };
  }

  if (preferEasier) {
    // Easy mode: bonus for runs below max difficulty, no bonus at max
    if (edgeRank < maxRank) {
      weight *= 0.5;
    }
  } else {
    // Normal mode: bonus for matching max difficulty
    if (edgeRank === maxRank) {
      weight *= 0.9;
    }
  }

  return { weight, warning };
}
