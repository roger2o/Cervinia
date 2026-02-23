import { useState, useEffect, useCallback } from 'react';
import { getCachedAreaId, clearCache } from '../services/cacheManager';

interface AreaCacheState {
  cachedAreaId: string | null;
  loading: boolean;
}

export function useAreaCache() {
  const [state, setState] = useState<AreaCacheState>({
    cachedAreaId: null,
    loading: true,
  });

  useEffect(() => {
    getCachedAreaId().then((id) => {
      setState({ cachedAreaId: id, loading: false });
    });
  }, []);

  const switchArea = useCallback(async (newAreaId: string) => {
    await clearCache();
    setState({ cachedAreaId: newAreaId, loading: false });
  }, []);

  return { ...state, switchArea };
}
