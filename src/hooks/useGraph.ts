import { useState, useEffect } from 'react';
import type { AdjacencyList, Graph } from '../types/graph';
import type { AreaMeta } from '../types/area';
import { buildAdjacencyList } from '../engine/graphLoader';
import { getCachedArea, cacheArea } from '../services/cacheManager';

interface GraphState {
  graph: Graph | null;
  adjacency: AdjacencyList | null;
  geo: GeoJSON.FeatureCollection | null;
  meta: AreaMeta | null;
  loading: boolean;
  error: string | null;
}

export function useGraph(areaId: string): GraphState {
  const [state, setState] = useState<GraphState>({
    graph: null,
    adjacency: null,
    geo: null,
    meta: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        // Try cache first
        const cached = await getCachedArea(areaId);
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

        // Fetch from network
        const [graphRes, geoRes, metaRes] = await Promise.all([
          fetch(`/data/${areaId}/graph.json`),
          fetch(`/data/${areaId}/geo.json`),
          fetch(`/data/${areaId}/meta.json`),
        ]);

        if (!graphRes.ok || !geoRes.ok || !metaRes.ok) {
          throw new Error('Failed to load area data');
        }

        const graph: Graph = await graphRes.json();
        const geo: GeoJSON.FeatureCollection = await geoRes.json();
        const meta: AreaMeta = await metaRes.json();

        // Cache for offline use
        await cacheArea(areaId, graph, geo, meta).catch(() => {
          // IndexedDB might not be available
        });

        if (!cancelled) {
          const adj = buildAdjacencyList(graph);
          setState({ graph, adjacency: adj, geo, meta, loading: false, error: null });
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
