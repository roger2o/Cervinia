import { useState, useEffect, useCallback } from 'react';
import type { HistoryEntry } from '../types/history';
import type { RouteResult } from '../types/route';
import { addHistoryEntry, getHistory, deleteHistoryEntry } from '../services/cacheManager';

export function useHistory(areaId: string) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const refresh = useCallback(async () => {
    const all = await getHistory();
    setEntries(all);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markDone = useCallback(
    async (route: RouteResult) => {
      if (route.steps.length === 0) return;

      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        areaId,
        fromName: route.steps[0].fromNode.name,
        toName: route.steps[route.steps.length - 1].toNode.name,
        totalDistance: route.totalDistance,
        skiingDistance: route.skiingDistance,
        verticalDrop: route.verticalDrop,
        totalDuration: route.totalDuration,
        maxDifficulty: route.maxDifficulty,
        stepCount: route.steps.length,
        stepsSummary: route.steps.map((s) => s.edge.name).join(' → '),
      };
      await addHistoryEntry(entry);
      await refresh();
    },
    [areaId, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteHistoryEntry(id);
      await refresh();
    },
    [refresh],
  );

  return { entries, markDone, remove };
}
