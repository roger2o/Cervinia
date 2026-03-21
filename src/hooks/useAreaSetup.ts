import { useState, useCallback } from 'react';
import { searchSkiAreas, fetchArea, type SkiAreaResult, type FetchProgress } from '../engine/overpassFetcher';
import { buildGraph, type BuildProgress } from '../engine/graphBuilder';
import { cacheArea } from '../services/cacheManager';
import type { Graph } from '../types/graph';
import type { AreaMeta } from '../types/area';

export interface SetupProgress {
  stage: 'idle' | 'searching' | 'fetching' | 'building' | 'caching' | 'done' | 'error';
  message: string;
}

export interface AreaSetupResult {
  searchResults: SkiAreaResult[];
  progress: SetupProgress;
  searching: boolean;
  loading: boolean;
  search: (query: string) => Promise<void>;
  setup: (area: SkiAreaResult) => Promise<{ graph: Graph; geo: GeoJSON.FeatureCollection; meta: AreaMeta } | null>;
}

export function useAreaSetup(): AreaSetupResult {
  const [searchResults, setSearchResults] = useState<SkiAreaResult[]>([]);
  const [progress, setProgress] = useState<SetupProgress>({ stage: 'idle', message: '' });
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    setProgress({ stage: 'searching', message: `Searching for "${query}"...` });
    try {
      const results = await searchSkiAreas(query, (p: FetchProgress) => {
        setProgress({ stage: 'searching', message: p.message });
      });
      setSearchResults(results);
      setProgress({
        stage: results.length > 0 ? 'idle' : 'idle',
        message: results.length > 0 ? `Found ${results.length} ski areas` : 'No ski areas found',
      });
    } catch (err) {
      setProgress({
        stage: 'error',
        message: err instanceof Error ? err.message : 'Search failed',
      });
    } finally {
      setSearching(false);
    }
  }, []);

  const setup = useCallback(async (area: SkiAreaResult) => {
    setLoading(true);
    try {
      setProgress({ stage: 'fetching', message: 'Fetching pistes and lifts...' });
      const rawData = await fetchArea(area.id, area.bbox, (p: FetchProgress) => {
        setProgress({ stage: 'fetching', message: p.message });
      });

      if (rawData.pistes.length === 0 && rawData.lifts.length === 0) {
        setProgress({ stage: 'error', message: 'No ski data found in this area' });
        return null;
      }

      // Build graph
      setProgress({ stage: 'building', message: 'Building routing graph...' });
      const result = await buildGraph(rawData, area.name, [], 200, (p: BuildProgress) => {
        setProgress({ stage: 'building', message: p.message });
      });

      // Cache for offline use
      setProgress({ stage: 'caching', message: 'Caching for offline use...' });
      await cacheArea(area.id, result.graph, result.geo, result.meta);

      setProgress({ stage: 'done', message: 'Ready!' });
      return result;
    } catch (err) {
      setProgress({
        stage: 'error',
        message: err instanceof Error ? err.message : 'Setup failed',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { searchResults, progress, searching, loading, search, setup };
}
