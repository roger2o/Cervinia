import { useState, useEffect, useCallback, useRef } from 'react';

export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [bannerVisible, setBannerVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBanner = useCallback(() => {
    setBannerVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setBannerVisible(false);
    }, 2000);
  }, []);

  // Show banner when going offline
  useEffect(() => {
    const goOffline = () => {
      setIsOffline(true);
      showBanner();
    };
    const goOnline = () => {
      setIsOffline(false);
      setBannerVisible(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showBanner]);

  /** Call this before any online-required action. Returns true if offline (and shows banner). */
  const checkOnline = useCallback((): boolean => {
    if (!navigator.onLine) {
      showBanner();
      return false;
    }
    return true;
  }, [showBanner]);

  return { isOffline, bannerVisible, checkOnline };
}
