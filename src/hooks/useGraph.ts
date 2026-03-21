import { useState, useEffect } from 'react';
import type { AdjacencyList, Graph } from '../types/graph';
import type { AreaMeta } from '../types/area';
import { buildAdjacencyList } from '../engine/graphLoader';
import { getCachedArea } from '../services/cacheManager';

interface GraphState {
  graph: Graph | null;
  adjacency: AdjacencyList | null;
  geo: GeoJSON.FeatureCollection | null;
  meta: AreaMeta | null;
  loading: boolean;
  error: string | null;
}

const EMPTY_STATE: GraphState = {
  graph: null,
  adjacency: null,
  geo: null,
  meta: null,
  loading: false,
  error: null,
};

export function useGraph(areaId: string | null): GraphState {
  const [state, setState] = useState<GraphState>(EMPTY_STATE);

  useEffect(() => {
    if (!areaId) {
      setState(EMPTY_STATE);
      return;
    }

    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const cached = await getCachedArea(areaId!);
        if (cached && !cancelled) {
          const adj = buildAdjacencyList(cached.graph);
          setState({
            graph: cached.graph,
            adjacency: adj,
            geo: cached.geo,
            meta: cached.meta,
            loading: false,
            error: null,
          });
          return;
        }

        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: 'No data for this area. Search and select a ski area to load it.',
          }));
        }
      } catch (err) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          }));
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [areaId]);

  return state;
}
