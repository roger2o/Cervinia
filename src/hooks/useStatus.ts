import { useState, useEffect, useCallback } from 'react';
import type { StatusData } from '../types/status';
import { cacheStatus, getCachedStatus } from '../services/cacheManager';

export function useStatus(areaId: string) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/data/${areaId}/status.json`);
      if (res.ok) {
        const data: StatusData = await res.json();
        setStatus(data);
        await cacheStatus(data);
      } else {
        // Fallback to cache
        const cached = await getCachedStatus(areaId);
        if (cached) setStatus(cached);
      }
    } catch {
      // Offline: try cache
      const cached = await getCachedStatus(areaId);
      if (cached) setStatus(cached);
    } finally {
      setLoading(false);
    }
  }, [areaId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Build closedEdgeIds set
  const closedEdgeIds = new Set<string>();
  if (status) {
    for (const item of [...status.lifts, ...status.pistes]) {
      if (item.status === 'closed') {
        closedEdgeIds.add(item.id);
      }
    }
  }

  return { status, closedEdgeIds, loading, refresh: fetchStatus };
}
